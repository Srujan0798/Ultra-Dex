#!/usr/bin/env node

/**
 * Ultra-Dex Data Pipeline
 * 
 * This example demonstrates how to create an AI-managed data processing pipeline using Ultra-Dex.
 * The system intelligently handles data ingestion, transformation, validation, and storage.
 * 
 * Features:
 * - AI-powered data validation and cleaning
 * - Adaptive pipeline optimization
 * - Error handling and recovery
 * - Performance monitoring
 * - Schema evolution management
 */

import { UltraDex } from '@ultra-dex/sdk';
import fs from 'fs/promises';
import path from 'path';

class DataPipeline {
  constructor(config) {
    this.ultraDex = new UltraDex(config.ultraDex);
    
    // Initialize specialized agents
    this.agents = {
      dataValidator: this.ultraDex.createAgent({
        name: 'data-validator',
        role: 'Validates data quality, schema compliance, and business rules',
        tools: ['schema-validator', 'quality-checker', 'business-rule-enforcer', 'anomaly-detector']
      }),
      
      dataTransformer: this.ultraDex.createAgent({
        name: 'data-transformer',
        role: 'Transforms data according to business requirements and target schemas',
        tools: ['mapping-engine', 'format-converter', 'enrichment-service', 'normalization-tool']
      }),
      
      pipelineOptimizer: this.ultraDex.createAgent({
        name: 'pipeline-optimizer',
        role: 'Optimizes pipeline performance based on data patterns and resource usage',
        tools: ['performance-analyzer', 'resource-allocator', 'batch-size-optimizer', 'parallelization-orchestrator']
      }),
      
      errorHandler: this.ultraDex.createAgent({
        name: 'error-handler',
        role: 'Handles pipeline errors and implements recovery strategies',
        tools: ['error-classifier', 'retry-orchestrator', 'fallback-activator', 'alert-generator']
      }),
      
      schemaEvolver: this.ultraDex.createAgent({
        name: 'schema-evolver',
        role: 'Manages schema evolution and backward compatibility',
        tools: ['schema-comparator', 'migration-planner', 'compatibility-checker', 'version-manager']
      })
    };
    
    this.pipelineJobs = [];
    this.dataSources = config.dataSources || [];
    this.destinations = config.destinations || [];
    this.transformations = config.transformations || [];
  }

  /**
   * Process data through the pipeline
   */
  async processData(source, destination, options = {}) {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const job = {
      id: jobId,
      source,
      destination,
      status: 'processing',
      startedAt: new Date().toISOString(),
      metadata: {
        batchSize: options.batchSize || 1000,
        parallelism: options.parallelism || 1,
        validationLevel: options.validationLevel || 'strict',
        errorHandling: options.errorHandling || 'stop-on-error'
      }
    };
    
    this.pipelineJobs.push(job);
    
    try {
      // Read data from source
      const rawData = await this.readData(source);
      
      // Validate data
      const validationResult = await this.agents.dataValidator.execute({
        data: rawData,
        schema: options.schema || null,
        validationLevel: job.metadata.validationLevel,
        businessRules: options.businessRules || []
      });
      
      if (!validationResult.valid) {
        if (job.metadata.errorHandling === 'stop-on-error') {
          throw new Error(`Data validation failed: ${validationResult.errors.join(', ')}`);
        } else {
          // Continue with valid records only
          rawData = validationResult.validRecords;
        }
      }
      
      // Transform data
      const transformedData = await this.agents.dataTransformer.execute({
        data: rawData,
        transformations: this.transformations,
        targetSchema: options.targetSchema || null,
        enrichment: options.enrichment || false
      });
      
      // Write data to destination
      await this.writeData(transformedData, destination);
      
      // Update job status
      job.status = 'completed';
      job.completedAt = new Date().toISOString();
      job.metadata.recordCount = transformedData.length;
      job.metadata.validationResult = validationResult;
      
      return job;
      
    } catch (error) {
      job.status = 'failed';
      job.error = error.message;
      job.completedAt = new Date().toISOString();
      
      // Handle error with AI agent
      const errorHandlerResult = await this.agents.errorHandler.execute({
        error: error,
        job: job,
        source: source,
        destination: destination
      });
      
      job.errorHandlingResult = errorHandlerResult;
      
      throw error;
    }
  }

