'use strict';

const t = require('@babel/types');
const debug = require('debug')('gofer:openapi:parse-parameters');

const { resolveRef } = require('./refs');
const { schemaToAnnotation } = require('./schema');

/**
 * @typedef {import('openapi-types').OpenAPIV3.ComponentsObject} ComponentsObject
 * @typedef {import('openapi-types').OpenAPIV3.ParameterObject} ParameterObject
 * @typedef {import('openapi-types').OpenAPIV3.ReferenceObject} ReferenceObject
 */

/**
 * Given parameters like:
 * [
 *   { name: 'foo', in: 'query', required: false, schema: { type: 'string' } }
 *   ...
 * ]
 *
 * returns a tuple of the arguments array to the endpoint method,
 * and the properties which will be included in the fetch call,
 * which will result in code like:
 *
 *                  v opts type
 * someMethod(opts: { foo?: string } = {}) {
 *   return this.get('/path/to/some', { qs: { foo: opts.foo } }).json();
 *                                      ^ properties
 * }
 *
 * @param {(ReferenceObject | ParameterObject)[]} parameters
 * @param {ComponentsObject} components
 * @returns {[(t.AssignmentPattern | t.Identifier)[], t.ObjectProperty[]]}
 */
function parseParameters(parameters, components) {
  /** @type {Record<'qs' | 'pathParams' | 'headers', string[]>} */
  const params = {
    qs: [],
    pathParams: [],
    headers: [],
  };

  /** @type {t.ObjectTypeProperty[]} */
  const optTypeProps = [];

  for (const refOrParam of parameters) {
    /** @type {ParameterObject} */
    let param;
    if ('$ref' in refOrParam) {
      try {
        param = /** @type {ParameterObject} */ (
          resolveRef(refOrParam.$ref, components)
        );
      } catch (err) {
        debug(err);
        continue;
      }
    } else {
      param = refOrParam;
    }

    const { in: section, name, schema, required } = param;

    switch (section) {
      case 'query':
        params.qs.push(name);
        break;
      case 'path':
        params.pathParams.push(name);
        break;
      case 'headers':
        params.headers.push(name);
        break;
      default:
        debug(`"in" value of ${section} for ${name} not supported`);
        continue;
    }

    const annotation = schema
      ? schemaToAnnotation(schema)
      : t.stringTypeAnnotation();
    optTypeProps.push(
      Object.assign(t.objectTypeProperty(t.identifier(name), annotation), {
        optional: !required,
      })
    );
  }

  if (optTypeProps.length === 0) return [[], []];

  // (opts: { someOpt: string }) | (opts: { someOpt?: string } = {})
  /** @type {t.Identifier | t.AssignmentPattern} */
  let methodArg = Object.assign(t.identifier('opts'), {
    typeAnnotation: t.typeAnnotation(t.objectTypeAnnotation(optTypeProps)),
  });
  if (optTypeProps.every(p => p.optional)) {
    methodArg = t.assignmentPattern(methodArg, t.objectExpression([]));
  }

  // { qs: { foo: opts.foo , ... }, pathParams: ... }
  const fetchOpts = Object.entries(params).flatMap(([opt, vars]) =>
    vars.length > 0
      ? [
          t.objectProperty(
            t.identifier(opt),
            t.objectExpression(
              vars.map(v =>
                t.objectProperty(
                  t.identifier(v),
                  t.memberExpression(t.identifier('opts'), t.identifier(v))
                )
              )
            )
          ),
        ]
      : []
  );

  return [[methodArg], fetchOpts];
}
module.exports = parseParameters;
