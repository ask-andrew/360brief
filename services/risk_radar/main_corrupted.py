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
    return identified_blockers

# --- LLM Analysis ---

async def generate_llm_radar(emails: List[Email]) -> List[RadarOutput]:
    # This is a simplified example. A real implementation would involve more sophisticated prompting.
    model = genai.GenerativeModel("gemini-pro")

    prompt = f"""Analyze the following emails and identify potential blockers or risks. 
    For each identified blocker, provide a summary, impact area, urgency score, severity score, and a suggested action.
    Respond with a JSON array of objects, where each object has the following keys: id, summary, impactArea, urgencyScore, severityScore, suggestedAction, relatedEmails.

    Emails:
    """

    for email in emails:
        prompt += f"---\nID: {email.id}\nSubject: {email.subject}\nBody: {clean_text(email.body)}\n"

    try:
        response = await model.generate_content_async(prompt)
        # Basic parsing, a more robust solution would be needed for production
        response_text = response.text.strip().replace("```json", "").replace("```", "")
        try:
            parsed_response = json.loads(response_text)
            return [RadarOutput(**item) for item in parsed_response]
        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail="Failed to parse LLM response as JSON.")
    except Exception as e:
        print(f"Error during LLM radar generation: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate LLM-based radar: {e}")


# --- API Endpoint ---

@app.get("/radar", response_model=List[RadarOutput])
async def get_radar(
    strict_7d: bool = Query(False, description="Apply strict 7-day filter for emails."),
    relaxed_14d: bool = Query(False, description="Apply relaxed 14-day filter for emails."),
    exclude_promotional: bool = Query(True, description="Exclude promotional emails."),
    exclude_social: bool = Query(True, description="Exclude social emails."),
    exclude_noreply: bool = Query(True, description="Exclude no-reply emails."),
):
    emails = await fetch_emails_from_data_ingestion_layer(
        strict_7d=strict_7d,
        relaxed_14d=relaxed_14d,
        exclude_promotional=exclude_promotional,
        exclude_social=exclude_social,
        exclude_noreply=exclude_noreply,
    )

    if GEMINI_API_KEY:
        return await generate_llm_radar(emails)
    else:
        return generate_non_llm_radar(emails)

@app.post("/generate-radar", response_model=List[RadarOutput])
async def generate_radar(radar_input: RadarInput):
    if GEMINI_API_KEY:
        return await generate_llm_radar(radar_input.emails)
    else:
        return generate_non_llm_radar(radar_input.emails)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
