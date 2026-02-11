// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Generate Cli Docs module
 * @module scripts/generate-cli-docs
 */

#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateCliDocs() {
  const cliCommandsDir = path.join(__dirname, '../cli/lib/commands');
  const docsDir = path.join(__dirname, '../docs/api');
  
  try {
    // Read all command files
    const commandFiles = await fs.readdir(cliCommandsDir);
    
    // Generate command index
    let commandIndex = "# Ultra-Dex CLI Command Reference\n\n";
    commandIndex += "This document contains auto-generated documentation for all Ultra-Dex CLI commands.\n\n";
    commandIndex += "## Available Commands\n\n";
    
    // Sort commands alphabetically
    const sortedCommands = commandFiles
      .filter(file => file.endsWith('.js'))
      .map(file => file.replace('.js', ''))
      .sort();
    
    commandIndex += sortedCommands.map(cmd => `- \`${cmd}\``).join('\n') + '\n\n';
    
    // Generate detailed documentation for each command
    commandIndex += "## Command Details\n\n";
    
    for (const commandFile of sortedCommands) {
      commandIndex += `### ${commandFile}\n\n`;
      
      // Try to get command help text by reading the file
      const filePath = path.join(cliCommandsDir, `${commandFile}.js`);
      try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        
        // Extract basic info from the file
        commandIndex += "```\n";
        commandIndex += `File: cli/lib/commands/${commandFile}.js\n`;
        commandIndex += `Description: [Auto-generated documentation for ${commandFile} command]\n`;
        commandIndex += "```\n\n";
        
        // Show usage example
        commandIndex += `#### Usage\n\n`;
        commandIndex += `\`\`\`bash\nultra-dex ${commandFile} [options]\n\`\`\`\n\n`;
        
        // Add placeholder for options (would need to parse the actual command implementation)
        commandIndex += `#### Options\n\n`;
        commandIndex += "_Options will be auto-extracted from command implementation._\n\n";
        
        // Add placeholder for examples
        commandIndex += `#### Examples\n\n`;
        commandIndex += `_Examples will be auto-generated based on command usage._\n\n`;
        
      } catch (error) {
        console.warn(`Could not read command file: ${commandFile}`, error.message);
        commandIndex += `Could not read command file: ${commandFile}\n\n`;
      }
    }
    
    // Write the generated documentation
    const outputPath = path.join(docsDir, 'generated-cli-reference.md');
    await fs.writeFile(outputPath, commandIndex);
    
    console.log(`✅ Generated CLI documentation for ${sortedCommands.length} commands`);
    console.log(`📄 Output written to: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Error generating CLI documentation:', error);
    process.exit(1);
  }
}

// Run the generator
generateCliDocs();