"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveRef = exports.resolveMaybeRef = exports.normalizeRefPath = exports.normalizeRefName = void 0;
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
const lodash_camelcase_1 = __importDefault(require("lodash.camelcase"));
const lodash_upperfirst_1 = __importDefault(require("lodash.upperfirst"));
const COMP_REF_RE = /^#\/components\/([a-z]+(?:[A-Z][a-z]*)*)\/([^/]+)$/;
function normalizeRefName(kind, name) {
    if (kind === 'schemas')
        kind = '';
    return (0, lodash_upperfirst_1.default)((0, lodash_camelcase_1.default)(`${kind}.${name}`));
}
exports.normalizeRefName = normalizeRefName;
/**
 * Converts #/components/requestBodies/someThing
 *       to RequestBodiesSomeThing
 */
function normalizeRefPath($ref) {
    const m = $ref.match(COMP_REF_RE);
    if (!m)
        throw new Error(`Failed to normalize name for $ref: ${$ref}`);
    return normalizeRefName(m[1], m[2]);
}
exports.normalizeRefPath = normalizeRefPath;
function resolveMaybeRef(maybeRef, components) {
    return '$ref' in maybeRef
        ? resolveRef(maybeRef.$ref, components)
        : maybeRef;
}
exports.resolveMaybeRef = resolveMaybeRef;
function resolveRef($ref, components) {
    const m = $ref.match(COMP_REF_RE);
    if (!m)
        throw new Error(`Can't de-ref $ref: ${$ref}`);
    const type = m[1];
    const name = m[2];
    const compsType = components[type];
    if (!compsType)
        throw new Error(`Couldn't find ${type} in components`);
    const res = compsType[name];
    if (!res)
        throw new Error(`Couldn't find ${name} in components.${type}`);
    return res;
}
exports.resolveRef = resolveRef;
