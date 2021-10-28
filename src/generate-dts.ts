import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { execFileSync } from 'child_process';

import Debug from 'debug';

// The typescript transpileModule() method doesn't (seem to) support emitting
// the declaration, so we invoke the CLI ;;

const debug = Debug('gofer:openapi:generate-dts');

export function generateDTS(tsSrc: string) {
  const dir = mkdtempSync(path.join(tmpdir(), 'gofer-openapi-'));

  const filePathBase = path.join(dir, 'client');
  const tsFilePath = `${filePathBase}.ts`;
  const dtsFilePath = `${filePathBase}.d.ts`;

  writeFileSync(tsFilePath, tsSrc);

  let savedErr: unknown;
  try {
    execFileSync('npx', [
      'tsc',
      '--declaration',
      '--emitDeclarationOnly',
      tsFilePath,
    ]);
  } catch (err) {
    savedErr = err;
    debug(`tsc produced (expected) error:`, err);
  }

  if (!existsSync(dtsFilePath)) {
    // eslint-disable-next-line no-console
    console.error(`Failed to generate declaration file:`);
    throw savedErr;
  }

  return readFileSync(dtsFilePath, 'utf8');
}
