/**
 * Skill command for Ultra-Dex CLI
 * Execute Claude plugin skills via CLI
 */

export function registerSkillCommand(targetProgram) {
  const skillCmd = targetProgram
    .command('skill [skillId]')
    .description('Execute a skill (e.g., /code-review, /sql-queries)');

  skillCmd
    .option('-l, --list', 'List all available skills')
    .option('-i, --input <json>', 'JSON input for the skill')
    .option('-f, --file <file>', 'Read input from JSON file')
    .option('-p, --provider <provider>', 'AI provider to use', 'auto')
    .option('-s, --strategy <strategy>', 'Routing strategy', 'quality')
    .option('-c, --code <code>', 'Code to review (for /code-review)')
    .option('--prompt <prompt>', 'Natural language prompt')
    .option('--info', 'Show skill info')
    .action(async (skillId, options) => {
      try {
        const { SkillsAPI, initializeSkills } =
          await import('../../../../src/core/skills/index.ts');

        initializeSkills();
        const skillsAPI = new SkillsAPI();

        if (options.list) {
          const skills = skillsAPI.list();
          console.log('\n📋 Available Skills:');

          const categories = {
            engineering: '🏗️  Engineering',
            data: '📊 Data',
            design: '🎨 Design',
            operations: '📄 PDF Viewer & Operations',
            productivity: '⚡ Product Management & Productivity',
            marketing: '📣 Marketing',
            sales: '💰 Sales',
            legal: '⚖️  Legal',
            finance: '💵 Finance',
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
          return;
        }

        if (options.info) {
          if (!skillId) {
            console.error('❌ Please specify a skill ID with --info');
            return;
          }

          const skill = skillsAPI.get(skillId);
          if (!skill) {
            console.error(`❌ Skill not found: ${skillId}`);
            return;
          }

          console.log(`\n📖 Skill: ${skill.name}`);
          console.log(`ID: ${skill.id}`);
          console.log(`Description: ${skill.description}`);
          console.log(`Category: ${skill.category}`);
          console.log(`Agent: ${skill.agent.id}`);
          console.log(`Best Providers: ${skill.routing.providerPriority.join(', ')}`);
          return;
        }

        if (!skillId) {
          console.error('❌ Please specify a skill ID or use --list to see available skills');
          return;
        }

        if (!skillsAPI.has(skillId)) {
          console.error(`❌ Unknown skill: ${skillId}`);
          console.log(`Run 'ultra-dex skill --list' to see available skills.`);
          return;
        }

        console.log(`\n🚀 Skill command ready for: ${skillId}`);
        console.log('💡 Note: Full execution requires UltraDexCore initialization');
        console.log('   For now, use --list or --info options');
      } catch (error) {
        console.error('❌ Error:', error.message);
      }
    });
}
