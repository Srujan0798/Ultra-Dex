#!/usr/bin/env node

/**
 * Ultra-Dex Multi-Agent Workflow
 * 
 * This example demonstrates how to create a multi-agent system using Ultra-Dex.
 * Multiple specialized agents work together to accomplish complex tasks.
 * 
 * Features:
 * - Specialized agent coordination
 * - Task delegation and routing
 * - Shared memory and context
 * - Workflow orchestration
 * - Result aggregation and synthesis
 */

import { UltraDex } from '@ultra-dex/sdk';

class MultiAgentWorkflow {
  constructor(config) {
    this.ultraDex = new UltraDex(config.ultraDex);
    
    // Initialize specialized agents
    this.agents = {
      researcher: this.ultraDex.createAgent({
        name: 'researcher',
        role: 'Researches and gathers information from various sources',
        tools: ['web-search', 'database-query', 'document-analyzer', 'source-verifier']
      }),
      
      analyst: this.ultraDex.createAgent({
        name: 'analyst',
        role: 'Analyzes data and information to identify patterns and insights',
        tools: ['data-analyzer', 'pattern-recognizer', 'statistical-tool', 'trend-analyzer']
      }),
      
      writer: this.ultraDex.createAgent({
        name: 'writer',
        role: 'Creates well-structured, coherent content based on research and analysis',
        tools: ['content-structurer', 'language-model', 'style-checker', 'grammar-correction']
      }),
      
      reviewer: this.ultraDex.createAgent({
        name: 'reviewer',
        role: 'Reviews and validates content for accuracy, quality, and compliance',
        tools: ['fact-checker', 'quality-assessor', 'compliance-checker', 'accuracy-verifier']
      }),
      
      coordinator: this.ultraDex.createAgent({
        name: 'coordinator',
        role: 'Coordinates agent activities, manages workflow, and synthesizes results',
        tools: ['task-orchestrator', 'workflow-manager', 'result-aggregator', 'progress-tracker']
      }),
      
      specialist: this.ultraDex.createAgent({
        name: 'specialist',
        role: 'Provides domain-specific expertise for specialized tasks',
        tools: ['domain-knowledge', 'expert-system', 'specialized-calculator', 'technical-analyzer']
      })
    };
    
    this.workflowHistory = [];
    this.sharedMemory = new Map();
  }

