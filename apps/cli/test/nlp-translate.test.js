// Copyright (c) 2026 Ultra-Dex

import { translateToCommand } from '../lib/nlp/router.js';

function testTranslate() {
  const cases = [
    {
      input: 'My build is failing, help me fix it',
      expected: 'ultra-dex fix --build'
    },
    {
      input: 'Initialize a new project called my-app',
      expected: 'ultra-dex init my-app'
    },
    {
      input: 'How do I use this tool?',
      expected: 'ultra-dex --help'
    },
    {
      input: 'Check system health',
      expected: 'ultra-dex doctor'
    },
    {
      input: 'Run tests with verbose output',
      expected: 'ultra-dex test --verbose'
    },
    {
      input: 'Deploy to production using claude provider',
      expected: 'ultra-dex deploy --provider claude'
    }
  ];

  console.log('Testing NLP translateToCommand:');
  console.log('-------------------------------');

  let passed = 0;
  for (const c of cases) {
    const result = translateToCommand(c.input);

    if (result === c.expected) {
      console.log(`✅ [PASS] "${c.input}" -> "${result}"`);
      passed++;
    } else {
      console.log(`❌ [FAIL] "${c.input}" -> "${result}" (Expected: "${c.expected}")`);
    }
  }

  console.log(`\nResults: ${passed}/${cases.length} tests passed.`);
}

testTranslate();
