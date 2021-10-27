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
Object.defineProperty(exports, "__esModule", { value: true });
const t = __importStar(require("@babel/types"));
const refs_1 = require("../refs");
const schema_1 = require("../schema");
function buildResponseType(
// eslint-disable-next-line @typescript-eslint/no-unused-vars
responses, components) {
    // if no response declaration, return Promise<void>
    let typeAnn = t.voidTypeAnnotation();
    // TODO: handle error statuses too
    const refOrResp = responses[200];
    if (refOrResp) {
        let resp;
        if ('$ref' in refOrResp) {
            resp = (0, refs_1.resolveRef)(refOrResp.$ref, components);
        }
        else {
            resp = refOrResp;
        }
        const respSchema = resp.content?.['application/json']?.schema;
        if (respSchema)
            typeAnn = (0, schema_1.schemaToAnnotation)(respSchema);
    }
    return t.genericTypeAnnotation(t.identifier('Promise'), t.typeParameterInstantiation([typeAnn]));
}
exports.default = buildResponseType;
