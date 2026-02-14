# Multi-Agent Workflow Example

This example demonstrates how to create a multi-agent system using Ultra-Dex. Multiple specialized agents work together to accomplish complex tasks through coordinated workflows.

## Features

- **Specialized Agent Coordination**: Different agents with specific roles collaborate
- **Task Delegation and Routing**: Tasks are intelligently routed to appropriate agents
- **Shared Memory and Context**: Agents share information and context
- **Workflow Orchestration**: Complex workflows are managed and executed
- **Result Aggregation and Synthesis**: Results from multiple agents are combined
- **Parallel Task Execution**: Multiple tasks can be executed simultaneously
- **Custom Workflow Definition**: Define custom workflows with specific steps
- **Performance Monitoring**: Track workflow execution and agent utilization

## Prerequisites

- Node.js 18+
- Ultra-Dex API key

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

The multi-agent system uses several specialized agents:

- `researcher`: Researches and gathers information from various sources
- `analyst`: Analyzes data and information to identify patterns and insights
- `writer`: Creates well-structured, coherent content based on research and analysis
- `reviewer`: Reviews and validates content for accuracy, quality, and compliance
- `coordinator`: Coordinates agent activities, manages workflow, and synthesizes results
- `specialist`: Provides domain-specific expertise for specialized tasks

## Usage

The multi-agent system can execute various types of workflows:

```javascript
const multiAgentSystem = new MultiAgentWorkflow({
  ultraDex: {
    apiKey: process.env.ULTRA_DEX_API_KEY,
    endpoint: process.env.ULTRA_DEX_ENDPOINT || 'https://api.ultra-dex.ai'
  }
});

// Execute a complex task using multiple agents
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

// Execute a specialized task requiring domain expertise
const specializedResult = await multiAgentSystem.executeSpecializedTask(
  'Calculate the optimal parameters for a neural network with 3 hidden layers',
  'machine_learning',
  {
    expertise: 'deep_learning',
    constraints: ['memory_efficient', 'fast_training'],
    precision: 'very_high'
  }
);

// Execute multiple tasks in parallel
const parallelResult = await multiAgentSystem.executeParallelTasks([
  { type: 'research', query: 'latest trends in AI' },
  { type: 'analyze', data: 'software development metrics' },
  { type: 'write', content: 'executive summary template' }
]);

// Define and execute a custom workflow
const customWorkflow = {
  steps: [
    {
      agent: 'researcher',
      description: 'Gather market data',
      payload: { query: 'market analysis for product X', sources: ['web', 'internal'] }
    },
    {
      agent: 'analyst',
      description: 'Analyze gathered data',
      payload: { data: '/* data from previous step */', analysisType: 'trend_analysis' }
    },
    {
      agent: 'writer',
      description: 'Create report',
      payload: { analysis: '/* analysis from previous step */', format: 'market_report' }
    }
  ],
  finalizeWithCoordinator: true
};

const customResult = await multiAgentSystem.executeCustomWorkflow(customWorkflow);
```

## Agent Roles

Each agent has a specific role:

- **Researcher**: Gathers information from various sources
- **Analyst**: Analyzes data and identifies patterns
- **Writer**: Creates structured content
- **Reviewer**: Validates accuracy and quality
- **Coordinator**: Manages workflow and synthesizes results
- **Specialist**: Provides domain-specific expertise

## Workflow Types

The system supports different types of workflows:

- **Complex Tasks**: Multi-step workflows involving all agents
- **Specialized Tasks**: Domain-specific tasks for the specialist agent
- **Parallel Tasks**: Multiple tasks executed simultaneously
- **Custom Workflows**: User-defined workflows with specific steps

## Task Assignment

Tasks are intelligently assigned to agents based on:

- Task type (research, analysis, writing, etc.)
- Content analysis of the task description
- Domain requirements
- Available agent capabilities

## Shared Memory

Agents can share information through shared memory:

- **addToSharedMemory()**: Add data to shared memory
- **getFromSharedMemory()**: Retrieve data from shared memory
- **TTL Management**: Automatic expiration of stored data
- **Context Sharing**: Share context between workflow steps

## Parallel Execution

Execute multiple tasks simultaneously:

- **Task Distribution**: Distribute tasks across available agents
- **Result Aggregation**: Combine results from parallel executions
- **Synchronization**: Coordinate parallel task completion
- **Performance Optimization**: Maximize throughput

## Custom Workflows

Define custom workflows with specific steps:

- **Step Definition**: Specify agent and payload for each step
- **Sequential Execution**: Execute steps in defined order
- **Context Propagation**: Pass context between steps
- **Result Synthesis**: Combine results from all steps

## Monitoring and Analytics

Track workflow performance:

- **Execution Statistics**: Success rates, durations, agent usage
- **Workflow History**: Detailed logs of all executions
- **Performance Metrics**: Throughput, response times, error rates
- **Agent Utilization**: Track which agents are used most

## Export and Import

Manage workflow data:

- **JSON Export**: Export workflow history in JSON format
- **CSV Export**: Export workflow data in CSV format
- **Analytics**: Analyze workflow patterns and performance

## Customization

You can customize the multi-agent system by modifying:

- Agent roles and responsibilities
- Task assignment logic
- Workflow orchestration rules
- Shared memory management
- Performance optimization strategies
- Custom workflow definitions

## Security

- Store API keys securely using environment variables
- Implement proper access controls for workflow execution
- Ensure data privacy in shared memory systems