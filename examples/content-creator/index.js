#!/usr/bin/env node

/**
 * Ultra-Dex Content Creator
 * 
 * This example demonstrates how to create an AI-powered content generation system using Ultra-Dex.
 * The system can generate various types of content like blog posts, social media content, 
 * marketing materials, and more.
 * 
 * Features:
 * - Multi-format content generation
 * - Brand voice consistency
 * - SEO optimization
 * - Content personalization
 * - Performance tracking
 */

import { UltraDex } from '@ultra-dex/sdk';

class ContentCreator {
  constructor(config) {
    this.ultraDex = new UltraDex(config.ultraDex);
    
    // Initialize specialized agents
    this.agents = {
      contentPlanner: this.ultraDex.createAgent({
        name: 'content-planner',
        role: 'Plans content strategy and creates outlines based on objectives',
        tools: ['audience-analyzer', 'trend-tracker', 'keyword-researcher', 'competitor-analyzer']
      }),
      
      contentWriter: this.ultraDex.createAgent({
        name: 'content-writer',
        role: 'Writes high-quality content in various formats and styles',
        tools: ['tone-matcher', 'style-guide-adherence', 'fact-checker', 'grammar-correction']
      }),
      
      seoOptimizer: this.ultraDex.createAgent({
        name: 'seo-optimizer',
        role: 'Optimizes content for search engines and readability',
        tools: ['keyword-optimizer', 'meta-generator', 'readability-analyzer', 'link-suggestion']
      }),
      
      socialMediaSpecialist: this.ultraDex.createAgent({
        name: 'social-media-specialist',
        role: 'Adapts content for different social media platforms',
        tools: ['platform-analyzer', 'engagement-maximizer', 'hashtag-generator', 'visual-suggestion']
      }),
      
      contentAnalyzer: this.ultraDex.createAgent({
        name: 'content-analyzer',
        role: 'Analyzes content performance and suggests improvements',
        tools: ['performance-tracker', 'engagement-analyzer', 'conversion-analyzer', 'improvement-suggester']
      })
    };
    
    // Maintain content templates and brand guidelines
    this.brandGuidelines = config.brandGuidelines || {};
    this.contentTemplates = config.templates || {};
    this.generatedContent = [];
  }

