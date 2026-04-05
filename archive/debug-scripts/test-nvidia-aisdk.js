/**
 * Simple NVIDIA API Test using @ai-sdk/openai
 * This uses the existing AI SDK in the project
 */

import { createOpenAICompatible } from '@ai-sdk/openai';
import { generateText } from 'ai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local explicitly
const envPath = join(__dirname, '.env.local');
console.log('Loading env from:', envPath);

if (fs.existsSync(envPath)) {
  console.log('✅ .env.local found');
  dotenv.config({ path: envPath });
} else {
  console.log('❌ .env.local not found');
}

const API_KEY = process.env.NVIDIA_API_KEY;

if (!API_KEY) {
  console.error('❌ NVIDIA_API_KEY not found!');
  process.exit(1);
}

console.log('🔑 API Key found:', API_KEY.substring(0, 10) + '...');
console.log('🚀 Testing NVIDIA Nemotron API...\n');

// Create NVIDIA client using AI SDK
const nvidia = createOpenAICompatible({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: API_KEY,
});

async function test() {
  try {
    console.log('📝 Sending request to Nemotron-3-Super...\n');
    
    const { text } = await generateText({
      model: nvidia('nvidia/nemotron-3-super-120b-a12b'),
      prompt: 'Say hello in one sentence',
    });

    console.log('✅ Success!\n');
    console.log('Response:', text);
    console.log('\n🎉 API is working! You can now use Nemotron in Ultra-Dex.\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      try {
        const data = await error.response.json();
        console.error('Details:', JSON.stringify(data, null, 2));
      } catch {}
    }
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

test();
