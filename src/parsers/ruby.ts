import type { Dependency, ManifestParser } from '../types';
import { cleanVersion, dep } from './common';

export class RubyParser implements ManifestParser {
  parse(filePath: string, content: string): Dependency[] {
    return content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .map((line) => line.match(/^gem\s+['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]/))
      .filter((match): match is RegExpMatchArray => Boolean(match))
      .map((match) => dep(match[1], cleanVersion(match[2]), 'RubyGems', filePath));
  }
}
