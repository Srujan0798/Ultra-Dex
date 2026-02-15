const fs = require('fs');
const path = require('path');
const readline = require('readline');

const tutorialData = require('./tutorial-data.json');

class InteractiveTutorial {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.currentStep = 0;
  }

  async start() {
    console.log(`\x1b[36m${tutorialData.title}\x1b[0m`);
    console.log(`${tutorialData.description}`);
    console.log(`Estimated duration: ${tutorialData.estimated_duration}`);
    console.log('');

    const confirm = await this.askQuestion(`Start the tutorial? (y/N): `);
    if (!confirm.toLowerCase().startsWith('y')) {
      console.log('Tutorial cancelled.');
      return;
    }

    console.log('');
    
    for (this.currentStep = 0; this.currentStep < tutorialData.steps.length; this.currentStep++) {
      await this.showStep(tutorialData.steps[this.currentStep]);
      
      if (this.currentStep < tutorialData.steps.length - 1) {
        await this.askQuestion('Press Enter to continue to the next step...');
        console.log('');
      }
    }

    console.log('\x1b[32m🎉 Congratulations! You have completed the Ultra-Dex tutorial.\x1b[0m');
    console.log('Continue exploring Ultra-Dex with advanced features!');
    this.rl.close();
  }

  async showStep(step) {
    console.log(`\x1b[33mStep ${step.id}/${tutorialData.steps.length}: ${step.title}\x1b[0m`);
    console.log(step.description);
    console.log('');
    
    if (step.explanation) {
      console.log(`💡 \x1b[36mExplanation:\x1b[0m ${step.explanation}`);
    }
    
    if (step.command) {
      console.log(`💻 \x1b[36mCommand:\x1b[0m \x1b[35m${step.command}\x1b[0m`);
    }
    
    if (step.challenge) {
      console.log(`🎯 \x1b[36mChallenge:\x1b[0m ${step.challenge}`);
      
      // If there's a command, suggest running it
      if (step.command) {
        const runCommand = await this.askQuestion(`Would you like to run this command now? (y/N): `);
        if (runCommand.toLowerCase().startsWith('y')) {
          await this.executeCommand(step.command);
        }
      }
    }
    
    console.log('');
  }

  async executeCommand(command) {
    console.log(`\x1b[33mExecuting:\x1b[0m ${command}`);
    console.log('--- OUTPUT ---');
    
    try {
      const { spawn } = require('child_process');
      const [cmd, ...args] = command.split(' ');
      
      const child = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] });
      
      // Capture output
      let output = '';
      child.stdout.on('data', (data) => {
        output += data.toString();
        process.stdout.write(data);
      });
      
      child.stderr.on('data', (data) => {
        process.stderr.write(data);
      });
      
      await new Promise((resolve) => {
        child.on('close', (code) => {
          console.log('--- END OUTPUT ---');
          if (code !== 0) {
            console.log(`\x1b[31mCommand failed with exit code ${code}\x1b[0m`);
          }
          resolve();
        });
      });
    } catch (error) {
      console.log(`\x1b[31mError executing command: ${error.message}\x1b[0m`);
    }
  }

  askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }
}

async function runTutorial() {
  const tutorial = new InteractiveTutorial();
  await tutorial.start();
}

module.exports = { runTutorial };

// If this file is run directly
if (require.main === module) {
  runTutorial();
}