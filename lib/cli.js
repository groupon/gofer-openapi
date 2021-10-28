"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
    .addOption(new commander_1.Option('-t, --target <jstarget>', 'With --format=js, what language target; default is auto-inferred from node.engines')
    .default((0, infer_target_1.inferTarget)())
    .choices(Object.keys(typescript_1.ScriptTarget).filter(k => /^ES/.test(k))))
    .argument('[path-to-spec-file.yml|json]', 'JSON or YAML OpenAPI 3.x spec file; default: stdin')
    .allowExcessArguments(false);
prog.parse(process.argv);
const { args } = prog;
const { format, class: className, target, } = prog.opts();
if (args.length < 1) {
    throw new Error('stdin mode not yet implemented');
}
const specStr = (0, fs_1.readFileSync)(args[0], 'utf8');
process.stdout.write((0, gofer_openapi_1.goferFromOpenAPI)(specStr, { className, format, target }));
