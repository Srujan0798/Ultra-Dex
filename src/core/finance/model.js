/**
 * Ultra-Dex Financial Model & Projections
 * 3-year projections, unit economics, burn rate analysis for fundraising
 */

import fs from 'fs/promises';
import path from 'path';

class FinancialModel {
  constructor(options = {}) {
    this.options = {
      initialMRR: options.initialMRR || 5000, // $5K MRR as per requirements
      initialUsers: options.initialUsers || 500, // 500 users as per requirements
      growthRate: options.growthRate || 0.15, // 15% monthly growth
      churnRate: options.churnRate || 0.05, // 5% monthly churn
      customerAcquisitionCost: options.customerAcquisitionCost || 100,
      grossMargin: options.grossMargin || 0.85, // 85% gross margin
      monthsToProject: options.monthsToProject || 36, // 3 years
      seedFunding: options.seedFunding || 2000000, // $2M seed funding
      ...options
    };

    this.projections = [];
    this.unitEconomics = {};
    this.burnRate = {};
    this.milestones = [];
    this.capTable = {};
  }

  /**
   * Generate 3-year financial projections
   * @returns {Array<object>} Financial projections by month
   */
  generateProjections() {
    const projections = [];
    let currentMRR = this.options.initialMRR;
    let currentUsers = this.options.initialUsers;
    let totalCACSpent = 0;
    let cashBalance = this.options.seedFunding; // Start with seed funding

    for (let month = 0; month < this.options.monthsToProject; month++) {
      // Calculate new users acquired this month
      const newUsers = Math.floor(currentUsers * this.options.growthRate);
      const churnedUsers = Math.floor(currentUsers * this.options.churnRate);
      
      // Update user count
      currentUsers = currentUsers + newUsers - churnedUsers;
      
      // Calculate MRR changes
      const newMRR = newUsers * this.getAverageRevenuePerUser(month);
      const churnedMRR = churnedUsers * this.getAverageRevenuePerUser(month);
      
      currentMRR = currentMRR + newMRR - churnedMRR;
      
      // Calculate CAC spend
      const cacSpent = newUsers * this.options.customerAcquisitionCost;
      totalCACSpent += cacSpent;
      
      // Calculate gross revenue and costs
      const grossRevenue = currentMRR;
      const variableCosts = grossRevenue * (1 - this.options.grossMargin);
      const netRevenue = grossRevenue - variableCosts;
      
      // Operating expenses (increasing over time with team growth)
      const operatingExpenses = this.calculateOperatingExpenses(month);
      
      // Calculate cash flow
      const monthlyCashFlow = netRevenue - operatingExpenses;
      cashBalance += monthlyCashFlow;
      
      // Net income calculation
      const netIncome = netRevenue - operatingExpenses;
      
      // Customer metrics
      const arpu = currentMRR / currentUsers;
      const ltv = this.calculateLTV(arpu, this.options.churnRate);
      const ltvToCac = ltv / this.options.customerAcquisitionCost;

      projections.push({
        month: month + 1,
        year: Math.floor(month / 12) + 1,
        monthOfYear: (month % 12) + 1,
        users: currentUsers,
        newUsers,
        churnedUsers,
        mrr: Math.round(currentMRR),
        arr: Math.round(currentMRR * 12),
        arpu: Math.round(arpu * 100) / 100,
        grossRevenue: Math.round(grossRevenue),
        variableCosts: Math.round(variableCosts),
        netRevenue: Math.round(netRevenue),
        operatingExpenses: Math.round(operatingExpenses),
        netIncome: Math.round(netIncome),
        cacSpent: Math.round(cacSpent),
        totalCacSpent: Math.round(totalCACSpent),
        cashBalance: Math.round(cashBalance),
        monthlyCashFlow: Math.round(monthlyCashFlow),
        ltv: Math.round(ltv * 100) / 100,
        ltvToCac,
        churnRate: this.options.churnRate,
        growthRate: this.options.growthRate,
        runWayMonths: cashBalance > 0 ? Math.floor(cashBalance / operatingExpenses) : 0,
        isProfitable: netIncome > 0,
        monthUntilProfitability: this.getMonthUntilProfitability(projections, month)
      });
    }

    this.projections = projections;
    return projections;
  }

  /**
   * Calculate average revenue per user based on month
   * @param {number} month - Month number (0-indexed)
   * @returns {number} ARPU
   */
  getAverageRevenuePerUser(month) {
    // ARPU increases over time as we add premium features
    const baseArpu = 10; // $10 for basic plan
    const growthFactor = 1 + (month * 0.02); // 2% growth per month
    const premiumFactor = 1 + (month * 0.01); // Premium features added over time
    
    return baseArpu * growthFactor * premiumFactor;
  }

