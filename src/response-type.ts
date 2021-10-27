import * as t from '@babel/types';
import type { OpenAPIV3 } from 'openapi-types';

export default function buildResponseType(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  responses: OpenAPIV3.ResponsesObject
) {
  // FIXME
  return t.anyTypeAnnotation();
}
