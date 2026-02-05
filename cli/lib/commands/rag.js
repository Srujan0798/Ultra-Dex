/**
 * Graph RAG Commands
 * CLI commands for Graph RAG operations
 */

import chalk from 'chalk';
import { GraphRAG } from '../lib/rag/graph.js';
import { embeddingsManager } from '../lib/rag/embeddings.js';
import { printInfo, printSuccess, printWarning, printError } from '../lib/utils/output.js';

/**
 * Register RAG commands
 */
export function registerRagCommands(program) {
  const rag = program
    .command('rag')
    .description('Graph RAG operations for context retrieval');

  // Index command
  rag
    .command('index')
    .description('Index codebase into graph database')
    .option('--path <path>', 'Root directory to index', process.cwd())
    .option('--db-type <type>', 'Database type (neo4j|falkordb)', 'neo4j')
    .action(async (options) => {
      try {
        printInfo(chalk.cyan.bold('\n📊 Graph RAG Indexing\n'));

        const graphRAG = new GraphRAG({
          dbType: options.dbType,
          useInMemory: options.dbType === 'memory'
        });

        await graphRAG.initialize();
        const stats = await graphRAG.indexCodebase(options.path);
        
        printSuccess(chalk.green(`\n✅ Indexed ${stats.indexed} files`));
        printInfo(chalk.gray(`   Total files found: ${stats.totalFiles}`));
        
        await graphRAG.close();
      } catch (error) {
        printError(chalk.red('Indexing failed:', error.message));
        process.exit(1);
      }
    });

  // Query command
  rag
    .command('query <query>')
    .description('Query the knowledge graph')
    .option('--db-type <type>', 'Database type', 'neo4j')
    .option('--limit <n>', 'Limit results', '10')
    .action(async (query, options) => {
      try {
        printInfo(chalk.cyan.bold(`\n🔍 Graph Query: "${query}"\n`));

        const graphRAG = new GraphRAG({
          dbType: options.dbType,
          useInMemory: options.dbType === 'memory'
        });

        await graphRAG.initialize();
        const results = await graphRAG.query(query, { 
          limit: parseInt(options.limit) 
        });

        if (results.length === 0) {
          printWarning(chalk.yellow('No results found'));
        } else {
          printInfo(chalk.white(`Found ${results.length} results:\n`));
          results.forEach((result, i) => {
            console.log(chalk.blue(`${i + 1}. ${result.path}`));
            if (result.symbols && result.symbols.length > 0) {
              console.log(chalk.gray(`   Symbols: ${result.symbols.slice(0, 5).join(', ')}`));
            }
          });
        }

        await graphRAG.close();
      } catch (error) {
        printError(chalk.red('Query failed:', error.message));
        process.exit(1);
      }
    });

  // Impact analysis command
  rag
    .command('impact <file>')
    .description('Analyze impact of changing a file')
    .option('--depth <n>', 'Analysis depth', '2')
    .option('--db-type <type>', 'Database type', 'neo4j')
    .action(async (file, options) => {
      try {
        printInfo(chalk.cyan.bold(`\n🎯 Impact Analysis: ${file}\n`));

        const graphRAG = new GraphRAG({
          dbType: options.dbType,
          useInMemory: options.dbType === 'memory'
        });

        await graphRAG.initialize();
        const analysis = await graphRAG.getImpactAnalysis(
          file, 
          parseInt(options.depth)
        );

        const riskColor = analysis.riskLevel === 'high' ? 'red' : 
                         analysis.riskLevel === 'medium' ? 'yellow' : 'green';
        
        printInfo(chalk.white(`Risk Level: ${chalk[riskColor](analysis.riskLevel.toUpperCase())}`));
        printInfo(chalk.gray(`Impacted Files: ${analysis.impactedCount}\n`));

        if (analysis.impactedFiles.length > 0) {
          printInfo(chalk.white('Dependencies:'));
          analysis.impactedFiles.forEach((f, i) => {
            const indent = '  '.repeat(f.distance - 1);
            console.log(chalk.gray(`${indent}${i + 1}. ${f.path}`));
          });
        }

        await graphRAG.close();
      } catch (error) {
        printError(chalk.red('Impact analysis failed:', error.message));
        process.exit(1);
      }
    });

  // Stats command
  rag
    .command('stats')
    .description('Show graph database statistics')
    .option('--db-type <type>', 'Database type', 'neo4j')
    .action(async (options) => {
      try {
        printInfo(chalk.cyan.bold('\n📈 Graph Database Statistics\n'));

        const graphRAG = new GraphRAG({
          dbType: options.dbType,
          useInMemory: options.dbType === 'memory'
        });

        await graphRAG.initialize();
        
        // Get stats from the in-memory graph or database
        if (graphRAG.useInMemory) {
          const nodeCount = graphRAG.inMemoryGraph.size;
          printInfo(chalk.white('Storage: In-Memory'));
          printInfo(chalk.gray(`Indexed Files: ${nodeCount}`));
        } else {
          const { Neo4jConnector } = await import('../lib/rag/neo4j.js');
          const connector = new Neo4jConnector();
          await connector.connect();
          const stats = await connector.getStats();
          
          printInfo(chalk.white('Storage: Neo4j'));
          printInfo(chalk.gray(`Files: ${stats.files}`));
          printInfo(chalk.gray(`Functions: ${stats.functions}`));
          printInfo(chalk.gray(`Classes: ${stats.classes}`));
          printInfo(chalk.gray(`Relationships: ${stats.relationships}`));
          
          await connector.close();
        }

        await graphRAG.close();
      } catch (error) {
        printError(chalk.red('Stats failed:', error.message));
        process.exit(1);
      }
    });

  // Clear command
  rag
    .command('clear')
    .description('Clear all graph data')
    .option('--db-type <type>', 'Database type', 'neo4j')
    .option('--force', 'Skip confirmation')
    .action(async (options) => {
      try {
        if (!options.force) {
          const { confirm } = await import('inquirer');
          const answers = await confirm.prompt([{
            type: 'confirm',
            name: 'clear',
            message: 'Are you sure you want to clear all graph data?',
            default: false
          }]);
          
          if (!answers.clear) {
            printInfo(chalk.yellow('Cancelled'));
            return;
          }
        }

        printInfo(chalk.yellow('\n🗑️  Clearing graph data...\n'));

        const { Neo4jConnector } = await import('../lib/rag/neo4j.js');
        const connector = new Neo4jConnector({
          dbType: options.dbType
        });
        
        await connector.connect();
        await connector.clearAll();
        await connector.close();

        printSuccess(chalk.green('✅ Graph data cleared'));
      } catch (error) {
        printError(chalk.red('Clear failed:', error.message));
        process.exit(1);
      }
    });

  return rag;
}
