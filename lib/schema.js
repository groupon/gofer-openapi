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
const t = __importStar(require("@babel/types"));
const debug_1 = __importDefault(require("debug"));
const refs_1 = require("./refs");
const debug = (0, debug_1.default)('gofer:openapi:schema');
function schemaToAnnotation(refOrSchema) {
    if ('$ref' in refOrSchema) {
        return t.genericTypeAnnotation(t.identifier((0, refs_1.normalizeRefName)(refOrSchema.$ref)));
    }
    const schema = refOrSchema;
    const { type } = schema;
    switch (type) {
        case 'array':
            return t.arrayTypeAnnotation(schemaToAnnotation(schema.items));
        case 'string':
            return t.stringTypeAnnotation();
        default:
            debug(`No handler for type ${type || '<empty>'}`);
            return t.anyTypeAnnotation();
    }
}
exports.schemaToAnnotation = schemaToAnnotation;
