import { Command } from 'commander';
import { saveScan } from './db/scans';
import { runScan } from './scanner';

async function main(): Promise<void> {
  const program = new Command();
  program
    .name('vtm')
    .description('Vulnerability Tracking Manager CLI')
    .option('--repo-url <url>', 'Git repository URL')
    .option('--repo-path <path>', 'Local repository path')
    .action(async (options: { repoUrl?: string; repoPath?: string }) => {
      if (!options.repoUrl && !options.repoPath) {
        throw new Error('Provide --repo-url or --repo-path');
      }
      const report = await runScan(options);
      await saveScan(report);
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    });

  await program.parseAsync(process.argv);
}

main().catch((error: Error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
