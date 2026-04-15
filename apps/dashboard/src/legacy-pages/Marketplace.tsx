import { useState, useEffect, memo } from 'react';
import { Search, Download, Star, Package, Filter } from 'lucide-react';

interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: string;
  tags: string[];
  downloads: number;
  rating: number;
  reviews: number;
}

interface MarketplaceStats {
  totalPlugins: number;
  publishedPlugins: number;
  totalDownloads: number;
  categories: Array<{
    category: string;
    count: number;
  }>;
  topPlugins: Array<{
    id: string;
    name: string;
    downloads: number;
    rating: number;
  }>;
}

const MARKETPLACE_API = 'http://localhost:3001/api';

/**
 * Marketplace Page - Browse and install plugins
 */
export const Marketplace = memo(function Marketplace() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    fetchPlugins();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${MARKETPLACE_API}/marketplace/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch marketplace stats:', error);
    }
  };

  const fetchPlugins = async () => {
    try {
      const response = await fetch(`${MARKETPLACE_API}/plugins`);
      const data = await response.json();
      setPlugins(data.plugins);
    } catch (error) {
      console.error('Failed to fetch plugins:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchPlugins = async (query: string) => {
    if (!query.trim()) {
      fetchPlugins();
      return;
    }

    try {
      const response = await fetch(
        `${MARKETPLACE_API}/plugins/search?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setPlugins(data.plugins);
    } catch (error) {
      console.error('Failed to search plugins:', error);
    }
  };

  const installPlugin = async (pluginId: string) => {
    setInstalling(pluginId);
    try {
      // This would integrate with Ultra-Dex CLI to install the plugin
      // For now, just simulate the installation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Increment download count
      await fetch(`${MARKETPLACE_API}/plugins/${pluginId}/download`, {
        method: 'POST',
      });

      alert(`Plugin ${pluginId} installed successfully! Restart Ultra-Dex to activate.`);
    } catch (error) {
      console.error('Failed to install plugin:', error);
      alert('Failed to install plugin. Please try again.');
    } finally {
      setInstalling(null);
    }
  };

  const filteredPlugins = plugins.filter(
    (plugin) => selectedCategory === 'all' || plugin.category === selectedCategory
  );

  const categories = stats?.categories || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Plugin Marketplace</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Extend Ultra-Dex with plugins from the community
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search plugins..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchPlugins(e.target.value);
              }}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.category} value={cat.category}>
                {cat.category.charAt(0).toUpperCase() + cat.category.slice(1)} ({cat.count})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-cyan-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Plugins
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalPlugins}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Download className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Downloads
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalDownloads.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Published</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.publishedPlugins}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Filter className="h-8 w-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Categories</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {categories.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plugin Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlugins.map((plugin) => (
          <div
            key={plugin.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {plugin.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">by {plugin.author}</p>
              </div>
              <span className="px-2 py-1 text-xs bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 rounded">
                {plugin.category}
              </span>
            </div>

            <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-2">
              {plugin.description}
            </p>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <span>v{plugin.version}</span>
                <div className="flex items-center">
                  <Download className="h-4 w-4 mr-1" />
                  {plugin.downloads}
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-1" />
                  {plugin.rating.toFixed(1)} ({plugin.reviews})
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-4">
              {plugin.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                >
                  {tag}
                </span>
              ))}
              {plugin.tags.length > 3 && (
                <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                  +{plugin.tags.length - 3}
                </span>
              )}
            </div>

            <button
              onClick={() => installPlugin(plugin.id)}
              disabled={installing === plugin.id}
              className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"
            >
              {installing === plugin.id ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Installing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Install Plugin
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {filteredPlugins.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No plugins found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Try adjusting your search or category filter.
          </p>
        </div>
      )}
    </div>
  );
});
