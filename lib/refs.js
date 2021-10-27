"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveRef = exports.normalizeRefName = void 0;
const COMP_REF_RE = /^#\/components\/([a-z]+(?:[A-Z][a-z]*)*)\/(\w+)$/;
/**
 * Converts #/components/requestBodies/someThing
 *       to RequestBodiesSomeThing
 */
function normalizeRefName($ref) {
    const m = $ref.match(COMP_REF_RE);
    if (!m)
        throw new Error(`Failed to normalize name for $ref: ${$ref}`);
    const [, type, name] = m;
    return (type[0].toUpperCase() +
        type.slice(1) +
        name[0].toUpperCase() +
        name.slice(1));
}
exports.normalizeRefName = normalizeRefName;
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
