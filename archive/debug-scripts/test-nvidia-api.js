/**
 * Simple NVIDIA API Test
 * Run this after npm install completes
 */

import { OpenAI } from 'openai';
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
  console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('API')));
  process.exit(1);
}

console.log('🔑 API Key found:', API_KEY.substring(0, 10) + '...');
console.log('🚀 Testing NVIDIA Nemotron API...\n');

const client = new OpenAI({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: API_KEY,
});

async function test() {
  try {
    console.log('📝 Sending request to Nemotron-3-Super...\n');
    
    const response = await client.chat.completions.create({
      model: 'meta/llama-3.1-8b-instruct',
      messages: [{ role: 'user', content: 'Say hello in one sentence' }],
      max_tokens: 50,
      temperature: 0.5,
    });

    console.log('✅ Success!\n');
    const content = response.choices[0].message.content;
    console.log('Response:', content);
    
    if (!content || content.trim().length === 0) {
      console.error('\n❌ ERROR: API returned empty response!\n');
      process.exit(1);
    }
    
    console.log('\n🎉 API is working! You can now use Nemotron in Ultra-Dex.\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      try {
        const data = await error.response.json();
        console.error('Details:', JSON.stringify(data, null, 2));
      } catch {}
    }
    process.exit(1);
  }
}

test();
