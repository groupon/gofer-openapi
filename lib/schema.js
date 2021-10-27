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
function objectTypeAnnotation({ properties = {}, required = [], additionalProperties, }) {
    const addPropAnn = !!additionalProperties &&
        typeof additionalProperties === 'object' &&
        t.genericTypeAnnotation(t.identifier('Record'), t.typeParameterInstantiation([
            t.stringTypeAnnotation(),
            schemaToAnnotation(additionalProperties),
        ]));
    const objAnn = t.objectTypeAnnotation(Object.entries(properties).map(([key, propSchema]) => Object.assign(t.objectTypeProperty(t.identifier(key), schemaToAnnotation(propSchema)), { optional: !required.includes(key) })));
    if (addPropAnn) {
        // if the object is *all* additional properties, just return the Record<>
        // if there are additional properties, include them &'ed with the object
        // type to make an open object
        return Object.keys(properties).length === 0
            ? addPropAnn
            : t.intersectionTypeAnnotation([objAnn, addPropAnn]);
    }
    return objAnn;
}
function schemaToAnnotation(refOrSchema) {
    if ('$ref' in refOrSchema) {
        return t.genericTypeAnnotation(t.identifier((0, refs_1.normalizeRefPath)(refOrSchema.$ref)));
    }
    const schema = refOrSchema;
    const { type } = schema;
    switch (type) {
        case 'array':
            return t.arrayTypeAnnotation(schemaToAnnotation(schema.items));
        case 'string':
            return t.stringTypeAnnotation();
        case 'number':
        case 'integer':
            return t.numberTypeAnnotation();
        case 'boolean':
            return t.booleanTypeAnnotation();
        case 'object':
            return objectTypeAnnotation(schema);
        default:
            debug(`No handler for type ${type || '<empty>'}`);
            return t.anyTypeAnnotation();
    }
}
exports.schemaToAnnotation = schemaToAnnotation;
