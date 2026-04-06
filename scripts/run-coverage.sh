#!/bin/bash
# Run tests with V8 coverage and generate reports

set -e

rm -rf coverage/tmp coverage/lcov-report
mkdir -p coverage/tmp

echo "Running tests with coverage..."
NODE_V8_COVERAGE=coverage/tmp NODE_ENV=test node --test tests/core/*.test.js tests/integration/*.test.js tests/cli/*.test.js

echo ""
echo "Generating coverage report..."
node scripts/coverage-report.js coverage/tmp

echo ""
echo "Coverage complete!"
echo "  - Text report: above"
echo "  - JSON summary: coverage/coverage-summary.json"
