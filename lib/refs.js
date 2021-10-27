"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveRef = exports.normalizeRefPath = exports.normalizeRefName = void 0;
const COMP_REF_RE = /^#\/components\/([a-z]+(?:[A-Z][a-z]*)*)\/(\w+)$/;
function normalizeRefName(kind, name) {
    if (kind === 'schemas')
        kind = '';
    return (kind.slice(0, 1).toUpperCase() +
        kind.slice(1) +
        name[0].toUpperCase() +
        name.slice(1));
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
