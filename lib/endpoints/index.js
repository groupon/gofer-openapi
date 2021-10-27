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
const response_type_1 = __importDefault(require("./response-type"));
const parse_parameters_1 = __importDefault(require("./parse-parameters"));
const refs_1 = require("../refs");
const debug = (0, debug_1.default)('gofer:openapi');
function generateEndpoints({ paths, components = {}, }) {
    if (!paths)
        throw new Error('No paths!');
    const seenOpIds = new Set();
    return Object.entries(paths).flatMap(([path, pathItem]) => {
        // separate the cruft from the real HTTP methods
        const { $ref, summary, description, parameters: pathParameters, servers, ...methods } = pathItem || {};
        if ($ref) {
            throw new Error(`paths-level $ref for ${path} not supported`);
        }
        return Object.entries(methods).flatMap(([method, { operationId, parameters = [], responses, requestBody }]) => {
            if (!operationId)
                return [];
            if (seenOpIds.has(operationId)) {
                debug(`Skipping duplicate operationId: ${operationId}`);
                return [];
            }
            seenOpIds.add(operationId);
            const fetchOpts = [
                t.objectProperty(t.identifier('endpointName'), t.stringLiteral(operationId)),
            ];
            // opId()
            const methodArgs = [];
            // this.get('/path', { endpointName: opId })
            const fetchArgs = [
                t.stringLiteral(path),
                t.objectExpression(fetchOpts),
            ];
            if (requestBody) {
                const jsonReqBodySchema = (0, refs_1.resolveMaybeRef)(requestBody, components)
                    .content?.['application/json']?.schema;
                if (jsonReqBodySchema) {
                    // TODO: something nicer than just "body" as opt
                    parameters.push({
                        name: 'body',
                        in: 'body',
                        schema: jsonReqBodySchema,
                        required: true,
                    });
                }
                else {
                    // TODO: handle application/octet-stream for file uploads
                    debug(`Skipping unhandled requestBody for ${operationId}`);
                }
            }
            if (pathParameters || parameters) {
                const [paramMethodArgs, paramFetchOpts] = (0, parse_parameters_1.default)([...(pathParameters || []), ...parameters], components);
                // opId({ ... }) {
                methodArgs.push(...paramMethodArgs);
                // this.get('/path', { ... })
                fetchOpts.push(...paramFetchOpts);
            }
            const classMethod = t.classMethod('method', t.identifier(operationId), methodArgs, t.blockStatement([
                // return this.get('/foo', { ... }).json();
                t.returnStatement(
                // this.get(...).json()
                t.callExpression(
                // this.get(...).json
                t.memberExpression(
                // this.get(...)
                t.callExpression(
                // this.get
                t.memberExpression(t.thisExpression(), t.identifier(method.toLowerCase())), fetchArgs), t.identifier('json')), [])),
            ]));
            const responseType = (0, response_type_1.default)(responses, components);
            return Object.assign(classMethod, {
                returnType: t.typeAnnotation(responseType),
            });
        });
    });
}
exports.default = generateEndpoints;
