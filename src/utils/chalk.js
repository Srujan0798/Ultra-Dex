// Copyright (c) 2026 Ultra-Dex

function identity(value) {
  return value;
}

const passthrough = new Proxy(identity, {
  get() {
    return passthrough;
  },
  apply(_target, _thisArg, args) {
    if (args.length === 0) {
      return passthrough;
    }

    if (typeof args[0] === 'string' && args[0].startsWith('#')) {
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
