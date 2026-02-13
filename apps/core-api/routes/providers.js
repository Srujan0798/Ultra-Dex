import { Router } from 'express';
import { aiMetaLayer } from '../../../src/core/ai/ai-meta-layer.js';

const router = Router();

/**
 * GET /api/v1/providers
 * List available AI providers
 */
router.get('/', async (req, res) => {
  try {
    const providers = aiMetaLayer.listProviders();
    res.json({
      success: true,
      data: providers,
      count: providers.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'LIST_PROVIDERS_FAILED'
    });
  }
});

/**
 * GET /api/v1/providers/:id/status
 * Get provider status
 */
router.get('/:id/status', async (req, res) => {
  try {
    const status = await aiMetaLayer.getProviderStatus(req.params.id);
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'GET_PROVIDER_STATUS_FAILED'
    });
  }
});

/**
 * POST /api/v1/providers/test
 * Test provider connection
 */
router.post('/test', async (req, res) => {
  try {
    const { provider, config } = req.body;
    
    const result = await aiMetaLayer.testProvider(provider, config);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'TEST_PROVIDER_FAILED'
    });
  }
});

export default router;