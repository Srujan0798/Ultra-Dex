import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RedditAuth } from './reddit-auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const DEFAULT_CONFIG_PATH = path.resolve(REPO_ROOT, 'config/reddit-config.json');
const DEFAULT_STATE_PATH = path.resolve(REPO_ROOT, '.ultra-dex/automation/reddit-state.json');
const DEFAULT_RESULTS_DIR = path.resolve(REPO_ROOT, '.ultra-dex/automation/scrape-results');
const RESPONSE_TRACKER_PATH = path.resolve(REPO_ROOT, 'marketing/validation/response-tracker.md');
const AUTOMATION_TABLE_HEADING = '## Automated Reddit Scrape Log';

export interface ScrapedComment {
  id: string;
  author: string;
  body: string;
  score: number;
  created: string;
  sentiment: null;
}

export interface ScrapedPostResult {
  postId: string;
  title: string;
  upvotes: number;
  commentCount: number;
  comments: ScrapedComment[];
}

interface RedditScraperConfig {
  monitoredPosts: string[];
  subreddits: string[];
  scrapeInterval: string;
  maxCommentsPerPost: number;
  searchTerms: string[];
}

interface RedditScraperState {
  posts: Record<
    string,
    {
      seenCommentIds: string[];
      commentScores: Record<string, number>;
      updatedAt: string;
    }
  >;
}

export class RedditScraper {
  private config: RedditScraperConfig | null = null;

  private state: RedditScraperState = { posts: {} };

  constructor(
    private readonly auth: RedditAuth,
    private readonly configPath = DEFAULT_CONFIG_PATH,
    private readonly statePath = DEFAULT_STATE_PATH,
    private readonly resultsDir = DEFAULT_RESULTS_DIR
  ) {}

  async scrapePost(postUrl: string): Promise<ScrapedPostResult> {
    await this.initialize();
    const submission = await this.fetchSubmission(postUrl, 'scrape-post:submission');

    await this.auth.request('scrape-post:expand-replies', async () =>
      submission.expandReplies({ limit: Infinity, depth: Infinity })
    );

    const postId = this.extractPostId(postUrl, submission.id);
    const comments = this.flattenComments(submission.comments, this.config!.maxCommentsPerPost).map(
      (comment) => ({
        id: comment.id,
        author: comment.author?.name ?? '[deleted]',
        body: comment.body ?? '',
        score: Number(comment.score ?? 0),
        created: new Date(Number(comment.created_utc ?? 0) * 1000).toISOString(),
        sentiment: null as null,
      })
    );

    const result: ScrapedPostResult = {
      postId,
      title: submission.title ?? '',
      upvotes: Number(submission.score ?? 0),
      commentCount: Number(submission.num_comments ?? comments.length),
      comments,
    };

    const { newCommentCount } = this.applyDedupState(result);
    await this.writeRawResult(postId, result);
    await this.appendResponseTracker(postUrl, result, newCommentCount);
    await this.persistState();
    return result;
  }

  async scrapeSubreddit(name: string, query: string, limit = 25): Promise<
    Array<{
      id: string;
      title: string;
      score: number;
      comments: number;
      author: string;
      created: string;
      permalink: string;
    }>
  > {
    await this.initialize();
    const subreddit = await this.auth.request('subreddit:get', async (client) =>
      client.getSubreddit(name).fetch()
    );
    const listings = await this.auth.request('subreddit:search', async () =>
      subreddit.search({ query, limit, sort: 'new', time: 'month' })
    );

    return listings.map((entry: any) => ({
      id: entry.id,
      title: entry.title ?? '',
      score: Number(entry.score ?? 0),
      comments: Number(entry.num_comments ?? 0),
      author: entry.author?.name ?? '[deleted]',
      created: new Date(Number(entry.created_utc ?? 0) * 1000).toISOString(),
      permalink: `https://reddit.com${entry.permalink ?? ''}`,
    }));
  }

