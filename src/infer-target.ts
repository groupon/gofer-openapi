import { readFileSync } from 'fs';

import { ScriptTarget } from 'typescript';
import pkgUp from 'pkg-up';
import Debug from 'debug';
import { minVersion, major } from 'semver';

const debug = Debug('gofer:openapi:infer-targets');

const DEFAULT_TARGET = 'ES2020';

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
