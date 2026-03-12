import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export function createScanId(): string {
  return crypto.randomUUID();
}

export async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureRepoPath(input: { repoUrl?: string; repoPath?: string }): Promise<string> {
  if (input.repoPath) {
    const resolvedPath = path.resolve(input.repoPath);
    if (!(await pathExists(resolvedPath))) {
      throw new Error(`Repository path does not exist: ${resolvedPath}`);
    }
    return resolvedPath;
  }

  if (!input.repoUrl) {
    throw new Error('Either repoUrl or repoPath is required');
  }

  const tempDir = path.join(process.cwd(), 'tmp', crypto.randomUUID());
  await fs.mkdir(tempDir, { recursive: true });
  try {
    await execFileAsync('git', ['clone', '--depth', '1', input.repoUrl, tempDir]);
  } catch (error) {
    throw new Error(`Failed to clone repository: ${(error as Error).message}`);
  }
  return tempDir;
}
