/**
 * Video Tutorial System for Ultra-Dex
 * Provides interactive video tutorials for platform features
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

class VideoTutorialSystem {
  constructor() {
    this.tutorials = [
      {
        id: 'getting-started',
        title: 'Getting Started with Ultra-Dex',
        description: 'Learn the basics of Ultra-Dex and how to set up your first project',
        duration: '8:45',
        url: 'https://example.com/tutorials/getting-started',
        tags: ['beginner', 'setup', 'introduction'],
        level: 'beginner'
      },
      {
        id: 'agent-system',
        title: 'Understanding the Agent System',
        description: 'Deep dive into the specialized agents and how to use them effectively',
        duration: '12:30',
        url: 'https://example.com/tutorials/agent-system',
        tags: ['agents', 'intermediate', 'workflow'],
        level: 'intermediate'
      },
      {
        id: 'ai-integration',
        title: 'AI Provider Integration',
        description: 'Configure and use different AI providers with Ultra-Dex',
        duration: '10:15',
        url: 'https://example.com/tutorials/ai-integration',
        tags: ['ai', 'configuration', 'providers'],
        level: 'intermediate'
      },
      {
        id: 'tool-execution',
        title: 'Tool Execution and Safety',
        description: 'Learn about tool execution, security controls, and best practices',
        duration: '15:20',
        url: 'https://example.com/tutorials/tool-execution',
        tags: ['tools', 'security', 'best-practices'],
        level: 'advanced'
      },
      {
        id: 'multi-agent-swarm',
        title: 'Multi-Agent Swarm Workflows',
        description: 'Coordinate multiple agents for complex development tasks',
        duration: '18:40',
        url: 'https://example.com/tutorials/multi-agent-swarm',
        tags: ['swarm', 'coordination', 'advanced'],
        level: 'advanced'
      }
    ];
  }

  async listTutorials(filter = {}) {
    console.log(chalk.cyan('\n🎥 ULTRA-DEX VIDEO TUTORIALS\n'));
    
    let filteredTutorials = this.tutorials;
    
    if (filter.level) {
      filteredTutorials = filteredTutorials.filter(t => t.level === filter.level);
    }
    
    if (filter.tag) {
      filteredTutorials = filteredTutorials.filter(t => t.tags.includes(filter.tag));
    }
    
    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      filteredTutorials = filteredTutorials.filter(t => 
        t.title.toLowerCase().includes(searchTerm) || 
        t.description.toLowerCase().includes(searchTerm) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }
    
    if (filteredTutorials.length === 0) {
      console.log(chalk.yellow('No tutorials found matching your criteria.'));
      return;
    }
    
    for (const tutorial of filteredTutorials) {
      console.log(`${chalk.green(`🎬 ${tutorial.title}`)}`);
      console.log(`   ${chalk.gray(tutorial.description)}`);
      console.log(`   Duration: ${chalk.blue(tutorial.duration)} | Level: ${this.formatLevel(tutorial.level)} | Tags: ${tutorial.tags.join(', ')}`);
      console.log(`   ${chalk.cyan(`URL: ${tutorial.url}`)}\n`);
    }
  }
  
  formatLevel(level) {
    const colors = {
      'beginner': chalk.green,
      'intermediate': chalk.yellow,
      'advanced': chalk.red
    };
    return colors[level] ? colors[level](level.charAt(0).toUpperCase() + level.slice(1)) : level;
  }
  
  async getTutorialById(id) {
    const tutorial = this.tutorials.find(t => t.id === id);
    if (!tutorial) {
      throw new Error(`Tutorial with ID "${id}" not found`);
    }
    return tutorial;
  }
  
  async getRecommendedTutorials(userProfile) {
    console.log(chalk.cyan('\n🎯 RECOMMENDED FOR YOU\n'));
    
    // Simple recommendation algorithm based on user profile
    let recommendations = [];
    
    if (userProfile && userProfile.experience) {
      if (userProfile.experience === 'beginner') {
        recommendations = this.tutorials.filter(t => t.level === 'beginner');
      } else if (userProfile.experience === 'intermediate') {
        recommendations = this.tutorials.filter(t => t.level === 'intermediate');
      } else {
        recommendations = [...this.tutorials]; // All tutorials for advanced users
      }
    } else {
      recommendations = this.tutorials.slice(0, 3); // Default first 3 tutorials
    }
    
    if (userProfile && userProfile.interests) {
      // Boost tutorials that match user interests
      const interestMap = {
        'code_generation': ['tools', 'ai'],
        'architecture': ['agents', 'swarm'],
        'testing': ['tools', 'security'],
        'security': ['tools', 'security'],
        'collaboration': ['swarm', 'coordination'],
        'automation': ['agents', 'workflow']
      };
      
      recommendations.sort((a, b) => {
        const aMatches = a.tags.filter(tag => 
          userProfile.interests.some(interest => 
            interestMap[interest] && interestMap[interest].includes(tag)
          )
        ).length;
        
        const bMatches = b.tags.filter(tag => 
          userProfile.interests.some(interest => 
            interestMap[interest] && interestMap[interest].includes(tag)
          )
        ).length;
        
        return bMatches - aMatches; // Sort by matches descending
      });
    }
    
    for (const tutorial of recommendations.slice(0, 5)) {
      console.log(`${chalk.green(`🎬 ${tutorial.title}`)}`);
      console.log(`   ${chalk.gray(tutorial.description)}`);
      console.log(`   Duration: ${chalk.blue(tutorial.duration)} | Level: ${this.formatLevel(tutorial.level)}`);
      console.log(`   ${chalk.cyan(`URL: ${tutorial.url}`)}\n`);
    }
  }
  
  async createTutorialPlaylist(tutorialIds, playlistName) {
    const playlistTutorials = [];
    
    for (const id of tutorialIds) {
      try {
        const tutorial = await this.getTutorialById(id);
        playlistTutorials.push(tutorial);
      } catch (error) {
        console.error(chalk.red(`Tutorial with ID "${id}" not found: ${error.message}`));
      }
    }
    
    if (playlistTutorials.length === 0) {
      console.log(chalk.yellow('No valid tutorials found for the playlist.'));
      return;
    }
    
    const playlist = {
      name: playlistName || `My Ultra-Dex Playlist - ${new Date().toISOString().split('T')[0]}`,
      created: new Date().toISOString(),
      tutorials: playlistTutorials,
      totalDuration: this.calculateTotalDuration(playlistTutorials)
    };
    
    // Save playlist to a file
    const playlistPath = path.join(process.cwd(), `${playlist.name.replace(/\s+/g, '_')}.json`);
    await fs.writeFile(playlistPath, JSON.stringify(playlist, null, 2));
    
    console.log(chalk.green(`\n✅ Playlist "${playlist.name}" created successfully!`));
    console.log(chalk.gray(`Saved to: ${playlistPath}`));
    console.log(chalk.blue(`Total duration: ${playlist.totalDuration}`));
    
    return playlist;
  }
  
  calculateTotalDuration(tutorials) {
    let totalSeconds = 0;
    
    for (const tutorial of tutorials) {
      const [minutes, seconds] = tutorial.duration.split(':').map(Number);
      totalSeconds += minutes * 60 + seconds;
    }
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }
  
  async searchTutorials(query) {
    return this.listTutorials({ search: query });
  }
  
  async getTutorialsByLevel(level) {
    return this.listTutorials({ level });
  }
  
  async getTutorialsByTag(tag) {
    return this.listTutorials({ tag });
  }
}

// Export the class
export default VideoTutorialSystem;

// Also provide a convenience function to run the tutorial system
export async function runTutorialSystem(action, options = {}) {
  const system = new VideoTutorialSystem();
  
  switch (action) {
    case 'list':
      await system.listTutorials(options);
      break;
    case 'recommended':
      await system.getRecommendedTutorials(options.profile);
      break;
    case 'search':
      await system.searchTutorials(options.query);
      break;
    case 'by-level':
      await system.getTutorialsByLevel(options.level);
      break;
    case 'by-tag':
      await system.getTutorialsByTag(options.tag);
      break;
    case 'create-playlist':
      await system.createTutorialPlaylist(options.ids, options.name);
      break;
    default:
      console.log(chalk.yellow('Available actions: list, recommended, search, by-level, by-tag, create-playlist'));
  }
}