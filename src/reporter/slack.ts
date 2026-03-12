import axios from 'axios';
import { config } from '../config';
import type { ScanReport, VulnerableDependency } from '../types';

export function formatSlackMessage(report: ScanReport): string {
  const ecosystemLines = Object.entries(report.ecosystemSummary)
    .sort((left, right) => right[1] - left[1])
    .map(([ecosystem, count]) => `• ${ecosystem}: ${count}`)
    .join('\n');

  const critical = report.vulnerableDependencies
    .flatMap((dependency) =>
      dependency.vulnerabilities.map((vulnerability) => ({
        packageName: dependency.name,
        version: dependency.version,
        vulnerability
      }))
    )
    .filter((entry) => (entry.vulnerability.severity ?? '').toUpperCase().includes('CRITICAL'))
    .slice(0, 5)
    .map(
      (entry) =>
        `• ${entry.vulnerability.id} in ${entry.packageName}@${entry.version} → ${entry.vulnerability.fixedVersion ?? 'No fix listed'}`
    )
    .join('\n');

  const recommendations = topRecommendations(report.vulnerableDependencies)
    .map((item) => `• ${item.name}@${item.version} → ${item.recommendation}`)
    .join('\n');

  return [
    `*VTM Scan Report*`,
    `Scan ID: ${report.scanId}`,
    `Repository: ${report.repoUrl ?? report.repoPath}`,
    `Dependencies: ${report.dependencyCount}`,
    `Vulnerabilities: ${report.vulnCount}`,
    '',
    '*Vulnerabilities by Ecosystem*',
    ecosystemLines || '• None',
    '',
    '*Top 5 Critical CVEs*',
    critical || '• None',
    '',
    '*Upgrade Recommendations*',
    recommendations || '• None'
  ].join('\n');
}

function topRecommendations(vulnerableDependencies: VulnerableDependency[]): Array<{
  name: string;
  version: string;
  recommendation: string;
}> {
  return vulnerableDependencies
    .map((dependency) => ({
      name: dependency.name,
      version: dependency.version,
      recommendation:
        dependency.vulnerabilities
          .map((vulnerability) => vulnerability.fixedVersion)
          .find((value): value is string => Boolean(value)) ?? 'Review manually'
    }))
    .slice(0, 10);
}

export async function sendSlackReport(report: ScanReport): Promise<void> {
  if (!config.slackWebhookUrl) {
    throw new Error('SLACK_WEBHOOK_URL is not configured');
  }

  await axios.post(config.slackWebhookUrl, {
    text: formatSlackMessage(report)
  });
}
