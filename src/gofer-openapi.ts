import YAML from 'yaml';
import generate from '@babel/generator';
import * as t from '@babel/types';
import type { OpenAPIV3 } from 'openapi-types';

import generateEndpoints from './endpoints';
import generateTypeDecls from './type-decls';

function stripBraces(code: string) {
  return code.replace(/^\s*\{\s*|\s*\}\s*$/g, '');
}

export function goferFromOpenAPI(classTemplate: string, openAPI: any) {
  const spec = (
    typeof openAPI === 'string' ? YAML.parse(openAPI) : openAPI
  ) as OpenAPIV3.Document;
  if (!(spec.openapi || '').startsWith('3.')) {
    throw new Error('Only OpenAPI 3.x supported at the moment');
  }

  const endpoints = generateEndpoints(spec);
  const endpointsTS = stripBraces(generate(t.classBody(endpoints)).code);

  const typeDecls = generateTypeDecls(spec.components);
  const typeDeclsTS = stripBraces(generate(t.blockStatement(typeDecls)).code);

  return classTemplate
    .replace('__OPENAPI_ENDPOINTS__', endpointsTS)
    .replace('__TYPES__', typeDeclsTS);
}
