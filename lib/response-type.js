'use strict';

const t = require('@babel/types');

/**
 * @typedef {import('openapi-types').OpenAPIV3.ResponsesObject} ResponsesObject
 */

/** @param {ResponsesObject} responses */
function buildResponseType(responses) {
  // FIXME
  return t.anyTypeAnnotation();
}
module.exports = buildResponseType;
