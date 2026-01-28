// cli/lib/commands/diff.js
import chalk from 'chalk';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { loadConfig } from './config.js';

const STATUS = {
  DONE: 'done',
  PARTIAL: 'partial',
  MISSING: 'missing'
};

export function diffCommand(options) {
  if (!options.json) {
    console.log(chalk.cyan.bold('\n📊 Ultra-Dex Diff - Plan vs Code v3.0\n'));
  }

  const planPath = join(process.cwd(), 'IMPLEMENTATION-PLAN.md');
  if (!existsSync(planPath)) {
    if (options.json) {
      console.log(JSON.stringify({ error: 'No IMPLEMENTATION-PLAN.md found', sections: [], alignment: 0 }));
    } else {
      console.log(chalk.red('No IMPLEMENTATION-PLAN.md found'));
    }
    return;
  }

  const plan = readFileSync(planPath, 'utf-8');
  
  // Extract planned sections
  const plannedSections = extractSections(plan);
  
  if (plannedSections.length === 0) {
    if (options.json) {
      console.log(JSON.stringify({ error: 'No sections found', sections: [], alignment: 0 }));
    } else {
      console.log(chalk.yellow('No sections found in IMPLEMENTATION-PLAN.md (looking for ## or ### headings)'));
    }
    return;
  }

  // Check implementation status
  const config = loadConfig();
  const results = checkImplementationStatus(plannedSections, config);
  
  // Calculate alignment
  const doneCount = results.filter(r => r.status === STATUS.DONE).length;
  const partialCount = results.filter(r => r.status === STATUS.PARTIAL).length;
  const missingCount = results.filter(r => r.status === STATUS.MISSING).length;
  const alignment = Math.round(((doneCount + partialCount * 0.5) / results.length) * 100);

  if (options.json) {
    console.log(JSON.stringify({
      alignment,
      totalSections: results.length,
      done: doneCount,
      partial: partialCount,
      missing: missingCount,
      sections: results.map(r => ({
        title: r.title,
        status: r.status,
        matches: r.matches
      }))
    }, null, 2));
    return;
  }

  // Color output
  console.log(chalk.white.bold('Planned vs Implemented:\n'));
  
  results.forEach(({ title, status, matches }) => {
    let icon, color;
    switch (status) {
      case STATUS.DONE:
        icon = '✅';
        color = 'green';
        break;
      case STATUS.PARTIAL:
        icon = '⚠️';
        color = 'yellow';
        break;
      case STATUS.MISSING:
        icon = '❌';
        color = 'red';
        break;
    }
    console.log(`  ${icon} ${chalk[color](title)}`);
    if (matches && matches.length > 0 && status !== STATUS.MISSING) {
      matches.slice(0, 2).forEach(m => {
        console.log(chalk.gray(`      → ${m}`));
      });
    }
  });
  
  // Summary
  console.log(chalk.white.bold('\n─────────────────────────────────────'));
  const alignColor = alignment >= 80 ? 'green' : alignment >= 50 ? 'yellow' : 'red';
  console.log(chalk[alignColor].bold(`Alignment: ${alignment}%`));
  console.log(chalk.gray(`  ${chalk.green(`Done: ${doneCount}`)} | ${chalk.yellow(`Partial: ${partialCount}`)} | ${chalk.red(`Missing: ${missingCount}`)}`));
}

function extractSections(plan) {
  const sections = [];
  const lines = plan.split('\n');
  let currentSection = null;
  let sectionContent = [];
  
  lines.forEach(line => {
    const headingMatch = line.match(/^(#{2,3})\s+(.+)$/);
    if (headingMatch) {
      if (currentSection) {
        sections.push({
          level: currentSection.level,
          title: currentSection.title,
          content: sectionContent.join('\n'),
          keywords: extractKeywords(currentSection.title, sectionContent.join('\n'))
        });
      }
      currentSection = {
        level: headingMatch[1].length,
        title: headingMatch[2].trim()
      };
      sectionContent = [];
    } else if (currentSection) {
      sectionContent.push(line);
    }
  });
  
  if (currentSection) {
    sections.push({
      level: currentSection.level,
      title: currentSection.title,
      content: sectionContent.join('\n'),
      keywords: extractKeywords(currentSection.title, sectionContent.join('\n'))
    });
  }
  
  return sections;
}

function extractKeywords(title, content) {
  const combined = `${title} ${content}`.toLowerCase();
  const words = combined.match(/\b[a-z][a-z0-9]+\b/g) || [];
  
  // Filter common words and keep meaningful ones
  const stopwords = new Set(['the', 'and', 'for', 'with', 'this', 'that', 'from', 'will', 'have', 'has', 'are', 'was', 'were', 'been', 'being', 'would', 'could', 'should', 'can', 'may', 'might', 'must', 'shall', 'need', 'use', 'used', 'using', 'make', 'made', 'get', 'set', 'add', 'new', 'each', 'all', 'any', 'some', 'one', 'two']);
  
  return [...new Set(words.filter(w => w.length > 3 && !stopwords.has(w)))];
}

function checkImplementationStatus(sections, config = {}) {
  // Use configured directories or fallback to defaults
  const searchDirs = config.includeDirs || [config.srcDir || (
                 existsSync(join(process.cwd(), 'src')) ? 'src' : 
                 existsSync(join(process.cwd(), 'app')) ? 'app' :
                 existsSync(join(process.cwd(), 'lib')) ? 'lib' : null
  )].filter(Boolean);
  
  return sections.map(section => {
    const { keywords } = section;
    const matches = [];
    let matchCount = 0;
    
    if (searchDirs.length > 0 && keywords.length > 0) {
      // Search codebase for keywords
      for (const keyword of keywords.slice(0, 5)) {
        for (const dir of searchDirs) {
          try {
            const result = execSync(`grep -ril "${keyword}" ${dir} 2>/dev/null || true`, {
              encoding: 'utf-8',
              maxBuffer: 1024 * 1024
            }).trim();
            
            if (result) {
              const files = result.split('\n').filter(Boolean);
              if (files.length > 0) {
                matchCount++;
                matches.push(...files.slice(0, 2).map(f => f.replace(process.cwd() + '/', '')));
              }
            }
          } catch (e) {
            // grep failed, continue
          }
        }
      }
    }
    
    // Also check for matching file names
    for (const dir of searchDirs) {
      if (!existsSync(join(process.cwd(), dir))) continue;
      try {
        const files = readdirSync(join(process.cwd(), dir), { recursive: true });
        const titleWords = section.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        titleWords.forEach(word => {
          const matchingFiles = files.filter(f => f.toLowerCase().includes(word));
          if (matchingFiles.length > 0) {
            matchCount++;
            matches.push(...matchingFiles.slice(0, 2).map(f => `${dir}/${f}`));
          }
        });
      } catch (e) {
        // Error reading dir
      }
    }
    
    // Determine status based on matches
    const uniqueMatches = [...new Set(matches)];
    let status;
    if (matchCount >= 2 || uniqueMatches.length >= 2) {
      status = STATUS.DONE;
    } else if (matchCount > 0 || uniqueMatches.length > 0) {
      status = STATUS.PARTIAL;
    } else {
      status = STATUS.MISSING;
    }
    
    return {
      title: section.title,
      status,
      matches: uniqueMatches.slice(0, 3)
    };
  });
}

function searchInCode(keyword, dir) {
  try {
    const files = readdirSync(join(process.cwd(), dir), { recursive: true });
    return files.some(f => f.toLowerCase().includes(keyword));
  } catch (e) {
    return false;
  }
}
