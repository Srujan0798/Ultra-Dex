import { Router } from 'express';
import { agentOrchestrator } from '../../../src/core/orchestration/index.js';

const router = Router();

/**
 * POST /api/v1/tasks
 * Create a new task
 */
router.post('/', async (req, res) => {
  try {
    const { objective, agents, context } = req.body;

    // Validate input
    if (!objective || typeof objective !== 'string' || objective.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Objective is required',
        code: 'OBJECTIVE_REQUIRED'
      });
    }

    if (agents && !Array.isArray(agents)) {
      return res.status(400).json({
        success: false,
        error: 'Agents must be an array',
        code: 'INVALID_AGENTS'
      });
    }

    if (context && typeof context !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Context must be an object',
        code: 'INVALID_CONTEXT'
      });
    }

    const task = await agentOrchestrator.createTask({
      objective: objective.trim(),
      agents: agents || [],
      context: context || {}
    });

    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'CREATE_TASK_FAILED'
    });
  }
});

/**
 * GET /api/v1/tasks/:id
 * Get task status
 */
router.get('/:id', async (req, res) => {
  try {
    // Validate input
    if (!req.params.id || typeof req.params.id !== 'string' || req.params.id.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Task ID is required',
        code: 'TASK_ID_REQUIRED'
      });
    }

    const task = agentOrchestrator.getTask(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
        code: 'TASK_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'GET_TASK_FAILED'
    });
  }
});

/**
 * GET /api/v1/tasks/:id/logs
 * Get task logs
 */
router.get('/:id/logs', async (req, res) => {
  try {
    // Validate input
    if (!req.params.id || typeof req.params.id !== 'string' || req.params.id.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Task ID is required',
        code: 'TASK_ID_REQUIRED'
      });
    }

    const logs = await agentOrchestrator.getTaskLogs(req.params.id);

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'GET_TASK_LOGS_FAILED'
    });
  }
});

export default router;