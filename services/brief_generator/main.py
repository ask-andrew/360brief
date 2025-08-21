from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
import os
from dotenv import load_dotenv
import openai
import json
import logging
from datetime import datetime

# Load environment variables
load_dotenv()

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
    data: Dict = Field(..., description="Raw data from microservices")
    style: str = Field(
        default="mission_brief",
        description="Communication style for the brief",
        regex="^(mission_brief|management_consulting|startup_velocity|newsletter)$"
    )
    llm_provider: str = Field(
        default="openai",
        description="LLM provider to use",
        regex="^(openai|gemini|anthropic)$"
    )

class BriefOutput(BaseModel):
    content: Dict
    metadata: Dict

# Prompt templates
PROMPT_TEMPLATES = {
    "mission_brief": """
    # MISSION BRIEF
    ## EXECUTIVE SUMMARY
    {executive_summary}

    ## KEY THEMES
    {key_themes}

    ## ACTION ITEMS
    {action_items}

    ## BLOCKERS
    {blockers}

    ## KUDOS
    {kudos}
    """,
    # Add other style templates here
}

def generate_prompt(data: Dict, style: str) -> str:
    """Generate prompt by combining template with data."""
    template = PROMPT_TEMPLATES.get(style, PROMPT_TEMPLATES["mission_brief"])
    
    # Extract relevant data for each section
    # This is a simplified example - you'll want to customize this based on your actual data structure
    executive_summary = ""  # Generate from data
    key_themes = ""  # Generate from data
    action_items = ""  # Generate from data
    blockers = ""  # Generate from data
    kudos = ""  # Generate from data
    
    # Format the prompt with the extracted data
    prompt = template.format(
        executive_summary=executive_summary,
        key_themes=key_themes,
        action_items=action_items,
        blockers=blockers,
        kudos=kudos
    )
    
    return prompt

async def call_llm(prompt: str, provider: str = "openai") -> str:
    """Call the appropriate LLM provider with the generated prompt."""
    try:
        if provider == "openai":
            client = openai.AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            response = await client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=2000
            )
            return response.choices[0].message.content
        # Add support for other providers (Gemini, Anthropic) here
        else:
            raise ValueError(f"Unsupported LLM provider: {provider}")
    except Exception as e:
        logger.error(f"Error calling LLM provider {provider}: {str(e)}")
        raise

@app.post("/api/v1/generate-brief", response_model=BriefOutput)
async def generate_brief(brief_input: BriefInput):
    """
    Generate an executive brief based on the provided data and style.
    """
    try:
        logger.info(f"Generating {brief_input.style} brief...")
        
        # Generate prompt from template and input data
        prompt = generate_prompt(brief_input.data, brief_input.style)
        
        # Call LLM to generate the brief
        llm_response = await call_llm(prompt, brief_input.llm_provider)
        
        # Parse the LLM response (assuming it returns valid JSON)
        try:
            content = json.loads(llm_response)
        except json.JSONDecodeError:
            # If not valid JSON, wrap it in a content field
            content = {"content": llm_response}
        
        # Prepare response
        return {
            "content": content,
            "metadata": {
                "generated_at": datetime.utcnow().isoformat(),
                "model": brief_input.llm_provider,
                "style": brief_input.style
            }
        }
        
    except Exception as e:
        logger.error(f"Error generating brief: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
