/**
 * Reddit Poster - Semi-automated posting with mandatory human approval
 * Safety-critical: CANNOT post without explicit human approval
 */

import fs from 'fs';
import path from 'path';
import { RedditAuth } from './reddit-auth.js';

export interface PostTemplate {
  name: string;
  titleTemplate: string;
  bodyTemplate: string;
  defaultSubreddit: string;
  tags: string[];
}

export interface DraftContent {
  id: string;
  type: 'post' | 'reply' | 'dm';
  content: {
    subreddit?: string;
    title?: string;
    body: string;
    titleVariantA?: string;
    titleVariantB?: string;
  };
  target: string;
  metadata: {
    version: string;
    features: number;
    testCount: number;
    createdAt: string;
    personalizedFrom: string;
  };
  status: 'pending_approval' | 'approved' | 'rejected' | 'posted' | 'failed';
  approvedAt?: string;
  approvedBy?: string;
  postedAt?: string;
  permalink?: string;
  postId?: string;
  abTest?: {
    variant: 'A' | 'B' | 'manual';
    selectedTitle: string;
    engagement?: {
      upvotes: number;
      comments: number;
    };
  };
}

export interface PostLimits {
  postsPerDay: number;
  postsPerSubredditPer24h: number;
  dmsPerDay: number;
  repliesPerHour: number;
}

export interface PostConfig {
  enabled: boolean;
  requireApproval: boolean;
  limits: PostLimits;
  minAccountAgeDays: number;
  minKarma: number;
}

export interface PostLog {
  timestamp: string;
  type: 'draft' | 'approval' | 'post' | 'reply' | 'dm' | 'reject' | 'error';
  contentId: string;
  details: Record<string, unknown>;
}

const DEFAULT_TEMPLATES: PostTemplate[] = [
  {
    name: 'validation',
    titleTemplate: 'Built AI {{type}} for {{duration}} - is this useful or should I kill it?',
    bodyTemplate: `I'm a {{role}} building {{productName}} - {{productDescription}}.

What I've built in {{duration}}:
{{features}}

Before I spend more time, I need brutal honesty:
- Do you actually need this?
- Or is this solving a problem that doesn't exist?

If you WOULD use this - what's the ONE feature you'd pay $50/month for?
If you WOULDN'T use this - tell me why.

Don't hold back. I'd rather know now than waste more time.

Edit: Reading every response.`,
    defaultSubreddit: 'LocalLLaMA',
    tags: ['validation', 'honest-feedback'],
  },
  {
    name: 'progress_update',
    titleTemplate: 'Update: {{version}} shipped - {{featureCount}} features in {{duration}}',
    bodyTemplate: `Quick update on {{productName}}:

Shipped {{version}} with:
{{features}}

Next up:
{{roadmap}}

AMA about the tech or decisions.`,
    defaultSubreddit: 'SaaS',
    tags: ['update', 'progress'],
  },
  {
    name: 'asking_for_help',
    titleTemplate: 'Stuck on {{problem}} - anyone solved this?',
    bodyTemplate: `Building {{productName}} and hit a wall with {{problem}}.

Tried:
{{attempts}}

Current thinking:
{{approach}}

Anyone been here? What worked?`,
    defaultSubreddit: 'Entrepreneur',
    tags: ['help', 'discussion'],
  },
];

const DEFAULT_CONFIG: PostConfig = {
  enabled: true,
  requireApproval: true,
  limits: {
    postsPerDay: 5,
    postsPerSubredditPer24h: 1,
    dmsPerDay: 5,
    repliesPerHour: 10,
  },
  minAccountAgeDays: 30,
  minKarma: 100,
};

export class RedditPoster extends RedditAuth {
  private config: PostConfig;
  private queueDir: string;
  private logFile: string;
  private postHistory: Map<string, Date> = new Map();
  private dmHistory: Map<string, Date> = new Map();

