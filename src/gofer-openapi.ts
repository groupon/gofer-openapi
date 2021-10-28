import YAML from 'yaml';
import generate from '@babel/generator';
import * as t from '@babel/types';
import type { OpenAPIV3 } from 'openapi-types';

import generateEndpoints from './endpoints';
import generateTypeDecls from './type-decls';

export interface Opts {
  className: string;
}

export function goferFromOpenAPI(openAPI: any, opts: Opts) {
  const spec = (
    typeof openAPI === 'string' ? YAML.parse(openAPI) : openAPI
  ) as OpenAPIV3.Document;
  if (!(spec.openapi || '').startsWith('3.')) {
    throw new Error('Only OpenAPI 3.x supported at the moment');
  }

  const typeDecls = generateTypeDecls(spec.components);
  const endpoints = generateEndpoints(spec);

  const klass = t.exportNamedDeclaration(
    t.classDeclaration(
      t.identifier(opts.className),
      t.identifier('Gofer'),
      t.classBody(endpoints)
    )
  );

  const ts = generate(t.program([...typeDecls, klass])).code;

  return `/* eslint-disable */\n\n${ts}`;
}
