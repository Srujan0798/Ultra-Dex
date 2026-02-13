import { Router } from 'express';
import { ppmManager } from '../../../src/core/memory/manager.js';

const router = Router();

/**
 * GET /api/v1/memory/search
 * Search memory entries
 */
router.get('/search', async (req, res) => {
  try {
    const { query, type, limit = 10, offset = 0 } = req.query;

    // Validate input
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Search query is required',
        code: 'QUERY_REQUIRED'
      });
    }

    const parsedLimit = parseInt(limit) || 10;
    const parsedOffset = parseInt(offset) || 0;

    if (parsedLimit < 1 || parsedLimit > 100) {
      return res.status(400).json({
        success: false,
        error: 'Limit must be between 1 and 100',
        code: 'INVALID_LIMIT'
      });
    }

    if (parsedOffset < 0) {
      return res.status(400).json({
        success: false,
        error: 'Offset must be non-negative',
        code: 'INVALID_OFFSET'
      });
    }

    const results = await ppmManager.search({
      query: query.trim(),
      type: type || undefined,
      limit: parsedLimit,
      offset: parsedOffset
    });

    res.json({
      success: true,
      data: results,
      count: results.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'SEARCH_MEMORY_FAILED'
    });
  }
});

/**
 * POST /api/v1/memory/store
 * Store a memory entry
 */
router.post('/store', async (req, res) => {
  try {
    const { content, type, metadata } = req.body;

    // Validate input
    if (!content || typeof content !== 'string' || content.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Content is required',
        code: 'CONTENT_REQUIRED'
      });
    }

    if (type && typeof type !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Type must be a string',
        code: 'INVALID_TYPE'
      });
    }

    if (metadata && typeof metadata !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Metadata must be an object',
        code: 'INVALID_METADATA'
      });
    }

    const entry = await ppmManager.store({
      content: content.trim(),
      type: type || 'observation',
      metadata: metadata || {}
    });

    res.status(201).json({
      success: true,
      data: entry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'STORE_MEMORY_FAILED'
    });
  }
});

/**
 * GET /api/v1/memory/stats
 * Get memory statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = ppmManager.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'GET_MEMORY_STATS_FAILED'
    });
  }
});

export default router;