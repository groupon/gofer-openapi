import t from '@babel/types';
import type { OpenAPIV3 } from 'openapi-types';
import Debug from 'debug';

import { normalizeRefName } from './refs';

const debug = Debug('gofer:openapi:schema');

export function schemaToAnnotation(
  refOrSchema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject
): t.FlowType {
  if ('$ref' in refOrSchema) {
    return t.genericTypeAnnotation(
      t.identifier(normalizeRefName(refOrSchema.$ref))
    );
  }
  const schema = refOrSchema;

  const { type } = schema;

  switch (type) {
    case 'array':
      return t.arrayTypeAnnotation(schemaToAnnotation(schema.items));
    case 'string':
      return t.stringTypeAnnotation();
    default:
      debug(`No handler for type ${type || '<empty>'}`);
      return t.anyTypeAnnotation();
  }
}
