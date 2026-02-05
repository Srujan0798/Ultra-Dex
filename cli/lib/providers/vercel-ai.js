/**
 * Vercel AI SDK Streaming Provider
 * Adds real-time token streaming capabilities to Ultra-Dex
 */

import { streamTextWithDisplay, streamWithRetry } from '../utils/stream.js';
import { printWarning, printError } from '../utils/output.js';
import chalk from 'chalk';
import ora from 'ora';

/**
 * Stream text with real-time display
 */
export async function streamWithVercelAI(options = {}) {
  const {
    provider = 'anthropic',
    model = 'claude-3-5-sonnet-20241022',
    systemPrompt = '',
    userPrompt = '',
    apiKey,
    onToken,
    onComplete,
    onError
  } = options;

  return streamTextWithDisplay({
    provider,
    model,
    systemPrompt,
    userPrompt,
    apiKey,
    onToken,
    onComplete,
    onError
  });
}

/**
 * Enhanced stream function with error handling and fallbacks
 */
export async function enhancedStream(options = {}) {
  const {
    provider = 'anthropic',
    model = 'claude-3-5-sonnet-20241022',
    systemPrompt = '',
    userPrompt = '',
    apiKey,
    stream = true,
    maxRetries = 3,
    retryDelay = 1000
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      printWarning(chalk.yellow(`⚠️  Retry ${attempt}/${maxRetries} after error: ${lastError?.message}`));
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
    }

    try {
      if (stream) {
        return await streamWithRetry({
          provider,
          model,
          systemPrompt,
          userPrompt,
          apiKey,
          maxRetries,
          retryDelay,
          onRetry: (retry) => {
            printWarning(chalk.yellow(`⚠️  Retry ${retry} after stream error.`));
          }
        });
      }

      const { createProvider } = await import(`../providers/${provider}.js`);
      const providerInstance = createProvider({ apiKey });
      return await providerInstance.generate(systemPrompt, userPrompt, { model });
    } catch (error) {
      lastError = error;
      
      // If this was the last attempt, re-throw the error
      if (attempt === maxRetries) {
        printError(chalk.red(`\n❌ All retries failed. Last error: ${error.message}`));
        throw error;
      }
    }
  }
}

/**
 * Stream with real-time display using a callback
 */
export async function streamWithCallback(options = {}) {
  const {
    provider = 'anthropic',
    model = 'claude-3-5-sonnet-20241022',
    systemPrompt = '',
    userPrompt = '',
    apiKey,
    onStream,
    onComplete,
    onError
  } = options;

  try {
    const result = await streamWithVercelAI({
      provider,
      model,
      systemPrompt,
      userPrompt,
      apiKey,
      onToken: (token) => {
        if (onStream) {
          onStream(token);
        }
      },
      onComplete: (finishReason, usage, response) => {
        if (onComplete) {
          onComplete(finishReason, usage, response);
        }
      },
      onError: (error) => {
        if (onError) {
          onError(error);
        }
      }
    });

    return result;
  } catch (error) {
    if (onError) {
      onError(error);
    }
    throw error;
  }
}

/**
 * Stream with progress indication
 */
export async function streamWithProgress(options = {}) {
  const {
    provider = 'anthropic',
    model = 'claude-3-5-sonnet-20241022',
    systemPrompt = '',
    userPrompt = '',
    apiKey,
    onProgress
  } = options;

  const spinner = ora({
    text: chalk.blue('Initializing stream...'),
    spinner: 'clock'
  }).start();

  let tokenCount = 0;
  let response = '';

  try {
    const result = await streamWithVercelAI({
      provider,
      model,
      systemPrompt,
      userPrompt,
      apiKey,
      onToken: (token) => {
        response += token;
        tokenCount++;
        
        if (tokenCount % 10 === 0) { // Update every 10 tokens
          spinner.text = chalk.blue(`Processing... ${tokenCount} tokens received`);
          
          if (onProgress) {
            onProgress({
              tokensReceived: tokenCount,
              responseLength: response.length,
              estimatedCompletion: Math.min(100, Math.round((response.length / Math.max(response.length + 1000, 1000)) * 100))
            });
          }
        }
      },
      onComplete: (finishReason, usage) => {
        spinner.succeed(chalk.green(`Completed - ${usage.totalTokens} total tokens`));
      },
      onError: (error) => {
        spinner.fail(chalk.red(`Error: ${error.message}`));
      }
    });

    return result;
  } catch (error) {
    spinner.fail(chalk.red(`Stream failed: ${error.message}`));
    throw error;
  }
}

export default {
  streamWithVercelAI,
  enhancedStream,
  streamWithCallback,
  streamWithProgress
};