  /**
   * Calculate LTV (Lifetime Value)
   * @param {number} arpu - Average Revenue Per User
   * @param {number} churnRate - Monthly churn rate
   * @returns {number} LTV
   */
  calculateLTV(arpu, churnRate) {
    const monthlyRetention = 1 - churnRate;
    const avgLifetimeMonths = 1 / churnRate;
    
    // LTV = ARPU * Average Lifetime Months * Gross Margin
    return arpu * avgLifetimeMonths * this.options.grossMargin;
  }

  /**
   * Calculate operating expenses for a given month
   * @param {number} month - Month number (0-indexed)
   * @returns {number} Operating expenses
   */
  calculateOperatingExpenses(month) {
    // Base operating expenses
    let expenses = 15000; // $15K base operating expenses
    
    // Add team costs (we'll hire 6 people over the first year)
    expenses += this.calculateTeamCosts(month);
    
    // Add infrastructure costs (increasing with scale)
    expenses += this.calculateInfrastructureCosts(month);
    
    // Add marketing costs (increasing with growth)
    expenses += this.calculateMarketingCosts(month);
    
    // Add legal and compliance costs (increasing over time)
    expenses += this.calculateLegalComplianceCosts(month);
    
    return expenses;
  }

  /**
   * Calculate team costs based on month
   * @param {number} month - Month number (0-indexed)
   * @returns {number} Team costs
   */
  calculateTeamCosts(month) {
    // Team grows over time - start with 2 founders, add 6 more by month 12
    const teamGrowthSchedule = [
      { month: 0, size: 2, avgSalary: 150000 }, // 2 founders
      { month: 1, size: 2, avgSalary: 150000 },
      { month: 2, size: 2, avgSalary: 150000 },
      { month: 3, size: 3, avgSalary: 145000 }, // Add 1 engineer
      { month: 4, size: 4, avgSalary: 140000 }, // Add 1 designer
      { month: 5, size: 5, avgSalary: 135000 }, // Add 1 advocate
      { month: 6, size: 6, avgSalary: 130000 }, // Add 1 sales
      { month: 7, size: 7, avgSalary: 125000 }, // Add 1 CS
      { month: 8, size: 8, avgSalary: 120000 }, // Add 1 more engineer
      { month: 9, size: 9, avgSalary: 115000 },
      { month: 10, size: 10, avgSalary: 110000 },
      { month: 11, size: 11, avgSalary: 105000 },
      { month: 12, size: 12, avgSalary: 100000 }, // 12 people by end of year 1
      { month: 24, size: 25, avgSalary: 100000 }, // 25 people by end of year 2
      { month: 36, size: 50, avgSalary: 100000 }  // 50 people by end of year 3
    ];
    
    // Find the appropriate team size for this month
    let teamSize = 2; // Default to 2 founders
    let avgSalary = 150000; // Default to founder salary
    
    for (let i = teamGrowthSchedule.length - 1; i >= 0; i--) {
      if (month >= teamGrowthSchedule[i].month) {
        teamSize = teamGrowthSchedule[i].size;
        avgSalary = teamGrowthSchedule[i].avgSalary;
        break;
      }
    }
    
    // For months between scheduled growth, interpolate
    for (let i = 0; i < teamGrowthSchedule.length - 1; i++) {
      if (month >= teamGrowthSchedule[i].month && month < teamGrowthSchedule[i+1].month) {
        // Use the earlier schedule point for simplicity
        teamSize = teamGrowthSchedule[i].size;
        avgSalary = teamGrowthSchedule[i].avgSalary;
        break;
      }
    }
    
    const monthlySalaryCost = (teamSize * avgSalary) / 12;
    const benefitsMultiplier = 1.4; // 40% benefits overhead
    
    return monthlySalaryCost * benefitsMultiplier;
  }

  /**
   * Calculate infrastructure costs based on month
   * @param {number} month - Month number (0-indexed)
   * @returns {number} Infrastructure costs
   */
  calculateInfrastructureCosts(month) {
    // Infrastructure costs grow with scale
    const baseCost = 2000; // $2K base infrastructure
    const scaleFactor = 1 + (month * 0.08); // 8% growth per month due to scaling
    
    return baseCost * scaleFactor;
  }

