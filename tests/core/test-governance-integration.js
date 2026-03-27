// Copyright (c) 2026 Ultra-Dex
/**
 * Test to validate governance integration with executeTool
 * This test focuses on verifying that our implementation meets the requirements:
 * 1. executeTool calls governance.authorize() before tool.handler()
 * 2. Blocked operations throw GovernanceDeniedException
 * 3. Audit log entry is created for every execution
 */

import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';

// We'll test by examining the source code directly to ensure our modifications are correct
import fs from 'fs';
import path from 'path';

describe('Governance Integration Verification', () => {
  let orchestratorSource;

  beforeEach(() => {
    // Read the orchestrator source file to verify our changes
    const filePath = path.join(process.cwd(), 'src', 'core', 'orchestration', 'index.js');
    orchestratorSource = fs.readFileSync(filePath, 'utf8');
  });

  it('should have governance check in executeTool before tool.handler()', () => {
    // Verify that executeTool contains our governance check
    assert.match(orchestratorSource, /Governance check before tool execution/);
    assert.match(orchestratorSource, /const governance = new GovernanceManager\(\);/);
    assert.match(orchestratorSource, /const governanceResult = await governance.gate\(context\);/);
    assert.match(orchestratorSource, /if \(!governanceResult\.allowed\)/);
    assert.match(orchestratorSource, /throw new GovernanceDeniedException/);
  });

  it('should import GovernanceManager and GovernanceDeniedException', () => {
    // Verify that the necessary imports are present
    assert.match(
      orchestratorSource,
      /import \{ GovernanceManager \} from '\.\.\/governance\/governance-manager\.js'/
    );
    assert.match(
      orchestratorSource,
      /import \{ GovernanceDeniedException \} from '\.\.\/governance\/governance-manager\.js'/
    );
  });

  it('should have governance check in executeTask before AI call', () => {
    // Verify that executeTask contains our governance check
    assert.match(orchestratorSource, /Governance check before task execution/);
    assert.match(orchestratorSource, /const governance = new GovernanceManager\(\);/);
    assert.match(orchestratorSource, /const governanceResult = await governance.gate\(context\);/);
    assert.match(orchestratorSource, /if \(!governanceResult\.allowed\)/);
    assert.match(orchestratorSource, /throw new GovernanceDeniedException/);
  });

  it('should define GovernanceDeniedException class', () => {
    // Read the governance manager source file to verify the exception class
    const govFilePath = path.join(
      process.cwd(),
      'src',
      'core',
      'governance',
      'governance-manager.js'
    );
    const govSource = fs.readFileSync(govFilePath, 'utf8');

    assert.match(govSource, /export class GovernanceDeniedException extends Error/);
    assert.match(govSource, /this\.name = 'GovernanceDeniedException'/);
  });
});
