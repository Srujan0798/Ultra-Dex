/**
 * Nemotron Example - Using NVIDIA's API
 *
 * Usage: node examples/nemotron-example.js
 */

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

// Example: Simple chat completion using fetch
async function chatWithNemotron(prompt) {
  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    throw new Error(`NVIDIA API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Run example
async function main() {
  console.log('🚀 Nemotron Example\n');

  const prompt = 'Explain quantum computing in simple terms';
  console.log(`Prompt: ${prompt}\n`);

  try {
    const response = await chatWithNemotron(prompt);
    console.log('Response:', response);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
