'use strict';

const YAML = require('yaml');
const SwaggerParser = require('@apidevtools/swagger-parser');
const { default: generate } = require('@babel/generator');
const t = require('@babel/types');
const debug = require('debug')('gofer:openapi');

const buildResponseType = require('./response-type');
const parseParameters = require('./parse-parameters');

/**
 * @typedef {import('openapi-types').OpenAPIV3.Document} Document
 * @typedef {import('openapi-types').OpenAPIV3.ParameterObject} ParameterObject
 * @typedef {import('openapi-types').OpenAPIV3.OperationObject} OperationObject
 */

const DEFAULT_PARSE_OPTIONS = {
  resolve: {
    external: false,
  },
  validate: {
    schema: false,
    spec: false,
  },
};

/** @param {Document} api */
function generateEndpoints({ paths, components = {} }) {
  if (!paths) throw new Error('No paths!');

  /** @type {Set<string>} */
  const seenOpIds = new Set();
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
      /** @param {[string, OperationObject]} entry */
      ([method, { operationId, parameters, responses }]) => {
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

        // opId() {
        /** @type {(t.Identifier | t.AssignmentPattern)[]} */
        const methodArgs = [];
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

/**
 * @param {string} classTemplate
 * @param {string | unknown} openAPI
 */
async function goferFromOpenAPI(classTemplate, openAPI) {
  const spec = typeof openAPI === 'string' ? YAML.parse(openAPI) : openAPI;
  const api = await SwaggerParser.validate(spec, DEFAULT_PARSE_OPTIONS);
  const endpoints = generateEndpoints(api);
  const endpointsJS = generate(t.classBody(endpoints)).code.replace(
    /^\s*\{\s*|\s*\}\s*$/g,
    ''
  );
  return classTemplate.replace('__OPENAPI_ENDPOINTS__', endpointsJS);
}
exports.goferFromOpenAPI = goferFromOpenAPI;
