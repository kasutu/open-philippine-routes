import { dirname, join, resolve } from 'path';
import { existsSync } from 'fs';
// libs/registry/src/utils.ts

export function getProjectRoot(): string {
  let current = __dirname;
  while (current !== dirname(current)) {
    if (existsSync(join(current, 'nest-cli.json'))) return current;
    if (existsSync(join(current, 'package.json'))) return current;
    current = dirname(current);
  }
  throw new Error('Project root not found');
}
