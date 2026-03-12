# Vulnerability Tracking Manager

VTM is a production-ready Node.js and TypeScript platform that scans source repositories for pinned dependencies, queries OSV.dev for known vulnerabilities, stores reports in MongoDB, and publishes results to Slack.

## Features

- CLI and REST API for local paths or Git URLs
- Manifest discovery across Python, Node.js, Go, Rust, Ruby, PHP, Java, Dart, and .NET
- OSV.dev vulnerability lookups with minimum fixed version recommendations
- MongoDB persistence for historical scan reports
- Slack webhook reporting with prioritized upgrade guidance
- Docker, Railway, GitHub Actions CI, and Jest test coverage

## Requirements

- Node.js 20+
- MongoDB
- Git installed for cloning remote repositories

## Setup

```bash
npm install
cp .env.example .env
npm run build
npm test
```

## Environment Variables

- `PORT` - API port, default `3000`
- `MONGO_URL` - MongoDB connection string
- `SLACK_WEBHOOK_URL` - Slack incoming webhook URL
- `OSV_API_URL` - OSV API endpoint, default `https://api.osv.dev/v1/query`
- `SCAN_CONCURRENCY` - concurrent OSV requests, default `8`

## Run

```bash
npm run dev
```

## CLI Usage

```bash
npm run build
node dist/cli.js --repo-path ./my-project
node dist/cli.js --repo-url https://github.com/example/repo.git
```

## API

### `GET /api/health`

Returns service health.

### `POST /api/scan`

Request body:

```json
{ "repoPath": "./my-project" }
```

or

```json
{ "repoUrl": "https://github.com/example/repo.git" }
```

Returns a full vulnerability report:

```json
{
  "scanId": "uuid",
  "repoPath": "/absolute/path",
  "timestamp": "2026-03-12T00:00:00.000Z",
  "dependencyCount": 10,
  "vulnCount": 2,
  "dependencies": [],
  "vulnerableDependencies": [],
  "ecosystemSummary": {
    "npm": 2
  }
}
```

### `GET /api/report/:scanId`

Returns a previously stored report.

### `POST /api/report/slack/:scanId`

Publishes a formatted Slack report using `SLACK_WEBHOOK_URL`.

## Persistence

Reports are stored in MongoDB collection `scans` with:

- `scanId`
- `repoUrl`
- `repoPath`
- `timestamp`
- `vulnCount`
- `report`

## Docker

```bash
docker build -t vtm .
docker run --env-file .env -p 3000:3000 vtm
```

## Railway

- Uses `Dockerfile` and `railway.toml`
- Set environment variables from `.env.example`
- Start command: `node dist/index.js`

## Testing

```bash
npm test
```

## Notes

- Parsers prioritize pinned versions to improve OSV match quality.
- For manifests with version ranges only, VTM skips entries that cannot be tied to a concrete installed version.
- Remote scans clone into `./tmp` and can be cleaned up after processing.
