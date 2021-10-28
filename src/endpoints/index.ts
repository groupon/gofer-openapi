import * as t from '@babel/types';
import Debug from 'debug';
import type { OpenAPIV3 } from 'openapi-types';
import camelCase from 'lodash.camelcase';

import buildResponseType from './response-type';
import parseParameters from './parse-parameters';
import { resolveMaybeRef } from '../refs';

const debug = Debug('gofer:openapi');

export default function generateEndpoints({
  paths,
  components = {},
}: OpenAPIV3.Document) {
  if (!paths) throw new Error('No paths!');

  const seenOpIds: Set<string> = new Set();
  return Object.entries(paths).flatMap(([path, pathItem]) => {
    // separate the cruft from the real HTTP methods
    const {
      $ref,
      summary,
      description,
      parameters: pathParameters,
      servers,
      ...methods
    } = pathItem || {};
    if ($ref) {
      throw new Error(`paths-level $ref for ${path} not supported`);
    }

    return Object.entries(methods).flatMap(
      ([method, { operationId, parameters = [], responses, requestBody }]: [
        string,
        OpenAPIV3.OperationObject
      ]) => {
        if (!operationId) return [];
        if (seenOpIds.has(operationId)) {
          debug(`Skipping duplicate operationId: ${operationId}`);
          return [];
        }
        seenOpIds.add(operationId);

        const fetchOpts = [
          t.objectProperty(
            t.identifier('endpointName'),
            t.stringLiteral(operationId)
          ),
        ];

        // opId()
        const methodArgs: (t.Identifier | t.AssignmentPattern)[] = [];
        // this.get('/path', { endpointName: opId })
        const fetchArgs = [
          t.stringLiteral(path),
          t.objectExpression(fetchOpts),
        ];

        if (requestBody) {
          const jsonReqBodySchema = resolveMaybeRef(requestBody, components)
            .content?.['application/json']?.schema;
          if (jsonReqBodySchema) {
            // TODO: something nicer than just "body" as opt
            parameters.push({
              name: 'body',
              in: 'body',
              schema: jsonReqBodySchema,
              required: true,
            });
          } else {
            // TODO: handle application/octet-stream for file uploads
            debug(`Skipping unhandled requestBody for ${operationId}`);
          }
        }

        if (pathParameters || parameters) {
          const [paramMethodArgs, paramFetchOpts] = parseParameters(
            [...(pathParameters || []), ...parameters],
            components
          );
          // opId({ ... }) {
          methodArgs.push(...paramMethodArgs);
          // this.get('/path', { ... })
          fetchOpts.push(...paramFetchOpts);
        }

        const classMethod = t.classMethod(
          'method',
          t.identifier(camelCase(operationId)),
          methodArgs,
          t.blockStatement([
            // return this.get('/foo', { ... }).json();
            t.returnStatement(
              // this.get(...).json()
              t.callExpression(
                // this.get(...).json
                t.memberExpression(
                  // this.get(...)
                  t.callExpression(
                    // this.get
                    t.memberExpression(
                      t.thisExpression(),
                      t.identifier(method.toLowerCase())
                    ),
                    fetchArgs
                  ),
                  t.identifier('json')
                ),
                []
              )
            ),
          ])
        );

        const responseType = buildResponseType(responses, components);

        return Object.assign(classMethod, {
          returnType: t.typeAnnotation(responseType),
        });
      }
    );
  });
}
