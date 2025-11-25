#!/usr/bin/env python3
"""
FastAPI server for Collaboration Insights
"""

from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from googleapiclient.discovery import build

# Import from our new modules
from clustering import analyze_collaboration_network
from visualization import generate_visualization_data
from recommendations import generate_collaboration_recommendation

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

app = FastAPI(title="Collaboration Insights API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CollaborationInsightsRequest(BaseModel):
    time_span: str = "Last 90 Days"
    user_email: str

@app.on_event("startup")
async def startup_event():
    """Load NLP model on startup"""
    app.state.nlp_model = load_spacy_model()
    if app.state.nlp_model:
        logging.info("spaCy NLP model loaded.")
    else:
        logging.error("Failed to load spaCy NLP model.")

def get_time_window(time_span: str) -> int:
    if "30" in time_span:
        return 30
    if "90" in time_span:
        return 90
    if "6" in time_span:
        return 180
    if "12" in time_span:
        return 365
    return 90 # Default

@app.post("/api/collaboration-insights")
async def get_collaboration_insights(request: CollaborationInsightsRequest):
    """Main endpoint to get collaboration insights"""
    logging.info(f"Received request for collaboration insights with time span: {request.time_span}")

    try:
        if request.mock_mode:
            return {
                "time_span": request.time_span,
                "email_count": 1247,
                "calendar_event_count": 23,
                "top_contacts": [
                    {"name": "Alice Johnson", "count": 45},
                    {"name": "Bob Smith", "count": 32},
                    {"name": "Carol Davis", "count": 28},
                    {"name": "David Wilson", "count": 19},
                    {"name": "Eve Brown", "count": 15}
                ],
                "average_response_times": {
                    "alice@company.com": "2 hours",
                    "bob@company.com": "1.5 hours",
                    "carol@company.com": "3 hours"
                },
                "key_organizations": {
                    "Tech Corp": 15,
                    "Design Studio": 8,
                    "Marketing Inc": 12
                },
                "emails_awaiting_response": [
                    {
                        "subject": "Q4 Budget Review",
                        "sender": "finance@company.com",
                        "date": "2025-01-15 14:30"
                    },
                    {
                        "subject": "Project Timeline Update",
                        "sender": "pm@company.com",
                        "date": "2025-01-15 11:15"
                    }
                ],
                # New mock data for project clustering
                "projects": [
                    {
                        "id": 1,
                        "name": "Q4 Product Launch",
                        "interaction_count": 45,
                        "participant_count": 8,
                        "start_date": "2024-10-01T00:00:00",
                        "end_date": "2024-12-31T23:59:59",
                        "is_active": True,
                        "top_keywords": ["product", "launch", "marketing", "timeline", "budget"],
                        "participants": ["alice@company.com", "bob@company.com", "carol@company.com", "david@company.com"]
                    },
                    {
                        "id": 2,
                        "name": "Website Redesign",
                        "interaction_count": 32,
                        "participant_count": 6,
                        "start_date": "2024-11-15T00:00:00",
                        "end_date": "2025-01-15T23:59:59",
                        "is_active": True,
                        "top_keywords": ["design", "website", "ui", "ux", "development"],
                        "participants": ["eve@company.com", "bob@company.com", "finance@company.com"]
                    },
                    {
                        "id": 3,
                        "name": "Client Presentation Prep",
                        "interaction_count": 18,
                        "participant_count": 4,
                        "start_date": "2024-12-01T00:00:00",
                        "end_date": "2024-12-20T23:59:59",
                        "is_active": False,
                        "top_keywords": ["client", "presentation", "slides", "feedback", "review"],
                        "participants": ["alice@company.com", "carol@company.com"]
                    }
                ],
                "network_metrics": {
                    "total_unique_participants": 12,
                    "average_project_participation": 3.2,
                    "max_project_participation": 6,
                    "project_distribution": {1: 2, 2: 3, 3: 1, 4: 1}
                },
                # Mock recommendation
                "recommendation": {
                    "recommendation": "Your collaboration network shows strong cross-functional connections, particularly in product development. Consider leveraging this strength by initiating a knowledge-sharing session with your design and marketing teams. This could help streamline future product launches and build even stronger inter-departmental relationships.",
                    "confidence": "high",
                    "generated_at": "2025-01-15T10:30:00",
                    "model_used": "gpt-4",
                    "context_summary": {
                        "projects": 3,
                        "active_projects": 2,
                        "participants": 12,
                        "time_span": request.time_span
                    }
                },
                # Mock visualizations
                "visualizations": {
                    "chord_diagram": {
                        "participants": ["alice@company.com", "bob@company.com", "carol@company.com", "david@company.com", "eve@company.com"],
                        "projects": ["Q4 Product Launch", "Website Redesign", "Client Presentation Prep"],
                        "matrix": [[1, 1, 1], [1, 1, 0], [1, 0, 1], [1, 0, 0], [0, 1, 0]]
                    },
                    "force_directed": {
                        "network_stats": {
                            "nodes": 15,
                            "edges": 23,
                            "projects": 3,
                            "participants": 12,
                            "internal_participants": 8,
                            "external_participants": 4
                        }
                    }
                }
            }

        days_back = get_time_window(request.time_span)
        end_time = datetime.datetime.now(datetime.timezone.utc)
        start_time = end_time - datetime.timedelta(days=days_back)

        # Authenticate and build services
        creds = authenticate_gmail(request.user_email)
        if not creds:
            raise HTTPException(status_code=401, detail="Failed to authenticate with Gmail. Please ensure you have connected your Google account.")

        gmail_service = build("gmail", "v1", credentials=creds)
        calendar_service = build("calendar", "v3", credentials=creds)

        # Fetch data
        messages = await fetch_recent_messages(gmail_service, days=days_back)
        calendar_events = await fetch_and_process_calendar_events(calendar_service, time_min=start_time, time_max=end_time)

        email_details = []
        for m in messages:
            body = await get_message_body(gmail_service, m['id'])
            if body:
                full_msg = gmail_service.users().messages().get(userId='me', id=m['id'], format='full').execute()
                headers = full_msg.get('payload', {}).get('headers', [])

                subject = next((h['value'] for h in headers if h['name'] == 'Subject'), 'No Subject')
                from_header = next((h['value'] for h in headers if h['name'] == 'From'), 'Unknown Sender')
                to_header = next((h['value'] for h in headers if h['name'] == 'To'), '')
                cc_header = next((h['value'] for h in headers if h['name'] == 'Cc'), '')
                date_header = next((h['value'] for h in headers if h['name'] == 'Date'), '')

                sender_name_match = re.match(r'^(.*?)\s*<([^>]+)>', from_header)
                sender_name = sender_name_match.group(1).strip() if sender_name_match else from_header
                sender_email = sender_name_match.group(2) if sender_name_match else from_header

                email_details.append({
                    'id': m['id'],
                    'threadId': m['threadId'],
                    'subject': subject,
                    'from_name': sender_name,
                    'from_email': sender_email,
                    'to_recipients': [re.sub(r'.*<([^>]+)>.*', r'\1', r).strip() for r in to_header.split(',')] if to_header else [],
                    'cc_recipients': [re.sub(r'.*<([^>]+)>.*', r'\1', r).strip() for r in cc_header.split(',')] if cc_header else [],
                    'date': date_header,
                    'body': body
                })

        # Process email data for clustering
        email_data_for_clustering = []
        for email in email_details:
            # Convert email details to format expected by clustering
            email_for_clustering = {
                'id': email['id'],
                'from_email': email['from_email'],
                'to_recipients': email['to_recipients'],
                'cc_recipients': email['cc_recipients'],
                'subject': email['subject'],
                'body': email['body'],
                'timestamp': email.get('timestamp')
            }
            if email.get('date'):
                try:
                    email_for_clustering['timestamp'] = datetime.datetime.fromisoformat(email['date'].replace('Z', '+00:00'))
                except:
                    pass
            email_data_for_clustering.append(email_for_clustering)

        # Process calendar data for clustering
        calendar_data_for_clustering = []
        for event in calendar_events:
            calendar_for_clustering = {
                'id': event['id'],
                'organizer_email': event['organizer_email'],
                'attendees': event['attendees'],
                'summary': event['summary'],
                'description': event['description'],
                'start_time': event['start_time'],
                'end_time': event['end_time']
            }
            if event.get('start_time'):
                try:
                    calendar_for_clustering['timestamp'] = datetime.datetime.fromisoformat(event['start_time'].replace('Z', '+00:00'))
                except:
                    pass
            calendar_data_for_clustering.append(calendar_for_clustering)

        # Generate project clusters
        try:
            network_analysis = analyze_collaboration_network(email_data_for_clustering, calendar_data_for_clustering, app.state.nlp_model)

            # Generate visualizations
            visualizations = generate_visualization_data(network_analysis['projects'], request.user_email)

            # Generate recommendation
            recommendation = generate_collaboration_recommendation(
                network_analysis['network_metrics'],
                network_analysis['projects'],
                request.user_email,
                request.time_span
            )

        except Exception as e:
            logging.warning(f"Advanced analytics failed, falling back to basic analysis: {e}")
            # Fallback to basic analysis if clustering fails
            network_analysis = {
                'total_projects': 0,
                'active_projects': 0,
                'total_interactions': len(email_details) + len(calendar_events),
                'projects': [],
                'network_metrics': {
                    'total_unique_participants': len(set([c['name'] for c in top_contacts])),
                    'average_project_participation': 0,
                    'max_project_participation': 0,
                    'project_distribution': {}
                }
            }
            visualizations = {}
            recommendation = {
                'recommendation': 'Continue building your collaboration network by engaging with new team members on upcoming projects.',
                'confidence': 'low',
                'generated_at': datetime.datetime.now().isoformat(),
                'model_used': 'fallback'
            }

        # Analyze basic email interactions for backward compatibility
        top_contacts, avg_response, key_orgs, _, _, emails_awaiting_response = \
            analyze_email_interactions(email_details, request.user_email, app.state.nlp_model)

        return {
            "time_span": request.time_span,
            "email_count": len(email_details),
            "calendar_event_count": len(calendar_events),
            "top_contacts": top_contacts,
            "average_response_times": avg_response,
            "key_organizations": key_orgs,
            "emails_awaiting_response": emails_awaiting_response,
            # Enhanced analytics
            "projects": network_analysis['projects'],
            "network_metrics": network_analysis['network_metrics'],
            "recommendation": recommendation,
            "visualizations": visualizations
        }

    except Exception as e:
        logging.error(f"Error processing collaboration insights: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/debug/supabase")
async def debug_supabase():
    """Debug endpoint to test Supabase connection"""
    try:
        import requests
        from google_services import get_user_tokens_from_supabase

        # Test basic Supabase connection
        response = requests.get(
            f"{os.getenv('NEXT_PUBLIC_SUPABASE_URL')}/rest/v1/profiles?select=id,email&limit=1",
            headers={
                'Authorization': f"Bearer {os.getenv('SUPABASE_SERVICE_ROLE_KEY')}",
                'Content-Type': 'application/json',
                'apikey': os.getenv('SUPABASE_SERVICE_ROLE_KEY')
            }
        )

        if response.ok:
            users = response.json()
            return {
                "supabase_connected": True,
                "user_count": len(users),
                "sample_users": users[:3] if users else [],
                "env_vars": {
                    "SUPABASE_URL": bool(os.getenv('NEXT_PUBLIC_SUPABASE_URL')),
                    "SERVICE_KEY": bool(os.getenv('SUPABASE_SERVICE_ROLE_KEY')),
                    "GOOGLE_CLIENT_ID": bool(os.getenv('GOOGLE_CLIENT_ID')),
                    "GOOGLE_CLIENT_SECRET": bool(os.getenv('GOOGLE_CLIENT_SECRET'))
                }
            }
        else:
            return {
                "supabase_connected": False,
                "error": response.text,
                "status_code": response.status_code
            }
    except Exception as e:
        return {"error": str(e)}

@app.get("/debug/tokens/{user_email}")
async def debug_user_tokens(user_email: str):
    """Debug endpoint to test token retrieval for a specific user"""
    try:
        from google_services import get_user_tokens_from_supabase

        result = get_user_tokens_from_supabase(user_email)
        return {
            "user_email": user_email,
            "tokens_found": result is not None,
            "result": result
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
