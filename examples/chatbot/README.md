# AI Chatbot Example

This example demonstrates how to create an AI-powered chatbot using Ultra-Dex. The chatbot maintains conversation history, learns from interactions, and provides intelligent responses.

## Features

- **Natural Language Understanding**: Processes and understands user queries
- **Context-Aware Responses**: Maintains context across multiple conversation turns
- **Conversation Memory**: Remembers previous interactions and user preferences
- **Multi-Turn Dialogues**: Handles complex conversations spanning multiple exchanges
- **Personality Customization**: Configurable personality and communication style
- **Intent Classification**: Identifies user intents and extracts entities
- **Knowledge Integration**: Retrieves and incorporates relevant information
- **Sentiment Analysis**: Detects user sentiment for appropriate responses

## Prerequisites

- Node.js 18+
- Ultra-Dex API key

## Setup

1. **Install Dependencies**:
   ```bash
   # This example uses the UltraDex library
   ```

2. **Environment Variables**:
   Create a `.env` file with the following:
   ```env
   ULTRA_DEX_API_KEY=your_ultra_dex_api_key
   ULTRA_DEX_ENDPOINT=https://api.ultra-dex.ai
   ```

3. **Run the Example**:
   ```bash
   node index.js
   ```

## Configuration

The chatbot uses several specialized agents:

- `intent-classifier`: Classifies user intents and extracts entities from messages
- `response-generator`: Generates contextually appropriate responses
- `conversation-manager`: Manages conversation flow and context
- `personality-engine`: Maintains consistent personality traits
- `knowledge-enhancer`: Retrieves and incorporates relevant knowledge

## Usage

The chatbot can handle various types of conversations:

```javascript
const chatbot = new Chatbot({
  ultraDex: {
    apiKey: process.env.ULTRA_DEX_API_KEY,
    endpoint: process.env.ULTRA_DEX_ENDPOINT || 'https://api.ultra-dex.ai'
  },
  personality: {
    name: 'Ultra-Dex Assistant',
    tone: 'helpful and professional',
    expertise: 'AI, technology, and software development',
    communicationStyle: 'clear, concise, and informative'
  }
});

// Process a user message
const response = await chatbot.processMessage('user123', 'Hello! Can you tell me about AI orchestration?');

console.log(response.response); // The bot's response
console.log(response.intent); // The classified intent
console.log(response.confidence); // Confidence level of the response

// Get conversation history
const history = chatbot.getConversationHistory('user123');

// Clear conversation history
chatbot.clearConversation('user123');

// Update bot personality
chatbot.updatePersonality({
  tone: 'friendly and casual',
  expertise: 'AI, technology, and creative arts'
});

// Train with examples
await chatbot.trainWithExamples([
  {
    input: 'What is your favorite programming language?',
    output: 'I appreciate all programming languages for their unique strengths. JavaScript is versatile for web development, Python excels in data science, and Rust offers excellent performance with safety.',
    context: { topic: 'programming' }
  }
]);

// Simulate a conversation for testing
const simulation = await chatbot.simulateConversation('What is machine learning?', 5);
```

## Personality Configuration

Customize the chatbot's personality:

- **Name**: The chatbot's identity
- **Tone**: Formal, casual, friendly, professional, etc.
- **Expertise**: Knowledge domains the bot specializes in
- **Communication Style**: How the bot structures responses

## Conversation Management

The chatbot maintains conversation context:

- **Message History**: Tracks all messages in a conversation
- **Context Variables**: Remembers important information from the conversation
- **Session Management**: Handles multiple concurrent conversations
- **Memory Archiving**: Preserves important information across sessions

## Intent Classification

The system identifies user intents:

- **Question Answering**: Responds to inquiries
- **Task Requests**: Handles action requests
- **Chitchat**: Manages casual conversation
- **Feedback**: Processes user feedback
- **Error Recovery**: Handles misunderstood inputs

## Knowledge Integration

The chatbot accesses relevant information:

- **External Knowledge Bases**: Connects to documentation and resources
- **Contextual Retrieval**: Finds information relevant to the conversation
- **Source Attribution**: Cites sources when providing information
- **Fact Verification**: Ensures accuracy of responses

## Sentiment Analysis

Detects and responds to user emotions:

- **Positive Detection**: Recognizes happy or satisfied users
- **Negative Detection**: Identifies frustrated or upset users
- **Neutral Handling**: Manages neutral interactions appropriately
- **Empathetic Responses**: Adjusts tone based on detected sentiment

## Training and Improvement

Continuously improve the chatbot:

- **Example-Based Training**: Provide conversation examples
- **Feedback Integration**: Learn from user corrections
- **Performance Monitoring**: Track conversation quality
- **Behavior Adjustment**: Modify responses based on outcomes

## Export and Import

Manage conversation data:

- **JSON Export**: Export conversations in JSON format
- **CSV Export**: Export conversations in CSV format
- **Data Import**: Load previous conversations
- **Analytics**: Analyze conversation patterns

## Statistics and Analytics

Track chatbot performance:

- **Conversation Volume**: Number of conversations handled
- **Message Count**: Total messages processed
- **Common Intents**: Most frequent user intents
- **Engagement Metrics**: Conversation length and user satisfaction

## Customization

You can customize the chatbot by modifying:

- Personality traits and communication style
- Knowledge sources and information access
- Response formatting and structure
- Conversation flow and management
- Intent classification categories
- Sentiment analysis sensitivity

## Security

- Store API keys securely using environment variables
- Implement proper access controls for conversation data
- Ensure privacy compliance for user interactions