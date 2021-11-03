import * as t from '@babel/types';
import type { OpenAPIV3 as o } from 'openapi-types';
export default function buildResponseType(responses: o.ResponsesObject, components: o.ComponentsObject): {
    goferMethod: string;
    responseType: t.FlowType;
    acceptMimeType?: string;
};
