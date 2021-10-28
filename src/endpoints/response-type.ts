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
import { resolveRef } from '../refs';
import { schemaToAnnotation } from '../schema';

export default function buildResponseType(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  responses: o.ResponsesObject,
  components: o.ComponentsObject
) {
  // if no response declaration, return Promise<void>
  let typeAnn: t.FlowType = t.voidTypeAnnotation();

  // TODO: handle error statuses too
  const refOrResp = responses[200];
  if (refOrResp) {
    let resp: o.ResponseObject;
    if ('$ref' in refOrResp) {
      resp = resolveRef(refOrResp.$ref, components) as o.ResponseObject;
    } else {
      resp = refOrResp;
    }
    const respSchema = resp.content?.['application/json']?.schema;
    if (respSchema) typeAnn = schemaToAnnotation(respSchema);
  }

  return t.genericTypeAnnotation(
    t.identifier('Promise'),
    t.typeParameterInstantiation([typeAnn])
  );
}
