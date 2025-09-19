import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
import os
from dotenv import load_dotenv, find_dotenv
import google.generativeai as genai
import json
import logging
from datetime import datetime, timezone
import traceback
from config import GEMINI_API_KEY
import httpx
from urllib.parse import urljoin
from achievement_extractor import RealDataPopulator

# Load environment variables
load_dotenv(find_dotenv())

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="360Brief Generator API",
    description="API for generating executive briefs using LLMs",
    version="1.0.0"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class BriefInput(BaseModel):
    user_id: str
    emails: List[Dict]
    days_back: int
    filter_marketing: bool
    use_llm_override: Optional[bool] = None

class UserSubscription(BaseModel):
    subscription_tier: str = 'free'

class BriefOutput(BaseModel):
    missionBrief: Dict
    winbox: List[Dict]
    processing_metadata: Dict

class EmailBatchInput(BaseModel):
    emails: List[Dict]

# Prompt templates
PROMPT_TEMPLATES = {
    "mission_brief_start": """
    Analyze the following email threads and generate a mission brief.
    Group emails by subject and provide a summary for each thread.
    Extract key action items, blockers, and kudos.

    Email threads:
    """,
    "mission_brief_end": """
    Respond with a JSON object with the following structure:
    {
        "missionBrief": {
            "currentStatus": {
                "primaryIssue": "..."
            },
            "immediateActions": [
                {
                    "title": "...",
                    "objective": "...",
                    "priority": "...",
                    "messageId": "..."
                }
            ],
            "requiredActions": ["..."],
            "trends": ["..."]
        },
        "winbox": [
            {
                "name": "...",
                "achievement": "..."
            }
        ]
    }
    """
}

def generate_prompt(emails: List[Dict]) -> str:
    """Generate prompt by combining template with data."""
    template_start = PROMPT_TEMPLATES["mission_brief_start"]
    template_end = PROMPT_TEMPLATES["mission_brief_end"]
    
    # Group emails by subject
    grouped_emails = {}
    for email in emails:
        subject = email.get("subject", "No Subject").replace("Re: ", "").strip()
        if subject not in grouped_emails:
            grouped_emails[subject] = []
        grouped_emails[subject].append(email)
        
    # Generate summaries for each group
    email_threads = []
    for subject, email_group in grouped_emails.items():
        thread = f"Subject: {subject}\n"
        for email in email_group:
            thread += f"From: {email.get('from', {}).get('email', 'Unknown')}\n"
            thread += f"Date: {email.get('date')}\n"
            thread += f"Body: {email.get('body', '')}\n---\n"
        email_threads.append(thread)
        
    email_threads_str = "\n".join(email_threads)
    
    prompt = template_start + email_threads_str + template_end
    
    return prompt

async def get_user_subscription(user_id: str) -> UserSubscription:
    """
    Get user subscription tier from Supabase.
    """
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    service_role_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

    if not supabase_url or not service_role_key:
        logger.warning("Supabase credentials not found, defaulting to free tier")
        return UserSubscription(subscription_tier='free')

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{supabase_url}/rest/v1/profiles",
                headers={
                    "apikey": service_role_key,
                    "Authorization": f"Bearer {service_role_key}",
                    "Content-Type": "application/json"
                },
                params={"select": "subscription_tier", "id": f"eq.{user_id}"}
            )

            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    return UserSubscription(subscription_tier=data[0].get('subscription_tier', 'free'))

            logger.warning(f"Could not fetch user subscription for {user_id}, defaulting to free")
            return UserSubscription(subscription_tier='free')

    except Exception as e:
        logger.error(f"Error fetching user subscription: {str(e)}")
        return UserSubscription(subscription_tier='free')

