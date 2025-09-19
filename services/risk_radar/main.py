import os
import spacy
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from typing import List, Dict, Optional
from dotenv import load_dotenv
import google.generativeai as genai
import re
import json

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

# Placeholder for email fetching from the data ingestion layer
async def fetch_emails_from_data_ingestion_layer(
    strict_7d: bool = False,
    relaxed_14d: bool = False,
    exclude_promotional: bool = True,
    exclude_social: bool = True,
    exclude_noreply: bool = True,
) -> List[Email]:
    """Simulates fetching emails from the data ingestion layer with filtering.
    In a real scenario, this would interact with a database or another service.
    """
    # For now, return an empty list or mock data.
    # TODO: Implement actual data ingestion and filtering logic here.
    print(f"Fetching emails with filters: strict_7d={strict_7d}, relaxed_14d={relaxed_14d}, exclude_promotional={exclude_promotional}")
    return [] # Return an empty list for now, or add mock Email objects

# Load environment variables
load_dotenv()

# Load NLP model
nlp = spacy.load("en_core_web_sm")

# --- Configuration ---
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    print("GEMINI_API_KEY is set. LLM-based radar generation enabled.")
else:
    print("GEMINI_API_KEY is NOT set. Falling back to non-LLM radar generation.")

# --- FastAPI App ---
app = FastAPI(
    title="Risk & Opportunity Radar API",
    description="Identifies emerging blockers and opportunities from email data.",
    version="1.0.0",
)

# --- Non-LLM Analysis ---

def clean_text(text):
    text = re.sub(r'<[^>]+>>', '', text)  # Remove HTML tags
    text = re.sub(r'(On .*wrote:|From:.*|Sent:.*|To:.*|Subject:.*)', '', text, flags=re.IGNORECASE) # Remove email headers
    text = re.sub(r'--\n.*|\n>.*|', '', text) # Remove signatures and quoted text
    return text.strip()



BLOCKER_KEYWORDS = ["stuck", "blocked", "delay", "issue", "urgent", "problem", "help", "risk", "bug", "error"]

def generate_non_llm_radar(emails: List[Email]) -> List[RadarOutput]:
    identified_blockers = []
    for email in emails:
        clean_body = clean_text(email.body)
        if any(keyword in clean_body.lower() for keyword in BLOCKER_KEYWORDS):
            doc = nlp(clean_body)
            impact_area = "General"
            for ent in doc.ents:
                if ent.label_ in ["ORG", "PRODUCT", "WORK_OF_ART"]: # WORK_OF_ART can be project names
                    impact_area = ent.text
                    break

            blocker = RadarOutput(
                id=email.id,
                summary=f"Potential blocker identified in email: {email.subject}",
                impactArea=impact_area,
                urgencyScore="Medium",
                severityScore="Major",
                suggestedAction="Manual review suggested to determine appropriate action.",
                relatedEmails=[email.id],
            )
            identified_blockers.append(blocker)
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
