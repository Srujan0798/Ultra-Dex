// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Vision module
 * @module commands/vision
 */

import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import { visionAgent } from '../vision/vision-agent.js';
import { printInfo, printSuccess, printError, printWarning } from '../utils/output.js';

export function registerVisionCommand(program) {
  const visionCommand = program
    .command('vision')
    .description('AI-powered vision agent for screenshot-to-code conversion');

  // Main vision command
  visionCommand
    .argument('<image>', 'Screenshot image file to analyze')
    .option('-f, --framework <framework>', 'Target framework (react, vue, angular, nextjs, etc.)')
    .option('-o, --output <path>', 'Output file path (default: auto-generated)')
    .option('-p, --prompt <prompt>', 'Custom prompt for code generation')
    .option('-k, --key <key>', 'OpenAI API key override')
    .option('-t, --tokens', 'Extract design tokens instead of code')
    .option('-c, --compare <image2>', 'Compare with another image')
    .option('-v, --verbose', 'Show detailed output')
    .action(async (imagePath, options) => {
      try {
        if (options.compare) {
          // Compare two UIs
          printInfo(`🔍 Comparing UIs: ${imagePath} vs ${options.compare}`);
          const comparison = await visionAgent.compareUIs(imagePath, options.compare, {
            apiKey: options.key
          });
          
          printSuccess(comparison.message);
          console.log(comparison.comparison);
        } else if (options.tokens) {
          // Extract design tokens
          printInfo(`🎨 Extracting design tokens from: ${imagePath}`);
          const tokens = await visionAgent.extractDesignTokens(imagePath, {
            apiKey: options.key
          });
          
          printSuccess(tokens.message);
          console.log(JSON.stringify(tokens.tokens, null, 2));
        } else {
          // Generate code from screenshot
          printInfo(`👁️  Analyzing screenshot: ${imagePath}`);
          
          const result = await visionAgent.analyzeScreenshot(imagePath, {
            framework: options.framework,
            prompt: options.prompt,
            apiKey: options.key
          });
          
          printSuccess(result.message);
          
          if (result.generatedCode) {
            if (options.verbose) {
              printInfo('\n📝 Generated Code:');
              console.log(result.generatedCode);
            }
            
            // Determine output path
            let outputPath = options.output;
            if (!outputPath) {
              const componentName = visionAgent.generateComponentName(imagePath);
              const extension = options.framework === 'vue' ? '.vue' : 
                               options.framework === 'svelte' ? '.svelte' :
                               options.framework === 'angular' ? '.component.ts' : '.tsx';
              outputPath = `src/components/${componentName}${extension}`;
            }
            
            // Save to file
            const saveResult = await visionAgent.saveCodeToFile(result.generatedCode, outputPath);
            printSuccess(saveResult.message);
          }
        }
      } catch (error) {
        printError(`Vision command failed: ${error.message}`);
        if (options.verbose) {
          console.error(error.stack);
        }
        process.exit(1);
      }
    });

  // Subcommands
  visionCommand
    .command('tokens')
    .argument('<image>', 'Image to extract design tokens from')
    .option('-o, --output <path>', 'Output file for tokens (JSON)')
    .option('-k, --key <key>', 'API key override')
    .description('Extract design tokens (colors, fonts, spacing) from UI screenshot')
    .action(async (image, options) => {
      try {
        printInfo(`🎨 Extracting design tokens from: ${image}`);
        const result = await visionAgent.extractDesignTokens(image, {
          apiKey: options.key
        });
        
        printSuccess(result.message);
        console.log(JSON.stringify(result.tokens, null, 2));
        
        if (options.output) {
          await fs.writeFile(options.output, JSON.stringify(result.tokens, null, 2));
          printSuccess(`💾 Tokens saved to: ${options.output}`);
        }
      } catch (error) {
        printError(`Token extraction failed: ${error.message}`);
        process.exit(1);
      }
    });

  visionCommand
    .command('compare')
    .argument('<image1>', 'First image to compare')
    .argument('<image2>', 'Second image to compare')
    .option('-k, --key <key>', 'API key override')
    .option('-o, --output <path>', 'Output file for comparison')
    .description('Compare two UI designs and analyze differences')
    .action(async (image1, image2, options) => {
      try {
        printInfo(`🔍 Comparing: ${image1} vs ${image2}`);
        const result = await visionAgent.compareUIs(image1, image2, {
          apiKey: options.key
        });
        
        printSuccess(result.message);
        console.log(result.comparison);
        
        if (options.output) {
          await fs.writeFile(options.output, result.comparison);
          printSuccess(`💾 Comparison saved to: ${options.output}`);
        }
      } catch (error) {
        printError(`UI comparison failed: ${error.message}`);
        process.exit(1);
      }
    });

  visionCommand
    .command('analyze')
    .argument('<image>', 'Image to analyze')
    .option('-k, --key <key>', 'API key override')
    .option('-d, --detailed', 'Include detailed analysis')
    .description('Comprehensive UI analysis with component identification')
    .action(async (image, options) => {
      try {
        printInfo(`🔬 Analyzing UI components in: ${image}`);
        
        // For detailed analysis, we'll use a more specific prompt
        const prompt = options.detailed 
          ? "Perform a comprehensive UI analysis identifying all components, their hierarchy, functionality, and accessibility features. List all interactive elements and their potential behaviors."
          : "Identify the main UI components and their relationships.";
        
        const base64Image = await visionAgent.encodeImageToBase64(image);
        const apiKey = options.key || process.env.OPENAI_API_KEY;
        
        if (!apiKey) {
          throw new AppError('OPENAI_API_KEY required for vision analysis');
        }
        
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: 'gpt-4-vision-preview',
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
          temperature: 0.3
        }, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });
        
        const analysis = response.data.choices[0].message.content;
        printSuccess('✅ UI analysis complete');
        console.log(analysis);
      } catch (error) {
        printError(`UI analysis failed: ${error.message}`);
        process.exit(1);
      }
    });
}

export default registerVisionCommand;