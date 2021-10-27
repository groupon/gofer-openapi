import YAML from 'yaml';
import SwaggerParser from '@apidevtools/swagger-parser';
import generate from '@babel/generator';
import t from '@babel/types';
import Debug from 'debug';
import type { OpenAPIV3 } from 'openapi-types';

import buildResponseType from './response-type';
import parseParameters from './parse-parameters';

const debug = Debug('gofer:openapi');

const DEFAULT_PARSE_OPTIONS = {
  resolve: {
    external: false,
  },
  validate: {
    schema: false,
    spec: false,
  },
};

function generateEndpoints({ paths, components = {} }: OpenAPIV3.Document) {
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
      ([method, { operationId, parameters, responses }]: [
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

        if (parameters) {
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
          t.identifier(operationId),
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

        const responseType = buildResponseType(responses);

        return Object.assign(classMethod, {
          returnType: t.typeAnnotation(responseType),
        });
      }
    );
  });
}

export async function goferFromOpenAPI(classTemplate: string, openAPI: any) {
  const spec = (
    typeof openAPI === 'string' ? YAML.parse(openAPI) : openAPI
  ) as OpenAPIV3.Document;
  if (!(spec.openapi || '').startsWith('3.')) {
    throw new Error('Only OpenAPI 3.x supported at the moment');
  }
  const api = (await SwaggerParser.validate(
    spec,
    DEFAULT_PARSE_OPTIONS
  )) as OpenAPIV3.Document;
  const endpoints = generateEndpoints(api);
  const endpointsJS = generate(t.classBody(endpoints)).code.replace(
    /^\s*\{\s*|\s*\}\s*$/g,
    ''
  );
  return classTemplate.replace('__OPENAPI_ENDPOINTS__', endpointsJS);
}
