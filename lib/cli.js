"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
const commander_1 = require("commander");
const typescript_1 = require("typescript");
const gofer_openapi_1 = require("./gofer-openapi");
const infer_target_1 = require("./infer-target");
const { version } = JSON.parse((0, fs_1.readFileSync)(require.resolve('../package.json'), 'utf8'));
const prog = new commander_1.Command();
prog
    .version(version)
    .requiredOption('-c, --class <ClassName>', 'What to name the resulting class')
    .addOption(new commander_1.Option('-f, --format <fmt>', 'Output format: JavaScript, TypeScript, or TypeScript Declarations only')
    .default('ts')
    .choices(['js', 'ts', 'dts']))
    .option('-d, --default-export', 'Instead of export class Foo, do export default class Foo')
    .option('-e, --extends <pkg or file to import>', 'What Gofer or Gofer subclass to import', 'gofer')
    .addOption(new commander_1.Option('-t, --target <jstarget>', 'With --format=js, what language target; default is auto-inferred from node.engines')
    .default((0, infer_target_1.inferTarget)())
    .choices(Object.keys(typescript_1.ScriptTarget).filter(k => /^ES/.test(k))))
    .argument('[path-to-spec-file.yml|json]', 'JSON or YAML OpenAPI 2.x or 3.x spec file; default: stdin')
    .allowExcessArguments(false);
prog.parse(process.argv);
const { args } = prog;
const { format, class: className, extends: extendsPackage, defaultExport, target, } = prog.opts();
const specStr = (0, fs_1.readFileSync)(args[0] || 0, 'utf8');
async function main() {
    process.stdout.write(await (0, gofer_openapi_1.goferFromOpenAPI)(specStr, {
        className,
        defaultExport,
        extendsPackage,
        format,
        target,
    }));
}
main().catch(err => {
    process.nextTick(() => {
        throw err;
    });
});
