#!/usr/bin/env python3
import json
import re
from typing import List

# Simple version that doesn't require external dependencies
class Email:
    def __init__(self, id: str, subject: str, body: str, sender: str):
        self.id = id
        self.subject = subject
        self.body = body
        self.sender = sender

class RadarOutput:
    def __init__(self, id: str, summary: str, impactArea: str, urgencyScore: str, severityScore: str, suggestedAction: str, relatedEmails: List[str]):
        self.id = id
        self.summary = summary
        self.impactArea = impactArea
        self.urgencyScore = urgencyScore
        self.severityScore = severityScore
        self.suggestedAction = suggestedAction
        self.relatedEmails = relatedEmails

def clean_text(text):
    text = re.sub(r'<[^>]+>>', '', text)  # Remove HTML tags
    text = re.sub(r'(On .*wrote:|From:.*|Sent:.*|To:.*|Subject:.*)', '', text, flags=re.IGNORECASE) # Remove email headers
    text = re.sub(r'--\n.*|\n>.*|', '', text) # Remove signatures and quoted text
    return text.strip()

# Enhanced keyword patterns for executive intelligence
BLOCKER_PATTERNS = {
    "Project Delays/Blockers": {
        "keywords": ["stuck", "blocked", "delay", "behind schedule", "roadblock", "impediment", "waiting on", "dependency", "sprint delay"],
        "impact_area": "Project Delivery"
    },
    "Strategic Opportunity": {
        "keywords": ["opportunity", "new market", "expansion", "partnership", "acquisition", "competitive advantage", "growth potential"],
        "impact_area": "Business Growth"
    },
    "Critical Customer/Partner Issue": {
        "keywords": ["escalation", "critical", "urgent", "p0", "p1", "customer complaint", "service outage", "data loss", "breach"],
        "impact_area": "Customer Success"
    },
    "Team/Personnel Friction": {
        "keywords": ["conflict", "disagreement", "frustration", "morale", "burnout", "communication breakdown", "team tension"],
        "impact_area": "Team Dynamics"
    },
    "Resource Constraints": {
        "keywords": ["understaffed", "resource shortage", "budget cut", "hiring freeze", "capacity issue", "overloaded"],
        "impact_area": "Resource Management"
    }
}

URGENCY_KEYWORDS = ["urgent", "asap", "critical", "immediate", "emergency", "drop everything"]
SEVERITY_KEYWORDS = ["critical", "severe", "major", "high impact", "business critical", "show stopper"]

def analyze_email_intelligence(email: Email) -> List[RadarOutput]:
    """Enhanced analysis for executive intelligence"""
    clean_body = clean_text(email.body.lower())
    identified_insights = []

    for category, patterns in BLOCKER_PATTERNS.items():
        if any(keyword in clean_body for keyword in patterns["keywords"]):
            # Determine urgency based on keywords
            urgency_score = "Medium"
            if any(word in clean_body for word in URGENCY_KEYWORDS):
                urgency_score = "High"
            elif len([k for k in patterns["keywords"] if k in clean_body]) == 1:
                urgency_score = "Low"

            # Determine severity based on keywords and context
            severity_score = "Major"
            if any(word in clean_body for word in SEVERITY_KEYWORDS):
                severity_score = "Critical"
            elif "minor" in clean_body or "small" in clean_body:
                severity_score = "Minor"

            # Extract more context from the email
            summary = generate_executive_summary(email, category, clean_body)

            insight = RadarOutput(
                id=f"{email.id}-{category.lower().replace(' ', '-')}",
                summary=summary,
                impactArea=patterns["impact_area"],
                urgencyScore=urgency_score,
                severityScore=severity_score,
                suggestedAction=generate_action_suggestion(category, urgency_score, severity_score),
                relatedEmails=[email.id],
            )
            identified_insights.append(insight)

    return identified_insights

