/*
 * Copyright (c) 2021, Groupon, Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 *    this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its contributors
 *    may be used to endorse or promote products derived from this software
 *    without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */
import * as t from '@babel/types';
import type { OpenAPIV3 } from 'openapi-types';
import Debug from 'debug';

import { normalizeRefPath } from './refs';

const debug = Debug('gofer:openapi:schema');

function objectTypeAnnotation({
  properties = {},
  required = [],
  additionalProperties,
}: OpenAPIV3.NonArraySchemaObject) {
  const addPropAnn =
    !!additionalProperties &&
    typeof additionalProperties === 'object' &&
    t.genericTypeAnnotation(
      t.identifier('Record'),
      t.typeParameterInstantiation([
        t.stringTypeAnnotation(),
        schemaToAnnotation(additionalProperties),
      ])
    );

  const objAnn = t.objectTypeAnnotation(
    Object.entries(properties).map(([key, propSchema]) =>
      Object.assign(
        t.objectTypeProperty(
          t.isValidIdentifier(key) ? t.identifier(key) : t.stringLiteral(key),
          schemaToAnnotation(propSchema)
        ),
        { optional: !required.includes(key) }
      )
    )
  );

  if (addPropAnn) {
    // if the object is *all* additional properties, just return the Record<>
    // if there are additional properties, include them &'ed with the object
    // type to make an open object
    return Object.keys(properties).length === 0
      ? addPropAnn
      : t.intersectionTypeAnnotation([objAnn, addPropAnn]);
  }

  return objAnn;
}

export function schemaToAnnotation(
  refOrSchema: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject
): t.FlowType {
  if ('$ref' in refOrSchema) {
    return t.genericTypeAnnotation(
      t.identifier(normalizeRefPath(refOrSchema.$ref))
    );
  }
  const schema = refOrSchema;

  const { type, anyOf, allOf, enum: enoom } = schema;

  if (anyOf) return t.unionTypeAnnotation(anyOf.map(schemaToAnnotation));
  if (allOf) return t.intersectionTypeAnnotation(allOf.map(schemaToAnnotation));

  switch (type) {
    case 'array':
      return t.arrayTypeAnnotation(schemaToAnnotation(schema.items));
    case 'string':
      if (enoom) {
        return t.unionTypeAnnotation(
          enoom.map(e => t.stringLiteralTypeAnnotation(e as string))
        );
      }
      return t.stringTypeAnnotation();
    case 'number':
    case 'integer':
      if (enoom) {
        return t.unionTypeAnnotation(
          enoom.map(e => t.numberLiteralTypeAnnotation(e as number))
        );
      }
      return t.numberTypeAnnotation();
    case 'boolean':
      return t.booleanTypeAnnotation();
    case 'object':
      return objectTypeAnnotation(schema);
    default:
      debug(`No handler for type ${type || '<empty>'}`);
      return t.anyTypeAnnotation();
  }
}
