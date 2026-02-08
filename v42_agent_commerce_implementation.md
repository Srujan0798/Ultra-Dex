# 🚀 ULTRA-DEX V4.2.0 - AGENT COMMERCE/BILLING

## 🎯 API Credit Management System

### Objective
Create a comprehensive billing and credit management system for AI agents that tracks API usage, manages credits, and enables autonomous purchasing of services.

### Implementation Plan

#### 1. Credit Management System
```javascript
// File: cli/lib/commerce/credit-manager.js
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class CreditManager {
  constructor(options = {}) {
    this.creditDir = options.creditDir || path.join(process.cwd(), '.ultra-dex', 'commerce', 'credits');
    this.accountsDir = path.join(this.creditDir, 'accounts');
    this.transactionsDir = path.join(this.creditDir, 'transactions');
    this.budgetsDir = path.join(this.creditDir, 'budgets');
  }

  async initialize() {
    await fs.mkdir(this.creditDir, { recursive: true });
    await fs.mkdir(this.accountsDir, { recursive: true });
    await fs.mkdir(this.transactionsDir, { recursive: true });
    await fs.mkdir(this.budgetsDir, { recursive: true });
  }

  async createAccount(userId, initialCredits = 0, options = {}) {
    const accountId = uuidv4();
    const account = {
      id: accountId,
      userId,
      balance: initialCredits,
      currency: options.currency || 'USD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active',
      metadata: {
        name: options.name || `Account-${userId}`,
        type: options.type || 'personal',
        tier: options.tier || 'basic'
      }
    };

    const accountPath = path.join(this.accountsDir, `${accountId}.json`);
    await fs.writeFile(accountPath, JSON.stringify(account, null, 2));

    return account;
  }

  async getAccount(accountId) {
    const accountPath = path.join(this.accountsDir, `${accountId}.json`);
    try {
      const content = await fs.readFile(accountPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  async addCredits(accountId, amount, transactionDetails = {}) {
    const account = await this.getAccount(accountId);
    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    account.balance += amount;
    account.updatedAt = new Date().toISOString();

    // Create transaction record
    const transaction = await this.createTransaction(accountId, {
      type: 'credit_addition',
      amount,
      balanceBefore: account.balance - amount,
      balanceAfter: account.balance,
      ...transactionDetails
    });

    const accountPath = path.join(this.accountsDir, `${accountId}.json`);
    await fs.writeFile(accountPath, JSON.stringify(account, null, 2));

    return { account, transaction };
  }

  async deductCredits(accountId, amount, transactionDetails = {}) {
    const account = await this.getAccount(accountId);
    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    if (account.balance < amount) {
      throw new Error(`Insufficient credits. Balance: ${account.balance}, Requested: ${amount}`);
    }

    account.balance -= amount;
    account.updatedAt = new Date().toISOString();

    // Create transaction record
    const transaction = await this.createTransaction(accountId, {
      type: 'credit_deduction',
      amount: -amount,
      balanceBefore: account.balance + amount,
      balanceAfter: account.balance,
      ...transactionDetails
    });

    const accountPath = path.join(this.accountsDir, `${accountId}.json`);
    await fs.writeFile(accountPath, JSON.stringify(account, null, 2));

    return { account, transaction };
  }

  async createTransaction(accountId, details) {
    const transaction = {
      id: uuidv4(),
      accountId,
      timestamp: new Date().toISOString(),
      ...details
    };

    const transactionPath = path.join(this.transactionsDir, `${transaction.id}.json`);
    await fs.writeFile(transactionPath, JSON.stringify(transaction, null, 2));

    return transaction;
  }

  async getAccountBalance(accountId) {
    const account = await this.getAccount(accountId);
    return account ? account.balance : 0;
  }

  async getTransactionHistory(accountId, limit = 50) {
    const allTransactions = await fs.readdir(this.transactionsDir);
    const accountTransactions = [];

    for (const file of allTransactions) {
      if (file.endsWith('.json')) {
        const transactionPath = path.join(this.transactionsDir, file);
        const content = await fs.readFile(transactionPath, 'utf8');
        const transaction = JSON.parse(content);
        
        if (transaction.accountId === accountId) {
          accountTransactions.push(transaction);
        }
      }
    }

    return accountTransactions
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  async transferCredits(fromAccountId, toAccountId, amount) {
    const fromAccount = await this.getAccount(fromAccountId);
    const toAccount = await this.getAccount(toAccountId);

    if (!fromAccount || !toAccount) {
      throw new Error('One or both accounts not found');
    }

    if (fromAccount.balance < amount) {
      throw new Error('Insufficient funds for transfer');
    }

    // Deduct from sender
    await this.deductCredits(fromAccountId, amount, {
      type: 'transfer_out',
      recipient: toAccountId
    });

    // Add to receiver
    await this.addCredits(toAccountId, amount, {
      type: 'transfer_in',
      sender: fromAccountId
    });

    return {
      success: true,
      amount,
      from: fromAccountId,
      to: toAccountId
    };
  }
}
```

