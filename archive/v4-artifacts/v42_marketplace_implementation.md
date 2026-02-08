# 🚀 ULTRA-DEX V4.2.0 - AGENT MARKETPLACE

## 🎯 Community Agent Sharing Platform

### Objective
Create a marketplace for community agents, templates, and plugins with rating, review, and easy installation system.

### Implementation Plan

#### 1. Marketplace Core System
```javascript
// File: cli/lib/marketplace/core.js
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class AgentMarketplace {
  constructor(options = {}) {
    this.marketplaceDir = options.marketplaceDir || path.join(process.cwd(), '.ultra-dex', 'marketplace');
    this.packagesDir = path.join(this.marketplaceDir, 'packages');
    this.cacheDir = path.join(this.marketplaceDir, 'cache');
    this.installedDir = path.join(this.marketplaceDir, 'installed');
  }

  async initialize() {
    await fs.mkdir(this.marketplaceDir, { recursive: true });
    await fs.mkdir(this.packagesDir, { recursive: true });
    await fs.mkdir(this.cacheDir, { recursive: true });
    await fs.mkdir(this.installedDir, { recursive: true });
  }

  async createPackage(metadata) {
    const packageId = `${metadata.author}-${metadata.name}`;
    const packageDir = path.join(this.packagesDir, packageId);
    
    await fs.mkdir(packageDir, { recursive: true });
    
    const packageJson = {
      id: packageId,
      name: metadata.name,
      version: metadata.version || '1.0.0',
      description: metadata.description,
      author: metadata.author,
      license: metadata.license || 'MIT',
      type: metadata.type || 'agent', // agent, template, plugin
      tags: metadata.tags || [],
      dependencies: metadata.dependencies || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      downloads: 0,
      rating: 0,
      reviews: 0
    };

    await fs.writeFile(
      path.join(packageDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    return packageJson;
  }

  async uploadPackage(packagePath, metadata) {
    const packageData = await this.createPackage(metadata);
    const packageDir = path.join(this.packagesDir, packageData.id);
    
    // Copy package files
    await this.copyPackageFiles(packagePath, packageDir);
    
    return packageData;
  }

  async copyPackageFiles(src, dest) {
    const entries = await fs.readdir(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await fs.mkdir(destPath, { recursive: true });
        await this.copyPackageFiles(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  async searchPackages(query, filters = {}) {
    const packages = [];
    const entries = await fs.readdir(this.packagesDir);
    
    for (const entry of entries) {
      const packageDir = path.join(this.packagesDir, entry);
      const packageJsonPath = path.join(packageDir, 'package.json');
      
      try {
        const content = await fs.readFile(packageJsonPath, 'utf8');
        const pkg = JSON.parse(content);
        
        if (this.matchesQuery(pkg, query, filters)) {
          packages.push(pkg);
        }
      } catch (error) {
        // Skip invalid packages
        continue;
      }
    }
    
    return packages.sort((a, b) => b.downloads - a.downloads);
  }

  matchesQuery(pkg, query, filters) {
    const queryString = query.toLowerCase();
    const matchesQuery = 
      pkg.name.toLowerCase().includes(queryString) ||
      pkg.description.toLowerCase().includes(queryString) ||
      pkg.tags.some(tag => tag.toLowerCase().includes(queryString));
    
    const matchesFilters = Object.entries(filters).every(([key, value]) => {
      if (key === 'type') return pkg.type === value;
      if (key === 'author') return pkg.author === value;
      if (key === 'minRating') return pkg.rating >= value;
      return true;
    });
    
    return matchesQuery && matchesFilters;
  }

  async installPackage(packageId, options = {}) {
    const packageDir = path.join(this.packagesDir, packageId);
    const installedDir = path.join(this.installedDir, packageId);
    
    // Check if package exists
    try {
      await fs.access(packageDir);
    } catch {
      throw new Error(`Package ${packageId} not found`);
    }
    
    // Copy to installed directory
    await fs.mkdir(installedDir, { recursive: true });
    await this.copyPackageFiles(packageDir, installedDir);
    
    // Update download count
    await this.incrementDownloadCount(packageId);
    
    return { success: true, installedDir };
  }

  async incrementDownloadCount(packageId) {
    const packageDir = path.join(this.packagesDir, packageId);
    const packageJsonPath = path.join(packageDir, 'package.json');
    
    const content = await fs.readFile(packageJsonPath, 'utf8');
    const pkg = JSON.parse(content);
    
    pkg.downloads = (pkg.downloads || 0) + 1;
    pkg.updatedAt = new Date().toISOString();
    
    await fs.writeFile(packageJsonPath, JSON.stringify(pkg, null, 2));
  }

  async getPackageDetails(packageId) {
    const packageDir = path.join(this.packagesDir, packageId);
    const packageJsonPath = path.join(packageDir, 'package.json');
    
    try {
      const content = await fs.readFile(packageJsonPath, 'utf8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async listInstalledPackages() {
    const entries = await fs.readdir(this.installedDir);
    const packages = [];
    
    for (const entry of entries) {
      const packageJsonPath = path.join(this.installedDir, entry, 'package.json');
      try {
        const content = await fs.readFile(packageJsonPath, 'utf8');
        packages.push(JSON.parse(content));
      } catch {
        continue;
      }
    }
    
    return packages;
  }
}
```

