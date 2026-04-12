/**
 * Content Drafter - Template-based content generation for social media
 * Creates platform-optimized content from Ultra-Dex metrics and user data
 */

import fs from 'fs';
import path from 'path';
import { AutoCEOState } from './state-store.js';

export interface ContentDraft {
  id: string;
  platform: 'twitter' | 'linkedin' | 'reddit' | 'blog';
  content: string;
  title?: string;
  tags: string[];
  status: 'draft' | 'approved' | 'rejected' | 'posted';
  scheduledFor?: string;
  approvedBy?: string;
  postedAt?: string;
  metrics?: {
    engagement?: number;
    impressions?: number;
    clicks?: number;
  };
  sourceData: {
    type: 'milestone' | 'insight' | 'quote' | 'feature' | 'comparison';
    reference: string;
  };
}

export interface ContentTemplate {
  name: string;
  platform: 'twitter' | 'linkedin' | 'reddit' | 'blog';
  tone: 'professional' | 'casual' | 'excited' | 'thoughtful';
  maxLength: number;
  template: string;
  variables: string[];
  tags: string[];
}

export interface DraftConfig {
  outputDir: string;
  templatesDir: string;
  maxDraftsPerWeek: number;
}

const DEFAULT_TEMPLATES: ContentTemplate[] = [
  {
    name: 'milestone_tweet',
    platform: 'twitter',
    tone: 'excited',
    maxLength: 280,
    template:
      '🚀 {{productName}} v{{version}} shipped!\n\n{{highlight}}\n\nBuilt by a solo dev in {{duration}}.\n\nAMA about the tech decisions 👇',
    variables: ['productName', 'version', 'highlight', 'duration'],
    tags: ['milestone', 'launch', 'buildinpublic'],
  },
  {
    name: 'validation_tweet',
    platform: 'twitter',
    tone: 'thoughtful',
    maxLength: 280,
    template:
      'Question for devs:\n\n{{question}}\n\nContext: {{context}}\n\nWhat would make this actually useful for you?',
    variables: ['question', 'context'],
    tags: ['validation', 'question'],
  },
  {
    name: 'progress_tweet',
    platform: 'twitter',
    tone: 'professional',
    maxLength: 280,
    template:
      'Day {{day}} building {{productName}}:\n\n✅ {{completed}}\n⏳ {{inProgress}}\n🎯 {{goal}}\n\n#buildinpublic #{{hashtag}}',
    variables: ['day', 'productName', 'completed', 'inProgress', 'goal', 'hashtag'],
    tags: ['progress', 'buildinpublic'],
  },
  {
    name: 'linkedin_update',
    platform: 'linkedin',
    tone: 'professional',
    maxLength: 3000,
    template: `Quick update on {{productName}} (v{{version}}):\n\n**What we shipped:**\n{{features}}\n\n**Key insight from users:**\n{{insight}}\n\n**What changed:**\n{{pivot}}\n\n**Looking ahead:**\n{{roadmap}}\n\nWhat's your experience with {{topic}}?\n\n#{{hashtag1}} #{{hashtag2}}`,
    variables: [
      'productName',
      'version',
      'features',
      'insight',
      'pivot',
      'roadmap',
      'topic',
      'hashtag1',
      'hashtag2',
    ],
    tags: ['update', 'startup'],
  },
  {
    name: 'linkedin_technical',
    platform: 'linkedin',
    tone: 'thoughtful',
    maxLength: 3000,
    template: `A technical challenge we solved building {{productName}}:\n\n**The Problem:**\n{{problem}}\n\n**What we tried:**\n{{attempts}}\n\n**The solution:**\n{{solution}}\n\n**Impact:**\n{{impact}}\n\n**Key lesson:**\n{{lesson}}\n\n#{{hashtag1}} #{{hashtag2}}`,
    variables: [
      'productName',
      'problem',
      'attempts',
      'solution',
      'impact',
      'lesson',
      'hashtag1',
      'hashtag2',
    ],
    tags: ['technical', 'engineering'],
  },
  {
    name: 'reddit_validation',
    platform: 'reddit',
    tone: 'casual',
    maxLength: 4000,
    template: `I'm a solo dev building {{productName}} - {{description}}.\n\nWhat I've built in {{duration}}:\n{{features}}\n\nBefore I spend more time, I need brutal honesty:\n- Do you actually need this?\n- Or is this solving a problem that doesn't exist?\n\nIf you WOULD use this - what's the ONE feature you'd pay $50/month for?\nIf you WOULDN'T use this - tell me why. Don't hold back.\n\nEdit: Reading every response. Thanks for any feedback.`,
    variables: ['productName', 'description', 'duration', 'features'],
    tags: ['validation', 'feedback'],
  },
  {
    name: 'reddit_update',
    platform: 'reddit',
    tone: 'professional',
    maxLength: 4000,
    template: `[Update] {{productName}} v{{version}} - {{headline}}\n\n**Since last update ({{duration}} ago):**\n{{changes}}\n\n**Most requested feature:** {{topRequest}}\n**Status:** {{status}}\n\n**Next milestone:** {{nextMilestone}}\n\n**Links:**\n- GitHub: {{githubUrl}}\n- Demo: {{demoUrl}}\n\nHappy to answer questions or take feature requests.`,
    variables: [
      'productName',
      'version',
      'headline',
      'duration',
      'changes',
      'topRequest',
      'status',
      'nextMilestone',
      'githubUrl',
      'demoUrl',
    ],
    tags: ['update', 'showcase'],
  },
  {
    name: 'blog_deep_dive',
    platform: 'blog',
    tone: 'thoughtful',
    maxLength: 10000,
    template: `---\ntitle: "{{title}}"\ndate: {{date}}\nauthor: {{author}}\ntags: [{{tags}}]\n---\n\n# {{title}}\n\n{{introduction}}\n\n## The Problem\n\n{{problemDescription}}\n\n## Our Approach\n\n{{approach}}\n\n## Technical Details\n\n{{technicalDetails}}\n\n## Results\n\n{{results}}\n\n## What's Next\n\n{{nextSteps}}\n\n---\n\n*Building {{productName}}. Follow the journey at {{url}}.*`,
    variables: [
      'title',
      'date',
      'author',
      'tags',
      'introduction',
      'problemDescription',
      'approach',
      'technicalDetails',
      'results',
      'nextSteps',
      'productName',
      'url',
    ],
    tags: ['blog', 'deep-dive'],
  },
];

