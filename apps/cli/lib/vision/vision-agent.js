// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';

import { exec } from 'child_process';
import { promisify } from 'util';

import axios from 'axios';
import sharp from 'sharp';
import { AppError } from '../utils/errors.js';
import { printInfo, printSuccess, printWarning } from '../utils/output.js';

const _execAsync = promisify(exec);

/**
 * Vision Agent for Screenshot-to-Code Conversion
 * Uses GPT-4 Vision API to analyze UI screenshots and generate corresponding code
 */
export class VisionAgent {
  constructor() {
    this.supportedFrameworks = [
      'react',
      'vue',
      'angular',
      'svelte',
      'nextjs',
      'remix',
      'sveltekit',
      'flutter',
      'swiftui',
      'compose',
    ];
    this.imageFormats = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
  }

  /**
   * Analyze screenshot and generate code
   */
  async analyzeScreenshot(imagePath, options = {}) {
    try {
      // Validate image file
      await this.validateImageFile(imagePath);

      // Preprocess image if needed
      const processedImagePath = await this.preprocessImage(imagePath);

      // Get API key
      const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new AppError('OPENAI_API_KEY environment variable required for vision analysis');
      }

      // Convert image to base64
      const base64Image = await this.encodeImageToBase64(processedImagePath);

      // Determine framework
      const framework = options.framework || this.detectFramework() || 'react';

      // Generate code using GPT-4 Vision
      const code = await this.generateCodeWithVision(base64Image, framework, options.prompt);

      // Clean up temporary files
      if (processedImagePath !== imagePath) {
        await fs.unlink(processedImagePath);
      }

      return {
        success: true,
        framework,
        generatedCode: code,
        imageProcessed: true,
        message: `✅ Generated ${framework} code from screenshot`,
      };
    } catch (error) {
      throw new AppError(`Vision analysis failed: ${error.message}`);
    }
  }

  /**
   * Validate image file
   */
  async validateImageFile(imagePath) {
    try {
      // Check if file exists
      await fs.access(imagePath);

      // Check file extension
      const ext = path.extname(imagePath).toLowerCase();
      if (!this.imageFormats.includes(ext)) {
        throw new AppError(
          `Unsupported image format: ${ext}. Supported: ${this.imageFormats.join(', ')}`
        );
      }

      // Check file size (max 20MB for OpenAI)
      const stats = await fs.stat(imagePath);
      if (stats.size > 20 * 1024 * 1024) {
        throw new AppError('Image file too large. Maximum size: 20MB');
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new AppError(`Image file not found: ${imagePath}`);
      }
      throw error;
    }
  }

  /**
   * Preprocess image for better analysis
   */
  async preprocessImage(imagePath) {
    try {
      // Resize image if too large (for better API performance and cost)
      const image = sharp(imagePath);
      const metadata = await image.metadata();

      // Only resize if image is larger than 1024x1024
      if (metadata.width > 1024 || metadata.height > 1024) {
        const resizedPath = imagePath.replace(/\.[^/.]+$/, `_resized${path.extname(imagePath)}`);
        await image
          .resize(1024, 1024, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({ quality: 85 })
          .toFile(resizedPath);

        printInfo(`🖼️  Image resized from ${metadata.width}x${metadata.height} to fit 1024x1024`);
        return resizedPath;
      }

      return imagePath;
    } catch (error) {
      printWarning(`⚠️  Could not preprocess image: ${error.message}. Using original.`);
      return imagePath;
    }
  }

  /**
   * Encode image to base64
   */
  async encodeImageToBase64(imagePath) {
    const imageBuffer = await fs.readFile(imagePath);
    return imageBuffer.toString('base64');
  }

  /**
   * Generate code using GPT-4 Vision API
   */
  async generateCodeWithVision(base64Image, framework, customPrompt = null) {
    const apiKey = process.env.OPENAI_API_KEY;

    // Create system prompt for code generation
    const systemPrompt = `You are an expert UI-to-code converter. Convert the provided UI screenshot into clean, production-ready code using ${framework}.

Requirements:
1. Generate complete, runnable code with no placeholders
2. Follow modern best practices for ${framework}
3. Include proper component structure and state management
4. Use appropriate styling (CSS modules, Tailwind, etc.)
5. Include necessary imports and dependencies
6. Add proper accessibility attributes
7. Use semantic HTML elements where appropriate
8. Include error boundaries and loading states if needed
9. Follow security best practices
10. Make it responsive and mobile-friendly

Output only the code with no explanations unless specifically asked.`;

    // Create user prompt
    const userPrompt =
      customPrompt ||
      `Convert this UI screenshot into ${framework} code. Generate the complete component with proper structure, styling, and functionality.`;

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: userPrompt,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                    detail: 'high',
                  },
                },
              ],
            },
          ],
          max_tokens: 4000,
          temperature: 0.3,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      if (error.response) {
        throw new AppError(
          `Vision API error: ${error.response.data.error?.message || error.response.statusText}`
        );
      }
      throw new AppError(`Vision API request failed: ${error.message}`);
    }
  }

  /**
   * Extract design tokens from screenshot
   */
  async extractDesignTokens(imagePath, options = {}) {
    const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new AppError('OPENAI_API_KEY required for design token extraction');
    }

    const base64Image = await this.encodeImageToBase64(imagePath);

    const prompt = `Analyze this UI screenshot and extract design tokens including:
    - Color palette (primary, secondary, accents, neutrals)
    - Typography scale (font sizes, weights, families)
    - Spacing scale (padding, margins, gaps)
    - Border radius values
    - Shadow definitions
    - Component styles (buttons, inputs, cards)
    - Layout patterns

    Return as a JSON object with structured design tokens.`;

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                    detail: 'high',
                  },
                },
              ],
            },
          ],
          max_tokens: 2000,
          temperature: 0.2,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const content = response.data.choices[0].message.content;

      // Try to parse as JSON, if not return raw content
      try {
        const tokens = JSON.parse(content);
        return {
          success: true,
          tokens,
          message: '✅ Design tokens extracted successfully',
        };
      } catch {
        return {
          success: true,
          tokens: content,
          message: '✅ Design tokens extracted (raw format)',
        };
      }
    } catch (error) {
      throw new AppError(`Design token extraction failed: ${error.message}`);
    }
  }

  /**
   * Compare two UI designs
   */
  async compareUIs(imagePath1, imagePath2, options = {}) {
    const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new AppError('OPENAI_API_KEY required for UI comparison');
    }

    const base64Image1 = await this.encodeImageToBase64(imagePath1);
    const base64Image2 = await this.encodeImageToBase64(imagePath2);

    const prompt = `Compare these two UI screenshots and provide a detailed analysis:
    1. Visual differences (colors, layout, components)
    2. Functional differences
    3. Design improvements in the newer version
    4. Potential accessibility issues
    5. Recommendations for consistency

    Focus on actionable insights for developers.`;

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image1}`,
                    detail: 'high',
                  },
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image2}`,
                    detail: 'high',
                  },
                },
              ],
            },
          ],
          max_tokens: 3000,
          temperature: 0.3,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        comparison: response.data.choices[0].message.content,
        message: '✅ UI comparison completed',
      };
    } catch (error) {
      throw new AppError(`UI comparison failed: ${error.message}`);
    }
  }

  /**
   * Detect current project framework
   */
  detectFramework() {
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

        if (deps.next) return 'nextjs';
        if (deps.remix) return 'remix';
        if (deps.vue) return 'vue';
        if (deps.angular) return 'angular';
        if (deps.svelte) return 'svelte';
        if (deps.react) return 'react';
        if (deps.flutter) return 'flutter';
      }

      // Check for specific config files
      if (fs.existsSync('pubspec.yaml')) return 'flutter';
      if (fs.existsSync('ios/')) return 'swiftui';
      if (fs.existsSync('android/')) return 'compose';

      return 'react'; // default
    } catch {
      return 'react'; // default
    }
  }

  /**
   * Save generated code to file
   */
  async saveCodeToFile(generatedCode, filePath, _options = {}) {
    try {
      // Extract code blocks from AI response if present
      const code = this.extractCodeBlocks(generatedCode);

      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      // Write file
      await fs.writeFile(filePath, code, 'utf8');

      printSuccess(`📝 Code saved to: ${filePath}`);

      return {
        success: true,
        filePath,
        lines: code.split('\n').length,
        message: `✅ Code saved to ${filePath}`,
      };
    } catch (error) {
      throw new AppError(`Failed to save code to file: ${error.message}`);
    }
  }

  /**
   * Extract code blocks from AI response
   */
  extractCodeBlocks(text) {
    // Look for code blocks with language specification
    const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)```/g;
    const matches = [];
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      matches.push(match[1]);
    }

    // If we found code blocks, return the longest one (likely the main component)
    if (matches.length > 0) {
      return matches.reduce((longest, current) =>
        current.length > longest.length ? current : longest
      );
    }

    // If no code blocks found, return the original text
    return text;
  }

  /**
   * Generate component name from image
   */
  generateComponentName(imagePath) {
    const fileName = path.basename(imagePath, path.extname(imagePath));
    return fileName
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(' ')
      .filter((word) => word.length > 0)
      .map((word, index) =>
        index === 0
          ? word.charAt(0).toLowerCase() + word.slice(1)
          : word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join('');
  }
}

// Singleton instance
export const visionAgent = new VisionAgent();

export default VisionAgent;
