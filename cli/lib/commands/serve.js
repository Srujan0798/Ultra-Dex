import chalk from 'chalk';
import http from 'http';
import { readFileSafe } from '../utils/files.js';

export function registerServeCommand(program) {
  program
    .command('serve')
    .description('Serve Ultra-Dex context over HTTP (MCP-compatible)')
    .option('-p, --port <port>', 'Port to listen on', '3001')
    .action(async (options) => {
      const port = Number.parseInt(options.port, 10);
      if (Number.isNaN(port)) {
        console.log(chalk.red('Invalid port. Use a numeric value.'));
        process.exit(1);
      }

      const server = http.createServer(async (req, res) => {
        if (!req.url || req.url === '/') {
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('Ultra-Dex MCP Server\n');
          return;
        }

        if (req.url === '/context') {
          const [context, plan, quickStart] = await Promise.all([
            readFileSafe('CONTEXT.md', 'CONTEXT.md'),
            readFileSafe('IMPLEMENTATION-PLAN.md', 'IMPLEMENTATION-PLAN.md'),
            readFileSafe('QUICK-START.md', 'QUICK-START.md'),
          ]);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ files: [context, plan, quickStart] }));
          return;
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      });

      server.listen(port, () => {
        console.log(chalk.green(`\n✅ Ultra-Dex MCP server running on http://localhost:${port}`));
        console.log(chalk.gray('  GET /context -> CONTEXT.md, IMPLEMENTATION-PLAN.md, QUICK-START.md'));
        console.log(chalk.gray('  GET / -> health check\n'));
      });
    });
}
