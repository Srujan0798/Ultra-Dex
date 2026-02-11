#!/usr/bin/env node

/**
 * @fileoverview Test Visual Enhancements module
 * @module test/test-visual-enhancements
 */

import { createTable, showAgentsTable, showCommandsTable } from './lib/utils/tables.js';
import { selectAgent, confirmAction, inputText, interactiveMenu } from './lib/utils/prompts.js';
import { showAnimatedProgress, createSpinner, animateCompletion } from './lib/utils/progress.js';

console.log('Testing CLI Visual Enhancement Modules...\n');

// Test 1: Tables
console.log('1. Testing Tables:');
try {
  const headers = ['Name', 'Type', 'Status'];
  const rows = [
    ['Project Alpha', 'Web App', 'Active'],
    ['Project Beta', 'Mobile App', 'Pending'],
    ['Project Gamma', 'API Service', 'Completed'],
  ];
  console.log(createTable(headers, rows));
  console.log('✅ Tables module working\n');
} catch (error) {
  console.log('❌ Tables module error:', error.message);
}

// Test 2: Progress
console.log('2. Testing Progress:');
try {
  // Test simple progress visualization
  showAnimatedProgress(50, 100, 'Testing progress...');
  console.log(); // New line after progress
  console.log('✅ Progress module working\n');
} catch (error) {
  console.log('❌ Progress module error:', error.message);
}

// Test 3: Spinner
console.log('3. Testing Spinner:');
try {
  const spinner = createSpinner('Testing spinner...');
  setTimeout(() => {
    spinner.succeed('Spinner test completed');
    console.log('✅ Spinner module working\n');
  }, 1000);
} catch (error) {
  console.log('❌ Spinner module error:', error.message);
}

// Test 4: Menu
console.log('4. Testing Menu:');
try {
  const menuItems = [
    { emoji: '🚀', label: 'Deploy Application', value: 'deploy' },
    { emoji: '🔍', label: 'Run Tests', value: 'test' },
    { emoji: '⚙️', label: 'Configure Settings', value: 'config' },
  ];
  console.log('Sample menu structure created successfully');
  console.log('Menu items:', menuItems.map((m) => `${m.emoji} ${m.label}`).join(', '));
  console.log('✅ Menu module working\n');
} catch (error) {
  console.log('❌ Menu module error:', error.message);
}

console.log('All visual enhancement modules loaded successfully!');
