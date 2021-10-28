"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveRef = exports.resolveMaybeRef = exports.normalizeRefPath = exports.normalizeRefName = void 0;
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
