/**
 * ultra-dex tutorials command
 * Interactive video tutorial system for users
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import { runTutorialSystem } from '../tutorials/video-system.js';
import VideoTutorialSystem from '../tutorials/video-system.js';

export function registerTutorialsCommand(program) {
  const tutorialsCmd = program
    .command('tutorials')
    .alias('videos')
    .description('Interactive video tutorial system for Ultra-Dex features');

  // List all tutorials
  tutorialsCmd
    .command('list')
    .alias('ls')
    .description('List all available video tutorials')
    .option('--level <level>', 'Filter by difficulty level (beginner, intermediate, advanced)')
    .option('--tag <tag>', 'Filter by tag')
    .option('--search <query>', 'Search tutorials by keyword')
    .action(async (options) => {
      try {
        await runTutorialSystem('list', options);
      } catch (error) {
        logger.error(chalk.red(`Error listing tutorials: ${error.message}`));
      }
    });

  // Show recommended tutorials
  tutorialsCmd
    .command('recommended')
    .alias('recs')
    .description('Show tutorials recommended for your profile')
    .action(async () => {
      try {
        // In a real implementation, this would get user profile data
        // For now, we'll use a mock profile
        const mockProfile = {
          experience: 'beginner',
          interests: ['code_generation', 'automation'],
        };
        await runTutorialSystem('recommended', { profile: mockProfile });
      } catch (error) {
        logger.error(chalk.red(`Error showing recommendations: ${error.message}`));
      }
    });

  // Search tutorials
  tutorialsCmd
    .command('search <query>')
    .description('Search tutorials by keyword')
    .action(async (query) => {
      try {
        await runTutorialSystem('search', { query });
      } catch (error) {
        logger.error(chalk.red(`Error searching tutorials: ${error.message}`));
      }
    });

  // Filter by level
  tutorialsCmd
    .command('by-level <level>')
    .description('Show tutorials by difficulty level')
    .action(async (level) => {
      try {
        await runTutorialSystem('by-level', { level });
      } catch (error) {
        logger.error(chalk.red(`Error filtering by level: ${error.message}`));
      }
    });

  // Filter by tag
  tutorialsCmd
    .command('by-tag <tag>')
    .description('Show tutorials by tag')
    .action(async (tag) => {
      try {
        await runTutorialSystem('by-tag', { tag });
      } catch (error) {
        logger.error(chalk.red(`Error filtering by tag: ${error.message}`));
      }
    });

  // Create a playlist
  tutorialsCmd
    .command('playlist')
    .description('Create a custom tutorial playlist')
    .option('--ids <ids...>', 'Tutorial IDs to include in the playlist')
    .option('--name <name>', 'Name for the playlist')
    .action(async (options) => {
      try {
        if (!options.ids) {
          // Interactive mode to select tutorials
          const system = new VideoTutorialSystem();

          logger.log(chalk.cyan('\n🎯 CREATE CUSTOM TUTORIAL PLAYLIST\n'));

          // Show all tutorials for selection
          const allTutorials = system.tutorials;
          const choices = allTutorials.map((tutorial) => ({
            name: `${tutorial.title} (${tutorial.duration})`,
            value: tutorial.id,
            short: tutorial.title,
          }));

          const { selectedIds } = await inquirer.prompt([
            {
              type: 'checkbox',
              name: 'selectedIds',
              message: chalk.cyan('Select tutorials for your playlist:'),
              choices,
            },
          ]);

          if (selectedIds.length === 0) {
            logger.log(chalk.yellow('No tutorials selected. Playlist creation cancelled.'));
            return;
          }

          const { playlistName } = await inquirer.prompt([
            {
              type: 'input',
              name: 'playlistName',
              message: chalk.cyan('Enter a name for your playlist:'),
              default: `My Ultra-Dex Learning Path - ${new Date().toISOString().split('T')[0]}`,
            },
          ]);

          await runTutorialSystem('create-playlist', {
            ids: selectedIds,
            name: playlistName,
          });
        } else {
          // Use provided IDs
          await runTutorialSystem('create-playlist', {
            ids: options.ids,
            name: options.name,
          });
        }
      } catch (error) {
        logger.error(chalk.red(`Error creating playlist: ${error.message}`));
      }
    });

  // Interactive tutorial selector
  tutorialsCmd
    .command('interactive')
    .alias('i')
    .description('Interactive tutorial selector')
    .action(async () => {
      try {
        const system = new VideoTutorialSystem();

        logger.log(chalk.cyan('\n🎓 ULTRA-DEX INTERACTIVE TUTORIAL SELECTOR\n'));

        const actionChoices = [
          { name: 'Browse All Tutorials', value: 'browse' },
          { name: 'Search Tutorials', value: 'search' },
          { name: 'View by Level', value: 'level' },
          { name: 'View by Topic', value: 'topic' },
          { name: 'Create Playlist', value: 'playlist' },
          { name: 'Show Recommendations', value: 'recommend' },
        ];

        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: chalk.cyan('What would you like to do?'),
            choices: actionChoices,
          },
        ]);

        switch (action) {
          case 'browse':
            await system.listTutorials();
            break;

          case 'search': {
            const { query } = await inquirer.prompt([
              {
                type: 'input',
                name: 'query',
                message: chalk.cyan('Enter search term:'),
                validate: (input) => input.trim().length > 0 || 'Search term is required',
              },
            ]);
            await system.searchTutorials(query);
            break;
          }

          case 'level': {
            const { level } = await inquirer.prompt([
              {
                type: 'list',
                name: 'level',
                message: chalk.cyan('Select difficulty level:'),
                choices: [
                  { name: 'Beginner', value: 'beginner' },
                  { name: 'Intermediate', value: 'intermediate' },
                  { name: 'Advanced', value: 'advanced' },
                ],
              },
            ]);
            await system.getTutorialsByLevel(level);
            break;
          }

          case 'topic': {
            const { topic } = await inquirer.prompt([
              {
                type: 'list',
                name: 'topic',
                message: chalk.cyan('Select topic:'),
                choices: [
                  { name: 'AI Integration', value: 'ai' },
                  { name: 'Agent System', value: 'agents' },
                  { name: 'Tool Execution', value: 'tools' },
                  { name: 'Security', value: 'security' },
                  { name: 'Multi-Agent Swarms', value: 'swarm' },
                ],
              },
            ]);
            await system.getTutorialsByTag(topic);
            break;
          }

          case 'playlist': {
            // Reuse the playlist creation logic from above
            const allTutorials = system.tutorials;
            const choices = allTutorials.map((tutorial) => ({
              name: `${tutorial.title} (${tutorial.duration})`,
              value: tutorial.id,
              short: tutorial.title,
            }));

            const { selectedIds } = await inquirer.prompt([
              {
                type: 'checkbox',
                name: 'selectedIds',
                message: chalk.cyan('Select tutorials for your playlist:'),
                choices,
              },
            ]);

            if (selectedIds.length === 0) {
              logger.log(chalk.yellow('No tutorials selected. Playlist creation cancelled.'));
              return;
            }

            const { playlistName } = await inquirer.prompt([
              {
                type: 'input',
                name: 'playlistName',
                message: chalk.cyan('Enter a name for your playlist:'),
                default: `My Ultra-Dex Learning Path - ${new Date().toISOString().split('T')[0]}`,
              },
            ]);

            await system.createTutorialPlaylist(selectedIds, playlistName);
            break;
          }

          case 'recommend': {
            // Mock profile for recommendations
            const mockProfile = {
              experience: 'beginner',
              interests: ['code_generation', 'automation'],
            };
            await system.getRecommendedTutorials(mockProfile);
            break;
          }
        }
      } catch (error) {
        logger.error(chalk.red(`Error in interactive mode: ${error.message}`));
      }
    });

  // Default action - show interactive selector
  tutorialsCmd.action(async () => {
    try {
      await runTutorialSystem('recommended');
      logger.log(
        chalk.gray(
          '\n💡 Tip: Use "ultra-dex tutorials interactive" for the full tutorial experience'
        )
      );
    } catch (error) {
      logger.error(chalk.red(`Error: ${error.message}`));
    }
  });
}

// Export the tutorial system for direct use
export { VideoTutorialSystem };
