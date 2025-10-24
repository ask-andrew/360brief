import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Tuple
import os
from dotenv import load_dotenv, find_dotenv
import google.generativeai as genai
import json
import logging
import re
from collections import defaultdict, Counter
from datetime import datetime, timezone
import traceback

# Import the new enhanced narrative brief system
try:
    # Add current directory to path for imports
    import sys
    import os
    current_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(current_dir)
    sys.path.insert(0, parent_dir)
    sys.path.insert(0, current_dir)

    from enhanced_narrative_brief import generate_enhanced_narrative_brief
    print("✅ Enhanced narrative brief system imported successfully")
except ImportError as e:
    print(f"❌ Failed to import enhanced narrative brief: {e}")
    print("🔍 Current working directory and paths...")
    print(f"Current dir: {os.getcwd()}")
    print(f"Python path: {sys.path[:5]}")
    generate_enhanced_narrative_brief = None

try:
    from config import GEMINI_API_KEY  # type: ignore
except Exception:
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
import httpx
from urllib.parse import urljoin
from achievement_extractor import RealDataPopulator

import sys
import os

# Add the parent services directory to Python path for enhanced clustering import
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.insert(0, parent_dir)

try:
    from enhanced_multi_source_clustering import process_email_batch_enhanced
    print("✅ Enhanced clustering module imported successfully")
except ImportError as e:
    print(f"❌ Failed to import enhanced clustering: {e}")
    print("🔍 Checking current working directory and paths...")
    import os
    print(f"Current working directory: {os.getcwd()}")
    print(f"Python path: {sys.path[:3]}")  # Show first 3 paths
    process_email_batch_enhanced = None

# Load environment variables
load_dotenv(find_dotenv())
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

class NarrativeBriefInput(BaseModel):
    emails: List[Dict]
    max_projects: int = 8
    include_clusters: bool = True

# Prompt templates
PROMPT_TEMPLATES = {
    "mission_brief_start": """
    Analyze the following email threads and generate a mission brief.
    Group emails by subject and provide a summary for each thread.
    Extract key action items, blockers, and kudos.

    Focus on creating SPECIFIC, ACTIONABLE immediate actions for each email thread or category.
    Each action should be concrete and reference specific people, deadlines, or deliverables.

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
                    "title": "SPECIFIC ACTION - e.g., 'Review Q4 budget proposal from Finance team'",
                    "objective": "CLEAR GOAL - e.g., 'Approve budget allocation for marketing initiatives'",
                    "priority": "high|medium|low",
                    "messageId": "specific email ID if applicable",
                    "stakeholder": "specific person or team",
                    "deadline": "specific date if mentioned"
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

    IMPORTANT: Make immediateActions SPECIFIC and actionable, not generic like "confirm next steps".
    Reference actual content from emails, specific people, deadlines, and deliverables.
    """
}

# --------------------- Enhanced Narrative Brief (Project-clustered) ---------------------

@app.post("/generate-narrative-brief")
async def generate_narrative_brief(req: NarrativeBriefInput):
    """Generate an enhanced narrative-driven executive brief using the new preprocessing and synthesis pipeline.
    Applies financial constraint: only include dollar values if explicitly present in at least one item of the cluster.
    """
    try:
        if not req.emails:
            raise HTTPException(status_code=400, detail="No emails provided")

        # Use enhanced narrative brief system if available
        if generate_enhanced_narrative_brief:
            logger.info(f"Using enhanced narrative brief system for {len(req.emails)} emails")
            start_time = datetime.now(timezone.utc)
            result = generate_enhanced_narrative_brief(
                emails=req.emails,
                max_projects=req.max_projects,
                use_llm=GEMINI_API_KEY is not None
            )
            end_time = datetime.now(timezone.utc)
            response_time_ms = int((end_time - start_time).total_seconds() * 1000)

            # Add feedback metadata to response
            result.update({
                'feedback_metadata': {
                    'engine_used': result.get('engine', 'enhanced_narrative_v2'),
                    'generation_timestamp': start_time.isoformat(),
                    'response_time_ms': response_time_ms,
                    'llm_model': 'gemini-1.5-flash' if GEMINI_API_KEY else None,
                    'input_emails_count': len(req.emails),
                    'input_clusters_count': result.get('total_clusters', 0),
                    'cluster_data': result.get('clusters', []),
                    'llm_prompt': result.get('llm_prompt') if 'llm_prompt' in result else None
                }
            })

            return result
        else:
            logger.warning("Enhanced narrative brief system not available, using fallback")
            # Fallback to basic implementation
            start_time = datetime.now(timezone.utc)
            markdown, clusters = generate_narrative_brief_markdown_fallback(req.emails, max_projects=req.max_projects)
            end_time = datetime.now(timezone.utc)
            response_time_ms = int((end_time - start_time).total_seconds() * 1000)

            result = {
                'markdown': markdown,
                'clusters': clusters if req.include_clusters else None,
                'generated_at': end_time.isoformat(),
                'engine': 'narrative_v1_fallback',
                'total_emails': len(req.emails),
                'total_clusters': len(clusters) if clusters else 0,
                'feedback_metadata': {
                    'engine_used': 'narrative_v1_fallback',
                    'generation_timestamp': start_time.isoformat(),
                    'response_time_ms': response_time_ms,
                    'llm_model': None,
                    'input_emails_count': len(req.emails),
                    'input_clusters_count': len(clusters) if clusters else 0,
                    'cluster_data': clusters if clusters else [],
                    'llm_prompt': None
                }
            }
            return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating narrative brief: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Failed to generate narrative brief")

