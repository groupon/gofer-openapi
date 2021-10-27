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
const t = __importStar(require("@babel/types"));
const debug_1 = __importDefault(require("debug"));
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
            : t.stringTypeAnnotation();
        optTypeProps.push(Object.assign(t.objectTypeProperty(t.identifier(name), annotation), {
            optional: !required,
        }));
    }
    if (optTypeProps.length === 0)
        return [[], []];
    // (opts: { someOpt: string }) | (opts: { someOpt?: string } = {})
    let methodArg = Object.assign(t.identifier('opts'), {
        typeAnnotation: t.typeAnnotation(t.objectTypeAnnotation(optTypeProps)),
    });
    if (optTypeProps.every(p => p.optional)) {
        methodArg = t.assignmentPattern(methodArg, t.objectExpression([]));
    }
    // { qs: { foo: opts.foo , ... }, pathParams: ... }
    const fetchOpts = Object.entries(params).flatMap(([opt, vars]) => vars.length > 0
        ? [
            t.objectProperty(t.identifier(opt), t.objectExpression(vars.map(v => t.objectProperty(t.identifier(v), t.memberExpression(t.identifier('opts'), t.identifier(v)))))),
        ]
        : []);
    return [[methodArg], fetchOpts];
}
exports.default = parseParameters;
