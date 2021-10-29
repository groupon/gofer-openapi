import assert from 'assert';
import { tmpdir } from 'os';
import { mkdtempSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';

import { inferTarget, DEFAULT_TARGET } from '../lib/infer-target';

describe('inferTarget()', () => {
  let origDir: string;
  before(() => {
    origDir = process.cwd();
  });

  beforeEach(() => {
    process.chdir(mkdtempSync(path.join(tmpdir(), 'infer-target-test-')));
  });

  after(() => {
    process.chdir(origDir);
  });

  it('returns DEFAULT_TARGET if no package.json', () => {
    assert.strictEqual(inferTarget(), DEFAULT_TARGET);
  });

  it('returns DEFAULT_TARGET if no engines.node', () => {
    writeFileSync('package.json', JSON.stringify({}));
    assert.strictEqual(inferTarget(), DEFAULT_TARGET);
  });

  it('returns DEFAULT_TARGET if no valid min major', () => {
    writeFileSync(
      'package.json',
      JSON.stringify({ engines: { node: 'bogus' } })
    );
    assert.strictEqual(inferTarget(), DEFAULT_TARGET);
  });

  it('returns a chosen target for >=10', () => {
    writeFileSync(
      'package.json',
      JSON.stringify({ engines: { node: '>=10.1.2' } })
    );
    assert.strictEqual(inferTarget(), 'ES2018');
  });

  it('returns a chosen target for ^12 in a subdir', () => {
    writeFileSync('package.json', JSON.stringify({ engines: { node: '^12' } }));
    const subdir = path.join('a', 'b', 'c');
    mkdirSync(subdir, { recursive: true });
    process.chdir(subdir);
    assert.strictEqual(inferTarget(), 'ES2019');
  });
});