  async scrapeUserHistory(username: string): Promise<{
    username: string;
    commentKarma: number;
    linkKarma: number;
    recentComments: Array<{ id: string; body: string; score: number; created: string }>;
    recentPosts: Array<{ id: string; title: string; score: number; created: string }>;
    potentialLead: boolean;
  }> {
    await this.initialize();
    const user = await this.auth.request('user:get', async (client) => client.getUser(username).fetch());
    const recentComments = await this.auth.request('user:get-comments', async () =>
      user.getComments({ limit: 25 })
    );
    const recentPosts = await this.auth.request('user:get-submissions', async () =>
      user.getSubmissions({ limit: 25 })
    );

    const commentKarma = Number(user.comment_karma ?? 0);
    const linkKarma = Number(user.link_karma ?? 0);

    return {
      username,
      commentKarma,
      linkKarma,
      recentComments: recentComments.map((entry: any) => ({
        id: entry.id,
        body: entry.body ?? '',
        score: Number(entry.score ?? 0),
        created: new Date(Number(entry.created_utc ?? 0) * 1000).toISOString(),
      })),
      recentPosts: recentPosts.map((entry: any) => ({
        id: entry.id,
        title: entry.title ?? '',
        score: Number(entry.score ?? 0),
        created: new Date(Number(entry.created_utc ?? 0) * 1000).toISOString(),
      })),
      potentialLead: commentKarma + linkKarma > 1_000 && recentComments.length > 5,
    };
  }

  async getPostMetrics(postUrl: string): Promise<{
    postId: string;
    upvotes: number;
    upvoteRatio: number;
    comments: number;
    crossPosts: number;
  }> {
    const submission = await this.fetchSubmission(postUrl, 'post-metrics:submission');

    return {
      postId: this.extractPostId(postUrl, submission.id),
      upvotes: Number(submission.score ?? 0),
      upvoteRatio: Number(submission.upvote_ratio ?? 0),
      comments: Number(submission.num_comments ?? 0),
      crossPosts: Number(submission.num_crossposts ?? 0),
    };
  }

  static dryRunExample(): ScrapedPostResult {
    return {
      postId: 'dryrun123',
      title: '[dry-run] Example Reddit validation post',
      upvotes: 42,
      commentCount: 2,
      comments: [
        {
          id: 'c1',
          author: 'example_user',
          body: 'This is useful if it reduces model costs.',
          score: 11,
          created: new Date('2026-01-01T00:00:00.000Z').toISOString(),
          sentiment: null,
        },
        {
          id: 'c2',
          author: 'another_user',
          body: 'Would pay if setup is simple and transparent.',
          score: 7,
          created: new Date('2026-01-01T00:05:00.000Z').toISOString(),
          sentiment: null,
        },
      ],
    };
  }

  private async initialize(): Promise<void> {
    if (!this.config) {
      this.config = await this.readConfig();
    }
    await fs.mkdir(path.dirname(this.statePath), { recursive: true });
    await fs.mkdir(this.resultsDir, { recursive: true });
    this.state = await this.readState();
  }

  private async readConfig(): Promise<RedditScraperConfig> {
    const raw = await fs.readFile(this.configPath, 'utf8');
    const config = JSON.parse(raw) as RedditScraperConfig;
    return {
      monitoredPosts: config.monitoredPosts ?? [],
      subreddits: config.subreddits ?? [],
      scrapeInterval: config.scrapeInterval ?? '*/30 * * * *',
      maxCommentsPerPost: config.maxCommentsPerPost ?? 500,
      searchTerms: config.searchTerms ?? [],
    };
  }

  private async readState(): Promise<RedditScraperState> {
    try {
      const raw = await fs.readFile(this.statePath, 'utf8');
      return JSON.parse(raw) as RedditScraperState;
    } catch (error) {
      const maybeFsError = error as NodeJS.ErrnoException;
      if (maybeFsError.code === 'ENOENT') {
        return { posts: {} };
      }
      throw error;
    }
  }

  private async persistState(): Promise<void> {
    await fs.writeFile(this.statePath, JSON.stringify(this.state, null, 2), 'utf8');
  }