#### 2. Rating and Review System
```javascript
// File: cli/lib/marketplace/ratings.js
import fs from 'fs/promises';
import path from 'path';

export class RatingSystem {
  constructor(marketplace) {
    this.marketplace = marketplace;
    this.reviewsDir = path.join(marketplace.marketplaceDir, 'reviews');
  }

  async initialize() {
    await fs.mkdir(this.reviewsDir, { recursive: true });
  }

  async submitReview(packageId, reviewData) {
    const reviewId = `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const review = {
      id: reviewId,
      packageId,
      userId: reviewData.userId || 'anonymous',
      rating: Math.min(5, Math.max(1, reviewData.rating)),
      title: reviewData.title,
      comment: reviewData.comment,
      createdAt: new Date().toISOString(),
      helpful: 0
    };

    const reviewFile = path.join(this.reviewsDir, `${reviewId}.json`);
    await fs.writeFile(reviewFile, JSON.stringify(review, null, 2));

    // Update package rating
    await this.updatePackageRating(packageId);

    return review;
  }

  async updatePackageRating(packageId) {
    const reviews = await this.getPackageReviews(packageId);
    if (reviews.length === 0) return;

    const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    
    // Update package metadata
    const packageDir = path.join(this.marketplace.packagesDir, packageId);
    const packageJsonPath = path.join(packageDir, 'package.json');
    
    const content = await fs.readFile(packageJsonPath, 'utf8');
    const pkg = JSON.parse(content);
    
    pkg.rating = parseFloat(avgRating.toFixed(1));
    pkg.reviews = reviews.length;
    
    await fs.writeFile(packageJsonPath, JSON.stringify(pkg, null, 2));
  }

  async getPackageReviews(packageId) {
    const allReviews = await fs.readdir(this.reviewsDir);
    const packageReviews = [];

    for (const reviewFile of allReviews) {
      if (reviewFile.endsWith('.json')) {
        const reviewPath = path.join(this.reviewsDir, reviewFile);
        const content = await fs.readFile(reviewPath, 'utf8');
        const review = JSON.parse(content);
        
        if (review.packageId === packageId) {
          packageReviews.push(review);
        }
      }
    }

    return packageReviews.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  async markReviewHelpful(reviewId, helpful = true) {
    const reviewPath = path.join(this.reviewsDir, `${reviewId}.json`);
    const content = await fs.readFile(reviewPath, 'utf8');
    const review = JSON.parse(content);
    
    review.helpful = (review.helpful || 0) + (helpful ? 1 : 0);
    
    await fs.writeFile(reviewPath, JSON.stringify(review, null, 2));
    return review;
  }
}
```

#### 3. CLI Commands for Marketplace
```javascript
// File: cli/lib/commands/marketplace.js
import { AgentMarketplace } from '../marketplace/core.js';
import { RatingSystem } from '../marketplace/ratings.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import fs from 'fs/promises';
import path from 'path';

