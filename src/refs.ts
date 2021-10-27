import type { OpenAPIV3 } from 'openapi-types';

const COMP_REF_RE = /^#\/components\/([a-z]+(?:[A-Z][a-z]*)*)\/(\w+)$/;

/**
 * Converts #/components/requestBodies/someThing
 *       to RequestBodiesSomeThing
 */
export function normalizeRefName($ref: string) {
  const m = $ref.match(COMP_REF_RE);
  if (!m) throw new Error(`Failed to normalize name for $ref: ${$ref}`);
  const [, type, name] = m;
  return (
    type[0].toUpperCase() +
    type.slice(1) +
    name[0].toUpperCase() +
    name.slice(1)
  );
}

export function resolveRef(
  $ref: string,
  components: OpenAPIV3.ComponentsObject
) {
  const m = $ref.match(COMP_REF_RE);
  if (!m) throw new Error(`Can't de-ref $ref: ${$ref}`);
  const type = m[1] as keyof OpenAPIV3.ComponentsObject;
  const name = m[2];

  const compsType = components[type];
  if (!compsType) throw new Error(`Couldn't find ${type} in components`);
  const res = compsType[name];
  if (!res) throw new Error(`Couldn't find ${name} in components.${type}`);
  return res;
}
