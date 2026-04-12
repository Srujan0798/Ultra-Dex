#!/usr/bin/env node

/**
 * Minimal test for CLI skill command
 */

console.log('🧪 Testing CLI skill command...');

// Simulate what the CLI command does
async function testSkillCommand() {
  try {
    console.log('🔄 Step 1: Importing skills...');
    const { SkillsAPI, initializeSkills } = await import('./src/core/skills/index.ts');
    console.log('✅ Skills imported');

    console.log('🔄 Step 2: Initializing skills...');
    initializeSkills();
    console.log('✅ Skills initialized');

    console.log('🔄 Step 3: Creating SkillsAPI...');
    const skillsAPI = new SkillsAPI();
    console.log('✅ SkillsAPI created');

    console.log('🔄 Step 4: Listing skills...');
    const skills = skillsAPI.list();
    console.log(`✅ Found ${skills.length} skills`);

    console.log('\n📋 Available Skills:');
    const categories = {
      engineering: '🏗️  Engineering Skills',
      data: '📊 Data Skills',
      sales: '💰 Sales Skills',
      product: '📈 Product Management Skills',
      'customer-support': '🎯 Customer Support Skills',
      finance: '💰 Finance Skills',
      productivity: '⚡ Productivity Skills',
      operations: '⚙️  Operations Skills',
      marketing: '📣 Marketing Skills',
      design: '🎨 Design Skills',
    };

    Object.entries(categories).forEach(([category, label]) => {
      const categorySkills = skills.filter((s) => s.category === category);
      if (categorySkills.length > 0) {
        console.log(`\n${label}:`);
        categorySkills.forEach((s) => {
          console.log(`  ${s.id.padEnd(20)} - ${s.name}`);
        });
      }
    });

    console.log(`\n🎯 Total skills: ${skills.length}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testSkillCommand().then(() => {
  console.log('🏁 Test completed');
});