#### 2. API Usage Tracker
```javascript
// File: cli/lib/commerce/api-usage-tracker.js
import { CreditManager } from './credit-manager.js';
import { v4 as uuidv4 } from 'uuid';

export class APIUsageTracker {
  constructor(creditManager) {
    this.creditManager = creditManager;
    this.providers = {
      openai: { costPerToken: 0.00001 }, // $0.01 per 1K tokens
      anthropic: { costPerToken: 0.000015 }, // $0.015 per 1K tokens
      google: { costPerToken: 0.000008 }, // $0.008 per 1K tokens
      ollama: { costPerToken: 0.000001 } // $0.001 per 1K tokens (local)
    };
  }

  async trackUsage(accountId, provider, usageData) {
    const cost = this.calculateCost(provider, usageData);
    
    if (cost > 0) {
      try {
        await this.creditManager.deductCredits(accountId, cost, {
          type: 'api_usage',
          provider,
          usage: usageData,
          cost
        });
      } catch (error) {
        if (error.message.includes('Insufficient credits')) {
          throw new Error(`Insufficient credits for API usage. Cost: $${cost.toFixed(4)}, Balance: $${await this.creditManager.getAccountBalance(accountId)}`);
        }
        throw error;
      }
    }

    return {
      cost,
      usage: usageData,
      provider
    };
  }

  calculateCost(provider, usageData) {
    const providerConfig = this.providers[provider];
    if (!providerConfig) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    // Calculate based on input and output tokens
    const inputTokens = usageData.inputTokens || 0;
    const outputTokens = usageData.outputTokens || 0;
    const totalTokens = inputTokens + outputTokens;

    return totalTokens * providerConfig.costPerToken;
  }

  async estimateCost(provider, usageEstimate) {
    return this.calculateCost(provider, usageEstimate);
  }

  async getUsageSummary(accountId, period = 'month') {
    const transactions = await this.creditManager.getTransactionHistory(accountId);
    const periodTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.timestamp);
      const now = new Date();
      
      if (period === 'day') {
        return txDate.toDateString() === now.toDateString();
      } else if (period === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return txDate >= weekAgo;
      } else if (period === 'month') {
        return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      }
      return true;
    });

    const apiUsage = periodTransactions.filter(tx => tx.type === 'api_usage');
    const totalCost = apiUsage.reduce((sum, tx) => sum + (tx.cost || 0), 0);
    const totalTokens = apiUsage.reduce((sum, tx) => {
      const usage = tx.usage || {};
      return sum + (usage.inputTokens || 0) + (usage.outputTokens || 0);
    }, 0);

    return {
      period,
      totalCost,
      totalTokens,
      transactions: apiUsage.length,
      averageCost: apiUsage.length > 0 ? totalCost / apiUsage.length : 0
    };
  }
}
```

