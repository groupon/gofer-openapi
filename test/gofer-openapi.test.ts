import fs from 'fs';

import { goferFromOpenAPI } from '../';

const petStoreYML = fs.readFileSync(
  require.resolve('./fixtures/petstore3.yml'),
  'utf8'
);

const classTmpl = fs.readFileSync(
  require.resolve('./fixtures/petstore.tmpl'),
  'utf8'
);

describe('gofer-openapi', () => {
  it('builds a set of working Gofer Endpoints', async () => {
    // eslint-disable-next-line no-console
    console.log(await goferFromOpenAPI(classTmpl, petStoreYML));
  });
});
