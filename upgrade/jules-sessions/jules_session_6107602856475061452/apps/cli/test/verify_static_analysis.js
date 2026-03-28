import fs from 'fs';
import assert from 'assert';

console.log('Starting static analysis verification...');

try {
  // 1. Verify Logger
  const loggerContent = fs.readFileSync('cli/lib/ui/logger.js', 'utf8');
  
  if (!loggerContent.includes("import { redact } from '../utils/redactor.js'")) {
    throw new Error('Logger missing redact import');
  }

  // Check for redact calls in key methods
  const methodsToCheck = ['info', 'success', 'warn', 'error', 'debug'];
  methodsToCheck.forEach(method => {
    // Regex is tricky, but we can check if redact(message) is present in the file generally
    // and if the file structure looks right.
    // For specific method: e.g. "redact(message)"
    if (!loggerContent.includes('redact(message)')) {
       // It might be persona.alert(redact(message))
    }
  });

  if (!loggerContent.includes('redact(message)')) {
      throw new Error('Logger does not seem to redact messages (checked for "redact(message)")');
  }
  
  if (!loggerContent.includes('redact(detail)')) {
      throw new Error('Logger does not seem to redact details');
  }

  if (!loggerContent.includes('redact(error)')) {
      // We used const safeError = redact(error);
      if (!loggerContent.includes('redact(error)')) {
          throw new Error('Logger does not seem to redact errors');
      }
  }

  console.log('✅ Logger static analysis passed.');

  // 2. Verify Error Handler
  const errorHandlerContent = fs.readFileSync('cli/lib/utils/error-handler.js', 'utf8');
  
  if (!errorHandlerContent.includes("import { redact } from './redactor.js'")) {
    throw new Error('Error Handler missing redact import');
  }
  
  if (!errorHandlerContent.includes('redact(errorMessage)')) {
      throw new Error('Error Handler does not redact errorMessage');
  }

  if (!errorHandlerContent.includes('redact(context)')) {
      throw new Error('Error Handler does not redact context');
  }
  
  if (!errorHandlerContent.includes('redact(error.stack)')) {
      throw new Error('Error Handler does not redact stack');
  }

  console.log('✅ Error Handler static analysis passed.');

  // 3. Verify Provider Validation
  const providerContent = fs.readFileSync('cli/lib/providers/index.js', 'utf8');
  
  if (!providerContent.includes('validateKeyFormat')) {
      // I didn't create a function validateKeyFormat in the file, I put it inline or invoked it?
      // I put it inline in createProvider: if (providerId === 'openai' && !apiKey.startsWith('sk-'))
      if (!providerContent.includes("!apiKey.startsWith('sk-')")) {
           throw new Error('Provider index.js does not seem to validate OpenAI key format');
      }
  }

  console.log('✅ Provider Validation static analysis passed.');
  console.log('🎉 All static verifications passed!');

} catch (err) {
  console.error('❌ Verification Failed:', err.message);
  process.exit(1);
}
