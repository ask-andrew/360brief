"""
Domain Intelligence Service for 360Brief

This module provides company information lookup based on email domains.
Primary provider: Hunter.io (https://hunter.io/)
Fallback: Basic domain parsing
"""

import os
import re
import json
import logging
from typing import Dict, Optional, Any, List
from datetime import datetime, timedelta
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# In-memory cache with TTL (24 hours)
CACHE: Dict[str, dict] = {}
CACHE_TTL_HOURS = 24

class DomainIntelligence:
    """
    Service for looking up company information from email domains.
    Uses Hunter.io API as the primary data source.
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the DomainIntelligence service.
        
        Args:
            api_key: Optional Hunter.io API key. If not provided, will try to get from
                   HUNTER_API_KEY environment variable.
        """
        self.api_key = api_key or os.getenv('HUNTER_API_KEY')
        self.base_url = "https://api.hunter.io/v2"
        
        if not self.api_key:
            logger.warning(
                "No Hunter.io API key provided. Only basic domain parsing will be available. "
                "Set HUNTER_API_KEY environment variable for full functionality."
            )
    
    @staticmethod
    def extract_domain(email: str) -> Optional[str]:
        """
        Extract and validate domain from an email address.
        
        Args:
            email: The email address to extract domain from
            
        Returns:
            The domain part of the email, or None if invalid
        """
        if not email or '@' not in email:
            return None
        
        domain = email.split('@')[-1].lower().strip()
        
        # Basic validation
        if not re.match(r'^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', domain):
            return None
            
        return domain
    
    def _get_cached_domain_info(self, domain: str) -> Optional[Dict[str, Any]]:
        """Get cached domain info if it exists and is not expired."""
        if domain not in CACHE:
            return None
            
        cached_data = CACHE[domain]
        cache_time = cached_data.get('_cached_at')
        
        if not cache_time:
            return None
            
        cache_expiry = datetime.fromisoformat(cache_time) + timedelta(hours=CACHE_TTL_HOURS)
        if datetime.utcnow() > cache_expiry:
            del CACHE[domain]  # Remove expired cache
            return None
            
        return cached_data
    
    def _cache_domain_info(self, domain: str, data: Dict[str, Any]) -> None:
        """Cache domain info with current timestamp."""
        data['_cached_at'] = datetime.utcnow().isoformat()
        CACHE[domain] = data
    
    def _lookup_hunter(self, domain: str) -> Optional[Dict[str, Any]]:
        """Lookup company info using Hunter.io's Domain API."""
        if not self.api_key:
            return None
            
        try:
            response = requests.get(
                f"{self.base_url}/domain-search",
                params={
                    'domain': domain,
                    'api_key': self.api_key
                },
                timeout=5
            )
            response.raise_for_status()
            data = response.json()
            
            if data.get('data') and 'name' in data['data']:
                return {
                    'name': data['data'].get('name', domain.split('.')[0].title()),
                    'description': data['data'].get('description', ''),
                    'industry': data['data'].get('industry', ''),
                    'logo': data['data'].get('logo', ''),
                    'website': domain,
                    'source': 'hunter',
                    'employees': data['data'].get('employees'),
                    'location': data['data'].get('location', ''),
                    'twitter': data['data'].get('twitter', ''),
                    'linkedin': data['data'].get('linkedin', ''),
                    'phone_numbers': data['data'].get('phone_numbers', []),
                    'tech_stack': data['data'].get('technologies', [])
                }
        except Exception as e:
            logger.warning(f"Hunter.io lookup failed for {domain}: {str(e)}")
            return None
    
    def get_company_info(self, email: str) -> Dict[str, Any]:
        """
        Get company information from an email address.
        
        Args:
            email: The email address to look up
            
        Returns:
            Dictionary containing company information, or minimal info if lookup fails
        """
        domain = self.extract_domain(email)
        if not domain:
            logger.warning(f"Invalid email format: {email}")
            return {}
        
        # Check cache first
        cached_info = self._get_cached_domain_info(domain)
        if cached_info:
            logger.debug(f"Using cached company info for domain: {domain}")
            return {k: v for k, v in cached_info.items() if not k.startswith('_')}
        
        # Try Hunter.io lookup if API key is available
        company_info = self._lookup_hunter(domain)
        
        if not company_info:
            # Fallback to basic domain info
            company_info = {
                'domain': domain,
                'name': domain.split('.')[0].title(),
                'source': 'domain_only',
                'note': 'Company lookup not available without API key'
            }
        
        # Cache the result
        self._cache_domain_info(domain, company_info.copy())
        
        return company_info

# Singleton instance
domain_intel = DomainIntelligence()

def get_company_info(email: str) -> Dict[str, Any]:
    """
    Convenience function to get company info from an email.
    
    Example usage:
        company_info = get_company_info("john.doe@example.com")
        print(company_info.get('name'))  # Example Company Inc.
    """
    return domain_intel.get_company_info(email)

if __name__ == "__main__":
    # Example usage
    test_emails = [
        "test@google.com",
        "invalid-email",
        "test@example.com"
    ]
    
    for email in test_emails:
        print(f"\nLooking up: {email}")
        result = get_company_info(email)
        print(json.dumps(result, indent=2))
