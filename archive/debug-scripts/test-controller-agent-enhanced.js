// Enhanced Controller Agent Test with improved agent assignment

import { ControllerAgent } from './src/core/agents/controller-agent.js';

async function runEnhancedTests() {
  console.log('🧠 Enhanced Controller Agent Tests\n');

  const controller = new ControllerAgent({ model: 'deepseek-r1' });

  // Enhanced Test 1: Agent assignment with proper skills
  console.log('Enhanced Test 1: Agent assignment with proper skills');

  // First, let's see what agents are available
  console.log('Available agent categories:');
  for (const [category, skills] of controller.agentCapabilities) {
    console.log(`  - ${category}: ${skills.length} skills`);
  }
  console.log('');

  // Create a protocol with clear skill requirements
  const enhancedProtocol = {
    id: 'enhanced_protocol_001',
    objective: 'Build secure user authentication system',
    requirements: [
      'Create user registration endpoint with password hashing',
      'Implement JWT token generation and validation',
      'Add role-based access control (RBAC)',
      'Write unit tests for all authentication functions',
    ],
    constraints: {
      timeframe: '1 day',
      securityLevel: 'high',
    },
    deliverables: {
      'authentication-api': {
        description: 'REST API for user authentication',
        estimatedHours: 6,
        acceptanceCriteria: [
          'POST /api/auth/register creates user with hashed password',
          'POST /api/auth/login returns JWT token',
          'Middleware validates JWT on protected routes',
          'Admin-only routes require admin role',
        ],
      },
      'security-tests': {
        description: 'Comprehensive security test suite',
        estimatedHours: 4,
        acceptanceCriteria: [
          'Test password strength validation',
          'Test JWT expiration',
          'Test role-based access control',
          'Test brute force protection',
        ],
      },
    },
  };

  try {
    console.log('Processing enhanced protocol...');
    const result = await controller.receiveProtocol(enhancedProtocol);

    // Analyze agent assignments
    console.log('\nAgent Assignment Analysis:');
    let assignmentsMade = 0;

    for (const task of result.tasks) {
      if (task.assignedAgent && task.assignedAgent !== 'unassigned') {
        assignmentsMade++;
        console.log(`  ✓ ${task.name}`);
        console.log(`    → Assigned to: ${task.assignedAgent}`);
      } else {
        console.log(`  ✗ ${task.name}`);
        console.log(`    → No agent assigned (skills: ${task.skills?.join(', ') || 'none'})`);
      }
    }

    console.log(`\nAssignments made: ${assignmentsMade}/${result.tasks.length}`);

    // Enhanced Test 2: Output validation with edge cases
    console.log('\nEnhanced Test 2: Output validation edge cases');

    // Test case 1: Valid output
    const validOutput = {
      taskId: result.tasks[0].id,
      changes: [
        {
          filePath: 'src/routes/auth.js',
          content: `// Authentication routes
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

// User registration
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Save user to database (pseudo-code)
    // const user = await User.create({ email, password: hashedPassword });
    
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

module.exports = router;`,
        },
      ],
      metadata: {
        executionTime: '3.2s',
        linesAdded: 25,
        linesModified: 0,
        linesDeleted: 0,
      },
    };

    console.log('Testing valid output validation...');
    const validValidation = await controller.validateOutput(validOutput, result.tasks[0].id);
    console.log(`  Validation passed: ${validValidation.passed}`);
    console.log(`  Score: ${validValidation.score.toFixed(1)}%`);
    console.log(`  Issues: ${validValidation.issues.length}`);

    // Test case 2: Trivial change (potential fake fix)
    const trivialOutput = {
      taskId: result.tasks[1].id,
      changes: [
        {
          filePath: 'src/utils/helpers.js',
          content: '// Just a comment\n// Another comment\n',
        },
      ],
      metadata: {
        executionTime: '0.5s',
        linesAdded: 2,
        linesModified: 0,
        linesDeleted: 0,
      },
    };

    console.log('\nTesting trivial output validation...');
    const trivialValidation = await controller.validateOutput(trivialOutput, result.tasks[1].id);
    console.log(`  Validation passed: ${trivialValidation.passed}`);
    console.log(`  Score: ${trivialValidation.score.toFixed(1)}%`);
    console.log(`  Issues: ${trivialValidation.issues.length}`);
    if (trivialValidation.issues.length > 0) {
      console.log(`  Issue details: ${trivialValidation.issues.join(', ')}`);
    }

    // Test case 3: Empty output
    const emptyOutput = {
      taskId: result.tasks[2].id,
      changes: [],
      metadata: {
        executionTime: '0.1s',
        linesAdded: 0,
        linesModified: 0,
        linesDeleted: 0,
      },
    };

    console.log('\nTesting empty output validation...');
    const emptyValidation = await controller.validateOutput(emptyOutput, result.tasks[2].id);
    console.log(`  Validation passed: ${emptyValidation.passed}`);
    console.log(`  Score: ${emptyValidation.score.toFixed(1)}%`);
    console.log(`  Issues: ${emptyValidation.issues.length}`);

    // Enhanced Test 3: Fake fix detection
    console.log('\nEnhanced Test 3: Fake fix detection system');

    // Simulate circular changes
    const filePath = 'src/middleware/auth.js';
    const contentV1 = `// Authentication middleware v1\nconst jwt = require('jsonwebtoken');`;
    const contentV2 = `// Authentication middleware v2\nconst jwt = require('jsonwebtoken');\n// Added comment`;
    const contentV1Again = `// Authentication middleware v1\nconst jwt = require('jsonwebtoken');`;

    // First change
    const change1 = {
      taskId: 'test_task_1',
      changes: [
        {
          filePath,
          content: contentV1,
        },
      ],
    };

    const validation1 = await controller.validateOutput(change1, 'test_task_1');
    console.log(`  First change validation: ${validation1.passed ? 'passed' : 'failed'}`);

    // Second change (different)
    const change2 = {
      taskId: 'test_task_2',
      changes: [
        {
          filePath,
          content: contentV2,
        },
      ],
    };

    const validation2 = await controller.validateOutput(change2, 'test_task_2');
    console.log(`  Second change validation: ${validation2.passed ? 'passed' : 'failed'}`);

    // Third change (circular - back to v1)
    const change3 = {
      taskId: 'test_task_3',
      changes: [
        {
          filePath,
          content: contentV1Again,
        },
      ],
    };

    const validation3 = await controller.validateOutput(change3, 'test_task_3');
    console.log(
      `  Third change (circular) validation: ${validation3.passed ? 'passed' : 'failed'}`
    );
    if (!validation3.passed) {
      console.log(
        `    Fake fix detection triggered: ${validation3.issues.find((i) => i.includes('fake fix')) || 'unknown'}`
      );
    }

    // Enhanced Test 4: Protocol lifecycle
    console.log('\nEnhanced Test 4: Protocol lifecycle management');

    const activeProtocols = controller.getActiveProtocols();
    console.log(`  Active protocols: ${activeProtocols.length}`);

    // Complete protocol
    const completionData = {
      tasksCompleted: result.tasks.length,
      deliverablesCompleted: Object.keys(enhancedProtocol.deliverables).length,
      totalTimeSpent: 8.5,
      qualityScore: 92,
      securityAuditPassed: true,
    };

    await controller.completeProtocol(result.protocolId, completionData);

    const finalProtocols = controller.getActiveProtocols();
    console.log(`  Active protocols after completion: ${finalProtocols.length}`);
    console.log(`  Protocol successfully completed and cleaned up`);

    // Enhanced Test 5: Metrics analysis
    console.log('\nEnhanced Test 5: Comprehensive metrics');

    const metrics = controller.getMetrics();
    console.log('Controller Agent Metrics:');
    console.log(`  Protocols processed: ${metrics.protocolsProcessed}`);
    console.log(`  Tasks created: ${metrics.tasksCreated}`);
    console.log(`  Tasks assigned: ${metrics.tasksAssigned}`);
    console.log(`  Tasks validated: ${metrics.tasksValidated}`);
    console.log(`  Fake fixes prevented: ${metrics.fakeFixesPrevented}`);
    console.log(`  Validation failures: ${metrics.validationFailures}`);

    // Calculate success rates
    const assignmentRate =
      metrics.tasksCreated > 0
        ? ((metrics.tasksAssigned / metrics.tasksCreated) * 100).toFixed(1)
        : 0;
    const validationRate =
      metrics.tasksValidated > 0
        ? (
            (metrics.tasksValidated / (metrics.tasksValidated + metrics.validationFailures)) *
            100
          ).toFixed(1)
        : 0;

    console.log(`\nPerformance Indicators:`);
    console.log(`  Task assignment rate: ${assignmentRate}%`);
    console.log(`  Validation success rate: ${validationRate}%`);
    console.log(`  Fake fix detection rate: ${metrics.fakeFixesPrevented} prevented`);

    console.log('\n🎉 Enhanced Controller Agent tests completed successfully!');
  } catch (error) {
    console.error(`❌ Enhanced test failed: ${error.message}`);
    console.error(error.stack);
  }
}

// Run enhanced tests
runEnhancedTests().catch((error) => {
  console.error('Enhanced test runner error:', error);
  process.exit(1);
});

