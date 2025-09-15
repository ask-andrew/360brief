#!/usr/bin/env python3
"""
Enhanced Analytics API with Async Batch Processing and Memory-Efficient Streaming
Integrates the new scalable processing architecture with existing 360Brief functionality
"""

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import uvicorn
import logging
import asyncio
import os
import sys

# Add path for local imports
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))
sys.path.append(os.path.dirname(__file__))

# Import new async processors
from async_processor import ScalableProcessingPipeline, ProcessingConfig, process_executive_data
from streaming_processor import MemoryEfficientProcessor, ExecutiveDataAggregator, StreamingConfig

# Import existing functionality
try:
    from data_processing.services.gmail_service import GmailService
    GMAIL_AVAILABLE = True
except ImportError as e:
    print(f"Gmail service not available: {e}")
    GMAIL_AVAILABLE = False

try:
    from email_intelligence_extractor import EmailIntelligenceExtractor
    EXTRACTOR_AVAILABLE = True
except ImportError as e:
    print(f"Email intelligence extractor not available: {e}")
    EXTRACTOR_AVAILABLE = False

# Import real intelligence processor
try:
    from src.data_processing.real_intelligence_processor import process_real_executive_data
    REAL_INTELLIGENCE_AVAILABLE = True
except ImportError as e:
    print(f"Real intelligence processor not available: {e}")
    REAL_INTELLIGENCE_AVAILABLE = False

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="360Brief Enhanced Analytics API",
    description="Scalable analytics API with async batch processing and memory-efficient streaming",
    version="2.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ProcessingStatus(BaseModel):
    """Status of long-running processing tasks"""
    task_id: str
    status: str  # 'pending', 'processing', 'completed', 'failed'
    progress: float  # 0.0 to 1.0
    total_messages: int
    processed_messages: int
    estimated_completion: Optional[str]
    results: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

# In-memory task tracking (in production, use Redis or database)
processing_tasks: Dict[str, ProcessingStatus] = {}

@app.get("/")
async def root():
    """Root endpoint with enhanced capabilities"""
    return {
        "message": "360Brief Enhanced Analytics API",
        "version": "2.0.0",
        "status": "running",
        "features": [
            "Async batch processing",
            "Memory-efficient streaming",
            "Scalable Gmail integration",
            "Real-time processing status"
        ],
        "endpoints": [
            "/analytics",
            "/analytics/stream",
            "/analytics/batch",
            "/processing/status/{task_id}",
            "/brief/generate",
            "/health"
        ]
    }

@app.get("/analytics/stream")
async def stream_analytics(
    user_id: str = Query(..., description="User ID for authentication"),
    data_sources: List[str] = Query(["gmail"], description="Data sources to process"),
    days_back: int = Query(7, description="Number of days to analyze"),
    chunk_size: int = Query(1000, description="Processing chunk size"),
    memory_limit_mb: int = Query(512, description="Memory limit in MB")
):
    """Stream analytics data using memory-efficient processing"""
    try:
        # Configure streaming processor
        streaming_config = StreamingConfig(
            chunk_size=chunk_size,
            memory_limit_mb=memory_limit_mb,
            cache_ttl_hours=24,
            enable_compression=True
        )

        # Create aggregator
        aggregator = ExecutiveDataAggregator()

        # Process data streams
        filter_params = {
            'user_id': user_id,
            'days_back': days_back,
            'include_threads': True
        }

        logger.info(f"🔄 Starting streaming analytics for user {user_id}")

        # Use async streaming to process data efficiently
        insights = await aggregator.aggregate_insights(
            data_sources=data_sources,
            filter_params=filter_params
        )

        # Enhance insights with processing metadata
        insights['processing_method'] = 'memory_efficient_streaming'
        insights['memory_limit_mb'] = memory_limit_mb
        insights['chunk_size'] = chunk_size
        insights['data_sources'] = data_sources

        logger.info(f"✅ Streaming analytics completed for user {user_id}")
        return insights

    except Exception as e:
        logger.error(f"❌ Streaming analytics failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Streaming processing failed: {str(e)}")

