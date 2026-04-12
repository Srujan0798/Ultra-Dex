import * as fs from 'fs';
import * as path from 'path';
import { SentimentReport, Comment } from './sentiment-analyzer';

export type OutreachStatus = 'identified' | 'drafted' | 'approved' | 'sent' | 'replied' | 'scheduled' | 'interviewed' | 'declined';

export interface Lead extends Comment {
  score: number;
  status: OutreachStatus;
  draft?: string;
  sentDate?: string;
}

export interface OutreachStats {
  identified: number;
  drafted: number;
  approved: number;
  sent: number;
  replied: number;
  scheduled: number;
  interviewed: number;
}

export class OutreachManager {
  private trackerPath: string;
  private templatePath: string;
  private queueDir: string;
  private doNotContactPath: string;

  constructor() {
    this.trackerPath = path.join(process.cwd(), 'marketing', 'validation', 'outreach-tracker.md');
    this.templatePath = path.join(process.cwd(), 'src', 'automation', 'templates', 'dm-outreach.md');
    this.queueDir = path.join(process.cwd(), 'content', 'queue', 'dm');
    this.doNotContactPath = path.join(process.cwd(), 'marketing', 'validation', 'do-not-contact.json');

    this.ensureFiles();
  }

  public identifyLeads(report: SentimentReport): Lead[] {
    const doNotContact = this.getDoNotContactList();
    
    // We need to look at all comments from the report
    // SentimentReport has topPositive, topNegative, and we can also assume access to all analyzed comments if we had them.
    // For this implementation, we'll combine topPositive and any other comments provided in the report if available.
    // Since SentimentReport only has topPositive/topNegative, we might need to rethink how we get ALL comments.
    // But for now, let's use what's in the report.
    
    const allComments = [...report.topPositive, ...report.topNegative];
    
    const leads: Lead[] = allComments
      .filter(comment => {
        if (!comment.author || doNotContact.includes(comment.author)) return false;
        
        const hasBuyingSignal = comment.sentiment?.signals.includes('BUYING_SIGNAL');
        const hasInterestSignal = comment.sentiment?.signals.includes('INTEREST_SIGNAL');
        const isPositive = comment.sentiment?.label === 'positive';
        const hasFeatureRequest = comment.sentiment?.signals.includes('FEATURE_REQUEST');
        
        return hasBuyingSignal || hasInterestSignal || (isPositive && hasFeatureRequest);
      })
      .map(comment => {
        let score = 0;
        if (comment.sentiment?.signals.includes('BUYING_SIGNAL')) score += 10;
        if (comment.sentiment?.signals.includes('INTEREST_SIGNAL')) score += 7;
        if (comment.sentiment?.label === 'positive' && comment.sentiment?.signals.includes('FEATURE_REQUEST')) score += 5;
        
        return {
          ...comment,
          score,
          status: 'identified'
        };
      });

    return this.prioritizeLeads(leads);
  }

  public prioritizeLeads(leads: Lead[]): Lead[] {
    return leads.sort((a, b) => b.score - a.score);
  }

  public generateDraft(lead: Lead): string {
    if (!fs.existsSync(this.templatePath)) {
      throw new Error('Outreach template not found');
    }

    let template = fs.readFileSync(this.templatePath, 'utf-8');
    const draft = template
      .replace('{{username}}', lead.author || 'there')
      .replace('{{comment}}', lead.text);

    lead.draft = draft;
    lead.status = 'drafted';

    const draftFileName = `${lead.author || 'unknown'}-${Date.now()}.md`;
    const draftPath = path.join(this.queueDir, draftFileName);
    fs.writeFileSync(draftPath, draft);

    this.updateTracker(lead);
    return draft;
  }

  public trackOutreach(lead: Lead, status: OutreachStatus): void {
    lead.status = status;
    if (status === 'sent') {
      lead.sentDate = new Date().toISOString().split('T')[0];
    }
    if (status === 'declined') {
      this.addToDoNotContact(lead.author || '');
    }
    this.updateTracker(lead);
  }

