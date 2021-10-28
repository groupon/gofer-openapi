"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDTS = void 0;
const fs_1 = require("fs");
const os_1 = require("os");
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const debug_1 = __importDefault(require("debug"));
// The typescript transpileModule() method doesn't (seem to) support emitting
// the declaration, so we invoke the CLI ;;
const debug = (0, debug_1.default)('gofer:openapi:generate-dts');
function generateDTS(tsSrc) {
    const dir = (0, fs_1.mkdtempSync)(path_1.default.join((0, os_1.tmpdir)(), 'gofer-openapi-'));
    const filePathBase = path_1.default.join(dir, 'client');
    const tsFilePath = `${filePathBase}.ts`;
    const dtsFilePath = `${filePathBase}.d.ts`;
    (0, fs_1.writeFileSync)(tsFilePath, tsSrc);
    let savedErr;
    try {
        (0, child_process_1.execFileSync)('npx', [
            'tsc',
            '--declaration',
            '--emitDeclarationOnly',
            tsFilePath,
        ]);
    }
    catch (err) {
        savedErr = err;
        debug(`tsc produced (expected) error:`, err);
    }
    if (!(0, fs_1.existsSync)(dtsFilePath)) {
        // eslint-disable-next-line no-console
        console.error(`Failed to generate declaration file:`);
        throw savedErr;
    }
    return (0, fs_1.readFileSync)(dtsFilePath, 'utf8');
}
exports.generateDTS = generateDTS;
