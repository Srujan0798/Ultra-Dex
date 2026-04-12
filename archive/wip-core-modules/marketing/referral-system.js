/**
 * Ultra-Dex Referral System
 * Viral growth engine with gamification
 *
 * Features:
 * - Unique referral links for all users
 * - Tiered rewards system
 * - Gamification with leaderboards and badges
 * - Automated reward distribution
 * - Analytics and tracking
 */

const { v4: uuidv4 } = require('uuid');
const EventEmitter = require('events');

class ReferralSystem extends EventEmitter {
  constructor(options = {}) {
    super();
    this.db = options.db || new Map(); // Replace with real DB in production
    this.rewards = this.initializeRewards();
    this.badges = this.initializeBadges();
    this.leaderboard = new Map();
    this.config = {
      cookieDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
      attributionWindow: 7 * 24 * 60 * 60 * 1000, // 7 days
      minSignupDays: 7, // Must be user for 7 days to refer
      ...options.config,
    };
  }

  /**
   * Initialize reward tiers
   */
  initializeRewards() {
    return {
      // Referral count milestones
      milestones: [
        {
          id: 'first-referral',
          name: 'First Referral',
          description: 'Refer your first user',
          required: 1,
          reward: {
            type: 'credits',
            amount: 10,
            message: '🎉 Welcome to the referral program!',
          },
        },
        {
          id: 'rising-star',
          name: 'Rising Star',
          description: 'Refer 5 users',
          required: 5,
          reward: {
            type: 'subscription',
            duration: 30, // days
            tier: 'pro',
            message: "🌟 You're a Rising Star! 1 month free Pro.",
          },
        },
        {
          id: 'influencer',
          name: 'Influencer',
          description: 'Refer 10 users',
          required: 10,
          reward: {
            type: 'subscription',
            duration: 90, // days
            tier: 'pro',
            message: '🔥 Influencer status! 3 months free Pro.',
          },
        },
        {
          id: 'ambassador',
          name: 'Ambassador',
          description: 'Refer 25 users',
          required: 25,
          reward: {
            type: 'lifetime',
            tier: 'pro',
            message: '👑 Ambassador unlocked! Lifetime Pro free.',
          },
        },
        {
          id: 'legend',
          name: 'Legend',
          description: 'Refer 50 users',
          required: 50,
          reward: {
            type: 'affiliate',
            commission: 0.2, // 20%
            message: "🚀 LEGEND! You're now an affiliate (20% commission).",
          },
        },
        {
          id: 'titan',
          name: 'Titan',
          description: 'Refer 100 users',
          required: 100,
          reward: {
            type: 'revenue-share',
            commission: 0.25, // 25%
            equity: 0.001, // 0.1% equity (if applicable)
            message: '🏆 TITAN ACHIEVED! 25% commission + equity.',
          },
        },
      ],

      // Conversion rewards (when referral converts to paid)
      conversion: {
        percentage: 0.2, // 20% of first payment
        duration: 12, // months of recurring commission
        minimum: 10, // minimum $10 reward
      },

      // Special campaigns
      campaigns: [
        {
          id: 'double-rewards',
          name: 'Double Rewards Week',
          description: '2x rewards for all referrals',
          multiplier: 2,
          startDate: new Date('2026-03-01'),
          endDate: new Date('2026-03-07'),
          active: false,
        },
        {
          id: 'early-adopter',
          name: 'Early Adopter Bonus',
          description: 'Extra rewards for first 1000 users',
          bonus: 50, // extra credits
          active: true,
        },
      ],
    };
  }

