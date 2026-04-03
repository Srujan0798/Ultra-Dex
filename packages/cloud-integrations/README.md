# Ultra-Dex Cloud Integrations

This package provides comprehensive cloud-native integrations for major cloud providers: AWS, Google Cloud Platform (GCP), and Microsoft Azure.

## Features

### AI Service Integrations

- **AWS**: Amazon Bedrock (Claude, Titan, Jurassic models)
- **GCP**: Vertex AI (Gemini, PaLM, Codey models)
- **Azure**: Azure OpenAI Service

### Cloud Storage

- **AWS**: Amazon S3 with trace/data persistence
- **GCP**: Cloud Storage with lifecycle management
- **Azure**: Blob Storage with geo-replication

### Monitoring & Logging

- **AWS**: CloudWatch metrics and alarms
- **GCP**: Cloud Logging with structured logs
- **Azure**: Azure Monitor and Application Insights

### Serverless Deployment

- **AWS**: Lambda functions with API Gateway
- **GCP**: Cloud Functions (2nd gen)
- **Azure**: Azure Functions with consumption plan

### Security Services

- **AWS**: IAM users, roles, and policies
- **GCP**: Identity and Access Management
- **Azure**: Microsoft Entra ID (Azure AD)

### Cost Optimization

- Multi-cloud cost analysis and optimization recommendations
- Budget monitoring and alerts
- Resource usage optimization

## Installation

```bash
npm install @ultra-dex/cloud-integrations
```

## Quick Start

### AWS Bedrock AI Integration

```javascript
import { AWSBedrockProvider } from '@ultra-dex/cloud-integrations';

const bedrock = new AWSBedrockProvider({
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  defaultModel: 'anthropic.claude-3-sonnet-20240229-v1:0',
});

const response = await bedrock.chat([
  { role: 'user', content: 'Hello, how can I optimize my cloud costs?' },
]);
console.log(response.content);
```

### GCP Cloud Storage

```javascript
import { GCPCloudStorage } from '@ultra-dex/cloud-integrations';

const storage = new GCPCloudStorage({
  projectId: process.env.GCP_PROJECT_ID,
  bucketName: 'ultra-dex-storage',
});

// Store trace data
await storage.storeTrace('trace-123', {
  id: 'trace-123',
  timestamp: new Date(),
  operations: ['ai-call', 'storage-upload'],
});
```

### Azure Functions Deployment

```javascript
import { AzureFunctions } from '@ultra-dex/cloud-integrations';

const functions = new AzureFunctions({
  subscriptionId: process.env.AZURE_SUBSCRIPTION_ID,
  resourceGroupName: 'ultra-dex-rg',
});

// Deploy Ultra-Dex as serverless function
const result = await functions.deployUltraDexFunction(
  ultraDexCode,
  'ultra-dex-functions',
  'ultra-dex-serverless'
);
```

## Deployment

### Automated Deployment Scripts

Deploy to individual cloud providers:

```bash
# AWS
node packages/cloud-integrations/aws/deployment/deploy-aws.js deploy

# GCP
node packages/cloud-integrations/gcp/deployment/deploy-gcp.js deploy

# Azure
node packages/cloud-integrations/azure/deployment/deploy-azure.js deploy
```

### Multi-Cloud Deployment

Deploy to all providers simultaneously:

```bash
node packages/cloud-integrations/deploy.js all deploy
```

Undeploy from all providers:

```bash
node packages/cloud-integrations/deploy.js all undeploy
```

## Environment Variables

### AWS

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=ultra-dex-storage
```

### GCP

```bash
GCP_PROJECT_ID=your-project-id
GCP_LOCATION=us-central1
GCP_KEY_FILE=path/to/service-account.json
GCP_STORAGE_BUCKET=ultra-dex-storage
```

### Azure

```bash
AZURE_SUBSCRIPTION_ID=your-subscription-id
AZURE_STORAGE_CONNECTION_STRING=your-connection-string
AZURE_STORAGE_CONTAINER=ultra-dex
AZURE_LOG_WORKSPACE_ID=your-workspace-id
```

## Cost Optimization

```javascript
import { CloudCostOptimizer } from '@ultra-dex/cloud-integrations';

const optimizer = new CloudCostOptimizer({
  providers: ['aws', 'gcp', 'azure'],
  budgetLimits: {
    aws: 1000,
    gcp: 800,
    azure: 900,
  },
});

// Analyze costs
const awsCosts = await optimizer.analyzeCosts('aws');
console.log('AWS costs:', awsCosts);

// Get optimization recommendations
const recommendations = await optimizer.optimizeResources('aws');
console.log('Recommendations:', recommendations);

// Monitor budget
const budgetStatus = await optimizer.monitorBudget('aws');
console.log('Budget alerts:', budgetStatus.alerts);
```

## Architecture

```
packages/cloud-integrations/
├── aws/
│   ├── ai/           # Bedrock providers
│   ├── storage/      # S3 integration
│   ├── monitoring/   # CloudWatch
│   ├── deployment/   # Lambda
│   └── security/     # IAM
├── gcp/
│   ├── ai/           # Vertex AI
│   ├── storage/      # Cloud Storage
│   ├── monitoring/   # Cloud Logging
│   ├── deployment/   # Cloud Functions
│   └── security/     # IAM
├── azure/
│   ├── ai/           # Azure OpenAI
│   ├── storage/      # Blob Storage
│   ├── monitoring/   # Azure Monitor
│   ├── deployment/   # Azure Functions
│   └── security/     # Entra ID
├── index.js          # Main exports
├── deploy.js         # Multi-cloud deployment
└── README.md
```

## Contributing

1. Follow the existing code style and patterns
2. Add tests for new integrations
3. Update documentation
4. Ensure linting passes: `npm run lint`

## License

MIT
