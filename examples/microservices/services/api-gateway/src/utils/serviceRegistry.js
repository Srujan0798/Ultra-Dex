const logger = require('./logger');

class ServiceRegistry {
  constructor() {
    this.services = {
      'auth-service': process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
      'users-service': process.env.USERS_SERVICE_URL || 'http://localhost:3002',
      'orders-service': process.env.ORDERS_SERVICE_URL || 'http://localhost:3003',
      'payments-service': process.env.PAYMENTS_SERVICE_URL || 'http://localhost:3004',
      'notifications-service': process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3005'
    };
  }

  getServiceUrl(serviceName) {
    const url = this.services[serviceName];
    if (!url) {
      logger.error(`Service ${serviceName} not found in registry`);
      throw new Error(`Service ${serviceName} not found`);
    }
    return url;
  }

  registerService(serviceName, url) {
    this.services[serviceName] = url;
    logger.info(`Registered service: ${serviceName} at ${url}`);
  }

  initialize() {
    logger.info('Service registry initialized with services:', Object.keys(this.services));
  }
}

module.exports = new ServiceRegistry();
