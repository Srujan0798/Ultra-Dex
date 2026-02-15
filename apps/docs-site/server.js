// apps/docs-site/server.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Proxy API requests to main Ultra-Dex server
app.use('/api', createProxyMiddleware({
  target: process.env.ULTRA_DEX_API_URL || 'http://localhost:3000',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api/v1'
  }
}));

// Documentation routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'docs', 'index.html'));
});

app.get('/docs/:section', (req, res) => {
  const section = req.params.section;
  const filePath = path.join(__dirname, 'public', 'docs', section, 'index.html');
  
  // Check if file exists, otherwise serve docs home
  res.sendFile(filePath, (err) => {
    if (err) {
      res.sendFile(path.join(__dirname, 'public', 'docs', 'index.html'));
    }
  });
});

// API documentation
app.get('/api-docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'api', 'index.html'));
});

// Interactive API explorer
app.get('/api-explorer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'api', 'explorer.html'));
});

// Search functionality
app.get('/search', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'search.html'));
});

// Community routes
app.get('/community', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'community', 'index.html'));
});

app.get('/community/:page', (req, res) => {
  const page = req.params.page;
  res.sendFile(path.join(__dirname, 'public', 'community', `${page}.html`));
});

// Start server
app.listen(PORT, () => {
  console.log(`Documentation site running on port ${PORT}`);
  console.log(`API proxy target: ${process.env.ULTRA_DEX_API_URL || 'http://localhost:3000'}`);
});

export default app;