# --------------------- Fallback Basic Implementation ---------------------

FINANCIAL_REGEX = re.compile(r"\$\s*([0-9]{1,3}(?:[,\s][0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)", re.IGNORECASE)

def _clean_amount_to_float(m: str) -> float:
    try:
        return float(m.replace(',', '').strip())
    except Exception:
        return 0.0

def extract_financial_values(text: str) -> List[float]:
    if not text:
        return []
    values = []
    for match in FINANCIAL_REGEX.findall(text):
        values.append(_clean_amount_to_float(match))
    return values

def extract_people_sources(email: Dict[str, Any]) -> List[str]:
    people: List[str] = []
    frm = email.get('from') or email.get('sender') or {}
    if isinstance(frm, dict):
        if frm.get('name'): people.append(str(frm.get('name')))
        if frm.get('email'): people.append(str(frm.get('email')))
    elif isinstance(frm, str):
        people.append(frm)
    # Also add simple names from body like "- Chris Laguna" patterns
    body = email.get('body') or email.get('content') or ''
    for m in re.findall(r"\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b", body):
        people.append(m)
    subject = email.get('subject') or ''
    for m in re.findall(r"\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b", subject):
        people.append(m)
    return list({p.strip(): None for p in people}.keys())

def detect_status(email_text: str) -> Dict[str, bool]:
    t = (email_text or '').lower()
    return {
        'blocker': any(k in t for k in ['blocker', 'blocked', 'issue', 'problem', 'stalled', 'urgent', 'asap', 'critical']),
        'decision': any(k in t for k in ['decision', 'approve', 'authorization', 'sign-off', 'sign off']),
        'achievement': any(k in t for k in ['shipped', 'launched', 'completed', 'delivered', 'win', 'closed won', 'achievement'])
    }

def infer_project_key(email: Dict[str, Any]) -> str:
    subject = (email.get('subject') or '').strip()
    body = (email.get('body') or email.get('content') or '').strip()
    # Prefer hyphenated pairs e.g., "Allied - Ledet"
    m = re.search(r"([A-Z][\w& ]+?)\s*-\s*([A-Z][\w& ]+)", subject)
    if m:
        return f"{m.group(1).strip()} - {m.group(2).strip()}"
    # If no hyphen, try keyphrase pair from subject
    words = re.findall(r"[A-Za-z][A-Za-z0-9&]+", subject)
    if len(words) >= 2:
        return f"{words[0]} - {words[1]}"
    # Fallback: first 6 words of subject
    short = ' '.join(subject.split()[:6]) or 'General'
    return short

