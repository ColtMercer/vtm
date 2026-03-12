import type { Dependency, ManifestParser } from '../types';
import { cleanVersion, dep } from './common';

export class GoParser implements ManifestParser {
  parse(filePath: string, content: string): Dependency[] {
    const dependencies: Dependency[] = [];
    let inBlock = false;
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('//')) {
        continue;
      }
      if (line === 'require (') {
        inBlock = true;
        continue;
      }
      if (inBlock && line === ')') {
        inBlock = false;
        continue;
      }
      const candidate = inBlock ? line : line.startsWith('require ') ? line.replace(/^require\s+/, '') : '';
      if (!candidate) {
        continue;
      }
      const parts = candidate.split(/\s+/);
      if (parts.length >= 2) {
        dependencies.push(dep(parts[0], cleanVersion(parts[1]), 'Go', filePath));
      }
    }
    return dependencies;
  }
}
