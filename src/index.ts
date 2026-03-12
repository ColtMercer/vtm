import { createApp } from './app';
import { config } from './config';

const app = createApp();

if (require.main === module) {
  app.listen(config.port, () => {
    process.stdout.write(`VTM API listening on port ${config.port}\n`);
  });
}

export default app;
