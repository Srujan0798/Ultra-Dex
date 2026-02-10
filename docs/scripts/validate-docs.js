#!/usr/bin/env node

/**
 * Ultra-Dex Documentation Validation Script
 * Validates entire docs folder for quality, links, and completeness
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = path.join(__dirname, '..');

class DocsValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.stats = {
      totalFiles: 0,
      markdownFiles: 0,
      brokenLinks: 0,
      missingReadmes: 0,
      emptyFiles: 0,
      namingIssues: 0,
    };
    this.allFiles = [];
    this.allLinks = new Map();
  }

  async validate() {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║     Ultra-Dex Documentation Validation (v6.0.0)            ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');

    console.log('📁 Scanning documentation...');
    await this.scanFiles();

    console.log('🔗 Checking links...');
    await this.validateLinks();

    console.log('📋 Checking structure...');
    await this.checkStructure();

    console.log('🏷️  Checking naming...');
    await this.checkNaming();

    console.log('📊 Checking content...');
    await this.checkContent();

    this.printReport();
    return this.errors.length === 0 && this.warnings.length < 50;
  }

  async scanFiles() {
    async function walk(dir, files = []) {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (
            !entry.name.startsWith('.') &&
            entry.name !== 'node_modules' &&
            entry.name !== 'assets'
          ) {
            await walk(fullPath, files);
          }
        } else if (entry.isFile()) {
          files.push(fullPath);
        }
      }
      return files;
    }

    this.allFiles = await walk(DOCS_DIR);
    this.stats.totalFiles = this.allFiles.length;
    this.stats.markdownFiles = this.allFiles.filter((f) => f.endsWith('.md')).length;
  }

  async validateLinks() {
    const mdFiles = this.allFiles.filter((f) => f.endsWith('.md'));

    for (const file of mdFiles) {
      const content = await fs.readFile(file, 'utf8');
      const links = this.extractLinks(content);
      const relativeFile = path.relative(DOCS_DIR, file);

      for (const link of links) {
        // Skip external links and anchors
        if (link.startsWith('http') || link.startsWith('#') || link.startsWith('mailto:')) {
          continue;
        }

        // Resolve link path
        const resolvedPath = path.resolve(path.dirname(file), link);

        // Check if file exists
        try {
          await fs.access(resolvedPath);
        } catch {
          this.errors.push({
            type: 'broken-link',
            file: relativeFile,
            link: link,
            message: `Broken link: ${link}`,
          });
          this.stats.brokenLinks++;
        }
      }
    }
  }

  extractLinks(content) {
    const links = [];
    // Match markdown links [text](url)
    const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const url = match[2];
      // Remove anchor portion for validation
      const cleanUrl = url.split('#')[0];
      if (cleanUrl && !cleanUrl.startsWith('http') && !cleanUrl.startsWith('mailto:')) {
        links.push(cleanUrl);
      }
    }

    return [...new Set(links)]; // Remove duplicates
  }

  async checkStructure() {
    // Check for required top-level files
    const requiredFiles = [
      'README.md',
      'INDEX.md',
      'CROSS-REFERENCE-MATRIX.md',
      'DOCS-IMPROVEMENT-PLAN.md',
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(DOCS_DIR, file);
      try {
        await fs.access(filePath);
      } catch {
        this.errors.push({
          type: 'missing-file',
          file: file,
          message: `Required file missing: ${file}`,
        });
      }
    }

    // Check for README in each major directory
    const majorDirs = [
      'guides',
      'api',
      'architecture',
      'AgPrompts',
      'ecosystem',
      'archive',
      'meta',
    ];

    for (const dir of majorDirs) {
      const readmePath = path.join(DOCS_DIR, dir, 'README.md');
      try {
        await fs.access(readmePath);
      } catch {
        this.warnings.push({
          type: 'missing-readme',
          file: dir,
          message: `README.md missing in ${dir}/`,
        });
        this.stats.missingReadmes++;
      }
    }
  }

  async checkNaming() {
    for (const file of this.allFiles) {
      const basename = path.basename(file);

      // Check for inconsistent naming (snake_case vs kebab-case)
      if (basename.includes('_') && !basename.startsWith('_')) {
        // Allow specific exceptions
        if (
          !basename.match(/^\d+_/) && // Allow numbered prefixes like 01_
          !basename.includes('_OLD') &&
          !basename.includes('_test')
        ) {
          this.warnings.push({
            type: 'naming',
            file: path.relative(DOCS_DIR, file),
            message: `Uses underscores (snake_case), prefer kebab-case: ${basename}`,
          });
          this.stats.namingIssues++;
        }
      }
    }
  }

  async checkContent() {
    const mdFiles = this.allFiles.filter((f) => f.endsWith('.md'));

    for (const file of mdFiles) {
      const content = await fs.readFile(file, 'utf8');
      const relativeFile = path.relative(DOCS_DIR, file);

      // Check for nearly empty files
      if (content.length < 200 && !file.includes('README')) {
        this.warnings.push({
          type: 'empty-file',
          file: relativeFile,
          message: `File is nearly empty (${content.length} chars)`,
        });
        this.stats.emptyFiles++;
      }

      // Check for missing headers
      if (!content.includes('# ')) {
        this.warnings.push({
          type: 'no-header',
          file: relativeFile,
          message: 'Missing H1 header',
        });
      }
    }
  }

  printReport() {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                    VALIDATION REPORT                       ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');

    console.log('📊 Statistics:');
    console.log(`   Total Files: ${this.stats.totalFiles}`);
    console.log(`   Markdown Files: ${this.stats.markdownFiles}`);
    console.log(`   Broken Links: ${this.stats.brokenLinks}`);
    console.log(`   Missing READMEs: ${this.stats.missingReadmes}`);
    console.log(`   Empty Files: ${this.stats.emptyFiles}`);
    console.log(`   Naming Issues: ${this.stats.namingIssues}`);
    console.log('');

    if (this.errors.length > 0) {
      console.log('❌ ERRORS:');
      this.errors.slice(0, 20).forEach((err) => {
        console.log(`   [${err.type}] ${err.file}`);
        console.log(`      → ${err.message}`);
      });
      if (this.errors.length > 20) {
        console.log(`   ... and ${this.errors.length - 20} more errors`);
      }
      console.log('');
    }

    if (this.warnings.length > 0) {
      console.log('⚠️  WARNINGS:');
      this.warnings.slice(0, 10).forEach((warn) => {
        console.log(`   [${warn.type}] ${warn.file}`);
      });
      if (this.warnings.length > 10) {
        console.log(`   ... and ${this.warnings.length - 10} more warnings`);
      }
      console.log('');
    }

    const quality = this.calculateQuality();

    console.log('╔════════════════════════════════════════════════════════════╗');
    if (this.errors.length === 0) {
      console.log(`║  ✅ VALIDATION PASSED — Quality Score: ${quality}/10           ║`);
    } else {
      console.log(`║  ❌ VALIDATION FAILED — Quality Score: ${quality}/10           ║`);
    }
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('🎉 PERFECT! Documentation is at 100% quality!');
    } else if (this.errors.length === 0) {
      console.log('✅ Good! All critical checks passed.');
      if (this.warnings.length > 0) {
        console.log(`⚠️  Consider addressing ${this.warnings.length} warnings for perfection.`);
      }
    }
    console.log('');
  }

  calculateQuality() {
    let score = 10;

    // Deduct for errors (critical)
    score -= Math.min(5, this.errors.length * 0.5);

    // Deduct for broken links
    score -= Math.min(3, this.stats.brokenLinks * 0.3);

    // Deduct for missing READMEs
    score -= Math.min(2, this.stats.missingReadmes * 0.2);

    // Deduct for naming issues
    score -= Math.min(1, this.stats.namingIssues * 0.05);

    return Math.max(0, Math.round(score * 10) / 10);
  }
}

// Run validation
const validator = new DocsValidator();
validator
  .validate()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error('Validation error:', err);
    process.exit(1);
  });