  /**
   * Generate content based on requirements
   */
  async generateContent(type, requirements) {
    try {
      // Plan the content
      const plan = await this.agents.contentPlanner.execute({
        type,
        requirements,
        brandGuidelines: this.brandGuidelines,
        audience: requirements.audience || 'general'
      });
      
      // Write the content
      const draft = await this.agents.contentWriter.execute({
        type,
        outline: plan.outline,
        requirements,
        brandVoice: this.brandGuidelines.voice,
        tone: requirements.tone || 'professional'
      });
      
      // Optimize for SEO if needed
      let optimizedContent = draft.content;
      if (requirements.optimizeForSEO) {
        const seoResult = await this.agents.seoOptimizer.execute({
          content: draft.content,
          keywords: requirements.keywords || [],
          targetAudience: requirements.audience
        });
        
        optimizedContent = seoResult.optimizedContent;
      }
      
      // Create social media adaptations if needed
      let socialAdaptations = [];
      if (requirements.createSocialVersions) {
        socialAdaptations = await this.agents.socialMediaSpecialist.execute({
          content: optimizedContent,
          platforms: requirements.platforms || ['twitter', 'linkedin', 'facebook'],
          purpose: requirements.purpose || 'promotional'
        });
      }
      
      // Create content object
      const contentItem = {
        id: `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        title: draft.title,
        content: optimizedContent,
        plan,
        requirements,
        socialAdaptations,
        createdAt: new Date().toISOString(),
        status: 'draft',
        metadata: {
          wordCount: optimizedContent.split(' ').length,
          readingTime: Math.ceil(optimizedContent.split(' ').length / 200), // ~200 wpm
          seoOptimized: !!requirements.optimizeForSEO,
          socialAdapted: requirements.createSocialVersions
        }
      };
      
      // Store the generated content
      this.generatedContent.push(contentItem);
      
      return contentItem;
      
    } catch (error) {
      console.error('Error generating content:', error);
      throw error;
    }
  }

  /**
   * Generate a blog post
   */
  async generateBlogPost(title, topic, targetWordCount = 1000, options = {}) {
    const requirements = {
      type: 'blog-post',
      title,
      topic,
      targetWordCount,
      audience: options.audience || 'business-professionals',
      tone: options.tone || 'informative',
      keywords: options.keywords || [],
      optimizeForSEO: true,
      createSocialVersions: true,
      ...options
    };
    
    return await this.generateContent('blog-post', requirements);
  }

  /**
   * Generate social media content
   */
  async generateSocialContent(platform, topic, purpose = 'promotional', options = {}) {
    const requirements = {
      type: 'social-media',
      platform,
      topic,
      purpose,
      audience: options.audience || 'followers',
      tone: options.tone || 'engaging',
      hashtags: options.hashtags || [],
      optimizeForSEO: false,
      createSocialVersions: false,
      ...options
    };
    
    return await this.generateContent('social-media', requirements);
  }

  /**
   * Generate marketing copy
   */
  async generateMarketingCopy(type, product, targetAudience, options = {}) {
    const requirements = {
      type: 'marketing-copy',
      subtype: type, // 'email', 'ad', 'landing-page', 'brochure'
      product,
      targetAudience,
      tone: options.tone || 'persuasive',
      callToAction: options.callToAction || 'Learn more',
      benefits: options.benefits || [],
      optimizeForSEO: type === 'landing-page',
      createSocialVersions: true,
      ...options
    };
    
    return await this.generateContent('marketing-copy', requirements);
  }

  /**
   * Generate email newsletter
   */
  async generateNewsletter(subject, topics, audienceSegment, options = {}) {
    const requirements = {
      type: 'newsletter',
      subject,
      topics,
      audience: audienceSegment,
      tone: options.tone || 'friendly',
      sections: options.sections || ['featured', 'news', 'offers'],
      optimizeForSEO: false,
      createSocialVersions: true,
      ...options
    };
    
    return await this.generateContent('newsletter', requirements);
  }

  /**
   * Analyze content performance
   */
  async analyzeContent(contentId, performanceData) {
    const content = this.generatedContent.find(c => c.id === contentId);
    if (!content) {
      throw new Error('Content not found');
    }
    
    const analysis = await this.agents.contentAnalyzer.execute({
      content,
      performanceData,
      brandGuidelines: this.brandGuidelines
    });
    
    // Update content with analysis
    content.analysis = analysis;
    content.performance = performanceData;
    
    return analysis;
  }

  /**
   * Update brand guidelines
   */
  updateBrandGuidelines(guidelines) {
    this.brandGuidelines = { ...this.brandGuidelines, ...guidelines };
  }

  /**
   * Add content template
   */
  addTemplate(name, template) {
    this.contentTemplates[name] = template;
  }

  /**
   * Get content statistics
   */
  getStats() {
    const totalContent = this.generatedContent.length;
    const byType = this.generatedContent.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {});
    
    const totalWords = this.generatedContent.reduce((sum, item) => 
      sum + item.metadata.wordCount, 0);
    
    const avgReadingTime = totalContent > 0 
      ? this.generatedContent.reduce((sum, item) => sum + item.metadata.readingTime, 0) / totalContent 
      : 0;
    
    return {
      totalContent,
      byType,
      totalWords,
      avgReadingTime,
      generatedSince: this.generatedContent.length > 0 
        ? this.generatedContent[0].createdAt 
        : new Date().toISOString(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Publish content (simulated)
   */
  async publishContent(contentId, destination) {
    const content = this.generatedContent.find(c => c.id === contentId);
    if (!content) {
      throw new Error('Content not found');
    }
    
    // Simulate publishing process
    content.status = 'published';
    content.publishedAt = new Date().toISOString();
    content.destination = destination;
    
    return {
      success: true,
      contentId,
      destination,
      publishedAt: content.publishedAt
    };
  }
}

// Example usage
async function main() {
  const contentCreator = new ContentCreator({
    ultraDex: {
      apiKey: process.env.ULTRA_DEX_API_KEY,
      endpoint: process.env.ULTRA_DEX_ENDPOINT || 'https://api.ultra-dex.ai'
    },
    brandGuidelines: {
      voice: 'professional yet approachable',
      tone: 'helpful and informative',
      keyMessages: ['innovation', 'reliability', 'customer-focus'],
      prohibitedContent: ['jargon-heavy text', 'negative language']
    },
    templates: {
      blogPost: {
        structure: ['introduction', 'problem', 'solution', 'benefits', 'conclusion'],
        wordCount: [800, 1200]
      }
    }
  });
  
  // Generate a blog post
  const blogPost = await contentCreator.generateBlogPost(
    'The Future of AI Orchestration',
    'How AI orchestration platforms are transforming enterprise workflows',
    1200,
    {
      audience: 'tech-leaders',
      keywords: ['AI orchestration', 'enterprise AI', 'workflow automation'],
      tone: 'thought-leadership'
    }
  );
  
  console.log(`Generated blog post: ${blogPost.title}`);
  console.log(`Word count: ${blogPost.metadata.wordCount}`);
  console.log(`Reading time: ${blogPost.metadata.readingTime} minutes`);
  
  // Generate social media content
  const socialContent = await contentCreator.generateSocialContent(
    'linkedin',
    'AI orchestration benefits',
    'promotional',
    {
      audience: 'tech-professionals',
      tone: 'insightful',
      hashtags: ['AI', 'Orchestration', 'Enterprise']
    }
  );
  
  console.log(`Generated ${socialContent.type} for ${socialContent.requirements.platform}`);
  
  // Print content statistics
  console.log('Content Statistics:', contentCreator.getStats());
}

if (require.main === module) {
  main().catch(console.error);
}

export default ContentCreator;