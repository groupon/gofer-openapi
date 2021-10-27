import * as t from '@babel/types';
import type { OpenAPIV3 as o } from 'openapi-types';
import { resolveRef } from '../refs';
import { schemaToAnnotation } from '../schema';

export default function buildResponseType(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  responses: o.ResponsesObject,
  components: o.ComponentsObject
) {
  // if no response declaration, return Promise<void>
  let typeAnn: t.FlowType = t.voidTypeAnnotation();

  // TODO: handle error statuses too
  const refOrResp = responses[200];
  if (refOrResp) {
    let resp: o.ResponseObject;
    if ('$ref' in refOrResp) {
      resp = resolveRef(refOrResp.$ref, components) as o.ResponseObject;
    } else {
      resp = refOrResp;
    }
    const respSchema = resp.content?.['application/json']?.schema;
    if (respSchema) typeAnn = schemaToAnnotation(respSchema);
  }

  return t.genericTypeAnnotation(
    t.identifier('Promise'),
    t.typeParameterInstantiation([typeAnn])
  );
}
