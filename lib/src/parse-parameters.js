"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = __importDefault(require("@babel/types"));
const debug_1 = __importDefault(require("debug"));
const refs_1 = require("./refs");
const schema_1 = require("./schema");
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
        switch (section) {
            case 'query':
                params.qs.push(name);
                break;
            case 'path':
                params.pathParams.push(name);
                break;
            case 'headers':
                params.headers.push(name);
                break;
            default:
                debug(`"in" value of ${section} for ${name} not supported`);
                continue;
        }
        const annotation = schema
            ? (0, schema_1.schemaToAnnotation)(schema)
            : types_1.default.stringTypeAnnotation();
        optTypeProps.push(Object.assign(types_1.default.objectTypeProperty(types_1.default.identifier(name), annotation), {
            optional: !required,
        }));
    }
    if (optTypeProps.length === 0)
        return [[], []];
    // (opts: { someOpt: string }) | (opts: { someOpt?: string } = {})
    let methodArg = Object.assign(types_1.default.identifier('opts'), {
        typeAnnotation: types_1.default.typeAnnotation(types_1.default.objectTypeAnnotation(optTypeProps)),
    });
    if (optTypeProps.every(p => p.optional)) {
        methodArg = types_1.default.assignmentPattern(methodArg, types_1.default.objectExpression([]));
    }
    // { qs: { foo: opts.foo , ... }, pathParams: ... }
    const fetchOpts = Object.entries(params).flatMap(([opt, vars]) => vars.length > 0
        ? [
            types_1.default.objectProperty(types_1.default.identifier(opt), types_1.default.objectExpression(vars.map(v => types_1.default.objectProperty(types_1.default.identifier(v), types_1.default.memberExpression(types_1.default.identifier('opts'), types_1.default.identifier(v)))))),
        ]
        : []);
    return [[methodArg], fetchOpts];
}
exports.default = parseParameters;
