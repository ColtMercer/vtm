import express, { type NextFunction, type Request, type Response } from 'express';
import { getScan, saveScan } from './db/scans';
import { sendSlackReport } from './reporter/slack';
import { runScan } from './scanner';

type ScanRouteParams = {
  scanId: string;
};

export function createApp(): express.Express {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/', (_request: Request, response: Response) => {
    response.send(`
<!DOCTYPE html><html><head><meta charset="utf-8"><title>VTM</title>
<style>body{font-family:monospace;background:#0d1117;color:#e6edf3;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
.box{text-align:center}h1{font-size:2rem;margin-bottom:.5rem}p{color:#8b949e;margin:.25rem 0}a{color:#58a6ff;text-decoration:none}a:hover{text-decoration:underline}</style>
</head><body><div class="box">
<h1>🔍 VTM</h1><p>Vulnerability Tracking Manager</p><br>
<p><a href="/api/health">GET /api/health</a></p>
<p><a href="#">POST /api/scan</a> — { repoUrl } or { repoPath }</p>
<p><a href="#">GET /api/report/:scanId</a></p>
<p><a href="#">POST /api/report/slack/:scanId</a></p>
</div></body></html>`);
  });

  app.get('/api/health', (_request: Request, response: Response) => {
    response.json({ status: 'ok' });
  });

  app.post('/api/scan', async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { repoUrl, repoPath } = request.body as { repoUrl?: string; repoPath?: string };
      if (!repoUrl && !repoPath) {
        response.status(400).json({ error: 'repoUrl or repoPath is required' });
        return;
      }

      const report = await runScan({ repoUrl, repoPath });
      await saveScan(report);
      response.status(201).json(report);
    } catch (error) {
      next(error);
    }
  });

  app.get(
    '/api/report/:scanId',
    async (request: Request<ScanRouteParams>, response: Response, next: NextFunction) => {
      try {
        const { scanId } = request.params;
        const record = await getScan(scanId);
        if (!record) {
          response.status(404).json({ error: 'Scan not found' });
          return;
        }
        response.json(record.report);
      } catch (error) {
        next(error);
      }
    }
  );

  app.post(
    '/api/report/slack/:scanId',
    async (request: Request<ScanRouteParams>, response: Response, next: NextFunction) => {
      try {
        const { scanId } = request.params;
        const record = await getScan(scanId);
        if (!record) {
          response.status(404).json({ error: 'Scan not found' });
          return;
        }
        await sendSlackReport(record.report);
        response.json({ status: 'sent' });
      } catch (error) {
        next(error);
      }
    }
  );

  app.use((error: Error, _request: Request, response: Response, _next: NextFunction) => {
    const lowerMessage = error.message.toLowerCase();
    const statusCode =
      lowerMessage.includes('required') || lowerMessage.includes('does not exist') ? 400 : 500;
    response.status(statusCode).json({ error: error.message });
  });

  return app;
}