  /**
   * Calculate marketing costs based on month
   * @param {number} month - Month number (0-indexed)
   * @returns {number} Marketing costs
   */
  calculateMarketingCosts(month) {
    // Marketing costs start high for customer acquisition, then optimize
    const baseCost = 8000; // $8K base marketing
    let growthFactor = 1 + (month * 0.05); // Initially grows with scale
    
    // After month 12, marketing efficiency improves
    if (month > 12) {
      growthFactor *= Math.pow(0.95, month - 12); // 5% efficiency improvement per month after 12
    }
    
    const minCost = 3000; // Minimum marketing spend
    
    return Math.max(minCost, baseCost * growthFactor);
  }

  /**
   * Calculate legal and compliance costs based on month
   * @param {number} month - Month number (0-indexed)
   * @returns {number} Legal and compliance costs
   */
  calculateLegalComplianceCosts(month) {
    // Legal and compliance costs increase as we grow and need more oversight
    const baseCost = 1000; // $1K base legal/compliance
    const growthFactor = 1 + (month * 0.03); // 3% growth per month
    
    return baseCost * growthFactor;
  }

  /**
   * Calculate month until profitability
   * @param {Array} projections - Projections array
   * @param {number} currentMonth - Current month index
   * @returns {number} Month until profitability or -1 if not profitable in projection
   */
  getMonthUntilProfitability(projections, currentMonth) {
    for (let i = currentMonth + 1; i < projections.length; i++) {
      if (projections[i].netIncome > 0) {
        return i - currentMonth;
      }
    }
    return -1; // Not profitable in remaining projection
  }

  /**
   * Calculate unit economics
   * @returns {object} Unit economics
   */
  calculateUnitEconomics() {
    const latest = this.projections[this.projections.length - 1];
    
    this.unitEconomics = {
      arpu: latest.arpu,
      ltv: latest.ltv,
      cac: this.options.customerAcquisitionCost,
      ltvToCac: latest.ltvToCac,
      churnRate: this.options.churnRate,
      growthRate: this.options.growthRate,
      grossMargin: this.options.grossMargin,
      paybackPeriod: this.calculatePaybackPeriod(latest.arpu, this.options.customerAcquisitionCost),
      cohortRetention: this.calculateCohortRetention(),
      viralCoefficient: 0.1, // 10% viral coefficient from referrals
      networkEffectValue: 0.05, // 5% value from network effects
      customerConcentration: this.calculateCustomerConcentration(),
      lifetimeValue: latest.ltv,
      customerValue: latest.ltv / latest.users, // Value per user
      revenuePerUser: latest.mrr / latest.users
    };

    return this.unitEconomics;
  }

  /**
   * Calculate payback period
   * @param {number} arpu - Average Revenue Per User
   * @param {number} cac - Customer Acquisition Cost
   * @returns {number} Payback period in months
   */
  calculatePaybackPeriod(arpu, cac) {
    // Payback period = CAC / (ARPU * Gross Margin)
    const monthlyProfitPerUser = arpu * this.options.grossMargin;
    return cac / monthlyProfitPerUser;
  }

  /**
   * Calculate cohort retention
   * @returns {object} Cohort retention metrics
   */
  calculateCohortRetention() {
    // Simplified cohort retention model
    return {
      month1: 0.85,
      month3: 0.70,
      month6: 0.55,
      month12: 0.40
    };
  }

  /**
   * Calculate customer concentration risk
   * @returns {number} Concentration risk (0-1, where 1 is highest risk)
   */
  calculateCustomerConcentration() {
    // For simplicity, assuming customer revenue is evenly distributed
    // In reality, this would analyze actual customer revenue distribution
    return 0.2; // Low concentration risk
  }

  /**
   * Calculate burn rate and runway
   * @returns {object} Burn rate analysis
   */
  calculateBurnRate() {
    const monthlyExpenses = this.projections[0].operatingExpenses;
    const monthlyRevenue = this.projections[0].grossRevenue;
    const netBurn = monthlyExpenses - monthlyRevenue;
    
    // Calculate runway based on current burn and seed funding
    const runwayMonths = netBurn > 0 ? Math.floor(this.options.seedFunding / netBurn) : Infinity;
    
    // Calculate when we'll reach profitability
    const monthsToProfitability = this.calculateMonthsToProfitability();
    
    this.burnRate = {
      monthlyBurn: Math.round(netBurn),
      seedFunding: this.options.seedFunding,
      runwayMonths: runwayMonths,
      monthsToProfitability: monthsToProfitability,
      breakEvenMRR: Math.round(monthlyExpenses / this.options.grossMargin),
      projectedCashAtMonth12: this.getProjectedCashAtMonth(12),
      projectedCashAtMonth24: this.getProjectedCashAtMonth(24),
      projectedCashAtMonth36: this.getProjectedCashAtMonth(36)
    };

    return this.burnRate;
  }

