// Copyright (c) 2026 Ultra-Dex

/**
 * Rollback Plan Generator
 * Generate ROLLBACK-PLAN.md before every deployment
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { printError, printInfo, printSuccess } from '../utils/output.js';

// Rollback triggers
const ROLLBACK_TRIGGERS = [
  { condition: 'Critical bug affecting >10% of users', severity: 'high' },
  { condition: 'Performance degradation >50%', severity: 'high' },
  { condition: 'Security vulnerability discovered', severity: 'critical' },
  { condition: 'Data corruption detected', severity: 'critical' },
  { condition: 'Service availability <95%', severity: 'high' },
  { condition: 'Unexpected costs >200% of budget', severity: 'medium' },
];

// Rollback steps
const ROLLBACK_STEPS = [
  'Stop incoming traffic to affected services',
  'Revert code deployment to previous stable version',
  'Revert database schema changes if applicable',
  'Verify system health and functionality',
  'Notify stakeholders of rollback',
  'Document root cause and lessons learned',
];

/**
 * Generate rollback plan
 * @param {Object} options - Options for rollback plan generation
 * @param {string} options.deploymentId - Unique identifier for the deployment
 * @param {string} options.environment - Target environment (dev, staging, prod)
 * @param {string} options.version - Version being deployed
 * @param {string} options.description - Description of deployment
 * @param {Array} options.components - Components being deployed
 */
export async function generateRollbackPlan(options = {}) {
  const {
    deploymentId = `deploy-${Date.now()}`,
    environment = 'staging',
    version = '1.0.0',
    description = 'New feature deployment',
    components = ['frontend', 'backend', 'database'],
  } = options;

  printInfo(chalk.yellow(`\n🔄 Generating rollback plan for deployment: ${deploymentId}\n`));

  // Create rollback plan content
  const rollbackPlan = generateRollbackPlanContent({
    deploymentId,
    environment,
    version,
    description,
    components,
  });

  // Write rollback plan to file
  const rollbackPath = path.join(process.cwd(), 'ROLLBACK-PLAN.md');
  await fs.writeFile(rollbackPath, rollbackPlan);

  printSuccess(chalk.green(`✅ Rollback plan generated: ${rollbackPath}`));

  // Also create a timestamped version in deployments folder
  const deploymentsDir = path.join(process.cwd(), 'docs', 'deployments');
  await fs.mkdir(deploymentsDir, { recursive: true });

  const timestampedPath = path.join(deploymentsDir, `rollback-plan-${deploymentId}.md`);
  await fs.writeFile(timestampedPath, rollbackPlan);

  printInfo(chalk.gray(`📋 Timestamped copy: ${timestampedPath}`));

  return rollbackPath;
}

/**
 * Generate rollback plan content
 */
function generateRollbackPlanContent({
  deploymentId,
  environment,
  version,
  description,
  components,
}) {
  const now = new Date().toISOString();

  return `# Rollback Plan

**Deployment ID:** ${deploymentId}  
**Environment:** ${environment}  
**Version:** ${version}  
**Description:** ${description}  
**Components:** ${components.join(', ')}  
**Generated:** ${now}  

## Rollback Triggers

The following conditions will trigger an immediate rollback:

${ROLLBACK_TRIGGERS.map((trigger) => `- **${trigger.severity.toUpperCase()} SEVERITY**: ${trigger.condition}`).join('\n')}

## Rollback Steps

1. **Assessment** (Time: <2 mins)
   - Confirm trigger condition is met
   - Notify incident response team
   - Assess impact scope

2. **Traffic Control** (Time: <3 mins)
   - ${ROLLBACK_STEPS[0]}
   - Enable maintenance mode if needed
   - Monitor traffic drop

3. **Code Rollback** (Time: <5 mins)
   - ${ROLLBACK_STEPS[1]}
   - Use deployment tool to revert to previous version
   - Verify deployment status

4. **Database Rollback** (Time: Variable)
   - ${ROLLBACK_STEPS[2]}
   - Apply reverse migration scripts if applicable
   - Verify data integrity

5. **Health Verification** (Time: <5 mins)
   - ${ROLLBACK_STEPS[3]}
   - Run smoke tests
   - Check key metrics and dashboards

6. **Communication** (Time: <2 mins)
   - ${ROLLBACK_STEPS[4]}
   - Update incident status page
   - Send notification to teams

7. **Documentation** (Time: <10 mins)
   - ${ROLLBACK_STEPS[5]}
   - Log incident in tracking system
   - Schedule post-mortem

## Rollback Timeline

- **Total Target Time:** <15 minutes
- **Critical Path:** Traffic control → Code rollback → Health verification
- **Success Criteria:** Service restored to previous stable state

## Rollback Team

- **Incident Commander:** [To be assigned]
- **Deployment Lead:** [To be assigned]
- **Database Admin:** [To be assigned]
- **Communications:** [To be assigned]

## Rollback Tools

- **Deployment Tool:** [Tool name and access instructions]
- **Monitoring Dashboard:** [URL]
- **Communication Channel:** [Slack channel or similar]
- **Database Access:** [Connection details]

## Rollback Verification Checklist

- [ ] Service is responding normally
- [ ] Key transactions are successful
- [ ] Performance metrics are acceptable
- [ ] Error rates are normal
- [ ] Database connections are healthy
- [ ] External integrations are working
- [ ] User access is restored

## Post-Rollback Actions

1. Conduct incident post-mortem
2. Update rollback procedures if needed
3. Document lessons learned
4. Communicate resolution to stakeholders

---
*This rollback plan was automatically generated by Ultra-Dex. Update as needed before deployment.*
`;
}

