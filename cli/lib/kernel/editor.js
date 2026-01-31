// Ultra-Dex Kernel — Interactive File Editor
// Handles safe file modifications with Diff previews (Codex Style)

import fs from 'fs/promises';
import path from 'path';
import inquirer from 'inquirer';
import { renderer } from '../ui/renderer.js';
import { renderDiff } from '../ui/diff.js';
import { theme } from '../ui/theme.js';

export class FileEditor {
    constructor() {
        this.projectRoot = process.cwd();
    }

    /**
     * Propose and Apply an Edit
     * @param {string} filePath - Relative path to file
     * @param {string} newContent - Full new content of the file
     * @param {string} reason - Why this change is being made
     */
    async edit(filePath, newContent, reason) {
        const fullPath = path.join(this.projectRoot, filePath);
        let originalContent = '';
        let fileExists = false;

        // 1. Read Original
        try {
            originalContent = await fs.readFile(fullPath, 'utf8');
            fileExists = true;
        } catch (e) {
            // File doesn't exist, we are creating it
            renderer.box(`Creating new file: ${filePath}`, 'New File', 'info');
        }

        // 2. Show Reasoning
        console.log(theme.dim(`  Reason: ${reason}`));
        console.log('');

        // 3. Render Codex-Style Diff
        if (fileExists) {
            renderDiff(filePath, originalContent, newContent);
        } else {
            // For new files, show preview of content
            console.log(theme.dim('╭──────────────────────────────────────────────────────────╮'));
            console.log(theme.dim('│ ') + theme.success('NEW FILE: ' + filePath));
            console.log(theme.dim('├──────────────────────────────────────────────────────────┤'));
            console.log(newContent.split('\n').slice(0, 10).map(l => theme.dim('│ ') + theme.success('+ ' + l)).join('\n'));
            if (newContent.split('\n').length > 10) console.log(theme.dim('│ ... (content truncated)'));
            console.log(theme.dim('╰──────────────────────────────────────────────────────────╯'));
            console.log('');
        }

        // 4. Safety Lock: Ask for Confirmation
        const { confirm } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'confirm',
                message: 'Apply this change?',
                default: true
            }
        ]);

        // 5. Execute or Discard
        if (confirm) {
            try {
                await fs.mkdir(path.dirname(fullPath), { recursive: true });
                await fs.writeFile(fullPath, newContent, 'utf8');
                renderer.succeed(`Updated ${filePath}`);
                return true;
            } catch (e) {
                renderer.fail(`Failed to write file: ${e.message}`);
                return false;
            }
        } else {
            console.log(theme.warning('  ⚠ Change discarded.'));
            return false;
        }
    }
}

export const editor = new FileEditor();
