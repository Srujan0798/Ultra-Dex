/**
 * @fileoverview ServiceDiscovery module
 * @module utils/serviceDiscovery
 */

const logger = require('./logger');

const CONSUL_HOST = process.env.CONSUL_HOST || 'localhost';
const CONSUL_PORT = process.env.CONSUL_PORT || 8500;

const registerService = async (serviceName, port) => {
  const serviceId = `${serviceName}-${process.env.HOSTNAME || 'local'}`;

  const registration = {
    ID: serviceId,
    Name: serviceName,
    Tags: ['nodejs', 'microservice'],
    Port: parseInt(port),
    Check: {
      HTTP: `http://localhost:${port}/health`,
      Interval: '10s',
      Timeout: '5s',
    },
  };

  try {
    const response = await fetch(`http://${CONSUL_HOST}:${CONSUL_PORT}/v1/agent/service/register`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registration),
    });

    if (response.ok) {
      logger.info(`Registered service ${serviceName} with Consul`);
    } else {
      throw new Error(`Consul returned ${response.status}`);
    }
  } catch (error) {
    logger.warn('Consul registration failed:', error.message);
    throw error;
  }
};

module.exports = { registerService };
