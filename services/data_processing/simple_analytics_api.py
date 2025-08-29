#!/usr/bin/env python3
"""
Simplified Analytics API for 360Brief
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import uvicorn
import logging

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
async def get_analytics():
    """Get communication analytics data"""
    try:
        return get_sample_analytics()
    except Exception as e:
        logger.error(f"Error generating analytics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

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

if __name__ == "__main__":
    print("🚀 Starting 360Brief Analytics API...")
    print("📊 API will be available at http://localhost:8000")
    print("📝 API docs at http://localhost:8000/docs")
    
    uvicorn.run(
        "simple_analytics_api:app",
        host="0.0.0.0", 
        port=8000,
        reload=True,
        log_level="info"
    )