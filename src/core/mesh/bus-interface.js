/**
 * MessageBus Interface
 *
 * Abstract class defining the message bus interface for Ultra-Dex.
 * All message bus implementations must extend this class.
 */

class MessageBus {
  /**
   * Connect to the message bus
   * @returns {Promise<void>}
   */
  async connect() {
    throw new Error('connect() method not implemented');
  }

  /**
   * Disconnect from the message bus
   * @returns {Promise<void>}
   */
  async disconnect() {
    throw new Error('disconnect() method not implemented');
  }

  /**
   * Publish a message to a channel
   * @param {string} channel - The channel to publish to
   * @param {object} message - The message to publish
   * @returns {Promise<void>}
   */
  async publish(channel, message) {
    throw new Error('publish() method not implemented');
  }

  /**
   * Subscribe to a channel
   * @param {string} channel - The channel to subscribe to
   * @param {Function} handler - The message handler function
   * @returns {Promise<void>}
   */
  async subscribe(channel, handler) {
    throw new Error('subscribe() method not implemented');
  }

  /**
   * Send a request and wait for a response
   * @param {string} replyChannel - The channel to listen for replies
   * @param {object} message - The message to send
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<object>} - The response message
   */
  async request(replyChannel, message, timeout = 5000) {
    throw new Error('request() method not implemented');
  }

  /**
   * Broadcast an event to all nodes
   * @param {string} event - The event name
   * @param {object} payload - The event payload
   * @returns {Promise<void>}
   */
  async broadcast(event, payload) {
    throw new Error('broadcast() method not implemented');
  }
}

export default MessageBus;
