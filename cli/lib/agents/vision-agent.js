import fs from 'fs/promises';
import path from 'path';
import { createCanvas, loadImage } from 'canvas';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ultraMemory } from '../mcp/memory.js';
import { printInfo, printSuccess, printError, printWarning } from '../utils/output.js';

const execAsync = promisify(exec);

/**
 * Vision Agent - Screenshot-to-Code Conversion
 * Uses AI vision models to analyze UI screenshots and generate corresponding code
 */
export class VisionAgent {
  constructor(options = {}) {
    this.options = {
      defaultModel: options.defaultModel || 'gpt-4-vision-preview',
      quality: options.quality || 'high',
      maxImageSize: options.maxImageSize || 1024,
      enableOCR: options.enableOCR !== false,
      enableComponentDetection: options.enableComponentDetection !== false,
      enableCodeGeneration: options.enableCodeGeneration !== false,
      verbose: options.verbose || false,
      ...options
    };

    this.sessionId = uuidv4();
    this.processedImages = [];
    this.componentLibrary = new Map();
    
    this.initializeComponentLibrary();
  }

  /**
   * Initialize component library for common UI patterns
   */
  initializeComponentLibrary() {
    // Common UI components with patterns
    this.componentLibrary.set('button', {
      patterns: ['rectangular', 'rounded corners', 'text', 'clickable'],
      examples: ['primary', 'secondary', 'outline', 'icon'],
      frameworks: ['react', 'vue', 'angular', 'svelte']
    });

    this.componentLibrary.set('input', {
      patterns: ['text field', 'placeholder', 'border', 'focus state'],
      examples: ['text', 'password', 'email', 'number'],
      frameworks: ['react', 'vue', 'angular', 'svelte']
    });

    this.componentLibrary.set('navbar', {
      patterns: ['horizontal bar', 'logo', 'menu items', 'navigation'],
      examples: ['top', 'bottom', 'sticky', 'responsive'],
      frameworks: ['react', 'vue', 'angular', 'svelte']
    });

    this.componentLibrary.set('card', {
      patterns: ['container', 'shadow', 'content area', 'padding'],
      examples: ['profile', 'product', 'feature', 'testimonial'],
      frameworks: ['react', 'vue', 'angular', 'svelte']
    });

    this.componentLibrary.set('modal', {
      patterns: ['overlay', 'centered', 'close button', 'content'],
      examples: ['dialog', 'popup', 'confirmation', 'form'],
      frameworks: ['react', 'vue', 'angular', 'svelte']
    });
  }

