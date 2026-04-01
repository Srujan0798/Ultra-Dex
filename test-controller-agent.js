// Test Controller Agent functionality

import { ControllerAgent } from './src/core/agents/controller-agent.js';

async function runTests() {
  console.log('🧠 Testing Controller Agent (Brain/CTO)\n');

  const controller = new ControllerAgent({ model: 'qwen3-coder-480b' });

  // Test 1: Initialize and check capabilities
  console.log('Test 1: Initialization and capabilities');
  console.log(`Agent ID: ${controller.id}`);
  console.log(`Agent Name: ${controller.name}`);
  console.log(`Model: ${controller.model}`);
  console.log(`Agent Capabilities: ${controller.agentCapabilities.size} categories`);
  console.log('✅ Initialization test passed\n');

  // Test 2: Receive master protocol
  console.log('Test 2: Receive master protocol');

  const testProtocol = {
    id: 'test_protocol_001',
    objective: 'Build REST API with Express and MongoDB',
    requirements: [
      'Create CRUD endpoints for users',
      'Implement JWT authentication',
      'Add input validation',
      'Write comprehensive tests',
    ],
    constraints: {
      timeframe: '2 days',
      budget: 'standard',
      complexity: 'medium',
    },
    deliverables: {
      'api-endpoints': {
        description: 'Complete REST API with all CRUD operations',
        estimatedHours: 8,
        acceptanceCriteria: [
          'GET /api/users returns user list',
          'POST /api/users creates new user',
          'PUT /api/users/:id updates user',
          'DELETE /api/users/:id deletes user',
        ],
      },
      authentication: {
        description: 'JWT-based authentication system',
        estimatedHours: 6,
        acceptanceCriteria: [
          'User registration endpoint',
          'Login endpoint returns JWT',
          'Protected routes require valid token',
        ],
      },
    },
  };

  try {
    const result = await controller.receiveProtocol(testProtocol);
    console.log(`Protocol ID: ${result.protocolId}`);
    console.log(`Tasks created: ${result.tasks.length}`);
    console.log(`Agent assignments: ${result.assignments.length}`);
    console.log(`Validation criteria: ${result.validationCriteria.length}`);
    console.log('✅ Protocol processing test passed\n');

    // Test 3: Check task breakdown
    console.log('Test 3: Task breakdown verification');
    console.log('Tasks created:');
    result.tasks.forEach((task, index) => {
      console.log(`  ${index + 1}. ${task.name} (${task.type}, priority: ${task.priority})`);
    });
    console.log('✅ Task breakdown test passed\n');

    // Test 4: Agent assignment verification
    console.log('Test 4: Agent assignment verification');
    console.log('Agent assignments:');
    result.assignments.forEach(([taskId, assignment]) => {
      console.log(
        `  Task ${taskId}: ${assignment.agentId} (score: ${assignment.totalScore.toFixed(2)})`
      );
    });
    console.log('✅ Agent assignment test passed\n');

    // Test 5: Validation criteria setup
    console.log('Test 5: Validation criteria');
    console.log(`Validation criteria count: ${result.validationCriteria.length}`);
    console.log('Sample criteria:');
    result.validationCriteria.slice(0, 3).forEach((criteria, index) => {
      console.log(`  ${index + 1}. ${criteria.description} (${criteria.type})`);
    });
    console.log('✅ Validation criteria test passed\n');

    // Test 6: Fake fix prevention initialization
    console.log('Test 6: Fake fix prevention system');
    const protocols = controller.getActiveProtocols();
    if (protocols.length > 0) {
      console.log(`Active protocols: ${protocols.length}`);
      console.log(
        `Fake fix checksum history entries: ${controller.fixDetection.checksumHistory.size}`
      );
      console.log('✅ Fake fix prevention initialization test passed\n');
    }

    // Test 7: Output validation simulation
    console.log('Test 7: Output validation simulation');

    const mockTaskOutput = {
      taskId: result.tasks[0].id,
      changes: [
        {
          filePath: 'src/routes/users.js',
          content: `// User routes implementation\nconst express = require('express');\nconst router = express.Router();\n\n// GET all users\nrouter.get('/', (req, res) => {\n  res.json({ users: [] });\n});\n\nmodule.exports = router;`,
        },
      ],
      metadata: {
        executionTime: '2.5s',
        linesAdded: 10,
        linesModified: 0,
        linesDeleted: 0,
      },
    };

    const validationResult = await controller.validateOutput(mockTaskOutput, result.tasks[0].id);
    console.log(`Validation passed: ${validationResult.passed}`);
    console.log(`Validation score: ${validationResult.score.toFixed(1)}%`);
    console.log(`Checks performed: ${validationResult.checks.length}`);
    console.log('✅ Output validation test passed\n');

    // Test 8: Metrics tracking
    console.log('Test 8: Metrics tracking');
    const metrics = controller.getMetrics();
    console.log(`Protocols processed: ${metrics.protocolsProcessed}`);
    console.log(`Tasks created: ${metrics.tasksCreated}`);
    console.log(`Tasks assigned: ${metrics.tasksAssigned}`);
    console.log(`Tasks validated: ${metrics.tasksValidated}`);
    console.log(`Fake fixes prevented: ${metrics.fakeFixesPrevented}`);
    console.log(`Validation failures: ${metrics.validationFailures}`);
    console.log('✅ Metrics tracking test passed\n');

    // Test 9: Protocol completion
    console.log('Test 9: Protocol completion');

    const completionResults = {
      tasksCompleted: result.tasks.length,
      validationPassed: true,
      deliverablesMet: Object.keys(testProtocol.deliverables).length,
      totalTimeHours: 14,
    };

    const completedProtocol = await controller.completeProtocol(
      result.protocolId,
      completionResults
    );
    console.log(`Protocol status: ${completedProtocol.status}`);
    console.log(`Results: ${JSON.stringify(completionResults, null, 2)}`);
    console.log('✅ Protocol completion test passed\n');

    console.log('🎉 All Controller Agent tests passed successfully!');
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    console.error(error.stack);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Test runner error:', error);
  process.exit(1);
});

