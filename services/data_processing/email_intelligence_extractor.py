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
        r'save\s+\$',
        r'free\s+shipping',
        r'shop\s+now',
        r'buy\s+now',
        r'get\s+\d+%\s+off',
        
        # Newsletters (unless business-critical)
        r'newsletter',
        r'weekly\s+digest',
        r'daily\s+briefing',
        r'subscribe\s+to',
        r'weekly\s+roundup',
        r'monthly\s+update',
        
        # Social Media
        r'facebook\.com',
        r'twitter\.com', 
        r'instagram\.com',
        r'linkedin\.com/comm/',  # LinkedIn notifications
        r'new\s+follower',
        r'liked\s+your\s+post',
        r'viewed\s+your\s+profile',
        r'connection\s+request',
        
        # Automated/System
        r'do\s+not\s+reply',
        r'noreply@',
        r'no-reply@',
        r'automated\s+message',
        r'system\s+notification',
        r'password\s+reset',
        r'verify\s+your\s+email',
        r'account\s+verification',
        r'security\s+alert',
        
        # Conference/Event spam
        r'webinar\s+invitation',
        r'conference\s+registration',
        r'event\s+reminder',
        r'join\s+us\s+for',
        
        # Generic notifications
        r'notification\s+preferences',
        r'email\s+preferences',
        r'update\s+your\s+settings',
        r'manage\s+subscription',
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
        """Convert HTML to plain text with aggressive noise removal"""
        try:
            # Pre-clean the HTML before parsing
            cleaned_html = self.pre_clean_html(html_content)
            
            # Use BeautifulSoup for better extraction
            soup = BeautifulSoup(cleaned_html, 'html.parser')
            
            # Remove unwanted elements
            for element in soup(["script", "style", "head", "meta", "link", "noscript", "iframe"]):
                element.decompose()
            
            # Remove email-specific noise elements
            for element in soup.find_all(attrs={"class": re.compile(r"(unsubscribe|footer|header|navigation|sidebar)", re.I)}):
                element.decompose()
                
            # Remove elements with CSS-heavy content
            for element in soup.find_all():
                if element.get_text(strip=True) == "" and element.name not in ["br", "hr"]:
                    element.decompose()
                    
            # Get text
            text = soup.get_text(separator='\n', strip=True)
            
            # Post-process the text
            text = self.post_clean_text(text)
            
            return text
        except Exception as e:
            # Fallback to html2text with better settings
            self.h.ignore_links = True
            self.h.ignore_images = True  
            self.h.ignore_emphasis = True
            self.h.bypass_tables = True
            return self.post_clean_text(self.h.handle(html_content))
    
    def pre_clean_html(self, html_content: str) -> str:
        """Pre-process HTML to remove CSS blocks and email artifacts"""
        # Remove CSS style blocks completely (including nested ones)
        html_content = re.sub(r'<style[^>]*>.*?</style>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
        
        # Remove inline CSS in style attributes
        html_content = re.sub(r'\sstyle\s*=\s*["\'][^"\']*["\']', '', html_content, flags=re.IGNORECASE)
        
        # Remove CSS media queries and rules that appear as text
        html_content = re.sub(r'@media[^{]*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', '', html_content, flags=re.DOTALL)
        html_content = re.sub(r'\.[a-z-]+\s*\{[^}]+\}', '', html_content, flags=re.IGNORECASE)
        html_content = re.sub(r'body\s*[^{]*\{[^}]+\}', '', html_content, flags=re.IGNORECASE)
        
        # Remove Substack-specific tracking pixels and hidden content
        html_content = re.sub(r'&#847;\s*&nbsp;\s*&#8199;\s*&#173;', '', html_content)
        html_content = re.sub(r'&#\d+;', '', html_content)  # Remove HTML entities
        
        # Remove email headers/footers patterns
        html_content = re.sub(r'view\s+in\s+browser.*?unsubscribe', '', html_content, flags=re.DOTALL | re.IGNORECASE)
        html_content = re.sub(r'this\s+email\s+was\s+sent\s+to.*?unsubscribe', '', html_content, flags=re.DOTALL | re.IGNORECASE)
        
        return html_content
    
    def post_clean_text(self, text: str) -> str:
        """Post-process extracted text to remove remaining artifacts"""
        if not text:
            return text
            
        # Remove CSS-like patterns that survived extraction
        text = re.sub(r'\w+\s*:\s*[^;]+;', '', text)  # CSS property: value;
        text = re.sub(r'\{\s*[^}]*\}', '', text)  # Remove any remaining { } blocks
        text = re.sub(r'@media[^{]*\{.*?\}', '', text, flags=re.DOTALL)
        
        # Clean up excessive whitespace and HTML entities
        text = re.sub(r'\s{3,}', '\n\n', text)  # Replace 3+ spaces with double newline
        text = re.sub(r'\n{3,}', '\n\n', text)  # Replace 3+ newlines with double newline
        text = re.sub(r'&nbsp;|\u00a0', ' ', text)  # Non-breaking spaces
        text = re.sub(r'&[a-z]+;', '', text)  # HTML entities
        
        # Remove email signature patterns
        text = re.sub(r'unsubscribe.*?$', '', text, flags=re.MULTILINE | re.IGNORECASE)
        text = re.sub(r'view\s+in\s+browser.*?$', '', text, flags=re.MULTILINE | re.IGNORECASE)
        text = re.sub(r'privacy\s+policy.*?$', '', text, flags=re.MULTILINE | re.IGNORECASE)
        
        # Remove lines that are mostly CSS artifacts
        lines = text.split('\n')
        cleaned_lines = []
        for line in lines:
            line = line.strip()
            # Skip lines that look like CSS or contain mostly punctuation
            if (len(line) > 0 and 
                not re.match(r'^[\s\-_=\*#]*$', line) and  # Not just punctuation
                not re.search(r'(margin|padding|font|color|width|height):', line.lower()) and
                len([c for c in line if c.isalnum()]) > len(line) * 0.3):  # At least 30% alphanumeric
                cleaned_lines.append(line)
                
        return '\n'.join(cleaned_lines).strip()
    
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
        
        # Look for explicit project mentions in subject lines and content
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            # Extract from subject lines
            if line.startswith('Subject:'):
                subject_text = line.replace('Subject:', '').strip()
                # Look for project names in subjects
                if 'project' in subject_text.lower():
                    # Extract project name after "project"
                    match = re.search(r'project\s+([A-Za-z]+[A-Za-z0-9\s]*)', subject_text, re.IGNORECASE)
                    if match:
                        project_name = match.group(1).strip()
                        if len(project_name) >= 3 and len(project_name) <= 30:
                            projects.append(project_name)
            
            # Look for JIRA-style tickets
            jira_matches = re.findall(r'\b([A-Z]{2,}-\d+)\b', line)
            for match in jira_matches:
                if match not in projects:
                    projects.append(match)
            
            # Look for explicit project mentions in content
            project_mentions = re.findall(r'(?:project|initiative|program)\s+([A-Za-z][A-Za-z0-9\s]{2,20})', line, re.IGNORECASE)
            for match in project_mentions:
                project = match.strip()
                if (len(project) >= 3 and len(project) <= 30 and 
                    project not in projects and
                    not re.match(r'^(the|and|for|with|from|this|that|status|update)$', project.lower())):
                    projects.append(project)
                    
        return projects[:3]  # Limit to top 3 most relevant projects
    
    def extract_blockers(self, text: str) -> List[str]:
        """Extract blockers/issues from email"""
        blockers = []
        
        # Look for explicit blocker statements
        lines = text.split('\n')
        for line in lines:
            line = line.strip()
            if len(line) < 10 or len(line) > 150:  # Skip very short or very long lines
                continue
                
            # Look for explicit blocker language
            if re.search(r'(currently\s+)?blocked\s+(on|by)', line, re.IGNORECASE):
                # Extract the blocker detail
                blocker_match = re.search(r'blocked\s+(?:on|by)\s+(.+)', line, re.IGNORECASE)
                if blocker_match:
                    blocker_detail = blocker_match.group(1).strip()
                    if blocker_detail and len(blocker_detail) < 100:
                        blockers.append(f"Blocked: {blocker_detail}")
            
            # Look for "need" statements that indicate blockers
            elif re.search(r'need\s+(approval|permission|access|resources)', line, re.IGNORECASE):
                need_match = re.search(r'need\s+(.+?)(?:\.|$)', line, re.IGNORECASE)
                if need_match:
                    need_detail = need_match.group(1).strip()
                    if need_detail and len(need_detail) < 100:
                        blockers.append(f"Required: {need_detail}")
            
            # Look for explicit issues/problems
            elif re.search(r'(issue|problem|concern)\s+with', line, re.IGNORECASE):
                issue_match = re.search(r'(?:issue|problem|concern)\s+with\s+(.+?)(?:\.|$)', line, re.IGNORECASE)
                if issue_match:
                    issue_detail = issue_match.group(1).strip()
                    if issue_detail and len(issue_detail) < 100:
                        blockers.append(f"Issue: {issue_detail}")
                
        return blockers[:2]  # Limit to top 2 most relevant blockers
    
    def extract_achievements(self, text: str) -> List[str]:
        """Extract achievements/wins from email"""
        achievements = []
        
        lines = text.split('\n')
        for line in lines:
            line = line.strip()
            if len(line) < 10 or len(line) > 150:  # Skip very short or very long lines
                continue
                
            # Look for completed work
            if re.search(r'(completed|finished|delivered|shipped|launched)', line, re.IGNORECASE):
                # Extract what was completed
                completed_match = re.search(r'(?:completed|finished|delivered|shipped|launched)\s+(.+?)(?:\.|$)', line, re.IGNORECASE)
                if completed_match:
                    achievement_detail = completed_match.group(1).strip()
                    if achievement_detail and len(achievement_detail) < 100:
                        achievements.append(f"Completed: {achievement_detail}")
            
            # Look for ahead of schedule mentions
            elif re.search(r'ahead\s+of\s+schedule', line, re.IGNORECASE):
                achievements.append(line)
            
            # Look for successful milestones
            elif re.search(r'(successful|successfully|success)', line, re.IGNORECASE):
                success_match = re.search(r'(.+?(?:successful|successfully|success).+?)(?:\.|$)', line, re.IGNORECASE)
                if success_match:
                    success_detail = success_match.group(1).strip()
                    if success_detail and len(success_detail) < 100:
                        achievements.append(f"Success: {success_detail}")
            
            # Look for exceeded targets
            elif re.search(r'(exceeded|surpassed|beat)', line, re.IGNORECASE):
                exceed_match = re.search(r'(.+?(?:exceeded|surpassed|beat).+?)(?:\.|$)', line, re.IGNORECASE)
                if exceed_match:
                    exceed_detail = exceed_match.group(1).strip()
                    if exceed_detail and len(exceed_detail) < 100:
                        achievements.append(f"Achievement: {exceed_detail}")
                
        return achievements[:2]  # Limit to top 2 most relevant achievements
    
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