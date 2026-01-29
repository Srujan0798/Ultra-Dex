import gradient from 'gradient-string';
import boxen from 'boxen';
import chalk from 'chalk';

// --- Colors & Gradients ---
const doomsdayGradient = gradient(['#dc2626', '#7c3aed', '#ec4899']);
const infinityGradient = gradient(['#fbbf24', '#f59e0b', '#dc2626']);

// --- Banner ---
const epicBanner = `
██╗   ██╗██╗  ████████╗██████╗  █████╗       ██████╗ ███████╗██╗  ██╗
██║   ██║██║  ╚══██╔══╝██╔══██╗██╔══██╗      ██╔══██╗██╔════╝╚██╗██╔╝
██║   ██║██║     ██║   ██████╔╝███████║█████╗██║  ██║█████╗   ╚███╔╝ 
██║   ██║██║     ██║   ██╔══██╗██╔══██║╚════╝██║  ██║██╔══╝   ██╔██╗ 
╚██████╔╝███████╗██║   ██║  ██║██║  ██║      ██████╔╝███████╗██╔╝ ██╗
 ╚═════╝ ╚══════╝╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝      ╚═════╝ ╚══════╝╚═╝  ╚═╝`;

const infinityGauntlet = `
    ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
    ┃   ⟐  POWER  ⟐  SPACE  ⟐  REALITY  ⟐     ┃
    ┃   ⟐  SOUL   ⟐  TIME   ⟐   MIND    ⟐     ┃
    ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

export function showBanner(version = '3.1.0') {
  console.log(doomsdayGradient(epicBanner));
  console.log(infinityGradient(infinityGauntlet));
  console.log('');
  console.log(boxen(
    `${chalk.hex('#dc2626').bold('⚡ DOOMSDAY EDITION ⚡')}\n\n` +
    `${chalk.hex('#7c3aed')('The Multiverse of Code has a new defender')}\n\n` +
    `${chalk.hex('#fbbf24')('v' + version)} • ${chalk.dim('Snap your fingers... ship to production')}`,
    {
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      borderColor: '#dc2626',
      title: '🔥 ULTRA-DEX',
      titleAlignment: 'center'
    }
  ));
}

// --- Status Icons ---
export const stones = {
  power: chalk.hex('#ec4899')('◆'),
  space: chalk.hex('#3b82f6')('◆'),
  reality: chalk.hex('#ef4444')('◆'),
  soul: chalk.hex('#f97316')('◆'),
  time: chalk.hex('#22c55e')('◆'),
  mind: chalk.hex('#eab308')('◆')
};

export const icons = {
  success: chalk.hex('#22c55e')('✦'),
  error: chalk.hex('#dc2626')('✖'),
  warning: chalk.hex('#eab308')('⚠'),
  info: chalk.hex('#3b82f6')('ℹ'),
  running: chalk.hex('#ec4899')('⟳'),
  complete: chalk.hex('#fbbf24')('★'),
  snap: chalk.hex('#7c3aed')('✵')
};

export function showInfinityStatus() {
  console.log('');
  console.log(`  ${stones.power} Power    ${stones.space} Space    ${stones.reality} Reality`);
  console.log(`  ${stones.soul} Soul     ${stones.time} Time     ${stones.mind} Mind`);
  console.log('');
}

// --- Agents ---
export const avengersAgents = {
  cto: { name: 'IRON MAN', emoji: '🤖', tagline: 'I am the architecture' },
  planner: { name: 'NICK FURY', emoji: '👁️', tagline: 'I have a plan' },
  research: { name: 'JARVIS', emoji: '🤖', tagline: 'Running analysis, sir' },
  backend: { name: 'THOR', emoji: '⚡', tagline: 'Bring me the API!' },
  frontend: { name: 'SPIDER-MAN', emoji: '🕷️', tagline: 'Web development, literally' },
  database: { name: 'VISION', emoji: '💎', tagline: 'Data... must be preserved' },
  auth: { name: 'BLACK PANTHER', emoji: '🐆', tagline: 'Wakanda authenticates forever' },
  security: { name: 'CAPTAIN AMERICA', emoji: '🛡️', tagline: 'I can do this all day' },
  devops: { name: 'WAR MACHINE', emoji: '🚀', tagline: 'Deploy the payload' },
  testing: { name: 'ANT-MAN', emoji: '🐜', tagline: 'Testing at every scale' },
  documentation: { name: 'BRUCE BANNER', emoji: '🧑‍🔬', tagline: 'Document everything... carefully' },
  reviewer: { name: 'DOCTOR STRANGE', emoji: '🔮', tagline: 'I see 14 million code paths' },
  debugger: { name: 'HAWKEYE', emoji: '🎯', tagline: 'I never miss a bug' },
  performance: { name: 'QUICKSILVER', emoji: '💨', tagline: 'You didnt see that benchmark?' },
  refactoring: { name: 'SCARLET WITCH', emoji: '🔴', tagline: 'Reality can be whatever I refactor' }
};

// --- Progress ---
export function thanoSnap(tasks) {
  const total = tasks.length;
  let complete = 0;
  
  console.log('');
  console.log(chalk.hex('#7c3aed').bold('  ✵ INITIATING THE SNAP...'));
  console.log('');
  
  tasks.forEach((task, idx) => {
    const stones = ['◆', '◆', '◆', '◆', '◆', '◆'];
    const colors = ['#ec4899', '#3b82f6', '#ef4444', '#f97316', '#22c55e', '#eab308'];
    
    // Light up stones as progress
    let stoneDisplay = stones.map((s, i) => {
      if (i <= Math.floor((idx / total) * 6)) {
        return chalk.hex(colors[i])(s);
      }
      return chalk.dim(s);
    }).join(' ');
    
    console.log(`  ${stoneDisplay}  ${chalk.dim(task)}`);
  });
  
  console.log('');
  console.log(chalk.hex('#fbbf24').bold('  ★ PERFECTLY BALANCED, AS ALL CODE SHOULD BE.'));
  console.log('');
}

export function dustEffect() {
  const particles = ['░', '▒', '▓', '█'];
  console.log(chalk.hex('#7c3aed')('  ' + particles.map(p => p.repeat(10)).join('')));
}

// --- Help ---
export function showHelp() {
  console.log('');
  console.log(doomsdayGradient('  ═══════════════════════════════════════════════'));
  console.log(doomsdayGradient('  ║        U L T R A - D E X  :  D O O M S D A Y'));
  console.log(doomsdayGradient('  ═══════════════════════════════════════════════'));
  console.log('');
  
  const sections = [
    {
      title: '⚡ ASSEMBLE THE CODE',
      commands:
        [
          ['init', 'Initialize new universe'],
          ['generate', 'Create the plan (Thanos style)'],
          ['swarm', 'Assemble the Avengers']
        ]
    },
    {
      title: '🛡️ DEFEND THE REALM',
      commands:
        [
          ['review', 'Doctor Strange code review'],
          ['validate', 'Shield integrity check'],
          ['hooks', 'Deploy perimeter defenses']
        ]
    },
    {
      title: '💎 HARNESS INFINITY',
      commands:
        [
          ['serve', 'Open the multiverse portal'],
          ['dashboard', 'Monitor all realities'],
          ['agents', 'Summon your heroes']
        ]
    },
    {
      title: '✵ THE SNAP',
      commands:
        [
          ['build', 'Snap to production'],
          ['deploy', 'Across all multiverses'],
          ['doctor', 'Reality stone diagnostics']
        ]
    }
  ];
  
  sections.forEach(section => {
    console.log(`  ${chalk.hex('#dc2626').bold(section.title)}`);
    section.commands.forEach(([cmd, desc]) => {
      console.log(`    ${chalk.hex('#fbbf24')(cmd.padEnd(16))} ${chalk.dim(desc)}`);
    });
    console.log('');
  });
  
  console.log(chalk.dim('  "With great CLI comes great responsibility."'));
  console.log('');
}

// --- Swarm ---
export function showSwarmAssemble(agents) {
  console.log('');
  console.log(chalk.hex('#dc2626').bold('  ⚡ A V E N G E R S . . . A S S E M B L E ! ⚡'));
  console.log('');
  
  agents.forEach((agent, idx) => {
    const avenger = avengersAgents[agent.name] || { name: agent.name.toUpperCase(), emoji: '⚡', tagline: 'Ready for action' };
    setTimeout(() => {
      console.log(`  ${avenger.emoji} ${chalk.hex('#fbbf24').bold(avenger.name)}`);
      console.log(`     ${chalk.dim('"' + avenger.tagline + '"')}`);
      console.log('');
    }, idx * 500);
  });
}

// --- Messages ---
export const epicMessages = {
  start: [
    "The Multiverse awaits your command...",
    "Reality Stone: Online. Let's bend some code.",
    "Tony Stark: 'Part of the journey is the end... of bugs.'",
    "Whatever it takes to ship this feature."
  ],
  success: [
    "★ Perfectly balanced, as all code should be.",
    "⚡ This... does put a smile on my face.",
    "🛡️ Avengers assembled. Mission complete.",
    "💎 Inevitable. Just like your deployment."
  ],
  error: [
    "Reality is often disappointing... but this error is fixable.",
    "I am... not impressed by this stack trace.",
    "Mr. Stark, I don't feel so good about this bug...",
    "The hardest errors require the strongest debuggers."
  ],
  loading: [
    "Opening multiverse portal...",
    "Charging Infinity Stones...",
    "Summoning the Avengers...",
    "Snapping fingers metaphorically..."
  ]
};

export function getRandomMessage(type) {
  const messages = epicMessages[type] || epicMessages.start;
  return messages[Math.floor(Math.random() * messages.length)];
}