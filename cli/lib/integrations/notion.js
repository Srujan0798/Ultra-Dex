/**
 * cli/lib/integrations/notion.js
 * Notion Integration with Real API Implementation
 */

import { Client } from '@notionhq/client';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';

export class NotionClient {
  constructor(apiKey) {
    this.client = new Client({ auth: apiKey });
  }

  async queryDatabase(databaseId, filter = undefined, sorts = undefined) {
    try {
      const response = await this.client.databases.query({
        database_id: databaseId,
        filter,
        sorts
      });
      return response;
    } catch (error) {
      printError(`Failed to query Notion database ${databaseId}: ${error.message}`);
      throw error;
    }
  }

  async createPage(databaseId, properties, content = []) {
    try {
      const response = await this.client.pages.create({
        parent: { database_id: databaseId },
        properties,
        children: content
      });
      return response;
    } catch (error) {
      printError(`Failed to create Notion page in database ${databaseId}: ${error.message}`);
      throw error;
    }
  }

  async updatePage(pageId, properties) {
    try {
      const response = await this.client.pages.update({
        page_id: pageId,
        properties
      });
      return response;
    } catch (error) {
      printError(`Failed to update Notion page ${pageId}: ${error.message}`);
      throw error;
    }
  }

  async getPage(pageId) {
    try {
      const response = await this.client.pages.retrieve({ page_id: pageId });
      return response;
    } catch (error) {
      printError(`Failed to retrieve Notion page ${pageId}: ${error.message}`);
      throw error;
    }
  }

  async getBlockChildren(blockId, startCursor = undefined, pageSize = 100) {
    try {
      const response = await this.client.blocks.children.list({
        block_id: blockId,
        start_cursor: startCursor,
        page_size: pageSize
      });
      return response;
    } catch (error) {
      printError(`Failed to get block children for ${blockId}: ${error.message}`);
      throw error;
    }
  }

  async appendBlockChildren(blockId, children) {
    try {
      const response = await this.client.blocks.children.append({
        block_id: blockId,
        children
      });
      return response;
    } catch (error) {
      printError(`Failed to append block children to ${blockId}: ${error.message}`);
      throw error;
    }
  }

  async createDatabase(parentPageId, title, properties) {
    try {
      const response = await this.client.databases.create({
        parent: {
          type: 'page_id',
          page_id: parentPageId
        },
        title: [{
          type: 'text',
          text: { content: title }
        }],
        properties
      });
      return response;
    } catch (error) {
      printError(`Failed to create Notion database: ${error.message}`);
      throw error;
    }
  }

  async syncPlanToNotion(databaseId, planData) {
    const results = [];

    for (const section of planData.sections) {
      try {
        const page = await this.createPage(databaseId, {
          'Name': { title: [{ text: { content: section.name } }] },
          'Status': { select: { name: section.status || 'Not Started' } },
          'Priority': { select: { name: section.priority || 'Medium' } },
          'Due Date': section.dueDate ? { date: { start: section.dueDate } } : undefined,
          'Description': section.description ? { rich_text: [{ text: { content: section.description } }] } : undefined
        });

        results.push(page);
        printSuccess(`✅ Created Notion page: ${section.name}`);
      } catch (error) {
        printError(`Failed to create Notion page for ${section.name}: ${error.message}`);
      }
    }

    return results;
  }

  async syncContextToNotion(pageId, contextData) {
    try {
      // Create or update content blocks in the page
      const contentBlocks = this.convertContextToBlocks(contextData);
      
      // First, get existing children to avoid overwriting
      const existingBlocks = await this.getBlockChildren(pageId);
      
      // Delete existing content blocks (keeping the title)
      for (const block of existingBlocks.results) {
        if (block.type !== 'heading_1') { // Don't delete the title
          await this.client.blocks.delete({ block_id: block.id });
        }
      }

      // Add new content blocks
      if (contentBlocks.length > 0) {
        await this.appendBlockChildren(pageId, contentBlocks);
      }

      printSuccess(`✅ Updated Notion page with context: ${pageId}`);
      return true;
    } catch (error) {
      printError(`Failed to sync context to Notion page ${pageId}: ${error.message}`);
      throw error;
    }
  }

  convertContextToBlocks(contextData) {
    const blocks = [];
    
    // Add context sections as blocks
    if (contextData.project) {
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: 'Project Context' } }]
        }
      });
      
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: contextData.project.description || 'No project description' } }]
        }
      });
    }

    if (contextData.architecture) {
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: 'Architecture' } }]
        }
      });
      
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: contextData.architecture.description || 'No architecture details' } }]
        }
      });
    }

    return blocks;
  }

  async searchPages(query, filter = {}) {
    try {
      const response = await this.client.search({
        query,
        filter
      });
      return response;
    } catch (error) {
      printError(`Failed to search Notion pages: ${error.message}`);
      throw error;
    }
  }

  async addRichTextToPage(pageId, content) {
    try {
      const blocks = this.convertTextToBlocks(content);
      await this.appendBlockChildren(pageId, blocks);
      printSuccess(`✅ Added content to Notion page: ${pageId}`);
      return true;
    } catch (error) {
      printError(`Failed to add content to Notion page ${pageId}: ${error.message}`);
      throw error;
    }
  }

  convertTextToBlocks(text) {
    // Split text into paragraphs and convert to Notion blocks
    const paragraphs = text.split('\n\n');
    const blocks = [];

    for (const paragraph of paragraphs) {
      if (paragraph.trim()) {
        blocks.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: paragraph.trim() } }]
          }
        });
      }
    }

    return blocks;
  }
}

/**
 * Validate Notion configuration
 */
export async function validateNotionConfig(config) {
  if (!config.apiToken) {
    throw new Error('Notion configuration requires apiToken');
  }

  const client = new NotionClient(config.apiToken);
  
  try {
    // Test by trying to search for something
    const response = await client.searchPages('test', { property: 'object', value: 'page' });
    printSuccess('✅ Notion connection validated successfully');
    return true;
  } catch (error) {
    printError(`❌ Notion connection failed: ${error.message}`);
    return false;
  }
}

export default {
  NotionClient,
  validateNotionConfig
};