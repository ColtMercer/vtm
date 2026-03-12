import fs from 'node:fs/promises';
import path from 'node:path';
import { glob } from 'glob';
import type { Dependency, ManifestParser } from '../types';
import { DartParser } from './dart';
import { DotnetParser } from './dotnet';
import { GoParser } from './go';
import { JavaParser } from './java';
import { NodeParser } from './node';
import { PhpParser } from './php';
import { PythonParser } from './python';
import { RubyParser } from './ruby';
import { RustParser } from './rust';

const parserEntries: Array<{ pattern: string; parser: ManifestParser }> = [
  { pattern: '**/requirements.txt', parser: new PythonParser() },
  { pattern: '**/Pipfile', parser: new PythonParser() },
  { pattern: '**/pyproject.toml', parser: new PythonParser() },
  { pattern: '**/package.json', parser: new NodeParser() },
  { pattern: '**/go.mod', parser: new GoParser() },
  { pattern: '**/Cargo.toml', parser: new RustParser() },
  { pattern: '**/Gemfile', parser: new RubyParser() },
  { pattern: '**/composer.json', parser: new PhpParser() },
  { pattern: '**/pom.xml', parser: new JavaParser() },
  { pattern: '**/build.gradle', parser: new JavaParser() },
  { pattern: '**/pubspec.yaml', parser: new DartParser() },
  { pattern: '**/*.csproj', parser: new DotnetParser() }
];

export async function parseRepositoryManifests(repoPath: string): Promise<Dependency[]> {
  const allDependencies: Dependency[] = [];
  for (const entry of parserEntries) {
    const files = await glob(entry.pattern, {
      cwd: repoPath,
      absolute: true,
      ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**', '**/vendor/**', '**/target/**', '**/bin/**', '**/obj/**']
    });
    for (const filePath of files) {
      const content = await fs.readFile(filePath, 'utf8');
      const relativePath = path.relative(repoPath, filePath) || path.basename(filePath);
      allDependencies.push(...entry.parser.parse(relativePath, content));
    }
  }

  const deduped = new Map<string, Dependency>();
  for (const dependency of allDependencies) {
    const key = `${dependency.ecosystem}:${dependency.name}:${dependency.version}:${dependency.manifestPath}`;
    deduped.set(key, dependency);
  }
  return [...deduped.values()];
}
