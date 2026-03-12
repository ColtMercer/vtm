import axios, { type AxiosInstance } from 'axios';
import { config } from '../config';
import type { Dependency, OsvVulnerability } from '../types';

interface OsvResponse {
  vulns?: OsvVulnerability[];
}

export class OsvClient {
  private readonly httpClient: AxiosInstance;

  constructor(httpClient?: AxiosInstance) {
    this.httpClient =
      httpClient ??
      axios.create({
        baseURL: config.osvApiUrl.replace(/\/v1\/query$/, ''),
        timeout: 15000,
        headers: { 'Content-Type': 'application/json' }
      });
  }

  async queryPackage(dependency: Dependency): Promise<OsvVulnerability[]> {
    const response = await this.httpClient.post<OsvResponse>('/v1/query', {
      package: {
        name: dependency.name,
        ecosystem: dependency.ecosystem
      },
      version: dependency.version
    });
    return response.data.vulns ?? [];
  }

  async queryPackages(
    dependencies: Dependency[]
  ): Promise<Map<string, OsvVulnerability[]>> {
    const entries = await mapWithConcurrency(dependencies, config.scanConcurrency, async (dependency) => {
      const key = `${dependency.ecosystem}:${dependency.name}:${dependency.version}`;
      const vulns = await this.queryPackage(dependency);
      return [key, vulns] as const;
    });
    return new Map(entries);
  }
}

async function mapWithConcurrency<TInput, TOutput>(
  items: TInput[],
  concurrency: number,
  mapper: (item: TInput, index: number) => Promise<TOutput>
): Promise<TOutput[]> {
  if (items.length === 0) {
    return [];
  }

  const safeConcurrency = Math.max(1, Math.floor(concurrency));
  const results = new Array<TOutput>(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(safeConcurrency, items.length) }, async () => worker())
  );

  return results;
}

export function getMinimumSafeVersion(vulnerability: OsvVulnerability): string | undefined {
  const fixedVersions = (vulnerability.affected ?? [])
    .flatMap((affected) => affected.ranges ?? [])
    .flatMap((range) => range.events ?? [])
    .map((event) => event.fixed)
    .filter((value): value is string => Boolean(value));

  return fixedVersions.sort(compareVersions)[0];
}

function compareVersions(left: string, right: string): number {
  const leftParts = left.split(/[.-]/).map(normalizePart);
  const rightParts = right.split(/[.-]/).map(normalizePart);
  const length = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < length; index += 1) {
    const leftPart = leftParts[index] ?? 0;
    const rightPart = rightParts[index] ?? 0;
    if (leftPart === rightPart) {
      continue;
    }
    if (typeof leftPart === 'number' && typeof rightPart === 'number') {
      return leftPart - rightPart;
    }
    return String(leftPart).localeCompare(String(rightPart));
  }
  return 0;
}

function normalizePart(value: string): number | string {
  return /^\d+$/.test(value) ? Number.parseInt(value, 10) : value;
}
