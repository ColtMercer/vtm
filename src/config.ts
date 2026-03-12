import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number.parseInt(process.env.PORT ?? '3000', 10),
  mongoUrl:
    process.env.MONGO_URL ??
    'mongodb://opus:opus_dev@localhost:27017/vtm?authSource=admin',
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL ?? '',
  osvApiUrl: process.env.OSV_API_URL ?? 'https://api.osv.dev/v1/query',
  scanConcurrency: Number.parseInt(process.env.SCAN_CONCURRENCY ?? '8', 10)
};
