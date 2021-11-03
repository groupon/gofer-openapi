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
import type { OpenAPIV3 as o } from 'openapi-types';
import Debug from 'debug';

import { resolveRef } from '../refs';
import { schemaToAnnotation } from '../schema';

const debug = Debug('gofer:openapi:response-type');

export default function buildResponseType(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  responses: o.ResponsesObject,
  components: o.ComponentsObject
): { goferMethod: string; responseType: t.FlowType; acceptMimeType?: string } {
  // TODO: handle error statuses too

  // Right now, for success, there's a few possibilities, in decreasing order
  // of preference:
  //
  // 1. application/json exists:
  //    * call .json()
  //    * have return type be based on .content.schema if possible, else "any"
  // 2. one of our known text types exists (xml, yaml, etc)
  //    * call .text()
  //    * send { headers: { Accept: <that type> } }
  //    * return type is "string"
  // 3. any other unknown type(s) exist
  //    * call .rawBody()
  //    * return type is Buffer
  // 4. we specifically have a no-content response code (201, 204, etc)
  //    * call .rawBody() to resolve the output promise
  //    * return type is unknown (should be void, but that's more annoying)
  // 5. nothing exists - assume a crummy schema and try to be as helpful as
  //    possible
  //    * call .json()
  //    * return type is "any"

  const refOrResp = responses[200];
  if (refOrResp) {
    let resp: o.ResponseObject;
    if ('$ref' in refOrResp) {
      resp = resolveRef(refOrResp.$ref, components) as o.ResponseObject;
    } else {
      resp = refOrResp;
    }
    const content = resp.content || {};
    let textType: string | null;
    if ('application/json' in content) {
      const respSchema = content['application/json']?.schema;
      // (1)
      return {
        goferMethod: 'json',
        responseType: respSchema
          ? schemaToAnnotation(respSchema, ['application/json'])
          : t.anyTypeAnnotation(),
      };
    } else if ((textType = findTextType(content))) {
      // (2)
      debug('Found text mime type %s', textType);
      return {
        goferMethod: 'text',
        responseType: t.stringTypeAnnotation(),
        // if there's only one type specified, no need for Accept header
        acceptMimeType: Object.keys(content).length > 1 ? textType : undefined,
      };
    } else if (Object.keys(content).length > 0) {
      // (3)
      debug(
        'Found unknown mime type(s); returning Buffer: ',
        Object.keys(content)
      );
      return {
        goferMethod: 'rawBody',
        responseType: t.genericTypeAnnotation(t.identifier('Buffer')),
      };
    }
  } else if (
    responses[201] ||
    responses[202] ||
    responses[203] ||
    responses[204]
  ) {
    // (4)
    debug('Found no-content status code; returning unknown');
    return {
      goferMethod: 'rawBody',
      responseType: t.genericTypeAnnotation(t.identifier('unknown')),
    };
  }

  // (5)
  debug('Found no good responses.200.content; returning any');
  return { goferMethod: 'json', responseType: t.anyTypeAnnotation() };
}

/**
 * returns the most preferred mime type, if found
 */
function findTextType(content: Record<string, unknown>): string | null {
  for (const mt of [
    'text/yaml',
    'application/yaml',
    'text/xml',
    'application/xml',
    'text/plain',
    'text/html',
  ]) {
    if (mt in content) return mt;
  }
  return null;
}
