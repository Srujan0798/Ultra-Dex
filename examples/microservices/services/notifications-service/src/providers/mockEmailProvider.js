/**
 * @fileoverview MockEmailProvider module
 * @module providers/mockEmailProvider
 */

const logger = require('../utils/logger');

class MockEmailProvider {
  constructor() {
    this.sentEmails = [];
  }

  async send({ to, subject, body, html }) {
    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 50));

    const email = {
      to,
      subject,
      body,
      html,
      sentAt: new Date().toISOString(),
      id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    this.sentEmails.push(email);

    logger.info({
      message: 'Email sent (mock)',
      to,
      subject,
      emailId: email.id,
    });

    return {
      success: true,
      messageId: email.id,
    };
  }

  getSentEmails() {
    return this.sentEmails;
  }
}

module.exports = MockEmailProvider;

/**
 * Error handler for mockEmailProvider
 * @param {Error} error - Error to handle
 */
function handleMockEmailProviderError(error) {
  try {
    console.error('[mockEmailProvider]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
