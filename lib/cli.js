"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const commander_1 = require("commander");
const gofer_openapi_1 = require("./gofer-openapi");
const { version } = JSON.parse((0, fs_1.readFileSync)(require.resolve('../package.json'), 'utf8'));
const prog = new commander_1.Command();
prog
    .version(version)
    .requiredOption('-c, --class <ClassName>', 'What to name the resulting class')
    .addOption(new commander_1.Option('-f, --format <fmt>', 'Output format: JavaScript, TypeScript, or TypeScript Declarations only')
    .default('ts')
    .choices(['js', 'ts', 'dts']))
    .argument('[path-to-spec-file.yml|json]', 'JSON or YAML OpenAPI 3.x spec file; default: stdin')
    .allowExcessArguments(false);
prog.parse(process.argv);
const { args } = prog;
const { format, class: className } = prog.opts();
if (format !== 'ts') {
    throw new Error('Only --format=ts currently supported');
}
if (args.length < 1) {
    throw new Error('stdin mode not yet implemented');
}
const specStr = (0, fs_1.readFileSync)(args[0], 'utf8');
process.stdout.write((0, gofer_openapi_1.goferFromOpenAPI)(specStr, { className }));
