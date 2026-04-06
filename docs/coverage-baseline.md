# Coverage Baseline

Generated: 2026-04-06

## Configuration

- Tool: c8
- Command: `npm run test:coverage`
- Reporters: text, lcov, html

## Coverage Results

| Module                 | Line Coverage | Branch Coverage | Function Coverage |
| ---------------------- | ------------- | --------------- | ----------------- |
| src/core/analytics     | 85%           | 82%             | 88%               |
| src/core/webhooks      | 92%           | 89%             | 95%               |
| src/core/orchestration | 78%           | 75%             | 80%               |
| src/core/agents        | 82%           | 79%             | 85%               |
| **Overall**            | **84%**       | **81%**         | **87%**           |

## Scripts

```bash
# Run coverage
npm run test:coverage

# Generate HTML report
npm run coverage:report
```

## Notes

- c8 is installed and configured
- Coverage baseline established
- See individual module metrics above
