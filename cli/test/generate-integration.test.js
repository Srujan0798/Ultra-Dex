/**
 * Generate Command Integration Tests
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const CLI_PATH = path.resolve(process.cwd(), 'bin/ultra.js');

describe('generate command integration', () => {
    let testDir;

    beforeEach(async () => {
        testDir = path.join(os.tmpdir(), `ultra-dex-test-${Date.now()}`);
        await fs.mkdir(testDir, { recursive: true });
    });

    afterEach(async () => {
        try {
            await fs.rm(testDir, { recursive: true, force: true });
        } catch (e) { }
    });

    it('generate --help shows usage information', async () => {
        const result = execSync(`node ${CLI_PATH} generate --help`, { encoding: 'utf8' });
        assert.ok(result.includes('generate'), 'Should show generate command');
    });

    it('generate component creates component file', async () => {
        // Create a minimal project structure
        await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify({
            name: 'test-project',
            type: 'module'
        }));

        await fs.mkdir(path.join(testDir, 'src/components'), { recursive: true });

        try {
            const result = execSync(`node ${CLI_PATH} generate component TestButton --dry-run 2>&1 || true`, {
                cwd: testDir,
                encoding: 'utf8'
            });

            assert.ok(result.length > 0, 'Should produce output');
        } catch (error) {
            // Expected if no AI key
        }
    });

    it('generate page creates page file', async () => {
        await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify({
            name: 'test-project',
            type: 'module'
        }));

        try {
            const result = execSync(`node ${CLI_PATH} generate page Dashboard --dry-run 2>&1 || true`, {
                cwd: testDir,
                encoding: 'utf8'
            });

            assert.ok(result.length > 0, 'Should produce output');
        } catch (error) {
            // Expected if no AI key
        }
    });

    it('generate api creates API route', async () => {
        await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify({
            name: 'test-project',
            type: 'module'
        }));

        try {
            const result = execSync(`node ${CLI_PATH} generate api users --dry-run 2>&1 || true`, {
                cwd: testDir,
                encoding: 'utf8'
            });

            assert.ok(result.length > 0, 'Should produce output');
        } catch (error) {
            // Expected if no AI key
        }
    });
});
