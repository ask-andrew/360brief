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
    filter_marketing: bool = Query(True, description="Filter out marketing/promotional emails")
):
    """Get communication analytics data"""
    try:
        if use_real_data and GMAIL_AVAILABLE:
            # Add timeout to prevent infinite loops
            import asyncio
            try:
                result = await asyncio.wait_for(
                    get_real_analytics(days_back, filter_marketing),
                    timeout=20.0  # 20 second timeout
                )
                return result
            except asyncio.TimeoutError:
                logger.warning("Gmail processing timed out, returning sample data")
                sample_data = get_sample_analytics()
                sample_data['dataSource'] = 'timeout_fallback'
                sample_data['message'] = 'Gmail processing timed out, using sample data for demo'
                return sample_data
        else:
            return get_sample_analytics()
    except Exception as e:
        logger.error(f"Error generating analytics: {str(e)}")
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

async def get_real_analytics(days_back: int = 7, filter_marketing: bool = True) -> Dict[str, Any]:
    """Get real analytics data from Gmail API"""
    gmail_service = GmailService()
    
    # Check if user is authenticated
    if not await gmail_service.authenticate():
        logger.warning("Gmail not authenticated, falling back to sample data")
        return get_sample_analytics()
    
    # Calculate date range (timezone-aware to match Gmail timestamps)
    from datetime import timezone
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days_back)
    
    try:
        analytics_data = await gmail_service.get_analytics_data(start_date, end_date, filter_marketing=filter_marketing)
        filtered_suffix = " (marketing filtered)" if filter_marketing else ""
        logger.info(f"Retrieved real analytics for {analytics_data['total_count']} emails{filtered_suffix}")
        return analytics_data
        
    except Exception as e:
        logger.error(f"Error getting real analytics: {e}")
        # Fallback to sample data on error
        return get_sample_analytics()

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