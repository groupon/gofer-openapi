"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDTS = void 0;
/*
 * Copyright (c) 2021, Groupon, Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software
 *    without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */
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
        const output = (0, child_process_1.execFileSync)('npx', ['tsc', '--declaration', '--emitDeclarationOnly', tsFilePath], { encoding: 'utf8', cwd: path_1.default.resolve(__dirname, '..') });
        savedErr = new Error(output);
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
