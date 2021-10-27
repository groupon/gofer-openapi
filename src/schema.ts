import * as t from '@babel/types';
import type { OpenAPIV3 } from 'openapi-types';
import Debug from 'debug';

import { normalizeRefPath } from './refs';

const debug = Debug('gofer:openapi:schema');

function objectTypeAnnotation({
  properties = {},
  required = [],
}: OpenAPIV3.NonArraySchemaObject) {
  return t.objectTypeAnnotation(
    Object.entries(properties).map(([key, propSchema]) =>
      Object.assign(
        t.objectTypeProperty(t.identifier(key), schemaToAnnotation(propSchema)),
        {
          optional: !required.includes(key),
        }
      )
    )
  );
}

export function schemaToAnnotation(
  refOrSchema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject
): t.FlowType {
  if ('$ref' in refOrSchema) {
    return t.genericTypeAnnotation(
      t.identifier(normalizeRefPath(refOrSchema.$ref))
    );
  }
  const schema = refOrSchema;

  const { type } = schema;

  switch (type) {
    case 'array':
      return t.arrayTypeAnnotation(schemaToAnnotation(schema.items));
    case 'string':
      return t.stringTypeAnnotation();
    case 'number':
      return t.numberTypeAnnotation();
    case 'boolean':
      return t.booleanTypeAnnotation();
    case 'object':
      return objectTypeAnnotation(schema);
    default:
      debug(`No handler for type ${type || '<empty>'}`);
      return t.anyTypeAnnotation();
  }
}
