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
import camelCase from 'lodash.camelcase';
import upperFirst from 'lodash.upperfirst';
import type { OpenAPIV3 } from 'openapi-types';

const COMP_REF_RE = /^#\/components\/([a-z]+(?:[A-Z][a-z]*)*)\/([^/]+)$/;

export function normalizeRefName(kind: string, name: string) {
  if (kind === 'schemas') kind = '';
  return upperFirst(camelCase(`${kind}.${name}`));
}

/**
 * Converts #/components/requestBodies/someThing
 *       to RequestBodiesSomeThing
 */
export function normalizeRefPath($ref: string): string {
  const m = $ref.match(COMP_REF_RE);
  if (!m) throw new Error(`Failed to normalize name for $ref: ${$ref}`);
  return normalizeRefName(m[1], m[2]);
}

export function resolveMaybeRef<T>(
  maybeRef: OpenAPIV3.ReferenceObject | T,
  components: OpenAPIV3.ComponentsObject
): T {
  return '$ref' in maybeRef
    ? (resolveRef(maybeRef.$ref, components) as T)
    : maybeRef;
}

export function resolveRef(
  $ref: string,
  components: OpenAPIV3.ComponentsObject
) {
  const m = $ref.match(COMP_REF_RE);
  if (!m) throw new Error(`Can't de-ref $ref: ${$ref}`);
  const type = m[1] as keyof OpenAPIV3.ComponentsObject;
  const name = m[2];

  const compsType = components[type];
  if (!compsType) throw new Error(`Couldn't find ${type} in components`);
  const res = compsType[name];
  if (!res) throw new Error(`Couldn't find ${name} in components.${type}`);
  return res;
}