/**
 * Check if a rollback is needed based on conditions
 * @param {Object} metrics - Current system metrics
 * @returns {Object} Rollback recommendation
 */
export function checkRollbackNeeded(metrics = {}) {
  const { errorRate, performanceDegradation, userImpactPercent, securityAlerts, availability } =
    metrics;

  const recommendations = [];

  // Check for critical bugs affecting >10% of users
  if (userImpactPercent && userImpactPercent > 10) {
    recommendations.push({
      trigger: 'Critical bug affecting >10% of users',
      severity: 'HIGH',
      action: 'Immediate rollback recommended',
    });
  }

  // Check for performance degradation >50%
  if (performanceDegradation && performanceDegradation > 50) {
    recommendations.push({
      trigger: 'Performance degradation >50%',
      severity: 'HIGH',
      action: 'Rollback consideration needed',
    });
  }

  // Check for security vulnerabilities
  if (securityAlerts && securityAlerts.length > 0) {
    recommendations.push({
      trigger: 'Security vulnerability discovered',
      severity: 'CRITICAL',
      action: 'Immediate rollback required',
    });
  }

  // Check for service availability <95%
  if (availability && availability < 95) {
    recommendations.push({
      trigger: 'Service availability <95%',
      severity: 'HIGH',
      action: 'Rollback consideration needed',
    });
  }

  return {
    needsRollback: recommendations.length > 0,
    recommendations,
  };
}

export function registerRollbackCommand(program) {
  program
    .command('rollback-plan')
    .alias('rollback-gen')
    .description('Generate rollback plan for deployment')
    .option('-d, --deployment-id <id>', 'Deployment identifier')
    .option('-e, --environment <env>', 'Target environment', 'staging')
    .option('-v, --version <version>', 'Version to deploy', '1.0.0')
    .option(
      '-c, --components <components>',
      'Comma-separated list of components',
      'frontend,backend,database'
    )
    .option('-desc, --description <desc>', 'Deployment description', 'New feature deployment')
    .action(async (options) => {
      try {
        printInfo(chalk.cyan('\n🔄 Ultra-Dex Rollback Plan Generator\n'));

        // Parse components
        const components = options.components
          ? options.components.split(',').map((c) => c.trim())
          : ['frontend', 'backend', 'database'];

        await generateRollbackPlan({
          deploymentId: options.deploymentId || `deploy-${Date.now()}`,
          environment: options.environment,
          version: options.version,
          description: options.description,
          components,
        });

        printSuccess(chalk.green('\n✅ Rollback plan generated successfully!'));
        printInfo(chalk.gray('Review ROLLBACK-PLAN.md before deployment'));
      } catch (error) {
        printError(chalk.red(`Rollback plan generation failed: ${error.message}`));
        process.exit(1);
      }
    });
}

export default {
  generateRollbackPlan,
  checkRollbackNeeded,
  registerRollbackCommand,
};