  /**
   * Analyze screenshot and generate code
   */
  async analyzeScreenshot(imagePath, options = {}) {
    try {
      if (!this.options.enableCodeGeneration) {
        throw new Error('Vision analysis is disabled');
      }

      // Validate image file
      await this.validateImageFile(imagePath);
      
      // Preprocess image
      const processedImagePath = await this.preprocessImage(imagePath);
      
      // Get API key
      const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable required for vision analysis');
      }
      
      // Convert image to base64
      const base64Image = await this.encodeImageToBase64(processedImagePath);
      
      // Determine target framework
      const framework = options.framework || this.detectFramework() || 'react';
      
      // Generate code using vision model
      const result = await this.generateCodeWithVision(base64Image, framework, options.prompt);
      
      // Clean up temporary files
      if (processedImagePath !== imagePath) {
        await fs.unlink(processedImagePath);
      }
      
      // Store in memory
      await ultraMemory.remember(`Screenshot analyzed: ${imagePath} -> ${framework} code generated`, ['vision-analysis', 'code-generation']);
      
      // Track processed image
      this.processedImages.push({
        id: uuidv4(),
        originalPath: imagePath,
        processedPath: processedImagePath,
        framework,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId
      });

      if (this.options.verbose) {
        printSuccess(`👁️  Vision analysis completed for: ${imagePath}`);
      }

      return {
        success: true,
        framework,
        generatedCode: result.code,
        components: result.components,
        suggestions: result.suggestions,
        imageProcessed: true,
        message: `✅ Generated ${framework} code from screenshot`
      };
    } catch (error) {
      printError(`Vision analysis failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        message: `Vision analysis failed: ${error.message}`
      };
    }
  }

  /**
   * Validate image file
   */
  async validateImageFile(imagePath) {
    try {
      await fs.access(imagePath);
      
      const ext = path.extname(imagePath).toLowerCase();
      const validExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
      
      if (!validExtensions.includes(ext)) {
        throw new Error(`Unsupported image format: ${ext}. Supported: ${validExtensions.join(', ')}`);
      }
      
      const stats = await fs.stat(imagePath);
      if (stats.size > 20 * 1024 * 1024) { // 20MB
        throw new Error('Image file too large. Maximum size: 20MB');
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`Image file not found: ${imagePath}`);
      }
      throw error;
    }
  }

  /**
   * Preprocess image for better analysis
   */
  async preprocessImage(imagePath) {
    try {
      const image = await loadImage(imagePath);
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext('2d');
      
      // Draw image to canvas
      ctx.drawImage(image, 0, 0);
      
      // If image is too large, resize it
      if (image.width > this.options.maxImageSize || image.height > this.options.maxImageSize) {
        const scale = Math.min(
          this.options.maxImageSize / image.width,
          this.options.maxImageSize / image.height
        );
        
        const newWidth = Math.floor(image.width * scale);
        const newHeight = Math.floor(image.height * scale);
        
        const resizedCanvas = createCanvas(newWidth, newHeight);
        const resizedCtx = resizedCanvas.getContext('2d');
        
        resizedCtx.drawImage(image, 0, 0, newWidth, newHeight);
        
        // Save resized image temporarily
        const tempPath = imagePath.replace(/\.[^/.]+$/, `_resized_${Date.now()}.png`);
        const buffer = canvas.toBuffer('image/png');
        await fs.writeFile(tempPath, buffer);
        
        if (this.options.verbose) {
          printInfo(`🖼️  Image resized from ${image.width}x${image.height} to ${newWidth}x${newHeight}`);
        }
        
        return tempPath;
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
   * Generate code using vision model
   */
  async generateCodeWithVision(base64Image, framework, customPrompt = null) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable required');
    }

    const systemPrompt = `You are an expert UI-to-code conversion specialist. Convert the provided UI screenshot into clean, production-ready code using ${framework}.

Requirements:
1. Generate complete, runnable code with no placeholders
2. Follow modern best practices for ${framework}
3. Include proper component structure and state management
4. Use appropriate styling (CSS modules, Tailwind, etc.)
5. Include necessary imports and dependencies
6. Add JSDoc comments for public functions
7. Follow security best practices
8. Make it responsive and mobile-friendly
9. Include accessibility attributes where appropriate
10. Use semantic HTML elements where appropriate

Output only the code with no explanations unless specifically asked.`;

    const userPrompt = customPrompt || `Convert this UI screenshot into ${framework} code. Generate the complete component with proper structure, styling, and functionality. Focus on clean, maintainable code that follows ${framework} best practices.`;

    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: this.options.defaultModel,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: this.options.quality
                }
              }
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0.3
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const content = response.data.choices[0].message.content;
      
      // Parse the response to extract code and components
      const parsedResponse = this.parseVisionResponse(content);
      
      return {
        code: parsedResponse.code,
        components: parsedResponse.components,
        suggestions: parsedResponse.suggestions
      };
    } catch (error) {
      if (error.response) {
        throw new Error(`Vision API error: ${error.response.data.error?.message || error.response.statusText}`);
      }
      throw new Error(`Vision API request failed: ${error.message}`);
    }
  }

  /**
   * Parse vision response to extract code and components
   */
  parseVisionResponse(response) {
    const result = {
      code: '',
      components: [],
      suggestions: []
    };

    // Extract code blocks
    const codeBlockRegex = /```(?:\w+)?\s*([^\n]*)\n([\s\S]*?)```/g;
    let match;
    const codeBlocks = [];
    
    while ((match = codeBlockRegex.exec(response)) !== null) {
      const language = match[1].trim();
      const code = match[2].trim();
      if (code) {
        codeBlocks.push({ language, code });
      }
    }

    // Use the first substantial code block as the main code
    if (codeBlocks.length > 0) {
      result.code = codeBlocks[0].code;
      
      // Extract additional components from other blocks
      for (let i = 1; i < codeBlocks.length; i++) {
        result.components.push({
          type: codeBlocks[i].language || 'component',
          code: codeBlocks[i].code,
          id: `component_${i}`
        });
      }
    } else {
      result.code = response;
    }

    // Extract suggestions from the response
    const suggestionRegex = /(suggestion|recommendation|tip):\s*(.*?)(?=\n|$)/gi;
    let suggestionMatch;
    while ((suggestionMatch = suggestionRegex.exec(response)) !== null) {
      result.suggestions.push(suggestionMatch[2].trim());
    }

    return result;
  }

  /**
   * Extract design tokens from screenshot
   */
  async extractDesignTokens(imagePath, options = {}) {
    try {
      const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY required for design token extraction');
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

      Return as a structured JSON object with organized design tokens.`;

      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: this.options.defaultModel,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.2
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const content = response.data.choices[0].message.content;
      
      try {
        const tokens = JSON.parse(content);
        return {
          success: true,
          tokens,
          message: '✅ Design tokens extracted successfully'
        };
      } catch {
        return {
          success: true,
          tokens: content,
          message: '✅ Design tokens extracted (raw format)'
        };
      }
    } catch (error) {
      printError(`Design token extraction failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        message: `Design token extraction failed: ${error.message}`
      };
    }
  }

  /**
   * Compare two UI designs
   */
  async compareUIs(imagePath1, imagePath2, options = {}) {
    try {
      const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY required for UI comparison');
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

      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: this.options.defaultModel,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image1}`,
                  detail: 'high'
                }
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image2}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 3000,
        temperature: 0.3
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const comparison = response.data.choices[0].message.content;
      
      return {
        success: true,
        comparison,
        message: '✅ UI comparison completed'
      };
    } catch (error) {
      printError(`UI comparison failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        message: `UI comparison failed: ${error.message}`
      };
    }
  }

  /**
   * Detect UI components in screenshot
   */
  async detectComponents(imagePath, options = {}) {
    try {
      const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY required for component detection');
      }

      const base64Image = await this.encodeImageToBase64(imagePath);

      const prompt = `Analyze this UI screenshot and identify all UI components:
      - List each component type (button, input, card, navbar, etc.)
      - Describe the component's purpose and functionality
      - Note any special properties (disabled, loading, active states)
      - Identify component hierarchy and relationships
      - Suggest accessibility improvements

      Return as structured JSON with component information.`;

      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: this.options.defaultModel,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 2500,
        temperature: 0.2
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const content = response.data.choices[0].message.content;
      
      try {
        const components = JSON.parse(content);
        return {
          success: true,
          components,
          message: '✅ Components detected successfully'
        };
      } catch {
        return {
          success: true,
          components: content,
          message: '✅ Components detected (raw format)'
        };
      }
    } catch (error) {
      printError(`Component detection failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        message: `Component detection failed: ${error.message}`
      };
    }
  }

  /**
   * Generate accessibility report
   */
  async generateAccessibilityReport(imagePath) {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY required for accessibility analysis');
      }

      const base64Image = await this.encodeImageToBase64(imagePath);

      const prompt = `Analyze this UI screenshot for accessibility issues. Check for:
      - Color contrast ratios
      - Font sizes and readability
      - Interactive element sizing
      - Keyboard navigation flow
      - Screen reader compatibility
      - Alt text for images
      - Proper heading hierarchy
      - Focus indicators
      - ARIA labels and roles

      Provide specific recommendations with code examples where applicable.`;

      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: this.options.defaultModel,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.2
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const report = response.data.choices[0].message.content;
      
      return {
        success: true,
        report,
        message: '✅ Accessibility report generated'
      };
    } catch (error) {
      printError(`Accessibility analysis failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        message: `Accessibility analysis failed: ${error.message}`
      };
    }
  }

  /**
   * OCR text extraction from image
   */
  async extractText(imagePath, options = {}) {
    try {
      if (!this.options.enableOCR) {
        throw new Error('OCR is disabled');
      }

      // In a real implementation, this would use Tesseract or similar OCR library
      // For now, we'll simulate by asking the vision model to extract text
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY required for text extraction');
      }

      const base64Image = await this.encodeImageToBase64(imagePath);

      const prompt = `Extract all readable text from this image. Return only the text content, preserving the structure and hierarchy of the text elements. Include any labels, buttons, headings, paragraphs, and other text elements.`;

      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: this.options.defaultModel,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.1
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const extractedText = response.data.choices[0].message.content;
      
      return {
        success: true,
        text: extractedText,
        message: '✅ Text extracted successfully'
      };
    } catch (error) {
      printError(`Text extraction failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        message: `Text extraction failed: ${error.message}`
      };
    }
  }

  /**
   * Save generated code to file
   */
  async saveCodeToFile(generatedCode, filePath, options = {}) {
    try {
      // Extract code blocks from AI response if present
      const code = this.extractCodeBlocks(generatedCode);
      
      // Ensure directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      
      // Write file
      await fs.writeFile(filePath, code, 'utf8');
      
      if (this.options.verbose) {
        printSuccess(`📝 Code saved to: ${filePath}`);
      }
      
      return {
        success: true,
        filePath,
        lines: code.split('\n').length,
        message: `✅ Code saved to ${filePath}`
      };
    } catch (error) {
      printError(`Failed to save code to file: ${error.message}`);
      return {
        success: false,
        error: error.message,
        message: `Failed to save code: ${error.message}`
      };
    }
  }

  /**
   * Extract code blocks from response
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
      .filter(word => word.length > 0)
      .map((word, index) => 
        index === 0 ? word.charAt(0).toLowerCase() + word.slice(1) : 
        word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join('');
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
        if (deps.react) return 'react';
        if (deps.vue) return 'vue';
        if (deps.angular) return 'angular';
        if (deps.svelte) return 'svelte';
        if (deps.ionic) return 'ionic';
        if (deps.flutter) return 'flutter';
        if (deps['@nuxtjs']) return 'nuxt';
        if (deps['@sveltejs']) return 'sveltekit';
        if (deps.remix) return 'remix';
      }
      
      // Check for specific config files
      if (fs.existsSync('pubspec.yaml')) return 'flutter';
      if (fs.existsSync('Podfile')) return 'ios';
      if (fs.existsSync('build.gradle')) return 'android';
      
      return 'react'; // default
    } catch {
      return 'react'; // default
    }
  }

  /**
   * Batch process multiple screenshots
   */
  async batchProcess(screenshotPaths, options = {}) {
    const results = [];
    
    for (const imagePath of screenshotPaths) {
      if (this.options.verbose) {
        printInfo(`Processing screenshot: ${imagePath}`);
      }
      
      const result = await this.analyzeScreenshot(imagePath, options);
      results.push({
        imagePath,
        ...result
      });
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return {
      success: true,
      results,
      total: results.length,
      processed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      message: `✅ Batch processed ${results.length} screenshots`
    };
  }

  /**
   * Get vision agent statistics
   */
  getStats() {
    return {
      totalImagesProcessed: this.processedImages.length,
      currentSessionId: this.sessionId,
      componentLibrarySize: this.componentLibrary.size,
      options: this.options,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Export processed images data
   */
  async exportProcessedData(format = 'json') {
    const data = {
      sessionId: this.sessionId,
      processedImages: this.processedImages,
      stats: this.getStats(),
      exportedAt: new Date().toISOString()
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      // Convert to CSV format
      const headers = ['id', 'originalPath', 'framework', 'timestamp'];
      const rows = [headers.join(',')];
      
      for (const img of this.processedImages) {
        rows.push([
          img.id,
          `"${img.originalPath}"`,
          img.framework,
          img.timestamp
        ].join(','));
      }
      
      return rows.join('\n');
    }
  }

  /**
   * Clean up temporary files
   */
  async cleanup() {
    // Clean up temporary processed images
    for (const image of this.processedImages) {
      if (image.processedPath && image.processedPath !== image.originalPath) {
        try {
          await fs.unlink(image.processedPath);
        } catch (error) {
          // File may have already been deleted
        }
      }
    }
    
    if (this.options.verbose) {
      printInfo(`🧹 Vision agent cleaned up ${this.processedImages.length} temporary files`);
    }
  }
}

// Singleton instance
export const visionAgent = new VisionAgent();

export default VisionAgent;