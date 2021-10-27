import * as t from '@babel/types';
import type { OpenAPIV3 as o } from 'openapi-types';
export default function buildResponseType(responses: o.ResponsesObject, components: o.ComponentsObject): t.GenericTypeAnnotation;
