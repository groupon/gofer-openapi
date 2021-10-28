import { readFileSync } from 'fs';

import { Command, Option } from 'commander';
import { ScriptTarget } from 'typescript';

import { goferFromOpenAPI } from './gofer-openapi';
import { inferTarget } from './infer-target';

const { version } = JSON.parse(
  readFileSync(require.resolve('../package.json'), 'utf8')
) as { version: string };

const prog = new Command();
prog
  .version(version)
  .requiredOption('-c, --class <ClassName>', 'What to name the resulting class')
  .option(
    '-e, --extends <ClassName>',
    'What class should generated one extend',
    'Gofer'
  )
  .addOption(
    new Option(
      '-f, --format <fmt>',
      'Output format: JavaScript, TypeScript, or TypeScript Declarations only'
    )
      .default('ts')
      .choices(['js', 'ts', 'dts'])
  )
  .addOption(
    new Option(
      '-t, --target <jstarget>',
      'With --format=js, what language target; default is auto-inferred from node.engines'
    )
      .default(inferTarget())
      .choices(Object.keys(ScriptTarget).filter(k => /^ES/.test(k)))
  )
  .argument(
    '[path-to-spec-file.yml|json]',
    'JSON or YAML OpenAPI 3.x spec file; default: stdin'
  )
  .allowExcessArguments(false);

prog.parse(process.argv);

const { args } = prog;
const {
  format,
  class: className,
  extends: extendsClassName,
  target,
} = prog.opts<{
  format: 'ts' | 'js' | 'dts';
  class: string;
  extends: string;
  target: keyof typeof ScriptTarget;
}>();

const specStr = readFileSync(args[0] || 0, 'utf8');

process.stdout.write(
  goferFromOpenAPI(specStr, { className, extendsClassName, format, target })
);