#### 3. Budget Management System
```javascript
// File: cli/lib/commerce/budget-manager.js
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class BudgetManager {
  constructor(creditManager) {
    this.creditManager = creditManager;
    this.budgetsDir = path.join(creditManager.creditDir, 'budgets');
  }

  async createBudget(accountId, budgetData) {
    const budgetId = uuidv4();
    const budget = {
      id: budgetId,
      accountId,
      name: budgetData.name,
      limit: budgetData.limit,
      spent: 0,
      period: budgetData.period || 'monthly', // daily, weekly, monthly, yearly
      startDate: budgetData.startDate || new Date().toISOString(),
      endDate: this.calculateEndDate(budgetData.period, budgetData.startDate),
      alerts: budgetData.alerts || [0.5, 0.75, 0.9, 1.0], // 50%, 75%, 90%, 100%
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active'
    };

    const budgetPath = path.join(this.budgetsDir, `${budgetId}.json`);
    await fs.writeFile(budgetPath, JSON.stringify(budget, null, 2));

    return budget;
  }

  calculateEndDate(period, startDate) {
    const start = new Date(startDate || new Date());
    const end = new Date(start);

    switch (period) {
      case 'daily':
        end.setDate(start.getDate() + 1);
        break;
      case 'weekly':
        end.setDate(start.getDate() + 7);
        break;
      case 'monthly':
        end.setMonth(start.getMonth() + 1);
        break;
      case 'yearly':
        end.setFullYear(start.getFullYear() + 1);
        break;
      default:
        end.setMonth(start.getMonth() + 1);
    }

    return end.toISOString();
  }

  async getBudget(budgetId) {
    const budgetPath = path.join(this.budgetsDir, `${budgetId}.json`);
    try {
      const content = await fs.readFile(budgetPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  async updateBudgetSpent(budgetId, amount) {
    const budget = await this.getBudget(budgetId);
    if (!budget) {
      throw new Error(`Budget ${budgetId} not found`);
    }

    budget.spent += amount;
    budget.updatedAt = new Date().toISOString();

    const budgetPath = path.join(this.budgetsDir, `${budgetId}.json`);
    await fs.writeFile(budgetPath, JSON.stringify(budget, null, 2));

    // Check for alerts
    await this.checkBudgetAlerts(budget);

    return budget;
  }

  async checkBudgetAlerts(budget) {
    const percentageUsed = budget.spent / budget.limit;
    
    for (const alertThreshold of budget.alerts) {
      if (percentageUsed >= alertThreshold && percentageUsed - (budget.spent / budget.limit) < 0.01) {
        // Trigger alert
        await this.triggerBudgetAlert(budget, alertThreshold);
      }
    }
  }

  async triggerBudgetAlert(budget, threshold) {
    console.log(`⚠️ Budget Alert: ${threshold * 100}% of budget used for ${budget.name}`);
    // Could send email, notification, etc.
  }

  async checkBudgetLimits(accountId, amount) {
    const budgets = await this.getAccountBudgets(accountId);
    
    for (const budget of budgets) {
      if (budget.status === 'active') {
        const projectedSpent = budget.spent + amount;
        if (projectedSpent > budget.limit) {
          throw new Error(`Budget limit would be exceeded: ${budget.name}`);
        }
      }
    }
  }

  async getAccountBudgets(accountId) {
    const allBudgets = await fs.readdir(this.budgetsDir);
    const accountBudgets = [];

    for (const file of allBudgets) {
      if (file.endsWith('.json')) {
        const budgetPath = path.join(this.budgetsDir, file);
        const content = await fs.readFile(budgetPath, 'utf8');
        const budget = JSON.parse(content);
        
        if (budget.accountId === accountId) {
          accountBudgets.push(budget);
        }
      }
    }

    return accountBudgets;
  }
}
```

#### 4. Autonomous Purchase System
```javascript
// File: cli/lib/commerce/autonomous-purchase.js
import { CreditManager } from './credit-manager.js';
import { APIUsageTracker } from './api-usage-tracker.js';
import { BudgetManager } from './budget-manager.js';
import { runAgentLoop } from '../commands/run.js';
import { getDefaultProvider, createProvider } from '../providers/index.js';

export class AutonomousPurchaseSystem {
  constructor(creditManager, apiTracker, budgetManager) {
    this.creditManager = creditManager;
    this.apiTracker = apiTracker;
    this.budgetManager = budgetManager;
    this.provider = createProvider(getDefaultProvider(), {
      maxTokens: 2000,
      temperature: 0.3
    });
  }

  async evaluatePurchaseNeed(service, requirements) {
    const prompt = `
You are an AI purchasing agent. Evaluate if we should purchase the following service:

Service: ${service.name}
Description: ${service.description}
Cost: ${service.cost}
Requirements: ${JSON.stringify(requirements)}

Consider:
- Current credit balance
- Usage patterns
- Budget constraints
- Business value