def generate_non_llm_brief(data: List[Dict]) -> dict:
    """
    Generates an enhanced brief from email data using the Achievement Extractor module.
    This provides real data insights without relying on a full LLM call.
    """
    logger.info("Generating non-LLM brief with Achievement Extractor")
    populator = RealDataPopulator()

    # Adapt the input email data to the format expected by the extractor
    class MockEmail:
        def __init__(self, email_dict):
            self.summary = email_dict.get("subject", "No Subject")
            self.key_points = [email_dict.get("body", "")]
            self.message_id = email_dict.get("id")
            self.processed_at = datetime.now()

    processed_emails = [MockEmail(email) for email in data]
    
    # Get real data from the achievement extractor
    real_data = populator.populate_briefing_sections(processed_emails)
    
    # Extract achievements and trends
    winbox_achievements = real_data.get("team_achievements", [])
    trends = [p["description"] for p in real_data.get("communication_patterns", [])]

    # Fallback if no achievements are found
    if not winbox_achievements:
        winbox_achievements = [{
            "name": "Automated Analysis",
            "achievement": f"Processed {len(data)} emails to identify key patterns and achievements.",
            "impact": "No specific team achievements detected in this batch."
        }]

    # Fallback for trends
    if not trends:
        trends = ["Standard communication patterns observed.", "No major blockers or urgent trends detected."]

    # Basic action item extraction (can be improved)
    immediate_actions = []
    urgent_keywords = ['urgent', 'asap', 'immediate', 'emergency', 'critical', 'deadline']
    for email in data:
        email_text = f"{email.get('subject', '')} {email.get('body', '')}".lower()
        if any(keyword in email_text for keyword in urgent_keywords):
            immediate_actions.append({
                "title": email.get("subject", "No Subject"),
                "objective": f"Address urgent matter from {email.get('from', {}).get('email', 'Unknown')}",
                "priority": "high",
                "messageId": email.get("id")
            })

    return {
        "missionBrief": {
            "currentStatus": {
                "primaryIssue": "Review the extracted trends and achievements for situational awareness."
            },
            "immediateActions": immediate_actions[:5],
            "requiredActions": [
                "Review extracted achievements for team recognition opportunities.",
                "Note the communication patterns for potential follow-up.",
                "Upgrade to Premium for full AI-powered brief generation."
            ],
            "trends": trends
        },
        "winbox": winbox_achievements
    }

async def call_gemini(prompt: str) -> str:
    """Call the Gemini API with the generated prompt."""
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = await model.generate_content_async(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Error calling Gemini API: {str(e)}")
        raise

@app.post("/generate-brief", response_model=BriefOutput)
async def generate_brief(brief_input: BriefInput):
    """
    Generate an executive brief based on the provided data and user subscription tier.
    Premium users get AI-powered analysis, free users get basic organization.
    """
    try:
        logger.info(f"Generating brief for user {brief_input.user_id}...")

        # Get user subscription tier
        user_subscription = await get_user_subscription(brief_input.user_id)
        logger.info(f"User {brief_input.user_id} has {user_subscription.subscription_tier} subscription")

        # Temporarily make andrew.ledet@gmail.com premium for testing
        if brief_input.user_id == 'ef25c737-514e-466a-b7da-0076ae720031':
            logger.info("🎯 Detected andrew.ledet@gmail.com - upgrading to premium for testing")
            user_subscription.subscription_tier = 'premium'

        # Use LLM override if provided, otherwise use subscription tier logic
        if brief_input.use_llm_override is not None:
            use_llm = brief_input.use_llm_override and GEMINI_API_KEY
            logger.info(f"Using LLM override: {brief_input.use_llm_override}, LLM enabled: {use_llm}")
        else:
            # Use LLM for premium/enterprise users with API key, otherwise use non-LLM
            use_llm = (user_subscription.subscription_tier in ['premium', 'enterprise'] and GEMINI_API_KEY)

        if use_llm:
            logger.info("Using Gemini LLM for premium user")
            try:
                prompt = generate_prompt(brief_input.emails)
                llm_response = await call_gemini(prompt)
                model_name = "gemini-premium"
                try:
                    # Gemini may return markdown, so we need to strip it
                    cleaned_response = llm_response.strip().replace('`json', '').replace('`', '')
                    content = json.loads(cleaned_response)
                    logger.info(f"Parsed premium content from Gemini")
                except json.JSONDecodeError:
                    logger.error(f"Failed to decode Gemini response as JSON: {llm_response}")
                    raise HTTPException(status_code=500, detail="Failed to generate a valid brief from LLM.")
            except Exception as llm_error:
                logger.warning(f"LLM failed ({str(llm_error)}), falling back to non-LLM brief")
                content = generate_non_llm_brief(brief_input.emails)
                model_name = f"non-llm-fallback-{user_subscription.subscription_tier}"
        else:
            reason = "free tier user" if user_subscription.subscription_tier == 'free' else "GEMINI_API_KEY not found"
            logger.info(f"Using non-LLM brief generation: {reason}")
            content = generate_non_llm_brief(brief_input.emails)
            model_name = f"non-llm-{user_subscription.subscription_tier}"

        response_data = {
            "missionBrief": content.get("missionBrief", {}),
            "winbox": content.get("winbox", []),
            "processing_metadata": {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "model": model_name,
                "style": "mission_brief",
                "subscription_tier": user_subscription.subscription_tier,
                "llm_enabled": use_llm
            }
        }
        logger.info(f"Returning response: {response_data}")
        return response_data
        
    except Exception as e:
        logger.error(f"Error generating brief: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/process-email-batch")
async def process_email_batch(email_batch: EmailBatchInput):
    return {"relevant": 0, "filtered": 0, "results": []}

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