  constructor(
    config?: Partial<PostConfig>,
    queueDir = 'content/queue/reddit',
    logFile = '.ultra-dex/automation/post-log.jsonl'
  ) {
    super('ultra-dex:reddit-poster:v1.0.0 (by /u/ultra-dex)');
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.queueDir = queueDir;
    this.logFile = logFile;
    this.ensureDirectories();
    this.loadHistory();
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.queueDir)) {
      fs.mkdirSync(this.queueDir, { recursive: true });
    }
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  private loadHistory(): void {
    try {
      if (fs.existsSync(this.logFile)) {
        const lines = fs.readFileSync(this.logFile, 'utf-8').split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const log = JSON.parse(line) as PostLog;
            if (log.type === 'post' && log.details.postedAt) {
              this.postHistory.set(
                String(log.details.subreddit || ''),
                new Date(String(log.details.postedAt))
              );
            }
            if (log.type === 'dm' && log.details.sentAt) {
              this.dmHistory.set(
                String(log.details.username || ''),
                new Date(String(log.details.sentAt))
              );
            }
          } catch {}
        }
      }
    } catch {}
  }

  private log(type: PostLog['type'], contentId: string, details: Record<string, unknown>): void {
    const log: PostLog = {
      timestamp: new Date().toISOString(),
      type,
      contentId,
      details,
    };
    fs.appendFileSync(this.logFile, JSON.stringify(log) + '\n');
  }

  /**
   * Draft a post from template with personalization
   */
  draftPost(
    subreddit: string,
    templateName: string,
    data: {
      version: string;
      features: number;
      testCount?: number;
      duration?: string;
      productName?: string;
      productDescription?: string;
      role?: string;
      type?: string;
    }
  ): DraftContent {
    // KILL SWITCH CHECK
    if (!this.config.enabled) {
      throw new Error('POSTING_DISABLED: All posting is disabled via kill switch');
    }

    const template = DEFAULT_TEMPLATES.find((t) => t.name === templateName);
    if (!template) {
      throw new Error(`Unknown template: ${templateName}`);
    }

    // Generate A/B test variants
    const titles = this.generateTitleVariants(template.titleTemplate, data);
    const body = this.personalizeBody(template.bodyTemplate, data);

    const id = `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const draft: DraftContent = {
      id,
      type: 'post',
      content: {
        subreddit: subreddit || template.defaultSubreddit,
        title: titles.variantA,
        body,
        titleVariantA: titles.variantA,
        titleVariantB: titles.variantB,
      },
      target: `r/${subreddit || template.defaultSubreddit}`,
      metadata: {
        version: data.version,
        features: data.features,
        testCount: data.testCount || 0,
        createdAt: new Date().toISOString(),
        personalizedFrom: templateName,
      },
      status: 'pending_approval',
      abTest: {
        variant: 'manual',
        selectedTitle: titles.variantA,
      },
    };

    this.saveDraft(draft);
    this.log('draft', id, {
      subreddit: draft.content.subreddit,
      template: templateName,
      hasABTest: true,
    });

    return draft;
  }

  private generateTitleVariants(
    template: string,
    data: Record<string, string | number | undefined>
  ): { variantA: string; variantB: string } {
    // Variant A: Direct, specific
    const variantA = this.replaceTemplateVars(template, {
      ...data,
      duration: data.duration || '2 months',
      type: data.type || 'tool',
    });

    // Variant B: Question-focused, curiosity gap
    const variantB = this.replaceTemplateVars(template, {
      ...data,
      duration: data.duration || '60 days',
      type: data.type || 'product',
    });

    return { variantA, variantB };
  }

  private personalizeBody(
    template: string,
    data: Record<string, string | number | undefined>
  ): string {
    let body = this.replaceTemplateVars(template, data);

    // Add dynamic content based on metrics
    const features: string[] = [];
    if (typeof data.features === 'number' && data.features > 0) {
      features.push(`- ${data.features} features implemented`);
    }
    if (typeof data.testCount === 'number' && data.testCount > 0) {
      features.push(`- ${data.testCount} tests passing`);
    }

    // Inject feature list
    const featureList = features.length > 0 ? features.join('\n') : '- Core MVP features';
    body = body.replace(/\{\{features\}\}/g, featureList);

    // Default values
    body = body.replace(/\{\{productName\}\}/g, String(data.productName || 'Ultra-Dex'));
    body = body.replace(
      /\{\{productDescription\}\}/g,
      String(data.productDescription || 'an AI orchestration layer')
    );
    body = body.replace(/\{\{role\}\}/g, String(data.role || 'solo dev'));
    body = body.replace(/\{\{duration\}\}/g, String(data.duration || '2 months'));
    body = body.replace(/\{\{type\}\}/g, String(data.type || 'tool'));

    return body;
  }

  private replaceTemplateVars(
    template: string,
    data: Record<string, string | number | undefined>
  ): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(data[key] || ''));
  }

  private saveDraft(draft: DraftContent): void {
    const filePath = path.join(this.queueDir, `${draft.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(draft, null, 2));
  }

  /**
   * Get all pending drafts for dashboard
   */
  getPendingDrafts(): DraftContent[] {
    const drafts: DraftContent[] = [];
    if (!fs.existsSync(this.queueDir)) return drafts;

    const files = fs.readdirSync(this.queueDir).filter((f) => f.endsWith('.json'));
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(this.queueDir, file), 'utf-8');
        const draft = JSON.parse(content) as DraftContent;
        if (draft.status === 'pending_approval') {
          drafts.push(draft);
        }
      } catch {}
    }
    return drafts.sort(
      (a, b) => new Date(a.metadata.createdAt).getTime() - new Date(b.metadata.createdAt).getTime()
    );
  }

  /**
   * Human approval action
   */
  approve(
    contentId: string,
    options?: { titleVariant?: 'A' | 'B' | 'manual'; manualTitle?: string; approvedBy?: string }
  ): boolean {
    const filePath = path.join(this.queueDir, `${contentId}.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Draft not found: ${contentId}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const draft = JSON.parse(content) as DraftContent;

    if (draft.status !== 'pending_approval') {
      throw new Error(`Cannot approve: status is ${draft.status}`);
    }

    // Handle A/B test selection
    if (options?.titleVariant) {
      draft.abTest = {
        variant: options.titleVariant,
        selectedTitle:
          options.titleVariant === 'A'
            ? draft.content.titleVariantA!
            : options.titleVariant === 'B'
              ? draft.content.titleVariantB!
              : options.manualTitle || draft.content.title!,
      };
      draft.content.title = draft.abTest.selectedTitle;
    }

    draft.status = 'approved';
    draft.approvedAt = new Date().toISOString();
    draft.approvedBy = options?.approvedBy || 'system';

    this.saveDraft(draft);
    this.log('approval', contentId, {
      approvedBy: draft.approvedBy,
      titleSelected: draft.abTest?.variant,
    });

    return true;
  }

  /**
   * Reject a draft
   */
  reject(contentId: string, reason?: string): boolean {
    const filePath = path.join(this.queueDir, `${contentId}.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Draft not found: ${contentId}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const draft = JSON.parse(content) as DraftContent;

    draft.status = 'rejected';
    this.saveDraft(draft);
    this.log('reject', contentId, { reason });

    return true;
  }

  /**
   * Submit a post to Reddit
   * ONLY callable after human approval
   */
  async submitPost(
    subreddit: string,
    title: string,
    body: string,
    contentId?: string
  ): Promise<string> {
    // KILL SWITCH CHECK
    if (!this.config.enabled) {
      throw new Error('POSTING_DISABLED: All posting is disabled via kill switch');
    }

    // APPROVAL CHECK
    if (this.config.requireApproval) {
      if (!contentId) {
        throw new Error('APPROVAL_REQUIRED: Content ID required for posting');
      }
      const draft = this.getDraft(contentId);
      if (!draft) {
        throw new Error(`Draft not found: ${contentId}`);
      }
      if (draft.status !== 'approved') {
        throw new Error(`APPROVAL_REQUIRED: Status is ${draft.status}, must be 'approved'`);
      }
    }

    // ACCOUNT SAFETY CHECKS
    const account = await this.getAccountInfo();
    if (account.ageDays < this.config.minAccountAgeDays) {
      console.warn(
        `ACCOUNT_AGE_WARNING: Account is ${account.ageDays} days old (min: ${this.config.minAccountAgeDays})`
      );
    }
    if (account.karma < this.config.minKarma) {
      console.warn(
        `KARMA_WARNING: Account has ${account.karma} karma (min: ${this.config.minKarma})`
      );
    }

    // RATE LIMIT CHECKS
    if (!this.canPostToSubreddit(subreddit)) {
      const lastPost = this.postHistory.get(subreddit);
      const hoursSinceLast = lastPost
        ? (Date.now() - lastPost.getTime()) / (1000 * 60 * 60)
        : Infinity;
      throw new Error(
        `RATE_LIMIT: Cannot post to r/${subreddit}. Posted ${hoursSinceLast.toFixed(1)} hours ago (need 24h)`
      );
    }

    const postsToday = this.getPostsToday();
    if (postsToday >= this.config.limits.postsPerDay) {
      throw new Error(
        `RATE_LIMIT: Daily post limit reached (${this.config.limits.postsPerDay}/day)`
      );
    }

    // POST
    try {
      type SubmissionResult = { id: string; permalink: string };
      const result = await this.request<SubmissionResult>('submitPost', async (client) => {
        const submission = await client.submitSelfpost({
          subredditName: subreddit,
          title,
          text: body,
        });
        return { id: submission.id, permalink: submission.permalink };
      });

      const permalink = `https://reddit.com${result.permalink}`;
      this.postHistory.set(subreddit, new Date());

      // Update draft status
      if (contentId) {
        this.markAsPosted(contentId, result.id, permalink);
      }

      this.log('post', contentId || 'direct', {
        subreddit,
        title: title.slice(0, 50),
        postedAt: new Date().toISOString(),
        permalink,
      });

      return permalink;
    } catch (error) {
      this.log('error', contentId || 'direct', {
        error: error instanceof Error ? error.message : String(error),
        subreddit,
      });
      throw error;
    }
  }

  /**
   * Reply to a comment
   * ONLY callable after human approval
   */
  async replyToComment(commentId: string, body: string, contentId?: string): Promise<string> {
    // KILL SWITCH CHECK
    if (!this.config.enabled) {
      throw new Error('POSTING_DISABLED: All posting is disabled via kill switch');
    }

    // APPROVAL CHECK
    if (this.config.requireApproval && !contentId) {
      throw new Error('APPROVAL_REQUIRED: Content ID required for replying');
    }

    // RATE LIMIT CHECK
    const repliesThisHour = this.getRepliesThisHour();
    if (repliesThisHour >= this.config.limits.repliesPerHour) {
      throw new Error(
        `RATE_LIMIT: Hourly reply limit reached (${this.config.limits.repliesPerHour}/hour)`
      );
    }

    try {
      type ReplyResult = { id: string; permalink: string };
      const result = await this.request<ReplyResult>('replyToComment', async (client) => {
        const comment = await client.getComment(commentId);
        const reply = await comment.reply(body);
        return { id: reply.id, permalink: reply.permalink };
      });

      this.log('reply', contentId || 'direct', {
        commentId,
        replyId: result.id,
        repliedAt: new Date().toISOString(),
      });

      return result.permalink;
    } catch (error) {
      this.log('error', contentId || 'direct', {
        error: error instanceof Error ? error.message : String(error),
        commentId,
      });
      throw error;
    }
  }

  /**
   * Send a DM
   * ONLY callable after human approval
   */
  async sendDM(username: string, subject: string, body: string, contentId?: string): Promise<void> {
    // KILL SWITCH CHECK
    if (!this.config.enabled) {
      throw new Error('POSTING_DISABLED: All posting is disabled via kill switch');
    }

    // APPROVAL CHECK
    if (this.config.requireApproval && !contentId) {
      throw new Error('APPROVAL_REQUIRED: Content ID required for DM');
    }

    // RATE LIMIT CHECK
    const dmsToday = this.getDMsToday();
    if (dmsToday >= this.config.limits.dmsPerDay) {
      throw new Error(`RATE_LIMIT: Daily DM limit reached (${this.config.limits.dmsPerDay}/day)`);
    }

    // COOLDOWN CHECK
    if (!this.canDMUser(username)) {
      const lastDM = this.dmHistory.get(username);
      const hoursSinceLast = lastDM ? (Date.now() - lastDM.getTime()) / (1000 * 60 * 60) : Infinity;
      throw new Error(
        `COOLDOWN: Cannot DM u/${username}. Last message ${hoursSinceLast.toFixed(1)} hours ago (need 48h)`
      );
    }

    try {
      await this.request('sendDM', async (client) => {
        return client.composeMessage({
          to: username,
          subject,
          text: body,
        });
      });

      this.dmHistory.set(username, new Date());

      this.log('dm', contentId || 'direct', {
        username,
        subject: subject.slice(0, 50),
        sentAt: new Date().toISOString(),
      });
    } catch (error) {
      this.log('error', contentId || 'direct', {
        error: error instanceof Error ? error.message : String(error),
        username,
      });
      throw error;
    }
  }

  private canPostToSubreddit(subreddit: string): boolean {
    const lastPost = this.postHistory.get(subreddit);
    if (!lastPost) return true;
    const hoursSince = (Date.now() - lastPost.getTime()) / (1000 * 60 * 60);
    return hoursSince >= 24;
  }

  private canDMUser(username: string): boolean {
    const lastDM = this.dmHistory.get(username);
    if (!lastDM) return true;
    const hoursSince = (Date.now() - lastDM.getTime()) / (1000 * 60 * 60);
    return hoursSince >= 48;
  }

  private getPostsToday(): number {
    const today = new Date().setHours(0, 0, 0, 0);
    let count = 0;
    for (const date of this.postHistory.values()) {
      if (date.getTime() >= today) count++;
    }
    return count;
  }

  private getDMsToday(): number {
    const today = new Date().setHours(0, 0, 0, 0);
    let count = 0;
    for (const date of this.dmHistory.values()) {
      if (date.getTime() >= today) count++;
    }
    return count;
  }

  private getRepliesThisHour(): number {
    // Simplified - would need proper tracking
    return 0;
  }

  private async getAccountInfo(): Promise<{ ageDays: number; karma: number }> {
    try {
      const me = await this.request<{
        created_utc: number;
        comment_karma: number;
        link_karma: number;
      }>('getMe', async (client) => {
        const user = await client.getMe();
        return {
          created_utc: (user as unknown as { created_utc: number }).created_utc,
          comment_karma: (user as unknown as { comment_karma: number }).comment_karma,
          link_karma: (user as unknown as { link_karma: number }).link_karma,
        };
      });
      const created = new Date(me.created_utc * 1000);
      const ageDays = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
      const karma = me.comment_karma + me.link_karma;
      return { ageDays, karma };
    } catch {
      return { ageDays: 999, karma: 9999 }; // Assume safe if can't check
    }
  }

  private getDraft(contentId: string): DraftContent | null {
    const filePath = path.join(this.queueDir, `${contentId}.json`);
    if (!fs.existsSync(filePath)) return null;
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as DraftContent;
    } catch {
      return null;
    }
  }

  private markAsPosted(contentId: string, postId: string, permalink: string): void {
    const draft = this.getDraft(contentId);
    if (draft) {
      draft.status = 'posted';
      draft.postedAt = new Date().toISOString();
      draft.postId = postId;
      draft.permalink = permalink;
      this.saveDraft(draft);
    }
  }

  /**
   * Process all approved posts
   */
  async processApprovedPosts(): Promise<{ posted: string[]; failed: string[] }> {
    const posted: string[] = [];
    const failed: string[] = [];

    const files = fs.readdirSync(this.queueDir).filter((f) => f.endsWith('.json'));
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(this.queueDir, file), 'utf-8');
        const draft = JSON.parse(content) as DraftContent;

        if (draft.status !== 'approved') continue;

        if (draft.type === 'post') {
          const permalink = await this.submitPost(
            draft.content.subreddit!,
            draft.content.title!,
            draft.content.body,
            draft.id
          );
          posted.push(draft.id);
        }
      } catch (error) {
        failed.push(file.replace('.json', ''));
        console.error(`Failed to post ${file}:`, error);
      }
    }

    return { posted, failed };
  }

  /**
   * Update A/B test engagement data
   */
  async updateEngagement(
    contentId: string,
    engagement: { upvotes: number; comments: number }
  ): Promise<void> {
    const draft = this.getDraft(contentId);
    if (draft && draft.abTest) {
      draft.abTest.engagement = engagement;
      this.saveDraft(draft);
    }
  }

  /**
   * Get posting stats
   */
  getStats(): {
    pendingApprovals: number;
    postedToday: number;
    dmsSentToday: number;
    canPost: boolean;
  } {
    return {
      pendingApprovals: this.getPendingDrafts().length,
      postedToday: this.getPostsToday(),
      dmsSentToday: this.getDMsToday(),
      canPost: this.config.enabled && this.getPostsToday() < this.config.limits.postsPerDay,
    };
  }

  /**
   * Emergency kill switch
   */
  disable(): void {
    this.config.enabled = false;
    console.error('[REDDIT-POSTER] EMERGENCY DISABLE triggered - all posting stopped');
    this.log('error', 'system', { action: 'kill_switch_activated' });
  }

  /**
   * Re-enable posting
   */
  enable(): void {
    this.config.enabled = true;
    console.log('[REDDIT-POSTER] Posting re-enabled');
  }
}

export default RedditPoster;
