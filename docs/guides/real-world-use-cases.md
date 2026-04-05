# Real-World Use Cases

This guide demonstrates practical applications of Ultra-Dex in real-world scenarios, including complete code examples and deployment strategies.

## API Development Platform

Build a complete REST API with authentication, database integration, and automated documentation using Ultra-Dex.

### Project Structure

```
examples/api-development/
├── src/
│   ├── controllers/
│   ├── models/
│   ├── middleware/
│   ├── routes/
│   └── services/
├── tests/
├── docs/
├── docker-compose.yml
└── package.json
```

### Complete API Implementation

```javascript
// examples/api-development/src/index.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { UltraDex } from '@ultra-dex/sdk';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import apiRoutes from './routes/apis.js';

const app = express();
const port = process.env.PORT || 3000;

// Initialize Ultra-Dex for API generation
const ultraDex = new UltraDex({
  apiKey: process.env.ULTRA_DEX_API_KEY,
  providers: {
    openai: { apiKey: process.env.OPENAI_API_KEY },
  },
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// API generation endpoint
app.post('/generate-api', async (req, res) => {
  try {
    const { spec, language = 'javascript' } = req.body;

    const result = await ultraDex.execute(
      `Generate a complete ${language} API with the following specification: ${JSON.stringify(spec)}`,
      {
        mode: 'detailed',
        agents: ['api-developer', 'database-admin', 'tester'],
      }
    );

    res.json({
      success: true,
      api: result.results,
      documentation: result.results?.docs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Standard API routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/apis', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`API Development Platform running on port ${port}`);
});
```

```javascript
// examples/api-development/src/routes/apis.js
import express from 'express';
import { UltraDex } from '@ultra-dex/sdk';

const router = express.Router();
const ultraDex = new UltraDex();

// Generate API documentation
router.post('/:id/docs', async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'markdown' } = req.query;

    const result = await ultraDex.execute(
      `Generate comprehensive ${format} documentation for API ${id}`,
      { mode: 'detailed' }
    );

    res.json({
      apiId: id,
      documentation: result.results?.docs,
      format,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate API tests
router.post('/:id/tests', async (req, res) => {
  try {
    const { id } = req.params;
    const { type = 'unit' } = req.query;

    const result = await ultraDex.execute(`Generate ${type} tests for API ${id}`, {
      mode: 'detailed',
      agents: ['tester', 'qa-engineer'],
    });

    res.json({
      apiId: id,
      tests: result.results?.tests,
      coverage: result.results?.coverage,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deploy API
router.post('/:id/deploy', async (req, res) => {
  try {
    const { id } = req.params;
    const { environment = 'staging' } = req.body;

    const result = await ultraDex.execute(`Deploy API ${id} to ${environment} environment`, {
      mode: 'detailed',
      agents: ['devops-engineer', 'infrastructure-admin'],
    });

    res.json({
      apiId: id,
      deployment: result.results?.deployment,
      environment,
      status: result.status,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

### Database Models

```javascript
// examples/api-development/src/models/Api.js
import mongoose from 'mongoose';

const apiSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  version: { type: String, default: '1.0.0' },
  endpoints: [
    {
      path: { type: String, required: true },
      method: {
        type: String,
        enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        required: true,
      },
      description: String,
      parameters: [
        {
          name: String,
          type: String,
          required: Boolean,
          description: String,
        },
      ],
      responses: [
        {
          status: Number,
          description: String,
          schema: mongoose.Schema.Types.Mixed,
        },
      ],
    },
  ],
  database: {
    type: String,
    enum: ['mongodb', 'postgresql', 'mysql'],
    default: 'mongodb',
  },
  authentication: {
    type: String,
    enum: ['none', 'jwt', 'oauth2', 'api-key'],
    default: 'none',
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('Api', apiSchema);
```

### Testing Suite

```javascript
// examples/api-development/tests/api-generation.test.js
import { expect } from 'chai';
import { UltraDex } from '@ultra-dex/sdk';
import request from 'supertest';
import app from '../src/index.js';

describe('API Generation', () => {
  let ultraDex;

  before(async () => {
    ultraDex = new UltraDex({
      providers: {
        openai: { apiKey: process.env.OPENAI_API_KEY },
      },
    });
  });

  it('should generate a complete REST API', async () => {
    const spec = {
      name: 'User Management API',
      endpoints: [
        {
          path: '/users',
          method: 'GET',
          description: 'Get all users',
        },
        {
          path: '/users',
          method: 'POST',
          description: 'Create a new user',
        },
      ],
    };

    const response = await request(app)
      .post('/generate-api')
      .send({ spec, language: 'javascript' })
      .expect(200);

    expect(response.body.success).to.be.true;
    expect(response.body.api).to.have.property('controllers');
    expect(response.body.api).to.have.property('models');
    expect(response.body.api).to.have.property('routes');
  });

  it('should generate API documentation', async () => {
    const response = await request(app)
      .post('/apis/123/docs')
      .query({ format: 'markdown' })
      .expect(200);

    expect(response.body.documentation).to.be.a('string');
    expect(response.body.documentation).to.include('# API Documentation');
  });

  it('should generate API tests', async () => {
    const response = await request(app)
      .post('/apis/123/tests')
      .query({ type: 'integration' })
      .expect(200);

    expect(response.body.tests).to.be.an('array');
    expect(response.body.coverage).to.have.property('lines');
  });
});
```

### Docker Configuration

```yaml
# examples/api-development/docker-compose.yml
version: '3.8'
services:
  api-platform:
    build: .
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongodb:27017/api-platform
      - ULTRA_DEX_API_KEY=${ULTRA_DEX_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - mongodb
    volumes:
      - .:/app
      - /app/node_modules

  mongodb:
    image: mongo:7
    ports:
      - '27017:27017'
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

## Data Processing Pipeline

Build an intelligent data processing system that can handle various data formats, perform transformations, and generate insights.

### Project Structure

```
examples/data-processing/
├── src/
│   ├── processors/
│   ├── transformers/
│   ├── analyzers/
│   ├── storage/
│   └── queue/
├── config/
├── tests/
├── docs/
└── docker-compose.yml
```

### Main Processing Engine

```javascript
// examples/data-processing/src/engine.js
import { UltraDex } from '@ultra-dex/sdk';
import { DataProcessor } from './processors/DataProcessor.js';
import { QueueManager } from './queue/QueueManager.js';
import { StorageManager } from './storage/StorageManager.js';

export class DataProcessingEngine {
  constructor(config) {
    this.ultraDex = new UltraDex(config.ultraDex);
    this.processor = new DataProcessor(config.processing);
    this.queue = new QueueManager(config.queue);
    this.storage = new StorageManager(config.storage);
  }

  async processPipeline(pipelineSpec) {
    const { input, transformations = [], analysis = [], output } = pipelineSpec;

    try {
      // Load input data
      const rawData = await this.storage.load(input);

      // Execute transformations
      let processedData = rawData;
      for (const transform of transformations) {
        const result = await this.ultraDex.execute(
          `Apply ${transform.type} transformation: ${JSON.stringify(transform.config)}`,
          {
            mode: 'detailed',
            agents: ['data-engineer', 'etl-specialist'],
          }
        );
        processedData = result.results?.transformedData || processedData;
      }

      // Perform analysis
      const insights = [];
      for (const analysisConfig of analysis) {
        const result = await this.ultraDex.execute(
          `Analyze data with ${analysisConfig.type}: ${JSON.stringify(analysisConfig.config)}`,
          {
            mode: 'detailed',
            agents: ['data-scientist', 'analyst'],
          }
        );
        insights.push(result.results?.insights);
      }

      // Generate output
      const finalResult = {
        originalData: input,
        processedData,
        insights,
        metadata: {
          processingTime: Date.now(),
          transformations: transformations.length,
          analyses: analysis.length,
        },
      };

      await this.storage.save(output, finalResult);

      return {
        success: true,
        resultId: output.id,
        insights: insights.length,
      };
    } catch (error) {
      console.error('Pipeline processing failed:', error);
      throw error;
    }
  }

  async processBatch(batchSpec) {
    const { jobs, concurrency = 3 } = batchSpec;

    const results = [];
    for (let i = 0; i < jobs.length; i += concurrency) {
      const batch = jobs.slice(i, i + concurrency);
      const batchPromises = batch.map((job) =>
        this.processPipeline(job).catch((error) => ({
          jobId: job.id,
          error: error.message,
          success: false,
        }))
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return {
      totalJobs: jobs.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }
}
```

### Data Processors

```javascript
// examples/data-processing/src/processors/DataProcessor.js
import csv from 'csv-parser';
import { createReadStream } from 'fs';
import { Transform } from 'stream';

export class DataProcessor {
  constructor(config) {
    this.config = config;
  }

  async processFile(filePath, format) {
    switch (format) {
      case 'csv':
        return this.processCSV(filePath);
      case 'json':
        return this.processJSON(filePath);
      case 'xml':
        return this.processXML(filePath);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  processCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', reject);
    });
  }

  async processJSON(filePath) {
    const fs = await import('fs/promises');
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  }

  async processXML(filePath) {
    const fs = await import('fs/promises');
    const content = await fs.readFile(filePath, 'utf8');
    // Use xml2js or similar for XML parsing
    const { parseStringPromise } = await import('xml2js');
    return parseStringPromise(content);
  }

  createTransformStream(transformFn) {
    return new Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        try {
          const transformed = transformFn(chunk);
          callback(null, transformed);
        } catch (error) {
          callback(error);
        }
      },
    });
  }

  validateData(data, schema) {
    // Implement data validation logic
    const errors = [];

    if (schema.required) {
      for (const field of schema.required) {
        if (!data[field]) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    if (schema.types) {
      for (const [field, expectedType] of Object.entries(schema.types)) {
        const value = data[field];
        if (value && typeof value !== expectedType) {
          errors.push(`Field ${field} should be ${expectedType}, got ${typeof value}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
```

### Queue Management

```javascript
// examples/data-processing/src/queue/QueueManager.js
import { Queue, Worker } from 'bullmq';
import { UltraDex } from '@ultra-dex/sdk';

export class QueueManager {
  constructor(config) {
    this.config = config;
    this.ultraDex = new UltraDex(config.ultraDex);
    this.queues = new Map();
  }

  createQueue(name, options = {}) {
    const queue = new Queue(name, {
      connection: this.config.redis,
      ...options,
    });

    this.queues.set(name, queue);
    return queue;
  }

  async addJob(queueName, jobData, options = {}) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    return queue.add('process', jobData, {
      priority: options.priority || 0,
      delay: options.delay || 0,
      attempts: options.attempts || 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      ...options,
    });
  }

  createWorker(queueName, processor) {
    const worker = new Worker(
      queueName,
      async (job) => {
        console.log(`Processing job ${job.id} from ${queueName}`);

        try {
          // Use Ultra-Dex for intelligent processing
          const result = await this.ultraDex.execute(
            `Process job with intelligent analysis: ${JSON.stringify(job.data)}`,
            {
              mode: 'detailed',
              agents: ['data-processor', 'quality-assurance'],
            }
          );

          // Call the custom processor
          if (processor) {
            await processor(job.data, result.results);
          }

          return result.results;
        } catch (error) {
          console.error(`Job ${job.id} failed:`, error);
          throw error;
        }
      },
      {
        connection: this.config.redis,
        concurrency: this.config.concurrency || 5,
      }
    );

    worker.on('completed', (job) => {
      console.log(`Job ${job.id} completed successfully`);
    });

    worker.on('failed', (job, err) => {
      console.error(`Job ${job.id} failed with error:`, err.message);
    });

    return worker;
  }

  async getQueueStats(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaiting(),
      queue.getActive(),
      queue.getCompleted(),
      queue.getFailed(),
    ]);

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      total: waiting.length + active.length + completed.length + failed.length,
    };
  }

  async cleanup(queueName, grace = 24 * 60 * 60 * 1000) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    // Remove completed jobs older than grace period
    await queue.clean(grace, 'completed');
    await queue.clean(grace, 'failed');
  }
}
```

### Storage Management

```javascript
// examples/data-processing/src/storage/StorageManager.js
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { createWriteStream, createReadStream } from 'fs';
import path from 'path';

