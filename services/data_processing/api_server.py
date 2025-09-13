#!/usr/bin/env python3
"""
FastAPI Bridge Service for 360Brief Analysis Pipeline
Adapts the existing analyze.py logic to return JSON data instead of sending emails.
"""

import os
import json
import logging
import datetime
from typing import List, Dict, Any, Optional
from collections import Counter, defaultdict

# FastAPI imports
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import functions from existing analyze.py
from analyze import (
    load_spacy_model,
    authenticate_gmail,
    fetch_recent_messages,
    get_message_body,
    fetch_and_process_calendar_events,
    analyze_email_interactions,
    extract_entities,
    extract_keywords_for_themes,
    generate_gemini_summary,
    get_consolidated_contacts_summary,
    load_prompt_from_file
)

# Import Google services
from googleapiclient.discovery import build

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

app = FastAPI(title="360Brief Analysis API", version="1.0.0")

# Add CORS middleware to allow Next.js frontend calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for shared resources
nlp_model = None
gmail_service = None
calendar_service = None

# Pydantic models for API
class EmailData(BaseModel):
    id: str
    subject: str = ""
    body: str = ""
    from_name: str = ""
    from_email: str = ""
    to_recipients: List[str] = []
    cc_recipients: List[str] = []
    date: str = ""
    threadId: str = ""

class AnalysisRequest(BaseModel):
    emails: List[EmailData]  # Accept emails from Next.js instead of fetching them
    days_back: Optional[int] = 14
    user_email: Optional[str] = None
    include_llm_digest: Optional[bool] = True

class AnalysisResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    timestamp: str

