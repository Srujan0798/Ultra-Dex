const logger = require('../utils/logger');

class MockPaymentGateway {
  async processPayment(paymentData) {
    const { amount, currency, paymentMethod } = paymentData;
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Simulate random failures (5% chance)
    if (Math.random() < 0.05) {
      return {
        success: false,
        error: 'Payment declined by bank',
        transactionId: null
      };
    }
    
    // Generate mock transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      success: true,
      transactionId,
      gatewayResponse: {
        amount,
        currency,
        paymentMethod,
        processedAt: new Date().toISOString(),
        gateway: 'mock-gateway-v1'
      }
    };
  }

  async processRefund(refundData) {
    const { amount, paymentId } = refundData;
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Generate mock refund ID
    const refundId = `RFD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      success: true,
      refundId,
      gatewayResponse: {
        amount,
        originalPaymentId: paymentId,
        processedAt: new Date().toISOString(),
        gateway: 'mock-gateway-v1'
      }
    };
  }

  async validatePaymentMethod(methodData) {
    const { type, lastFour, expiryMonth, expiryYear } = methodData;
    
    // Basic validation
    const errors = [];
    
    if (!type || !['credit_card', 'debit_card'].includes(type)) {
      errors.push('Invalid payment method type');
    }
    
    if (!lastFour || lastFour.length !== 4) {
      errors.push('Invalid card number');
    }
    
    if (expiryMonth < 1 || expiryMonth > 12) {
      errors.push('Invalid expiry month');
    }
    
    const currentYear = new Date().getFullYear();
    if (expiryYear < currentYear) {
      errors.push('Card has expired');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = MockPaymentGateway;
