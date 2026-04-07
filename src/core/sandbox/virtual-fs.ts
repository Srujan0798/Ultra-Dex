class VirtualFileSystem {
  files = /* @__PURE__ */ new Map();
  directories = /* @__PURE__ */ new Set();
  constructor() {
    this.directories.add("/");
  }
  async readFile(filePath) {
    const normalizedPath = this.normalizePath(filePath);
    const content = this.files.get(normalizedPath);
    if (content === void 0) {
      throw new Error(`ENOENT: no such file or directory, open '${filePath}'`);
    }
    return content;
  }
  async writeFile(filePath, content) {
    const normalizedPath = this.normalizePath(filePath);
    const parentDir = this.getParentDirectory(normalizedPath);
    if (!this.directories.has(parentDir)) {
      throw new Error(`ENOENT: no such directory '${parentDir}'`);
    }
    this.files.set(normalizedPath, content);
  }
  async exists(filePath) {
    const normalizedPath = this.normalizePath(filePath);
    return this.files.has(normalizedPath) || this.directories.has(normalizedPath);
  }
  async list(directory) {
    const normalizedDir = this.normalizePath(directory);
    if (!this.directories.has(normalizedDir)) {
      throw new Error(`ENOENT: no such directory '${directory}'`);
    }
    const results = [];
    const prefix = normalizedDir === "/" ? "" : normalizedDir;
    for (const filePath of this.files.keys()) {
      if (filePath.startsWith(prefix + "/") || prefix === "" && filePath.startsWith("/")) {
        const relativePath = prefix === "" ? filePath.slice(1) : filePath.slice(prefix.length + 1);
        if (!relativePath.includes("/")) {
          results.push(relativePath);
        }
      }
    }
    for (const dirPath of this.directories) {
      if (dirPath.startsWith(prefix + "/") || prefix === "" && dirPath.startsWith("/")) {
        const relativePath = prefix === "" ? dirPath.slice(1) : dirPath.slice(prefix.length + 1);
        if (relativePath && !relativePath.includes("/")) {
          results.push(relativePath + "/");
        }
      }
    }
    return [...new Set(results)].sort();
  }
  async mkdir(directory) {
    const normalizedDir = this.normalizePath(directory);
    const parts = normalizedDir.split("/").filter(Boolean);
    let currentPath = "";
    for (const part of parts) {
      currentPath += "/" + part;
      this.directories.add(currentPath);
    }
  }
  async rm(filePath) {
    const normalizedPath = this.normalizePath(filePath);
    if (this.files.has(normalizedPath)) {
      this.files.delete(normalizedPath);
    } else if (this.directories.has(normalizedPath)) {
      this.directories.delete(normalizedPath);
      for (const [path] of this.files) {
        if (path.startsWith(normalizedPath + "/")) {
          this.files.delete(path);
        }
      }
      for (const dir of this.directories) {
        if (dir.startsWith(normalizedPath + "/")) {
          this.directories.delete(dir);
        }
      }
    } else {
      throw new Error(`ENOENT: no such file or directory '${filePath}'`);
    }
  }
  async stat(filePath) {
    const normalizedPath = this.normalizePath(filePath);
    if (this.files.has(normalizedPath)) {
      const content = this.files.get(normalizedPath);
      return {
        isFile: true,
        isDirectory: false,
        size: Buffer.byteLength(content, "utf8")
      };
    }
    if (this.directories.has(normalizedPath)) {
      return {
        isFile: false,
        isDirectory: true,
        size: 0
      };
    }
    throw new Error(`ENOENT: no such file or directory '${filePath}'`);
  }
  /**
   * Get all file paths
   */
  getAllFiles() {
    return Array.from(this.files.keys());
  }
  /**
   * Clear all files and directories
   */
  clear() {
    this.files.clear();
    this.directories.clear();
    this.directories.add("/");
  }
  /**
   * Serialize to JSON
   */
  toJSON() {
    return Object.fromEntries(this.files);
  }
  /**
   * Load from JSON
   */
  fromJSON(data) {
    this.clear();
    for (const [path, content] of Object.entries(data)) {
      this.files.set(path, content);
      const parentDir = this.getParentDirectory(path);
      if (parentDir !== "/") {
        this.directories.add(parentDir);
      }
    }
  }
  normalizePath(filePath) {
    let normalized = filePath.replace(/\/+$/, "");
    if (!normalized.startsWith("/")) {
      normalized = "/" + normalized;
    }
    return normalized || "/";
  }
  getParentDirectory(filePath) {
    const normalized = this.normalizePath(filePath);
    const lastSlash = normalized.lastIndexOf("/");
    if (lastSlash <= 0) {
      return "/";
    }
    return normalized.slice(0, lastSlash) || "/";
  }
}
class NullFileSystem {
  async readFile(filePath) {
    throw new Error(`EACCES: file system access denied for '${filePath}'`);
  }
  async writeFile(filePath, _content) {
    throw new Error(`EACCES: file system access denied for '${filePath}'`);
  }
  async exists(filePath) {
    return false;
  }
  async list(_directory) {
    return [];
  }
}
class ReadOnlyFileSystem {
  constructor(delegate) {
    this.delegate = delegate;
  }
  async readFile(filePath) {
    return this.delegate.readFile(filePath);
  }
  async writeFile(filePath, _content) {
    throw new Error(`EROFS: read-only file system, cannot write '${filePath}'`);
  }
  async exists(filePath) {
    return this.delegate.exists(filePath);
  }
  async list(directory) {
    return this.delegate.list(directory);
  }
}
export {
  NullFileSystem,
  ReadOnlyFileSystem,
  VirtualFileSystem
};
