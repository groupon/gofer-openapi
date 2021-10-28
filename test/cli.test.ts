import assert from 'assert';
import { execSync } from 'child_process';
import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

function runCLI(cmdline: string) {
  // want to be able to redirect stdin, so no execFile for us
  return execSync(`${require.resolve('../cli.js')} ${cmdline}`, {
    encoding: 'utf8',
  });
}

describe('cli', () => {
  let specPath: string;
  before(() => {
    const tmpDir = mkdtempSync(path.join(tmpdir(), 'cli-test-'));
    specPath = path.join(tmpDir, 'spec.json');
    writeFileSync(
      specPath,
      JSON.stringify({
        openapi: '3.0.2',
        paths: { '/': { get: { operationId: 'getSlash' } } },
      })
    );
  });

  it('shows help', () => {
    assert.ok(runCLI('--help').includes('"ES2019", "ES2020"'));
  });

  it('generates some typescript from stdin', () => {
    const tsSrc = runCLI(`-c Foo < ${specPath}`);
    assert.ok(tsSrc.includes('export class Foo extends Gofer'));
    assert.ok(tsSrc.includes('getSlash()'));
  });

  it('generates some typescript from a file', () => {
    const tsSrc = runCLI(
      `--class Foo --extends=bar-baz --default-export ${specPath}`
    );
    assert.ok(tsSrc.includes('export default class Foo extends BarBaz'));
  });
});