def cluster_emails_by_project_fallback(emails: List[Dict[str, Any]]):
    clusters = {}
    for e in emails:
        key = infer_project_key(e)
        if key not in clusters:
            clusters[key] = {
                'project': key,
                'items': [],
                'people': set(),
                'statuses': Counter(),
                'financial_values': [],
                'has_money_mention': False,
            }
        body = e.get('body') or e.get('content') or ''
        subject = e.get('subject') or ''
        text = f"{subject}\n{body}"
        st = detect_status(text)
        for k, v in st.items():
            if v:
                clusters[key]['statuses'][k] += 1
        amounts = extract_financial_values(text)
        if amounts:
            clusters[key]['financial_values'].extend(amounts)
            clusters[key]['has_money_mention'] = True
        for p in extract_people_sources(e):
            clusters[key]['people'].add(p)
        clusters[key]['items'].append({
            'id': e.get('id'),
            'subject': subject,
            'date': e.get('date'),
            'snippet': (body[:240] + '...') if len(body) > 240 else body,
            'sender': e.get('from') or e.get('sender')
        })
    # Finalize
    for c in clusters.values():
        c['people'] = sorted(list(c['people']))
        c['financial_total'] = sum(c['financial_values']) if c['has_money_mention'] else 0.0
        # Severity score: blockers weigh highest, then decisions
        c['urgency_score'] = c['statuses'].get('blocker', 0) * 3 + c['statuses'].get('decision', 0) * 2 + c['statuses'].get('achievement', 0)
    return clusters

def synthesize_cluster_narrative_fallback(cluster: Dict[str, Any]) -> Tuple[str, List[str], List[str]]:
    statuses = cluster.get('statuses', {})
    has_blocker = statuses.get('blocker', 0) > 0
    has_decision = statuses.get('decision', 0) > 0
    has_achievement = statuses.get('achievement', 0) > 0
    people = ', '.join(cluster.get('people', [])) or 'N/A'
    value_str = ''
    if cluster.get('has_money_mention') and cluster.get('financial_total', 0) > 0:
        value_str = f" This project references approximately ${cluster['financial_total']:,.0f}."

    # Contextual summary (2-3 sentences)
    parts = []
    if has_decision:
        parts.append("A key decision is pending and requires timely executive input.")
    if has_blocker:
        parts.append("Progress is impacted by an active blocker that needs resolution.")
    if has_achievement and not (has_blocker or has_decision):
        parts.append("Recent achievements indicate positive momentum.")
    if not parts:
        parts.append("Ongoing communications indicate active coordination across stakeholders.")
    summary = f"{' '.join(parts)} Stakeholders: {people}.{value_str}"

    # Action items
    actions: List[str] = []
    if has_decision:
        actions.append("Decision: Provide authorization or guidance to unblock next steps.")
    if has_blocker:
        actions.append("Blocker: Assign an owner and timeline for resolution.")

    # Risks/blockers details (simple extraction from snippets)
    blockers: List[str] = []
    for it in cluster.get('items', [])[:3]:
        snip = (it.get('snippet') or '').lower()
        if any(k in snip for k in ['block', 'issue', 'problem', 'stalled', 'urgent']):
            blockers.append(f"{it.get('subject')}")

    return summary, actions, blockers

def generate_narrative_brief_markdown_fallback(emails: List[Dict[str, Any]], max_projects: int = 8):
    clusters_dict = cluster_emails_by_project_fallback(emails)
    clusters_sorted = sorted(clusters_dict.values(), key=lambda c: (c['urgency_score'], c.get('financial_total', 0)), reverse=True)

    # Executive Summary (4-5 sentences) using top 2-3 clusters
    top_clusters = clusters_sorted[:3]
    exec_sentences = []
    for c in top_clusters:
        has_b = c['statuses'].get('blocker', 0) > 0
        has_d = c['statuses'].get('decision', 0) > 0
        val_txt = f", approx ${c['financial_total']:,.0f}" if c.get('has_money_mention') and c.get('financial_total', 0) > 0 else ''
        if has_b and has_d:
            exec_sentences.append(f"{c['project']} has a decision pending and is currently blocked{val_txt}.")
        elif has_d:
            exec_sentences.append(f"{c['project']} requires an executive decision{val_txt}.")
        elif has_b:
            exec_sentences.append(f"{c['project']} is impacted by a critical blocker{val_txt}.")
        else:
            exec_sentences.append(f"{c['project']} shows activity and coordination{val_txt}.")

    executive_summary = ' '.join(exec_sentences[:5])

    # Project Deep Dive
    lines: List[str] = []
    lines.append("# Executive Summary")
    lines.append(executive_summary or "Active projects with mixed decisions, blockers, and achievements.")
    lines.append("")
    lines.append("# Project Deep Dive")

    for c in clusters_sorted[:max_projects]:
        status_labels = []
        if c['statuses'].get('decision', 0) > 0: status_labels.append('Decision')
        if c['statuses'].get('blocker', 0) > 0: status_labels.append('Blocker')
        if c['statuses'].get('achievement', 0) > 0: status_labels.append('Achievement')
        status_text = ' & '.join(status_labels) or 'Active'
        lines.append(f"## {c['project']} | Status: {status_text}")
        summary, actions, blockers = synthesize_cluster_narrative_fallback(c)
        lines.append(f"{summary}")
        if actions:
            lines.append("- **Action Needed**: " + '; '.join(actions))
        if blockers:
            lines.append("- **Blockers/Risks**: " + '; '.join(blockers))
        if c.get('people'):
            lines.append("- **Contributors**: " + ', '.join(c['people']))
        if c.get('has_money_mention') and c.get('financial_total', 0) > 0:
            lines.append(f"- **Financial**: ~${c['financial_total']:,.0f}")
        # Related items (compact)
        rel = [f"• {it.get('subject')}" for it in c.get('items', [])[:3] if it.get('subject')]
        if rel:
            lines.append("- **Related Items**: " + ' | '.join(rel))
        lines.append("")

    # General Momentum & Achievements / Recurring Content
    lines.append("# General Momentum & Achievements")
    # Simple grouping by known newsletter-like sources
    newsletter_clusters = []
    for c in clusters_sorted:
        pj = c['project'].lower()
        if any(k in pj for k in ['newsletter', 'substack', 'washington', 'post', 'digest']):
            newsletter_clusters.append(c)
    if newsletter_clusters:
        count = sum(len(c['items']) for c in newsletter_clusters)
        lines.append(f"Recurring newsletters and market updates ({count} items) provided general insights. No business action required.")

    markdown = '\n'.join(lines)
    return markdown, clusters_sorted

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

