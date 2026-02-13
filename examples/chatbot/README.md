# Ultra-Dex Chatbot Example

This example demonstrates how to create a sophisticated chatbot using Ultra-Dex's AI orchestration capabilities.

## Overview

This chatbot combines multiple specialized agents to provide intelligent, contextual responses:

- **Intent Classifier**: Determines the user's intent
- **Context Manager**: Maintains conversation history and context
- **Response Generator**: Crafts appropriate responses
- **Knowledge Base**: Retrieves relevant information

## Setup

1. Make sure Ultra-Dex is installed and configured:
   ```bash
   npm install -g ultra-dex
   ultra-dex config --wizard
   ```

2. Navigate to this directory:
   ```bash
   cd examples/chatbot
   ```

## Usage

Run the chatbot example:

```bash
ultra-dex run --task "Create a customer support chatbot that can answer questions about orders, shipping, and returns"
```

Or use the interactive mode:

```bash
ultra-dex run --interactive
```

## Architecture

The chatbot follows this workflow:

1. **Input Processing**: User message is analyzed for intent and entities
2. **Context Enrichment**: Conversation history and user profile are retrieved
3. **Knowledge Retrieval**: Relevant information is fetched from knowledge base
4. **Response Generation**: A contextual response is crafted
5. **Memory Update**: Conversation is stored for future context

## Files

- `chatbot-agent.md`: Agent definition and system prompt
- `knowledge-base.json`: Sample knowledge base
- `conversation-history.json`: Example conversation history
- `config.json`: Configuration for the chatbot

## Customization

You can customize the chatbot by modifying:

- **Agent Prompts**: Adjust the behavior in `chatbot-agent.md`
- **Knowledge Base**: Add domain-specific information to `knowledge-base.json`
- **Workflows**: Modify the orchestration in `workflow.json`

## Advanced Features

- **Multi-turn Conversations**: Maintains context across multiple exchanges
- **Personalization**: Adapts responses based on user history
- **Fallback Handling**: Gracefully handles unrecognized intents
- **Learning**: Improves over time through interaction logging

## Next Steps

- Integrate with your existing customer support system
- Add more specialized agents for domain-specific tasks
- Connect to live databases for real-time information
- Implement sentiment analysis for emotional intelligence