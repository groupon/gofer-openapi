"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = __importDefault(require("@babel/types"));
function buildResponseType(
// eslint-disable-next-line @typescript-eslint/no-unused-vars
responses) {
    // FIXME
    return types_1.default.anyTypeAnnotation();
}
exports.default = buildResponseType;
