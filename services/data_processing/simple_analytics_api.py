#!/usr/bin/env python3
"""
Simplified Analytics API for 360Brief
"""

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import uvicorn
import logging
import asyncio
import base64
import re

# Add path for local imports
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

try:
    from data_processing.services.gmail_service import GmailService
    GMAIL_AVAILABLE = True
except ImportError as e:
    print(f"Gmail service not available: {e}")
    GMAIL_AVAILABLE = False

try:
    from data_processing.services.calendar_service import CalendarService
    CALENDAR_AVAILABLE = True
except ImportError as e:
    print(f"Calendar service not available: {e}")
    CALENDAR_AVAILABLE = False

try:
    from email_intelligence_extractor import EmailIntelligenceExtractor
    EXTRACTOR_AVAILABLE = True
except ImportError as e:
    print(f"Email intelligence extractor not available: {e}")
    EXTRACTOR_AVAILABLE = False

try:
    from executive_intelligence_engine import generate_executive_brief, generate_sophisticated_free_intelligence
    from main_integration import ExecutiveBriefGenerator
    INTELLIGENCE_ENGINE_AVAILABLE = True
    print("✅ Executive Intelligence Engine v3 available")
except ImportError as e:
    print(f"Executive Intelligence Engine not available: {e}")
    try:
        from data_processing.tiered_intelligence_engine import generate_sophisticated_free_intelligence, PowerfulNonAIIntelligenceEngine
        INTELLIGENCE_ENGINE_AVAILABLE = True
        print("✅ Fallback to old intelligence engine")
    except ImportError as e2:
        print(f"No intelligence engine available: {e2}")
        INTELLIGENCE_ENGINE_AVAILABLE = False

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="360Brief Analytics API",
    description="API for communication analytics and insights",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Email processing helper functions
def extract_email_body(payload: Dict) -> str:
    """Extract and clean email body content from Gmail payload"""
    try:
        body = ""
        
        if 'parts' in payload:
            for part in payload['parts']:
                if part['mimeType'] == 'text/plain':
                    data = part['body'].get('data', '')
                    if data:
                        body = base64.urlsafe_b64decode(data).decode('utf-8')
                        break
                elif part['mimeType'] == 'text/html':
                    data = part['body'].get('data', '')
                    if data and not body:  # Use HTML if no plain text
                        html_content = base64.urlsafe_b64decode(data).decode('utf-8')
                        body = clean_html_content(html_content)
        else:
            # Single part message
            if payload.get('mimeType') == 'text/plain':
                data = payload['body'].get('data', '')
                if data:
                    body = base64.urlsafe_b64decode(data).decode('utf-8')
            elif payload.get('mimeType') == 'text/html':
                data = payload['body'].get('data', '')
                if data:
                    html_content = base64.urlsafe_b64decode(data).decode('utf-8')
                    body = clean_html_content(html_content)
        
        return body.strip()
        
    except Exception as e:
        logging.warning(f"Failed to extract email body: {e}")
        return ""