export class StorageManager {
  constructor(config) {
    this.config = config;
    this.s3Client = config.s3 ? new S3Client(config.s3) : null;
    this.localBasePath = config.local?.basePath || './data';
  }

  async save(location, data) {
    const { type, path: filePath, bucket } = location;

    switch (type) {
      case 'local':
        return this.saveLocal(filePath, data);
      case 's3':
        return this.saveS3(bucket, filePath, data);
      default:
        throw new Error(`Unsupported storage type: ${type}`);
    }
  }

  async load(location) {
    const { type, path: filePath, bucket } = location;

    switch (type) {
      case 'local':
        return this.loadLocal(filePath);
      case 's3':
        return this.loadS3(bucket, filePath);
      default:
        throw new Error(`Unsupported storage type: ${type}`);
    }
  }

  async saveLocal(filePath, data) {
    const fs = await import('fs/promises');
    const fullPath = path.join(this.localBasePath, filePath);

    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    await fs.writeFile(fullPath, content, 'utf8');

    return { path: fullPath, size: content.length };
  }

  async loadLocal(filePath) {
    const fs = await import('fs/promises');
    const fullPath = path.join(this.localBasePath, filePath);

    const content = await fs.readFile(fullPath, 'utf8');

    try {
      return JSON.parse(content);
    } catch {
      return content;
    }
  }