  private applyDedupState(result: ScrapedPostResult): { newCommentCount: number } {
    const postState = this.state.posts[result.postId] ?? {
      seenCommentIds: [],
      commentScores: {},
      updatedAt: new Date().toISOString(),
    };
    const seenSet = new Set(postState.seenCommentIds);

    let newCommentCount = 0;
    for (const comment of result.comments) {
      if (!seenSet.has(comment.id)) {
        seenSet.add(comment.id);
        newCommentCount += 1;
      }
      postState.commentScores[comment.id] = comment.score;
    }

    postState.seenCommentIds = [...seenSet];
    postState.updatedAt = new Date().toISOString();
    this.state.posts[result.postId] = postState;
    return { newCommentCount };
  }

  private async writeRawResult(postId: string, result: ScrapedPostResult): Promise<void> {
    const outputPath = path.join(this.resultsDir, `${postId}.json`);
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2), 'utf8');
  }

  private async appendResponseTracker(
    postUrl: string,
    result: ScrapedPostResult,
    newComments: number
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    const escapedTitle = result.title.replaceAll('|', '\\|');
    const row = `| ${timestamp} | ${result.postId} | ${escapedTitle} | ${result.upvotes} | ${result.commentCount} | ${newComments} | ${postUrl} |\n`;
    let tracker = '';

    try {
      tracker = await fs.readFile(RESPONSE_TRACKER_PATH, 'utf8');
    } catch (error) {
      const maybeFsError = error as NodeJS.ErrnoException;
      if (maybeFsError.code !== 'ENOENT') {
        throw error;
      }
    }

    if (!tracker.includes(AUTOMATION_TABLE_HEADING)) {
      tracker += `\n\n${AUTOMATION_TABLE_HEADING}\n\n| Timestamp | Post ID | Title | Upvotes | Total Comments | New Comments | Post URL |\n| --- | --- | --- | ---: | ---: | ---: | --- |\n`;
    }

    tracker += row;
    await fs.mkdir(path.dirname(RESPONSE_TRACKER_PATH), { recursive: true });
    await fs.writeFile(RESPONSE_TRACKER_PATH, tracker, 'utf8');
  }

  private flattenComments(source: any, maxComments: number): any[] {
    const output: any[] = [];
    const queue = Array.isArray(source)
      ? [...source]
      : source && typeof source[Symbol.iterator] === 'function'
        ? [...source]
        : [];

    while (queue.length > 0 && output.length < maxComments) {
      const item = queue.shift();
      if (!item || item.id === '_') {
        continue;
      }

      if (typeof item.body === 'string') {
        output.push(item);
      }

      if (item.replies && Array.isArray(item.replies) && item.replies.length > 0) {
        queue.push(...item.replies);
      }
    }

    return output;
  }

  private extractPostId(postUrl: string, fallbackId: string): string {
    const match = postUrl.match(/\/comments\/([a-z0-9]+)/i);
    return match?.[1] ?? fallbackId;
  }

  private async fetchSubmission(postUrl: string, label: string): Promise<any> {
    const postId = this.extractPostId(postUrl, '');
    const submissionRef = postId || postUrl;
    return this.auth.request(label, async (client) => client.getSubmission(submissionRef).fetch());
  }
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  if (dryRun) {
    console.log(JSON.stringify(RedditScraper.dryRunExample(), null, 2));
    return;
  }

  const auth = new RedditAuth();
  const scraper = new RedditScraper(auth);
  const configRaw = await fs.readFile(DEFAULT_CONFIG_PATH, 'utf8');
  const config = JSON.parse(configRaw) as RedditScraperConfig;
  const monitoredPosts = config.monitoredPosts ?? [];

  if (monitoredPosts.length === 0) {
    throw new Error(
      'No monitored Reddit post URLs found in config/reddit-config.json. Add at least one URL.'
    );
  }

  for (const url of monitoredPosts) {
    const data = await scraper.scrapePost(url);
    console.log(
      `[reddit-scraper] ${data.postId} comments=${data.commentCount} upvotes=${data.upvotes}`
    );
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error('[reddit-scraper] fatal:', error);
    process.exitCode = 1;
  });
}