@app.post("/analytics/batch")
async def start_batch_processing(
    background_tasks: BackgroundTasks,
    user_id: str = Query(..., description="User ID for authentication"),
    batch_size: int = Query(100, description="Batch size for processing"),
    max_concurrent: int = Query(3, description="Maximum concurrent batches"),
    timeout_seconds: int = Query(120, description="Processing timeout")
):
    """Start asynchronous batch processing of user data"""
    try:
        # Generate unique task ID
        import uuid
        task_id = str(uuid.uuid4())

        # Initialize task status
        processing_tasks[task_id] = ProcessingStatus(
            task_id=task_id,
            status="pending",
            progress=0.0,
            total_messages=0,
            processed_messages=0,
            estimated_completion=None
        )

        # Start background processing
        background_tasks.add_task(
            process_user_data_batch,
            task_id,
            user_id,
            batch_size,
            max_concurrent,
            timeout_seconds
        )

        logger.info(f"🚀 Started batch processing task {task_id} for user {user_id}")

        return {
            "task_id": task_id,
            "status": "processing",
            "message": "Batch processing started",
            "status_url": f"/processing/status/{task_id}"
        }

    except Exception as e:
        logger.error(f"❌ Failed to start batch processing: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/processing/status/{task_id}")
async def get_processing_status(task_id: str):
    """Get status of a processing task"""
    if task_id not in processing_tasks:
        raise HTTPException(status_code=404, detail="Task not found")

    return processing_tasks[task_id]

@app.post("/brief/generate")
async def generate_enhanced_brief(
    user_id: str = Query(..., description="User ID for authentication"),
    use_streaming: bool = Query(True, description="Use streaming processor for better performance"),
    days_back: int = Query(7, description="Number of days to analyze")
):
    """Generate executive brief using enhanced processing"""
    try:
        logger.info(f"📋 Generating enhanced brief for user {user_id}")

        if use_streaming:
            # Use streaming processor for better memory efficiency
            streaming_config = StreamingConfig(
                chunk_size=500,  # Smaller chunks for brief generation
                memory_limit_mb=256,
                cache_ttl_hours=1,  # Shorter cache for real-time briefs
                enable_compression=True
            )

            processor = MemoryEfficientProcessor(streaming_config)

            # Process Gmail data stream
            brief_insights = {
                'summary': {'total_messages_processed': 0},
                'key_insights': [],
                'action_items': [],
                'priority_communications': [],
                'processing_method': 'streaming'
            }

            filter_params = {
                'user_id': user_id,
                'days_back': days_back,
                'query': 'newer_than:7d -category:promotions'
            }

            async for chunk_data in processor.process_stream('gmail', filter_params):
                # Accumulate insights from each chunk
                brief_insights['summary']['total_messages_processed'] += chunk_data.get('chunk_size', 0)

                # Extract key themes and patterns
                if chunk_data.get('themes'):
                    brief_insights['key_insights'].extend(chunk_data['themes'][:3])

                # Identify priority communications based on senders
                top_senders = chunk_data.get('senders', {})
                for sender, count in list(top_senders.items())[:5]:
                    if count > 2:  # Active correspondents
                        brief_insights['priority_communications'].append({
                            'sender': sender,
                            'message_count': count,
                            'priority': 'high' if count > 5 else 'medium'
                        })

            # Deduplicate and limit insights
            brief_insights['key_insights'] = list(set(brief_insights['key_insights']))[:10]
            brief_insights['generated_at'] = datetime.utcnow().isoformat()

        else:
            # Use traditional batch processor for comprehensive analysis
            config = ProcessingConfig(
                batch_size=50,
                max_concurrent_batches=2,
                max_workers=2,
                timeout_seconds=90
            )

            # Fetch recent emails (simplified for demo)
            sample_emails = await fetch_sample_emails_for_user(user_id, days_back)

            async with ScalableProcessingPipeline(config) as pipeline:
                results = await pipeline.process_multi_channel_data(
                    emails=sample_emails,
                    user_id=user_id
                )

                brief_insights = {
                    'summary': results.get('processing_summary', {}),
                    'key_insights': results.get('unified_insights', {}).get('top_themes', []),
                    'people': results.get('unified_insights', {}).get('top_people', []),
                    'organizations': results.get('unified_insights', {}).get('top_organizations', []),
                    'cross_channel_patterns': results.get('cross_channel_patterns', {}),
                    'processing_method': 'batch_processing',
                    'generated_at': datetime.utcnow().isoformat()
                }

        logger.info(f"✅ Enhanced brief generated for user {user_id}")
        return brief_insights

    except Exception as e:
        logger.error(f"❌ Brief generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Brief generation failed: {str(e)}")