  /**
   * Initialize achievement badges
   */
  initializeBadges() {
    return {
      'speed-demon': {
        name: 'Speed Demon',
        description: 'First referral within 24 hours of signup',
        icon: '⚡',
        rarity: 'common',
      },
      'social-butterfly': {
        name: 'Social Butterfly',
        description: 'Refer from 3 different platforms',
        icon: '🦋',
        rarity: 'uncommon',
      },
      'viral-master': {
        name: 'Viral Master',
        description: 'Referral chain: Your referral referred someone',
        icon: '🦠',
        rarity: 'rare',
      },
      'conversion-king': {
        name: 'Conversion King',
        description: '10 referrals converted to paid',
        icon: '👑',
        rarity: 'epic',
      },
      'community-hero': {
        name: 'Community Hero',
        description: 'Top 10 on leaderboard for 30 days',
        icon: '🦸',
        rarity: 'legendary',
      },
      'founding-member': {
        name: 'Founding Member',
        description: 'One of first 100 users who referred others',
        icon: '🏛️',
        rarity: 'legendary',
        limited: true,
      },
    };
  }

  /**
   * Generate a unique referral code for a user
   */
  async generateReferralCode(userId, options = {}) {
    const code = options.custom || this.generateCode(userId);

    const referral = {
      id: uuidv4(),
      userId,
      code,
      createdAt: new Date(),
      url: `https://ultra-dex.com/?ref=${code}`,
      stats: {
        clicks: 0,
        signups: 0,
        conversions: 0,
        revenue: 0,
        lastClick: null,
      },
      rewards: {
        earned: 0,
        redeemed: 0,
        pending: 0,
      },
      badges: [],
      milestones: [],
      campaign: options.campaign || null,
    };

    await this.saveReferral(referral);

    this.emit('codeGenerated', { userId, code });

    return {
      code,
      url: referral.url,
      shareMessage: this.generateShareMessage(code),
    };
  }

  /**
   * Generate a unique referral code
   */
  generateCode(userId) {
    // Create memorable codes: NAME-XXXX
    const adjectives = ['swift', 'bright', 'bold', 'epic', 'super', 'mega', 'ultra'];
    const nouns = ['dev', 'coder', 'builder', 'creator', 'maker', 'hacker'];

    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(1000 + Math.random() * 9000);

    return `${adj}-${noun}-${num}`;
  }

  /**
   * Track a referral link click
   */
  async trackClick(code, metadata = {}) {
    const referral = await this.getReferralByCode(code);
    if (!referral) return null;

    referral.stats.clicks++;
    referral.stats.lastClick = new Date();

    // Create click event
    const click = {
      id: uuidv4(),
      referralId: referral.id,
      timestamp: new Date(),
      ip: metadata.ip,
      userAgent: metadata.userAgent,
      source: metadata.source || 'direct',
      campaign: metadata.campaign || referral.campaign,
    };

    await this.saveClick(click);
    await this.saveReferral(referral);

    this.emit('clickTracked', { code, referral: referral.userId });

    return {
      referralId: referral.id,
      referrerId: referral.userId,
      cookieExpiry: new Date(Date.now() + this.config.cookieDuration),
    };
  }

  /**
   * Track a signup from referral
   */
  async trackSignup(referredUserId, referrerCode, metadata = {}) {
    const referral = await this.getReferralByCode(referrerCode);
    if (!referral) return null;

    // Prevent self-referral
    if (referral.userId === referredUserId) {
      throw new Error('Self-referral not allowed');
    }

    // Check for duplicate
    const existing = await this.getReferralByReferredUser(referredUserId);
    if (existing) {
      throw new Error('User already referred');
    }

    referral.stats.signups++;

    // Create referral relationship
    const relationship = {
      id: uuidv4(),
      referrerId: referral.userId,
      referredUserId,
      referralId: referral.id,
      code: referrerCode,
      status: 'active',
      createdAt: new Date(),
      convertedAt: null,
      rewards: {
        referrer: [],
        referred: [],
      },
      metadata,
    };

    await this.saveRelationship(relationship);
    await this.saveReferral(referral);

    // Check for milestone rewards
    await this.checkMilestones(referral.userId);

    // Check for badges
    await this.checkBadges(referral.userId);

    this.emit('signupTracked', {
      referrer: referral.userId,
      referred: referredUserId,
      code: referrerCode,
    });

    return relationship;
  }

