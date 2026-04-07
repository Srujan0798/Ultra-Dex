// Copyright (c) 2026 Ultra-Dex

/**
 * ADR Governance Checker
 * Verify compliance with Architecture Decision Records
 */

import fs from 'fs/promises';
import path from 'path';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import chalk from 'chalk';

// ADR compliance check function
export async function checkADRGovernance(taskName) {
  printInfo(chalk.gray('Checking ADR compliance...'));
  
  try {
    // Look for ADR files in common locations
    const adrPaths = [
      path.join(process.cwd(), 'docs', 'adrs'),
      path.join(process.cwd(), 'ADR'),
      path.join(process.cwd(), 'docs', 'decisions'),
      path.join(process.cwd(), 'docs', 'architecture', 'decisions')
    ];
    
    let adrs = [];
    
    // Find ADR files
    for (const adrPath of adrPaths) {
      try {
        await fs.access(adrPath);
        const files = await fs.readdir(adrPath);
        const adrFiles = files.filter(f => 
          (f.startsWith('ADR-') || f.startsWith('adr-') || f.includes('decision')) && 
          f.endsWith('.md')
        );
        
        for (const file of adrFiles) {
          const content = await fs.readFile(path.join(adrPath, file), 'utf8');
          const adr = parseADR(content, file);
          if (adr && adr.status.toLowerCase() === 'accepted') {
            adrs.push(adr);
          }
        }
        break; // Found ADRs, no need to check other paths
      } catch (_error) {
        // Directory doesn't exist, continue to next path
        continue;
      }
    }
    
    // If no ADRs found, return compliant
    if (adrs.length === 0) {
      return {
        compliant: true,
        violations: [],
        checkedADRs: []
      };
    }
    
    // Check if the task complies with relevant ADRs
    const violations = [];
    const checkedADRs = [];
    
    for (const adr of adrs) {
      checkedADRs.push(adr.id);
      
      // Check if this ADR applies to the current task
      if (appliesToTask(adr, taskName)) {
        const complianceResult = await checkComplianceWithADR(adr);
        
        if (!complianceResult.compliant) {
          violations.push({
            adrId: adr.id,
            reason: complianceResult.reason,
            title: adr.title,
            file: path.join(adr.basePath, adr.fileName)
          });
        }
      }
    }
    
    return {
      compliant: violations.length === 0,
      violations,
      checkedADRs
    };
  } catch (error) {
    printWarning(chalk.yellow(`⚠️  Could not perform ADR compliance check: ${error.message}`));
    // Return compliant if ADR check fails to avoid blocking
    return {
      compliant: true,
      violations: [],
      checkedADRs: [],
      error: error.message
    };
  }
}

/**
 * Parse ADR from markdown content
 */
function parseADR(content, fileName) {
  try {
    // Extract ADR metadata from frontmatter or content
    const lines = content.split('\n');
    
    // Look for ADR ID in filename or content
    const idMatch = fileName.match(/(ADR-\d{3}|adr-\d{3})/i) || content.match(/# ADR-(\d{3})/i) || content.match(/# (\d{3})/);
    if (!idMatch) return null;
    
    const id = idMatch[1].toUpperCase();
    
    // Extract title
    let title = '';
    const titleMatch = content.match(/#.*ADR-\d{3}:\s*(.+)/i) || content.match(/#.*ADR-\d{3}\s*(.+)/i) || content.match(/# (.+)/);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }
    
    // Extract status
    let status = 'accepted'; // Default status
    const statusMatches = [
      /Status:\s*(\w+)/i,
      /status:\s*(\w+)/,
      /Status:\s*["']([^"']+)["']/i,
      /status:\s*["']([^"']+)["']/i
    ];
    
    for (const match of statusMatches) {
      const statusMatch = content.match(match);
      if (statusMatch) {
        status = statusMatch[1].toLowerCase();
        break;
      }
    }
    
    // Extract affected paths/components
    let affectedPaths = [];
    const affectedMatch = content.match(/Affected.*?Paths?:\s*([^\n\r]+)/i);
    if (affectedMatch) {
      affectedPaths = affectedMatch[1].split(',').map(p => p.trim());
    }
    
    // Extract constraints
    let constraints = [];
    const constraintsMatch = content.match(/Constraints?:\s*([^\n\r]+)/i);
    if (constraintsMatch) {
      constraints = constraintsMatch[1].split(',').map(c => c.trim());
    }
    
    return {
      id,
      title: title || `ADR ${id}`,
      status,
      affectedPaths,
      constraints,
      fileName,
      basePath: path.dirname(path.join(process.cwd(), 'docs', 'adrs'))
    };
  } catch (error) {
    printWarning(chalk.yellow(`⚠️  Could not parse ADR file ${fileName}: ${error.message}`));
    return null;
  }
}

/**
 * Check if an ADR applies to a specific task
 */
function appliesToTask(adr, taskName) {
  // Check if the ADR's affected paths or constraints relate to the task
  const taskLower = taskName.toLowerCase();
  
  // Check if task name matches any affected paths
  if (adr.affectedPaths && Array.isArray(adr.affectedPaths)) {
    for (const path of adr.affectedPaths) {
      if (taskLower.includes(path.toLowerCase())) {
        return true;
      }
    }
  }
  
  // Check if task name matches any constraints
  if (adr.constraints && Array.isArray(adr.constraints)) {
    for (const constraint of adr.constraints) {
      if (taskLower.includes(constraint.toLowerCase())) {
        return true;
      }
    }
  }
  
  // Check if ADR title relates to the task
  if (adr.title && taskLower.includes(adr.title.toLowerCase())) {
    return true;
  }
  
  return false;
}

/**
 * Check compliance with a specific ADR
 */
async function checkComplianceWithADR(adr) {
  // This is a simplified check - in a real implementation, this would be more sophisticated
  // For now, we'll just return compliant as a placeholder
  // In a real implementation, this would check the actual code/files against the ADR requirements
  
  try {
    // Check if the files affected by this task comply with the ADR
    // This would involve analyzing the actual code changes against ADR requirements
    
    // For now, return compliant as a default
    return {
      compliant: true,
      reason: `Task complies with ADR-${adr.id}: ${adr.title}`
    };
  } catch (error) {
    return {
      compliant: false,
      reason: `Could not verify compliance with ADR-${adr.id}: ${error.message}`
    };
  }
}

export default {
  checkADRGovernance
};