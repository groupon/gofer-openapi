import * as t from '@babel/types';
import type { OpenAPIV3 as o } from 'openapi-types';
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
  parameters: (o.ReferenceObject | o.ParameterObject)[],
  components: o.ComponentsObject
): [(t.AssignmentPattern | t.Identifier)[], t.ObjectProperty[]] {
  const params: Record<'qs' | 'pathParams' | 'headers', string[]> = {
    qs: [],
    pathParams: [],
    headers: [],
  };
  let hasBody = false;

  const optTypeProps: t.ObjectTypeProperty[] = [];

  for (const refOrParam of parameters) {
    let param: o.ParameterObject;
    if ('$ref' in refOrParam) {
      try {
        param = resolveRef(refOrParam.$ref, components) as o.ParameterObject;
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
      case 'body':
        hasBody = true;
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

  let methodArg: t.Identifier | t.AssignmentPattern;
  let fetchOpts: t.ObjectProperty[];

  // if the only arg is the requestBody, we can make it the only argument
  if (optTypeProps.length === 1 && hasBody) {
    const { value: annotation, optional } = optTypeProps[0];

    const varName =
      t.isGenericTypeAnnotation(annotation) && t.isIdentifier(annotation.id)
        ? lcFirst(annotation.id.name)
        : 'body';

    // someMethod(body?: Blah)
    methodArg = Object.assign(t.identifier(varName), {
      typeAnnotation: t.typeAnnotation(annotation),
      optional,
    });
    fetchOpts = [t.objectProperty(t.identifier('json'), t.identifier(varName))];
  } else {
    // (opts: { someOpt: string }) | (opts: { someOpt?: string } = {})
    methodArg = Object.assign(t.identifier('opts'), {
      typeAnnotation: t.typeAnnotation(t.objectTypeAnnotation(optTypeProps)),
    });
    if (optTypeProps.every(p => p.optional)) {
      methodArg = t.assignmentPattern(methodArg, t.objectExpression([]));
    }

    // { qs: { foo: opts.foo , ... }, pathParams: ... }
    fetchOpts = Object.entries(params).flatMap(([opt, vars]) =>
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

    if (hasBody) {
      fetchOpts.push(
        t.objectProperty(
          t.identifier('json'),
          t.memberExpression(t.identifier('opts'), t.identifier('body'))
        )
      );
    }
  }

  return [[methodArg], fetchOpts];
}

function lcFirst(name: string) {
  return name.slice(0, 1).toLowerCase() + name.slice(1);
}
