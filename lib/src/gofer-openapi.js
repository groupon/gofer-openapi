"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.goferFromOpenAPI = void 0;
const yaml_1 = __importDefault(require("yaml"));
const swagger_parser_1 = __importDefault(require("@apidevtools/swagger-parser"));
const generator_1 = __importDefault(require("@babel/generator"));
const types_1 = __importDefault(require("@babel/types"));
const debug_1 = __importDefault(require("debug"));
const response_type_1 = __importDefault(require("./response-type"));
const parse_parameters_1 = __importDefault(require("./parse-parameters"));
const debug = (0, debug_1.default)('gofer:openapi');
const DEFAULT_PARSE_OPTIONS = {
    resolve: {
        external: false,
    },
    validate: {
        schema: false,
        spec: false,
    },
};
function generateEndpoints({ paths, components = {} }) {
    if (!paths)
        throw new Error('No paths!');
    const seenOpIds = new Set();
    return Object.entries(paths).flatMap(([path, pathItem]) => {
        // separate the cruft from the real HTTP methods
        const { $ref, summary, description, parameters: pathParameters, servers, ...methods } = pathItem || {};
        if ($ref) {
            throw new Error(`paths-level $ref for ${path} not supported`);
        }
        return Object.entries(methods).flatMap(([method, { operationId, parameters, responses }]) => {
            if (!operationId)
                return [];
            if (seenOpIds.has(operationId)) {
                debug(`Skipping duplicate operationId: ${operationId}`);
                return [];
            }
            seenOpIds.add(operationId);
            const fetchOpts = [
                types_1.default.objectProperty(types_1.default.identifier('endpointName'), types_1.default.stringLiteral(operationId)),
            ];
            // opId()
            const methodArgs = [];
            // this.get('/path', { endpointName: opId })
            const fetchArgs = [
                types_1.default.stringLiteral(path),
                types_1.default.objectExpression(fetchOpts),
            ];
            if (parameters) {
                const [paramMethodArgs, paramFetchOpts] = (0, parse_parameters_1.default)([...(pathParameters || []), ...parameters], components);
                // opId({ ... }) {
                methodArgs.push(...paramMethodArgs);
                // this.get('/path', { ... })
                fetchOpts.push(...paramFetchOpts);
            }
            const classMethod = types_1.default.classMethod('method', types_1.default.identifier(operationId), methodArgs, types_1.default.blockStatement([
                // return this.get('/foo', { ... }).json();
                types_1.default.returnStatement(
                // this.get(...).json()
                types_1.default.callExpression(
                // this.get(...).json
                types_1.default.memberExpression(
                // this.get(...)
                types_1.default.callExpression(
                // this.get
                types_1.default.memberExpression(types_1.default.thisExpression(), types_1.default.identifier(method.toLowerCase())), fetchArgs), types_1.default.identifier('json')), [])),
            ]));
            const responseType = (0, response_type_1.default)(responses);
            return Object.assign(classMethod, {
                returnType: types_1.default.typeAnnotation(responseType),
            });
        });
    });
}
async function goferFromOpenAPI(classTemplate, openAPI) {
    const spec = (typeof openAPI === 'string' ? yaml_1.default.parse(openAPI) : openAPI);
    if (!(spec.openapi || '').startsWith('3.')) {
        throw new Error('Only OpenAPI 3.x supported at the moment');
    }
    const api = (await swagger_parser_1.default.validate(spec, DEFAULT_PARSE_OPTIONS));
    const endpoints = generateEndpoints(api);
    const endpointsJS = (0, generator_1.default)(types_1.default.classBody(endpoints)).code.replace(/^\s*\{\s*|\s*\}\s*$/g, '');
    return classTemplate.replace('__OPENAPI_ENDPOINTS__', endpointsJS);
}
exports.goferFromOpenAPI = goferFromOpenAPI;
