import { Router } from 'express';
import { agentOrchestrator } from '../../../src/core/orchestration/index.js';
import { validateInput } from '../middleware/validation.js';

const router = Router();

/**
 * GET /api/v1/agents
 * List all agents with their status
 */
router.get('/', async (req, res) => {
  try {
    const agents = agentOrchestrator.listAgents();
    res.json({
      success: true,
      data: agents,
      count: agents.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'LIST_AGENTS_FAILED'
    });
  }
});

/**
 * GET /api/v1/agents/:id
 * Get agent details
 */
router.get('/:id', async (req, res) => {
  try {
    // Validate input
    if (!req.params.id || typeof req.params.id !== 'string' || req.params.id.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Agent ID is required',
        code: 'AGENT_ID_REQUIRED'
      });
    }

    const agent = agentOrchestrator.getAgent(req.params.id);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
        code: 'AGENT_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: agent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'GET_AGENT_FAILED'
    });
  }
});

/**
 * POST /api/v1/agents/:id/execute
 * Execute an agent task
 */
router.post('/:id/execute', async (req, res) => {
  try {
    // Validate input
    if (!req.params.id || typeof req.params.id !== 'string' || req.params.id.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Agent ID is required',
        code: 'AGENT_ID_REQUIRED'
      });
    }

    const { task, context = {}, options = {} } = req.body;

    if (!task || typeof task !== 'string' || task.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Task is required',
        code: 'TASK_REQUIRED'
      });
    }

    if (typeof context !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Context must be an object',
        code: 'INVALID_CONTEXT'
      });
    }

    if (typeof options !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Options must be an object',
        code: 'INVALID_OPTIONS'
      });
    }

    const result = await agentOrchestrator.executeAgent(
      req.params.id,
      task,
      context,
      options
    );

    res.json({
      success: true,
      data: result,
      agentId: req.params.id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'EXECUTE_AGENT_FAILED'
    });
  }
});

/**
 * GET /api/v1/agents/:id/status
 * Get agent status
 */
router.get('/:id/status', async (req, res) => {
  try {
    // Validate input
    if (!req.params.id || typeof req.params.id !== 'string' || req.params.id.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Agent ID is required',
        code: 'AGENT_ID_REQUIRED'
      });
    }

    const status = agentOrchestrator.getAgentStatus(req.params.id);
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'GET_AGENT_STATUS_FAILED'
    });
  }
});

/**
 * GET /api/v1/agents/:id/logs
 * Get agent logs
 */
router.get('/:id/logs', async (req, res) => {
  try {
    // Validate input
    if (!req.params.id || typeof req.params.id !== 'string' || req.params.id.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Agent ID is required',
        code: 'AGENT_ID_REQUIRED'
      });
    }

    const { limit = 50, offset = 0 } = req.query;
    const parsedLimit = parseInt(limit) || 50;
    const parsedOffset = parseInt(offset) || 0;

    const logs = await agentOrchestrator.getAgentLogs(
      req.params.id,
      { limit: parsedLimit, offset: parsedOffset }
    );

    res.json({
      success: true,
      data: logs,
      pagination: {
        limit: parsedLimit,
        offset: parsedOffset,
        total: logs.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'GET_AGENT_LOGS_FAILED'
    });
  }
});

export default router;