import type { Dependency, ManifestParser } from '../types';
import { cleanVersion, dep, isPinnedVersion } from './common';

export class PhpParser implements ManifestParser {
  parse(filePath: string, content: string): Dependency[] {
    const data = JSON.parse(content) as Record<string, Record<string, string>>;
    return ['require', 'require-dev']
      .flatMap((section) => Object.entries(data[section] ?? {}))
      .filter(([name, version]) => name !== 'php' && isPinnedVersion(version))
      .map(([name, version]) => dep(name, cleanVersion(version), 'Packagist', filePath));
  }
}