def clean_html_content(html_content: str) -> str:
    """Clean HTML content and convert to readable text"""
    try:
        # Remove CSS and script content first
        html_content = re.sub(r'<style[^>]*>.*?</style>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
        html_content = re.sub(r'<script[^>]*>.*?</script>', '', html_content, flags=re.DOTALL | re.IGNORECASE)
        
        # Remove HTML tags with basic regex (fallback approach)
        text = re.sub(r'<[^<]+?>', '', html_content)
        
        # Clean up excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'\n\s*\n', '\n\n', text)
        
        # Remove email artifacts and tracking pixels
        text = re.sub(r'&nbsp;|\u00a0', ' ', text)  # Non-breaking spaces
        text = re.sub(r'&[a-zA-Z]+;', '', text)  # HTML entities
        text = re.sub(r'\s*\|\s*', ' | ', text)  # Clean up pipes
        
        # Limit length to avoid overwhelming content
        if len(text) > 2000:
            text = text[:2000] + '...'
            
        return text.strip()
        
    except Exception as e:
        logging.warning(f"Failed to clean HTML content: {e}")
        # Fallback to basic regex cleaning
        text = re.sub(r'<[^<]+?>', '', html_content)
        text = re.sub(r'\s+', ' ', text)
        return text.strip()[:1000]  # Limit fallback text

def categorize_email_priority(subject: str, sender: str, body: str) -> str:
    """Categorize email priority based on content"""
    subject_lower = subject.lower()
    sender_lower = sender.lower()
    body_lower = body.lower()
    
    # High priority indicators
    urgent_keywords = ['urgent', 'asap', 'immediate', 'emergency', 'critical', 'important', 'deadline']
    business_keywords = ['meeting', 'conference', 'project', 'contract', 'invoice', 'proposal', 'quote']
    government_keywords = ['congress', 'senator', 'representative', 'gov', '.mil']
    
    # Check for high priority
    if (any(kw in subject_lower for kw in urgent_keywords) or 
        any(kw in sender_lower for kw in government_keywords) or
        'follow up' in subject_lower or
        'reply' in subject_lower.replace('re:', '')):
        return 'high'
    
    # Check for medium priority
    if (any(kw in subject_lower for kw in business_keywords) or
        any(kw in body_lower for kw in business_keywords) or
        '@' in body_lower and len(body) > 200):  # Substantial business emails
        return 'medium'
    
    return 'low'

def has_action_items(subject: str, body: str) -> bool:
    """Detect if email contains action items"""
    content = (subject + ' ' + body).lower()
    
    action_patterns = [
        'need', 'require', 'please', 'can you', 'could you', 'would you',
        'deadline', 'due by', 'respond by', 'reply by', 'follow up',
        'schedule', 'meeting', 'call me', 'review', 'approve', 'confirm'
    ]
    
    return any(pattern in content for pattern in action_patterns)

def is_urgent(subject: str, body: str) -> bool:
    """Detect if email is urgent"""
    content = (subject + ' ' + body).lower()
    
    urgent_patterns = [
        'urgent', 'asap', 'immediate', 'emergency', 'critical',
        'today', 'tonight', 'this morning', 'by end of day', 'eod'
    ]
    
    return any(pattern in content for pattern in urgent_patterns)

# Sample analytics data matching our dashboard structure
def get_sample_analytics():
    """Generate sample analytics data"""
    return {
        "total_count": 1247,
        "inbound_count": 843,
        "outbound_count": 404,
        "avg_response_time_minutes": 127,
        "missed_messages": 4,
        "focus_ratio": 68,
        "external_percentage": 35,
        "internal_percentage": 65,
        "top_projects": [
            {"name": "Project Alpha", "messageCount": 75, "type": "project"},
            {"name": "Q2 Budget", "messageCount": 45, "type": "project"}, 
            {"name": "Client Onboarding", "messageCount": 32, "type": "project"}
        ],
        "reconnect_contacts": [
            {"name": "Alex Johnson", "role": "Product Manager", "days": 42, "email": "alex@example.com"},
            {"name": "Jordan Smith", "role": "Engineering Lead", "days": 37, "email": "jordan@example.com"},
            {"name": "Taylor Wilson", "role": "Design Director", "days": 45, "email": "taylor@example.com"}
        ],
        "recent_trends": {
            "messages": {"change": 12, "direction": "up"},
            "response_time": {"change": -8, "direction": "down"},
            "meetings": {"change": 23, "direction": "up"}
        },
        "sentiment_analysis": {
            "positive": 68,
            "neutral": 24, 
            "negative": 8,
            "overall_trend": "positive"
        },
        "priority_messages": {
            "awaiting_my_reply": [
                {
                    "id": "1",
                    "sender": "Sarah Chen",
                    "subject": "Q4 Budget Approval Needed",
                    "channel": "email",
                    "timestamp": "2 hours ago",
                    "priority": "high",
                    "link": "/messages/1"
                },
                {
                    "id": "3",
                    "sender": "Team Alpha", 
                    "subject": "Sprint planning questions",
                    "channel": "teams",
                    "timestamp": "6 hours ago",
                    "priority": "high",
                    "link": "/messages/3"
                }
            ],
            "awaiting_their_reply": [
                {
                    "id": "2",
                    "sender": "Mike Rodriguez",
                    "subject": "Client feedback on proposal",
                    "channel": "slack", 
                    "timestamp": "4 hours ago",
                    "priority": "medium",
                    "link": "/messages/2"
                }
            ]
        },
        "channel_analytics": {
            "by_channel": [
                {"name": "Email", "count": 524, "percentage": 42},
                {"name": "Slack", "count": 398, "percentage": 32},
                {"name": "Teams", "count": 203, "percentage": 16},
                {"name": "WhatsApp", "count": 122, "percentage": 10}
            ],
            "by_time": [
                {"hour": "9AM", "count": 89},
                {"hour": "10AM", "count": 124}, 
                {"hour": "11AM", "count": 156},
                {"hour": "12PM", "count": 98},
                {"hour": "1PM", "count": 67},
                {"hour": "2PM", "count": 134},
                {"hour": "3PM", "count": 178},
                {"hour": "4PM", "count": 145}
            ]
        },
        "network_data": {
            "nodes": [
                {"id": "project-alpha", "name": "Project Alpha", "type": "project", "messageCount": 245, "connections": 8},
                {"id": "q2-budget", "name": "Q2 Budget", "type": "project", "messageCount": 189, "connections": 6},
                {"id": "client-onboarding", "name": "Client Onboarding", "type": "project", "messageCount": 156, "connections": 12},
                {"id": "product-launch", "name": "Product Launch", "type": "project", "messageCount": 134, "connections": 10},
                {"id": "team-sync", "name": "Team Sync", "type": "topic", "messageCount": 98, "connections": 15},
                {"id": "design-review", "name": "Design Review", "type": "topic", "messageCount": 87, "connections": 7}
            ],
            "connections": [
                {"source": "project-alpha", "target": "team-sync"},
                {"source": "project-alpha", "target": "design-review"},
                {"source": "q2-budget", "target": "team-sync"},
                {"source": "client-onboarding", "target": "product-launch"},
                {"source": "product-launch", "target": "design-review"}
            ]
        }
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "360Brief Analytics API", 
        "version": "1.0.0",
        "status": "running",
        "endpoints": ["/analytics", "/health", "/network", "/priority-messages"]
    }

@app.get("/analytics")
async def get_analytics(
    use_real_data: bool = Query(False, description="Use real Gmail data instead of sample data"),
    days_back: int = Query(7, description="Number of days to analyze"),
    filter_marketing: bool = Query(True, description="Filter out marketing/promotional emails"),
    user_id: str = Query(None, description="User ID to fetch tokens for (enables centralized auth)")
):
    """Get communication analytics data"""
    try:
        if use_real_data and GMAIL_AVAILABLE:
            # Add timeout to prevent infinite loops
            import asyncio
            try:
                result = await asyncio.wait_for(
                    get_real_analytics(days_back, filter_marketing, user_id),
                    timeout=60.0  # Increased to 60 second timeout for optimization testing
                )
                return result
            except asyncio.TimeoutError:
                logger.error("❌ REAL DATA REQUIRED: Gmail processing timed out")
                raise HTTPException(status_code=504, detail="Gmail processing timed out - real data required but unavailable")
        else:
            # Only allow sample data if real data was not explicitly requested
            if use_real_data:
                logger.error("❌ REAL DATA REQUIRED: Real data requested but Gmail not available")
                raise HTTPException(status_code=503, detail="Real data requested but Gmail integration not available")
            return get_sample_analytics()
    except Exception as e:
        logger.error(f"❌ REAL DATA REQUIRED: Error generating analytics: {str(e)}")
        if use_real_data:
            raise HTTPException(status_code=500, detail=f"Real data requested but failed: {str(e)}")
        # For non-real data requests, still return sample data
        sample_data = get_sample_analytics()
        sample_data['dataSource'] = 'error_fallback'
        return sample_data

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "analytics-api"
    }

