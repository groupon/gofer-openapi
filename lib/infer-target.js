"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inferTarget = void 0;
const fs_1 = require("fs");
const pkg_up_1 = __importDefault(require("pkg-up"));
const debug_1 = __importDefault(require("debug"));
const semver_1 = require("semver");
const debug = (0, debug_1.default)('gofer:openapi:infer-targets');
const DEFAULT_TARGET = 'ES2020';
function inferTarget() {
    let pkgJsonPath = '???';
    try {
        pkgJsonPath = pkg_up_1.default.sync();
        if (!pkgJsonPath) {
            debug("Couldn't locate a package.json");
            return DEFAULT_TARGET;
        }
        const pkgJson = JSON.parse((0, fs_1.readFileSync)(pkgJsonPath, 'utf8'));
        const nodeV = pkgJson.engines?.node;
        if (!nodeV) {
            debug(`No engines.node in ${pkgJsonPath}`);
            return DEFAULT_TARGET;
        }
        const minV = (0, semver_1.minVersion)(nodeV);
        if (!minV) {
            debug(`Couldn't infer min node version from ${nodeV} in ${pkgJsonPath}`);
            return DEFAULT_TARGET;
        }
        const target = targetForNodeMajor((0, semver_1.major)(minV));
        debug(`Chose ${target} because engines.node of ${nodeV} in ${pkgJsonPath}`);
        return target;
    }
    catch (err) {
        debug(`Failed to parse ${pkgJsonPath || '???'}`, err);
        return DEFAULT_TARGET;
    }
}
exports.inferTarget = inferTarget;
// See: https://github.com/microsoft/TypeScript/wiki/Node-Target-Mapping
function targetForNodeMajor(n) {
    if (n < 4)
        return 'ES5';
    if (n < 8)
        return 'ES2015';
    if (n < 10)
        return 'ES2017';
    if (n < 12)
        return 'ES2018';
    if (n < 14)
        return 'ES2019';
    if (n < 16)
        return 'ES2020';
    return 'ES2021';
}
