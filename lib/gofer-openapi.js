"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.goferFromOpenAPI = void 0;
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
const yaml_1 = __importDefault(require("yaml"));
const generator_1 = __importDefault(require("@babel/generator"));
const t = __importStar(require("@babel/types"));
const ts = __importStar(require("typescript"));
const endpoints_1 = __importDefault(require("./endpoints"));
const type_decls_1 = __importDefault(require("./type-decls"));
const generate_dts_1 = require("./generate-dts");
const infer_target_1 = require("./infer-target");
const lodash_camelcase_1 = __importDefault(require("lodash.camelcase"));
const lodash_upperfirst_1 = __importDefault(require("lodash.upperfirst"));
const ESLINT_DISABLE_HEADER = '/* eslint-disable */\n';
function goferFromOpenAPI(openAPI, { className, extendsPackage = 'gofer', defaultExport = false, format = 'ts', target, }) {
    const spec = (typeof openAPI === 'string' ? yaml_1.default.parse(openAPI) : openAPI);
    if (!(spec.openapi || '').startsWith('3.')) {
        throw new Error('Only OpenAPI 3.x supported at the moment');
    }
    const superclassName = (0, lodash_upperfirst_1.default)((0, lodash_camelcase_1.default)(extendsPackage));
    const superclassImport = t.importDeclaration([t.importDefaultSpecifier(t.identifier(superclassName))], t.stringLiteral(extendsPackage));
    const typeDecls = (0, type_decls_1.default)(spec.components);
    const endpoints = (0, endpoints_1.default)(spec);
    const klass = t.classDeclaration(t.identifier(className), t.identifier(superclassName), t.classBody(endpoints));
    const classExportDecl = defaultExport
        ? t.exportDefaultDeclaration(klass)
        : t.exportNamedDeclaration(klass);
    const tsSrc = (0, generator_1.default)(t.program([superclassImport, ...typeDecls, classExportDecl])).code;
    switch (format) {
        case 'ts':
            return ESLINT_DISABLE_HEADER + tsSrc;
        case 'js':
            const jsSrc = ts.transpile(tsSrc, {
                module: ts.ModuleKind.CommonJS,
                target: ts.ScriptTarget[target || (0, infer_target_1.inferTarget)()],
                esModuleInterop: true,
            });
            return ESLINT_DISABLE_HEADER + jsSrc;
        case 'dts':
            return (0, generate_dts_1.generateDTS)(tsSrc);
        default:
            throw new Error('Invalid format');
    }
}
exports.goferFromOpenAPI = goferFromOpenAPI;
