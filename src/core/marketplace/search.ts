// Copyright (c) 2026 Ultra-Dex

export interface PluginMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  category?: string;
  downloads: number;
  rating: number;
  publishedAt: string;
  minVersion?: string;
}

export interface SearchFilters {
  category?: string;
  author?: string;
  minVersion?: string;
  sortBy?: 'downloads' | 'rating' | 'recent';
}

export class MarketplaceSearch {
  private plugins: Map<string, PluginMetadata> = new Map();

  // Basic in-memory index for local fallback
  indexPlugin(metadata: PluginMetadata): void {
    this.plugins.set(metadata.name, metadata);
  }

  search(query: string, filters: SearchFilters = {}): PluginMetadata[] {
    let results = Array.from(this.plugins.values());

    // Text search
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(
        p => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Apply filters
    if (filters.category) {
      results = results.filter(p => p.category === filters.category);
    }
    if (filters.author) {
      results = results.filter(p => p.author === filters.author);
    }

    // Sort
    const sortBy = filters.sortBy || 'downloads';
    results.sort((a, b) => {
      if (sortBy === 'downloads') {
        return b.downloads - a.downloads;
      }
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      }
      if (sortBy === 'recent') {
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      }
      return 0;
    });

    return results;
  }
}

export const marketplaceSearch = new MarketplaceSearch();