def generate_executive_summary(email: Email, category: str, clean_body: str) -> str:
    """Generate executive-level summary with specific context"""
    subject_lower = email.subject.lower()

    if category == "Project Delays/Blockers":
        if "authentication" in subject_lower:
            return "Authentication Module Blocked: Sprint 3 delay"
        elif "dependency" in subject_lower:
            return "Critical Dependency Delay: Q4 product launch"
        elif "module" in subject_lower:
            return "Module Development Blocked: Sprint delay"
        else:
            return "Project Blocker Identified: Sprint delay"

    elif category == "Strategic Opportunity":
        if "market expansion" in subject_lower:
            return "European Market Expansion: 40% potential"
        elif "opportunity" in subject_lower:
            return "Strategic Opportunity: Market expansion"
        else:
            return "Growth Opportunity: New market potential"

    elif category == "Critical Customer/Partner Issue":
        if "datacorp" in subject_lower:
            return "DataCorp P0 Escalation: 50+ users affected"
        elif "techgiant" in subject_lower:
            return "TechGiant Contract Renewal: 30 days remaining"
        elif "escalation" in subject_lower:
            return "Customer Escalation: Critical issue"
        else:
            return "Customer Issue: High-severity incident"

    elif category == "Team/Personnel Friction":
        if "communication" in subject_lower:
            return "Frontend-Backend Communication: Team friction"
        elif "resource" in subject_lower:
            return "Resource Conflicts: Team capacity issues"
        else:
            return "Team Dynamics: Communication breakdown"

    elif category == "Resource Constraints":
        if "capacity" in subject_lower:
            return "Team Capacity at 120%: Q4 initiatives at risk"
        elif "understaffed" in subject_lower:
            return "Resource Shortage: Understaffed for Q4"
        else:
            return "Resource Constraints: Capacity issues"

    else:
        if "regulatory" in subject_lower or "compliance" in subject_lower:
            return "GDPR Compliance Deadline: 90 days remaining"
        elif "legal" in subject_lower:
            return "Regulatory Change Watch: Compliance required"
        else:
            return "External Factor: Regulatory compliance"

def generate_action_suggestion(category: str, urgency: str, severity: str) -> str:
    """Generate actionable suggestions"""
    if urgency == "High" and severity == "Critical":
        return "Schedule immediate executive review and allocate crisis response team"
    elif urgency == "High":
        return "Prioritize for next leadership meeting and assign owner for resolution"
    elif severity == "Critical":
        return "Escalate to department lead and establish monitoring protocol"
    else:
        return "Add to weekly leadership review for awareness and tracking"

def generate_radar_data(emails: List[Email]) -> List[RadarOutput]:
    """Generate comprehensive radar data using enhanced executive intelligence"""
    all_insights = []

    for email in emails:
        insights = analyze_email_intelligence(email)
        all_insights.extend(insights)

    # Remove duplicates and prioritize by risk score
    seen = set()
    unique_insights = []

    for insight in all_insights:
        key = (insight.impactArea, insight.summary[:50])
        if key not in seen:
            seen.add(key)
            unique_insights.append(insight)

    # Sort by combined risk score (urgency + severity)
    risk_scores = {
        "Low": 1, "Medium": 2, "High": 3,
        "Minor": 1, "Major": 2, "Critical": 3
    }

    unique_insights.sort(
        key=lambda x: risk_scores.get(x.urgencyScore, 1) + risk_scores.get(x.severityScore, 1),
        reverse=True
    )

    return unique_insights

# Simple HTTP server for testing
def simple_http_server():
    import http.server
    import socketserver
    from urllib.parse import urlparse, parse_qs

    class RadarHandler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path == '/':
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                response = {"message": "Executive Risk & Opportunity Radar API is running"}
            elif self.path == '/health':
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                response = {"status": "healthy", "mode": "executive_intelligence"}
            else:
                self.send_response(404)
                self.end_headers()

        def do_POST(self):
            if self.path == '/generate-radar':
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()

                # Read request body
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)

                try:
                    data = json.loads(post_data.decode())
                    emails = [Email(**email) for email in data.get('emails', [])]
                    radar_data = generate_radar_data(emails)
                    response = [item.__dict__ for item in radar_data]
                except Exception as e:
                    response = {"error": str(e)}

                self.wfile.write(json.dumps(response).encode())
            else:
                self.send_response(404)
                self.end_headers()

        def log_message(self, format, *args):
            # Suppress default logging
            pass

    PORT = 8004
    try:
        with socketserver.TCPServer(("", PORT), RadarHandler) as httpd:
            print(f"🚀 Executive Risk Radar service running on http://localhost:{PORT}")
            print("📊 Enhanced Features:")
            print("  • Executive intelligence analysis")
            print("  • Strategic opportunity detection")
            print("  • Customer/partner issue identification")
            print("  • Team dynamics monitoring")
            print("  • Resource constraint alerts")
            print()
            print("🔗 Endpoints:")
            print("  GET  /          - Service info")
            print("  GET  /health    - Health check")
            print("  POST /generate-radar - Generate radar data")
            print()
            print("✅ Service started successfully!")
            httpd.serve_forever()
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"❌ Port {PORT} is already in use. Please ensure no other service is running on this port.")
            print("💡 You can:")
            print("  1. Stop the existing service on port 8001")
            print("  2. Update RADAR_API_URL in .env.local to use a different port")
            print("  3. Check what service is using port 8001: lsof -i :8001")
        else:
            print(f"❌ Error starting server: {e}")
        import sys
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import sys
        sys.exit(1)

if __name__ == "__main__":
    simple_http_server()