Respond with JSON: { shouldPurchase: boolean, confidence: number, reasoning: string }
`;

    const response = await this.provider.call(prompt);
    try {
      return JSON.parse(response.content);
    } catch {
      return { shouldPurchase: false, confidence: 0.5, reasoning: 'Could not parse response' };
    }
  }

  async purchaseService(accountId, service, options = {}) {
    // Check if we have enough credits
    const balance = await this.creditManager.getAccountBalance(accountId);
    if (balance < service.cost) {
      throw new Error(`Insufficient credits for purchase. Balance: $${balance}, Cost: $${service.cost}`);
    }

    // Check budget limits
    await this.budgetManager.checkBudgetLimits(accountId, service.cost);

    // Process purchase
    const purchase = {
      id: `purchase-${Date.now()}`,
      accountId,
      service: service.name,
      cost: service.cost,
      timestamp: new Date().toISOString(),
      status: 'processing',
      metadata: {
        serviceDetails: service,
        purchasedBy: 'autonomous-agent',
        ...options
      }
    };

    // Deduct credits
    await this.creditManager.deductCredits(accountId, service.cost, {
      type: 'service_purchase',
      service: service.name,
      purchaseId: purchase.id
    });

    // Simulate service provisioning
    purchase.status = 'completed';
    purchase.provisionedAt = new Date().toISOString();

    return purchase;
  }

  async monitorAndPurchase(accountId, serviceCatalog) {
    const balance = await this.creditManager.getAccountBalance(accountId);
    const usageSummary = await this.apiTracker.getUsageSummary(accountId, 'month');
    
    for (const service of serviceCatalog) {
      const evaluation = await this.evaluatePurchaseNeed(service, {
        currentBalance: balance,
        usagePattern: usageSummary,
        budget: await this.budgetManager.getAccountBudgets(accountId)
      });

      if (evaluation.shouldPurchase && evaluation.confidence > 0.7) {
        try {
          const purchase = await this.purchaseService(accountId, service);
          console.log(`✅ Purchased ${service.name} for $${service.cost}`);
          return purchase;
        } catch (error) {
          console.log(`❌ Purchase failed: ${error.message}`);
        }
      }
    }

    return null;
  }

  async setupAutonomousPurchasing(accountId, preferences) {
    const setup = {
      accountId,
      preferences,
      enabled: true,
      lastChecked: new Date().toISOString(),
      rules: {
        minimumBalance: preferences.minimumBalance || 10, // $10 minimum
        maxPurchaseAmount: preferences.maxPurchaseAmount || 100, // $100 max
        autoRenew: preferences.autoRenew || false
      }
    };

    // Store setup configuration
    const setupPath = path.join(this.creditManager.creditDir, 'purchasing-setup.json');
    await fs.writeFile(setupPath, JSON.stringify(setup, null, 2));

    return setup;
  }

  async getPurchaseRecommendations(accountId) {
    const balance = await this.creditManager.getAccountBalance(accountId);
    const usageSummary = await this.apiTracker.getUsageSummary(accountId, 'month');
    
    // Generate recommendations based on usage patterns
    const recommendations = [];

    if (usageSummary.totalCost > balance * 0.8) {
      recommendations.push({
        type: 'add_credits',
        priority: 'high',
        reason: 'High usage approaching balance limit'
      });
    }

    if (usageSummary.totalTokens > 1000000) { // 1M tokens
      recommendations.push({
        type: 'upgrade_tier',
        priority: 'medium',
        reason: 'High token usage suggests premium tier benefits'
      });
    }

    return recommendations;
  }
}
```

