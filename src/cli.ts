import { readFileSync } from 'fs';

import { Command, Option } from 'commander';
import { goferFromOpenAPI } from './gofer-openapi';

const { version } = JSON.parse(
  readFileSync(require.resolve('../package.json'), 'utf8')
) as { version: string };

const prog = new Command();

prog
  .version(version)
  .addOption(
    new Option(
      '-f, --format <fmt>',
      'Output format: JavaScript, TypeScript, or TypeScript Declarations only'
    )
      .default('ts')
      .choices(['js', 'ts', 'dts'])
  )
  .argument(
    '<path-to-template-file.ts|js>',
    'Path to a template file with __OPENAPI_ENDPOINTS__ and __TYPES__ placeholders in it'
  )
  .argument(
    '[path-to-spec-file.yml|json]',
    'JSON or YAML OpenAPI 3.x spec file; default: stdin'
  )
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

const tmplStr = readFileSync(args[0], 'utf8');
const specStr = readFileSync(args[1], 'utf8');
process.stdout.write(goferFromOpenAPI(tmplStr, specStr));