export async function registerMarketplaceCommand(program) {
  const marketplaceCmd = program
    .command('marketplace')
    .alias('mp')
    .description('Manage agent marketplace');

  const marketplace = new AgentMarketplace();
  const ratingSystem = new RatingSystem(marketplace);

  await marketplace.initialize();
  await ratingSystem.initialize();

  marketplaceCmd
    .command('search <query>')
    .description('Search for packages in marketplace')
    .option('-t, --type <type>', 'Filter by type (agent, template, plugin)')
    .option('-a, --author <author>', 'Filter by author')
    .option('-r, --rating <min>', 'Minimum rating', parseFloat)
    .action(async (query, options) => {
      try {
        const filters = {};
        if (options.type) filters.type = options.type;
        if (options.author) filters.author = options.author;
        if (options.rating) filters.minRating = options.rating;

        const packages = await marketplace.searchPackages(query, filters);

        if (packages.length === 0) {
          printInfo('No packages found matching your search');
          return;
        }

        printInfo(`Found ${packages.length} packages:`);
        packages.forEach(pkg => {
          printInfo(`\n📦 ${pkg.name} (${pkg.version})`);
          printInfo(`   Author: ${pkg.author}`);
          printInfo(`   Type: ${pkg.type}`);
          printInfo(`   Downloads: ${pkg.downloads}`);
          printInfo(`   Rating: ${pkg.rating}/5.0 (${pkg.reviews} reviews)`);
          printInfo(`   Tags: ${pkg.tags.join(', ')}`);
          printInfo(`   Description: ${pkg.description}`);
        });
      } catch (error) {
        printError(`Search failed: ${error.message}`);
      }
    });

  marketplaceCmd
    .command('install <packageId>')
    .description('Install a package from marketplace')
    .action(async (packageId) => {
      try {
        const result = await marketplace.installPackage(packageId);
        if (result.success) {
          printSuccess(`Package installed successfully: ${packageId}`);
          printInfo(`Location: ${result.installedDir}`);
        }
      } catch (error) {
        printError(`Installation failed: ${error.message}`);
      }
    });

  marketplaceCmd
    .command('publish <packagePath>')
    .description('Publish a package to marketplace')
    .option('-n, --name <name>', 'Package name')
    .option('-v, --version <version>', 'Package version')
    .option('-d, --description <desc>', 'Package description')
    .option('-a, --author <author>', 'Package author')
    .option('-l, --license <license>', 'Package license')
    .option('-t, --tags <tags>', 'Package tags (comma separated)')
    .action(async (packagePath, options) => {
      try {
        const metadata = {
          name: options.name,
          version: options.version,
          description: options.description,
          author: options.author,
          license: options.license,
          tags: options.tags?.split(',').map(t => t.trim()) || []
        };

        // Validate required fields
        if (!metadata.name || !metadata.description || !metadata.author) {
          printError('Name, description, and author are required');
          return;
        }

        const result = await marketplace.uploadPackage(packagePath, metadata);
        printSuccess(`Package published: ${result.id}`);
        printInfo(`Version: ${result.version}`);
        printInfo(`Type: ${result.type}`);
      } catch (error) {
        printError(`Publish failed: ${error.message}`);
      }
    });

  marketplaceCmd
    .command('list-installed')
    .description('List installed packages')
    .action(async () => {
      try {
        const packages = await marketplace.listInstalledPackages();
        
        if (packages.length === 0) {
          printInfo('No packages installed');
          return;
        }

        printInfo(`Installed packages (${packages.length}):`);
        packages.forEach(pkg => {
          printInfo(`\n📦 ${pkg.name} (${pkg.version})`);
          printInfo(`   ID: ${pkg.id}`);
          printInfo(`   Type: ${pkg.type}`);
          printInfo(`   Author: ${pkg.author}`);
        });
      } catch (error) {
        printError(`List failed: ${error.message}`);
      }
    });

  marketplaceCmd
    .command('review <packageId>')
    .description('Submit a review for a package')
    .option('-r, --rating <rating>', 'Rating (1-5)', parseInt)
    .option('-t, --title <title>', 'Review title')
    .option('-c, --comment <comment>', 'Review comment')
    .action(async (packageId, options) => {
      try {
        if (!options.rating || options.rating < 1 || options.rating > 5) {
          printError('Rating must be between 1 and 5');
          return;
        }

        const reviewData = {
          rating: options.rating,
          title: options.title,
          comment: options.comment,
          userId: 'current-user' // Would come from auth system
        };

        const review = await ratingSystem.submitReview(packageId, reviewData);
        printSuccess(`Review submitted for ${packageId}`);
        printInfo(`Rating: ${review.rating}/5`);
        printInfo(`"${review.title}"`);
      } catch (error) {
        printError(`Review submission failed: ${error.message}`);
      }
    });

  marketplaceCmd
    .command('info <packageId>')
    .description('Get detailed information about a package')
    .action(async (packageId) => {
      try {
        const pkg = await marketplace.getPackageDetails(packageId);
        if (!pkg) {
          printWarning(`Package ${packageId} not found`);
          return;
        }

        printInfo(`📦 ${pkg.name} (${pkg.version})`);
        printInfo(`   Author: ${pkg.author}`);
        printInfo(`   Type: ${pkg.type}`);
        printInfo(`   License: ${pkg.license}`);
        printInfo(`   Downloads: ${pkg.downloads}`);
        printInfo(`   Rating: ${pkg.rating}/5.0 (${pkg.reviews} reviews)`);
        printInfo(`   Tags: ${pkg.tags.join(', ')}`);
        printInfo(`   Description: ${pkg.description}`);
        printInfo(`   Created: ${pkg.createdAt}`);
        printInfo(`   Updated: ${pkg.updatedAt}`);

        // Show reviews
        const reviews = await ratingSystem.getPackageReviews(packageId);
        if (reviews.length > 0) {
          printInfo(`\nReviews (${reviews.length}):`);
          reviews.slice(0, 5).forEach(review => {
            printInfo(`   ⭐ ${review.rating}/5 - ${review.title}`);
            printInfo(`      ${review.comment}`);
            printInfo(`      By ${review.userId} on ${review.createdAt}`);
            printInfo(`      Helpful: ${review.helpful}`);
          });
        }
      } catch (error) {
        printError(`Info retrieval failed: ${error.message}`);
      }
    });
}
```

#### 4. Update Main CLI Registration
```javascript
// Add to cli/bin/ultra-dex.js
import { registerMarketplaceCommand } from './lib/commands/marketplace.js';

// Add after other registrations
registerMarketplaceCommand(program);
```

### Testing Plan
1. Test package publishing and installation
2. Verify search functionality
3. Test rating and review system
4. Validate package metadata handling
5. Benchmark performance with many packages

### Success Criteria
- ✅ Package publishing and installation works
- ✅ Search functionality filters properly
- ✅ Rating and review system operational
- ✅ Package metadata handled correctly
- ✅ Performance acceptable with large catalog

---

**Estimated Timeline:** 1 week
**Priority:** 🟡 HIGH
**Status:** Ready for implementation