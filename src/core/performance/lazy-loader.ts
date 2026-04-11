import { performance } from 'perf_hooks';

interface LazyModuleConfig {
  name: string;
  loader: () => Promise<any>;
  priority?: number;
}

interface LoadedModule {
  name: string;
  module: any;
  loadedAt: number;
  loadTime: number;
}

export class LazyLoader {
  private modules: Map<string, LazyModuleConfig> = new Map();
  private loaded: Map<string, LoadedModule> = new Map();
  private loading: Map<string, Promise<any>> = new Map();

  /**
   * Register a module for lazy loading
   */
  register(config: LazyModuleConfig): void {
    this.modules.set(config.name, config);
  }

  /**
   * Load a module on first use
   */
  async load(name: string): Promise<any> {
    // Return already loaded module
    if (this.loaded.has(name)) {
      return this.loaded.get(name)!.module;
    }

    // Return existing promise if loading in progress
    if (this.loading.has(name)) {
      return this.loading.get(name)!;
    }

    const config = this.modules.get(name);
    if (!config) {
      throw new Error(`Module ${name} not registered`);
    }

    // Start loading
    const loadPromise = this.loadModule(config);
    this.loading.set(name, loadPromise);

    try {
      const module = await loadPromise;
      return module;
    } finally {
      this.loading.delete(name);
    }
  }

  private async loadModule(config: LazyModuleConfig): Promise<any> {
    const startTime = performance.now();

    try {
      const module = await config.loader();

      const loadedModule: LoadedModule = {
        name: config.name,
        module,
        loadedAt: Date.now(),
        loadTime: performance.now() - startTime,
      };

      this.loaded.set(config.name, loadedModule);

      console.log(`[LazyLoader] Loaded ${config.name} in ${loadedModule.loadTime.toFixed(2)}ms`);

      return module;
    } catch (error) {
      console.error(`[LazyLoader] Failed to load ${config.name}:`, error);
      throw error;
    }
  }

  /**
   * Check if module is loaded
   */
  isLoaded(name: string): boolean {
    return this.loaded.has(name);
  }

  /**
   * Preload multiple modules
   */
  async preload(names: string[]): Promise<void> {
    await Promise.all(names.map((name) => this.load(name)));
  }

  /**
   * Unload a module to free memory
   */
  unload(name: string): boolean {
    const module = this.loaded.get(name);
    if (!module) return false;

    // Call cleanup if available
    if (typeof module.module?.dispose === 'function') {
      module.module.dispose();
    }

    this.loaded.delete(name);
    console.log(`[LazyLoader] Unloaded ${name}`);
    return true;
  }

  /**
   * Get load statistics
   */
  getStats(): { name: string; loadTime: number; loadedAt: number }[] {
    return Array.from(this.loaded.values()).map((m) => ({
      name: m.name,
      loadTime: m.loadTime,
      loadedAt: m.loadedAt,
    }));
  }

  /**
   * Get total memory usage estimate
   */
  getMemoryUsage(): { loadedModules: number; totalLoadTime: number } {
    const modules = Array.from(this.loaded.values());
    return {
      loadedModules: modules.length,
      totalLoadTime: modules.reduce((sum, m) => sum + m.loadTime, 0),
    };
  }
}

// Global lazy loader instance
export const lazyLoader = new LazyLoader();

// Decorator for lazy loading class methods
export function LazyLoad(moduleName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      await lazyLoader.load(moduleName);
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
