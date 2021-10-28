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
const t = __importStar(require("@babel/types"));
const debug_1 = __importDefault(require("debug"));
const lodash_camelcase_1 = __importDefault(require("lodash.camelcase"));
const refs_1 = require("../refs");
const schema_1 = require("../schema");
const debug = (0, debug_1.default)('gofer:openapi:parse-parameters');
/**
 * Given parameters like:
 * [
 *   { name: 'foo', in: 'query', required: false, schema: { type: 'string' } }
 *   ...
 * ]
 *
 * returns a tuple of the arguments array to the endpoint method,
 * and the properties which will be included in the fetch call,
 * which will result in code like:
 *
 *                  v opts type
 * someMethod(opts: { foo?: string } = {}) {
 *   return this.get('/path/to/some', { qs: { foo: opts.foo } }).json();
 *                                      ^ properties
 * }
 */
function parseParameters(parameters, components) {
    const params = {
        qs: [],
        pathParams: [],
        headers: [],
    };
    let hasBody = false;
    const optTypeProps = [];
    for (const refOrParam of parameters) {
        let param;
        if ('$ref' in refOrParam) {
            try {
                param = (0, refs_1.resolveRef)(refOrParam.$ref, components);
            }
            catch (err) {
                debug(err);
                continue;
            }
        }
        else {
            param = refOrParam;
        }
        const { in: section, name, schema, required } = param;
        const camelName = (0, lodash_camelcase_1.default)(name);
        switch (section) {
            case 'query':
                params.qs.push([name, camelName]);
                break;
            case 'path':
                params.pathParams.push([name, camelName]);
                break;
            case 'header':
                params.headers.push([name, camelName]);
                break;
            case 'body':
                hasBody = true;
                break;
            default:
                debug(`"in: ${section}" for ${name} not supported`);
                continue;
        }
        const annotation = schema
            ? (0, schema_1.schemaToAnnotation)(schema)
            : t.stringTypeAnnotation();
        optTypeProps.push(Object.assign(t.objectTypeProperty(t.identifier(camelName), annotation), {
            optional: !required,
        }));
    }
    if (optTypeProps.length === 0)
        return [[], []];
    let methodArg;
    let fetchOpts;
    // if the only arg is the requestBody, we can make it the only argument
    if (optTypeProps.length === 1 && hasBody) {
        const { value: annotation, optional } = optTypeProps[0];
        // if we can easily figure out a good name, then do so
        // TODO: use this for opts.body also
        const varName = bodyVarName(annotation);
        // someMethod(body?: Blah)
        methodArg = Object.assign(t.identifier(varName), {
            typeAnnotation: t.typeAnnotation(annotation),
            optional,
        });
        fetchOpts = [t.objectProperty(t.identifier('json'), t.identifier(varName))];
    }
    else {
        // (opts: { someOpt: string }) | (opts: { someOpt?: string } = {})
        methodArg = Object.assign(t.identifier('opts'), {
            typeAnnotation: t.typeAnnotation(t.objectTypeAnnotation(optTypeProps)),
        });
        if (optTypeProps.every(p => p.optional)) {
            methodArg = t.assignmentPattern(methodArg, t.objectExpression([]));
        }
        // { qs: { foo: opts.foo , ... }, pathParams: ... }
        fetchOpts = Object.entries(params).flatMap(([opt, vars]) => vars.length > 0
            ? [
                t.objectProperty(t.identifier(opt), t.objectExpression(vars.map(([name, camelName]) => t.objectProperty(idOrLiteral(name), t.memberExpression(t.identifier('opts'), t.identifier(camelName)))))),
            ]
            : []);
        if (hasBody) {
            fetchOpts.push(t.objectProperty(t.identifier('json'), t.memberExpression(t.identifier('opts'), t.identifier('body'))));
        }
    }
    return [[methodArg], fetchOpts];
}
exports.default = parseParameters;
function bodyVarName(annotation) {
    let plural = false;
    if (t.isArrayTypeAnnotation(annotation)) {
        annotation = annotation.elementType;
        plural = true;
    }
    return t.isGenericTypeAnnotation(annotation) && t.isIdentifier(annotation.id)
        ? pluralize((0, lodash_camelcase_1.default)(annotation.id.name), plural)
        : 'body';
}
function pluralize(word, plural) {
    return !plural ? word : word.endsWith('s') ? `${word}es` : `${word}s`;
}
function idOrLiteral(name) {
    return t.isValidIdentifier(name) ? t.identifier(name) : t.stringLiteral(name);
}
