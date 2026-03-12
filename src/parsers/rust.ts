import toml from 'toml';
import type { Dependency, ManifestParser } from '../types';
import { cleanVersion, dep, isPinnedVersion } from './common';

export class RustParser implements ManifestParser {
  parse(filePath: string, content: string): Dependency[] {
    const data = toml.parse(content) as Record<string, Record<string, string | Record<string, string>>>;
    return Object.entries(data.dependencies ?? {})
      .map(([name, spec]) => {
        if (typeof spec === 'string') {
          return [name, spec] as const;
        }
        return [name, spec.version ?? ''] as const;
      })
      .filter(([, version]) => isPinnedVersion(version))
      .map(([name, version]) => dep(name, cleanVersion(version), 'crates.io', filePath));
  }
}
