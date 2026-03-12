import type { Dependency, ManifestParser } from '../types';
import { cleanVersion, dep, isPinnedVersion } from './common';

export class NodeParser implements ManifestParser {
  parse(filePath: string, content: string): Dependency[] {
    const data = JSON.parse(content) as Record<string, Record<string, string>>;
    return ['dependencies', 'devDependencies', 'peerDependencies']
      .flatMap((section) => Object.entries(data[section] ?? {}))
      .filter(([, version]) => isPinnedVersion(version))
      .map(([name, version]) => dep(name, cleanVersion(version), 'npm', filePath));
  }
}
