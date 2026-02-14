# Slack Bot Example

This example demonstrates how to create a Slack bot that integrates with Ultra-Dex AI agents to provide intelligent responses and actions within Slack conversations.

## Features

- **Natural Language Processing**: Understands and responds to various types of requests
- **Multi-Agent Integration**: Uses specialized agents for different tasks
- **Context Awareness**: Maintains conversation context for better responses
- **Code Assistance**: Provides code suggestions, reviews, and explanations
- **Task Execution**: Performs tasks and provides status updates
- **Content Summarization**: Summarizes long threads or documents

## Prerequisites

- Node.js 18+
- Ultra-Dex API key
- Slack bot token with appropriate permissions
- Slack workspace for testing

## Setup

1. **Install Dependencies**:
   ```bash
   npm install @slack/web-api @slack/rtm-api
   ```

2. **Environment Variables**:
   Create a `.env` file with the following:
   ```env
   SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
   ULTRA_DEX_API_KEY=your_ultra_dex_api_key
   ULTRA_DEX_ENDPOINT=https://api.ultra-dex.ai
   ```

3. **Create Slack App**:
   - Go to https://api.slack.com/apps
   - Create a new app
   - Add Bot Token Scopes: `chat:write`, `channels:read`, `groups:read`, `im:read`, `mpim:read`
   - Install the app to your workspace
   - Note the Bot User OAuth Token

4. **Run the Bot**:
   ```bash
   node index.js
   ```

## Configuration

The bot uses several specialized agents:

- `question-answerer`: Answers questions based on available knowledge
- `task-executor`: Executes tasks and provides status updates
- `summarizer`: Summarizes long documents or conversations
- `code-helper`: Provides code suggestions and explanations
- `scheduler`: Helps schedule meetings and manage calendars

## Usage

Once running, invite the bot to a channel and interact with it using natural language:

- Ask questions: "What is the weather today?"
- Request summaries: "Summarize the last thread"
- Get code help: "Show me how to reverse a string in JavaScript"
- Schedule meetings: "Schedule a meeting for tomorrow at 2 PM"

## Customization

You can customize the bot's behavior by modifying:

- Agent prompts and instructions
- Intent detection logic
- Response formatting
- Additional agent capabilities

## Security

- Store API keys securely using environment variables
- Use Slack's built-in security features
- Implement proper access controls for sensitive operations