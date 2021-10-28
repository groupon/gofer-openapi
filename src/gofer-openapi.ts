import YAML from 'yaml';
import generate from '@babel/generator';
import * as t from '@babel/types';
import type { OpenAPIV3 } from 'openapi-types';
import * as ts from 'typescript';

import generateEndpoints from './endpoints';
import generateTypeDecls from './type-decls';
import { generateDTS } from './generate-dts';
import { inferTarget } from './infer-target';

export interface Opts {
  className: string;
  extendsClassName?: string;
  format: 'ts' | 'js' | 'dts';
  target: keyof typeof ts.ScriptTarget;
}

export function goferFromOpenAPI(
  openAPI: any,
  { className, extendsClassName = 'Gofer', format, target }: Opts
): string {
  const spec = (
    typeof openAPI === 'string' ? YAML.parse(openAPI) : openAPI
  ) as OpenAPIV3.Document;
  if (!(spec.openapi || '').startsWith('3.')) {
    throw new Error('Only OpenAPI 3.x supported at the moment');
  }

  const goferImports =
    extendsClassName === 'Gofer'
      ? [
          t.importDeclaration(
            [t.importDefaultSpecifier(t.identifier('Gofer'))],
            t.stringLiteral('gofer')
          ),
        ]
      : [];

  const typeDecls = generateTypeDecls(spec.components);

  const endpoints = generateEndpoints(spec);
  const klass = t.exportNamedDeclaration(
    t.classDeclaration(
      t.identifier(className),
      t.identifier(extendsClassName),
      t.classBody(endpoints)
    )
  );

  const bareTS = generate(
    t.program([...goferImports, ...typeDecls, klass])
  ).code;
  const tsSrc = `/* eslint-disable */\n\n${bareTS}`;

  switch (format) {
    case 'ts':
      return tsSrc;
    case 'js':
      // TODO: allow configurable --target and auto-detect default from
      // package.json engines.node
      return ts.transpile(tsSrc, {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget[target || inferTarget()],
      });
    case 'dts':
      return generateDTS(tsSrc);
    default:
      throw new Error('Invalid format');
  }
}
