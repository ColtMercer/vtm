import type { ScanRecord, ScanReport } from '../types';
import { getScansCollection } from './mongo';

export async function saveScan(report: ScanReport): Promise<void> {
  const scans = await getScansCollection();
  await scans.createIndex({ scanId: 1 }, { unique: true });
  await scans.insertOne({
    scanId: report.scanId,
    repoUrl: report.repoUrl,
    repoPath: report.repoPath,
    timestamp: new Date(report.timestamp),
    vulnCount: report.vulnCount,
    report
  });
}

export async function getScan(scanId: string): Promise<ScanRecord | null> {
  const scans = await getScansCollection();
  return scans.findOne({ scanId });
}
