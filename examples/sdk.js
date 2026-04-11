/**
 * Ultra-Dex SDK Example
 *
 * Demonstrates how to use the @ultra-dex/sdk package
 */

import { UltraDex } from '@ultra-dex/sdk';

// Example: Initialize Ultra-Dex
const ultra = new UltraDex({
  apiKey: process.env.ULTRA_DEX_API_KEY,
  baseUrl: process.env.ULTRA_DEX_BASE_URL || 'http://localhost:3000',
  defaultProvider: 'anthropic',
});

// Example: Execute a task
async function example() {
  try {
    await ultra.initialize();
    console.log('Ultra-Dex initialized');

    // Execute a simple task
    const result = await ultra.execute('Analyze this codebase for security issues');
    console.log('Result:', result);

    await ultra.stop();
  } catch (error) {
    console.error('Error:', error);
  }
}

export { example };
export default UltraDex;
