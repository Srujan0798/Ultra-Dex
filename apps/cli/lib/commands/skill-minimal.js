/**
 * Minimal Skill command for Ultra-Dex CLI
 */

export function registerSkillMinimalCommand(targetProgram) {
  const skillCmd = targetProgram
    .command('skill-minimal [skillId]')
    .description('Minimal skill command test');

  skillCmd.option('-l, --list', 'List all available skills').action(async (skillId, options) => {
    try {
      console.log('🧪 Minimal skill command test...');

      if (options.list) {
        console.log('📋 Available Skills:');
        console.log('  /code-review - Code Review');
        console.log('  /sql-queries - SQL Queries');
        console.log('  /debug - Debug');
        console.log('🎯 Total skills: 3');
        return;
      }

      console.log('🚀 Skill command ready');
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  });
}
