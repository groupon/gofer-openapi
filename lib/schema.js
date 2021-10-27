'use strict';

const t = require('@babel/types');
const debug = require('debug')('gofer:openapi:schema');

const { normalizeRefName } = require('./refs');

/**
 * @typedef {import('openapi-types').OpenAPIV3.ComponentsObject} ComponentsObject
 * @typedef {import('openapi-types').OpenAPIV3.SchemaObject} SchemaObject
 * @typedef {import('openapi-types').OpenAPIV3.ReferenceObject} ReferenceObject
 */

/**
 * @param {ReferenceObject | SchemaObject} refOrSchema
 * @returns {t.FlowType}
 */
function schemaToAnnotation(refOrSchema) {
  if ('$ref' in refOrSchema) {
    return t.genericTypeAnnotation(
      t.identifier(normalizeRefName(refOrSchema.$ref))
    );
  }
  const schema = refOrSchema;

  const { type, properties } = schema;

  switch (schema.type) {
    case 'array':
      return t.arrayTypeAnnotation(schemaToAnnotation(schema.items));
    case 'string':
      return t.stringTypeAnnotation();
    default:
      debug(`No handler for type ${schema.type}`);
      return t.anyTypeAnnotation();
  }
}
exports.schemaToAnnotation = schemaToAnnotation;