const DEFAULT_CONFIG: DraftConfig = {
  outputDir: 'content/queue',
  templatesDir: 'content/templates',
  maxDraftsPerWeek: 21, // 7 tweets + 3 LinkedIn + rest varies
};

export class ContentDrafter {
  private config: DraftConfig;
  private state: AutoCEOState;
  private templates: Map<string, ContentTemplate> = new Map();

  constructor(config?: Partial<DraftConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = new AutoCEOState('.ultra-dex/automation/drafts-state.json');
    this.loadTemplates();
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    const platforms = ['twitter', 'linkedin', 'reddit', 'blog'];
    for (const platform of platforms) {
      const dir = path.join(this.config.outputDir, platform);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    if (!fs.existsSync(this.config.templatesDir)) {
      fs.mkdirSync(this.config.templatesDir, { recursive: true });
    }
  }

  private loadTemplates(): void {
    // Load built-in templates
    for (const template of DEFAULT_TEMPLATES) {
      this.templates.set(template.name, template);
    }

    // Load custom templates from disk
    if (fs.existsSync(this.config.templatesDir)) {
      const files = fs.readdirSync(this.config.templatesDir).filter((f) => f.endsWith('.json'));
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(this.config.templatesDir, file), 'utf-8');
          const template = JSON.parse(content) as ContentTemplate;
          this.templates.set(template.name, template);
        } catch {}
      }
    }
  }

  /**
   * Draft a tweet based on data
   */
  draftTweet(
    templateName: 'milestone' | 'validation' | 'progress' | 'insight',
    data: Record<string, string | number>
  ): ContentDraft {
    const templateMap: Record<string, string> = {
      milestone: 'milestone_tweet',
      validation: 'validation_tweet',
      progress: 'progress_tweet',
      insight: 'validation_tweet',
    };

    const template = this.templates.get(templateMap[templateName]);
    if (!template) {
      throw new Error(`Unknown template: ${templateName}`);
    }

    const content = this.fillTemplate(template, {
      ...data,
      productName: data.productName || 'Ultra-Dex',
      day: data.day || this.getBuildDay(),
    });

    return this.createDraft('twitter', content, template.tags, templateName, data);
  }

  /**
   * Draft a LinkedIn post
   */
  draftLinkedInPost(
    templateName: 'update' | 'technical',
    data: Record<string, string | number>
  ): ContentDraft {
    const templateMap: Record<string, string> = {
      update: 'linkedin_update',
      technical: 'linkedin_technical',
    };

    const template = this.templates.get(templateMap[templateName]);
    if (!template) {
      throw new Error(`Unknown template: ${templateName}`);
    }

    const content = this.fillTemplate(template, {
      ...data,
      productName: data.productName || 'Ultra-Dex',
      hashtag1: data.hashtag1 || 'AI',
      hashtag2: data.hashtag2 || 'Startups',
    });

    return this.createDraft(
      'linkedin',
      content,
      template.tags,
      templateName,
      data,
      data.title as string
    );
  }

  /**
   * Draft a Reddit post
   */
  draftRedditPost(
    templateName: 'validation' | 'update',
    subreddit: string,
    data: Record<string, string | number>
  ): ContentDraft {
    const templateMap: Record<string, string> = {
      validation: 'reddit_validation',
      update: 'reddit_update',
    };

    const template = this.templates.get(templateMap[templateName]);
    if (!template) {
      throw new Error(`Unknown template: ${templateName}`);
    }

    const content = this.fillTemplate(template, {
      ...data,
      productName: data.productName || 'Ultra-Dex',
      description: data.description || 'an AI orchestration layer',
      duration: data.duration || '2 months',
      features:
        data.features || '- Multi-provider routing\n- Cost optimization\n- VSCode extension',
    });

    const draft = this.createDraft(
      'reddit',
      content,
      [...template.tags, subreddit],
      templateName,
      data,
      data.title as string
    );
    return draft;
  }

  /**
   * Draft a blog post
   */
  draftBlogPost(title: string, data: Record<string, string | number>): ContentDraft {
    const template = this.templates.get('blog_deep_dive');
    if (!template) {
      throw new Error('Blog template not found');
    }

    const content = this.fillTemplate(template, {
      ...data,
      title,
      date: new Date().toISOString().split('T')[0],
      author: data.author || 'Solo Dev',
      tags: data.tags || 'AI, SaaS, Startups',
      productName: data.productName || 'Ultra-Dex',
      url: data.url || 'https://github.com/Srujan0798/Ultra-Dex',
    });

    return this.createDraft('blog', content, template.tags, 'deep_dive', data, title);
  }

  /**
   * Generate weekly batch of content
   */
  generateWeeklyBatch(): ContentDraft[] {
    const drafts: ContentDraft[] = [];
    const pkg = this.loadPackageJson();
    const metrics = this.loadMetrics();
    const day = this.getBuildDay();

    // 7 tweets
    drafts.push(
      this.draftTweet('milestone', {
        version: pkg.version,
        highlight: `Now with ${metrics.providers} AI providers`,
        duration: `${Math.floor(day / 30)} months`,
      })
    );

    drafts.push(
      this.draftTweet('validation', {
        question: 'Would you use an AI router that saves 50% on API costs?',
        context: `Been building ${pkg.name} for ${Math.floor(day / 30)} months. 306 tests passing.`,
      })
    );

    drafts.push(
      this.draftTweet('progress', {
        day,
        completed: `${metrics.providers} providers integrated`,
        inProgress: 'Dashboard v2',
        goal: 'Launch on Product Hunt',
        hashtag: 'buildinpublic',
      })
    );

    // 3 LinkedIn posts
    drafts.push(
      this.draftLinkedInPost('update', {
        version: pkg.version,
        features: `- Multi-provider routing (${metrics.providers} providers)\n- Cost optimization (up to 50% savings)\n- VSCode extension\n- Plugin system`,
        insight: `"I was paying $300/month for OpenAI alone. This cut it to $120." - Beta user`,
        pivot: 'Switched from LangChain-first to direct API integration for better control',
        roadmap: 'Auto-routing based on cost/quality tradeoffs',
        topic: 'LLM cost optimization',
      })
    );

    drafts.push(
      this.draftLinkedInPost('technical', {
        problem: 'Rerouting requests mid-stream when a provider fails',
        attempts:
          '- Initially tried request queuing (too slow)\n- Then tried pre-warming all providers (too expensive)',
        solution: 'Circuit breaker pattern + health checks every 30s + fallback chain',
        impact: '99.9% uptime with 50ms failover',
        lesson: 'Health checks matter more than retries',
      })
    );

    // 2 Reddit posts
    drafts.push(
      this.draftRedditPost('validation', 'LocalLLaMA', {
        version: pkg.version,
      })
    );

    return drafts;
  }

  /**
   * Draft reply to interested user
   */
  draftReply(username: string, context: string): ContentDraft {
    const templates = [
      `Hey u/${username}! Saw your comment about ${context}. Would love to get your thoughts - DMing you with early access details.`,
      `Thanks for the feedback u/${username}! Re: ${context} - that's exactly what we're solving. Sending you a DM with beta access.`,
      `u/${username} - great point about ${context}! We'd love your input on our approach. Check your DMs for early access.`,
    ];

    const content = templates[Math.floor(Math.random() * templates.length)];
    return this.createDraft('reddit', content, ['reply', 'outreach'], 'user_reply', {
      username,
      context,
    });
  }

  /**
   * Draft personalized DM
   */
  draftDM(username: string, signal: string, comment: string): ContentDraft {
    const truncatedComment = comment.length > 100 ? comment.slice(0, 100) + '...' : comment;

    const content = `Hey ${username},

Saw your comment: "${truncatedComment}"

Re: ${signal} - I'm building Ultra-Dex to solve exactly this. We're in early beta and I'd love 10 minutes of your time to understand your use case better.

Worth a quick chat?

Best,
Solo dev building Ultra-Dex`;

    return this.createDraft('reddit', content, ['dm', 'outreach'], 'outreach_dm', {
      username,
      signal,
      comment,
    });
  }

  /**
   * Generate A/B test variants for a title
   */
  generateABVariants(baseTitle: string): { variantA: string; variantB: string; variantC?: string } {
    // Variant A: Curiosity gap
    const variantA =
      baseTitle.replace(/^(I|We)/, 'Why').replace(/built/, 'killed') + ' (lessons learned)';

    // Variant B: Specific numbers
    const variantB = baseTitle.replace(/months/, '60 days').replace(/v\d+\.\d+/, '');

    // Variant C: Question format
    const variantC = baseTitle
      .replace(/^.*?\s+(shipped|launched|built)/, 'Is this worth continuing?')
      .replace(/\s*-\s*v\d+\.\d+/, '');

    return { variantA, variantB, variantC };
  }

  private createDraft(
    platform: ContentDraft['platform'],
    content: string,
    tags: string[],
    type: string,
    sourceData: Record<string, unknown>,
    title?: string
  ): ContentDraft {
    const id = `${platform}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const draft: ContentDraft = {
      id,
      platform,
      content,
      title,
      tags,
      status: 'draft',
      sourceData: {
        type: type as ContentDraft['sourceData']['type'],
        reference: JSON.stringify(sourceData),
      },
    };

    this.saveDraft(draft);
    return draft;
  }

  private saveDraft(draft: ContentDraft): void {
    const filePath = path.join(this.config.outputDir, draft.platform, `${draft.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(draft, null, 2));
  }

  private fillTemplate(template: ContentTemplate, data: Record<string, string | number>): string {
    let content = template.template;
    for (const variable of template.variables) {
      const value = data[variable] || '';
      content = content.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), String(value));
    }

    // Truncate if needed
    if (content.length > template.maxLength) {
      content = content.slice(0, template.maxLength - 3) + '...';
    }

    return content;
  }

  private loadPackageJson(): { version: string; name: string } {
    try {
      const content = fs.readFileSync('package.json', 'utf-8');
      return JSON.parse(content);
    } catch {
      return { version: '1.0.0', name: 'Ultra-Dex' };
    }
  }

  private loadMetrics(): { providers: number } {
    return { providers: 14 }; // Hardcoded for now
  }

  private getBuildDay(): number {
    // Calculate days since start (approximate)
    const startDate = new Date('2026-02-12'); // 2 months ago
    const now = new Date();
    return Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Get all drafts for a platform
   */
  getDrafts(platform?: ContentDraft['platform'], status?: ContentDraft['status']): ContentDraft[] {
    const drafts: ContentDraft[] = [];
    const platforms = platform ? [platform] : ['twitter', 'linkedin', 'reddit', 'blog'];

    for (const p of platforms) {
      const dir = path.join(this.config.outputDir, p);
      if (!fs.existsSync(dir)) continue;

      const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(dir, file), 'utf-8');
          const draft = JSON.parse(content) as ContentDraft;
          if (!status || draft.status === status) {
            drafts.push(draft);
          }
        } catch {}
      }
    }

    return drafts.sort(
      (a, b) => new Date(a.scheduledFor || 0).getTime() - new Date(b.scheduledFor || 0).getTime()
    );
  }

  /**
   * Approve a draft
   */
  approve(draftId: string, approvedBy: string): boolean {
    const draft = this.findDraft(draftId);
    if (!draft) return false;

    draft.status = 'approved';
    draft.approvedBy = approvedBy;

    const filePath = path.join(this.config.outputDir, draft.platform, `${draftId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(draft, null, 2));
    return true;
  }

  /**
   * Mark draft as posted
   */
  markPosted(draftId: string): boolean {
    const draft = this.findDraft(draftId);
    if (!draft) return false;

    draft.status = 'posted';
    draft.postedAt = new Date().toISOString();

    const filePath = path.join(this.config.outputDir, draft.platform, `${draftId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(draft, null, 2));
    return true;
  }

  private findDraft(draftId: string): ContentDraft | null {
    const platforms = ['twitter', 'linkedin', 'reddit', 'blog'];
    for (const platform of platforms) {
      const filePath = path.join(this.config.outputDir, platform, `${draftId}.json`);
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          return JSON.parse(content) as ContentDraft;
        } catch {}
      }
    }
    return null;
  }

  /**
   * Get stats
   */
  getStats(): {
    totalDrafts: number;
    pendingApproval: number;
    approved: number;
    posted: number;
    byPlatform: Record<string, number>;
  } {
    const all = this.getDrafts();
    const byPlatform: Record<string, number> = {};

    for (const draft of all) {
      byPlatform[draft.platform] = (byPlatform[draft.platform] || 0) + 1;
    }

    return {
      totalDrafts: all.length,
      pendingApproval: all.filter((d) => d.status === 'draft').length,
      approved: all.filter((d) => d.status === 'approved').length,
      posted: all.filter((d) => d.status === 'posted').length,
      byPlatform,
    };
  }
}

export default ContentDrafter;
