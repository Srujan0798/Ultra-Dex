"""
Ultra-Dex Python Exceptions
"""


class UltraDexException(Exception):
    """Base exception for Ultra-Dex SDK"""
    pass


class AuthenticationError(UltraDexException):
    """Raised when authentication fails"""
    pass


class AgentNotFoundError(UltraDexException):
    """Raised when an agent is not found"""
    pass


class NetworkError(UltraDexException):
    """Raised when a network error occurs"""
    pass


class ValidationError(UltraDexException):
    """Raised when validation fails"""
    pass