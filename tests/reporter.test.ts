import { formatSlackMessage } from '../src/reporter/slack';
import type { ScanReport } from '../src/types';

describe('Slack formatter', () => {
  it('formats a readable report', () => {
    const report: ScanReport = {
      scanId: 'scan-1',
      repoPath: '/tmp/repo',
      timestamp: new Date().toISOString(),
      dependencyCount: 2,
      vulnCount: 1,
      dependencies: [],
      ecosystemSummary: { npm: 1 },
      vulnerableDependencies: [
        {
          name: 'express',
          version: '4.0.0',
          ecosystem: 'npm',
          manifestPath: 'package.json',
          vulnerabilities: [
            {
              id: 'CVE-2024-0001',
              aliases: ['GHSA-123'],
              severity: 'CRITICAL',
              fixedVersion: '4.21.2'
            }
          ]
        }
      ]
    };

    const message = formatSlackMessage(report);
    expect(message).toContain('VTM Scan Report');
    expect(message).toContain('express@4.0.0 → 4.21.2');
    expect(message).toContain('npm: 1');
  });
});
