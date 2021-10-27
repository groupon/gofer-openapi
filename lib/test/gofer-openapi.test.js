"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const gofer_openapi_1 = require("../src/gofer-openapi");
const petStoreYML = fs_1.default.readFileSync(require.resolve('./fixtures/petstore3.yml'), 'utf8');
const classTmpl = fs_1.default.readFileSync(require.resolve('./fixtures/petstore.tmpl'), 'utf8');
describe('gofer-openapi', () => {
    it('builds a set of working Gofer Endpoints', async () => {
        // eslint-disable-next-line no-console
        console.log(await (0, gofer_openapi_1.goferFromOpenAPI)(classTmpl, petStoreYML));
    });
});
