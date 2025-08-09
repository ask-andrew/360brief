"""FastAPI application for the data processing service."""

from datetime import datetime
from typing import List, Optional, Dict, Any
import uuid

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .models import EmailMessage, ProcessedMessage, CalendarEvent
# Optional heavy imports; allow app to boot without them for lightweight endpoints
try:
    from .orchestrator import ProcessingOrchestrator
    from .services import EmailService
except Exception:  # pragma: no cover - boot resilience
    ProcessingOrchestrator = None  # type: ignore
    EmailService = None  # type: ignore

app = FastAPI(
    title="360Brief Data Processing API",
    description="API for processing communication data into executive briefings",
    version="0.1.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services if available
orchestrator = ProcessingOrchestrator() if ProcessingOrchestrator else None  # type: ignore
email_service = EmailService() if EmailService else None  # type: ignore

# Request/Response Models
class ProcessEmailsRequest(BaseModel):
    """Request model for processing emails."""
    emails: List[Dict[str, Any]]

class GenerateDigestRequest(BaseModel):
    """Request model for generating a digest."""
    user_email: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    send_email: bool = False
    recipient_email: Optional[str] = None

class DigestResponse(BaseModel):
    """Response model for digest generation."""
    digest_id: str
    status: str
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None

# In-memory store for digests (in production, use a database)
_digest_store = {}


# Endpoints
@app.post("/process/emails", response_model=List[ProcessedMessage])
async def process_emails(request: ProcessEmailsRequest):
    """Process a batch of emails.
    
    Args:
        request: The request containing the list of emails to process.
        
    Returns:
        List of processed email messages.
        
    Raises:
        HTTPException: If there's an error processing the emails.
    """
    if orchestrator is None:
        raise HTTPException(status_code=503, detail="ProcessingOrchestrator unavailable")
    try:
        return await orchestrator.process_emails(request.emails)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

@app.post("/digests/generate", response_model=DigestResponse)
async def generate_digest(
    request: GenerateDigestRequest,
    background_tasks: BackgroundTasks
):
    """Generate an executive digest for the specified date range.
    
    This endpoint starts an async task to generate the digest and returns immediately
    with a task ID that can be used to check the status.
    
    Args:
        request: The digest generation request parameters.
        background_tasks: FastAPI background tasks manager.
        
    Returns:
        DigestResponse containing the digest ID and status.
        
    Raises:
        HTTPException: If there's an error starting the digest generation.
    """
    if orchestrator is None:
        raise HTTPException(status_code=503, detail="ProcessingOrchestrator unavailable")
    try:
        digest_id = str(uuid.uuid4())
        
        # Store initial status
        _digest_store[digest_id] = {
            'status': 'pending',
            'started_at': datetime.utcnow(),
            'request': request.dict()
        }
        
        # Start background task
        background_tasks.add_task(
            _generate_digest_background,
            digest_id=digest_id,
            request=request
        )
        
        return DigestResponse(
            digest_id=digest_id,
            status='pending',
            message='Digest generation started',
            data={'poll_url': f"/digests/status/{digest_id}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/digests/status/{digest_id}", response_model=DigestResponse)
async def get_digest_status(digest_id: str):
    """Get the status of a digest generation task.
    
    Args:
        digest_id: The ID of the digest to check status for.
        
    Returns:
        DigestResponse with the current status and any available data.
        
    Raises:
        HTTPException: If the digest ID is not found.
    """
    if digest_id not in _digest_store:
        raise HTTPException(status_code=404, detail="Digest not found")
    
    digest = _digest_store[digest_id]
    return DigestResponse(
        digest_id=digest_id,
        status=digest['status'],
        message=digest.get('message'),
        data=digest.get('data')
    )

@app.get("/health")
async def health_check():
    """Health check endpoint.
    
    Returns:
        Dictionary with service health status and version information.
    """
    return {
        "status": "healthy",
        "version": "0.1.0",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/unified")
async def get_unified(
    start: Optional[str] = Query(None, description="ISO8601 start datetime"),
    end: Optional[str] = Query(None, description="ISO8601 end datetime"),
):
    """Return unified data for emails, incidents, calendar events, and tickets.

    This is a stub implementation that returns empty arrays in the correct shape.
    Wire this to your real data aggregation (Gmail/Calendar/PM tools) to populate results.
    """
    # TODO: Parse and use start/end to bound data collection
    _ = start
    _ = end

    return {
        "emails": [],
        "incidents": [],
        "calendarEvents": [],
        "tickets": [],
        "generated_at": datetime.utcnow().isoformat(),
    }

async def _generate_digest_background(digest_id: str, request: GenerateDigestRequest):
    """Background task to generate a digest.
    
    Args:
        digest_id: The ID of the digest being generated.
        request: The digest generation request parameters.
    """
    try:
        # Update status to processing
        _digest_store[digest_id]['status'] = 'processing'
        _digest_store[digest_id]['started_at'] = datetime.utcnow()
        
        # Generate the digest
        digest = await orchestrator.generate_digest(
            user_email=request.user_email,
            start_date=request.start_date,
            end_date=request.end_date
        )
        
        # Store the result
        _digest_store[digest_id].update({
            'status': 'completed',
            'completed_at': datetime.utcnow(),
            'data': digest
        })
        
        # Send email if requested
        if request.send_email and request.recipient_email:
            try:
                await email_service.send_digest(
                    to_email=request.recipient_email,
                    digest_data=digest
                )
                _digest_store[digest_id]['message'] = 'Digest generated and sent successfully'
            except Exception as e:
                _digest_store[digest_id].update({
                    'status': 'completed_with_errors',
                    'message': f'Digest generated but email failed: {str(e)}',
                    'error': str(e)
                })
        else:
            _digest_store[digest_id]['message'] = 'Digest generated successfully'
            
    except Exception as e:
        _digest_store[digest_id].update({
            'status': 'failed',
            'completed_at': datetime.utcnow(),
            'message': f'Failed to generate digest: {str(e)}',
            'error': str(e)
        })
