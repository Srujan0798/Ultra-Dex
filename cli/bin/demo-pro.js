#!/usr/bin/env node

import { renderer } from '../lib/ui/renderer.js';
import { theme } from '../lib/ui/theme.js';

async function runDemo() {
    renderer.clearScreen();

    // 1. Greeting (Streaming)
    await renderer.text("**Welcome to Ultra-Dex Pro.**\nI am your AI Orchestration Partner.");
    await renderer.sleep(500);

    // 2. Thinking State
    renderer.startSpinner('Analyzing project context...');
    await renderer.sleep(2000);
    renderer.succeed('Context loaded: Next.js 15 + Supabase');

    // 3. Simulated Response (Markdown + Streaming)
    await renderer.text(`
I've detected a few areas for optimization in your current setup.

**Key Insights:**
- Your database schema lacks RLS policies.
- API rate limiting is disabled.
- CI/CD pipeline is missing verification steps.
`);

    // 4. Boxed Content (Code/Alert)
    renderer.box(
        "run \"ultra-dex fix --security\" to apply RLS policies automatically.", 
        'Recommendation', 
        'info'
    );

    // 5. Interactive Prompt Simulation
    await renderer.text(`How would you like to proceed?`);
    console.log(`  ${theme.accent('›')} `);
}

runDemo();

