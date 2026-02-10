/**
 * @fileoverview MockSMSProvider module
 * @module providers/mockSMSProvider
 */

const logger = require('../utils/logger');

class MockSMSProvider {
  constructor() {
    this.sentSMS = [];
  }

  async send({ to, message }) {
    // Simulate SMS sending delay
    await new Promise((resolve) => setTimeout(resolve, 30));

    const sms = {
      to,
      message,
      sentAt: new Date().toISOString(),
      id: `sms-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    this.sentSMS.push(sms);

    logger.info({
      message: 'SMS sent (mock)',
      to,
      smsId: sms.id,
    });

    return {
      success: true,
      messageId: sms.id,
    };
  }

  getSentSMS() {
    return this.sentSMS;
  }
}

module.exports = MockSMSProvider;

/**
 * Error handler for mockSMSProvider
 * @param {Error} error - Error to handle
 */
function handleMockSMSProviderError(error) {
  try {
    console.error('[mockSMSProvider]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