  /**
   * Read data from source
   */
  async readData(source) {
    if (source.type === 'file') {
      const content = await fs.readFile(source.path, 'utf8');
      
      if (source.format === 'json') {
        return JSON.parse(content);
      } else if (source.format === 'csv') {
        return this.parseCSV(content);
      } else if (source.format === 'parquet') {
        // In a real implementation, use a parquet reader
        throw new Error('Parquet format not implemented in this example');
      }
    } else if (source.type === 'database') {
      // In a real implementation, connect to database
      throw new Error('Database source not implemented in this example');
    } else if (source.type === 'api') {
      // In a real implementation, call API
      throw new Error('API source not implemented in this example');
    }
    
    throw new Error(`Unsupported source type: ${source.type}`);
  }

  /**
   * Write data to destination
   */
  async writeData(data, destination) {
    if (destination.type === 'file') {
      let content;
      
      if (destination.format === 'json') {
        content = JSON.stringify(data, null, 2);
      } else if (destination.format === 'csv') {
        content = this.formatAsCSV(data);
      } else if (destination.format === 'parquet') {
        // In a real implementation, use a parquet writer
        throw new Error('Parquet format not implemented in this example');
      }
      
      await fs.writeFile(destination.path, content);
    } else if (destination.type === 'database') {
      // In a real implementation, connect to database
      throw new Error('Database destination not implemented in this example');
    } else if (destination.type === 'api') {
      // In a real implementation, call API
      throw new Error('API destination not implemented in this example');
    }
    
    throw new Error(`Unsupported destination type: ${destination.type}`);
  }

