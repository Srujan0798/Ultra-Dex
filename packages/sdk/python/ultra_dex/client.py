"""
Ultra-Dex Python Client
"""

import asyncio
import aiohttp
import json
from typing import Dict, Any, Optional, AsyncIterator
from .agents import Agent
from .exceptions import UltraDexException


class UltraDex:
    def __init__(self, api_key: Optional[str] = None, endpoint: str = "http://localhost:8080"):
        """
        Initialize the Ultra-Dex client
        
        Args:
            api_key: API key for authentication
            endpoint: Ultra-Dex server endpoint
        """
        self.api_key = api_key
        self.endpoint = endpoint.rstrip('/')
        self.session = None
        self.agents = {}  # In-memory agent storage
    
    async def __aenter__(self):
        """Async context manager entry"""
        await self.initialize()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.close()
    
    async def initialize(self):
        """Initialize the client session"""
        if self.session is None:
            headers = {}
            if self.api_key:
                headers['Authorization'] = f'Bearer {self.api_key}'
            
            self.session = aiohttp.ClientSession(
                base_url=self.endpoint,
                headers=headers
            )
    
    async def close(self):
        """Close the client session"""
        if self.session:
            await self.session.close()
            self.session = None
    
    async def create_agent(self, name: str, config: Optional[Dict[str, Any]] = None) -> Agent:
        """
        Create a new agent
        
        Args:
            name: Name of the agent
            config: Configuration for the agent
            
        Returns:
            Created Agent instance
        """
        if not self.session:
            raise UltraDexException("Client not initialized. Call initialize() first.")
        
        if config is None:
            config = {}
        
        payload = {
            "name": name,
            "config": config
        }
        
        try:
            async with self.session.post("/api/v1/agents", json=payload) as response:
                if response.status == 201:
                    data = await response.json()
                    agent = Agent(
                        id=data["id"],
                        name=data["name"],
                        config=data.get("config", {}),
                        client=self
                    )
                    self.agents[agent.id] = agent
                    return agent
                else:
                    error_text = await response.text()
                    raise UltraDexException(f"Failed to create agent: {response.status} - {error_text}")
        except aiohttp.ClientError as e:
            raise UltraDexException(f"Network error while creating agent: {str(e)}")
    
    async def get_agent(self, agent_id: str) -> Optional[Agent]:
        """
        Get an existing agent by ID
        
        Args:
            agent_id: ID of the agent to retrieve
            
        Returns:
            Agent instance or None if not found
        """
        if agent_id in self.agents:
            return self.agents[agent_id]
        
        if not self.session:
            raise UltraDexException("Client not initialized. Call initialize() first.")
        
        try:
            async with self.session.get(f"/api/v1/agents/{agent_id}") as response:
                if response.status == 200:
                    data = await response.json()
                    agent = Agent(
                        id=data["id"],
                        name=data["name"],
                        config=data.get("config", {}),
                        client=self
                    )
                    self.agents[agent.id] = agent
                    return agent
                elif response.status == 404:
                    return None
                else:
                    error_text = await response.text()
                    raise UltraDexException(f"Failed to get agent: {response.status} - {error_text}")
        except aiohttp.ClientError as e:
            raise UltraDexException(f"Network error while getting agent: {str(e)}")
    
    async def execute_agent(self, agent_id: str, task: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a task with the specified agent
        
        Args:
            agent_id: ID of the agent to execute the task
            task: Task to execute
            
        Returns:
            Execution result
        """
        if not self.session:
            raise UltraDexException("Client not initialized. Call initialize() first.")
        
        payload = {
            "task": task
        }
        
        try:
            async with self.session.post(f"/api/v1/agents/{agent_id}/execute", json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    return result
                else:
                    error_text = await response.text()
                    raise UltraDexException(f"Failed to execute agent: {response.status} - {error_text}")
        except aiohttp.ClientError as e:
            raise UltraDexException(f"Network error while executing agent: {str(e)}")
    
    async def store_memory(self, data: Dict[str, Any]) -> str:
        """
        Store data in memory
        
        Args:
            data: Data to store in memory
            
        Returns:
            ID of the stored memory entry
        """
        if not self.session:
            raise UltraDexException("Client not initialized. Call initialize() first.")
        
        try:
            async with self.session.post("/api/v1/memory", json=data) as response:
                if response.status == 201:
                    result = await response.json()
                    return result["id"]
                else:
                    error_text = await response.text()
                    raise UltraDexException(f"Failed to store memory: {response.status} - {error_text}")
        except aiohttp.ClientError as e:
            raise UltraDexException(f"Network error while storing memory: {str(e)}")
    
    async def retrieve_memory(self, query: str, filters: Optional[Dict[str, Any]] = None) -> list:
        """
        Retrieve data from memory
        
        Args:
            query: Query to search for in memory
            filters: Additional filters for the search
            
        Returns:
            List of matching memory entries
        """
        if not self.session:
            raise UltraDexException("Client not initialized. Call initialize() first.")
        
        payload = {
            "query": query,
            "filters": filters or {}
        }
        
        try:
            async with self.session.post("/api/v1/memory/search", json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    return result.get("results", [])
                else:
                    error_text = await response.text()
                    raise UltraDexException(f"Failed to retrieve memory: {response.status} - {error_text}")
        except aiohttp.ClientError as e:
            raise UltraDexException(f"Network error while retrieving memory: {str(e)}")
    
    async def list_agents(self) -> list:
        """
        List all available agents
        
        Returns:
            List of agent descriptors
        """
        if not self.session:
            raise UltraDexException("Client not initialized. Call initialize() first.")
        
        try:
            async with self.session.get("/api/v1/agents") as response:
                if response.status == 200:
                    result = await response.json()
                    return result.get("agents", [])
                else:
                    error_text = await response.text()
                    raise UltraDexException(f"Failed to list agents: {response.status} - {error_text}")
        except aiohttp.ClientError as e:
            raise UltraDexException(f"Network error while listing agents: {str(e)}")
    
    async def chat(self, messages: list, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Send a chat request
        
        Args:
            messages: List of chat messages
            options: Additional options for the chat
            
        Returns:
            Chat response
        """
        if not self.session:
            raise UltraDexException("Client not initialized. Call initialize() first.")
        
        payload = {
            "messages": messages,
            "options": options or {}
        }
        
        try:
            async with self.session.post("/api/v1/chat", json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    return result
                else:
                    error_text = await response.text()
                    raise UltraDexException(f"Failed to send chat: {response.status} - {error_text}")
        except aiohttp.ClientError as e:
            raise UltraDexException(f"Network error while sending chat: {str(e)}")
    
    async def stream(self, messages: list, options: Optional[Dict[str, Any]] = None) -> AsyncIterator[Dict[str, Any]]:
        """
        Stream a chat request
        
        Args:
            messages: List of chat messages
            options: Additional options for the stream
            
        Yields:
            Stream chunks
        """
        if not self.session:
            raise UltraDexException("Client not initialized. Call initialize() first.")
        
        payload = {
            "messages": messages,
            "options": options or {},
            "stream": True
        }
        
        try:
            async with self.session.post("/api/v1/chat", json=payload) as response:
                if response.status == 200:
                    async for line in response.content:
                        line = line.decode('utf-8').strip()
                        if line.startswith('data: '):
                            chunk_data = line[6:]  # Remove 'data: ' prefix
                            if chunk_data != '[DONE]':
                                try:
                                    chunk = json.loads(chunk_data)
                                    yield chunk
                                except json.JSONDecodeError:
                                    continue
                else:
                    error_text = await response.text()
                    raise UltraDexException(f"Failed to stream chat: {response.status} - {error_text}")
        except aiohttp.ClientError as e:
            raise UltraDexException(f"Network error while streaming chat: {str(e)}")