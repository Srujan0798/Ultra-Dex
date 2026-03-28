#!/bin/bash
# Run test with global node_modules
NODE_PATH=$(npm root -g) node test-nvidia-api.js