  /**
   * Track conversion to paid
   */
  async trackConversion(referredUserId, paymentAmount, subscriptionTier) {
    const relationship = await this.getReferralByReferredUser(referredUserId);
    if (!relationship || relationship.status !== 'active') return null;

    const referral = await this.getReferralById(relationship.referralId);

    // Update stats
    referral.stats.conversions++;
    referral.stats.revenue += paymentAmount;

    relationship.status = 'converted';
    relationship.convertedAt = new Date();
    relationship.paymentAmount = paymentAmount;
    relationship.subscriptionTier = subscriptionTier;

    // Calculate reward
    const reward = this.calculateConversionReward(paymentAmount, referral);

    // Add reward to referrer
    relationship.rewards.referrer.push(reward);
    referral.rewards.pending += reward.amount;

    await this.saveRelationship(relationship);
    await this.saveReferral(referral);

    // Update leaderboard
    await this.updateLeaderboard(referral.userId);

    this.emit('conversionTracked', {
      referrer: relationship.referrerId,
      referred: referredUserId,
      amount: paymentAmount,
      reward: reward.amount,
    });

    return reward;
  }

  /**
   * Calculate reward for conversion
   */
  calculateConversionReward(paymentAmount, referral) {
    const baseReward = paymentAmount * this.rewards.conversion.percentage;
    const minReward = this.rewards.conversion.minimum;

    let amount = Math.max(baseReward, minReward);

    // Apply campaign multipliers
    const activeCampaign = this.rewards.campaigns.find((c) => c.active);
    if (activeCampaign && activeCampaign.multiplier) {
      amount *= activeCampaign.multiplier;
    }

    return {
      id: uuidv4(),
      type: 'commission',
      amount,
      percentage: this.rewards.conversion.percentage,
      paymentAmount,
      duration: this.rewards.conversion.duration,
      createdAt: new Date(),
      status: 'pending',
    };
  }

  /**
   * Check and award milestone rewards
   */
  async checkMilestones(userId) {
    const stats = await this.getUserStats(userId);
    const milestones = [];

    for (const milestone of this.rewards.milestones) {
      if (stats.signups >= milestone.required && !stats.milestones.includes(milestone.id)) {
        await this.awardMilestone(userId, milestone);
        milestones.push(milestone);
      }
    }

    return milestones;
  }

  /**
   * Award milestone reward
   */
  async awardMilestone(userId, milestone) {
    const reward = {
      id: uuidv4(),
      userId,
      milestoneId: milestone.id,
      type: milestone.reward.type,
      value: milestone.reward,
      awardedAt: new Date(),
      redeemed: false,
    };

    await this.saveReward(reward);

    // Add to referral record
    const referral = await this.getReferralByUserId(userId);
    if (referral) {
      referral.milestones.push(milestone.id);
      referral.rewards.earned += this.getRewardValue(milestone.reward);
      await this.saveReferral(referral);
    }

    this.emit('milestoneAwarded', { userId, milestone, reward });

    return reward;
  }

  /**
   * Check and award badges
   */
  async checkBadges(userId) {
    const stats = await this.getUserStats(userId);
    const newBadges = [];

    // Speed Demon: First referral within 24h
    if (stats.firstReferralTime) {
      const signupToReferral = stats.firstReferralTime - stats.signupTime;
      if (signupToReferral < 24 * 60 * 60 * 1000 && !stats.badges.includes('speed-demon')) {
        await this.awardBadge(userId, 'speed-demon');
        newBadges.push('speed-demon');
      }
    }

    // Social Butterfly: 3 different sources
    if (stats.uniqueSources >= 3 && !stats.badges.includes('social-butterfly')) {
      await this.awardBadge(userId, 'social-butterfly');
      newBadges.push('social-butterfly');
    }

    // Viral Master: Referral chain exists
    const chainExists = await this.checkReferralChain(userId);
    if (chainExists && !stats.badges.includes('viral-master')) {
      await this.awardBadge(userId, 'viral-master');
      newBadges.push('viral-master');
    }

    // Conversion King: 10 conversions
    if (stats.conversions >= 10 && !stats.badges.includes('conversion-king')) {
      await this.awardBadge(userId, 'conversion-king');
      newBadges.push('conversion-king');
    }

    return newBadges;
  }

