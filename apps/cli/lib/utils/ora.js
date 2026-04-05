// Copyright (c) 2026 Ultra-Dex

class OraShim {
  constructor(options = {}) {
    this.isSpinning = false;
    this.text = typeof options === 'string' ? options : options.text || '';
  }

  start(text) {
    if (typeof text === 'string') {
      this.text = text;
    }
    this.isSpinning = true;
    if (this.text) {
      console.log(this.text);
    }
    return this;
  }

  stop() {
    this.isSpinning = false;
    return this;
  }

  succeed(text) {
    this.isSpinning = false;
    const message = typeof text === 'string' ? text : this.text;
    if (message) {
      console.log(`✓ ${message}`);
    }
    return this;
  }

  fail(text) {
    this.isSpinning = false;
    const message = typeof text === 'string' ? text : this.text;
    if (message) {
      console.log(`✖ ${message}`);
    }
    return this;
  }

  warn(text) {
    this.isSpinning = false;
    const message = typeof text === 'string' ? text : this.text;
    if (message) {
      console.log(`⚠ ${message}`);
    }
    return this;
  }

  info(text) {
    this.isSpinning = false;
    const message = typeof text === 'string' ? text : this.text;
    if (message) {
      console.log(`ℹ ${message}`);
    }
    return this;
  }

  clear() {
    return this;
  }

  stopAndPersist({ symbol = '•', text = this.text } = {}) {
    this.isSpinning = false;
    if (text) {
      console.log(`${symbol} ${text}`);
    }
    return this;
  }
}

export default function ora(options = {}) {
  return new OraShim(options);
}
