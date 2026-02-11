// Copyright (c) 2026 Ultra-Dex
// Predictive Debugging CLI Command

import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { glob } from 'glob';
import { PredictiveDebugger } from '../predictive/debugger.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';

/**
 * Register the predict command
 */
export function registerPredictCommand(program) {
    program
        .command('predict [path]')
        .description('Run predictive debugging analysis to detect potential bugs')
        .option('--watch', 'Enable continuous background analysis')
        .option('--interval <ms>', 'Analysis interval in milliseconds', '30000')
        .option('--json', 'Output as JSON')
        .action(async (targetPath, options) => {
            await runPredictCommand(targetPath || '.', options);
        });
}

/**
 * Main predict command logic
 */
async function runPredictCommand(targetPath, options) {
    printInfo('\n🔮 Ultra-Dex Predictive Debugging\n');

    const spinner = ora('Scanning files for analysis...').start();

    try {
        // Find all source files
        const patterns = [
            '**/*.js',
            '**/*.ts',
            '**/*.jsx',
            '**/*.tsx',
            '!**/node_modules/**',
            '!**/dist/**',
            '!**/build/**',
            '!**/.git/**'
        ];

        const files = await glob(patterns, {
            cwd: path.resolve(targetPath),
            absolute: true
        });

        spinner.text = `Found ${files.length} files to analyze`;

        // Create debugger instance
        const debugger_ = new PredictiveDebugger({
            analysisInterval: parseInt(options.interval)
        });

        // Add files to watch
        files.forEach(file => debugger_.watch(file));

        // Run analysis
        spinner.text = 'Running predictive analysis...';
        const analysis = await debugger_.analyze();

        spinner.succeed(`Analysis complete: ${analysis.predictions.length} findings`);

        if (options.json) {
            console.log(JSON.stringify(analysis, null, 2));
            return;
        }

        // Display results
        displayResults(analysis);

        // If watch mode, start continuous analysis
        if (options.watch) {
            printInfo('\n👁️ Watch mode enabled. Press Ctrl+C to stop.\n');

            debugger_.on('analysis:complete', (result) => {
                console.clear();
                displayResults(result);
            });

            debugger_.start();

            // Keep process alive
            await new Promise(() => { });
        }

    } catch (error) {
        spinner.fail('Analysis failed');
        printError(error.message);
        process.exit(1);
    }
}

/**
 * Display analysis results
 */
function displayResults(analysis) {
    const { predictions, confidence } = analysis;

    console.log(chalk.bold('\n📊 Analysis Results\n'));
    console.log(chalk.gray(`Confidence: ${(confidence * 100).toFixed(1)}%`));
    console.log(chalk.gray(`Timestamp: ${new Date(analysis.timestamp).toLocaleString()}`));
    console.log('');

    if (predictions.length === 0) {
        printSuccess('✨ No potential issues detected!');
        return;
    }

    // Group by risk level
    const critical = predictions.filter(p => p.riskLevel === 'critical');
    const high = predictions.filter(p => p.riskLevel === 'high');
    const medium = predictions.filter(p => p.riskLevel === 'medium');
    const low = predictions.filter(p => p.riskLevel === 'low');

    if (critical.length > 0) {
        console.log(chalk.red.bold(`🔴 CRITICAL (${critical.length})`));
        critical.forEach(p => {
            console.log(chalk.red(`   • ${p.message}`));
            console.log(chalk.gray(`     ${path.basename(p.file)}`));
        });
        console.log('');
    }

    if (high.length > 0) {
        console.log(chalk.yellow.bold(`🟠 HIGH (${high.length})`));
        high.forEach(p => {
            console.log(chalk.yellow(`   • ${p.message}`));
            console.log(chalk.gray(`     ${path.basename(p.file)}`));
        });
        console.log('');
    }

    if (medium.length > 0) {
        console.log(chalk.blue.bold(`🟡 MEDIUM (${medium.length})`));
        medium.forEach(p => {
            console.log(chalk.blue(`   • ${p.message}`));
            console.log(chalk.gray(`     ${path.basename(p.file)}`));
        });
        console.log('');
    }

    if (low.length > 0) {
        console.log(chalk.gray.bold(`⚪ LOW (${low.length})`));
        low.forEach(p => {
            console.log(chalk.gray(`   • ${p.message}`));
            console.log(chalk.dim(`     ${path.basename(p.file)}`));
        });
        console.log('');
    }

    // Summary
    console.log(chalk.bold('\n📈 Summary'));
    console.log(`   Total findings: ${predictions.length}`);
    console.log(`   Critical: ${critical.length} | High: ${high.length} | Medium: ${medium.length} | Low: ${low.length}`);
    console.log('');
}

export default registerPredictCommand;
