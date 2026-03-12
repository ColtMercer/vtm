import type { NextFunction, Request, Response } from 'express';
import { createApp } from '../src/app';

jest.mock('../src/db/scans', () => ({
  saveScan: jest.fn().mockResolvedValue(undefined),
  getScan: jest.fn().mockResolvedValue(null)
}));

jest.mock('../src/scanner', () => ({
  runScan: jest.fn().mockResolvedValue({
    scanId: 'scan-1',
    repoPath: '/tmp/repo',
    timestamp: '2026-03-12T00:00:00.000Z',
    dependencyCount: 1,
    vulnCount: 0,
    dependencies: [],
    vulnerableDependencies: [],
    ecosystemSummary: {}
  })
}));

type Layer = {
  route?: {
    path: string;
    stack: Array<{
      method: string;
      handle: (request: Request, response: Response, next: NextFunction) => unknown;
    }>;
  };
};

function findRouteHandler(path: string, method: string) {
  const app = createApp();
  const layers = ((app as unknown as { _router?: { stack?: Layer[] } })._router?.stack ?? []) as Layer[];
  const route = layers.find(
    (layer) => layer.route?.path === path && layer.route.stack.some((entry) => entry.method === method)
  )?.route;

  if (!route) {
    throw new Error(`Route not found: ${method.toUpperCase()} ${path}`);
  }

  const entry = route.stack.find((item) => item.method === method);
  if (!entry) {
    throw new Error(`Handler not found: ${method.toUpperCase()} ${path}`);
  }

  return entry.handle;
}

function createResponseMock() {
  const response = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    }
  };

  return response as Response & { statusCode: number; body: unknown };
}

describe('API app', () => {
  it('returns health status', () => {
    const handler = findRouteHandler('/api/health', 'get');
    const response = createResponseMock();

    handler({} as Request, response, jest.fn());

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('validates scan payload', async () => {
    const handler = findRouteHandler('/api/scan', 'post');
    const response = createResponseMock();
    const next = jest.fn();

    await handler({ body: {} } as Request, response, next);

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ error: 'repoUrl or repoPath is required' });
    expect(next).not.toHaveBeenCalled();
  });
});
