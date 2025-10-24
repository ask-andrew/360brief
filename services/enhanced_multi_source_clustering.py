"""
Enhanced Multi-Source Clustering Engine
Provides advanced email clustering with entity extraction, temporal relationships, and action item detection.
"""

import re
import json
import logging
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import math

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class DataSourceItem:
    """Represents an item from any data source (email, calendar, slack, etc.)"""
    id: str
    subject: str
    content: str
    sender: str
    date: str
    thread_id: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

@dataclass
class TemporalRelationship:
    """Represents temporal relationships between items"""
    entity: str
    relationship_type: str  # "before", "after", "during", "deadline", "follow_up"
    related_entity: str
    time_diff_hours: float
    context: str

@dataclass
class EntityMention:
    """Represents an entity extracted from content"""
    entity: str
    entity_type: str  # "person", "project", "deadline", "location", "organization"
    confidence: float
    context: str
    position: Tuple[int, int]

@dataclass
class ActionItem:
    """Represents an actionable item extracted from content"""
    id: str
    action_type: str  # "decision", "approval", "follow_up", "review", "blocker"
    description: str
    assignee: Optional[str] = None
    due_date: Optional[str] = None
    priority: str = "medium"  # "high", "medium", "low"
    status: str = "pending"  # "pending", "in_progress", "completed"
    confidence: float = 0.0

@dataclass
class TopicCluster:
    """Represents a cluster of related items"""
    id: str
    title: str
    category: str
    confidence: float
    items: List[DataSourceItem] = field(default_factory=list)
    entities: List[EntityMention] = field(default_factory=list)
    temporal_relationships: List[TemporalRelationship] = field(default_factory=list)
    action_items: List[ActionItem] = field(default_factory=list)
    summary: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)

