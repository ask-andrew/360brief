#!/usr/bin/env python3
"""
Simplified FastAPI Bridge Service for Testing
Tests the basic structure without requiring full Gmail authentication
"""

import datetime
from typing import Dict, Any, Optional
import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

app = FastAPI(title="360Brief Analysis API - Simple", version="1.0.0")

# Add CORS middleware to allow Next.js frontend calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for API
class AnalysisRequest(BaseModel):
    days_back: Optional[int] = 14
    max_results: Optional[int] = 50
    user_email: Optional[str] = None

class AnalysisResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    timestamp: str

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.datetime.now().isoformat(),
        "message": "Simple API server is running"
    }

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_communications(request: AnalysisRequest):
    """
    Simplified analysis endpoint that returns mock executive intelligence data
    This demonstrates the expected structure without requiring full Gmail setup
    """
    try:
        logging.info(f"🔍 Mock analysis for {request.days_back} days back")
        
        # Return mock analysis data in the correct structure
        analysis_result = {
            "executive_summary": {
                "total_emails": 25,
                "total_calendar_events": 8,
                "emails_awaiting_response": 3,
                "upcoming_meetings": 5,
                "analysis_period_days": request.days_back
            },
            "themes": [
                {"keyword": "product launch", "frequency": 12},
                {"keyword": "quarterly review", "frequency": 8},
                {"keyword": "customer feedback", "frequency": 6},
                {"keyword": "budget planning", "frequency": 5},
                {"keyword": "team hiring", "frequency": 4}
            ],
            "key_people": [
                {"name": "Sarah Chen", "frequency": 8},
                {"name": "Mike Rodriguez", "frequency": 6},
                {"name": "Dr. Emily Watson", "frequency": 5},
                {"name": "Alex Kim", "frequency": 4},
                {"name": "Jennifer Taylor", "frequency": 3}
            ],
            "key_organizations": [
                {"name": "Acme Corporation", "frequency": 10},
                {"name": "TechFlow Solutions", "frequency": 7},
                {"name": "Global Dynamics", "frequency": 5},
                {"name": "Innovation Labs", "frequency": 4}
            ],
            "emails_awaiting_response": [
                {
                    "subject": "Q4 Budget Review - Need Your Input",
                    "from_name": "Sarah Chen",
                    "from_email": "sarah@company.com",
                    "date": "2025-09-10",
                    "urgency": "high"
                },
                {
                    "subject": "Product Launch Timeline Discussion",
                    "from_name": "Mike Rodriguez", 
                    "from_email": "mike@company.com",
                    "date": "2025-09-11",
                    "urgency": "medium"
                },
                {
                    "subject": "Client Feedback on Beta Features",
                    "from_name": "Dr. Emily Watson",
                    "from_email": "emily@client.com", 
                    "date": "2025-09-12",
                    "urgency": "medium"
                }
            ],
            "upcoming_meetings": [
                {
                    "summary": "Executive Team Weekly Sync",
                    "start_time": "2025-09-13 10:00",
                    "location": "Conference Room A",
                    "attendees": [{"name": "Sarah Chen", "email": "sarah@company.com"}]
                },
                {
                    "summary": "Product Launch Planning",
                    "start_time": "2025-09-13 14:30", 
                    "location": "Virtual",
                    "attendees": [{"name": "Mike Rodriguez", "email": "mike@company.com"}]
                },
                {
                    "summary": "Q4 Budget Review",
                    "start_time": "2025-09-14 11:00",
                    "location": "Conference Room B", 
                    "attendees": [{"name": "Finance Team", "email": "finance@company.com"}]
                }
            ],
            "llm_digest": """
            **Executive Summary for Week of Sept 9-12, 2025**
            
            **Key Themes:** Product launch activities dominate communications (48% of relevant emails), with significant focus on Q4 budget planning and team expansion discussions.
            
            **Critical Actions Required:**
            • Q4 budget input needed from you by Friday (Sarah Chen - HIGH priority)
            • Product launch timeline decision pending your review
            • Client beta feedback requires strategic response
            
            **Notable Achievements:**
            • Customer satisfaction scores improved 15% this quarter
            • New hire onboarding process streamlined 
            • Product beta feedback overwhelmingly positive (87% satisfaction)
            
            **Upcoming Focus Areas:**
            • Executive team alignment on Q4 priorities
            • Product launch go/no-go decision point
            • Resource allocation for new initiatives
            """,
            "top_email_contacts": [
                {"name": "Sarah Chen", "email_count": 8},
                {"name": "Mike Rodriguez", "email_count": 6},
                {"name": "Dr. Emily Watson", "email_count": 5},
                {"name": "Alex Kim", "email_count": 4},
                {"name": "Jennifer Taylor", "email_count": 3}
            ]
        }
        
        logging.info(f"✅ Mock analysis completed successfully")
        
        return AnalysisResponse(
            success=True,
            data=analysis_result,
            timestamp=datetime.datetime.now().isoformat()
        )
        
    except Exception as e:
        logging.error(f"❌ Analysis failed: {e}")
        return AnalysisResponse(
            success=False,
            error=str(e),
            timestamp=datetime.datetime.now().isoformat()
        )

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting 360Brief Simple Analysis API...")
    uvicorn.run(app, host="0.0.0.0", port=8001)