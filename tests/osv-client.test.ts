import type { AxiosInstance } from 'axios';
import { OsvClient, getMinimumSafeVersion } from '../src/osv/client';

describe('OsvClient', () => {
  it('queries OSV with package and version', async () => {
    const post = jest.fn().mockResolvedValue({ data: { vulns: [{ id: 'CVE-1' }] } });
    const client = new OsvClient({ post } as unknown as AxiosInstance);
    const result = await client.queryPackage({
      name: 'express',
      version: '4.21.2',
      ecosystem: 'npm',
      manifestPath: 'package.json'
    });
    expect(post).toHaveBeenCalledWith('/v1/query', {
      package: { name: 'express', ecosystem: 'npm' },
      version: '4.21.2'
    });
    expect(result).toEqual([{ id: 'CVE-1' }]);
  });

  it('extracts minimum safe version', () => {
    expect(
      getMinimumSafeVersion({
        id: 'CVE-1',
        affected: [{ ranges: [{ events: [{ fixed: '2.0.0' }, { fixed: '1.5.0' }] }] }]
      })
    ).toBe('1.5.0');
  });
});
