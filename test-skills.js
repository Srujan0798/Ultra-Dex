#!/usr/bin/env node

/**
 * Standalone test script for Ultra-Dex Skills System
 */

console.log('🧪 Testing Ultra-Dex Skills System...');

// Test if we can import skills
console.log('🔍 Testing skills import...');
try {
  const { SkillsAPI, initializeSkills } = await import('./src/core/skills/index.ts');
  console.log('✅ SkillsAPI imported successfully');

  console.log('🔧 Initializing skills...');
  initializeSkills();
  console.log('✅ Skills initialized');

  const api = new SkillsAPI();
  console.log('✅ SkillsAPI instance created');

  const skills = api.list();
  console.log(`✅ Found ${skills.length} skills`);

  // Group by category
  const categories = {};
  skills.forEach((skill) => {
    if (!categories[skill.category]) {
      categories[skill.category] = [];
    }
    categories[skill.category].push(skill);
  });

  console.log('\n📋 Skills by Category:');
  Object.entries(categories).forEach(([category, skills]) => {
    console.log(`\n${category.toUpperCase()}:`);
    skills.forEach((skill) => {
      console.log(`  ${skill.id.padEnd(25)} - ${skill.name}`);
    });
  });

  console.log(`\n🎯 Total skills: ${skills.length}`);
} catch (error) {
  console.error('❌ Failed to import skills:', error.message);
  console.error('Stack:', error.stack);
}

console.log('\n🏁 Test completed');
