"""
360Brief Analytics Package

This package provides unified communication analytics and insights
for the 360Brief executive dashboard.
"""

__version__ = "1.0.0"

# Import key components for easier access
from .main import create_app, run_server
from .core.config import settings

__all__ = ["create_app", "run_server", "settings"]