  /**
   * Calculate months to profitability
   * @returns {number} Months to reach profitability
   */
  calculateMonthsToProfitability() {
    for (let i = 0; i < this.projections.length; i++) {
      if (this.projections[i].netIncome > 0) {
        return i + 1;
      }
    }
    return -1; // Never profitable in projection period
  }

  /**
   * Get projected cash at a specific month
   * @param {number} month - Month to project cash for
   * @returns {number} Projected cash balance
   */
  getProjectedCashAtMonth(month) {
    if (month >= this.projections.length) {
      return this.projections[this.projections.length - 1].cashBalance;
    }
    return this.projections[month - 1].cashBalance;
  }

  /**
   * Define funding milestones
   * @returns {Array<object>} Milestones with funding
   */
  defineMilestones() {
    this.milestones = [
      {
        month: 0,
        funding: this.options.seedFunding,
        description: "Seed funding received",
        users: this.options.initialUsers,
        mrr: this.options.initialMRR,
        teamSize: 2, // Founders
        valuation: 8000000 // $8M post-money valuation
      },
      {
        month: 6,
        funding: 0,
        description: "Product-market fit achieved",
        users: Math.floor(this.options.initialUsers * Math.pow(1 + this.options.growthRate, 6)),
        mrr: Math.round(this.options.initialMRR * Math.pow(1 + this.options.growthRate, 6)),
        teamSize: 6,
        valuation: 12000000 // $12M valuation after PMF
      },
      {
        month: 12,
        funding: 5000000, // Series A
        description: "Series A funding round",
        users: Math.floor(this.options.initialUsers * Math.pow(1 + this.options.growthRate, 12)),
        mrr: Math.round(this.options.initialMRR * Math.pow(1 + this.options.growthRate, 12)),
        teamSize: 15,
        valuation: 25000000 // $25M post-money valuation
      },
      {
        month: 18,
        funding: 0,
        description: "International expansion",
        users: Math.floor(this.options.initialUsers * Math.pow(1 + this.options.growthRate, 18)),
        mrr: Math.round(this.options.initialMRR * Math.pow(1 + this.options.growthRate, 18)),
        teamSize: 22,
        valuation: 35000000
      },
      {
        month: 24,
        funding: 15000000, // Series B
        description: "Series B funding round",
        users: Math.floor(this.options.initialUsers * Math.pow(1 + this.options.growthRate, 24)),
        mrr: Math.round(this.options.initialMRR * Math.pow(1 + this.options.growthRate, 24)),
        teamSize: 35,
        valuation: 75000000
      },
      {
        month: 36,
        funding: 0,
        description: "IPO preparation or strategic acquisition target",
        users: Math.floor(this.options.initialUsers * Math.pow(1 + this.options.growthRate, 36)),
        mrr: Math.round(this.options.initialMRR * Math.pow(1 + this.options.growthRate, 36)),
        teamSize: 50,
        valuation: 200000000 // $200M valuation at IPO readiness
      }
    ];

    return this.milestones;
  }

  /**
   * Generate cap table
   * @param {number} seedFunding - Amount of seed funding
   * @returns {object} Cap table
   */
  generateCapTable(seedFunding = 2000000) {
    const preMoneyValuation = 6000000; // $6M pre-money valuation
    const postMoneyValuation = preMoneyValuation + seedFunding; // $8M post-money
    const equityPercentage = (seedFunding / postMoneyValuation) * 100; // 20% for $2M at $8M valuation
    
    this.capTable = {
      preMoneyValuation,
      postMoneyValuation,
      seedFunding,
      equityPercentage,
      ownership: {
        founders: 80, // 80% for founders after seed
        investors: 20, // 20% for investors from seed
        optionsPool: 10 // 10% options pool (included in dilution)
      },
      shares: {
        totalShares: 10000000, // 10M total shares
        founderShares: 8000000, // 8M shares for founders (80%)
        investorShares: 2000000, // 2M shares for investors (20%)
        optionsPool: 1000000 // 1M shares in options pool
      },
      milestones: {
        seedRound: {
          amount: seedFunding,
          equity: 20,
          valuation: postMoneyValuation,
          date: "Q2 2026"
        }
      }
    };

    return this.capTable;
  }

