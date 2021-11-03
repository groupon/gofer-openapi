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
exports.schemaToAnnotation = void 0;
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
const refs_1 = require("./refs");
const debug = (0, debug_1.default)('gofer:openapi:schema');
function objectTypeAnnotation({ properties = {}, required = [], additionalProperties, }, path) {
    const addPropAnn = !!additionalProperties &&
        typeof additionalProperties === 'object' &&
        t.genericTypeAnnotation(t.identifier('Record'), t.typeParameterInstantiation([
            t.stringTypeAnnotation(),
            schemaToAnnotation(additionalProperties, [
                ...path,
                'additionalProperties',
            ]),
        ]));
    const objAnn = t.objectTypeAnnotation(Object.entries(properties).map(([key, propSchema]) => Object.assign(t.objectTypeProperty(t.isValidIdentifier(key) ? t.identifier(key) : t.stringLiteral(key), schemaToAnnotation(propSchema, [...path, key])), { optional: !required.includes(key) })));
    if (addPropAnn) {
        // if the object is *all* additional properties, just return the Record<>
        // if there are additional properties, include them &'ed with the object
        // type to make an open object
        return Object.keys(properties).length === 0
            ? addPropAnn
            : t.intersectionTypeAnnotation([objAnn, addPropAnn]);
    }
    return objAnn;
}
function schemaToAnnotation(refOrSchema, path = []) {
    if ('$ref' in refOrSchema) {
        return t.genericTypeAnnotation(t.identifier((0, refs_1.normalizeRefPath)(refOrSchema.$ref)));
    }
    const schema = refOrSchema;
    if (!schema.type && schema.properties)
        schema.type = 'object';
    const { type, anyOf, allOf, enum: enoom } = schema;
    if (anyOf) {
        return t.unionTypeAnnotation(anyOf.map((x, i) => schemaToAnnotation(x, [...path, 'anyOf', `${i}`])));
    }
    if (allOf) {
        return t.intersectionTypeAnnotation(allOf.map((x, i) => schemaToAnnotation(x, [...path, 'allOf', `${i}`])));
    }
    switch (type) {
        case 'array':
            return t.arrayTypeAnnotation(schemaToAnnotation(schema.items, [...path, 'items']));
        case 'string':
            if (enoom) {
                return t.unionTypeAnnotation(enoom.map(e => t.stringLiteralTypeAnnotation(e)));
            }
            return t.stringTypeAnnotation();
        case 'number':
        case 'integer':
            if (enoom) {
                return t.unionTypeAnnotation(enoom.map(e => t.numberLiteralTypeAnnotation(e)));
            }
            return t.numberTypeAnnotation();
        case 'boolean':
            return t.booleanTypeAnnotation();
        case 'object':
            return objectTypeAnnotation(schema, path);
        default:
            debug(`%s: No handler for type ${type || '<empty>'}`, path.join('.'));
            return t.anyTypeAnnotation();
    }
}
exports.schemaToAnnotation = schemaToAnnotation;
