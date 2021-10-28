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
exports.goferFromOpenAPI = void 0;
const yaml_1 = __importDefault(require("yaml"));
const generator_1 = __importDefault(require("@babel/generator"));
const t = __importStar(require("@babel/types"));
const ts = __importStar(require("typescript"));
const endpoints_1 = __importDefault(require("./endpoints"));
const type_decls_1 = __importDefault(require("./type-decls"));
function goferFromOpenAPI(openAPI, { className, format }) {
    const spec = (typeof openAPI === 'string' ? yaml_1.default.parse(openAPI) : openAPI);
    if (!(spec.openapi || '').startsWith('3.')) {
        throw new Error('Only OpenAPI 3.x supported at the moment');
    }
    const goferImport = t.importDeclaration([t.importDefaultSpecifier(t.identifier('Gofer'))], t.stringLiteral('gofer'));
    const typeDecls = (0, type_decls_1.default)(spec.components);
    const endpoints = (0, endpoints_1.default)(spec);
    const klass = t.exportNamedDeclaration(t.classDeclaration(t.identifier(className), t.identifier('Gofer'), t.classBody(endpoints)));
    const bareTS = (0, generator_1.default)(t.program([goferImport, ...typeDecls, klass])).code;
    const tsSrc = `/* eslint-disable */\n\n${bareTS}`;
    switch (format) {
        case 'ts':
            return tsSrc;
        case 'js':
            return ts.transpile(tsSrc, {
                module: ts.ModuleKind.CommonJS,
                target: ts.ScriptTarget.ES2020,
            });
        case 'dts':
            throw new Error('not yet supported');
            return ts.transpile(tsSrc, {
                declaration: true,
                emitDeclarationOnly: true,
            });
        default:
            throw new Error('Invalid format');
    }
}
exports.goferFromOpenAPI = goferFromOpenAPI;