  /**
   * Parse CSV content
   */
  parseCSV(csvContent) {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || null;
      });
      return obj;
    }).filter(row => Object.keys(row).length > 0);
    
    return rows;
  }

  /**
   * Format data as CSV
   */
  formatAsCSV(data) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header] ?? '';
        // Escape commas and wrap in quotes if needed
        return String(value).includes(',') ? `"${value}"` : value;
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  }

  /**
   * Optimize pipeline based on performance data
   */
  async optimizePipeline(options = {}) {
    const optimization = await this.agents.pipelineOptimizer.execute({
      jobs: this.pipelineJobs,
      resources: options.resources || {},
      performanceGoals: options.performanceGoals || {
        throughput: 'maximize',
        latency: 'minimize',
        cost: 'optimize'
      }
    });
    
    return optimization;
  }

  /**
   * Handle schema evolution
   */
  async handleSchemaEvolution(currentSchema, newSchema, options = {}) {
    const evolutionPlan = await this.agents.schemaEvolver.execute({
      currentSchema,
      newSchema,
      compatibilityMode: options.compatibilityMode || 'backward',
      migrationStrategy: options.migrationStrategy || 'gradual'
    });
    
    return evolutionPlan;
  }

  /**
   * Schedule recurring pipeline job
   */
  async scheduleJob(schedule, source, destination, options = {}) {
    const job = {
      id: `scheduled-job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      schedule,
      source,
      destination,
      options,
      lastRun: null,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };
    
    // In a real implementation, use a scheduler like node-cron
    // For this example, we'll just store the job
    this.pipelineJobs.push(job);
    
    return job;
  }

  /**
   * Monitor pipeline performance
   */
  async monitorPerformance() {
    const stats = {
      totalJobs: this.pipelineJobs.length,
      completedJobs: this.pipelineJobs.filter(j => j.status === 'completed').length,
      failedJobs: this.pipelineJobs.filter(j => j.status === 'failed').length,
      runningJobs: this.pipelineJobs.filter(j => j.status === 'processing').length,
      totalRecordsProcessed: this.pipelineJobs
        .filter(j => j.metadata?.recordCount)
        .reduce((sum, j) => sum + j.metadata.recordCount, 0),
      averageProcessingTime: this.calculateAverageProcessingTime(),
      errorRate: this.pipelineJobs.length > 0 
        ? (this.pipelineJobs.filter(j => j.status === 'failed').length / this.pipelineJobs.length) * 100 
        : 0
    };
    
    return stats;
  }

  /**
   * Calculate average processing time
   */
  calculateAverageProcessingTime() {
    const completedJobs = this.pipelineJobs.filter(j => j.status === 'completed' && j.completedAt && j.startedAt);
    if (completedJobs.length === 0) return 0;
    
    const totalTime = completedJobs.reduce((sum, job) => {
      const start = new Date(job.startedAt).getTime();
      const end = new Date(job.completedAt).getTime();
      return sum + (end - start);
    }, 0);
    
    return totalTime / completedJobs.length;
  }

  /**
   * Add data source
   */
  addDataSource(source) {
    this.dataSources.push(source);
  }

  /**
   * Add destination
   */
  addDestination(destination) {
    this.destinations.push(destination);
  }

  /**
   * Add transformation
   */
  addTransformation(transformation) {
    this.transformations.push(transformation);
  }

  /**
   * Get pipeline status
   */
  getStatus() {
    return {
      sources: this.dataSources.length,
      destinations: this.destinations.length,
      transformations: this.transformations.length,
      jobs: this.pipelineJobs.length,
      stats: this.monitorPerformance(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Run diagnostic checks
   */
  async runDiagnostics() {
    const diagnostics = {
      connectivity: await this.checkConnectivity(),
      performance: await this.assessPerformance(),
      dataQuality: await this.assessDataQuality(),
      errorPatterns: await this.analyzeErrorPatterns(),
      optimizationOpportunities: await this.identifyOptimizationOpportunities()
    };
    
    return diagnostics;
  }

  /**
   * Check connectivity to sources and destinations
   */
  async checkConnectivity() {
    const results = {
      sources: {},
      destinations: {}
    };
    
    // Check each source
    for (const source of this.dataSources) {
      try {
        if (source.type === 'file') {
          await fs.access(source.path);
          results.sources[source.id] = { connected: true, error: null };
        } else {
          // For other source types, implement appropriate checks
          results.sources[source.id] = { connected: true, error: null };
        }
      } catch (error) {
        results.sources[source.id] = { connected: false, error: error.message };
      }
    }
    
    // Check each destination
    for (const dest of this.destinations) {
      try {
        if (dest.type === 'file') {
          const dir = path.dirname(dest.path);
          await fs.access(dir);
          results.destinations[dest.id] = { connected: true, error: null };
        } else {
          // For other destination types, implement appropriate checks
          results.destinations[dest.id] = { connected: true, error: null };
        }
      } catch (error) {
        results.destinations[dest.id] = { connected: false, error: error.message };
      }
    }
    
    return results;
  }

  /**
   * Assess performance
   */
  async assessPerformance() {
    return {
      throughput: 'analyzing...', // Would calculate based on recent jobs
      latency: 'analyzing...', // Would calculate based on recent jobs
      resourceUtilization: 'analyzing...' // Would calculate based on system metrics
    };
  }

  /**
   * Assess data quality
   */
  async assessDataQuality() {
    // In a real implementation, analyze recent data processing results
    return {
      completeness: 'analyzing...',
      accuracy: 'analyzing...',
      consistency: 'analyzing...',
      timeliness: 'analyzing...'
    };
  }

  /**
   * Analyze error patterns
   */
  async analyzeErrorPatterns() {
    const failedJobs = this.pipelineJobs.filter(j => j.status === 'failed');
    const errorTypes = {};
    
    for (const job of failedJobs) {
      const errorType = this.classifyError(job.error);
      errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
    }
    
    return {
      errorTypes,
      frequency: failedJobs.length,
      recommendations: this.generateErrorRecommendations(errorTypes)
    };
  }

  /**
   * Classify error type
   */
  classifyError(errorMessage) {
    if (errorMessage.includes('validation')) return 'validation_error';
    if (errorMessage.includes('connection')) return 'connection_error';
    if (errorMessage.includes('timeout')) return 'timeout_error';
    if (errorMessage.includes('schema')) return 'schema_error';
    return 'other_error';
  }

  /**
   * Generate error recommendations
   */
  generateErrorRecommendations(errorTypes) {
    const recommendations = [];
    
    if (errorTypes.validation_error) {
      recommendations.push('Improve data validation rules and preprocessing');
    }
    
    if (errorTypes.connection_error) {
      recommendations.push('Check network connectivity and retry logic');
    }
    
    if (errorTypes.timeout_error) {
      recommendations.push('Increase timeout values or optimize processing');
    }
    
    if (errorTypes.schema_error) {
      recommendations.push('Review schema compatibility and evolution strategy');
    }
    
    return recommendations;
  }

  /**
   * Identify optimization opportunities
   */
  async identifyOptimizationOpportunities() {
    const optimization = await this.agents.pipelineOptimizer.execute({
      jobs: this.pipelineJobs,
      resources: {},
      performanceGoals: { throughput: 'analyze', latency: 'analyze', cost: 'analyze' }
    });
    
    return optimization.opportunities || [];
  }
}

// Example usage
async function main() {
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
  
  // Example of how to use the data pipeline
  try {
    console.log('Data pipeline initialized. Use processData() to process data.');
    
    // Example of processing data (would need actual files):
    /*
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
    
    console.log('Pipeline job completed:', job);
    */
    
    // Print pipeline status
    console.log('Pipeline Status:', dataPipeline.getStatus());
    
    // Run diagnostics
    console.log('Diagnostics:', await dataPipeline.runDiagnostics());
  } catch (error) {
    console.error('Error in main:', error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export default DataPipeline;