// Simple test for skills system
import { SkillsAPI, initializeSkills } from './src/core/skills/index.js';

console.log('Testing skills system...');

initializeSkills();
const skillsAPI = new SkillsAPI();

console.log('✅ Skills system initialized');

const skills = skillsAPI.list();
console.log(`Found ${skills.length} skills`);

console.log('Done!');
