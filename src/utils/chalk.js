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

let chalk = passthrough;

try {
  const mod = await import('chalk');
  chalk = mod.default ?? mod;
} catch {
  chalk = passthrough;
}

export default chalk;