  /**
   * Award a badge
   */
  async awardBadge(userId, badgeId) {
    const badge = this.badges[badgeId];
    if (!badge) return null;

    const award = {
      id: uuidv4(),
      userId,
      badgeId,
      badge,
      awardedAt: new Date(),
    };

    await this.saveBadge(award);

    const referral = await this.getReferralByUserId(userId);
    if (referral) {
      referral.badges.push(badgeId);
      await this.saveReferral(referral);
    }

    this.emit('badgeAwarded', { userId, badgeId, badge });

    return award;
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit = 10) {
    const sorted = Array.from(this.leaderboard.entries())
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, limit);

    return sorted.map(([userId, data], index) => ({
      rank: index + 1,
      userId,
      ...data,
    }));
  }

  /**
   * Update leaderboard
   */
  async updateLeaderboard(userId) {
    const stats = await this.getUserStats(userId);

    // Calculate score
    const score = stats.signups * 10 + stats.conversions * 100 + stats.revenue * 0.1;

    this.leaderboard.set(userId, {
      score,
      signups: stats.signups,
      conversions: stats.conversions,
      revenue: stats.revenue,
      lastUpdated: new Date(),
    });

    // Check for Community Hero badge
    const leaderboard = await this.getLeaderboard(10);
    const isTop10 = leaderboard.find((entry) => entry.userId === userId);

    if (isTop10) {
      // Track consecutive days in top 10
      // Award badge after 30 days
    }
  }

  /**
   * Get user referral stats
   */
  async getUserStats(userId) {
    const referral = await this.getReferralByUserId(userId);
    if (!referral) return null;

    const relationships = await this.getRelationshipsByReferrer(userId);

    return {
      code: referral.code,
      url: referral.url,
      clicks: referral.stats.clicks,
      signups: referral.stats.signups,
      conversions: referral.stats.conversions,
      revenue: referral.stats.revenue,
      conversionRate:
        referral.stats.signups > 0
          ? ((referral.stats.conversions / referral.stats.signups) * 100).toFixed(1)
          : 0,
      rewards: referral.rewards,
      badges: referral.badges,
      milestones: referral.milestones,
      rank: await this.getUserRank(userId),
      nextMilestone: this.getNextMilestone(referral.stats.signups),
    };
  }

  /**
   * Get user's rank on leaderboard
   */
  async getUserRank(userId) {
    const leaderboard = await this.getLeaderboard(1000);
    const entry = leaderboard.find((e) => e.userId === userId);
    return entry ? entry.rank : null;
  }

  /**
   * Get next milestone
   */
  getNextMilestone(currentSignups) {
    for (const milestone of this.rewards.milestones) {
      if (currentSignups < milestone.required) {
        return {
          ...milestone,
          remaining: milestone.required - currentSignups,
          progress: ((currentSignups / milestone.required) * 100).toFixed(1),
        };
      }
    }
    return null;
  }

  /**
   * Generate share message
   */
  generateShareMessage(code) {
    const messages = [
      `I just found the best AI memory tool! Use my link to get early access: https://ultra-dex.com/?ref=${code}`,
      `Never lose AI context again! Join me on Ultra-Dex: https://ultra-dex.com/?ref=${code}`,
      `Switch AI models without losing context? Yes please! https://ultra-dex.com/?ref=${code}`,
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Share on social platforms
   */
  async generateSocialShare(userId, platform) {
    const referral = await this.getReferralByUserId(userId);
    const stats = await this.getUserStats(userId);

    const templates = {
      twitter: {
        text: `I just found the best AI memory tool! 🚀\n\nUltra-Dex lets you switch between GPT-4, Claude, and other models WITHOUT losing context.\n\nJoin me: ${referral.url}\n\n#AI #OpenAI #Claude #DeveloperTools`,
        hashtags: ['AI', 'OpenAI', 'Claude', 'DeveloperTools'],
      },
      linkedin: {
        text: `Excited to share Ultra-Dex - a game-changing AI orchestration platform I've been using.\n\nIt solves the #1 problem with AI tools: context loss when switching models.\n\nKey features:\n✅ Cross-model memory preservation\n✅ Agent orchestration\n✅ Cost optimization\n\nCheck it out: ${referral.url}\n\n#ArtificialIntelligence #DeveloperTools #Innovation`,
      },
      facebook: {
        text: `Found an amazing tool for anyone working with AI! Ultra-Dex lets you use multiple AI models together seamlessly. No more repeating yourself! ${referral.url}`,
      },
      email: {
        subject: 'This AI tool changed how I work',
        body: `Hey!\n\nI wanted to share a tool I've been using called Ultra-Dex.\n\nIt solves a problem you probably have: losing context when switching between AI models like GPT-4 and Claude.\n\nWith Ultra-Dex, you can:\n- Start with GPT-4 for reasoning\n- Switch to Claude for code\n- Try Kimi for speed\n- All with perfect context preservation\n\nCheck it out: ${referral.url}\n\nLet me know what you think!`,
      },
    };

    return templates[platform] || templates.twitter;
  }

  // Database helper methods (replace with real DB calls)
  async saveReferral(referral) {
    this.db.set(`referral:${referral.id}`, referral);
  }

  async getReferralById(id) {
    return this.db.get(`referral:${id}`);
  }

  async getReferralByCode(code) {
    for (const [key, value] of this.db) {
      if (key.startsWith('referral:') && value.code === code) {
        return value;
      }
    }
    return null;
  }

  async getReferralByUserId(userId) {
    for (const [key, value] of this.db) {
      if (key.startsWith('referral:') && value.userId === userId) {
        return value;
      }
    }
    return null;
  }

  async getReferralByReferredUser(referredUserId) {
    for (const [key, value] of this.db) {
      if (key.startsWith('relationship:') && value.referredUserId === referredUserId) {
        return value;
      }
    }
    return null;
  }

  async saveRelationship(relationship) {
    this.db.set(`relationship:${relationship.id}`, relationship);
  }

  async getRelationshipsByReferrer(referrerId) {
    const relationships = [];
    for (const [key, value] of this.db) {
      if (key.startsWith('relationship:') && value.referrerId === referrerId) {
        relationships.push(value);
      }
    }
    return relationships;
  }

  async saveClick(click) {
    this.db.set(`click:${click.id}`, click);
  }

  async saveReward(reward) {
    this.db.set(`reward:${reward.id}`, reward);
  }

  async saveBadge(badge) {
    this.db.set(`badge:${badge.id}`, badge);
  }

  checkReferralChain(userId) {
    // Check if any of user's referrals have made referrals
    return false; // Simplified for demo
  }

  getRewardValue(reward) {
    if (reward.type === 'credits') return reward.amount;
    if (reward.type === 'subscription') return reward.duration * 10; // Approximate value
    return 0;
  }
}

// Export
module.exports = ReferralSystem;

// Demo
if (require.main === module) {
  const system = new ReferralSystem();

  // Simulate referral flow
  async function demo() {
    console.log('🎯 REFERRAL SYSTEM DEMO\n');

    // Generate referral code
    const { code, url } = await system.generateReferralCode('user-123');
    console.log(`Referral code generated: ${code}`);
    console.log(`URL: ${url}\n`);

    // Track clicks
    await system.trackClick(code, { source: 'twitter', ip: '1.2.3.4' });
    await system.trackClick(code, { source: 'twitter', ip: '1.2.3.5' });
    await system.trackClick(code, { source: 'linkedin', ip: '1.2.3.6' });
    console.log('3 clicks tracked from Twitter and LinkedIn\n');

    // Track signups
    await system.trackSignup('user-456', code, { source: 'twitter' });
    await system.trackSignup('user-789', code, { source: 'linkedin' });
    console.log('2 signups tracked\n');

    // Track conversion
    await system.trackConversion('user-456', 49, 'pro');
    console.log('1 conversion tracked ($49 payment)\n');

    // Get stats
    const stats = await system.getUserStats('user-123');
    console.log('📊 REFERRER STATS:');
    console.log(JSON.stringify(stats, null, 2));
  }

  demo().catch(console.error);
}
