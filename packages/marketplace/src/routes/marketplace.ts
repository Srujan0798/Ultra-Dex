import { Router, Request, Response } from 'express';
import { pluginService } from '../services/pluginService.js';
import { PluginCategory } from '../models/plugin.js';

const router = Router();

// GET /api/marketplace/stats - Get marketplace statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const allPlugins = await pluginService.getPlugins();
    const publishedPlugins = allPlugins.filter((p) => p.published);

    const stats = {
      totalPlugins: allPlugins.length,
      publishedPlugins: publishedPlugins.length,
      totalDownloads: publishedPlugins.reduce((sum, p) => sum + p.downloads, 0),
      categories: Object.values(PluginCategory).map((category) => ({
        category,
        count: publishedPlugins.filter((p) => p.category === category).length,
      })),
      topPlugins: publishedPlugins
        .sort((a, b) => b.downloads - a.downloads)
        .slice(0, 10)
        .map((p) => ({
          id: p.id,
          name: p.name,
          downloads: p.downloads,
          rating: p.rating,
        })),
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch marketplace stats' });
  }
});

// GET /api/marketplace/categories - Get plugin categories with counts
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const plugins = await pluginService.getPlugins({ published: true });

    const categories = Object.values(PluginCategory).map((category) => ({
      category,
      count: plugins.filter((p) => p.category === category).length,
      description: getCategoryDescription(category),
    }));

    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

function getCategoryDescription(category: PluginCategory): string {
  switch (category) {
    case PluginCategory.AGENT:
      return 'AI agents that can perform tasks autonomously';
    case PluginCategory.PROVIDER:
      return 'AI model providers and integrations';
    case PluginCategory.TOOL:
      return 'Utility tools and extensions';
    case PluginCategory.WORKFLOW:
      return 'Pre-built workflows and automation templates';
    default:
      return '';
  }
}

export { router as marketplaceRoutes };
