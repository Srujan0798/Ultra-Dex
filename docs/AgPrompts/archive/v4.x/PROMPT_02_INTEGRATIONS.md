# 🔌 Agent Prompt: Complete All 11 Integrations

Remove ALL stubs. Add REAL API implementations.

---

## 1. Jira Integration (cli/lib/integrations/jira.js)

```javascript
import fetch from 'node-fetch';

export class JiraClient {
  constructor(config) {
    this.domain = config.domain;
    this.email = config.email;
    this.apiToken = config.apiToken;
    this.baseUrl = `https://${this.domain}.atlassian.net/rest/api/3`;
  }

  get headers() {
    return {
      'Authorization': `Basic ${Buffer.from(`${this.email}:${this.apiToken}`).toString('base64')}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  async createIssue(data) {
    const response = await fetch(`${this.baseUrl}/issue`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        fields: {
          project: { key: data.projectKey },
          summary: data.summary,
          description: {
            type: 'doc',
            version: 1,
            content: [{
              type: 'paragraph',
              content: [{ type: 'text', text: data.description || '' }]
            }]
          },
          issuetype: { name: data.issueType || 'Task' },
          priority: data.priority ? { name: data.priority } : undefined,
          labels: data.labels || []
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Jira API Error: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  async getIssue(issueKey) {
    const response = await fetch(`${this.baseUrl}/issue/${issueKey}`, {
      headers: this.headers
    });
    return response.json();
  }

  async searchIssues(jql, maxResults = 50) {
    const response = await fetch(`${this.baseUrl}/search`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ jql, maxResults })
    });
    return response.json();
  }

  async updateIssue(issueKey, updates) {
    const response = await fetch(`${this.baseUrl}/issue/${issueKey}`, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify({ fields: updates })
    });
    return response.ok;
  }

  async transitionIssue(issueKey, transitionId) {
    const response = await fetch(`${this.baseUrl}/issue/${issueKey}/transitions`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ transition: { id: transitionId } })
    });
    return response.ok;
  }
}

export async function syncFromPlan(client, planSections) {
  const issues = [];
  for (const section of planSections) {
    const issue = await client.createIssue({
      projectKey: section.projectKey,
      summary: section.name,
      description: section.description,
      issueType: section.type || 'Story'
    });
    issues.push(issue);
  }
  return issues;
}
```

---

## 2. Notion Integration (cli/lib/integrations/notion.js)

```javascript
import { Client } from '@notionhq/client';

export class NotionClient {
  constructor(apiKey) {
    this.client = new Client({ auth: apiKey });
  }

  async queryDatabase(databaseId, filter = undefined) {
    return this.client.databases.query({
      database_id: databaseId,
      filter
    });
  }

  async createPage(databaseId, properties, content = []) {
    return this.client.pages.create({
      parent: { database_id: databaseId },
      properties,
      children: content
    });
  }

  async updatePage(pageId, properties) {
    return this.client.pages.update({
      page_id: pageId,
      properties
    });
  }

  async getPage(pageId) {
    return this.client.pages.retrieve({ page_id: pageId });
  }

  async syncPlanToNotion(databaseId, planData) {
    const results = [];
    
    for (const section of planData.sections) {
      const page = await this.createPage(databaseId, {
        'Name': { title: [{ text: { content: section.name } }] },
        'Status': { select: { name: section.status || 'Not Started' } },
        'Priority': { select: { name: section.priority || 'Medium' } },
        'Due Date': section.dueDate ? { date: { start: section.dueDate } } : undefined
      });
      results.push(page);
    }
    
    return results;
  }
}
```

---

## 3. Trello Integration (cli/lib/integrations/trello.js)

```javascript
const TRELLO_API = 'https://api.trello.com/1';

export class TrelloClient {
  constructor(apiKey, token) {
    this.apiKey = apiKey;
    this.token = token;
  }

  get auth() {
    return `key=${this.apiKey}&token=${this.token}`;
  }

  async createBoard(name) {
    const response = await fetch(`${TRELLO_API}/boards?name=${encodeURIComponent(name)}&${this.auth}`, {
      method: 'POST'
    });
    return response.json();
  }

  async createList(boardId, name) {
    const response = await fetch(`${TRELLO_API}/lists?idBoard=${boardId}&name=${encodeURIComponent(name)}&${this.auth}`, {
      method: 'POST'
    });
    return response.json();
  }

  async createCard(listId, name, desc = '') {
    const response = await fetch(`${TRELLO_API}/cards?idList=${listId}&name=${encodeURIComponent(name)}&desc=${encodeURIComponent(desc)}&${this.auth}`, {
      method: 'POST'
    });
    return response.json();
  }

  async addChecklist(cardId, name, items = []) {
    const checklist = await fetch(`${TRELLO_API}/checklists?idCard=${cardId}&name=${encodeURIComponent(name)}&${this.auth}`, {
      method: 'POST'
    }).then(r => r.json());

    for (const item of items) {
      await fetch(`${TRELLO_API}/checklists/${checklist.id}/checkItems?name=${encodeURIComponent(item)}&${this.auth}`, {
        method: 'POST'
      });
    }

    return checklist;
  }
}
```

---

## 4. Slack Integration (enhance cli/lib/integrations/slack.js)

Add:
- sendMessage with blocks
- createChannel
- Interactive message handling
- Webhook processing

## 5. Discord Integration (enhance cli/lib/integrations/discord.js)

Add:
- Rich embeds
- Bot command handling
- Role management

## 6-11. Enhance remaining integrations

For each:
- Remove "Alpha" labels from help text
- Add proper error handling
- Add retry logic for rate limits
- Add config validation

---

**SUCCESS:** All 11 integrations have real API calls, no stubs