  /**
   * Execute a complex task using multiple agents
   */
  async executeComplexTask(task, options = {}) {
    const workflowId = `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const workflow = {
      id: workflowId,
      task,
      status: 'initiated',
      startedAt: new Date().toISOString(),
      steps: [],
      results: {},
      metadata: {
        agentsUsed: [],
        totalSteps: 0,
        options
      }
    };
    
    this.workflowHistory.push(workflow);
    
    try {
      workflow.status = 'executing';
      
      // Step 1: Research phase
      const researchResult = await this.agents.researcher.execute({
        query: task,
        sources: options.sources || ['web', 'internal'],
        depth: options.researchDepth || 'medium',
        timeframe: options.timeframe || 'last_year'
      });
      
      workflow.steps.push({
        step: 1,
        agent: 'researcher',
        description: 'Research and information gathering',
        result: researchResult,
        completedAt: new Date().toISOString()
      });
      workflow.metadata.agentsUsed.push('researcher');
      
      // Step 2: Analysis phase
      const analysisResult = await this.agents.analyst.execute({
        data: researchResult.data,
        task: task,
        analysisType: options.analysisType || 'comprehensive',
        requiredInsights: options.requiredInsights || []
      });
      
      workflow.steps.push({
        step: 2,
        agent: 'analyst',
        description: 'Data analysis and insight generation',
        result: analysisResult,
        completedAt: new Date().toISOString()
      });
      workflow.metadata.agentsUsed.push('analyst');
      
      // Step 3: Writing phase
      const writingResult = await this.agents.writer.execute({
        research: researchResult,
        analysis: analysisResult,
        task: task,
        format: options.outputFormat || 'report',
        audience: options.audience || 'general',
        tone: options.tone || 'professional'
      });
      
      workflow.steps.push({
        step: 3,
        agent: 'writer',
        description: 'Content creation and structuring',
        result: writingResult,
        completedAt: new Date().toISOString()
      });
      workflow.metadata.agentsUsed.push('writer');
      
      // Step 4: Review phase
      const reviewResult = await this.agents.reviewer.execute({
        content: writingResult.content,
        research: researchResult,
        analysis: analysisResult,
        criteria: options.reviewCriteria || ['accuracy', 'quality', 'compliance'],
        task: task
      });
      
      workflow.steps.push({
        step: 4,
        agent: 'reviewer',
        description: 'Content review and validation',
        result: reviewResult,
        completedAt: new Date().toISOString()
      });
      workflow.metadata.agentsUsed.push('reviewer');
      
      // Step 5: Synthesis and finalization
      const synthesisResult = await this.agents.coordinator.execute({
        research: researchResult,
        analysis: analysisResult,
        writing: writingResult,
        review: reviewResult,
        task: task,
        synthesisType: options.synthesisType || 'comprehensive'
      });
      
      workflow.steps.push({
        step: 5,
        agent: 'coordinator',
        description: 'Result synthesis and finalization',
        result: synthesisResult,
        completedAt: new Date().toISOString()
      });
      workflow.metadata.agentsUsed.push('coordinator');
      
      // Store final results
      workflow.results = {
        research: researchResult,
        analysis: analysisResult,
        writing: writingResult,
        review: reviewResult,
        synthesis: synthesisResult,
        final: synthesisResult.finalOutput
      };
      
      workflow.status = 'completed';
      workflow.completedAt = new Date().toISOString();
      workflow.metadata.totalSteps = workflow.steps.length;
      
      return {
        workflowId,
        result: synthesisResult.finalOutput,
        steps: workflow.steps,
        summary: this.generateWorkflowSummary(workflow),
        confidence: synthesisResult.confidence,
        sources: researchResult.sources
      };
      
    } catch (error) {
      workflow.status = 'failed';
      workflow.error = error.message;
      workflow.completedAt = new Date().toISOString();
      
      throw error;
    }
  }

  /**
   * Execute a specialized task requiring domain expertise
   */
  async executeSpecializedTask(task, domain, options = {}) {
    const workflowId = `specialized-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const workflow = {
      id: workflowId,
      task,
      domain,
      status: 'initiated',
      startedAt: new Date().toISOString(),
      steps: [],
      results: {},
      metadata: {
        agentsUsed: [],
        domain,
        options
      }
    };
    
    this.workflowHistory.push(workflow);
    
    try {
      workflow.status = 'executing';
      
      // Use specialist agent for domain-specific tasks
      const specialistResult = await this.agents.specialist.execute({
        task: task,
        domain: domain,
        expertise: options.expertise || 'general',
        constraints: options.constraints || [],
        precision: options.precision || 'high'
      });
      
      workflow.steps.push({
        step: 1,
        agent: 'specialist',
        description: `Domain-specific analysis in ${domain}`,
        result: specialistResult,
        completedAt: new Date().toISOString()
      });
      workflow.metadata.agentsUsed.push('specialist');
      
      // If needed, coordinate with other agents
      if (options.coordinateWithOthers) {
        const coordinationResult = await this.agents.coordinator.execute({
          specialistResult,
          task,
          domain,
          coordinationType: options.coordinationType || 'validation'
        });
        
        workflow.steps.push({
          step: 2,
          agent: 'coordinator',
          description: 'Cross-validation and coordination',
          result: coordinationResult,
          completedAt: new Date().toISOString()
        });
        workflow.metadata.agentsUsed.push('coordinator');
      }
      
      workflow.results = {
        specialist: specialistResult,
        coordination: options.coordinateWithOthers ? coordinationResult : null,
        final: options.coordinateWithOthers ? coordinationResult.finalOutput : specialistResult.output
      };
      
      workflow.status = 'completed';
      workflow.completedAt = new Date().toISOString();
      
      return {
        workflowId,
        result: workflow.results.final,
        steps: workflow.steps,
        domain,
        confidence: specialistResult.confidence
      };
      
    } catch (error) {
      workflow.status = 'failed';
      workflow.error = error.message;
      workflow.completedAt = new Date().toISOString();
      
      throw error;
    }
  }

