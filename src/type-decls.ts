import * as t from '@babel/types';
import type { OpenAPIV3 } from 'openapi-types';

import { normalizeRefName } from './refs';
import { schemaToAnnotation } from './schema';

export default function generateTypeDecls(
  components: OpenAPIV3.ComponentsObject = {}
): t.TypeAlias[] {
  const { schemas } = components;

  return Object.entries(schemas || {}).flatMap(([key, schema]) => {
    return t.typeAlias(
      t.identifier(normalizeRefName('schemas', key)),
      null,
      schemaToAnnotation(schema)
    );
  });
}
