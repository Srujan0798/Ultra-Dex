// @ts-check
// Copyright (c) 2026 Ultra-Dex

function identity(value) {
  return value;
}

// Pattern for hex color codes (e.g., #ff0000, #f00)
const HEX_COLOR_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const passthrough = new Proxy(identity, {
  get() {
    return passthrough;
  },
  apply(_target, _thisArg, args) {
    if (args.length === 0) {
      return passthrough;
    }

    // Handle chalk.hex('#ff0000') style calls - only for actual hex colors
    if (typeof args[0] === 'string' && HEX_COLOR_PATTERN.test(args[0])) {
      return passthrough;
    }

    if (args.every((arg) => typeof arg === 'number')) {
      return passthrough;
    }

    return args[0];
  },
});

// Ensure all common chalk properties return the passthrough proxy
const chalk = new Proxy(passthrough, {
  get(target, prop) {
    if (prop === 'default') return chalk;
    return passthrough;
  },
});

export default chalk;
