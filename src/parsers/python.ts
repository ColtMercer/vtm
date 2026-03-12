import toml from 'toml';
import type { Dependency, ManifestParser } from '../types';
import { cleanVersion, dep, isPinnedVersion } from './common';

function parseRequirements(filePath: string, content: string): Dependency[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('=='))
    .map((line) => {
      const [name, version] = line.split('==');
      return dep(name.trim(), cleanVersion(version), 'PyPI', filePath);
    });
}

function parsePipfile(filePath: string, content: string): Dependency[] {
  const data = toml.parse(content) as Record<string, Record<string, string>>;
  const sections = ['packages', 'dev-packages'];
  return sections.flatMap((section) => {
    const packages = data[section] ?? {};
    return Object.entries(packages)
      .map(([name, version]) => [name, typeof version === 'string' ? version : ''] as const)
      .filter(([, version]) => version.includes('=='))
      .map(([name, version]) => dep(name, cleanVersion(version), 'PyPI', filePath));
  });
}

function parsePyProject(filePath: string, content: string): Dependency[] {
  const data = toml.parse(content) as Record<string, any>;
  const deps: Dependency[] = [];
  const projectDeps = data.project?.dependencies;
  if (Array.isArray(projectDeps)) {
    for (const entry of projectDeps) {
      const match = String(entry).match(/^([^\s[<>=!~]+).*==\s*([^;\s]+)/);
      if (match) {
        deps.push(dep(match[1], cleanVersion(match[2]), 'PyPI', filePath));
      }
    }
  }
  const poetryDeps = data.tool?.poetry?.dependencies;
  if (poetryDeps && typeof poetryDeps === 'object') {
    for (const [name, version] of Object.entries(poetryDeps as Record<string, unknown>)) {
      if (name === 'python' || typeof version !== 'string' || !isPinnedVersion(version)) {
        continue;
      }
      deps.push(dep(name, cleanVersion(version), 'PyPI', filePath));
    }
  }
  return deps;
}

export class PythonParser implements ManifestParser {
  parse(filePath: string, content: string): Dependency[] {
    if (filePath.endsWith('requirements.txt')) {
      return parseRequirements(filePath, content);
    }
    if (filePath.endsWith('Pipfile')) {
      return parsePipfile(filePath, content);
    }
    return parsePyProject(filePath, content);
  }
}
