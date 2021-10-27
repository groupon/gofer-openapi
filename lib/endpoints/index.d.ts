import * as t from '@babel/types';
import type { OpenAPIV3 } from 'openapi-types';
export default function generateEndpoints({ paths, components, }: OpenAPIV3.Document): (t.ClassMethod & {
    returnType: t.TypeAnnotation;
})[];