#### 5. CLI Commands for Commerce
```javascript
// File: cli/lib/commands/commerce.js
import { CreditManager } from '../commerce/credit-manager.js';
import { APIUsageTracker } from '../commerce/api-usage-tracker.js';
import { BudgetManager } from '../commerce/budget-manager.js';
import { AutonomousPurchaseSystem } from '../commerce/autonomous-purchase.js';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import fs from 'fs/promises';
import path from 'path';

export async function registerCommerceCommand(program) {
  const commerceCmd = program
    .command('commerce')
    .alias('billing')
    .description('Manage API credits and billing');

  const creditManager = new CreditManager();
  const apiTracker = new APIUsageTracker(creditManager);
  const budgetManager = new BudgetManager(creditManager);
  const purchaseSystem = new AutonomousPurchaseSystem(creditManager, apiTracker, budgetManager);

  await creditManager.initialize();

  commerceCmd
    .command('account create <userId>')
    .description('Create a new account')
    .option('-c, --credits <amount>', 'Initial credits', '0')
    .option('-n, --name <name>', 'Account name')
    .option('-t, --type <type>', 'Account type', 'personal')
    .action(async (userId, options) => {
      try {
        const account = await creditManager.createAccount(userId, parseFloat(options.credits), {
          name: options.name,
          type: options.type
        });
        
        printSuccess(`Account created: ${account.id}`);
        printInfo(`Balance: $${account.balance}`);
        printInfo(`Type: ${account.metadata.type}`);
      } catch (error) {
        printError(`Account creation failed: ${error.message}`);
      }
    });

  commerceCmd
    .command('account info <accountId>')
    .description('Get account information')
    .action(async (accountId) => {
      try {
        const account = await creditManager.getAccount(accountId);
        if (!account) {
          printWarning(`Account ${accountId} not found`);
          return;
        }

        printInfo(`Account: ${account.id}`);
        printInfo(`User: ${account.userId}`);
        printInfo(`Balance: $${account.balance}`);
        printInfo(`Currency: ${account.currency}`);
        printInfo(`Status: ${account.status}`);
        printInfo(`Created: ${account.createdAt}`);
        printInfo(`Updated: ${account.updatedAt}`);
      } catch (error) {
        printError(`Account info failed: ${error.message}`);
      }
    });

  commerceCmd
    .command('credit add <accountId> <amount>')
    .description('Add credits to account')
    .option('-r, --reason <reason>', 'Reason for credit addition')
    .action(async (accountId, amount, options) => {
      try {
        const result = await creditManager.addCredits(accountId, parseFloat(amount), {
          reason: options.reason,
          addedBy: 'user'
        });
        
        printSuccess(`Added $${amount} to account ${accountId}`);
        printInfo(`New balance: $${result.account.balance}`);
      } catch (error) {
        printError(`Credit addition failed: ${error.message}`);
      }
    });

  commerceCmd
    .command('credit deduct <accountId> <amount>')
    .description('Deduct credits from account')
    .option('-r, --reason <reason>', 'Reason for deduction')
    .action(async (accountId, amount, options) => {
      try {
        const result = await creditManager.deductCredits(accountId, parseFloat(amount), {
          reason: options.reason,
          deductedBy: 'user'
        });
        
        printSuccess(`Deducted $${amount} from account ${accountId}`);
        printInfo(`New balance: $${result.account.balance}`);
      } catch (error) {
        printError(`Credit deduction failed: ${error.message}`);
      }
    });

  commerceCmd
    .command('usage <accountId>')
    .description('Get API usage summary')
    .option('-p, --period <period>', 'Period (day, week, month)', 'month')
    .action(async (accountId, options) => {
      try {
        const summary = await apiTracker.getUsageSummary(accountId, options.period);
        
        printInfo(`Usage Summary (${summary.period}):`);
        printInfo(`Total Cost: $${summary.totalCost.toFixed(4)}`);
        printInfo(`Total Tokens: ${summary.totalTokens.toLocaleString()}`);
        printInfo(`Transactions: ${summary.transactions}`);
        printInfo(`Average Cost: $${summary.averageCost.toFixed(4)}`);
      } catch (error) {
        printError(`Usage summary failed: ${error.message}`);
      }
    });

  commerceCmd
    .command('budget create <accountId> <limit>')
    .description('Create a budget')
    .option('-n, --name <name>', 'Budget name')
    .option('-p, --period <period>', 'Period (daily, weekly, monthly, yearly)', 'monthly')
    .action(async (accountId, limit, options) => {
      try {
        const budget = await budgetManager.createBudget(accountId, {
          name: options.name,
          limit: parseFloat(limit),
          period: options.period
        });
        
        printSuccess(`Budget created: ${budget.name}`);
        printInfo(`Limit: $${budget.limit}`);
        printInfo(`Period: ${budget.period}`);
        printInfo(`Spent: $${budget.spent}`);
      } catch (error) {
        printError(`Budget creation failed: ${error.message}`);
      }
    });

  commerceCmd
    .command('budget list <accountId>')
    .description('List account budgets')
    .action(async (accountId) => {
      try {
        const budgets = await budgetManager.getAccountBudgets(accountId);
        
        if (budgets.length === 0) {
          printInfo('No budgets found for this account');
          return;
        }

        printInfo(`Budgets for account ${accountId}:`);
        budgets.forEach(budget => {
          const percentage = (budget.spent / budget.limit) * 100;
          printInfo(`\n${budget.name}:`);
          printInfo(`  Limit: $${budget.limit}`);
          printInfo(`  Spent: $${budget.spent} (${percentage.toFixed(1)}%)`);
          printInfo(`  Period: ${budget.period}`);
          printInfo(`  Status: ${budget.status}`);
        });
      } catch (error) {
        printError(`Budget list failed: ${error.message}`);
      }
    });

  commerceCmd
    .command('purchase evaluate <service>')
    .description('Evaluate a service for purchase')
    .option('-c, --cost <cost>', 'Service cost', '10')
    .option('-d, --description <desc>', 'Service description', 'AI service')
    .action(async (service, options) => {
      try {
        const evaluation = await purchaseSystem.evaluatePurchaseNeed({
          name: service,
          description: options.description,
          cost: parseFloat(options.cost)
        }, {});

        printInfo(`Evaluation for ${service}:`);
        printInfo(`Should Purchase: ${evaluation.shouldPurchase ? 'YES' : 'NO'}`);
        printInfo(`Confidence: ${(evaluation.confidence * 100).toFixed(1)}%`);
        printInfo(`Reasoning: ${evaluation.reasoning}`);
      } catch (error) {
        printError(`Purchase evaluation failed: ${error.message}`);
      }
    });

  commerceCmd
    .command('recommendations <accountId>')
    .description('Get purchase recommendations')
    .action(async (accountId) => {
      try {
        const recommendations = await purchaseSystem.getPurchaseRecommendations(accountId);
        
        if (recommendations.length === 0) {
          printInfo('No recommendations at this time');
          return;
        }

        printInfo('Purchase Recommendations:');
        recommendations.forEach(rec => {
          printInfo(`\n${rec.type.toUpperCase()}:`);
          printInfo(`  Priority: ${rec.priority}`);
          printInfo(`  Reason: ${rec.reason}`);
        });
      } catch (error) {
        printError(`Recommendations failed: ${error.message}`);
      }
    });

  commerceCmd
    .command('status <accountId>')
    .description('Get comprehensive account status')
    .action(async (accountId) => {
      try {
        const account = await creditManager.getAccount(accountId);
        if (!account) {
          printWarning(`Account ${accountId} not found`);
          return;
        }

        const usage = await apiTracker.getUsageSummary(accountId, 'month');
        const budgets = await budgetManager.getAccountBudgets(accountId);

        printInfo(`=== Account Status: ${account.id} ===`);
        printInfo(`Balance: $${account.balance}`);
        printInfo(`Monthly Usage: $${usage.totalCost.toFixed(4)}`);
        printInfo(`Monthly Tokens: ${usage.totalTokens.toLocaleString()}`);
        printInfo(`Budgets: ${budgets.length}`);
        
        if (budgets.length > 0) {
          printInfo('\nBudget Status:');
          budgets.forEach(budget => {
            const percentage = (budget.spent / budget.limit) * 100;
            printInfo(`  ${budget.name}: ${percentage.toFixed(1)}% used ($${budget.spent}/$${budget.limit})`);
          });
        }
      } catch (error) {
        printError(`Status check failed: ${error.message}`);
      }
    });
}
```

