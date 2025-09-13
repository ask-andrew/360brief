"""
Executive Intelligence Email Extractor
Processes raw email content and extracts critical business information
"""

import json
import re
from typing import List, Dict, Optional, Any
from datetime import datetime
from bs4 import BeautifulSoup
import html2text

class EmailIntelligenceExtractor:
    """Extract executive-relevant intelligence from raw emails"""
    
    # Patterns that indicate promotional/marketing emails to filter out
    FILTER_PATTERNS = [
        # Marketing/Promotional
        r'unsubscribe',
        r'view\s+in\s+browser',
        r'marketing\s+email',
        r'promotional\s+offer',
        r'limited\s+time\s+offer',
        r'click\s+here\s+to\s+save',
        r'special\s+offer',
        r'% off',
        r'discount code',
        
        # Newsletters (unless business-critical)
        r'newsletter',
        r'weekly\s+digest',
        r'daily\s+briefing',
        r'subscribe\s+to',
        
        # Social Media
        r'facebook\.com',
        r'twitter\.com', 
        r'instagram\.com',
        r'linkedin\.com/comm/',  # LinkedIn notifications
        r'new\s+follower',
        r'liked\s+your\s+post',
        
        # Automated/System
        r'do\s+not\s+reply',
        r'noreply@',
        r'no-reply@',
        r'automated\s+message',
        r'system\s+notification',
        r'password\s+reset',
        r'verify\s+your\s+email',
    ]
    
    # Patterns that indicate executive-relevant content
    RELEVANCE_PATTERNS = {
        'action_required': [
            r'action\s+required',
            r'needs?\s+your?\s+(approval|review|feedback|input)',
            r'(please|kindly)\s+(review|approve|confirm)',
            r'awaiting\s+your?\s+response',
            r'urgent',
            r'asap',
            r'by\s+eod',
            r'deadline',
        ],
        'project_update': [
            r'project\s+(status|update)',
            r'milestone',
            r'deliverable',
            r'sprint',
            r'release',
            r'deployment',
            r'launch',
            r'roadmap',
        ],
        'blocker': [
            r'blocked',
            r'blocker',
            r'impediment',
            r'risk',
            r'issue',
            r'problem',
            r'concern',
            r'escalation',
            r'critical',
        ],
        'achievement': [
            r'(completed|finished|delivered)',
            r'achievement',
            r'success',
            r'win',
            r'milestone\s+reached',
            r'goal\s+achieved',
            r'ahead\s+of\s+schedule',
            r'exceeded',
        ],
        'meeting': [
            r'meeting',
            r'conference\s+call',
            r'sync',
            r'1:1',
            r'one-on-one',
            r'standup',
            r'retrospective',
            r'review\s+session',
        ],
        'financial': [
            r'budget',
            r'revenue',
            r'cost',
            r'expense',
            r'invoice',
            r'payment',
            r'financial',
            r'roi',
            r'mrr',
            r'arr',
        ]
    }
    
    def __init__(self):
        self.h = html2text.HTML2Text()
        self.h.ignore_links = True
        self.h.ignore_images = True
        self.h.ignore_emphasis = False
        self.h.body_width = 0  # Don't wrap lines
        
    def extract_text_from_html(self, html_content: str) -> str:
        """Convert HTML to plain text"""
        try:
            # First try BeautifulSoup for better extraction
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Remove script and style elements
            for script in soup(["script", "style"]):
                script.decompose()
                
            # Get text
            text = soup.get_text()
            
            # Break into lines and remove leading/trailing space
            lines = (line.strip() for line in text.splitlines())
            
            # Break multi-headlines into a line each
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            
            # Drop blank lines
            text = '\n'.join(chunk for chunk in chunks if chunk)
            
            return text
        except:
            # Fallback to html2text
            return self.h.handle(html_content)
    
    def should_filter_email(self, text: str, sender: str = "") -> bool:
        """Check if email should be filtered out"""
        text_lower = text.lower()
        sender_lower = sender.lower()
        
        # Check filter patterns
        for pattern in self.FILTER_PATTERNS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                # Check if it might still be relevant despite filter pattern
                has_relevance = False
                for category, patterns in self.RELEVANCE_PATTERNS.items():
                    if category in ['action_required', 'project_update', 'blocker']:
                        for rel_pattern in patterns:
                            if re.search(rel_pattern, text_lower, re.IGNORECASE):
                                has_relevance = True
                                break
                    if has_relevance:
                        break
                        
                if not has_relevance:
                    return True
                    
        # Filter known automated senders
        automated_senders = [
            'noreply', 'no-reply', 'donotreply', 'notifications',
            'alerts', 'system', 'automated', 'bot'
        ]
        
        for auto_sender in automated_senders:
            if auto_sender in sender_lower:
                # Still check for relevance
                has_relevance = False
                for patterns in self.RELEVANCE_PATTERNS.values():
                    for pattern in patterns:
                        if re.search(pattern, text_lower, re.IGNORECASE):
                            has_relevance = True
                            break
                    if has_relevance:
                        break
                if not has_relevance:
                    return True
                    
        return False
    
    def extract_projects(self, text: str) -> List[str]:
        """Extract project names/references from email"""
        projects = []
        
        # Look for explicit project mentions
        project_patterns = [
            r'(?:project|initiative|program)[\s:]+([A-Z][A-Za-z0-9\s-]+)',
            r'([A-Z]{2,}-\d+)',  # JIRA-style tickets
            r'(?:re|regarding|about):\s+([A-Z][A-Za-z0-9\s-]+)',
        ]
        
        for pattern in project_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                project = match.strip()
                if len(project) > 2 and project not in projects:
                    projects.append(project)
                    
        return projects[:5]  # Limit to top 5 projects
    
    def extract_blockers(self, text: str) -> List[str]:
        """Extract blockers/issues from email"""
        blockers = []
        text_lower = text.lower()
        
        # Look for blocker indicators
        blocker_sentences = []
        sentences = text.split('.')
        
        for sentence in sentences:
            sentence_lower = sentence.lower()
            for pattern in self.RELEVANCE_PATTERNS['blocker']:
                if re.search(pattern, sentence_lower, re.IGNORECASE):
                    # Clean and add the sentence
                    clean_sentence = sentence.strip()
                    if len(clean_sentence) > 10 and len(clean_sentence) < 200:
                        blocker_sentences.append(clean_sentence)
                        break
                        
        # Extract key blocker phrases
        for sentence in blocker_sentences[:3]:  # Top 3 blockers
            # Simplify to core issue
            if 'blocked' in sentence.lower():
                blockers.append(sentence)
            elif 'issue' in sentence.lower() or 'problem' in sentence.lower():
                blockers.append(sentence)
            elif 'risk' in sentence.lower() or 'concern' in sentence.lower():
                blockers.append(sentence)
                
        return blockers
    
    def extract_achievements(self, text: str) -> List[str]:
        """Extract achievements/wins from email"""
        achievements = []
        
        sentences = text.split('.')
        for sentence in sentences:
            sentence_lower = sentence.lower()
            for pattern in self.RELEVANCE_PATTERNS['achievement']:
                if re.search(pattern, sentence_lower, re.IGNORECASE):
                    clean_sentence = sentence.strip()
                    if len(clean_sentence) > 10 and len(clean_sentence) < 200:
                        achievements.append(clean_sentence)
                        break
                        
        return achievements[:3]  # Top 3 achievements
    
    def determine_email_type(self, text: str) -> str:
        """Determine the primary type of the email"""
        text_lower = text.lower()
        type_scores = {}
        
        # Score each type based on pattern matches
        for email_type, patterns in self.RELEVANCE_PATTERNS.items():
            score = 0
            for pattern in patterns:
                matches = len(re.findall(pattern, text_lower, re.IGNORECASE))
                score += matches
            type_scores[email_type] = score
            
        # Get the type with highest score
        if type_scores:
            max_type = max(type_scores, key=type_scores.get)
            if type_scores[max_type] > 0:
                return max_type
                
        return "general"
    
    def create_summary(self, text: str, max_length: int = 150) -> str:
        """Create a concise executive summary"""
        # Get first meaningful paragraph
        paragraphs = text.split('\n\n')
        
        for para in paragraphs:
            # Skip very short paragraphs
            if len(para) < 20:
                continue
                
            # Skip paragraphs that look like headers/footers
            if any(word in para.lower() for word in ['unsubscribe', 'copyright', 'privacy']):
                continue
                
            # Found a good paragraph, summarize it
            sentences = para.split('.')
            summary = sentences[0].strip()
            
            if len(summary) > max_length:
                summary = summary[:max_length-3] + "..."
                
            return summary
            
        # Fallback: just use first 150 chars
        clean_text = ' '.join(text.split())
        if len(clean_text) > max_length:
            return clean_text[:max_length-3] + "..."
        return clean_text
    
    def process_email(self, 
                     raw_content: str,
                     sender: str = "",
                     subject: str = "",
                     date: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Process a raw email and extract executive intelligence
        
        Args:
            raw_content: Raw email HTML/text content
            sender: Email sender address
            subject: Email subject line
            date: Email date/time
            
        Returns:
            List with single dict if relevant, empty list if filtered
        """
        
        # Extract text from HTML
        if '<html' in raw_content.lower() or '<body' in raw_content.lower():
            text = self.extract_text_from_html(raw_content)
        else:
            text = raw_content
            
        # Combine subject and body for analysis
        full_text = f"{subject}\n\n{text}"
        
        # Check if should filter
        if self.should_filter_email(full_text, sender):
            return []
            
        # Extract intelligence
        email_type = self.determine_email_type(full_text)
        
        # Skip if no relevant type detected
        if email_type == "general" and not any(
            re.search(pattern, full_text.lower(), re.IGNORECASE) 
            for patterns in self.RELEVANCE_PATTERNS.values() 
            for pattern in patterns
        ):
            return []
            
        # Build response
        result = {
            "title": subject or "No Subject",
            "sender": sender or "Unknown",
            "date": date or datetime.now().isoformat(),
            "type": email_type,
            "projects": self.extract_projects(full_text),
            "blockers": self.extract_blockers(full_text),
            "achievements": self.extract_achievements(full_text),
            "key_summary": self.create_summary(text)
        }
        
        return [result]


# Example usage and testing
if __name__ == "__main__":
    extractor = EmailIntelligenceExtractor()
    
    # Test with sample emails
    test_emails = [
        {
            "content": """
            Subject: Project Alpha Status Update
            
            Hi Team,
            
            Quick update on Project Alpha:
            - Completed API integration ahead of schedule
            - Currently blocked on database migration due to permission issues
            - Need approval for additional cloud resources by EOD
            
            The team has done excellent work this sprint, especially Sarah who 
            delivered the payment module 3 days early.
            
            Please review and approve the resource request ASAP.
            
            Thanks,
            John
            """,
            "sender": "john.smith@company.com",
            "subject": "Project Alpha Status Update"
        },
        {
            "content": """
            <html>
            <body>
            <p>Save 50% on all products this weekend only!</p>
            <p>Click here to shop now</p>
            <p>Unsubscribe from these emails</p>
            </body>
            </html>
            """,
            "sender": "deals@shop.com",
            "subject": "Weekend Sale - 50% Off!"
        }
    ]
    
    for email in test_emails:
        result = extractor.process_email(
            email["content"],
            email["sender"],
            email["subject"]
        )
        print(f"\nEmail from {email['sender']}:")
        print(json.dumps(result, indent=2))