  /**
   * Execute parallel tasks across multiple agents
   */
  async executeParallelTasks(tasks, options = {}) {
    const workflowId = `parallel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const workflow = {
      id: workflowId,
      tasks,
      status: 'initiated',
      startedAt: new Date().toISOString(),
      results: {},
      metadata: {
        agentsUsed: [],
        parallel: true,
        options
      }
    };
    
    this.workflowHistory.push(workflow);
    
    try {
      workflow.status = 'executing';
      
      // Assign tasks to appropriate agents
      const agentTasks = this.assignTasksToAgents(tasks);
      
      // Execute tasks in parallel
      const results = await Promise.all(
        agentTasks.map(async (agentTask) => {
          const agent = this.agents[agentTask.agent];
          const result = await agent.execute(agentTask.payload);
          
          workflow.metadata.agentsUsed.push(agentTask.agent);
          
          return {
            agent: agentTask.agent,
            taskId: agentTask.taskId,
            result,
            completedAt: new Date().toISOString()
          };
        })
      );
      
      // Aggregate results
      const aggregatedResult = await this.agents.coordinator.execute({
        parallelResults: results,
        originalTasks: tasks,
        aggregationType: options.aggregationType || 'merge'
      });
      
      workflow.results = {
        individualResults: results,
        aggregated: aggregatedResult
      };
      
      workflow.status = 'completed';
      workflow.completedAt = new Date().toISOString();
      
      return {
        workflowId,
        results: aggregatedResult,
        individualResults: results,
        summary: this.generateParallelSummary(results)
      };
      
    } catch (error) {
      workflow.status = 'failed';
      workflow.error = error.message;
      workflow.completedAt = new Date().toISOString();
      
      throw error;
    }
  }

  /**
   * Assign tasks to appropriate agents
   */
  assignTasksToAgents(tasks) {
    return tasks.map((task, index) => {
      // Simple assignment logic - in reality, this would be more sophisticated
      let agent;
      
      if (task.type === 'research' || task.type === 'search') {
        agent = 'researcher';
      } else if (task.type === 'analyze' || task.type === 'data') {
        agent = 'analyst';
      } else if (task.type === 'write' || task.type === 'create') {
        agent = 'writer';
      } else if (task.type === 'review' || task.type === 'validate') {
        agent = 'reviewer';
      } else if (task.type === 'coordinate' || task.type === 'manage') {
        agent = 'coordinator';
      } else {
        // Default assignment based on content analysis
        const content = typeof task === 'string' ? task : task.description || task.query || '';
        if (content.toLowerCase().includes('research') || content.toLowerCase().includes('find')) {
          agent = 'researcher';
        } else if (content.toLowerCase().includes('analyze') || content.toLowerCase().includes('data')) {
          agent = 'analyst';
        } else if (content.toLowerCase().includes('write') || content.toLowerCase().includes('create')) {
          agent = 'writer';
        } else if (content.toLowerCase().includes('review') || content.toLowerCase().includes('check')) {
          agent = 'reviewer';
        } else {
          agent = 'coordinator'; // Default coordinator for general tasks
        }
      }
      
      return {
        taskId: index,
        agent,
        payload: task
      };
    });
  }

  /**
   * Generate workflow summary
   */
  generateWorkflowSummary(workflow) {
    return {
      workflowId: workflow.id,
      task: workflow.task,
      status: workflow.status,
      totalSteps: workflow.steps.length,
      agentsUsed: [...new Set(workflow.metadata.agentsUsed)],
      duration: workflow.completedAt 
        ? new Date(workflow.completedAt).getTime() - new Date(workflow.startedAt).getTime()
        : null,
      success: workflow.status === 'completed'
    };
  }

  /**
   * Generate parallel execution summary
   */
  generateParallelSummary(results) {
    return {
      totalTasks: results.length,
      completedTasks: results.filter(r => !r.error).length,
      agentsUsed: [...new Set(results.map(r => r.agent))],
      successRate: (results.filter(r => !r.error).length / results.length) * 100
    };
  }

  /**
   * Get workflow history
   */
  getWorkflowHistory(filter = {}) {
    let filtered = [...this.workflowHistory];
    
    if (filter.status) {
      filtered = filtered.filter(w => w.status === filter.status);
    }
    
    if (filter.agent) {
      filtered = filtered.filter(w => w.metadata?.agentsUsed?.includes(filter.agent));
    }
    
    if (filter.domain) {
      filtered = filtered.filter(w => w.domain === filter.domain);
    }
    
    if (filter.after) {
      filtered = filtered.filter(w => new Date(w.startedAt) >= new Date(filter.after));
    }
    
    if (filter.before) {
      filtered = filtered.filter(w => new Date(w.startedAt) <= new Date(filter.before));
    }
    
    return filtered;
  }

  /**
   * Get workflow statistics
   */
  getStats() {
    const totalWorkflows = this.workflowHistory.length;
    const completedWorkflows = this.workflowHistory.filter(w => w.status === 'completed').length;
    const failedWorkflows = this.workflowHistory.filter(w => w.status === 'failed').length;
    
    const successRate = totalWorkflows > 0 
      ? (completedWorkflows / totalWorkflows) * 100 
      : 0;
    
    // Count agent usage
    const agentUsage = {};
    this.workflowHistory.forEach(workflow => {
      if (workflow.metadata?.agentsUsed) {
        workflow.metadata.agentsUsed.forEach(agent => {
          agentUsage[agent] = (agentUsage[agent] || 0) + 1;
        });
      }
    });
    
    // Calculate average workflow duration
    const completedWorkflowsWithDuration = this.workflowHistory.filter(w => 
      w.status === 'completed' && w.completedAt && w.startedAt
    );
    
    const avgDuration = completedWorkflowsWithDuration.length > 0
      ? completedWorkflowsWithDuration.reduce((sum, w) => {
          const start = new Date(w.startedAt).getTime();
          const end = new Date(w.completedAt).getTime();
          return sum + (end - start);
        }, 0) / completedWorkflowsWithDuration.length
      : 0;
    
    return {
      totalWorkflows,
      completedWorkflows,
      failedWorkflows,
      successRate,
      avgDuration: Math.round(avgDuration),
      agentUsage,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Add shared memory entry
   */
  addToSharedMemory(key, value, ttl = 3600) { // Default TTL: 1 hour
    const expiry = Date.now() + (ttl * 1000);
    this.sharedMemory.set(key, { value, expiry });
  }

  /**
   * Get from shared memory
   */
  getFromSharedMemory(key) {
    const entry = this.sharedMemory.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.sharedMemory.delete(key);
      return null;
    }
    
    return entry.value;
  }

  /**
   * Clear expired entries from shared memory
   */
  clearExpiredMemory() {
    for (const [key, entry] of this.sharedMemory.entries()) {
      if (Date.now() > entry.expiry) {
        this.sharedMemory.delete(key);
      }
    }
  }

  /**
   * Execute a custom workflow with specific agent orchestration
   */
  async executeCustomWorkflow(definition, options = {}) {
    const workflowId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const workflow = {
      id: workflowId,
      definition,
      status: 'initiated',
      startedAt: new Date().toISOString(),
      steps: [],
      results: {},
      metadata: {
        agentsUsed: [],
        custom: true,
        options
      }
    };
    
    this.workflowHistory.push(workflow);
    
    try {
      workflow.status = 'executing';
      
      // Execute each step in the custom workflow
      for (let i = 0; i < definition.steps.length; i++) {
        const step = definition.steps[i];
        const agent = this.agents[step.agent];
        
        if (!agent) {
          throw new Error(`Unknown agent: ${step.agent}`);
        }
        
        const result = await agent.execute({
          ...step.payload,
          workflowContext: {
            stepIndex: i,
            totalSteps: definition.steps.length,
            previousResults: workflow.steps.map(s => s.result)
          }
        });
        
        workflow.steps.push({
          step: i + 1,
          agent: step.agent,
          description: step.description || `Step ${i + 1}`,
          result,
          completedAt: new Date().toISOString()
        });
        
        workflow.metadata.agentsUsed.push(step.agent);
      }
      
      // Finalize with coordinator if specified
      if (definition.finalizeWithCoordinator) {
        const finalResult = await this.agents.coordinator.execute({
          customWorkflowResults: workflow.steps.map(s => s.result),
          originalDefinition: definition
        });
        
        workflow.results = {
          steps: workflow.steps.map(s => s.result),
          final: finalResult
        };
      } else {
        workflow.results = {
          steps: workflow.steps.map(s => s.result),
          final: workflow.steps[workflow.steps.length - 1]?.result
        };
      }
      
      workflow.status = 'completed';
      workflow.completedAt = new Date().toISOString();
      
      return {
        workflowId,
        result: workflow.results.final,
        steps: workflow.steps,
        definition
      };
      
    } catch (error) {
      workflow.status = 'failed';
      workflow.error = error.message;
      workflow.completedAt = new Date().toISOString();
      
      throw error;
    }
  }

  /**
   * Export workflow data
   */
  exportWorkflows(format = 'json') {
    const data = {
      workflows: this.workflowHistory,
      stats: this.getStats(),
      exportedAt: new Date().toISOString()
    };
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      // Simplified CSV export
      let csv = 'WorkflowId,Task,Status,StartedAt,CompletedAt,AgentsUsed,Success\n';
      this.workflowHistory.forEach(workflow => {
        csv += `"${workflow.id}","${workflow.task || ''}","${workflow.status}","${workflow.startedAt}","${workflow.completedAt || ''}","${workflow.metadata?.agentsUsed?.join(';') || ''}","${workflow.status === 'completed'}"\n`;
      });
      return csv;
    }
    
    return JSON.stringify(data, null, 2);
  }
}

// Example usage
async function main() {
  const multiAgentSystem = new MultiAgentWorkflow({
    ultraDex: {
      apiKey: process.env.ULTRA_DEX_API_KEY,
      endpoint: process.env.ULTRA_DEX_ENDPOINT || 'https://api.ultra-dex.ai'
    }
  });
  
  try {
    console.log('Multi-Agent Workflow system initialized.');
    
    // Example 1: Execute a complex research task
    console.log('\nExecuting complex research task...');
    const complexResult = await multiAgentSystem.executeComplexTask(
      'Analyze the impact of AI on software development productivity in 2024',
      {
        researchDepth: 'deep',
        analysisType: 'quantitative',
        outputFormat: 'executive_summary',
        audience: 'executives',
        reviewCriteria: ['accuracy', 'relevance', 'actionability']
      }
    );
    
    console.log(`Complex task completed. Result length: ${complexResult.result.length} chars`);
    
    // Example 2: Execute a specialized task
    console.log('\nExecuting specialized task...');
    const specializedResult = await multiAgentSystem.executeSpecializedTask(
      'Calculate the optimal parameters for a neural network with 3 hidden layers',
      'machine_learning',
      {
        expertise: 'deep_learning',
        constraints: ['memory_efficient', 'fast_training'],
        precision: 'very_high'
      }
    );
    
    console.log(`Specialized task completed in domain: ${specializedResult.domain}`);
    
    // Example 3: Execute parallel tasks
    console.log('\nExecuting parallel tasks...');
    const parallelResult = await multiAgentSystem.executeParallelTasks([
      { type: 'research', query: 'latest trends in AI' },
      { type: 'analyze', data: 'software development metrics' },
      { type: 'write', content: 'executive summary template' }
    ]);
    
    console.log(`Parallel execution completed. Tasks processed: ${parallelResult.individualResults.length}`);
    
    // Print workflow statistics
    console.log('\nWorkflow Stats:', multiAgentSystem.getStats());
    
  } catch (error) {
    console.error('Error in main:', error);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export default MultiAgentWorkflow;