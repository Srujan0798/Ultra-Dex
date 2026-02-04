// Ultra-Dex Kernel — Interactive File Editor
// Handles safe file modifications with Diff previews (Codex Style)

import fs from 'fs/promises';
import path from 'path';
import inquirer from 'inquirer';
import { renderer } from '../ui/renderer.js';
import { renderDiff } from '../ui/diff.js';
import { theme } from '../ui/theme.js';
import { runPostToolUseHooks } from '../quality/hooks.js';
import { AppError } from '../utils/errors.js';

export class FileEditor {
    constructor() {
        this.projectRoot = process.cwd();
    }

    /**
     * Propose and Apply an Edit
     * @param {string} filePath - Relative path to file
     * @param {string} newContent - Full new content of the file
     * @param {string} reason - Why this change is being made
     * @param {boolean} force - Bypass confirmation (Autonomous Mode)
     */
    async edit(filePath, newContent, reason, force = false) {
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
        process.stdout.write(theme.dim(`  Reason: ${reason}`) + '\n');
        process.stdout.write('\n');

        // 3. Render Codex-Style Diff
        if (fileExists) {
            renderDiff(filePath, originalContent, newContent);
        } else {
            // For new files, show preview
            process.stdout.write(theme.dim('╭──────────────────────────────────────────────────────────╮') + '\n');
            process.stdout.write(theme.dim('│ ') + theme.success('NEW FILE: ' + filePath) + '\n');
            process.stdout.write(theme.dim('├──────────────────────────────────────────────────────────┤') + '\n');
            process.stdout.write(newContent.split('\n').slice(0, 10).map(l => theme.dim('│ ') + theme.success('+ ' + l)).join('\n') + '\n');
            if (newContent.split('\n').length > 10) process.stdout.write(theme.dim('│ ... (content truncated)') + '\n');
            process.stdout.write(theme.dim('╰──────────────────────────────────────────────────────────╯') + '\n');
            process.stdout.write('\n');
        }

        // 4. Safety Lock: Ask for Confirmation (Unless Forced)
        let confirm = force;

        if (!force) {
            const answer = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: 'Apply this change?',
                    default: true
                }
            ]);
            confirm = answer.confirm;
        } else {
            process.stdout.write(theme.accent('  ⚡ Autonomous Mode: Applying change automatically.') + '\n');
        }

        // 5. Execute or Discard
        if (confirm) {
            try {
                await fs.mkdir(path.dirname(fullPath), { recursive: true });
                await fs.writeFile(fullPath, newContent, 'utf8');
                renderer.succeed(`Updated ${filePath}`);

                // Quality Gates: Block invalid code after write
                try {
                    await runPostToolUseHooks({
                        projectDir: this.projectRoot,
                        tool: 'edit',
                        mutates: true,
                        blockOnFailure: true,
                        fast: false,
                        context: { filePath, reason }
                    });
                } catch (gateError) {
                    if (fileExists) {
                        await fs.writeFile(fullPath, originalContent, 'utf8');
                    } else {
                        await fs.unlink(fullPath).catch(() => {});
                    }
                    renderer.fail('Quality gates failed. Change reverted.');
                    throw new AppError(gateError.message, { cause: gateError });
                }

                return true;
            } catch (e) {
                renderer.fail(`Failed to write file: ${e.message}`);
                return false;
            }
        } else {
            process.stdout.write(theme.warning('  ⚠ Change discarded.') + '\n');
            return false;
        }
    }
}

export const editor = new FileEditor();
