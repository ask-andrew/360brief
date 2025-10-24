import os
import re
import json
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Optional
from dotenv import load_dotenv

# Try to import optional dependencies
try:
    import spacy
    SPACY_AVAILABLE = True
    print("SpaCy is available for NLP processing")
except ImportError:
    SPACY_AVAILABLE = False
    print("SpaCy not available - running in basic mode")

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
    print("Google Generative AI is available for LLM processing")
except ImportError:
    GENAI_AVAILABLE = False
    print("Google Generative AI not available - running in non-LLM mode")

# --- Pydantic Models ---
class Email(BaseModel):
    id: str
    subject: str
    body: str
    sender: str

class RadarInput(BaseModel):
    emails: List[Email]

class RadarOutput(BaseModel):
    id: str
    summary: str
    impactArea: str
    urgencyScore: str
    severityScore: str
    suggestedAction: str
    relatedEmails: List[str]

# Load environment variables
load_dotenv()

# Load NLP model if available
nlp = None
if SPACY_AVAILABLE:
    try:
        nlp = spacy.load("en_core_web_sm")
        print("SpaCy model loaded successfully")
    except:
        print("Could not load SpaCy model - running without NLP")

# --- Configuration ---
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_API_KEY and GENAI_AVAILABLE:
    genai.configure(api_key=GEMINI_API_KEY)
    print("GEMINI_API_KEY is set. LLM-based radar generation enabled.")
else:
    print("GEMINI_API_KEY is NOT set or GenAI not available. Falling back to rule-based radar generation.")

# --- FastAPI App ---
app = FastAPI(
    title="Risk & Opportunity Radar API",
    description="Identifies emerging blockers and opportunities from email data.",
    version="1.0.0",
)

# --- Utility Functions ---

def clean_text(text):
    text = re.sub(r'<[^>]+>>', '', text)  # Remove HTML tags
    text = re.sub(r'(On .*wrote:|From:.*|Sent:.*|To:.*|Subject:.*)', '', text, flags=re.IGNORECASE) # Remove email headers
    text = re.sub(r'--\n.*|\n>.*|', '', text) # Remove signatures and quoted text
    return text.strip()

BLOCKER_KEYWORDS = ["stuck", "blocked", "delay", "issue", "urgent", "problem", "help", "risk", "bug", "error"]

def generate_rule_based_radar(emails: List[Email]) -> List[RadarOutput]:
    """Generate radar data using rule-based keyword analysis"""
    identified_items = []
    for email in emails:
        clean_body = clean_text(email.body)
        if any(keyword in clean_body.lower() for keyword in BLOCKER_KEYWORDS):
            # Simple impact area detection
            impact_area = "General"
            if "project" in clean_body.lower():
                impact_area = "Project"
            elif "customer" in clean_body.lower() or "client" in clean_body.lower():
                impact_area = "Customer"
            elif "team" in clean_body.lower() or "meeting" in clean_body.lower():
                impact_area = "Team"

            # Simple urgency/severity scoring
            urgency_score = "Medium"
            severity_score = "Major"

            # Increase urgency if multiple keywords found
            keyword_count = sum(1 for keyword in BLOCKER_KEYWORDS if keyword in clean_body.lower())
            if keyword_count >= 3:
                urgency_score = "High"
            elif keyword_count == 1:
                urgency_score = "Low"

            # Increase severity for certain keywords
            if any(word in clean_body.lower() for word in ["critical", "urgent", "p0", "blocker"]):
                severity_score = "Critical"

            item = RadarOutput(
                id=email.id,
                summary=f"Potential issue identified in email: {email.subject[:50]}{'...' if len(email.subject) > 50 else ''}",
                impactArea=impact_area,
                urgencyScore=urgency_score,
                severityScore=severity_score,
                suggestedAction="Review email thread for context and determine appropriate action.",
                relatedEmails=[email.id],
            )
            identified_items.append(item)

    return identified_items

# --- API Endpoints ---

@app.get("/")
async def root():
    return {"message": "Risk & Opportunity Radar API is running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "spacy_available": SPACY_AVAILABLE,
        "genai_available": GENAI_AVAILABLE,
        "llm_enabled": bool(GEMINI_API_KEY and GENAI_AVAILABLE)
    }

@app.post("/generate-radar", response_model=List[RadarOutput])
async def generate_radar(radar_input: RadarInput):
    """Generate risk/opportunity radar data from email input"""
    if not radar_input.emails:
        return []

    # Use LLM if available, otherwise use rule-based approach
    if GEMINI_API_KEY and GENAI_AVAILABLE:
        try:
            return await generate_llm_radar(radar_input.emails)
        except Exception as e:
            print(f"LLM generation failed: {e}, falling back to rule-based")
            return generate_rule_based_radar(radar_input.emails)
    else:
        return generate_rule_based_radar(radar_input.emails)

# Placeholder for LLM-based generation (if dependencies are available)
async def generate_llm_radar(emails: List[Email]) -> List[RadarOutput]:
    """Generate radar data using LLM analysis"""
    # This would contain the actual LLM implementation
    # For now, fall back to rule-based
    return generate_rule_based_radar(emails)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
