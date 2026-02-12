# Plugin Template

Starter template for creating Ultra-Dex plugins.

## Quick Start

1. Copy this directory:

   ```bash
   cp -r packages/plugins/TEMPLATE packages/plugins/my-plugin
   cd packages/plugins/my-plugin
   ```

2. Update `package.json`:
   - Change `name` to `@ultra-dex/plugin-my-plugin`
   - Update `description`, `author`, `manifest`

3. Implement your plugin in `index.js`:

   ```javascript
   export class MyPlugin extends UltraDexPlugin {
     // Your implementation
   }
   ```

4. Test your plugin:

   ```bash
   npm test
   ```

5. Publish (optional):
   ```bash
   npm publish
   ```

## Plugin Structure

```
my-plugin/
├── index.js          # Main entry point
├── package.json      # Manifest and dependencies
├── src/              # Source code
│   └── utils.js
├── test/             # Tests
│   └── index.test.js
├── docs/             # Documentation
│   └── README.md
└── README.md         # This file
```

## Configuration

```javascript
// In your ultra-dex config
{
  "plugins": {
    "my-plugin": {
      "enabled": true,
      "option1": "custom-value"
    }
  }
}
```

## Available Hooks

- `before:task` - Before task execution
- `after:task` - After task execution
- `on:error` - On error occurrence
- `before:chat` - Before chat request
- `after:chat` - After chat response

## License

MIT
