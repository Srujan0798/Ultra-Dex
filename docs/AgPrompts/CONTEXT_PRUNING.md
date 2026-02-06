# 🔧 Context Pruning Implementation Prompt

Implement auto-pruning and visual memory status for Ultra-Dex.

---

## STEP 1: Config Manager Updates
File: `cli/lib/utils/config-manager.js`

Add to DEFAULT_CONFIG:
```javascript
memory: {
  maxContextTokens: 8192,
  autoPrune: true,
  pruneThreshold: 0.8
}
```

Add validation for memory settings.

---

## STEP 2: Titans Memory Updates
File: `cli/lib/memory/titans.js`

### Add checkAndPrune() method
```javascript
checkAndPrune() {
  const hotItems = this.tiers.hot.length;
  const threshold = config.get('memory.pruneThreshold') * config.get('memory.maxContextTokens') / 100;
  
  if (hotItems > threshold) {
    this.consolidate();
  }
}
```

### Update add() method
Call `checkAndPrune()` after adding to hot tier.

---

## STEP 3: Memory Command Updates
File: `cli/lib/commands/memory.js`

### Add status command with --visual flag
```javascript
.command('status')
.alias('stats')
.option('--visual', 'Show visual token usage bar')
.action(async (options) => {
  if (options.visual) {
    // Show progress bar
  }
});
```

---

## SUCCESS CRITERIA
- [x] Auto-prune triggers at threshold
- [x] `ultra-dex memory status --visual` shows bar
- [x] Config validation works