class EnhancedMultiSourceClusteringEngine:
    """Enhanced clustering engine with entity extraction and temporal analysis"""

    def __init__(self):
        # Entity extraction patterns
        self.person_patterns = [
            re.compile(r'\b[A-Z][a-z]+ [A-Z][a-z]+\b'),  # First Last
            re.compile(r'\b[A-Z]\. [A-Z][a-z]+\b'),      # F. Last
            re.compile(r'\b[A-Z][a-z]+(?:\.|)\b'),       # Single names in context
        ]

        self.project_patterns = [
            re.compile(r'\bProject [A-Za-z0-9-]+\b'),
            re.compile(r'\b[A-Z]{2,}[0-9]+\b'),  # Acronym + number (like AJE2024)
        ]

        self.deadline_patterns = [
            re.compile(r'\b(?:by|before|due|deadline|target)\s+(?:end of\s+)?(?:today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}/\d{1,2}|\d{4}-\d{2}-\d{2})\b', re.IGNORECASE),
            re.compile(r'\b(?:next|this|coming)\s+(?:week|month|quarter|year)\b', re.IGNORECASE),
        ]

        self.action_patterns = {
            'decision': [
                r'\b(?:approve|approval|decide|decision|review|confirm|sign off|authorize)\b',
                r'\b(?:please review|needs your approval|requires decision)\b'
            ],
            'blocker': [
                r'\b(?:blocked|stuck|waiting|issue|problem|error|delay|urgent)\b',
                r'\b(?:need help|assistance required|blocked on)\b'
            ],
            'achievement': [
                r'\b(?:completed|finished|launched|shipped|delivered|achieved|milestone)\b',
                r'\b(?:great job|congratulations|well done|success)\b'
            ]
        }

        self.stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
            'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
            'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall'
        }

    def extract_entities(self, content: str) -> List[EntityMention]:
        """Extract entities from content"""
        entities = []

        # Extract persons
        for pattern in self.person_patterns:
            matches = pattern.finditer(content)
            for match in matches:
                entity = match.group().strip()
                if len(entity) > 2 and not any(word in entity.lower() for word in ['http', 'www', '@']):
                    entities.append(EntityMention(
                        entity=entity,
                        entity_type="person",
                        confidence=0.8,
                        context=content[max(0, match.start()-50):match.end()+50],
                        position=(match.start(), match.end())
                    ))

        # Extract projects
        for pattern in self.project_patterns:
            matches = pattern.finditer(content)
            for match in matches:
                entity = match.group().strip()
                entities.append(EntityMention(
                    entity=entity,
                    entity_type="project",
                    confidence=0.7,
                    context=content[max(0, match.start()-30):match.end()+30],
                    position=(match.start(), match.end())
                ))

        # Extract deadlines
        for pattern in self.deadline_patterns:
            matches = pattern.finditer(content)
            for match in matches:
                entity = match.group().strip()
                entities.append(EntityMention(
                    entity=entity,
                    entity_type="deadline",
                    confidence=0.6,
                    context=content[max(0, match.start()-40):match.end()+40],
                    position=(match.start(), match.end())
                ))

        return entities

    def extract_action_items(self, content: str, entities: List[EntityMention]) -> List[ActionItem]:
        """Extract actionable items from content"""
        actions = []

        for action_type, patterns in self.action_patterns.items():
            for pattern in patterns:
                matches = re.finditer(pattern, content, re.IGNORECASE)
                for match in matches:
                    # Find potential assignee (person entity near the match)
                    assignee = None
                    for entity in entities:
                        if (entity.entity_type == "person" and
                            abs(entity.position[0] - match.start()) < 100):
                            assignee = entity.entity
                            break

                    actions.append(ActionItem(
                        id=f"action_{len(actions)}_{hash(match.group()) % 10000}",
                        action_type=action_type,
                        description=match.group().strip(),
                        assignee=assignee,
                        priority="high" if "urgent" in content.lower() else "medium",
                        confidence=0.7
                    ))

        return actions

    def calculate_temporal_relationships(self, items: List[DataSourceItem]) -> List[TemporalRelationship]:
        """Calculate temporal relationships between items"""
        relationships = []

        for i, item1 in enumerate(items):
            for item2 in items[i+1:]:
                try:
                    date1 = datetime.fromisoformat(item1.date.replace('Z', '+00:00'))
                    date2 = datetime.fromisoformat(item2.date.replace('Z', '+00:00'))

                    time_diff = abs((date2 - date1).total_seconds()) / 3600  # hours

                    if time_diff < 24:  # Within 24 hours
                        if date1 < date2:
                            rel_type = "before"
                            context = f"{item1.subject[:50]}... happened before {item2.subject[:50]}..."
                        else:
                            rel_type = "after"
                            context = f"{item1.subject[:50]}... happened after {item2.subject[:50]}..."

                        relationships.append(TemporalRelationship(
                            entity=item1.id,
                            relationship_type=rel_type,
                            related_entity=item2.id,
                            time_diff_hours=time_diff,
                            context=context
                        ))
                except:
                    continue

        return relationships

    def cluster_by_similarity(self, items: List[DataSourceItem], threshold: float = 0.3) -> List[TopicCluster]:
        """Cluster items by content similarity"""
        clusters = []
        used = set()

        for i, item in enumerate(items):
            if item.id in used:
                continue

            cluster_items = [item]
            used.add(item.id)

            # Find similar items
            for j, other_item in enumerate(items):
                if other_item.id in used:
                    continue

                similarity = self._calculate_similarity(item, other_item)
                if similarity >= threshold:
                    cluster_items.append(other_item)
                    used.add(other_item.id)

            if len(cluster_items) > 0:
                # Extract entities and actions for the cluster
                all_content = " ".join([item.content for item in cluster_items])
                entities = self.extract_entities(all_content)
                actions = self.extract_action_items(all_content, entities)
                temporal_rels = self.calculate_temporal_relationships(cluster_items)

                # Generate cluster title, scores and summary
                title = self._generate_cluster_title(cluster_items)
                scores = self._score_cluster(cluster_items, entities, actions)
                summary = self._generate_cluster_summary(cluster_items, entities, actions)

                cluster = TopicCluster(
                    id=f"cluster_{len(clusters)}",
                    title=title,
                    category=self._categorize_cluster(cluster_items),
                    confidence=min(0.9, 0.5 + (len(cluster_items) * 0.1)),
                    items=cluster_items,
                    entities=entities,
                    temporal_relationships=temporal_rels,
                    action_items=actions,
                    summary=summary,
                    metadata={"scores": scores}
                )

                clusters.append(cluster)

        return clusters

    def _calculate_similarity(self, item1: DataSourceItem, item2: DataSourceItem) -> float:
        """Calculate similarity between two items"""
        # Simple token-based similarity
        content1 = (item1.subject + " " + item1.content).lower()
        content2 = (item2.subject + " " + item2.content).lower()

        # Extract tokens
        tokens1 = set(re.findall(r'\b\w+\b', content1)) - self.stop_words
        tokens2 = set(re.findall(r'\b\w+\b', content2)) - self.stop_words

        if not tokens1 or not tokens2:
            return 0.0

        # Jaccard similarity
        intersection = len(tokens1 & tokens2)
        union = len(tokens1 | tokens2)

        return intersection / union if union > 0 else 0.0

    def _generate_cluster_title(self, items: List[DataSourceItem]) -> str:
        """Generate a meaningful title for the cluster"""
        # Use the most common words in subjects
        all_subjects = " ".join([item.subject for item in items if item.subject])
        words = re.findall(r'\b\w+\b', all_subjects.lower())
        word_counts = Counter(words)

        # Filter out stop words and get most common meaningful words
        meaningful_words = [
            word for word, count in word_counts.most_common(5)
            if word not in self.stop_words and len(word) > 3
        ]

        if meaningful_words:
            return " ".join(meaningful_words[:3]).title()
        else:
            return f"Topic {len(items)} items"

    def _generate_cluster_summary(self, items: List[DataSourceItem],
                                entities: List[EntityMention],
                                actions: List[ActionItem]) -> str:
        """Generate a specific, 1–2 sentence executive summary for the cluster (non-LLM)"""
        # Extract key stakeholders and projects
        people = [e.entity for e in entities if e.entity_type == "person"]
        projects = [e.entity for e in entities if e.entity_type == "project"]

        # Derive action mix
        action_counts = Counter([a.action_type for a in actions])
        total_actions = sum(action_counts.values())

        # Build top keywords from subjects and content
        all_subjects = " ".join([it.subject for it in items if it.subject])
        all_content = " ".join([it.content for it in items if it.content])
        keyphrases = self._extract_keyphrases(all_subjects + " " + all_content)
        top_keywords = ", ".join(keyphrases[:2]) if keyphrases else (items[0].subject[:60] if items and items[0].subject else "this topic")

        # Time/recency
        try:
            iso_dates = [datetime.fromisoformat(it.date.replace('Z', '+00:00')) for it in items if it.date]
            most_recent = max(iso_dates) if iso_dates else None
            hours_ago = int((datetime.utcnow() - most_recent).total_seconds() / 3600) if most_recent else None
        except Exception:
            most_recent = None
            hours_ago = None

        recent_str = None
        if hours_ago is not None:
            recent_str = "last 24h" if hours_ago <= 24 else ("last 3d" if hours_ago <= 72 else "last week")

        # Deadline detection from entities
        deadlines = [e.entity for e in entities if e.entity_type == "deadline"]
        deadline_str = deadlines[0] if deadlines else ("ASAP" if 'urgent' in all_content.lower() else None)

        # Stakeholder pick
        stakeholder = people[0] if people else None

        # Primary sentence varies by dominant action type
        dominant = action_counts.most_common(1)[0][0] if total_actions else None
        if dominant in ("decision", "approval"):
            first = f"Decision needed on {top_keywords}" + (f" (led by {stakeholder})" if stakeholder else "") + "."
            second_bits = []
            if deadline_str:
                second_bits.append(f"deadline {deadline_str}")
            if recent_str:
                second_bits.append(f"recent activity {recent_str}")
            if total_actions:
                second_bits.append(f"{total_actions} action(s)")
            second = ("; ".join(second_bits) + ".") if second_bits else ""
            return (first + (" " + second if second else "")).strip()
        elif dominant == "blocker":
            first = f"Blocker on {top_keywords}" + (f" impacting {stakeholder}" if stakeholder else "") + "."
            second = (f"Next step: resolve blocker" + (f" by {deadline_str}" if deadline_str else "") + (f"; {recent_str}." if recent_str else "."))
            return (first + " " + second).strip()
        elif dominant == "achievement":
            first = f"Milestone: {top_keywords} completed" + (f" by {stakeholder}" if stakeholder else "") + "."
            second = "Follow-up: announce and monitor adoption."
            return (first + " " + second).strip()
        else:
            # Generic but specific follow-up
            mix = ", ".join([f"{cnt} {typ}(s)" for typ, cnt in action_counts.most_common(2)]) if total_actions else None
            parts = [f"Follow-up on {top_keywords}"]
            if stakeholder:
                parts.append(f"with {stakeholder}")
            first = " ".join(parts) + "."
            second_bits = []
            if mix:
                second_bits.append(mix)
            if deadline_str:
                second_bits.append(f"aim for {deadline_str}")
            if recent_str:
                second_bits.append(recent_str)
            second = ("; ".join(second_bits) + ".") if second_bits else ""
            return (first + (" " + second if second else "")).strip()

    def _categorize_cluster(self, items: List[DataSourceItem]) -> str:
        """Categorize the cluster based on content"""
        all_content = " ".join([item.content for item in items]).lower()

        categories = {
            'music': ['rehearsal', 'band', 'gig', 'music', 'performance', 'concert'],
            'work': ['meeting', 'project', 'deadline', 'report', 'presentation'],
            'personal': ['booking', 'reservation', 'order', 'confirmation', 'travel'],
            'finance': ['payment', 'invoice', 'budget', 'financial', 'cost']
        }

        for category, keywords in categories.items():
            if any(keyword in all_content for keyword in keywords):
                return category

        return 'general'

    def _extract_keyphrases(self, text: str) -> List[str]:
        """Lightweight keyphrase extraction using token frequency and bigrams"""
        text = text or ""
        tokens = re.findall(r"\b[a-zA-Z0-9][a-zA-Z0-9\-]+\b", text.lower())
        tokens = [t for t in tokens if t not in self.stop_words and len(t) > 2]
        counts = Counter(tokens)
        # Build bigrams from original text (lowercased)
        words = text.lower().split()
        bigrams = [f"{words[i]} {words[i+1]}" for i in range(len(words)-1)]
        bigrams = [b for b in bigrams if all(w not in self.stop_words for w in b.split())]
        bigram_counts = Counter(bigrams)
        # Prefer bigrams if they occur >1, else top unigrams
        candidates = [p for p, c in bigram_counts.most_common(5) if c > 1]
        if len(candidates) < 3:
            candidates += [p for p, _ in counts.most_common(5) if p not in candidates]
        # Title case for presentation
        return [c.title() for c in candidates[:5]]

    def _score_cluster(self, items: List[DataSourceItem], entities: List[EntityMention], actions: List[ActionItem]) -> Dict[str, Any]:
        """Compute urgency/impact/confidence and recency heuristics"""
        content = " ".join([it.content for it in items]).lower()
        urgency = 0.0
        if any(k in content for k in ["urgent", "asap", "deadline", "due"]):
            urgency += 0.6
        deadlines = [e for e in entities if e.entity_type == "deadline"]
        if deadlines:
            urgency += 0.3
        # Unread/signal proxy not available; use action presence
        if actions:
            urgency += 0.1

        impact = 0.0
        if any(k in content for k in ["budget", "invoice", "payment", "financial", "cost", "revenue"]):
            impact += 0.6
        if any(k in content for k in ["ceo", "board", "client", "customer", "investor"]):
            impact += 0.3
        if len(items) >= 3:
            impact += 0.1

        confidence = min(0.95, 0.5 + 0.1 * len(actions) + 0.05 * len(entities))

        try:
            iso_dates = [datetime.fromisoformat(it.date.replace('Z', '+00:00')) for it in items if it.date]
            most_recent = max(iso_dates) if iso_dates else None
            recent_hours = int((datetime.utcnow() - most_recent).total_seconds() / 3600) if most_recent else None
        except Exception:
            recent_hours = None

        return {
            "urgency_score": round(min(1.0, urgency), 2),
            "impact_score": round(min(1.0, impact), 2),
            "confidence": round(confidence, 2),
            "recent_activity_hours": recent_hours,
            "deadline_detected": bool(deadlines),
        }

    def _determine_signal_type(self, cluster: TopicCluster) -> str:
        """Determine the signal type of a cluster based on its content and actions"""
        # Check action types to determine signal type
        action_types = [action.action_type for action in cluster.action_items]

        if 'achievement' in action_types:
            return 'achievement'
        elif 'blocker' in action_types:
            return 'blocker'
        elif 'decision' in action_types or 'approval' in action_types:
            return 'decision'
        elif any(action.action_type in ['review', 'follow_up'] for action in cluster.action_items):
            return 'follow_up'

        # Fallback based on category and content
        if cluster.category == 'work':
            return 'work_item'
        elif cluster.category == 'personal':
            return 'personal'

        return 'general'

    def process_email_batch_enhanced(self, emails_data: List[Dict], mode: str = 'free') -> Dict[str, Any]:
        """
        Process a batch of emails with enhanced clustering
        This function maintains backward compatibility with the existing API
        """
        start_time = datetime.now()

        # Convert email data to DataSourceItem objects
        items = []
        for email in emails_data:
            item = DataSourceItem(
                id=email['id'],
                subject=email['subject'],
                content=email['content'],
                sender=email['sender'],
                date=email['date'],
                thread_id=email.get('thread_id')
            )
            items.append(item)

        # Perform enhanced clustering
        clusters = self.cluster_by_similarity(items, threshold=0.25)

        # Convert to the expected format for backward compatibility
        digest_items = []
        for cluster in clusters:
            # Convert cluster items back to the expected format
            cluster_items = []
            for item in cluster.items:
                cluster_items.append({
                    'id': item.id,
                    'subject': item.subject,
                    'content': item.content,
                    'sender': item.sender,
                    'date': item.date,
                    'thread_id': item.thread_id,
                    'metadata': {
                        'enhanced_clustering': {
                            'cluster_id': cluster.id,
                            'cluster_title': cluster.title,
                            'topic_category': cluster.category,
                            'confidence': cluster.confidence,
                            'entities': [{'entity': e.entity, 'type': e.entity_type, 'confidence': e.confidence} for e in cluster.entities],
                            'temporal_relationships': len(cluster.temporal_relationships),
                            'action_items': len(cluster.action_items)
                        }
                    }
                })

            # Build readable, specific actions
            def _parse_options_from_subjects(subjects: List[str]) -> str:
                for s in subjects:
                    if ' vs ' in s.lower():
                        parts = [p.strip(' -:') for p in re.split(r"(?i)\s+vs\s+", s) if p.strip()]
                        if len(parts) >= 2:
                            return f"select between {parts[0]} and {parts[1]}"
                    if '-' in s:
                        parts = [p.strip() for p in s.split('-') if p.strip()]
                        if len(parts) >= 2 and all(len(p.split()) <= 3 for p in parts[:2]):
                            return f"select between {parts[0]} and {parts[1]}"
                return "review and approve"

            subjects_list = [it.get('subject') or '' for it in cluster_items]
            people_entities = [e.entity for e in cluster.entities if getattr(e, 'entity_type', '') == 'person']
            stakeholder_hint = people_entities[0] if people_entities else None
            deadlines = [e.entity for e in cluster.entities if getattr(e, 'entity_type', '') == 'deadline']
            deadline_hint = deadlines[0] if deadlines else None

            formatted_actions: List[str] = []
            for a in cluster.action_items[:3]:
                base = a.action_type.title()
                detail = cluster.title or self._generate_cluster_title(cluster.items)
                suffixes = []
                if a.action_type in ('decision', 'approval'):
                    option_text = _parse_options_from_subjects(subjects_list)
                    suffixes.append(option_text)
                if stakeholder_hint:
                    suffixes.append(f"with {stakeholder_hint}")
                if deadline_hint:
                    suffixes.append(f"by {deadline_hint}")
                text = f"{base}: {detail}"
                if suffixes:
                    text += " — " + ", ".join(suffixes)
                formatted_actions.append(text)

            digest_items.append({
                'title': cluster.title,
                'summary': cluster.summary,
                'category': cluster.category,
                'confidence': cluster.confidence,
                'items': cluster_items,
                'actions': formatted_actions,
                'signal_type': self._determine_signal_type(cluster),
                'metadata': {
                    'enhanced_clustering': {
                        'cluster_id': cluster.id,
                        'entities_count': len(cluster.entities),
                        'temporal_relationships': len(cluster.temporal_relationships),
                        'action_items': len(cluster.action_items),
                        'processing_time_ms': 0  # Would calculate if needed
                    },
                    'scores': cluster.metadata.get('scores', {})
                }
            })
        processing_time = (datetime.now() - start_time).total_seconds() * 1000

        return {
            'digest_items': digest_items,
            'metrics': {
                'total_items': len(items),
                'avg_cluster_size': len(items) / max(len(clusters), 1),
                'processing_time_ms': processing_time
            },
            'upgrade_suggestions': [
                'Consider adjusting similarity threshold for different clustering granularity',
                'Entity extraction can be enhanced with custom patterns for your domain'
            ]
        }

# Global instance for backward compatibility
clustering_engine = EnhancedMultiSourceClusteringEngine()

def process_email_batch_enhanced(emails_data: List[Dict], mode: str = 'free') -> Dict[str, Any]:
    """Backward compatibility function"""
    return clustering_engine.process_email_batch_enhanced(emails_data, mode)
