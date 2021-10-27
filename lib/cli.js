"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const commander_1 = require("commander");
const gofer_openapi_1 = require("./gofer-openapi");
const { version } = JSON.parse((0, fs_1.readFileSync)(require.resolve('../package.json'), 'utf8'));
const prog = new commander_1.Command();
prog
    .version(version)
    .addOption(new commander_1.Option('-f, --format <fmt>', 'Output format: JavaScript, TypeScript, or TypeScript Declarations only')
    .default('ts')
    .choices(['js', 'ts', 'dts']))
    .argument('<path-to-template-file.ts|js>', 'Path to a template file with __OPENAPI_ENDPOINTS__ and __TYPES__ placeholders in it')
    .argument('[path-to-spec-file.yml|json]', 'JSON or YAML OpenAPI 3.x spec file; default: stdin')
    .allowExcessArguments(false);
prog.parse(process.argv);
const { args } = prog;
const opts = prog.opts();
if (opts.format !== 'ts') {
    throw new Error('Only --format=ts currently supported');
}
if (args.length < 2) {
    throw new Error('stdin mode not yet implemented');
}
const tmplStr = (0, fs_1.readFileSync)(args[0], 'utf8');
const specStr = (0, fs_1.readFileSync)(args[1], 'utf8');
process.stdout.write((0, gofer_openapi_1.goferFromOpenAPI)(tmplStr, specStr));
