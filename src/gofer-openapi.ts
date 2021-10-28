import YAML from 'yaml';
import generate from '@babel/generator';
import * as t from '@babel/types';
import type { OpenAPIV3 } from 'openapi-types';
import * as ts from 'typescript';

import generateEndpoints from './endpoints';
import generateTypeDecls from './type-decls';

export interface Opts {
  className: string;
  format: 'ts' | 'js' | 'dts';
}

export function goferFromOpenAPI(
  openAPI: any,
  { className, format }: Opts
): string {
  const spec = (
    typeof openAPI === 'string' ? YAML.parse(openAPI) : openAPI
  ) as OpenAPIV3.Document;
  if (!(spec.openapi || '').startsWith('3.')) {
    throw new Error('Only OpenAPI 3.x supported at the moment');
  }

  const goferImport = t.importDeclaration(
    [t.importDefaultSpecifier(t.identifier('Gofer'))],
    t.stringLiteral('gofer')
  );

  const typeDecls = generateTypeDecls(spec.components);

  const endpoints = generateEndpoints(spec);
  const klass = t.exportNamedDeclaration(
    t.classDeclaration(
      t.identifier(className),
      t.identifier('Gofer'),
      t.classBody(endpoints)
    )
  );

  const bareTS = generate(t.program([goferImport, ...typeDecls, klass])).code;
  const tsSrc = `/* eslint-disable */\n\n${bareTS}`;

  switch (format) {
    case 'ts':
      return tsSrc;
    case 'js':
      return ts.transpile(tsSrc, {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      });
    case 'dts':
      throw new Error('not yet supported');
      return ts.transpile(tsSrc, {
        declaration: true,
        emitDeclarationOnly: true,
      });
    default:
      throw new Error('Invalid format');
  }
}
