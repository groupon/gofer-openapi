import * as t from '@babel/types';
import type { OpenAPIV3 as o } from 'openapi-types';
import Debug from 'debug';
import camelCase from 'lodash.camelcase';

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
  const params: Record<'qs' | 'pathParams' | 'headers', [string, string][]> = {
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

    const camelName = camelCase(name);

    switch (section) {
      case 'query':
        params.qs.push([name, camelName]);
        break;
      case 'path':
        params.pathParams.push([name, camelName]);
        break;
      case 'header':
        params.headers.push([name, camelName]);
        break;
      case 'body':
        hasBody = true;
        break;
      default:
        debug(`"in: ${section}" for ${name} not supported`);
        continue;
    }

    const annotation = schema
      ? schemaToAnnotation(schema)
      : t.stringTypeAnnotation();
    optTypeProps.push(
      Object.assign(t.objectTypeProperty(t.identifier(camelName), annotation), {
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

    // if we can easily figure out a good name, then do so
    // TODO: use this for opts.body also
    const varName = bodyVarName(annotation);

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
                vars.map(([name, camelName]) =>
                  t.objectProperty(
                    t.identifier(name),
                    t.memberExpression(
                      t.identifier('opts'),
                      t.identifier(camelName)
                    )
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

function bodyVarName(annotation: t.FlowType) {
  let plural = false;
  if (t.isArrayTypeAnnotation(annotation)) {
    annotation = annotation.elementType;
    plural = true;
  }

  return t.isGenericTypeAnnotation(annotation) && t.isIdentifier(annotation.id)
    ? pluralize(camelCase(annotation.id.name), plural)
    : 'body';
}

function pluralize(word: string, plural: boolean) {
  return !plural ? word : word.endsWith('s') ? `${word}es` : `${word}s`;
}
