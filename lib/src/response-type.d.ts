import t from '@babel/types';
import type { OpenAPIV3 } from 'openapi-types';
export default function buildResponseType(responses: OpenAPIV3.ResponsesObject): t.AnyTypeAnnotation;
