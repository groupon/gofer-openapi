/*
 * Copyright (c) 2021, Groupon, Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software
 *    without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */
import * as t from '@babel/types';
import Debug from 'debug';
import type { OpenAPIV3 } from 'openapi-types';
import camelCase from 'lodash.camelcase';

import buildResponseType from './response-type';
import parseParameters from './parse-parameters';
import { resolveMaybeRef } from '../refs';

const debug = Debug('gofer:openapi:endpoints');

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
      ([
        method,
        { operationId, parameters = [], responses = {}, requestBody },
      ]: [string, OpenAPIV3.OperationObject]) => {
        if (!operationId) operationId = generateOperationId(method, path);
        debug(`Op [${operationId || '???'}] ${method} ${path}`);

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

function generateOperationId(method: string, path: string) {
  return camelCase(method + path);
}
