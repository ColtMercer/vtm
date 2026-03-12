import { XMLParser } from 'fast-xml-parser';
import type { Dependency, ManifestParser } from '../types';
import { cleanVersion, dep, isPinnedVersion } from './common';

function arrayify<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

export class JavaParser implements ManifestParser {
  parse(filePath: string, content: string): Dependency[] {
    if (filePath.endsWith('pom.xml')) {
      const parser = new XMLParser({ ignoreAttributes: false });
      const xml = parser.parse(content) as any;
      return arrayify(xml.project?.dependencies?.dependency)
        .map((entry) => ({
          name: `${entry.groupId}:${entry.artifactId}`,
          version: String(entry.version ?? '')
        }))
        .filter((entry) => isPinnedVersion(entry.version))
        .map((entry) => dep(entry.name, cleanVersion(entry.version), 'Maven', filePath));
    }

    return content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .map((line) => line.match(/['"]([\w.-]+):([\w.-]+):([^'"]+)['"]/))
      .filter((match): match is RegExpMatchArray => Boolean(match))
      .map((match) => dep(`${match[1]}:${match[2]}`, cleanVersion(match[3]), 'Maven', filePath));
  }
}