#### 6. Update Main CLI Registration
```javascript
// Add to cli/bin/ultra-dex.js
import { registerCommerceCommand } from './lib/commands/commerce.js';

// Add after other registrations
registerCommerceCommand(program);
```

#### 7. Integration with Existing Systems
```javascript
// File: cli/lib/commerce/integration.js
import { CreditManager } from './credit-manager.js';
import { APIUsageTracker } from './api-usage-tracker.js';

export class CommerceIntegration {
  constructor() {
    this.creditManager = new CreditManager();
    this.apiTracker = new APIUsageTracker(this.creditManager);
  }

  async initialize() {
    await this.creditManager.initialize();
  }

  async chargeForAIUsage(accountId, provider, usageData) {
    try {
      return await this.apiTracker.trackUsage(accountId, provider, usageData);
    } catch (error) {
      console.error('Commerce integration error:', error.message);
      // Don't block execution if billing fails
      return { cost: 0, error: error.message };
    }
  }

  async setupDefaultAccount(userId) {
    // Create default account with small starting balance
    return await this.creditManager.createAccount(userId, 5.00, {
      name: `Default-${userId}`,
      type: 'personal',
      tier: 'starter'
    });
  }
}
```

### Testing Plan
1. Test credit management operations
2. Verify API usage tracking
3. Validate budget management
4. Test autonomous purchasing logic
5. Benchmark performance with concurrent operations

### Success Criteria
- ✅ Credit management system works reliably
- ✅ API usage tracking calculates costs correctly
- ✅ Budget management enforces limits
- ✅ Autonomous purchasing evaluates needs properly
- ✅ Performance acceptable with concurrent operations

---

**Estimated Timeline:** 1 week
**Priority:** 🟢 MEDIUM
**Status:** Ready for implementation