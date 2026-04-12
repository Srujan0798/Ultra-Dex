// Copyright (c) 2026 Ultra-Dex

/**
 * Versioning and compatibility logic for the marketplace.
 * Uses a simplified semver logic or external semver if available.
 */

// We can just use standard string comparisons or a lightweight semver parser
export class SemverManager {
  validateVersion(version: string): boolean {
    const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-zA-Z0-9-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-zA-Z0-9-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
    return semverRegex.test(version);
  }

  resolveRange(name: string, range: string, availableVersions: string[]): string | null {
    // simplified resolution: if range is exact, return it if exists
    // if 'latest', return highest version
    if (!availableVersions || availableVersions.length === 0) return null;

    const validVersions = availableVersions.filter(v => this.validateVersion(v));
    if (validVersions.length === 0) return null;

    validVersions.sort((a, b) => this.compareVersions(b, a)); // Descending

    if (range === 'latest' || !range || range === '*') {
      return validVersions[0];
    }

    // Exact match
    if (validVersions.includes(range)) {
      return range;
    }

    // Naive prefix matching for ^ and ~
    const cleanRange = range.replace(/[\^~]/g, '');
    for (const v of validVersions) {
      if (v.startsWith(cleanRange)) {
        return v;
      }
    }

    return validVersions[0]; // fallback
  }

  checkCompatibility(pluginMinVersion: string, ultraDexVersion: string): boolean {
    if (!pluginMinVersion) return true;
    return this.compareVersions(ultraDexVersion, pluginMinVersion) >= 0;
  }

  getChangelog(name: string, from: string, to: string): string {
    return `Changelog for ${name} from ${from} to ${to}:\n- Updated dependencies\n- Bug fixes`;
  }

  private compareVersions(v1: string, v2: string): number {
    const p1 = v1.split('.').map(s => parseInt(s, 10));
    const p2 = v2.split('.').map(s => parseInt(s, 10));

    for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
      const num1 = p1[i] || 0;
      const num2 = p2[i] || 0;
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    return 0;
  }
}

export const semverManager = new SemverManager();
