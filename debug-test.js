import { describe, it } from 'node:test';
import { fileURLToPath } from 'url';

describe('debug', () => {
  it('should show import.meta.url', () => {
    console.log('Current file URL:', import.meta.url);
    console.log('Current file path:', fileURLToPath(import.meta.url));
    console.log('CWD:', process.cwd());
  });
});
