import { XMLParser } from 'fast-xml-parser';
import type { Dependency, ManifestParser } from '../types';
import { cleanVersion, dep, isPinnedVersion } from './common';

export class DotnetParser implements ManifestParser {
  parse(filePath: string, content: string): Dependency[] {
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
    const xml = parser.parse(content) as any;
    const itemGroups = xml.Project?.ItemGroup;
    const groups = Array.isArray(itemGroups) ? itemGroups : itemGroups ? [itemGroups] : [];
    return groups
      .flatMap((group: any) => {
        const refs = group.PackageReference;
        return Array.isArray(refs) ? refs : refs ? [refs] : [];
      })
      .map((entry: any) => ({ name: String(entry.Include ?? ''), version: String(entry.Version ?? '') }))
      .filter((entry: { name: string; version: string }) => entry.name && isPinnedVersion(entry.version))
      .map((entry: { name: string; version: string }) => dep(entry.name, cleanVersion(entry.version), 'NuGet', filePath));
  }
}
