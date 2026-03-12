export type Ecosystem =
  | 'PyPI'
  | 'npm'
  | 'Go'
  | 'crates.io'
  | 'RubyGems'
  | 'Packagist'
  | 'Maven'
  | 'Pub'
  | 'NuGet';

export interface Dependency {
  name: string;
  version: string;
  ecosystem: Ecosystem;
  manifestPath: string;
}

export interface AffectedRangeEvent {
  introduced?: string;
  fixed?: string;
  last_affected?: string;
}

export interface OsvVulnerability {
  id: string;
  summary?: string;
  details?: string;
  aliases?: string[];
  modified?: string;
  published?: string;
  severity?: Array<{ type: string; score: string }>;
  affected?: Array<{
    package?: { ecosystem?: string; name?: string };
    ranges?: Array<{ events?: AffectedRangeEvent[] }>;
    database_specific?: { severity?: string };
  }>;
}

export interface VulnerableDependency extends Dependency {
  vulnerabilities: Array<{
    id: string;
    aliases: string[];
    summary?: string;
    severity?: string;
    fixedVersion?: string;
  }>;
}

export interface ScanReport {
  scanId: string;
  repoUrl?: string;
  repoPath: string;
  timestamp: string;
  dependencyCount: number;
  vulnCount: number;
  dependencies: Dependency[];
  vulnerableDependencies: VulnerableDependency[];
  ecosystemSummary: Record<string, number>;
}

export interface ScanRecord {
  scanId: string;
  repoUrl?: string;
  repoPath: string;
  timestamp: Date;
  vulnCount: number;
  report: ScanReport;
}

export interface ManifestParser {
  parse(filePath: string, content: string): Dependency[];
}