@app.post("/analyze/real")
async def analyze_real_data(emails_data: List[Dict[str, Any]]):
    """Process real email data using the RealExecutiveIntelligenceProcessor"""
    try:
        if not REAL_INTELLIGENCE_AVAILABLE:
            raise HTTPException(status_code=500, detail="Real intelligence processor not available")

        logger.info(f"🧠 Processing {len(emails_data)} real emails for executive intelligence")

        # Process emails using the real intelligence processor
        result = await process_real_executive_data(emails_data)

        logger.info(f"✅ Real intelligence processing completed")
        return result

    except Exception as e:
        logger.error(f"❌ Real intelligence processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Real data analysis failed: {str(e)}")

async def process_user_data_batch(
    task_id: str,
    user_id: str,
    batch_size: int,
    max_concurrent: int,
    timeout_seconds: int
):
    """Background task for batch processing user data"""
    try:
        # Update task status
        processing_tasks[task_id].status = "processing"
        processing_tasks[task_id].estimated_completion = (
            datetime.utcnow() + timedelta(seconds=timeout_seconds)
        ).isoformat()

        # Configure processing pipeline
        config = ProcessingConfig(
            batch_size=batch_size,
            max_concurrent_batches=max_concurrent,
            max_workers=2,
            timeout_seconds=timeout_seconds
        )

        # Fetch user emails
        emails = await fetch_sample_emails_for_user(user_id, days_back=14)
        processing_tasks[task_id].total_messages = len(emails)

        # Process data using scalable pipeline
        async with ScalableProcessingPipeline(config) as pipeline:
            results = await pipeline.process_multi_channel_data(
                emails=emails,
                user_id=user_id
            )

            # Update final results
            processing_tasks[task_id].status = "completed"
            processing_tasks[task_id].progress = 1.0
            processing_tasks[task_id].processed_messages = len(emails)
            processing_tasks[task_id].results = results

        logger.info(f"✅ Batch processing completed for task {task_id}")

    except Exception as e:
        logger.error(f"❌ Batch processing failed for task {task_id}: {str(e)}")
        processing_tasks[task_id].status = "failed"
        processing_tasks[task_id].error = str(e)

async def fetch_sample_emails_for_user(user_id: str, days_back: int = 7) -> List[Dict[str, Any]]:
    """Fetch sample emails for processing (placeholder for real Gmail integration)"""
    # In production, this would fetch real emails from Gmail API using user tokens
    # For now, return sample data that matches the expected format

    sample_emails = []
    current_time = datetime.utcnow()

    for i in range(50):  # Generate 50 sample emails
        email_time = current_time - timedelta(hours=i * 2)

        sample_emails.append({
            'id': f'email_{user_id}_{i}',
            'subject': f'Important Project Update #{i + 1}',
            'body': f'This is the body content for email {i + 1}. It contains important project information and action items that need to be processed for executive briefing.',
            'from': f'colleague{i % 5}@company.com',
            'to': [f'{user_id}@company.com'],
            'date': email_time.isoformat(),
            'labels': ['INBOX'] if i % 3 == 0 else ['INBOX', 'IMPORTANT'],
            'isRead': i % 4 != 0
        })

    return sample_emails

@app.get("/health")
async def enhanced_health_check():
    """Enhanced health check with processing capabilities"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "enhanced-analytics-api",
        "version": "2.0.0",
        "features": {
            "gmail_integration": GMAIL_AVAILABLE,
            "intelligence_extraction": EXTRACTOR_AVAILABLE,
            "async_processing": True,
            "streaming_processing": True,
            "memory_efficient": True
        },
        "active_tasks": len(processing_tasks),
        "memory_usage": "monitoring_enabled"
    }

# Legacy compatibility endpoint
@app.get("/analytics")
async def get_analytics_legacy(
    use_real_data: bool = Query(False, description="Use real Gmail data"),
    days_back: int = Query(7, description="Number of days to analyze"),
    user_id: str = Query(None, description="User ID for authentication")
):
    """Legacy analytics endpoint with enhanced processing"""
    if use_real_data and user_id:
        # Use streaming processor for real data
        return await stream_analytics(
            user_id=user_id,
            data_sources=["gmail"],
            days_back=days_back
        )
    else:
        # Return sample data for compatibility
        from simple_analytics_api import get_sample_analytics
        return get_sample_analytics()

if __name__ == "__main__":
    print("🚀 Starting 360Brief Enhanced Analytics API...")
    print("📊 API will be available at http://localhost:8000")
    print("📝 API docs at http://localhost:8000/docs")
    print("✨ Features: Async processing, Memory-efficient streaming, Scalable Gmail integration")

    uvicorn.run(
        "enhanced_analytics_api:app",
        host="0.0.0.0",
        port=8000,  # Standard port for analytics API
        reload=True,
        log_level="info"
    )