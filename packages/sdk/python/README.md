# Ultra-Dex Python SDK

The official Python SDK for the Ultra-Dex AI Orchestration Platform.

## Installation

```bash
pip install ultra-dex-sdk
```

## Quick Start

```python
import asyncio
from ultra_dex import UltraDex

async def main():
    # Initialize the client
    client = UltraDex(
        api_key="your-api-key",
        endpoint="https://api.ultra-dex.ai"
    )
    
    # Create an agent
    agent = await client.create_agent(
        name="my-agent",
        config={
            "model": "gpt-4",
            "temperature": 0.7
        }
    )
    
    # Execute a task
    result = await agent.execute({
        "prompt": "Write a short poem about AI"
    })
    
    print(result)

# Run the async function
asyncio.run(main())
```

## Features

- **Agent Management**: Create, configure, and execute AI agents
- **Memory System**: Store and retrieve contextual information
- **Chat Interface**: Send messages and receive responses
- **Streaming**: Stream responses in real-time
- **Async Support**: Full async/await support for high-performance applications

## API Reference

### UltraDex Client

#### `UltraDex(api_key=None, endpoint="http://localhost:8080")`

Initialize the Ultra-Dex client.

- `api_key` (str, optional): API key for authentication
- `endpoint` (str): Ultra-Dex server endpoint

#### `create_agent(name, config=None)`

Create a new agent.

- `name` (str): Name of the agent
- `config` (dict, optional): Configuration for the agent
- Returns: `Agent` instance

#### `get_agent(agent_id)`

Get an existing agent by ID.

- `agent_id` (str): ID of the agent to retrieve
- Returns: `Agent` instance or `None`

#### `execute_agent(agent_id, task)`

Execute a task with the specified agent.

- `agent_id` (str): ID of the agent to execute the task
- `task` (dict): Task to execute
- Returns: Execution result

#### `store_memory(data)`

Store data in memory.

- `data` (dict): Data to store in memory
- Returns: ID of the stored memory entry

#### `retrieve_memory(query, filters=None)`

Retrieve data from memory.

- `query` (str): Query to search for in memory
- `filters` (dict, optional): Additional filters for the search
- Returns: List of matching memory entries

#### `chat(messages, options=None)`

Send a chat request.

- `messages` (list): List of chat messages
- `options` (dict, optional): Additional options for the chat
- Returns: Chat response

#### `stream(messages, options=None)`

Stream a chat request.

- `messages` (list): List of chat messages
- `options` (dict, optional): Additional options for the stream
- Yields: Stream chunks

### Agent

#### `execute(task)`

Execute a task with this agent.

- `task` (dict): Task to execute
- Returns: Execution result

#### `update_config(new_config)`

Update the agent's configuration.

- `new_config` (dict): New configuration values

#### `delete()`

Delete this agent.

## Error Handling

The SDK raises `UltraDexException` for various error conditions:

- `AuthenticationError`: When authentication fails
- `AgentNotFoundError`: When an agent is not found
- `NetworkError`: When a network error occurs
- `ValidationError`: When validation fails

## Examples

### Creating and Using an Agent

```python
import asyncio
from ultra_dex import UltraDex

async def example():
    async with UltraDex(api_key="your-api-key") as client:
        # Create an agent
        agent = await client.create_agent(
            name="code-reviewer",
            config={
                "model": "gpt-4",
                "capabilities": ["code_review", "bug_detection"]
            }
        )
        
        # Execute a task
        result = await agent.execute({
            "prompt": "Review this code snippet",
            "code": "def hello():\n    print('Hello, world!')"
        })
        
        print(result)

asyncio.run(example())
```

### Storing and Retrieving Memory

```python
import asyncio
from ultra_dex import UltraDex

async def memory_example():
    async with UltraDex(api_key="your-api-key") as client:
        # Store information in memory
        memory_id = await client.store_memory({
            "type": "user_preference",
            "content": "prefers detailed explanations",
            "user_id": "user123"
        })
        
        print(f"Stored memory with ID: {memory_id}")
        
        # Retrieve information from memory
        memories = await client.retrieve_memory(
            query="user preferences",
            filters={"user_id": "user123"}
        )
        
        print(f"Retrieved {len(memories)} memories")

asyncio.run(memory_example())
```

### Streaming Responses

```python
import asyncio
from ultra_dex import UltraDex

async def stream_example():
    async with UltraDex(api_key="your-api-key") as client:
        messages = [
            {"role": "user", "content": "Tell me about the history of artificial intelligence"}
        ]
        
        async for chunk in client.stream(messages):
            print(chunk.get("content", ""), end="", flush=True)

asyncio.run(stream_example())
```

## Development

To contribute to the SDK:

1. Fork the repository
2. Create a virtual environment: `python -m venv venv && source venv/bin/activate`
3. Install in development mode: `pip install -e ".[dev]"`
4. Run tests: `pytest`

## License

MIT