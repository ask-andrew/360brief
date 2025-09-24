# Simplified clustering service for 360Brief
# Run with: python3 clustering_service.py

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src', 'data_processing'))

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import json
import time
from datetime import datetime
from real_clustering_logic import RealClusteringReplacer

# Import our clustering engine
try:
    from enhanced_clustering_engine import EnhancedClusteringEngine, EmailItem, TieredIntelligenceEngineEnhancement
    ENGINE_AVAILABLE = True
    print("✅ Clustering engine imported successfully")
except ImportError as e:
    ENGINE_AVAILABLE = False
    print(f"⚠️ Clustering engine not available: {e}")

app = FastAPI(title="360Brief Clustering Service", version="1.0.0")

# Pydantic models
class EmailItemAPI(BaseModel):
    id: str
    subject: str
    body: str
    from_sender: str = Field("", alias="from")  # Use alias for reserved keyword
    to: List[str] = []
    date: str
    thread_id: Optional[str] = None
    labels: Optional[List[str]] = []
    has_attachments: bool = False
    metadata: Optional[Dict] = {}

class ClusteringRequest(BaseModel):
    user_id: str
    digest_id: str
    emails: List[EmailItemAPI]
    user_tier: str = "free"

class ClusteringResponse(BaseModel):
    success: bool
    clusters: List[Dict] = []
    unclustered_emails: List[str] = []
    metrics: Dict = {}
    upgrade_suggestions: List[str] = []
    processing_time_ms: int = 0

# Mock clustering for testing when engine not available
def mock_clustering(emails: List[EmailItemAPI], user_tier: str) -> ClusteringResponse:
    """Provide mock clustering results when engine is not available"""

    clusters = []
    unclustered_ids = []

    if len(emails) >= 2:
        # Create a simple mock cluster
        cluster_emails = emails[:min(3, len(emails))]
        clusters.append({
            'cluster_id': 'mock_cluster_vendor',
            'topic_name': 'Business Communications',
            'topic_category': 'general',
            'description': 'General business correspondence',
            'email_ids': [email.id for email in cluster_emails],
            'email_count': len(cluster_emails),
            'confidence_score': 0.75,
            'key_entities': {'companies': ['Mock Corp'], 'projects': ['Mock Project']},
            'priority_score': 3.0,
            'upgrade_hint': 'AI could provide deeper insights' if user_tier == 'free' else None
        })

        # Remaining emails are unclustered
        unclustered_ids = [email.id for email in emails[len(cluster_emails):]]
    else:
        unclustered_ids = [email.id for email in emails]

    return ClusteringResponse(
        success=True,
        clusters=clusters,
        unclustered_emails=unclustered_ids,
        metrics={
            'total_messages': len(emails),
            'clusters_found': len(clusters),
            'messages_clustered': sum(cluster['email_count'] for cluster in clusters),
            'clustering_rate': len(clusters) / len(emails) if emails else 0,
            'time_saved_minutes': len(clusters) * 0.5,
            'avg_confidence': 0.75,
            'largest_cluster_size': max([cluster['email_count'] for cluster in clusters], default=0)
        },
        upgrade_suggestions=[
            'Get AI-powered semantic clustering',
            'Unlock automatic action item extraction'
        ] if user_tier == 'free' else [],
        processing_time_ms=50
    )

@app.get("/")
async def root():
    return {
        "service": "360Brief Enhanced Clustering",
        "status": "healthy",
        "engine_available": ENGINE_AVAILABLE,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "360Brief Enhanced Clustering",
        "engine_available": ENGINE_AVAILABLE,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/api/clustering/process", response_model=ClusteringResponse)
async def process_clustering(request: ClusteringRequest):
    """Main clustering endpoint"""
    try:
        start_time = time.time()

        if not ENGINE_AVAILABLE:
            print("⚠️ Using mock clustering (engine not available)")
            return mock_clustering(request.emails, request.user_tier)

        # Convert API models to internal models
        email_items = []
        for email_api in request.emails:
            try:
                email_item = EmailItem(
                    id=email_api.id,
                    subject=email_api.subject,
                    body=email_api.body,
                    from_address=email_api.from_address or "",
                    to=email_api.to or [],
                    date=datetime.fromisoformat(email_api.date.replace('Z', '+00:00')),
                    thread_id=email_api.thread_id,
                    labels=email_api.labels or [],
                    has_attachments=email_api.has_attachments,
                    metadata=email_api.metadata or {}
                )
                email_items.append(email_item)
            except Exception as e:
                print(f"⚠️ Error converting email {email_api.id}: {e}")
                # Skip problematic emails
                continue

        if not email_items:
            return ClusteringResponse(
                success=False,
                clusters=[],
                unclustered_emails=[],
                metrics={},
                upgrade_suggestions=[],
                processing_time_ms=int((time.time() - start_time) * 1000)
            )

        # Initialize clustering engine
        clustering_engine = EnhancedClusteringEngine(
            user_tier=request.user_tier,
            user_preferences={}
        )

        # Process clustering
        result = clustering_engine.process_email_batch(email_items)

        return ClusteringResponse(
            success=True,
            clusters=result.clusters,
            unclustered_emails=[email.id for email in result.unclustered_emails],
            metrics=result.metrics,
            upgrade_suggestions=result.upgrade_suggestions,
            processing_time_ms=result.processing_time_ms
        )

    except Exception as e:
        print(f"❌ Clustering error: {e}")
        return ClusteringResponse(
            success=False,
            clusters=[],
            unclustered_emails=[email.id for email in request.emails],
            metrics={},
            upgrade_suggestions=[],
            processing_time_ms=0
        )

@app.post("/api/clustering/integrate")
async def integrate_clustering(request: ClusteringRequest):
    """Integration endpoint for existing digest flow"""
    replacer = RealClusteringReplacer()
    # Use by_alias=True to ensure the 'from' field is correctly named in the dictionary
    emails_as_dicts = [email.dict(by_alias=True) for email in request.emails]
    result = replacer.replace_mock_data_generation(emails_as_dicts)
    return result

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting 360Brief Clustering Service...")
    print(f"📊 Engine Available: {ENGINE_AVAILABLE}")
    uvicorn.run(app, host="0.0.0.0", port=8003)