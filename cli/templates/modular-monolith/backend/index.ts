import { createServer } from 'http';

const server = createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok' }));
});

server.listen(3001, () => console.log('Modular monolith API on 3001'));
