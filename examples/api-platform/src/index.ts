import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error-handler';
import { requestId } from './middleware/request-id';
import { requestLogging } from './middleware/request-logging';
import { healthRouter } from './routes/health';
import { apiRouter } from './routes';

dotenv.config();

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.cors.origins,
    credentials: true,
  })
);
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID and logging
app.use(requestId);
app.use(requestLogging);

// Swagger documentation
if (config.swagger.enabled) {
  const swaggerDocument = YAML.load(path.join(__dirname, '../openapi.yaml'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.get('/openapi.yaml', (req, res) => {
    res.sendFile(path.join(__dirname, '../openapi.yaml'));
  });
}

// Health check (no auth required)
app.use('/health', healthRouter);

// API routes (auth required)
app.use('/v1', apiRouter);
app.use('/v2', apiRouter); // Version 2 routes

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'not_found',
      message: `Cannot ${req.method} ${req.path}`,
    },
  });
});

// Global error handler
app.use(errorHandler);

const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`API Platform server running on port ${PORT}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`Documentation: http://localhost:${PORT}/api-docs`);
});

export default app;
