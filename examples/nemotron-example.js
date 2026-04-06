/**
 * Nemotron Example - Matching NVIDIA's Python API
 * 
 * Usage: node nemotron-example.js
 */

import { createNemotronClient } from '../src/services/ai-providers/nemotron.js';
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
const MODEL = 'nvidia/nemotron-3-super-120b-a12b';

if (!API_KEY) {
  console.error('❌ NVIDIA_API_KEY not found in .env.local');
  console.error('Get free key at: https://build.nvidia.com/');
  process.exit(1);
}

// Create client (matches Python: client = OpenAI(...))
const client = createNemotronClient(API_KEY);

// Example 1: Basic chat (matches your Python example)
async function example1() {
  console.log('📝 Example 1: Write a haiku about GPUs\n');
  
  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: 'Write a haiku about GPUs' }],
    max_tokens: 16000,
    temperature: 1.0,
    top_p: 0.95,
    extra_body: {
      chat_template_kwargs: {
        enable_thinking: true,
      },
    },
  });

  console.log(response.choices[0].message.content);
  console.log('\n');
}

// Example 2: Reasoning disabled
async function example2() {
  console.log('📝 Example 2: Simple question (no thinking)\n');
  
  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: 'What is the capital of Japan?' }],
    max_tokens: 16000,
    temperature: 1.0,
    top_p: 0.95,
    extra_body: {
      chat_template_kwargs: {
        enable_thinking: false,
      },
    },
  });

  console.log(response.choices[0].message.content);
  console.log('\n');
}

// Example 3: Low-effort reasoning
async function example3() {
  console.log('📝 Example 3: Low-effort reasoning\n');
  
  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: 'What is the capital of Japan?' }],
    max_tokens: 16000,
    temperature: 1.0,
    top_p: 0.95,
    extra_body: {
      chat_template_kwargs: {
        enable_thinking: true,
        low_effort: true,
      },
    },
  });

  console.log(response.choices[0].message.content);
  console.log('\n');
}

// Example 4: Coding
async function example4() {
  console.log('📝 Example 4: Code generation\n');
  
  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [{ 
      role: 'user', 
      content: 'Write a JavaScript function to check if a number is prime' 
    }],
    max_tokens: 16000,
    temperature: 1.0,
    top_p: 0.95,
    extra_body: {
      chat_template_kwargs: {
        enable_thinking: true,
      },
    },
  });

  console.log(response.choices[0].message.content);
  console.log('\n');
}

// Run all examples
async function main() {
  console.log('🚀 NVIDIA Nemotron-3-Super Examples\n');
  console.log('Model:', MODEL);
  console.log('API: https://integrate.api.nvidia.com/v1\n');
  console.log('─'.repeat(50) + '\n');
  
  try {
    await example1();
    await example2();
    await example3();
    await example4();
    
    console.log('✅ All examples completed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      const data = await error.response.json?.();
      console.error('Details:', JSON.stringify(data, null, 2));
    }
    process.exit(1);
  }
}

main();
