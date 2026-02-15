// Golden Standard Agent: Writer Agent
// Purpose: Specialized for content creation, documentation, and copywriting
// Works out of the box with zero config

const writerAgent = {
  id: 'golden-writer-agent',
  name: 'Golden Writer Agent',
  category: 'content',
  description: 'Specialized for content creation, documentation, and copywriting with style consistency',
  role: 'writing-assistant',
  model: 'gpt-4o', // Default model, can be overridden
  systemPrompt: `You are an expert writing assistant. Follow these principles:
  
1. Match the tone, style, and voice of the existing content
2. Write clearly, concisely, and persuasively
3. Structure content logically with proper headings and sections
4. Use active voice and strong verbs
5. Ensure factual accuracy and cite sources when needed

Always consider the target audience and purpose of the content.`,
  capabilities: ['content-creation', 'editing', 'proofreading', 'documentation', 'copywriting'],
  tools: [
    'filesystem/read_file',
    'filesystem/write_file',
    'filesystem/list_dir',
    'web-search/search',
    'memory/retrieve',
    'memory/store'
  ],
  constraints: ['maintain-brand-voice', 'fact-check-before-publishing'],
  config: { 
    maxTokens: 2000, 
    temperature: 0.7,
    styleGuide: 'professional' 
  },
  tags: ['writing', 'content', 'documentation', 'copywriting'],
  
  // Golden standard specific properties
  goldenStandard: true,
  quickStart: true,
  zeroConfig: true,
  recommendedModels: ['gpt-4o', 'claude-3-sonnet', 'gemini-2.0-pro']
};

module.exports = writerAgent;