import assert from 'assert';
import { readFileSync, writeFileSync } from 'fs';

import { goferFromOpenAPI } from '../';

const REGENERATE_FIXTURES = 'REGENERATE_FIXTURES';

const petStoreYML = readFileSync(
  require.resolve('../fixtures/petstore3.yml'),
  'utf8'
);

function assertEqualsFixture(text: string, filePath: string) {
  const fullPath = require.resolve(filePath);
  const expected = readFileSync(fullPath, 'utf8');

  try {
    assert.strictEqual(text, expected);
  } catch (err: any) {
    if (process.env[REGENERATE_FIXTURES]) {
      writeFileSync(fullPath, text);
      throw new Error(`Regenerated fixture for ${filePath}`);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    err.stack += `\n\nRe-run with ${REGENERATE_FIXTURES}=1 to update`;
    throw err;
  }
}

describe('gofer-openapi', () => {
  it('builds a Gofer subclass & types in TS', () => {
    const ts = goferFromOpenAPI(petStoreYML, {
      className: 'PetStoreBase',
      format: 'ts',
    });

    assertEqualsFixture(ts, '../fixtures/petstore-base.ts');
  });

  it('generates JS from TS', () => {
    const js = goferFromOpenAPI(petStoreYML, {
      className: 'PetStoreBase',
      format: 'js',
      target: 'ES2020',
    });

    assertEqualsFixture(js, '../fixtures/petstore-base.js');
  });

  it('generates DTS from TS', function () {
    this.timeout(20000); // npx tsc is sooooo sloooow
    const dts = goferFromOpenAPI(petStoreYML, {
      className: 'PetStoreBase',
      format: 'dts',
    });

    assertEqualsFixture(dts, '../fixtures/petstore-base.d.ts');
  });
});
