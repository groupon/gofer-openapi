"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemaToAnnotation = void 0;
const types_1 = __importDefault(require("@babel/types"));
const debug_1 = __importDefault(require("debug"));
const refs_1 = require("./refs");
const debug = (0, debug_1.default)('gofer:openapi:schema');
function schemaToAnnotation(refOrSchema) {
    if ('$ref' in refOrSchema) {
        return types_1.default.genericTypeAnnotation(types_1.default.identifier((0, refs_1.normalizeRefName)(refOrSchema.$ref)));
    }
    const schema = refOrSchema;
    const { type } = schema;
    switch (type) {
        case 'array':
            return types_1.default.arrayTypeAnnotation(schemaToAnnotation(schema.items));
        case 'string':
            return types_1.default.stringTypeAnnotation();
        default:
            debug(`No handler for type ${type || '<empty>'}`);
            return types_1.default.anyTypeAnnotation();
    }
}
exports.schemaToAnnotation = schemaToAnnotation;
