import * as t from '@babel/types';
import type { OpenAPIV3 } from 'openapi-types';
import Debug from 'debug';

import { resolveRef } from '../refs';
import { schemaToAnnotation } from '../schema';

const debug = Debug('gofer:openapi:parse-parameters');

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
 */
export default function parseParameters(
  parameters: (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[],
  components: OpenAPIV3.ComponentsObject
): [(t.AssignmentPattern | t.Identifier)[], t.ObjectProperty[]] {
  const params: Record<'qs' | 'pathParams' | 'headers', string[]> = {
    qs: [],
    pathParams: [],
    headers: [],
  };

  const optTypeProps: t.ObjectTypeProperty[] = [];

  for (const refOrParam of parameters) {
    let param: OpenAPIV3.ParameterObject;
    if ('$ref' in refOrParam) {
      try {
        param = resolveRef(
          refOrParam.$ref,
          components
        ) as OpenAPIV3.ParameterObject;
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
  let methodArg: t.Identifier | t.AssignmentPattern = Object.assign(
    t.identifier('opts'),
    {
      typeAnnotation: t.typeAnnotation(t.objectTypeAnnotation(optTypeProps)),
    }
  );
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
