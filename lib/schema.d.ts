import * as t from '@babel/types';
import type { OpenAPIV3 } from 'openapi-types';
export declare function schemaToAnnotation(refOrSchema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject): t.FlowType;
