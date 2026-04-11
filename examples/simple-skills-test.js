/**
 * Simple Skills Test
 * Tests the skills system without full UltraDexCore initialization
 */

import { SkillsAPI, initializeSkills } from '../src/core/skills/index.js';

async function testSkills() {
  console.log('🧪 Simple Skills Test\n');

  try {
    // Initialize the skills system
    initializeSkills();

    // Create Skills API
    const skillsAPI = new SkillsAPI();

    console.log('✅ Skills system initialized\n');

    // Test: List all skills
    console.log('📋 Available Skills:');
    const skills = skillsAPI.list();
    skills.forEach((skill) => {
      console.log(`  • ${skill.id} - ${skill.name} (${skill.category})`);
    });

    console.log(`\n🎯 Total skills: ${skills.length}\n`);

    // Test: Skills by category
    console.log('🏗️  Engineering Skills:');
    const engineeringSkills = skillsAPI.findByCategory('engineering');
    engineeringSkills.forEach((skill) => {
      console.log(`  • ${skill.id} - ${skill.name}`);
    });

    console.log('\n📊 Data Skills:');
    const dataSkills = skillsAPI.findByCategory('data');
    dataSkills.forEach((skill) => {
      console.log(`  • ${skill.id} - ${skill.name}`);
    });

    console.log('\n💰 Sales Skills:');
    const salesSkills = skillsAPI.findByCategory('sales');
    salesSkills.forEach((skill) => {
      console.log(`  • ${skill.id} - ${skill.name}`);
    });

    console.log('\n📈 Product Management Skills:');
    const productSkills = skillsAPI.findByCategory('product');
    productSkills.forEach((skill) => {
      console.log(`  • ${skill.id} - ${skill.name}`);
    });

    // Test: Check individual skill definitions
    console.log('\n🔍 Skill Details:');
    const codeReviewSkill = skillsAPI.get('/code-review');
    if (codeReviewSkill) {
      console.log(`  • Code Review: ${codeReviewSkill.description}`);
    }

    const sqlSkill = skillsAPI.get('/sql-queries');
    if (sqlSkill) {
      console.log(`  • SQL Queries: ${sqlSkill.description}`);
    }

    // Test: Skill exists
    console.log('\n✅ Skill existence checks:');
    console.log(`  • /code-review: ${skillsAPI.has('/code-review')}`);
    console.log(`  • /architecture: ${skillsAPI.has('/architecture')}`);
    console.log(`  • /non-existent: ${skillsAPI.has('/non-existent')}`);

    console.log('\n🎉 Skills system test completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`  • Total skills: ${skills.length}`);
    console.log(`  • Engineering: ${engineeringSkills.length}`);
    console.log(`  • Data: ${dataSkills.length}`);
    console.log(`  • Sales: ${salesSkills.length}`);
    console.log(`  • Product: ${productSkills.length}`);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testSkills().catch(console.error);
}

export default testSkills;
