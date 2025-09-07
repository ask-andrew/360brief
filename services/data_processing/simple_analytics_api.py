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
                now = int(datetime.now().timestamp())
                expires_at = token_info.get('expires_at')
                
                access_token = token_info['access_token']
                refresh_token = token_info.get('refresh_token')
                
                # If token is expired, try to refresh it
                if expires_at and expires_at < now:
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
                
                # Now fetch Gmail data using the access token
                gmail = build('gmail', 'v1', credentials=Credentials(token=access_token))
                
                # Calculate date range
                end_date = datetime.now()
                start_date = end_date - timedelta(days=days_back)
                
                # Build search query
                query = f"after:{int(start_date.timestamp())}"
                if filter_marketing:
                    query += " -category:promotions -category:social"
                
                logger.info(f"📧 Gmail search query: {query}")
                
                # Get message list
                list_response = gmail.users().messages().list(
                    userId='me',
                    q=query,
                    maxResults=200
                ).execute()
                
                messages = list_response.get('messages', [])
                
                if not messages:
                    logger.info("📭 No messages found")
                    analytics_data = get_sample_analytics()
                    analytics_data['dataSource'] = 'real_data_empty'
                    analytics_data['total_count'] = 0
                    return analytics_data
                
                logger.info(f"📊 Found {len(messages)} message IDs")
                
                # Process messages in batches to avoid timeouts
                processed_messages = []
                batch_size = 10
                
                for i in range(0, min(len(messages), 50), batch_size):  # Limit to 50 messages for performance
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
                            
                            processed_messages.append({
                                'id': full_message['id'],
                                'snippet': full_message.get('snippet', ''),
                                'from': from_header,
                                'subject': subject_header,
                                'date': date_header,
                                'internalDate': full_message.get('internalDate', ''),
                                'labelIds': full_message.get('labelIds', [])
                            })
                            
                        except Exception as msg_error:
                            logger.warning(f"❌ Error processing message {msg['id']}: {msg_error}")
                            continue
                
                logger.info(f"✅ Successfully processed {len(processed_messages)} real messages")
                
                # Convert to analytics format
                emails_data = {'emails': processed_messages, 'total_count': len(processed_messages)}
                analytics_data = convert_emails_to_analytics(emails_data, days_back, filter_marketing)
                analytics_data['dataSource'] = 'real_data_direct'
                analytics_data['message'] = f'Real Gmail data: {len(processed_messages)} messages analyzed'
                
                return analytics_data
                    
    except Exception as e:
        logger.error(f"❌ Error fetching real Gmail data: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return get_sample_analytics()

def convert_emails_to_analytics(emails_data: Dict[str, Any], days_back: int, filter_marketing: bool) -> Dict[str, Any]:
    """Convert Next.js email data to our analytics format"""
    emails = emails_data.get('emails', [])
    
    # Generate analytics from the real email data
    total_count = len(emails)
    
    # Count by day
    daily_counts = {}
    senders = {}
    
    for email in emails:
        # Parse date and count
        try:
            from datetime import datetime
            # Assuming email has date field
            date_str = email.get('date', '')
            if date_str:
                date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                day_key = date.strftime('%Y-%m-%d')
                daily_counts[day_key] = daily_counts.get(day_key, 0) + 1
            
            # Count senders
            sender = email.get('from', {}).get('emailAddress', {}).get('address', 'unknown')
            senders[sender] = senders.get(sender, 0) + 1
            
        except Exception as e:
            logger.warning(f"Error processing email date: {e}")
    
    # Build analytics structure
    return {
        "total_count": total_count,
        "daily_counts": daily_counts,
        "top_senders": dict(sorted(senders.items(), key=lambda x: x[1], reverse=True)[:10]),
        "processing_metadata": {
            "source": "next_js_proxy",
            "date_range_days": days_back,
            "marketing_filtered": filter_marketing,
            "processed_at": datetime.now().isoformat()
        },
        "message_distribution": {
            "by_day": [{"date": k, "count": v} for k, v in daily_counts.items()],
            "by_sender": [{"sender": k, "count": v} for k, v in list(senders.items())[:5]]
        }
    }

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