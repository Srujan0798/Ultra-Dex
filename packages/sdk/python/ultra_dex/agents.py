"""
Ultra-Dex Python Agent Module
"""

from typing import Dict, Any, Optional
from .exceptions import UltraDexException


class Agent:
    def __init__(self, id: str, name: str, config: Optional[Dict[str, Any]] = None, client=None):
        """
        Initialize an Agent instance
        
        Args:
            id: Unique identifier for the agent
            name: Name of the agent
            config: Configuration for the agent
            client: UltraDex client instance
        """
        self.id = id
        self.name = name
        self.config = config or {}
        self.client = client
    
    def describe(self) -> Dict[str, Any]:
        """
        Get a description of the agent
        
        Returns:
            Dictionary containing agent information
        """
        return {
            "id": self.id,
            "name": self.name,
            "config": self.config
        }
    
    async def execute(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a task with this agent
        
        Args:
            task: Task to execute
            
        Returns:
            Execution result
        """
        if not self.client:
            raise UltraDexException("Agent not associated with a client")
        
        return await self.client.execute_agent(self.id, task)
    
    async def update_config(self, new_config: Dict[str, Any]):
        """
        Update the agent's configuration
        
        Args:
            new_config: New configuration values
        """
        self.config.update(new_config)
        
        # If we have a client, update the server-side config too
        if self.client and self.client.session:
            payload = {
                "config": self.config
            }
            
            try:
                async with self.client.session.patch(f"/api/v1/agents/{self.id}", json=payload) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise UltraDexException(f"Failed to update agent config: {response.status} - {error_text}")
            except Exception as e:
                raise UltraDexException(f"Network error while updating agent config: {str(e)}")
    
    async def delete(self):
        """
        Delete this agent
        """
        if not self.client:
            raise UltraDexException("Agent not associated with a client")
        
        try:
            async with self.client.session.delete(f"/api/v1/agents/{self.id}") as response:
                if response.status == 204:
                    # Remove from client's cache
                    if self.id in self.client.agents:
                        del self.client.agents[self.id]
                    return True
                else:
                    error_text = await response.text()
                    raise UltraDexException(f"Failed to delete agent: {response.status} - {error_text}")
        except Exception as e:
            raise UltraDexException(f"Network error while deleting agent: {str(e)}")
    
    def __repr__(self):
        return f"Agent(id='{self.id}', name='{self.name}')"