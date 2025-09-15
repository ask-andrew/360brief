# services/data_processing/streaming_processor.py
import asyncio
import json
from typing import AsyncGenerator, Dict, Any, List, Optional
from dataclasses import dataclass
import logging
from datetime import datetime, timedelta
from collections import Counter

@dataclass
class StreamingConfig:
    """Configuration for streaming processor"""
    chunk_size: int = 1000  # Process 1000 messages at a time
    memory_limit_mb: int = 512  # Memory limit for processing
    cache_ttl_hours: int = 24  # Cache time-to-live
    enable_compression: bool = True

class MemoryEfficientProcessor:
    """Streaming processor that handles large datasets without memory overflow"""

    def __init__(self, config: StreamingConfig = None):
        self.config = config or StreamingConfig()
        self.processing_cache = {}
        self.metrics = {
            'processed_items': 0,
            'cache_hits': 0,
            'memory_usage_mb': 0
        }

    async def process_stream(
        self,
        data_source: str,
        filter_params: Dict[str, Any]
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Process data in streaming fashion to handle massive datasets
        """
        async for chunk in self._fetch_data_chunks(data_source, filter_params):
            # Process chunk while previous chunk is being yielded
            processed_chunk = await self._process_chunk_efficiently(chunk)

            # Yield immediately to prevent memory buildup
            yield processed_chunk

            # Memory management
            await self._manage_memory()

    async def _fetch_data_chunks(
        self,
        source: str,
        params: Dict[str, Any]
    ) -> AsyncGenerator[List[Dict], None]:
        """
        Fetch data in chunks from various sources (Gmail, Slack, etc.)
        """
        if source == 'gmail':
            async for chunk in self._fetch_gmail_chunks(params):
                yield chunk
        elif source == 'slack':
            async for chunk in self._fetch_slack_chunks(params):
                yield chunk
        elif source == 'calendar':
            async for chunk in self._fetch_calendar_chunks(params):
                yield chunk

    async def _fetch_gmail_chunks(self, params: Dict) -> AsyncGenerator[List[Dict], None]:
        """Fetch Gmail data in chunks using pagination"""
        page_token = None

        while True:
            # Simulate Gmail API call with pagination
            chunk_data = await self._gmail_api_call(
                params.get('user_id'),
                params.get('query', ''),
                page_token=page_token,
                max_results=self.config.chunk_size
            )

            if not chunk_data.get('messages'):
                break

            yield chunk_data['messages']

            page_token = chunk_data.get('nextPageToken')
            if not page_token:
                break

    async def _gmail_api_call(
        self,
        user_id: str,
        query: str,
        page_token: Optional[str] = None,
        max_results: int = 1000
    ) -> Dict[str, Any]:
        """Efficient Gmail API call with caching"""

        # Cache key for this specific query
        cache_key = f"gmail:{user_id}:{hash(query)}:{page_token}"

        # Check cache first
        if cache_key in self.processing_cache:
            self.metrics['cache_hits'] += 1
            return self.processing_cache[cache_key]

        # Simulate actual Gmail API call
        # In real implementation, this would use Gmail API
        await asyncio.sleep(0.1)  # Simulate API latency

        # Mock response for demonstration
        mock_response = {
            'messages': [
                {
                    'id': f'msg_{i}',
                    'threadId': f'thread_{i//3}',
                    'subject': f'Subject {i}',
                    'body': f'Body content {i}' * 100,  # Simulate large content
                    'from': f'sender{i}@example.com',
                    'date': datetime.now().isoformat()
                }
                for i in range(min(max_results, 50))  # Simulate chunk
            ],
            'nextPageToken': f'token_{page_token or 0}_next' if max_results > 50 else None
        }

        # Cache with TTL
        self.processing_cache[cache_key] = mock_response

        return mock_response

    async def _process_chunk_efficiently(self, chunk: List[Dict]) -> Dict[str, Any]:
        """Process a chunk with optimized algorithms"""

        # Quick metrics calculation (O(n) operations only)
        chunk_insights = {
            'chunk_size': len(chunk),
            'processing_time': datetime.utcnow().isoformat(),
            'senders': {},
            'themes': [],
            'date_range': self._calculate_date_range(chunk)
        }

        # Efficient single-pass processing
        text_accumulator = []
        sender_counts = {}

        for item in chunk:
            # Count senders efficiently
            sender = item.get('from', 'unknown')
            sender_counts[sender] = sender_counts.get(sender, 0) + 1

            # Accumulate text for batch theme extraction
            content = f"{item.get('subject', '')} {item.get('body', '')}"
            if len(content) > 100:  # Only include substantial content
                text_accumulator.append(content[:500])  # Limit per message

        # Batch process themes (more efficient than individual processing)
        if text_accumulator:
            chunk_insights['themes'] = await self._extract_themes_fast(
                " ".join(text_accumulator)
            )

        chunk_insights['senders'] = dict(
            sorted(sender_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        )

        self.metrics['processed_items'] += len(chunk)
        return chunk_insights

    async def _extract_themes_fast(self, text: str) -> List[str]:
        """Fast theme extraction optimized for large text"""
        import re
        from collections import Counter

        # Use regex for speed instead of heavy NLP
        words = re.findall(r'\b[A-Za-z]{4,}\b', text.lower())

        # Filter stopwords quickly
        stopwords = {
            'that', 'this', 'with', 'from', 'they', 'have', 'will',
            'been', 'were', 'your', 'email', 'message', 'please'
        }

        filtered_words = [w for w in words if w not in stopwords]

        # Get top themes
        theme_counts = Counter(filtered_words)
        return [theme for theme, count in theme_counts.most_common(10) if count > 2]

    def _calculate_date_range(self, chunk: List[Dict]) -> Dict[str, str]:
        """Calculate date range for chunk"""
        dates = []
        for item in chunk:
            date_str = item.get('date')
            if date_str:
                try:
                    dates.append(datetime.fromisoformat(date_str.replace('Z', '+00:00')))
                except:
                    continue

        if dates:
            return {
                'start': min(dates).isoformat(),
                'end': max(dates).isoformat()
            }
        return {'start': None, 'end': None}

    async def _manage_memory(self):
        """Aggressive memory management"""
        import gc
        import psutil
        import os

        # Get current memory usage
        process = psutil.Process(os.getpid())
        memory_mb = process.memory_info().rss / 1024 / 1024

        self.metrics['memory_usage_mb'] = memory_mb

        # Clear cache if memory usage is high
        if memory_mb > self.config.memory_limit_mb:
            logging.warning(f"Memory usage {memory_mb:.1f}MB exceeds limit, clearing cache")
            self.processing_cache.clear()
            gc.collect()

    async def _fetch_slack_chunks(self, params: Dict) -> AsyncGenerator[List[Dict], None]:
        """Fetch Slack data efficiently"""
        # Implementation for Slack API chunking
        # Similar pattern to Gmail but with Slack-specific pagination
        yield []  # Placeholder

    async def _fetch_calendar_chunks(self, params: Dict) -> AsyncGenerator[List[Dict], None]:
        """Fetch Calendar data efficiently"""
        # Implementation for Calendar API chunking
        yield []  # Placeholder

class ExecutiveDataAggregator:
    """Aggregates streaming data into executive insights"""

    def __init__(self):
        self.running_totals = {
            'total_messages': 0,
            'unique_senders': set(),
            'themes': Counter(),
            'channels': set()
        }

    async def aggregate_insights(
        self,
        data_sources: List[str],
        filter_params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Aggregate insights from multiple streaming sources
        """
        processor = MemoryEfficientProcessor()

        # Process each source as a stream
        for source in data_sources:
            async for chunk_insights in processor.process_stream(source, filter_params):
                self._update_running_totals(chunk_insights, source)

        # Generate final executive summary
        return self._generate_executive_summary()

    def _update_running_totals(self, chunk_insights: Dict, source: str):
        """Update running totals with chunk data"""
        self.running_totals['total_messages'] += chunk_insights.get('chunk_size', 0)
        self.running_totals['channels'].add(source)

        # Update themes
        for theme in chunk_insights.get('themes', []):
            self.running_totals['themes'][theme] += 1

        # Update senders
        for sender in chunk_insights.get('senders', {}):
            self.running_totals['unique_senders'].add(sender)

    def _generate_executive_summary(self) -> Dict[str, Any]:
        """Generate final executive summary"""
        return {
            'summary': {
                'total_messages_processed': self.running_totals['total_messages'],
                'unique_senders': len(self.running_totals['unique_senders']),
                'channels_analyzed': list(self.running_totals['channels']),
                'processing_completed_at': datetime.utcnow().isoformat()
            },
            'top_themes': [
                theme for theme, count in self.running_totals['themes'].most_common(15)
            ],
            'recommendations': self._generate_recommendations()
        }

    def _generate_recommendations(self) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []

        if self.running_totals['total_messages'] > 1000:
            recommendations.append("High message volume detected - consider automation")

        top_themes = [t for t, _ in self.running_totals['themes'].most_common(3)]
        if len(top_themes) >= 2:
            recommendations.append(f"Focus areas: {', '.join(top_themes[:2])}")

        return recommendations

# Usage example for massive scale
async def process_enterprise_data():
    """Example of processing enterprise-scale data"""

    aggregator = ExecutiveDataAggregator()

    # Process multiple data sources concurrently
    insights = await aggregator.aggregate_insights(
        data_sources=['gmail', 'slack', 'calendar'],
        filter_params={
            'user_id': 'exec@company.com',
            'days_back': 30,
            'include_threads': True
        }
    )

    return insights