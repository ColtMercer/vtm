import { parseRepositoryManifests } from './parsers';
import { getMinimumSafeVersion, OsvClient } from './osv/client';
import type { Dependency, OsvVulnerability, ScanReport, VulnerableDependency } from './types';
import { createScanId, ensureRepoPath } from './utils';

function summarizeSeverity(vulnerability: OsvVulnerability): string | undefined {
  return (
    vulnerability.severity?.[0]?.score ??
    vulnerability.affected?.find((item) => item.database_specific?.severity)?.database_specific?.severity
  );
}

export async function runScan(input: {
  repoUrl?: string;
  repoPath?: string;
  osvClient?: OsvClient;
}): Promise<ScanReport> {
  const repoPath = await ensureRepoPath(input);
  const dependencies = await parseRepositoryManifests(repoPath);
  const osvClient = input.osvClient ?? new OsvClient();
  const vulnerabilityMap = await osvClient.queryPackages(dependencies);

  const vulnerableDependencies: VulnerableDependency[] = dependencies
    .map((dependency) => mapVulnerableDependency(dependency, vulnerabilityMap))
    .filter((dependency): dependency is VulnerableDependency => dependency !== null);

  const ecosystemSummary = vulnerableDependencies.reduce<Record<string, number>>((summary, dependency) => {
    summary[dependency.ecosystem] = (summary[dependency.ecosystem] ?? 0) + dependency.vulnerabilities.length;
    return summary;
  }, {});

  return {
    scanId: createScanId(),
    repoUrl: input.repoUrl,
    repoPath,
    timestamp: new Date().toISOString(),
    dependencyCount: dependencies.length,
    vulnCount: vulnerableDependencies.reduce(
      (count, dependency) => count + dependency.vulnerabilities.length,
      0
    ),
    dependencies,
    vulnerableDependencies,
    ecosystemSummary
  };
}

function mapVulnerableDependency(
  dependency: Dependency,
  vulnerabilityMap: Map<string, OsvVulnerability[]>
): VulnerableDependency | null {
  const key = `${dependency.ecosystem}:${dependency.name}:${dependency.version}`;
  const vulnerabilities = vulnerabilityMap.get(key) ?? [];
  if (vulnerabilities.length === 0) {
    return null;
  }

  return {
    ...dependency,
    vulnerabilities: vulnerabilities.map((vulnerability) => ({
      id: vulnerability.id,
      aliases: vulnerability.aliases ?? [],
      summary: vulnerability.summary,
      severity: summarizeSeverity(vulnerability),
      fixedVersion: getMinimumSafeVersion(vulnerability)
    }))
  };
}
