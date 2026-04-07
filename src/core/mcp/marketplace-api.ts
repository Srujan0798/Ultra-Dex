var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};
import { singleton } from "tsyringe";
import fs from "fs/promises";
import path from "path";
function toQueryString(filters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== void 0 && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}
let MarketplaceAPI = class {
  constructor(config = {}) {
    this.registryUrl = config.registryUrl || "https://registry.ultra-dex.ai";
    this.fetchImpl = config.fetchImpl || globalThis.fetch;
    this.cachePath = config.cachePath || path.join(process.cwd(), ".ultra-dex", "mcp-marketplace-cache.json");
  }
  async ensureCacheDir() {
    await fs.mkdir(path.dirname(this.cachePath), { recursive: true });
  }
  async loadCache() {
    await this.ensureCacheDir();
    try {
      const raw = await fs.readFile(this.cachePath, "utf8");
      return JSON.parse(raw);
    } catch (error) {
      if (error.code === "ENOENT") {
        return { search: {}, plugins: {}, updatedAt: null };
      }
      throw error;
    }
  }
  async saveCache(cache) {
    await this.ensureCacheDir();
    await fs.writeFile(
      this.cachePath,
      JSON.stringify(
        {
          ...cache,
          updatedAt: (/* @__PURE__ */ new Date()).toISOString()
        },
        null,
        2
      )
    );
  }
  async request(endpoint, options = {}) {
    if (typeof this.fetchImpl !== "function") {
      throw new Error("Marketplace fetch implementation is unavailable");
    }
    const response = await this.fetchImpl(`${this.registryUrl}${endpoint}`, options);
    if (!response.ok) {
      throw new Error(`Marketplace request failed: ${response.status}`);
    }
    return response;
  }
  async search(query, filters = {}) {
    const cache = await this.loadCache();
    const cacheKey = JSON.stringify({ query, filters });
    const endpoint = `/plugins${toQueryString({ q: query, ...filters })}`;
    try {
      const response = await this.request(endpoint);
      const payload = await response.json();
      const plugins = payload.plugins || payload.items || payload;
      cache.search[cacheKey] = plugins;
      await this.saveCache(cache);
      return plugins;
    } catch (error) {
      if (cache.search[cacheKey]) {
        return cache.search[cacheKey];
      }
      throw error;
    }
  }
  async getPlugin(pluginId) {
    const cache = await this.loadCache();
    try {
      const response = await this.request(`/plugins/${encodeURIComponent(pluginId)}`);
      const plugin = await response.json();
      cache.plugins[pluginId] = plugin;
      await this.saveCache(cache);
      return plugin;
    } catch (error) {
      if (cache.plugins[pluginId]) {
        return cache.plugins[pluginId];
      }
      throw error;
    }
  }
  async download(pluginId, version = "latest") {
    const response = await this.request(
      `/plugins/${encodeURIComponent(pluginId)}/download${toQueryString({ version })}`
    );
    const bytes = await response.arrayBuffer();
    return Buffer.from(bytes);
  }
  async publish(pluginPackage, authToken) {
    const body = Buffer.isBuffer(pluginPackage) ? pluginPackage : await fs.readFile(pluginPackage);
    const response = await this.request("/plugins/publish", {
      method: "POST",
      headers: {
        authorization: authToken ? `Bearer ${authToken}` : "",
        "content-type": "application/octet-stream"
      },
      body
    });
    return await response.json();
  }
};
MarketplaceAPI = __decorateClass([
  singleton()
], MarketplaceAPI);
var marketplace_api_default = MarketplaceAPI;
export {
  MarketplaceAPI,
  marketplace_api_default as default
};