  /**
   * Generate financial summary report
   * @returns {object} Financial summary
   */
  generateSummary() {
    const latest = this.projections[this.projections.length - 1];
    
    return {
      summary: {
        totalUsers: latest.users,
        totalARR: latest.arr,
        totalMRR: latest.mrr,
        netIncomeYear3: latest.netIncome,
        ltvToCacRatio: latest.ltvToCac,
        churnRate: this.options.churnRate,
        growthRate: this.options.growthRate,
        cashBalance: latest.cashBalance,
        isProfitable: latest.netIncome > 0
      },
      unitEconomics: this.calculateUnitEconomics(),
      burnRate: this.calculateBurnRate(),
      milestones: this.defineMilestones(),
      capTable: this.generateCapTable(this.options.seedFunding),
      projections: {
        year1: this.projections.slice(0, 12),
        year2: this.projections.slice(12, 24),
        year3: this.projections.slice(24, 36)
      },
      keyMetrics: {
        year1: {
          users: this.projections[11].users,
          mrr: this.projections[11].mrr,
          arr: this.projections[11].arr,
          teamSize: 12,
          cashBalance: this.projections[11].cashBalance
        },
        year2: {
          users: this.projections[23].users,
          mrr: this.projections[23].mrr,
          arr: this.projections[23].arr,
          teamSize: 25,
          cashBalance: this.projections[23].cashBalance
        },
        year3: {
          users: this.projections[35].users,
          mrr: this.projections[35].mrr,
          arr: this.projections[35].arr,
          teamSize: 50,
          cashBalance: this.projections[35].cashBalance
        }
      }
    };
  }

  /**
   * Export financial model to various formats
   * @param {string} format - Export format (json, csv, excel)
   * @param {string} path - Output path
   * @returns {Promise<void>} Export completed
   */
  async export(format = 'json', outputPath = './financial-model-export') {
    const data = this.generateSummary();
    
    switch (format.toLowerCase()) {
      case 'json':
        await fs.writeFile(`${outputPath}.json`, JSON.stringify(data, null, 2));
        console.log(`Financial model exported to ${outputPath}.json`);
        break;
      case 'csv':
        await this.exportToCSV(data, `${outputPath}.csv`);
        console.log(`Financial model exported to ${outputPath}.csv`);
        break;
      case 'excel':
        await this.exportToExcel(data, `${outputPath}.xlsx`);
        console.log(`Financial model exported to ${outputPath}.xlsx`);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export to CSV format
   * @param {object} data - Financial data
   * @param {string} filePath - Output file path
   * @returns {Promise<void>} Export completed
   */
  async exportToCSV(data, filePath) {
    let csv = 'Month,Year,Users,MRR,ARR,NetIncome,CashBalance,GrowthRate,ChurnRate\n';
    
    for (const proj of this.projections) {
      csv += `${proj.month},${proj.year},${proj.users},${proj.mrr},${proj.arr},${proj.netIncome},${proj.cashBalance},${proj.growthRate},${proj.churnRate}\n`;
    }
    
    await fs.writeFile(filePath, csv);
  }

  /**
   * Export to Excel format (placeholder)
   * @param {object} data - Financial data
   * @param {string} filePath - Output file path
   * @returns {Promise<void>} Export completed
   */
  async exportToExcel(data, filePath) {
    // In a real implementation, this would use a library like exceljs
    // For now, create a placeholder
    await fs.writeFile(filePath, 'Excel export would be generated here with proper formatting');
  }

  /**
   * Get financial health metrics
   * @returns {object} Health metrics
   */
  getHealth() {
    return {
      status: 'healthy',
      projectionsGenerated: this.projections.length > 0,
      unitEconomicsCalculated: Object.keys(this.unitEconomics).length > 0,
      burnRateCalculated: Object.keys(this.burnRate).length > 0,
      milestonesDefined: this.milestones.length > 0,
      capTableGenerated: Object.keys(this.capTable).length > 0,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const financialModel = new FinancialModel();

// Export class for instantiation with custom options
export default FinancialModel;

// If running directly, generate and display projections
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const model = new FinancialModel();
  const projections = model.generateProjections();
  const summary = model.generateSummary();
  
  console.log('📊 Ultra-Dex Financial Model & Projections');
  console.log('=========================================');
  console.log(`Initial MRR: $${summary.summary.totalMRR.toLocaleString()}`);
  console.log(`Initial Users: ${summary.summary.totalUsers.toLocaleString()}`);
  console.log(`Year 3 ARR: $${summary.keyMetrics.year3.arr.toLocaleString()}`);
  console.log(`Year 3 Users: ${summary.keyMetrics.year3.users.toLocaleString()}`);
  console.log(`LTV/CAC Ratio: ${summary.unitEconomics.ltvToCac.toFixed(2)}x`);
  console.log(`Months to Profitability: ${summary.burnRate.monthsToProfitability}`);
  console.log(`Runway with $2M: ${summary.burnRate.runwayMonths} months`);
  
  // Export to file for investor presentation
  model.export('json', './financial-model-investor-presentation').catch(console.error);
}