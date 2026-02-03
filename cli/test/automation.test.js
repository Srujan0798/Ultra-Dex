import { test } from 'node:test';
import assert from 'node:assert';
import { 
    verifyArchitectureAlignment, 
    verifyErrorHandlingStrategy, 
    verifyApiDocumentation, 
    verifyDatabaseSchema, 
    verifyEnvironmentVariables 
} from '../lib/quality/automation.js';
import path from 'path';

test('verifyArchitectureAlignment', async () => {
    const result = await verifyArchitectureAlignment(process.cwd());
    assert.ok(['PASS', 'FAIL', 'SKIP'].includes(result.status));
    assert.strictEqual(typeof result.message, 'string');
});

test('verifyErrorHandlingStrategy', async () => {
    const result = await verifyErrorHandlingStrategy(process.cwd());
    assert.ok(['PASS', 'FAIL', 'SKIP'].includes(result.status));
});

test('verifyApiDocumentation', async () => {
    const result = await verifyApiDocumentation(process.cwd());
    assert.ok(['PASS', 'FAIL', 'SKIP'].includes(result.status));
});

test('verifyDatabaseSchema', async () => {
    const result = await verifyDatabaseSchema(process.cwd());
    assert.ok(['PASS', 'FAIL', 'SKIP'].includes(result.status));
});

test('verifyEnvironmentVariables', async () => {
    const result = await verifyEnvironmentVariables(process.cwd());
    assert.ok(['PASS', 'FAIL', 'SKIP'].includes(result.status));
});
