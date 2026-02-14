# Data Pipeline Example

This example demonstrates how to create an AI-managed data processing pipeline using Ultra-Dex. The system intelligently handles data ingestion, transformation, validation, and storage with adaptive optimization.

## Features

- **AI-Powered Data Validation**: Validates data quality, schema compliance, and business rules
- **Adaptive Transformation**: Transforms data according to business requirements
- **Performance Optimization**: Dynamically optimizes pipeline performance
- **Error Handling & Recovery**: Implements intelligent error handling and recovery strategies
- **Schema Evolution**: Manages schema changes and backward compatibility
- **Performance Monitoring**: Tracks and reports pipeline performance metrics
- **Diagnostic Tools**: Identifies and addresses pipeline issues

## Prerequisites

- Node.js 18+
- Ultra-Dex API key
- Data source files or connections

## Setup

1. **Install Dependencies**:
   ```bash
   # This example uses the UltraDex library
   ```

2. **Environment Variables**:
   Create a `.env` file with the following:
   ```env
   ULTRA_DEX_API_KEY=your_ultra_dex_api_key
   ULTRA_DEX_ENDPOINT=https://api.ultra-dex.ai
   ```

3. **Run the Example**:
   ```bash
   node index.js
   ```

## Configuration

The data pipeline uses several specialized agents:

- `data-validator`: Validates data quality, schema compliance, and business rules
- `data-transformer`: Transforms data according to business requirements
- `pipeline-optimizer`: Optimizes pipeline performance based on data patterns
- `error-handler`: Handles pipeline errors and implements recovery strategies
- `schema-evolver`: Manages schema evolution and backward compatibility

## Usage

The data pipeline can process data from various sources:

```javascript
const dataPipeline = new DataPipeline({
  ultraDex: {
    apiKey: process.env.ULTRA_DEX_API_KEY,
    endpoint: process.env.ULTRA_DEX_ENDPOINT || 'https://api.ultra-dex.ai'
  },
  dataSources: [
    {
      id: 'source-1',
      type: 'file',
      path: './data/input.csv',
      format: 'csv'
    }
  ],
  destinations: [
    {
      id: 'dest-1',
      type: 'file',
      path: './data/output.json',
      format: 'json'
    }
  ],
  transformations: [
    {
      type: 'field_mapping',
      mappings: {
        'old_field': 'new_field',
        'another_old': 'another_new'
      }
    }
  ]
});

// Process data through the pipeline
const job = await dataPipeline.processData(
  {
    type: 'file',
    path: './data/input.csv',
    format: 'csv'
  },
  {
    type: 'file',
    path: './data/output.json',
    format: 'json'
  },
  {
    batchSize: 500,
    validationLevel: 'strict',
    errorHandling: 'continue-on-error'
  }
);

// Schedule recurring jobs
await dataPipeline.scheduleJob(
  '0 2 * * *', // Daily at 2 AM
  { type: 'file', path: './data/daily_input.csv', format: 'csv' },
  { type: 'file', path: './data/daily_output.json', format: 'json' }
);

// Optimize pipeline performance
const optimization = await dataPipeline.optimizePipeline({
  performanceGoals: {
    throughput: 'maximize',
    latency: 'minimize',
    cost: 'optimize'
  }
});

// Handle schema evolution
const evolutionPlan = await dataPipeline.handleSchemaEvolution(
  currentSchema,
  newSchema,
  { compatibilityMode: 'backward' }
);
```

## Supported Data Sources

The pipeline supports various data sources:

- **File Sources**: CSV, JSON, Parquet, Excel files
- **Database Sources**: SQL and NoSQL databases
- **API Sources**: REST and GraphQL APIs
- **Stream Sources**: Kafka, RabbitMQ, AWS Kinesis

## Supported Destinations

The pipeline can write to various destinations:

- **File Destinations**: CSV, JSON, Parquet, Excel files
- **Database Destinations**: SQL and NoSQL databases
- **API Destinations**: REST and GraphQL APIs
- **Data Warehouses**: Snowflake, BigQuery, Redshift

## Data Transformation

The pipeline supports various transformations:

- **Field Mapping**: Rename and restructure fields
- **Format Conversion**: Convert between data formats
- **Data Enrichment**: Add additional data from external sources
- **Normalization**: Standardize data formats and values
- **Aggregation**: Group and summarize data

## Validation Levels

Choose from different validation levels:

- **None**: No validation
- **Basic**: Schema compliance only
- **Moderate**: Schema and basic business rules
- **Strict**: Comprehensive validation and quality checks

## Error Handling Strategies

Handle errors with different strategies:

- **Stop-on-error**: Halt pipeline on first error
- **Continue-on-error**: Skip invalid records and continue
- **Batch-on-error**: Process valid records in batch, queue invalid for review

## Performance Monitoring

Track key performance metrics:

- **Throughput**: Records processed per unit time
- **Latency**: Time from input to output
- **Resource Utilization**: CPU, memory, and I/O usage
- **Error Rates**: Percentage of failed operations
- **Processing Times**: Individual job durations

## Diagnostic Tools

Use built-in diagnostic tools:

- **Connectivity Checks**: Verify source and destination accessibility
- **Performance Assessment**: Analyze throughput and latency
- **Data Quality Analysis**: Evaluate completeness and accuracy
- **Error Pattern Analysis**: Identify recurring issues
- **Optimization Recommendations**: Suggest performance improvements

## Schema Evolution

Manage schema changes:

- **Backward Compatibility**: Ensure new schemas work with old data
- **Forward Compatibility**: Ensure old schemas work with new data
- **Migration Planning**: Plan and execute schema transitions
- **Version Management**: Track schema versions and changes

## Customization

You can customize the data pipeline by modifying:

- Data validation rules
- Transformation mappings
- Error handling strategies
- Performance optimization goals
- Scheduling intervals
- Monitoring thresholds

## Security

- Store API keys securely using environment variables
- Ensure proper access controls for data sources and destinations
- Validate all file paths to prevent directory traversal attacks
- Implement proper authentication for database and API connections