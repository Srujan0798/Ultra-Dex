# Routing Strategies

The SmartRouter supports 4 strategies. Set one when calling `enableRouter()`.

## cheapest

Routes to the provider with the lowest `costPerToken`.

```javascript
dex.enableRouter({
  strategy: 'cheapest',
  costPerToken: {
    openai: 0.005,
    anthropic: 0.003,
    google: 0.0005,
  },
})
```

## fastest

Routes to the provider with the best average latency based on live stats.

```javascript
dex.enableRouter({ strategy: 'fastest' })
```

## round-robin

Distributes requests evenly across all healthy providers.

```javascript
dex.enableRouter({ strategy: 'round-robin' })
```

## fallback-chain

Uses your preferred order. If one fails, instantly tries the next.

```javascript
dex.enableRouter({
  strategy: 'fallback-chain',
  fallbackOrder: ['anthropic', 'openai', 'google'],
})
```

## Switching at runtime

```javascript
dex.getRouter().strategy = 'fastest'
```
