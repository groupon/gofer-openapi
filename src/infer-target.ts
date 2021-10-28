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
import { readFileSync } from 'fs';

import { ScriptTarget } from 'typescript';
import pkgUp from 'pkg-up';
import Debug from 'debug';
import { minVersion, major } from 'semver';

const debug = Debug('gofer:openapi:infer-targets');

export const DEFAULT_TARGET = 'ES2020';

export function inferTarget(): keyof typeof ScriptTarget {
  let pkgJsonPath: string | null = '???';
  try {
    pkgJsonPath = pkgUp.sync();
    if (!pkgJsonPath) {
      debug("Couldn't locate a package.json");
      return DEFAULT_TARGET;
    }

    const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf8')) as {
      engines?: { node?: string };
    };

    const nodeV = pkgJson.engines?.node;
    if (!nodeV) {
      debug(`No engines.node in ${pkgJsonPath}`);
      return DEFAULT_TARGET;
    }

    const minV = minVersion(nodeV);
    if (!minV) {
      debug(`Couldn't infer min node version from ${nodeV} in ${pkgJsonPath}`);
      return DEFAULT_TARGET;
    }

    const target = targetForNodeMajor(major(minV));
    debug(`Chose ${target} because engines.node of ${nodeV} in ${pkgJsonPath}`);
    return target;
  } catch (err) {
    debug(`Failed to parse ${pkgJsonPath || '???'}`, err);
    return DEFAULT_TARGET;
  }
}

// See: https://github.com/microsoft/TypeScript/wiki/Node-Target-Mapping
function targetForNodeMajor(n: number): keyof typeof ScriptTarget {
  if (n < 4) return 'ES5';
  if (n < 8) return 'ES2015';
  if (n < 10) return 'ES2017';
  if (n < 12) return 'ES2018';
  if (n < 14) return 'ES2019';
  if (n < 16) return 'ES2020';
  return 'ES2021';
}