@app.get("/network")
async def get_network_data():
    """Get network visualization data"""
    try:
        analytics = get_sample_analytics()
        return analytics["network_data"]
    except Exception as e:
        logger.error(f"Error generating network data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/priority-messages")
async def get_priority_messages():
    """Get priority messages awaiting reply"""
    try:
        analytics = get_sample_analytics()
        return analytics["priority_messages"]
    except Exception as e:
        logger.error(f"Error getting priority messages: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# OAuth2 Models
class TokenExchangeRequest(BaseModel):
    code: str
    redirect_uri: str

@app.get("/auth/gmail/authorize")
async def gmail_authorize():
    """Get Gmail OAuth2 authorization URL"""
    if not GMAIL_AVAILABLE:
        raise HTTPException(status_code=503, detail="Gmail integration not available")
    
    try:
        gmail_service = GmailService()
        auth_url = gmail_service.get_auth_url(redirect_uri="http://localhost:3000/api/auth/gmail/callback")
        
        return {
            "auth_url": auth_url,
            "message": "Redirect user to this URL for Gmail authorization"
        }
        
    except Exception as e:
        logger.error(f"Error generating auth URL: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/gmail/callback")
async def gmail_callback(request: TokenExchangeRequest):
    """Exchange authorization code for access tokens"""
    if not GMAIL_AVAILABLE:
        raise HTTPException(status_code=503, detail="Gmail integration not available")
    
    try:
        gmail_service = GmailService()
        success = gmail_service.exchange_code_for_tokens(request.code, request.redirect_uri)
        
        if success:
            return {
                "success": True,
                "message": "Gmail authorization successful"
            }
        else:
            raise HTTPException(status_code=400, detail="Failed to exchange authorization code")
            
    except Exception as e:
        logger.error(f"Error in OAuth callback: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/auth/gmail/status")
async def gmail_status():
    """Check Gmail authentication status"""
    if not GMAIL_AVAILABLE:
        return {"authenticated": False, "error": "Gmail integration not available"}
    
    try:
        gmail_service = GmailService()
        
        # Check if credentials file exists
        if not gmail_service.credentials_file or not os.path.exists(gmail_service.credentials_file):
            return {
                "authenticated": False,
                "error": "Gmail credentials not configured",
                "setup_required": True,
                "message": "Please follow the setup guide to configure Gmail credentials"
            }
        
        authenticated = await gmail_service.authenticate()
        
        return {
            "authenticated": authenticated,
            "credentials_configured": True,
            "message": "Gmail connected" if authenticated else "Gmail not connected"
        }
        
    except Exception as e:
        logger.error(f"Error checking Gmail status: {str(e)}")
        return {"authenticated": False, "error": str(e)}

async def get_real_analytics(days_back: int = 7, filter_marketing: bool = True, user_id: str = None) -> Dict[str, Any]:
    """Get real analytics data by directly accessing Gmail API via database tokens"""
    try:
        # Import required modules
        import aiohttp
        import json
        from datetime import timezone, datetime, timedelta
        from google.oauth2.credentials import Credentials
        from google.auth.transport.requests import Request
        from googleapiclient.discovery import build
        
        logger.info(f"📧 Fetching real Gmail data directly (user: {user_id})")
        
        # If no user_id provided, can't fetch real data
        if not user_id:
            logger.error("❌ REAL DATA REQUIRED: No user_id provided for real data fetch")
            raise HTTPException(status_code=400, detail="user_id is required for real data")
        
        # Get Supabase credentials from environment
        supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not supabase_url or not service_key:
            logger.warning("❌ Supabase credentials not found, using sample data")
            return get_sample_analytics()
            
        # Fetch user tokens from Supabase database
        async with aiohttp.ClientSession() as session:
            # Use Supabase REST API to get user tokens
            headers = {
                'apikey': service_key,
                'Authorization': f'Bearer {service_key}',
                'Content-Type': 'application/json'
            }
            
            # Query user_tokens table
            url = f"{supabase_url}/rest/v1/user_tokens"
            params = {
                'user_id': f'eq.{user_id}',
                'provider': 'eq.google',
                'select': 'access_token,refresh_token,expires_at',
                'limit': '1'
            }
            
            async with session.get(url, params=params, headers=headers) as response:
                if response.status != 200:
                    logger.warning(f"❌ Failed to fetch tokens from database: {response.status}")
                    return get_sample_analytics()
                    
                tokens_data = await response.json()
                
                if not tokens_data:
                    logger.error(f"❌ REAL DATA REQUIRED: No tokens found for user {user_id}")
                    raise HTTPException(status_code=404, detail=f"No Gmail tokens found for user {user_id}")
                
                token_info = tokens_data[0]
                
                # Check if token needs refresh
                now_utc = datetime.now(timezone.utc)
                expires_at_str = token_info.get('expires_at')
                
                if expires_at_str:
                    try:
                        # Parse the timestamp, assuming it's in ISO format with a Z suffix
                        expires_at = datetime.fromisoformat(expires_at_str.replace('Z', '+00:00'))
                    except ValueError:
                        # Fallback for Unix timestamp
                        try:
                            expires_at = datetime.fromtimestamp(int(expires_at_str), tz=timezone.utc)
                        except (ValueError, TypeError):
                            expires_at = None
                else:
                    expires_at = None

                access_token = token_info['access_token']
                refresh_token = token_info.get('refresh_token')
                
                # If token is expired, try to refresh it
                if expires_at and expires_at < now_utc:
                    logger.info("🔄 Token expired, attempting refresh...")
                    
                    try:
                        # Create OAuth2 credentials for refresh
                        credentials = Credentials(
                            token=access_token,
                            refresh_token=refresh_token,
                            token_uri='https://oauth2.googleapis.com/token',
                            client_id=os.getenv('GOOGLE_CLIENT_ID'),
                            client_secret=os.getenv('GOOGLE_CLIENT_SECRET')
                        )
                        
                        # Refresh the token
                        credentials.refresh(Request())
                        
                        # Update token in database
                        update_data = {
                            'access_token': credentials.token,
                            'expires_at': int(credentials.expiry.timestamp()) if credentials.expiry else None
                        }
                        
                        # Update via Supabase REST API
                        update_url = f"{supabase_url}/rest/v1/user_tokens"
                        update_params = {
                            'user_id': f'eq.{user_id}',
                            'provider': 'eq.google'
                        }
                        
                        async with session.patch(update_url, params=update_params, headers=headers, json=update_data) as update_response:
                            if update_response.status == 200:
                                access_token = credentials.token
                                logger.info("✅ Successfully refreshed access token")
                            else:
                                logger.warning(f"❌ Failed to update refreshed token in database: {update_response.status}")
                                
                    except Exception as refresh_error:
                        logger.error(f"❌ Token refresh failed: {refresh_error}")
                        return get_sample_analytics()
                
                # Create complete credentials for Gmail API (including refresh capability)
                credentials = Credentials(
                    token=access_token,
                    refresh_token=refresh_token,
                    token_uri='https://oauth2.googleapis.com/token',
                    client_id=os.getenv('GOOGLE_CLIENT_ID'),
                    client_secret=os.getenv('GOOGLE_CLIENT_SECRET')
                )

                # Build Gmail API client with complete credentials
                gmail = build('gmail', 'v1', credentials=credentials)
                
                # Calculate date range
                end_date = datetime.now()
                start_date = end_date - timedelta(days=days_back)

                # Build search query using Gmail's date format
                query_parts = []

                # Use Gmail's date format (YYYY/MM/DD)
                start_date_str = start_date.strftime('%Y/%m/%d')
                query_parts.append(f"after:{start_date_str}")

                # Filter marketing if requested
                if filter_marketing:
                    query_parts.extend(["-category:promotions", "-category:social", "-from:noreply", "-from:donotreply"])

                # Add more content to get substantial emails
                query_parts.extend(["has:attachment OR longer:50"])

                query = " ".join(query_parts)
                
                logger.info(f"📧 Gmail search query: {query}")
                
                # Get message list with pagination to get more emails
                all_messages = []
                page_token = None
                max_total = 300  # Increased limit

                while len(all_messages) < max_total:
                    list_request = gmail.users().messages().list(
                        userId='me',
                        q=query,
                        maxResults=min(100, max_total - len(all_messages)),
                        pageToken=page_token
                    )

                    list_response = list_request.execute()

                    batch_messages = list_response.get('messages', [])
                    all_messages.extend(batch_messages)

                    page_token = list_response.get('nextPageToken')
                    if not page_token or not batch_messages:
                        break

                messages = all_messages

                if not messages:
                    logger.info("📭 No messages found")
                    analytics_data = get_sample_analytics()
                    analytics_data['dataSource'] = 'real_data_empty'
                    analytics_data['total_count'] = 0
                    return analytics_data

                logger.info(f"📊 Found {len(messages)} message IDs")

                # Process messages in larger batches for better performance
                processed_messages = []
                batch_size = 20
                max_process = min(len(messages), 100)  # Process up to 100 emails for intelligence

                for i in range(0, max_process, batch_size):
                    batch = messages[i:i+batch_size]
                    
                    for msg in batch:
                        try:
                            # Get full message
                            full_message = gmail.users().messages().get(
                                userId='me',
                                id=msg['id'],
                                format='full'
                            ).execute()
                            
                            headers = full_message.get('payload', {}).get('headers', [])
                            
                            # Extract email fields
                            from_header = next((h['value'] for h in headers if h['name'] == 'From'), '')
                            subject_header = next((h['value'] for h in headers if h['name'] == 'Subject'), '(no subject)')
                            date_header = next((h['value'] for h in headers if h['name'] == 'Date'), '')
                            
                            # Extract full email body content
                            body_content = extract_email_body(full_message.get('payload', {}))
                            
                            processed_messages.append({
                                'id': full_message['id'],
                                'messageId': full_message['id'],
                                'snippet': full_message.get('snippet', ''),
                                'body': body_content,  # Full cleaned body content
                                'from': from_header,
                                'subject': subject_header,
                                'date': date_header,
                                'to': [from_header],  # Simplified for now
                                'labels': full_message.get('labelIds', []),
                                'isRead': 'UNREAD' not in full_message.get('labelIds', []),
                                'internalDate': full_message.get('internalDate', ''),
                                'labelIds': full_message.get('labelIds', []),
                                'metadata': {
                                    'insights': {
                                        'priority': categorize_email_priority(subject_header, from_header, body_content),
                                        'hasActionItems': has_action_items(subject_header, body_content),
                                        'isUrgent': is_urgent(subject_header, body_content)
                                    }
                                }
                            })
                            
                        except Exception as msg_error:
                            logger.warning(f"❌ Error processing message {msg['id']}: {msg_error}")
                            continue
                
                logger.info(f"✅ Successfully processed {len(processed_messages)} real messages")
                
                analytics_data = {
                    'emails': processed_messages,
                    'total_count': len(processed_messages),
                    'dataSource': 'real_data_direct',
                    'message': f'Real Gmail data: {len(processed_messages)} messages analyzed.',
                    'processed_messages': processed_messages
                }

                return analytics_data
                    
    except Exception as e:
        logger.error(f"❌ Error fetching real Gmail data: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return get_sample_analytics()



@app.post("/extract-intelligence")
async def extract_email_intelligence(request: Dict[str, Any]):
    """
    Extract executive intelligence from raw email content
    """
    try:
        if not EXTRACTOR_AVAILABLE:
            raise HTTPException(status_code=503, detail="Email intelligence extractor not available")
        
        # Initialize extractor
        extractor = EmailIntelligenceExtractor()
        
        # Get email data from request
        raw_content = request.get('content', '')
        sender = request.get('sender', '')
        subject = request.get('subject', '')
        date = request.get('date', None)
        
        if not raw_content:
            return []
        
        # Process email
        result = extractor.process_email(
            raw_content=raw_content,
            sender=sender,
            subject=subject,
            date=date
        )
        
        logger.info(f"✅ Processed email from {sender}: {'Relevant' if result else 'Filtered'}")
        return result
        
    except Exception as e:
        logger.error(f"❌ Error extracting intelligence: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process-email-batch")
async def process_email_batch(request: Dict[str, Any]):
    """
    Process a batch of emails and extract executive intelligence
    """
    try:
        if not EXTRACTOR_AVAILABLE:
            raise HTTPException(status_code=503, detail="Email intelligence extractor not available")

        # Initialize extractor
        extractor = EmailIntelligenceExtractor()

        # Get emails from request
        emails = request.get('emails', [])
        if not emails:
            return {
                "processed": 0,
                "relevant": 0,
                "filtered": 0,
                "results": []
            }

        # Process each email
        all_results = []
        relevant_count = 0
        filtered_count = 0

        for email in emails:
            try:
                result = extractor.process_email(
                    raw_content=email.get('content', email.get('body', '')),
                    sender=email.get('sender', email.get('from', '')),
                    subject=email.get('subject', ''),
                    date=email.get('date', None)
                )

                if result:
                    all_results.extend(result)
                    relevant_count += 1
                else:
                    filtered_count += 1

            except Exception as e:
                logger.warning(f"Failed to process email: {e}")
                filtered_count += 1

        logger.info(f"✅ Batch processing complete: {relevant_count} relevant, {filtered_count} filtered")

        return {
            "processed": len(emails),
            "relevant": relevant_count,
            "filtered": filtered_count,
            "results": all_results
        }

    except Exception as e:
        logger.error(f"❌ Error processing email batch: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def create_intelligent_basic_brief(emails_for_processing: List[Dict], user_id: str, days_back: int) -> Dict[str, Any]:
    """
    Create an intelligent basic brief from real email data
    This replaces the generic fallback with actual email analysis
    """
    try:
        logger.info(f"🧠 Creating intelligent basic brief from {len(emails_for_processing)} emails")

        # Analyze email content for real insights
        urgent_emails = []
        action_items = []
        key_topics = {}
        sender_stats = {}

        for email in emails_for_processing:
            subject = email.get('subject', '')
            body = email.get('body', '')
            sender = email.get('from', {})
            if isinstance(sender, str):
                sender_name = sender.split('<')[0].strip()
                sender_email = sender
            else:
                sender_name = sender.get('name', sender.get('email', 'Unknown'))
                sender_email = sender.get('email', sender.get('name', ''))

            # Track sender statistics
            sender_key = f"{sender_name} ({sender_email})"
            sender_stats[sender_key] = sender_stats.get(sender_key, 0) + 1

            # Check for urgent content
            if is_urgent(subject, body):
                urgent_emails.append({
                    'subject': subject,
                    'sender': sender_name,
                    'snippet': body[:200] if body else email.get('snippet', '')[:200]
                })

            # Check for action items
            if has_action_items(subject, body):
                action_items.append({
                    'subject': subject,
                    'sender': sender_name,
                    'snippet': body[:200] if body else email.get('snippet', '')[:200]
                })

            # Extract key topics from subject lines
            subject_words = subject.lower().split()
            for word in subject_words:
                if len(word) > 4 and word not in ['email', 'message', 'reply', 'forward']:
                    key_topics[word] = key_topics.get(word, 0) + 1

        # Sort and get top topics
        top_topics = sorted(key_topics.items(), key=lambda x: x[1], reverse=True)[:10]
        top_senders = sorted(sender_stats.items(), key=lambda x: x[1], reverse=True)[:10]

        # Create digest items with real content
        digest_items = []

        # Add urgent items cluster
        if urgent_emails:
            digest_items.append({
                'id': 'urgent-items',
                'title': f'Urgent Items ({len(urgent_emails)} emails)',
                'summary': f'Found {len(urgent_emails)} urgent emails requiring immediate attention',
                'priority': 'high',
                'emails': urgent_emails[:5],  # Show top 5 urgent emails
                'email_count': len(urgent_emails),
                'action_required': True
            })

        # Add action items cluster
        if action_items:
            digest_items.append({
                'id': 'action-items',
                'title': f'Action Items ({len(action_items)} emails)',
                'summary': f'{len(action_items)} emails contain actionable requests or tasks',
                'priority': 'medium',
                'emails': action_items[:5],  # Show top 5 action emails
                'email_count': len(action_items),
                'action_required': True
            })

        # Add top communication partners
        if top_senders:
            top_sender_names = [sender.split(' (')[0] for sender, _ in top_senders[:3]]
            digest_items.append({
                'id': 'frequent-contacts',
                'title': f'Top Communication Partners ({len(top_senders)} contacts)',
                'summary': f'Most frequent contacts: {", ".join(top_sender_names)}',
                'priority': 'low',
                'emails': [],
                'email_count': sum(count for _, count in top_senders),
                'action_required': False
            })

        # Add topic analysis
        if top_topics:
            topic_names = [topic for topic, _ in top_topics[:5]]
            digest_items.append({
                'id': 'key-topics',
                'title': f'Key Discussion Topics ({len(top_topics)} topics)',
                'summary': f'Main topics: {", ".join(topic_names)}',
                'priority': 'low',
                'emails': [],
                'email_count': sum(count for _, count in top_topics),
                'action_required': False
            })

        # Create the intelligence brief structure
        intelligence_brief = {
            'brief_id': f'intelligent-basic-{user_id}-{datetime.now().strftime("%Y%m%d")}',
            'user_id': user_id,
            'generation_timestamp': datetime.now().isoformat(),
            'analysis_period': {
                'days_analyzed': days_back,
                'start_date': (datetime.now() - timedelta(days=days_back)).isoformat(),
                'end_date': datetime.now().isoformat()
            },
            'digest_items': digest_items,
            'processing_metadata': {
                'total_emails_processed': len(emails_for_processing),
                'intelligence_signals_detected': len(digest_items),
                'urgent_emails_found': len(urgent_emails),
                'action_items_found': len(action_items),
                'processing_engine': 'intelligent_basic_analyzer',
                'data_source': 'real_gmail_data'
            },
            'executive_summary': {
                'title': f'Executive Intelligence Brief - {len(emails_for_processing)} emails analyzed',
                'total_emails': len(emails_for_processing),
                'urgent_count': len(urgent_emails),
                'action_count': len(action_items),
                'key_insights': [
                    f"Processed {len(emails_for_processing)} emails from the past {days_back} days",
                    f"Found {len(urgent_emails)} urgent items requiring immediate attention" if urgent_emails else "No urgent items found",
                    f"Identified {len(action_items)} emails with actionable requests" if action_items else "No action items found",
                    f"Top communication partner: {top_senders[0][0].split(' (')[0]}" if top_senders else "No frequent contacts identified"
                ]
            }
        }

        logger.info(f"✅ Created intelligent basic brief with {len(digest_items)} clusters and {len(urgent_emails)} urgent items")
        return intelligence_brief

    except Exception as e:
        logger.error(f"❌ Error creating intelligent basic brief: {e}")
        import traceback
        logger.error(traceback.format_exc())

        # Return basic fallback structure
        return {
            'brief_id': f'fallback-{user_id}',
            'user_id': user_id,
            'generation_timestamp': datetime.now().isoformat(),
            'digest_items': [],
            'processing_metadata': {
                'total_emails_processed': len(emails_for_processing),
                'intelligence_signals_detected': 0,
                'processing_engine': 'fallback_analyzer',
                'error': str(e)
            },
            'executive_summary': {
                'title': 'Brief Generation Failed',
                'total_emails': len(emails_for_processing),
                'key_insights': ['Unable to analyze emails due to processing error']
            }
        }

@app.post("/generate-brief")
async def generate_executive_brief(request: Dict[str, Any]):
    """
    Generate sophisticated executive brief using the intelligence engine
    """
    try:
        if not INTELLIGENCE_ENGINE_AVAILABLE:
            logger.warning("🔧 Intelligence engine not available, falling back to basic analytics")
            return get_sample_analytics()

        # Get request parameters
        user_id = request.get('user_id')
        days_back = request.get('days_back', 7)
        filter_marketing = request.get('filter_marketing', True)
        emails_from_frontend = request.get('emails', [])

        logger.info(f"🧠 Generating sophisticated executive brief for user: {user_id}")

        # Check if emails were passed directly from frontend
        if emails_from_frontend and len(emails_from_frontend) > 0:
            logger.info(f"📧 Using {len(emails_from_frontend)} emails passed from frontend")

            # Convert frontend email format to intelligence engine format
            emails_for_processing = []
            for email in emails_from_frontend:
                emails_for_processing.append({
                    'id': email.get('id', ''),
                    'subject': email.get('subject', ''),
                    'body': email.get('body', ''),
                    'from': {
                        'name': email.get('from', {}).get('name', '') if isinstance(email.get('from'), dict) else email.get('from', '').split('<')[0].strip(),
                        'email': email.get('from', {}).get('email', '') if isinstance(email.get('from'), dict) else email.get('from', '')
                    },
                    'to': email.get('to', []),
                    'date': email.get('date', ''),
                    'threadId': email.get('threadId', email.get('id', '')),
                    'snippet': email.get('snippet', '')
                })

            logger.info(f"🔍 Processing {len(emails_for_processing)} emails with ExecutiveIntelligenceEngine_v3")

            # Generate executive intelligence using new engine
            try:
                intelligence_result = await generate_executive_brief(emails_for_processing, user_id=user_id)
                logger.info(f"✅ Generated executive brief with ExecutiveIntelligenceEngine_v3")
            except Exception as exec_error:
                logger.warning(f"ExecutiveIntelligenceEngine_v3 failed, trying fallback: {exec_error}")
                intelligence_result = await generate_sophisticated_free_intelligence(emails_for_processing, user_id=user_id)

            signals_detected = len(intelligence_result.get('digest_items', []))
            logger.info(f"🎯 Generated brief with {signals_detected} actionable clusters")

            return intelligence_result

        else:
            # Fall back to fetching Gmail data directly
            logger.info("📧 No emails provided from frontend, fetching from Gmail directly")

            # First, fetch real Gmail data
            email_data = await get_real_analytics(days_back, filter_marketing, user_id)

            if email_data.get('dataSource') != 'real_data_direct':
                logger.warning("⚠️ Using sample data for brief generation")
                return email_data

            # Extract emails from the analytics data
            processed_messages = email_data.get('processed_messages', [])

            if not processed_messages:
                logger.warning("📭 No messages found for intelligence processing")
                return email_data

            # Convert to format expected by intelligence engine
            emails_for_processing = []
            for msg in processed_messages:
                emails_for_processing.append({
                    'id': msg.get('id', ''),
                    'subject': msg.get('subject', ''),
                    'body': msg.get('body', ''),
                    'from': {'name': msg.get('from', '').split('<')[0].strip(), 'email': msg.get('from', '')},
                    'date': msg.get('date', ''),
                    'labels': msg.get('labels', []),
                    'threadId': msg.get('id', ''),  # Simplified
                    'snippet': msg.get('snippet', '')
                })

            logger.info(f"🔍 Processing {len(emails_for_processing)} emails with ExecutiveIntelligenceEngine_v3")

            # Generate executive intelligence using new engine
            try:
                intelligence_result = await generate_executive_brief(emails_for_processing, user_id=user_id)
                logger.info(f"✅ Generated executive brief with ExecutiveIntelligenceEngine_v3")
            except Exception as exec_error:
                logger.warning(f"ExecutiveIntelligenceEngine_v3 failed, trying fallback: {exec_error}")
                intelligence_result = await generate_sophisticated_free_intelligence(emails_for_processing, user_id=user_id)

            signals_detected = len(intelligence_result.get('digest_items', []))
            logger.info(f"🎯 Generated brief with {signals_detected} actionable clusters")

            return intelligence_result

    except Exception as e:
        logger.error(f"❌ Error generating executive brief: {e}")
        import traceback
        logger.error(traceback.format_exc())

        # Fallback to basic analytics with real data if available
        logger.info("🔄 Falling back to basic analytics due to error")

        # Try to use real email data if we have it
        try:
            if 'emails_for_processing' in locals() and emails_for_processing:
                logger.info(f"🔄 Creating intelligent basic brief from {len(emails_for_processing)} real emails")
                return create_intelligent_basic_brief(emails_for_processing, user_id, days_back)
        except:
            pass

        return get_sample_analytics()

@app.get("/brief")
async def get_executive_brief(
    user_id: str = Query(..., description="User ID to generate brief for"),
    days_back: int = Query(7, description="Number of days to analyze"),
    filter_marketing: bool = Query(True, description="Filter out marketing emails"),
    use_intelligence: bool = Query(True, description="Use sophisticated intelligence engine")
):
    """
    GET endpoint for generating executive brief
    """
    try:
        if use_intelligence and INTELLIGENCE_ENGINE_AVAILABLE:
            # Use the POST endpoint logic
            request_data = {
                'user_id': user_id,
                'days_back': days_back,
                'filter_marketing': filter_marketing
            }
            return await generate_executive_brief(request_data)
        else:
            # Fall back to regular analytics
            return await get_real_analytics(days_back, filter_marketing, user_id)

    except Exception as e:
        logger.error(f"❌ Error in brief endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("🚀 Starting 360Brief Analytics API...")
    print("📊 API will be available at http://localhost:8000")
    print("📝 API docs at http://localhost:8000/docs")
    if GMAIL_AVAILABLE:
        print("✅ Gmail API integration enabled")
    else:
        print("⚠️  Gmail API not available - using sample data only")
    
    uvicorn.run(
        "simple_analytics_api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )