"""
Basic tests for the Ultra-Dex Python SDK
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock
from ultra_dex import UltraDex, Agent
from ultra_dex.exceptions import UltraDexException


@pytest.fixture
def mock_session():
    """Mock aiohttp session for testing"""
    session = AsyncMock()
    session.__aenter__ = AsyncMock(return_value=session)
    session.__aexit__ = AsyncMock(return_value=None)
    return session


@pytest.mark.asyncio
async def test_client_initialization():
    """Test client initialization"""
    client = UltraDex(api_key="test-key", endpoint="http://test.com")
    assert client.api_key == "test-key"
    assert client.endpoint == "http://test.com"


@pytest.mark.asyncio
async def test_create_agent():
    """Test creating an agent"""
    client = UltraDex(api_key="test-key", endpoint="http://test.com")
    client.session = AsyncMock()
    
    # Mock the response
    mock_response = AsyncMock()
    mock_response.status = 201
    mock_response.json.return_value = {
        "id": "agent-123",
        "name": "test-agent",
        "config": {"model": "gpt-4"}
    }
    client.session.post.return_value.__aenter__.return_value = mock_response
    
    agent = await client.create_agent("test-agent", {"model": "gpt-4"})
    
    assert isinstance(agent, Agent)
    assert agent.id == "agent-123"
    assert agent.name == "test-agent"


@pytest.mark.asyncio
async def test_execute_agent():
    """Test executing an agent"""
    client = UltraDex(api_key="test-key", endpoint="http://test.com")
    client.session = AsyncMock()
    
    # Mock the response
    mock_response = AsyncMock()
    mock_response.status = 200
    mock_response.json.return_value = {"result": "success"}
    client.session.post.return_value.__aenter__.return_value = mock_response
    
    result = await client.execute_agent("agent-123", {"task": "hello"})
    
    assert result == {"result": "success"}
    client.session.post.assert_called_once()


@pytest.mark.asyncio
async def test_store_memory():
    """Test storing memory"""
    client = UltraDex(api_key="test-key", endpoint="http://test.com")
    client.session = AsyncMock()
    
    # Mock the response
    mock_response = AsyncMock()
    mock_response.status = 201
    mock_response.json.return_value = {"id": "memory-123"}
    client.session.post.return_value.__aenter__.return_value = mock_response
    
    memory_id = await client.store_memory({"content": "test"})
    
    assert memory_id == "memory-123"


@pytest.mark.asyncio
async def test_retrieve_memory():
    """Test retrieving memory"""
    client = UltraDex(api_key="test-key", endpoint="http://test.com")
    client.session = AsyncMock()
    
    # Mock the response
    mock_response = AsyncMock()
    mock_response.status = 200
    mock_response.json.return_value = {"results": [{"id": "1", "content": "test"}]}
    client.session.post.return_value.__aenter__.return_value = mock_response
    
    results = await client.retrieve_memory("test")
    
    assert len(results) == 1
    assert results[0]["content"] == "test"


@pytest.mark.asyncio
async def test_agent_execute():
    """Test agent execution"""
    client = UltraDex(api_key="test-key", endpoint="http://test.com")
    agent = Agent(id="agent-123", name="test-agent", client=client)
    
    # Mock the client's execute_agent method
    client.execute_agent = AsyncMock(return_value={"result": "agent-success"})
    
    result = await agent.execute({"task": "hello"})
    
    assert result == {"result": "agent-success"}
    client.execute_agent.assert_called_once_with("agent-123", {"task": "hello"})


if __name__ == "__main__":
    pytest.main([__file__])