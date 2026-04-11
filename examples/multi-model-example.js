/**
 * NVIDIA Multi-Model Example
 * Use ONE API key to access ALL models in NVIDIA's catalog
 *
 * Usage: node multi-model-example.js
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
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const API_KEY = process.env.NVIDIA_API_KEY;

if (!API_KEY) {
  console.error('❌ NVIDIA_API_KEY not found in .env.local');
  console.error('Get free key at: https://build.nvidia.com/');
  process.exit(1);
}

// Single client, one API key - works for ALL models
const client = new OpenAI({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  apiKey: API_KEY,
});

// Available models (check https://build.nvidia.com for full list)
const MODELS = {
  nemotron: 'nvidia/nemotron-3-super-120b-a12b',
  llama: 'meta/llama-3.1-70b-instruct',
  mistral: 'mistralai/mistral-large',
  gemma: 'google/gemma-2b',
  phi: 'microsoft/phi-3-mini-128k-instruct',
  qwen: 'qwen/qwen-2.5-coder-32b-instruct',
  deepseek: 'deepseek-ai/deepseek-coder',
};

async function testModel(modelId, prompt) {
  try {
    console.log(`\n📝 Testing: ${modelId}`);
    console.log('─'.repeat(50));

    const response = await client.chat.completions.create({
      model: modelId,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
      top_p: 0.95,
    });

    console.log(response.choices[0].message.content.substring(0, 300) + '...\n');
  } catch (error) {
    console.error(`Error with ${modelId}:`, error.message);
  }
}

async function main() {
  console.log('🚀 NVIDIA API - Multi-Model Test');
  console.log('One API Key, Multiple Models!\n');

  const prompt = 'Say hello in one sentence';

  // Test a few models (comment/uncomment as needed)
  await testModel(MODELS.nemotron, prompt);
  await testModel(MODELS.llama, prompt);
  await testModel(MODELS.mistral, prompt);

  console.log('✅ Done! Try other models by uncommenting in the code.');
  console.log('\n📚 Full model list: https://build.nvidia.com/explore/discover');
}

main();
