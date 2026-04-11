/**
 * Simplest Skill command for Ultra-Dex CLI
 */

export function registerSkillSimplestCommand(targetProgram) {
  targetProgram
    .command('skill-simplest')
    .description('Simplest skill command')
    .action(() => {
      console.log('✅ Simplest command works!');
    });
}
