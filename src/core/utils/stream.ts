var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};
import { singleton } from "tsyringe";
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { printWarning, printError } from '../utils/output.js';
import chalk from "chalk";
import ora from "ora";
function getProvider(providerName, apiKey) {
  switch (providerName.toLowerCase()) {
    case "openai":
      return createOpenAI({
        apiKey,
        baseURL: process.env.OPENAI_BASE_URL
      });
    case "anthropic":
      return createAnthropic({
        apiKey,
        baseURL: process.env.ANTHROPIC_BASE_URL
      });
    case "google":
    case "gemini":
      return createGoogleGenerativeAI({
        apiKey,
        baseURL: process.env.GOOGLE_BASE_URL
      });
    default:
      throw new Error(`Unsupported provider: ${providerName}`);
  }
}
async function streamTextWithDisplay(options = {}) {
  const {
    provider = "anthropic",
    model = "claude-3-5-sonnet-20241022",
    systemPrompt = "",
    userPrompt = "",
    apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY,
    onToken,
    onComplete,
    onError,
    display = true
  } = options;
  if (!apiKey) {
    throw new Error(`API key not provided and not found in environment variables for ${provider}`);
  }
  const selectedProvider = getProvider(provider, apiKey);
  let displaySpinner = null;
  try {
    const result = await streamText({
      model: selectedProvider(model),
      system: systemPrompt,
      prompt: userPrompt
    });
    let fullResponse = "";
    let tokenCount = 0;
    if (display) {
      displaySpinner = ora({
        text: chalk.blue("Streaming response..."),
        spinner: "clock"
      }).start();
    }
    for await (const token of result.textStream) {
      fullResponse += token;
      tokenCount++;
      if (onToken) {
        Promise.resolve().then(() => onToken(token, fullResponse, tokenCount)).catch((err) => {
          if (onError)
            onError(err);
          else
            printError(chalk.red(`Error in onToken callback: ${err.message}`));
        });
      }
      if (display && tokenCount % 10 === 0) {
        displaySpinner.text = chalk.blue(`Streaming... (${tokenCount} tokens)`);
      }
    }
    if (displaySpinner) {
      displaySpinner.succeed(chalk.green("Response complete!"));
    }
    const finalResult = {
      text: fullResponse,
      usage: result.usage,
      response: result.response,
      finishReason: result.finishReason
    };
    if (onComplete) {
      await onComplete(finalResult);
    }
    return finalResult;
  } catch (error) {
    if (displaySpinner) {
      displaySpinner.fail(chalk.red("Stream failed"));
    }
    if (onError) {
      await onError(error);
    }
    throw error;
  }
}
async function streamWithProgressTracking(options = {}) {
  const {
    provider = "anthropic",
    model = "claude-3-5-sonnet-20241022",
    systemPrompt = "",
    userPrompt = "",
    apiKey,
    onProgress,
    onComplete
  } = options;
  let progressTracker = {
    tokensReceived: 0,
    charactersReceived: 0,
    startTime: Date.now(),
    estimatedTotalTokens: null
  };
  const result = await streamTextWithDisplay({
    provider,
    model,
    systemPrompt,
    userPrompt,
    apiKey,
    display: false,
    // We'll handle our own display
    onToken: async (token, fullResponse, tokenCount) => {
      progressTracker.tokensReceived = tokenCount;
      progressTracker.charactersReceived = fullResponse.length;
      const elapsedTime = Date.now() - progressTracker.startTime;
      const tokensPerSecond = elapsedTime > 0 ? (tokenCount / (elapsedTime / 1e3)).toFixed(2) : 0;
      if (onProgress) {
        await onProgress({
          ...progressTracker,
          tokensPerSecond: parseFloat(tokensPerSecond),
          elapsedTime
        });
      }
    },
    onComplete: async (finalResult) => {
      const totalTime = Date.now() - progressTracker.startTime;
      const tokensPerSecond = totalTime > 0 ? (progressTracker.tokensReceived / (totalTime / 1e3)).toFixed(2) : 0;
      if (onComplete) {
        await onComplete({
          ...finalResult,
          totalTime,
          tokensPerSecond: parseFloat(tokensPerSecond),
          ...progressTracker
        });
      }
    }
  });
  return result;
}
async function streamWithRetry(options = {}) {
  const {
    provider = "anthropic",
    model = "claude-3-5-sonnet-20241022",
    systemPrompt = "",
    userPrompt = "",
    apiKey,
    maxRetries = 3,
    retryDelay = 1e3,
    onRetry
  } = options;
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      if (onRetry) {
        await onRetry(attempt, maxRetries, lastError);
      } else {
        printWarning(
          chalk.yellow(`\u26A0\uFE0F  Retry ${attempt}/${maxRetries} after error: ${lastError?.message}`)
        );
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
    }
    try {
      return await streamTextWithDisplay({
        provider,
        model,
        systemPrompt,
        userPrompt,
        apiKey
      });
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries) {
        printError(chalk.red(`
\u274C All retries failed. Last error: ${error.message}`));
        throw error;
      }
    }
  }
}
let InterruptibleStream = class {
  constructor() {
    this.interrupted = false;
    this.abortController = new AbortController();
  }
  async stream(options = {}) {
    const {
      provider = "anthropic",
      model = "claude-3-5-sonnet-20241022",
      systemPrompt = "",
      userPrompt = "",
      apiKey,
      onToken,
      onComplete,
      onError
    } = options;
    const originalSigint = process.listeners("SIGINT")[0] || (() => {
    });
    const interruptHandler = () => {
      this.interrupt();
    };
    process.prependListener("SIGINT", interruptHandler);
    try {
      const selectedProvider = getProvider(provider, apiKey);
      const result = await streamText({
        model: selectedProvider(model),
        system: systemPrompt,
        prompt: userPrompt,
        abortSignal: this.abortController.signal
      });
      let fullResponse = "";
      let tokenCount = 0;
      const spinner = ora({
        text: chalk.blue("Streaming response... (Press Ctrl+C to interrupt)"),
        spinner: "clock"
      }).start();
      for await (const token of result.textStream) {
        if (this.interrupted) {
          spinner.warn(chalk.yellow("Stream interrupted by user"));
          break;
        }
        fullResponse += token;
        tokenCount++;
        if (onToken) {
          Promise.resolve().then(() => onToken(token, fullResponse, tokenCount)).catch((err) => {
            if (onError)
              onError(err);
            else
              printError(chalk.red(`Error in onToken callback: ${err.message}`));
          });
        }
        if (tokenCount % 10 === 0) {
          spinner.text = chalk.blue(
            `Streaming... (${tokenCount} tokens) - Press Ctrl+C to interrupt`
          );
        }
      }
      if (!this.interrupted) {
        spinner.succeed(chalk.green("Response complete!"));
      }
      const finalResult = {
        text: fullResponse,
        usage: result.usage,
        response: result.response,
        finishReason: result.finishReason
      };
      if (onComplete) {
        await onComplete(finalResult);
      }
      return finalResult;
    } catch (error) {
      if (error.name === "AbortError") {
        printWarning(chalk.yellow("Stream was aborted"));
      } else {
        if (onError) {
          await onError(error);
        }
        throw error;
      }
    } finally {
      process.removeListener("SIGINT", interruptHandler);
      process.prependListener("SIGINT", originalSigint);
    }
  }
  interrupt() {
    this.interrupted = true;
    this.abortController.abort();
  }
};
InterruptibleStream = __decorateClass([
  singleton()
], InterruptibleStream);
function formatStreamOutput(text, mode = "default") {
  switch (mode) {
    case "typing":
      return text;
    case "chunked": {
      const chunkSize = 50;
      const chunks = [];
      for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
      }
      return chunks;
    }
    case "annotated":
      return text.replace(/\*\*(.*?)\*\*/g, chalk.bold("$1")).replace(/\*(.*?)\*/g, chalk.italic("$1")).replace(/`(.*?)`/g, chalk.bgGray("$1"));
    default:
      return text;
  }
}
var stream_default = {
  streamTextWithDisplay,
  streamWithProgressTracking,
  streamWithRetry,
  InterruptibleStream,
  formatStreamOutput
};
export {
  InterruptibleStream,
  stream_default as default,
  formatStreamOutput,
  streamTextWithDisplay,
  streamWithProgressTracking,
  streamWithRetry
};
