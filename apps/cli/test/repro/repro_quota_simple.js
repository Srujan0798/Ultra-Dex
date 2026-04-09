import fs from 'fs';
import path from 'path';

const providersPath = path.resolve('cli/lib/providers');

function checkFileForUsageTracking(filepath) {
  try {
    if (!fs.existsSync(filepath)) {
      console.error(`[ERROR] File not found: ${filepath}`);
      process.exit(1);
    }
    const content = fs.readFileSync(filepath, 'utf8');
    if (
      content.includes('logUsage') ||
      content.includes('recordSpend') ||
      content.includes('recordUsage')
    ) {
      console.log(`[INFO] ${path.basename(filepath)} contains usage tracking keywords.`);
      return true;
    }
  } catch (e) {
    console.error(`[ERROR] Could not read ${filepath}: ${e.message}`);
    process.exit(1);
  }
  return false;
}

console.log('Checking for usage tracking integration...');

const files = ['openai.js', 'claude.js', 'gemini.js', 'index.js'];
let found = false;

files.forEach((file) => {
  if (checkFileForUsageTracking(path.join(providersPath, file))) {
    found = true;
  }
});

if (!found) {
  console.log(
    '✅ PASS: No usage tracking calls found in provider implementations (Quota accounting disconnected).'
  );
} else {
  console.log('❌ FAIL: Usage tracking found (Need to verify if it is connected correctly).');
}
