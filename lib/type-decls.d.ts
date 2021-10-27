import * as t from '@babel/types';
import type { OpenAPIV3 } from 'openapi-types';
export default function generateTypeDecls(components?: OpenAPIV3.ComponentsObject): t.TypeAlias[];
