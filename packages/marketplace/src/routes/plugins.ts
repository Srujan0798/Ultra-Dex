import { Router, Request, Response } from 'express';
import { pluginService } from '../services/pluginService.js';
import { PluginCreateSchema, PluginUpdateSchema, PluginCategory } from '../models/plugin.js';

const router = Router();

// GET /api/plugins - Get all published plugins
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, author, limit = '50', offset = '0' } = req.query;

    const filters: any = {
      published: true,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    };

    if (category && Object.values(PluginCategory).includes(category as PluginCategory)) {
      filters.category = category;
    }

    if (author) {
      filters.author = author;
    }

    const plugins = await pluginService.getPlugins(filters);
    res.json({ plugins, total: plugins.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch plugins' });
  }
});

// GET /api/plugins/search - Search plugins
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, category } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }

    let pluginCategory: PluginCategory | undefined;
    if (category && Object.values(PluginCategory).includes(category as PluginCategory)) {
      pluginCategory = category as PluginCategory;
    }

    const plugins = await pluginService.searchPlugins(q, pluginCategory);
    res.json({ plugins, total: plugins.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to search plugins' });
  }
});

// GET /api/plugins/:id - Get specific plugin
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const plugin = await pluginService.getPlugin(req.params.id);
    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }
    res.json(plugin);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch plugin' });
  }
});

// POST /api/plugins - Create new plugin
router.post('/', async (req: Request, res: Response) => {
  try {
    const validation = PluginCreateSchema.safeParse(req.body);
    if (!validation.success) {
      return res
        .status(400)
        .json({ error: 'Invalid plugin data', details: validation.error.errors });
    }

    const plugin = await pluginService.createPlugin(validation.data);
    res.status(201).json(plugin);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create plugin' });
  }
});

// PUT /api/plugins/:id - Update plugin
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const validation = PluginUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      return res
        .status(400)
        .json({ error: 'Invalid plugin data', details: validation.error.errors });
    }

    const plugin = await pluginService.updatePlugin(req.params.id, validation.data);
    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }
    res.json(plugin);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update plugin' });
  }
});

// DELETE /api/plugins/:id - Delete plugin
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await pluginService.deletePlugin(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Plugin not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete plugin' });
  }
});

// POST /api/plugins/:id/publish - Publish plugin
router.post('/:id/publish', async (req: Request, res: Response) => {
  try {
    const plugin = await pluginService.publishPlugin(req.params.id);
    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }
    res.json(plugin);
  } catch (error) {
    res.status(500).json({ error: 'Failed to publish plugin' });
  }
});

// POST /api/plugins/:id/unpublish - Unpublish plugin
router.post('/:id/unpublish', async (req: Request, res: Response) => {
  try {
    const plugin = await pluginService.unpublishPlugin(req.params.id);
    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }
    res.json(plugin);
  } catch (error) {
    res.status(500).json({ error: 'Failed to unpublish plugin' });
  }
});

// POST /api/plugins/:id/download - Increment download count
router.post('/:id/download', async (req: Request, res: Response) => {
  try {
    await pluginService.incrementDownloads(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to record download' });
  }
});

export { router as pluginRoutes };
