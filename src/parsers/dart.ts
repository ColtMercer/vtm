import YAML from 'yaml';
import type { Dependency, ManifestParser } from '../types';
import { cleanVersion, dep, isPinnedVersion } from './common';

export class DartParser implements ManifestParser {
  parse(filePath: string, content: string): Dependency[] {
    const data = YAML.parse(content) as Record<string, Record<string, string>>;
    return ['dependencies', 'dev_dependencies']
      .flatMap((section) => Object.entries(data[section] ?? {}))
      .filter(([, version]) => typeof version === 'string' && isPinnedVersion(version))
      .map(([name, version]) => dep(name, cleanVersion(version), 'Pub', filePath));
  }
}