@app.on_event("startup")
async def startup_event():
    """Initialize shared resources on startup"""
    global nlp_model
    
    try:
        # Load spaCy model
        nlp_model = load_spacy_model()
        logging.info("✅ spaCy model loaded successfully")
        
        # Skip Gmail authentication - we'll receive emails from Next.js
        logging.info("✅ API bridge initialized - ready to accept email data from Next.js")
        
    except Exception as e:
        logging.error(f"❌ Failed to initialize NLP model: {e}")
        # Don't raise - allow server to start even if NLP fails
        logging.warning("⚠️ Server starting without NLP model")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.datetime.now().isoformat(),
        "services": {
            "nlp_model": nlp_model is not None,
            "gemini_api": bool(os.getenv("GEMINI_API_KEY")),
            "prompt_file": bool(os.getenv("GEMINI_PROMPT_FILE_PATH"))
        }
    }

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_communications(request: AnalysisRequest):
    """
    Main analysis endpoint that processes email data received from Next.js
    Returns executive intelligence insights instead of sending email
    """
    try:
        logging.info(f"🔍 Starting analysis for {len(request.emails)} emails from Next.js")
        
        if not request.emails:
            return AnalysisResponse(
                success=True,
                data={"message": "No emails provided for analysis"},
                timestamp=datetime.datetime.now().isoformat()
            )
        
        # Convert request emails to the format expected by analyze.py functions
        email_details = []
        for email_data in request.emails:
            email_details.append({
                'id': email_data.id,
                'threadId': email_data.threadId,
                'subject': email_data.subject,
                'from_name': email_data.from_name,
                'from_email': email_data.from_email,
                'to_recipients': email_data.to_recipients,
                'cc_recipients': email_data.cc_recipients,
                'date': email_data.date,
                'body': email_data.body
            })
        
        logging.info(f'✅ Converted {len(email_details)} emails for analysis')
        
        # Skip calendar events for now - focus on email analysis
        calendar_events = []
        
        # Perform email interaction analysis (only if NLP model is available)
        sender_email = request.user_email or os.getenv("SENDER_EMAIL_ADDRESS", "user@example.com")
        
        if nlp_model:
            top_email_exchange_contacts, avg_response_times, key_organizations_from_emails, combined_email_text, name_to_email_map, emails_awaiting_response = \
                analyze_email_interactions(email_details, sender_email, nlp_model)
        else:
            # Fallback analysis without NLP
            logging.warning("⚠️ NLP model not available - using simplified analysis")
            top_email_exchange_contacts = []
            avg_response_times = {}
            key_organizations_from_emails = Counter()
            combined_email_text = " ".join([email['body'] for email in email_details])
            name_to_email_map = {}
            emails_awaiting_response = []
        
        # No calendar events for now
        upcoming_meetings = []
        
        # Extract entities and themes
        key_people_combined = Counter()
        key_organizations_combined = Counter(key_organizations_from_emails)
        
        for email_entry in email_details:
            if email_entry['from_name'] and email_entry['from_email'] and not any(pattern in email_entry['from_email'].lower() for pattern in ["noreply", "info@", "support@", "marketing@"]):
                key_people_combined[email_entry['from_name']] += 1
            
            if nlp_model:
                people_in_body, orgs_in_body = extract_entities(email_entry['body'], nlp_model)
                for person in people_in_body:
                    key_people_combined[person] += 1
                for org in orgs_in_body:
                    key_organizations_combined[org] += 1
        
        # Extract themes (only if NLP model available)
        combined_text_for_themes = combined_email_text
        if nlp_model:
            themes = extract_keywords_for_themes(combined_text_for_themes, nlp_model)
        else:
            # Simple keyword extraction without NLP
            import re
            words = re.findall(r'\b\w+\b', combined_text_for_themes.lower())
            word_counts = Counter(words)
            # Filter out common words
            common_words = {'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can'}
            themes = [word for word, count in word_counts.most_common(20) if word not in common_words and len(word) > 3][:10]
        
        # Get consolidated contacts summary (only if we have the data)
        if nlp_model and top_email_exchange_contacts:
            consolidated_contacts_summary = get_consolidated_contacts_summary(
                key_people_combined, top_email_exchange_contacts, avg_response_times, 
                name_to_email_map, sender_email
            )
        else:
            # Simple fallback contacts summary
            consolidated_contacts_summary = [
                {"contact": name, "interactions": count, "emails_exchanged": count, "avg_response_time": "N/A"}
                for name, count in key_people_combined.most_common(10)
            ]
        
        # Prepare data for LLM
        llm_input_data = {
            "emails": email_details,
            "consolidated_contacts_summary": consolidated_contacts_summary,
            "emails_awaiting_response": emails_awaiting_response,
            "upcoming_meetings": upcoming_meetings,
            "key_organizations": list(key_organizations_combined.most_common(10)),
            "top_themes_keywords": themes,
            "analysis_summary": {
                "total_emails": len(email_details),
                "total_people": len(key_people_combined),
                "total_organizations": len(key_organizations_combined)
            }
        }
        
        # Generate LLM digest if requested
        llm_digest = "Executive briefing analysis completed."
        if request.include_llm_digest:
            try:
                llm_prompt = load_prompt_from_file(os.getenv("GEMINI_PROMPT_FILE_PATH"))
                if llm_prompt and os.getenv("GEMINI_API_KEY"):
                    llm_digest = await generate_gemini_summary(llm_input_data, llm_prompt)
                    logging.info("✅ LLM digest generated successfully")
                else:
                    logging.info("⚠️ Gemini API key or prompt file not configured")
            except Exception as e:
                logging.warning(f"⚠️ LLM digest generation failed: {e}")
        
        # Return structured analysis data (the key difference from analyze.py)
        analysis_result = {
            "executive_summary": {
                "total_emails": len(email_details),
                "emails_awaiting_response": len(emails_awaiting_response),
                "upcoming_meetings": len(upcoming_meetings),
                "analysis_period_days": request.days_back
            },
            "themes": themes if isinstance(themes, list) else [{"keyword": item[0], "frequency": item[1]} for item in themes[:10]] if themes else [],
            "key_people": [{"name": name, "frequency": freq} for name, freq in key_people_combined.most_common(15)],
            "key_organizations": [{"name": org, "frequency": freq} for org, freq in key_organizations_combined.most_common(10)],
            "emails_awaiting_response": emails_awaiting_response,
            "upcoming_meetings": upcoming_meetings,
            "consolidated_contacts_summary": consolidated_contacts_summary,
            "llm_digest": llm_digest,
            "processing_info": {
                "nlp_model_used": nlp_model is not None,
                "llm_digest_requested": request.include_llm_digest,
                "gemini_api_available": bool(os.getenv("GEMINI_API_KEY"))
            }
        }
        
        logging.info(f"✅ Analysis completed: {len(email_details)} emails, {len(themes)} themes, {len(key_people_combined)} people")
        
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
    uvicorn.run(app, host="0.0.0.0", port=8001)