  async saveS3(bucket, key, data) {
    if (!this.s3Client) {
      throw new Error('S3 client not configured');
    }

    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: content,
      ContentType: 'application/json',
    });

    const result = await this.s3Client.send(command);
    return {
      bucket,
      key,
      etag: result.ETag,
      size: content.length,
    };
  }

  async loadS3(bucket, key) {
    if (!this.s3Client) {
      throw new Error('S3 client not configured');
    }

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await this.s3Client.send(command);
    const content = await response.Body?.transformToString();

    if (!content) {
      throw new Error(`No content found in s3://${bucket}/${key}`);
    }

    try {
      return JSON.parse(content);
    } catch {
      return content;
    }
  }

  // Stream operations for large files
  createUploadStream(location, options = {}) {
    const { type } = location;

    switch (type) {
      case 'local':
        return this.createLocalUploadStream(location.path);
      case 's3':
        return this.createS3UploadStream(location.bucket, location.path, options);
      default:
        throw new Error(`Unsupported storage type: ${type}`);
    }
  }

  createLocalUploadStream(filePath) {
    const fullPath = path.join(this.localBasePath, filePath);
    return createWriteStream(fullPath);
  }

  createS3UploadStream(bucket, key, options) {
    // Implement multipart upload for large files
    // This would use S3 multipart upload API
    throw new Error('S3 streaming upload not yet implemented');
  }
}
```

### Sample Pipeline Configuration

```json
// examples/data-processing/config/pipeline.json
{
  "name": "Customer Data Processing Pipeline",
  "description": "Process customer data from CSV, clean, analyze, and generate insights",
  "input": {
    "type": "local",
    "path": "raw/customer_data.csv"
  },
  "transformations": [
    {
      "type": "data-cleaning",
      "config": {
        "removeDuplicates": true,
        "handleMissingValues": "interpolate",
        "normalizeText": true,
        "validateEmails": true
      }
    },
    {
      "type": "data-transformation",
      "config": {
        "addColumns": [
          {
            "name": "customer_segment",
            "expression": "CASE WHEN total_purchases > 1000 THEN 'VIP' ELSE 'Regular' END"
          }
        ],
        "renameColumns": {
          "full_name": "customer_name",
          "purchase_amount": "total_spent"
        }
      }
    }
  ],
  "analysis": [
    {
      "type": "statistical-analysis",
      "config": {
        "metrics": ["mean", "median", "std_dev"],
        "groupBy": "customer_segment",
        "columns": ["age", "total_spent", "purchase_frequency"]
      }
    },
    {
      "type": "clustering",
      "config": {
        "algorithm": "k-means",
        "features": ["age", "total_spent", "purchase_frequency"],
        "clusters": 3
      }
    }
  ],
  "output": {
    "type": "s3",
    "bucket": "processed-data",
    "path": "customer-insights/2024-01-15-results.json"
  }
}
```

### Usage Example

```javascript
// examples/data-processing/src/main.js
import { DataProcessingEngine } from './engine.js';
import pipelineConfig from '../config/pipeline.json';

async function main() {
  const engine = new DataProcessingEngine({
    ultraDex: {
      apiKey: process.env.ULTRA_DEX_API_KEY,
      providers: {
        openai: { apiKey: process.env.OPENAI_API_KEY },
      },
    },
    processing: {
      maxConcurrency: 5,
      timeout: 3600000, // 1 hour
    },
    queue: {
      redis: { host: 'localhost', port: 6379 },
      concurrency: 3,
    },
    storage: {
      local: { basePath: './data' },
      s3: {
        region: 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      },
    },
  });

  try {
    console.log('Starting data processing pipeline...');

    const result = await engine.processPipeline(pipelineConfig);

    console.log('Pipeline completed successfully:', result);

    // Process multiple pipelines in batch
    const batchResult = await engine.processBatch({
      jobs: [pipelineConfig, otherPipelineConfig],
      concurrency: 2,
    });

    console.log('Batch processing completed:', batchResult);
  } catch (error) {
    console.error('Processing failed:', error);
    process.exit(1);
  }
}

main();
```

### Docker Configuration

```yaml
# examples/data-processing/docker-compose.yml
version: '3.8'
services:
  data-processor:
    build: .
    ports:
      - '3001:3001'
    environment:
      - NODE_ENV=production
      - ULTRA_DEX_API_KEY=${ULTRA_DEX_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
    volumes:
      - ./data:/app/data
      - ./config:/app/config
    depends_on:
      - redis
      - postgres

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=data_processing
      - POSTGRES_USER=processor
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  redis_data:
  postgres_data:
```

These examples demonstrate how Ultra-Dex can be used to build sophisticated, AI-powered applications for API development and data processing. The systems are scalable, maintainable, and leverage Ultra-Dex's orchestration capabilities for intelligent automation.</content>
<parameter name="filePath">guides/real-world-use-cases.md
