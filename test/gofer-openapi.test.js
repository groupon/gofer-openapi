'use strict';

const assert = require('assert');
const fs = require('fs');

const { goferFromOpenAPI } = require('../');

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
    console.log(await goferFromOpenAPI(classTmpl, petStoreYML));
  });
});
