# services/data_processing/async_processor.py
import asyncio
import aiohttp
import concurrent.futures
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime
import logging

@dataclass
class ProcessingConfig:
    """Configuration for processing pipeline"""
    batch_size: int = 100
    max_concurrent_batches: int = 5
    max_workers: int = 4
    timeout_seconds: int = 30
    chunk_size_mb: int = 10

class ScalableProcessingPipeline:
    """Highly optimized processing pipeline for multi-channel data"""

    def __init__(self, config: ProcessingConfig = None):
        self.config = config or ProcessingConfig()
        self.executor = concurrent.futures.ThreadPoolExecutor(
            max_workers=self.config.max_workers
        )
        self.nlp_cache = {}  # Cache processed entities
        self.session = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=self.config.timeout_seconds)
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
        self.executor.shutdown(wait=True)

    async def process_multi_channel_data(
        self,
        emails: List[Dict],
        slack_messages: List[Dict] = None,
        calendar_events: List[Dict] = None,
        user_id: str = None
    ) -> Dict[str, Any]:
        """
        Process data from multiple channels efficiently
        """
        tasks = []

        # Process emails in parallel batches
        if emails:
            email_batches = self._create_batches(emails, self.config.batch_size)
            email_tasks = [
                self._process_email_batch(batch, f"email_batch_{i}")
                for i, batch in enumerate(email_batches)
            ]
            tasks.extend(email_tasks)

        # Process other channels concurrently
        if slack_messages:
            tasks.append(self._process_slack_messages(slack_messages))
        if calendar_events:
            tasks.append(self._process_calendar_events(calendar_events))

        # Execute all processing tasks concurrently
        semaphore = asyncio.Semaphore(self.config.max_concurrent_batches)

        async def run_with_semaphore(task):
            async with semaphore:
                return await task

        results = await asyncio.gather(
            *[run_with_semaphore(task) for task in tasks],
            return_exceptions=True
        )

        # Aggregate results
        return self._aggregate_results(results)

    async def _process_email_batch(self, emails: List[Dict], batch_id: str) -> Dict:
        """Process a batch of emails with optimized NLP"""

        # Combine all text for batch NLP processing
        combined_text = " ".join([
            f"{email.get('subject', '')} {email.get('body', '')}"
            for email in emails
        ])

        # Run CPU-intensive NLP in thread pool
        loop = asyncio.get_event_loop()

        # Process entities in batch (more efficient than individual)
        entities_task = loop.run_in_executor(
            self.executor, self._extract_entities_batch, combined_text
        )

        # Process themes in batch
        themes_task = loop.run_in_executor(
            self.executor, self._extract_themes_batch, combined_text
        )

        # Wait for both NLP tasks
        entities, themes = await asyncio.gather(entities_task, themes_task)

        return {
            'batch_id': batch_id,
            'processed_count': len(emails),
            'entities': entities,
            'themes': themes,
            'processed_at': datetime.utcnow().isoformat()
        }

    def _extract_entities_batch(self, text: str) -> Dict:
        """Optimized batch entity extraction"""
        import spacy

        # Use caching to avoid reprocessing
        text_hash = hash(text[:1000])  # Hash first 1000 chars for cache key
        if text_hash in self.nlp_cache:
            return self.nlp_cache[text_hash]

        # Load model once and reuse
        if not hasattr(self, '_nlp_model'):
            self._nlp_model = spacy.load("en_core_web_sm")

        # Process with character limit for efficiency
        doc = self._nlp_model(text[:50000])  # Limit to 50k chars

        entities = {
            'people': [ent.text for ent in doc.ents if ent.label_ == "PERSON"][:20],
            'orgs': [ent.text for ent in doc.ents if ent.label_ == "ORG"][:15],
            'locations': [ent.text for ent in doc.ents if ent.label_ in ["GPE", "LOC"]][:10]
        }

        # Cache result
        self.nlp_cache[text_hash] = entities
        return entities

    def _extract_themes_batch(self, text: str) -> List[str]:
        """Optimized batch theme extraction"""
        from collections import Counter
        import re

        # Quick keyword extraction without heavy NLP
        words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())

        # Filter common words and extract themes
        stopwords = {'that', 'this', 'with', 'from', 'they', 'have', 'will', 'been', 'were'}
        filtered_words = [w for w in words if w not in stopwords]

        # Return top themes
        return [word for word, count in Counter(filtered_words).most_common(15)]

    async def _process_slack_messages(self, messages: List[Dict]) -> Dict:
        """Process Slack messages efficiently"""
        # Simplified processing for Slack
        return {
            'channel': 'slack',
            'processed_count': len(messages),
            'channels': list(set(msg.get('channel', 'unknown') for msg in messages)),
            'mentions': self._extract_slack_mentions(messages)
        }

    async def _process_calendar_events(self, events: List[Dict]) -> Dict:
        """Process calendar events efficiently"""
        return {
            'channel': 'calendar',
            'processed_count': len(events),
            'meeting_types': self._categorize_meetings(events),
            'attendee_frequency': self._analyze_attendees(events)
        }

    def _create_batches(self, items: List, batch_size: int) -> List[List]:
        """Split items into batches"""
        return [items[i:i + batch_size] for i in range(0, len(items), batch_size)]

    def _aggregate_results(self, results: List) -> Dict[str, Any]:
        """Aggregate all processing results into unified insights"""
        successful_results = [r for r in results if not isinstance(r, Exception)]

        # Combine all entities
        all_people = []
        all_orgs = []
        all_themes = []

        for result in successful_results:
            if isinstance(result, dict):
                if 'entities' in result:
                    all_people.extend(result['entities'].get('people', []))
                    all_orgs.extend(result['entities'].get('orgs', []))
                if 'themes' in result:
                    all_themes.extend(result['themes'])

        # Deduplicate and rank
        from collections import Counter

        return {
            'processing_summary': {
                'total_batches': len(successful_results),
                'processing_time': datetime.utcnow().isoformat()
            },
            'unified_insights': {
                'top_people': [p for p, _ in Counter(all_people).most_common(10)],
                'top_organizations': [o for o, _ in Counter(all_orgs).most_common(10)],
                'top_themes': [t for t, _ in Counter(all_themes).most_common(15)]
            },
            'cross_channel_patterns': self._identify_cross_channel_patterns(successful_results)
        }

    def _identify_cross_channel_patterns(self, results: List[Dict]) -> Dict:
        """Identify patterns across multiple communication channels"""
        # Simplified pattern detection
        patterns = {
            'shared_topics': [],
            'frequent_collaborators': [],
            'recurring_themes': []
        }

        # This would contain sophisticated cross-channel analysis
        return patterns

    def _extract_slack_mentions(self, messages: List[Dict]) -> List[str]:
        """Extract mentions from Slack messages"""
        mentions = []
        for msg in messages:
            text = msg.get('text', '')
            # Extract @mentions
            import re
            mentions.extend(re.findall(r'@(\w+)', text))
        return list(set(mentions))

    def _categorize_meetings(self, events: List[Dict]) -> Dict[str, int]:
        """Categorize meeting types"""
        categories = {'standup': 0, 'planning': 0, 'review': 0, 'other': 0}

        for event in events:
            title = event.get('summary', '').lower()
            if any(word in title for word in ['standup', 'daily', 'scrum']):
                categories['standup'] += 1
            elif any(word in title for word in ['planning', 'roadmap', 'strategy']):
                categories['planning'] += 1
            elif any(word in title for word in ['review', 'retrospective', 'demo']):
                categories['review'] += 1
            else:
                categories['other'] += 1

        return categories

    def _analyze_attendees(self, events: List[Dict]) -> Dict[str, int]:
        """Analyze attendee frequency"""
        from collections import Counter

        attendees = []
        for event in events:
            for attendee in event.get('attendees', []):
                if isinstance(attendee, dict):
                    attendees.append(attendee.get('email', ''))
                else:
                    attendees.append(str(attendee))

        return dict(Counter(attendees).most_common(10))

# Usage example
async def process_executive_data(
    emails: List[Dict],
    slack_messages: List[Dict] = None,
    calendar_events: List[Dict] = None
) -> Dict[str, Any]:
    """
    Main entry point for processing executive intelligence data
    """
    config = ProcessingConfig(
        batch_size=50,  # Smaller batches for responsiveness
        max_concurrent_batches=3,  # Conservative for memory
        max_workers=2,  # Adjust based on server capacity
        timeout_seconds=60
    )

    async with ScalableProcessingPipeline(config) as pipeline:
        return await pipeline.process_multi_channel_data(
            emails=emails,
            slack_messages=slack_messages,
            calendar_events=calendar_events
        )