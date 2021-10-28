import { readFileSync } from 'fs';

import { Command, Option } from 'commander';
import { goferFromOpenAPI } from './gofer-openapi';

const { version } = JSON.parse(
  readFileSync(require.resolve('../package.json'), 'utf8')
) as { version: string };

const prog = new Command();

prog
  .version(version)
  .requiredOption('-c, --class <ClassName>', 'What to name the resulting class')
  .addOption(
    new Option(
      '-f, --format <fmt>',
      'Output format: JavaScript, TypeScript, or TypeScript Declarations only'
    )
      .default('ts')
      .choices(['js', 'ts', 'dts'])
  )
  .argument(
    '[path-to-spec-file.yml|json]',
    'JSON or YAML OpenAPI 3.x spec file; default: stdin'
  )
  .allowExcessArguments(false);

prog.parse(process.argv);

const { args } = prog;
const { format, class: className } = prog.opts<{
  format: 'ts' | 'js' | 'dts';
  class: string;
}>();

if (format !== 'ts') {
  throw new Error('Only --format=ts currently supported');
}

if (args.length < 1) {
  throw new Error('stdin mode not yet implemented');
}

const specStr = readFileSync(args[0], 'utf8');
process.stdout.write(goferFromOpenAPI(specStr, { className }));
