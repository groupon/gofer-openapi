/*
 * Copyright (c) 2021, Groupon, Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software
 *    without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */
import YAML from 'yaml';
import generate from '@babel/generator';
import * as t from '@babel/types';
import type { OpenAPIV3 } from 'openapi-types';
import * as ts from 'typescript';

import generateEndpoints from './endpoints';
import generateTypeDecls from './type-decls';
import { generateDTS } from './generate-dts';
import { inferTarget } from './infer-target';
import camelCase from 'lodash.camelcase';
import upperFirst from 'lodash.upperfirst';

export interface Opts {
  className: string;
  extendsPackage?: string;
  format?: 'ts' | 'js' | 'dts';
  target?: keyof typeof ts.ScriptTarget;
  defaultExport?: boolean;
}

const ESLINT_DISABLE_HEADER = '/* eslint-disable */\n';

export function goferFromOpenAPI(
  openAPI: any,
  {
    className,
    extendsPackage = 'gofer',
    defaultExport = false,
    format = 'ts',
    target,
  }: Opts
): string {
  const spec = (
    typeof openAPI === 'string' ? YAML.parse(openAPI) : openAPI
  ) as OpenAPIV3.Document;
  if (!(spec.openapi || '').startsWith('3.')) {
    throw new Error('Only OpenAPI 3.x supported at the moment');
  }
  const superclassName = upperFirst(camelCase(extendsPackage));

  const superclassImport = t.importDeclaration(
    [t.importDefaultSpecifier(t.identifier(superclassName))],
    t.stringLiteral(extendsPackage)
  );

  const typeDecls = generateTypeDecls(spec.components);

  const endpoints = generateEndpoints(spec);
  const klass = t.classDeclaration(
    t.identifier(className),
    t.identifier(superclassName),
    t.classBody(endpoints)
  );
  const classExportDecl = defaultExport
    ? t.exportDefaultDeclaration(klass)
    : t.exportNamedDeclaration(klass);

  const tsSrc = generate(
    t.program([superclassImport, ...typeDecls, classExportDecl])
  ).code;

  switch (format) {
    case 'ts':
      return ESLINT_DISABLE_HEADER + tsSrc;
    case 'js':
      const jsSrc = ts.transpile(tsSrc, {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget[target || inferTarget()],
        esModuleInterop: true,
      });
      return ESLINT_DISABLE_HEADER + jsSrc;
    case 'dts':
      return generateDTS(tsSrc);
    default:
      throw new Error('Invalid format');
  }
}