def generate_brief_from_clusters(clusters: List[Dict]) -> dict:
    """Generates a brief from the clustered email data without using an LLM."""
    logger.info("Generating non-LLM brief from clusters")

    if not clusters:
        return {
            "missionBrief": {
                "currentStatus": {"primaryIssue": "No actionable information found."},
                "immediateActions": [],
                "requiredActions": [],
                "trends": []
            },
            "winbox": []
        }

    # Sort clusters by urgency/impact score if available
    clusters.sort(key=lambda c: c.get('metadata', {}).get('scores', {}).get('urgency_score', 0), reverse=True)

    primary_issue = clusters[0].get('summary', 'Review the following items.')

    immediate_actions = []
    winbox = []

    for cluster in clusters:
        if cluster.get('signal_type') == 'achievement':
            winbox.append({
                "name": cluster.get('title'),
                "achievement": cluster.get('summary'),
            })
        
        for action in cluster.get('actions', []):
            immediate_actions.append({
                "title": action,
                "objective": cluster.get('summary'),
                "priority": "medium",
                "messageId": cluster.get('items', [{}])[0].get('id'),
                "stakeholder": "",
                "deadline": ""
            })

    return {
        "missionBrief": {
            "currentStatus": {"primaryIssue": primary_issue},
            "immediateActions": immediate_actions,
            "requiredActions": [],
            "trends": []
        },
        "winbox": winbox
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

def generate_prompt_from_clusters(clusters: List[Dict]) -> str:
    """Generate a sophisticated prompt for the LLM from the clustered email data."""
    # Sort clusters by urgency score to prioritize important topics for the LLM
    clusters.sort(key=lambda c: c.get('metadata', {}).get('scores', {}).get('urgency_score', 0), reverse=True)

    prompt_parts = [
        "You are an expert executive assistant specializing in synthesizing complex communication data into concise, actionable executive briefs. Your goal is to provide cognitive relief and actionable focus to a busy CEO.",
        "Analyze the following project-clustered communication items. For each cluster, provide a 3-sentence narrative summary covering the **Cause**, **Impact/Risk**, and **Required Next Step**. Then, generate a high-level executive summary, identify key action items, highlight achievements, and summarize recurring content.",
        "---",
        "Clustered Communication Data:",
    ]

    for i, cluster in enumerate(clusters):
        prompt_parts.append(f"\n## Project Cluster {i + 1}: {cluster.get('title', 'Untitled Project')}")
        prompt_parts.append(f"Category: {cluster.get('category', 'General')}")
        prompt_parts.append(f"Confidence: {cluster.get('confidence', 0.0):.2f}")
        prompt_parts.append(f"Summary (from clustering): {cluster.get('summary', 'No summary provided by clustering.')}")
        
        # Include entities and action items from clustering for LLM context
        entities = ', '.join([e['entity'] for e in cluster.get('entities', []) if e['entity_type'] == 'person']) or 'N/A'
        prompt_parts.append(f"Key Stakeholders: {entities}")
        
        cluster_actions = [a['description'] for a in cluster.get('action_items', [])]
        if cluster_actions:
            prompt_parts.append(f"Identified Actions: {'; '.join(cluster_actions)}")

        prompt_parts.append("Associated Communication Items (Subject and Sender):")
        for item in cluster.get('items', [])[:5]: # Limit items to avoid excessive prompt length
            sender_info = item.get('sender', 'Unknown')
            subject_info = item.get('subject', 'No Subject')
            prompt_parts.append(f"- Subject: {subject_info} (From: {sender_info})")
        
        # Add raw content for deeper analysis if available and not too long
        # This part needs careful token management in a real LLM integration
        # For now, we'll just indicate its presence or provide a snippet
        if cluster.get('items'):
            first_item_content = cluster['items'][0].get('content', '')
            if len(first_item_content) > 100:
                prompt_parts.append(f"  (Snippet of first item content: {first_item_content[:200]}...)")
            elif first_item_content:
                prompt_parts.append(f"  (First item content: {first_item_content})")

    prompt_parts.append("\n---")
    prompt_parts.append("Based on the above, generate a JSON object with the following structure:")
    prompt_parts.append("{")
    prompt_parts.append("  \"executiveSummary\": \"A 5-sentence narrative highlighting primary blockers, decisions, and net financial impact across top 3 urgent projects.\",")
    prompt_parts.append("  \"keyInsights\": [\"Insight 1\", \"Insight 2\", \"Insight 3\"],")
    prompt_parts.append("  \"actionItems\": [")
    prompt_parts.append("    {")
    prompt_parts.append("      \"type\": \"Decision\" | \"Blocker Resolution\" | \"Follow-up\",")
    prompt_parts.append("      \"description\": \"Specific, actionable task for the executive.\",")
    prompt_parts.append("      \"project\": \"Related Project Title\",")
    prompt_parts.append("      \"urgency\": \"high\" | \"medium\" | \"low\"")
    prompt_parts.append("    }")
    prompt_parts.append("  ],")
    prompt_parts.append("  \"achievements\": [")
    prompt_parts.append("    {")
    prompt_parts.append("      \"title\": \"Achievement Title\",")
    prompt_parts.append("      \"description\": \"Brief description of the achievement.\",")
    prompt_parts.append("      \"project\": \"Related Project Title\"")
    prompt_parts.append("    }")
    prompt_parts.append("  ],")
    prompt_parts.append("  \"recurringContent\": [")
    prompt_parts.append("    {")
    prompt_parts.append("      \"title\": \"Summary of Recurring Newsletters/Updates\",")
    prompt_parts.append("      \"summary\": \"Concise summary of non-actionable, recurring information.\"")
    prompt_parts.append("    }")
    prompt_parts.append("  ],")
    prompt_parts.append("  \"clusters\": [")
    prompt_parts.append("    {")
    prompt_parts.append("      \"cluster_title\": \"Original Cluster Title\",")
    prompt_parts.append("      \"narrative_summary\": \"A 3-sentence summary covering the Cause, Impact/Risk, and Required Next Step for this specific cluster.\"")
    prompt_parts.append("    }")
    prompt_parts.append("  ]")
    prompt_parts.append("}")
    prompt_parts.append("Ensure all summaries are concise and directly relevant to executive decision-making. Prioritize clarity and actionability.")

    return "\n".join(prompt_parts)

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

        # Use LLM override if provided, otherwise use subscription tier logic
        if brief_input.use_llm_override is not None:
            use_llm = brief_input.use_llm_override and GEMINI_API_KEY
            logger.info(f"Using LLM override: {brief_input.use_llm_override}, LLM enabled: {use_llm}")
        else:
            # Use LLM for premium/enterprise users with API key, otherwise use non-LLM
            use_llm = (user_subscription.subscription_tier in ['premium', 'enterprise'] and GEMINI_API_KEY)

        # Perform enhanced clustering
        if process_email_batch_enhanced:
            logger.info(f"Using enhanced clustering for {len(brief_input.emails)} emails")
            clustering_result = process_email_batch_enhanced(brief_input.emails, mode=user_subscription.subscription_tier)
            clusters = clustering_result.get('digest_items', [])
        else:
            logger.warning("Enhanced clustering module not available, using fallback")
            clusters = []

        if use_llm:
            logger.info("Using Gemini LLM for premium user")
            try:
                prompt = generate_prompt_from_clusters(clusters)
                llm_response = await call_gemini(prompt)
                model_name = "gemini-premium-clustered"
                try:
                    # Gemini may return markdown, so we need to strip it
                    cleaned_response = llm_response.strip().replace('''json', '').replace('''', '')
                    llm_content = json.loads(cleaned_response)
                    logger.info(f"Parsed premium content from Gemini")
                    
                    # Initialize content structure
                    content = {
                        "missionBrief": {
                            "currentStatus": {"primaryIssue": llm_content.get("executiveSummary", "No executive summary provided.")},
                            "immediateActions": [],
                            "requiredActions": [],
                            "trends": []
                        },
                        "winbox": [],
                        "keyInsights": llm_content.get("keyInsights", []),
                        "recurringContent": llm_content.get("recurringContent", []),
                        "clusteredBrief": [] # To store clusters with narrative summaries
                    }
                    
                    # Map LLM action items to missionBrief format
                    for action_item in llm_content.get("actionItems", []):
                        content["missionBrief"]["immediateActions"].append({
                            "title": action_item.get("description"),
                            "objective": f"Project: {action_item.get("project", "N/A")}",
                            "priority": action_item.get("urgency", "medium"),
                            "messageId": "", # LLM doesn't provide messageId directly
                            "stakeholder": "",
                            "deadline": ""
                        })

                    # Map LLM achievements to winbox format
                    for achievement in llm_content.get("achievements", []):
                        content["winbox"].append({
                            "name": achievement.get("title"),
                            "achievement": achievement.get("description"),
                            "project": achievement.get("project")
                        })

                    # Map LLM clusters with narrative summaries
                    llm_clusters_map = {lc.get("cluster_title"): lc.get("narrative_summary") for lc in llm_content.get("clusters", [])}
                    for cluster in clusters:
                        narrative_summary = llm_clusters_map.get(cluster.get("title"))
                        content["clusteredBrief"].append({
                            **cluster,
                            "narrative_summary": narrative_summary or cluster.get("summary")
                        })

                    # Add recurring content to trends
                    for rc in llm_content.get("recurringContent", []):
                        content["missionBrief"]["trends"].append(rc.get("summary"))

                except json.JSONDecodeError:
                    logger.error(f"Failed to decode Gemini response as JSON: {llm_response}")
                    raise HTTPException(status_code=500, detail="Failed to generate a valid brief from LLM.")
            except Exception as llm_error:
                logger.warning(f"LLM failed ({str(llm_error)}), falling back to non-LLM brief")
                content = generate_brief_from_clusters(clusters)
                model_name = f"non-llm-fallback-{user_subscription.subscription_tier}"
        else:
            reason = "free tier user" if user_subscription.subscription_tier == 'free' else "GEMINI_API_KEY not found"
            logger.info(f"Using non-LLM brief generation: {reason}")
            content = generate_brief_from_clusters(clusters)
            model_name = f"non-llm-clustered-{user_subscription.subscription_tier}"

        response_data = {
            "missionBrief": content.get("missionBrief", {}),
            "winbox": content.get("winbox", []),
            "keyInsights": content.get("keyInsights", []),
            "recurringContent": content.get("recurringContent", []),
            "clusteredBrief": content.get("clusteredBrief", []),
            "processing_metadata": {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "model": model_name,
                "style": "mission_brief",
                "subscription_tier": user_subscription.subscription_tier,
                "llm_enabled": use_llm,
                "total_emails_processed": len(brief_input.emails)
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

@app.post("/cluster/enhanced")
async def cluster_emails_enhanced(request: Dict[str, Any]):
    """Enhanced clustering endpoint for emails"""
    try:
        if process_email_batch_enhanced is None:
            raise HTTPException(status_code=500, detail="Enhanced clustering module not available")

        emails = request.get('emails', [])
        mode = request.get('mode', 'free')

        if not emails:
            return {"error": "No emails provided"}

        # Process with enhanced clustering
        result = process_email_batch_enhanced(emails, mode)

        return result

    except Exception as e:
        logger.error(f"Error in enhanced clustering: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
