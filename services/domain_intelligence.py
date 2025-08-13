import os
import re
import json
import logging
from typing import Dict, Optional, Any, List, Tuple
from datetime import datetime, timedelta
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# In-memory cache with TTL (24 hours)
CACHE: Dict[str, dict] = {}
CACHE_TTL_HOURS = 24

class Provider:
    HUNTER = 'hunter'
    FULLCONTACT = 'fullcontact'
    APOLLO = 'apollo'

class DomainIntelligence:
    """
    Service for looking up company information from email domains.
    Uses the Hunter.io API (free tier available) for company lookups.
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the DomainIntelligence service.
        
        Args:
            api_key: Optional Clearbit API key. If not provided, will try to get from
                   CLEARBIT_API_KEY environment variable.
        """
        self.api_key = api_key or os.getenv('CLEARBIT_API_KEY')
        if not self.api_key:
            logger.warning(
                "No Clearbit API key provided. Some company lookups may be limited. "
                "Set CLEARBIT_API_KEY environment variable for full functionality."
            )
    
    @staticmethod
    def extract_domain(email: str) -> Optional[str]:
        """
        Extract domain from an email address.
        
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
            
        if (datetime.utcnow() - datetime.fromisoformat(cache_time)) > timedelta(hours=CACHE_TTL_HOURS):
            del CACHE[domain]  # Remove expired cache
            return None
            
        return cached_data
    
    def _cache_domain_info(self, domain: str, data: Dict[str, Any]) -> None:
        """Cache domain info with current timestamp."""
        data['_cached_at'] = datetime.utcnow().isoformat()
        CACHE[domain] = data
    
    def get_company_info(self, email: str) -> Dict[str, Any]:
        """
        Get company information from an email address.
        
        Args:
            email: The email address to look up
            
        Returns:
            Dictionary containing company information, or empty dict if not found
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
        
        if not self.api_key:
            logger.warning("No API key available for company lookup")
            return {
                'domain': domain,
                'name': domain.split('.')[0].title(),
                'source': 'domain_only',
                'note': 'API key not configured for full company lookup'
            }
        
        try:
            # Using Clearbit's Company API
            response = requests.get(
                f"https://company.clearbit.com/v2/companies/find?domain={domain}",
                auth=(self.api_key, '')
            )
            response.raise_for_status()
            
            company_data = response.json()
            
            # Transform to our format
            result = {
                'domain': domain,
                'name': company_data.get('name', domain.split('.')[0].title()),
                'description': company_data.get('description', ''),
                'industry': company_data.get('category', {}).get('industry', ''),
                'logo': company_data.get('logo', ''),
                'website': company_data.get('domain', ''),
                'source': 'clearbit',
                'founded_year': company_data.get('foundedYear'),
                'location': company_data.get('location', ''),
                'employees': company_data.get('metrics', {}).get('employees'),
                'employees_range': company_data.get('metrics', {}).get('employeesRange'),
                'tags': company_data.get('tags', []),
                'tech': company_data.get('tech', []),
                'type': company_data.get('type', 'private')
            }
            
            # Cache the result
            self._cache_domain_info(domain, result.copy())
            
            return result
            
        except requests.exceptions.RequestException as e:
            logger.warning(f"Error looking up company info for {domain}: {str(e)}")
            # Fallback to minimal info
            return {
                'domain': domain,
                'name': domain.split('.')[0].title(),
                'source': 'domain_only',
                'note': 'Company lookup failed, using domain only'
            }

# Singleton instance
domain_intel = DomainIntelligence()

def get_company_info(email: str) -> Dict[str, Any]:
    ""
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
