import type { Dependency, Ecosystem } from '../types';

export function dep(
  name: string,
  version: string,
  ecosystem: Ecosystem,
  manifestPath: string
): Dependency {
  return { name, version, ecosystem, manifestPath };
}

export function cleanVersion(version: string): string {
  return version
    .trim()
    .replace(/^[=~^<>!\s]+/, '')
    .replace(/^v/i, '')
    .replace(/[;,)].*$/, '')
    .trim();
}

export function isPinnedVersion(version: string): boolean {
  if (!version.trim()) {
    return false;
  }
  return !/[><*]|\bx\b/i.test(version);
}