  public getStats(): OutreachStats {
    if (!fs.existsSync(this.trackerPath)) {
      return { identified: 0, drafted: 0, approved: 0, sent: 0, replied: 0, scheduled: 0, interviewed: 0 };
    }

    const content = fs.readFileSync(this.trackerPath, 'utf-8');
    const lines = content.split('\n');
    
    const stats: OutreachStats = {
      identified: 0,
      drafted: 0,
      approved: 0,
      sent: 0,
      replied: 0,
      scheduled: 0,
      interviewed: 0
    };

    lines.forEach(line => {
      if (line.includes('| identified |')) stats.identified++;
      if (line.includes('| drafted |')) stats.drafted++;
      if (line.includes('| approved |')) stats.approved++;
      if (line.includes('| sent |')) stats.sent++;
      if (line.includes('| replied |')) stats.replied++;
      if (line.includes('| scheduled |')) stats.scheduled++;
      if (line.includes('| interviewed |')) stats.interviewed++;
    });

    return stats;
  }

  private ensureFiles(): void {
    if (!fs.existsSync(path.dirname(this.trackerPath))) {
      fs.mkdirSync(path.dirname(this.trackerPath), { recursive: true });
    }
    if (!fs.existsSync(this.trackerPath)) {
      fs.writeFileSync(this.trackerPath, '| Username | Signal | Score | Comment | Status | Draft | Sent Date |\n| --- | --- | --- | --- | --- | --- | --- |\n');
    }
    if (!fs.existsSync(this.queueDir)) {
      fs.mkdirSync(this.queueDir, { recursive: true });
    }
    if (!fs.existsSync(this.doNotContactPath)) {
      fs.writeFileSync(this.doNotContactPath, JSON.stringify([], null, 2));
    }
  }

  private updateTracker(lead: Lead): void {
    let content = fs.readFileSync(this.trackerPath, 'utf-8');
    const lines = content.split('\n');
    const signal = lead.sentiment?.signals.join(', ') || 'none';
    const commentPreview = lead.text.substring(0, 50).replace(/\|/g, '\\|') + (lead.text.length > 50 ? '...' : '');
    const draftStatus = lead.draft ? 'Yes' : 'No';
    const sentDate = lead.sentDate || '-';

    const newLine = `| ${lead.author} | ${signal} | ${lead.score} | ${commentPreview} | ${lead.status} | ${draftStatus} | ${sentDate} |`;

    // Check if user already exists in tracker
    const existingIndex = lines.findIndex(line => line.startsWith(`| ${lead.author} |`));
    if (existingIndex !== -1) {
      lines[existingIndex] = newLine;
    } else {
      lines.push(newLine);
    }

    fs.writeFileSync(this.trackerPath, lines.join('\n'));
  }

  private getDoNotContactList(): string[] {
    try {
      return JSON.parse(fs.readFileSync(this.doNotContactPath, 'utf-8'));
    } catch {
      return [];
    }
  }

  private addToDoNotContact(username: string): void {
    if (!username) return;
    const list = this.getDoNotContactList();
    if (!list.includes(username)) {
      list.push(username);
      fs.writeFileSync(this.doNotContactPath, JSON.stringify(list, null, 2));
    }
  }

  public checkSafety(username: string): { canContact: boolean; reason?: string } {
    const dailyLimit = 5;
    const cooldownHours = 48;

    const content = fs.readFileSync(this.trackerPath, 'utf-8');
    const lines = content.split('\n');
    
    // Check daily limit
    const today = new Date().toISOString().split('T')[0];
    const sentTodayCount = lines.filter(line => line.includes(`| ${today} |`)).length;
    if (sentTodayCount >= dailyLimit) {
      return { canContact: false, reason: 'Daily outreach limit reached' };
    }

    // Check cooldown for specific user
    const userLine = lines.find(line => line.startsWith(`| ${username} |`));
    if (userLine) {
      const parts = userLine.split('|');
      const lastSentDateStr = parts[7]?.trim();
      if (lastSentDateStr && lastSentDateStr !== '-') {
        const lastSentDate = new Date(lastSentDateStr);
        const now = new Date();
        const diffHours = (now.getTime() - lastSentDate.getTime()) / (1000 * 60 * 60);
        if (diffHours < cooldownHours) {
          return { canContact: false, reason: `User in cooldown (${Math.round(cooldownHours - diffHours)}h remaining)` };
        }
      }
    }

    return { canContact: true };
  }
}
