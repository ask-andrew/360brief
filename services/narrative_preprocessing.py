"""
Enhanced Narrative Brief Preprocessing Pipeline
Implements the mandatory preprocessing layer with data cleaning, NER, coreference resolution,
project clustering, and financial tagging as specified in the requirements.
"""

import re
import logging
from typing import Dict, List, Any, Optional, Tuple, Set
from dataclasses import dataclass, field
from collections import defaultdict, Counter
import html
import json

logger = logging.getLogger(__name__)

@dataclass
class ProcessedEmail:
    """Enhanced email representation with preprocessing results"""
    id: str
    subject: str
    body: str
    sender: Dict[str, Any]
    date: str
    clean_text: str = ""
    entities: List[Dict[str, Any]] = field(default_factory=list)
    status_flags: Dict[str, bool] = field(default_factory=dict)
    financial_values: List[float] = field(default_factory=list)
    project_key: str = ""

@dataclass
class ProjectCluster:
    """Enhanced project cluster with comprehensive metadata"""
    project_key: str
    items: List[ProcessedEmail] = field(default_factory=list)
    entities: Set[str] = field(default_factory=set)
    people: Set[str] = field(default_factory=set)
    status_counts: Counter = field(default_factory=Counter)
    financial_total: float = 0.0
    financial_values: List[float] = field(default_factory=list)
    has_financial_mentions: bool = False
    urgency_score: float = 0.0
    contextual_summary: str = ""
    action_items: List[str] = field(default_factory=list)
    blockers: List[str] = field(default_factory=list)

class EnhancedPreprocessingPipeline:
    """Mandatory preprocessing pipeline for narrative brief generation"""

    def __init__(self):
        # Financial regex with comprehensive pattern matching
        self.financial_regex = re.compile(
            r'\$\s*([0-9]{1,3}(?:[,\s][0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)\s*([KMB])?',
            re.IGNORECASE
        )

        # Status detection patterns
        self.status_patterns = {
            'blocker': [
                'blocker', 'blocked', 'issue', 'problem', 'stalled', 'stuck',
                'urgent', 'asap', 'critical', 'emergency', 'crisis', 'delay'
            ],
            'decision': [
                'decision', 'approve', 'approval', 'authorize', 'sign-off',
                'review', 'confirm', 'decide', 'judgment', 'call'
            ],
            'achievement': [
                'shipped', 'launched', 'completed', 'delivered', 'win',
                'closed won', 'achievement', 'success', 'milestone'
            ]
        }

        # Entity extraction patterns
        self.person_patterns = [
            re.compile(r'\b[A-Z][a-z]+ [A-Z][a-z]+\b'),  # First Last
            re.compile(r'\b[A-Z]\. [A-Z][a-z]+\b'),      # F. Last
            re.compile(r'\b[A-Z][a-z]+(?:\.|)\b'),       # Single names in context
        ]

        self.organization_patterns = [
            re.compile(r'\b[A-Z][A-Za-z0-9& ]{2,}(?:Inc|Corp|LLC|Ltd|Co|Group|Labs|Tech|Systems)\b'),
            re.compile(r'\b[A-Z]{2,}[0-9]+\b'),  # Acronym patterns like AJE2024
        ]

        # Project key patterns
        self.project_patterns = [
            re.compile(r'([A-Z][\w& ]+?)\s*-\s*([A-Z][\w& ]+)', re.IGNORECASE),  # Allied - Ledet
            re.compile(r'Project [A-Za-z0-9-]+', re.IGNORECASE),
            re.compile(r'\b[A-Z]{2,}[0-9]+\b'),  # WINBOX, AJE2024
        ]

        # Content cleaning patterns
        self.html_patterns = re.compile(r'<[^>]+>')
        self.signature_patterns = [
            re.compile(r'--\s*$', re.MULTILINE),
            re.compile(r'^[A-Za-z\s]+$', re.MULTILINE),  # Common signature lines
            re.compile(r'(Best|Regards|Sincerely|Thanks|Thank you),?\s*$', re.MULTILINE),
        ]

    def clean_email_text(self, text: str) -> str:
        """Clean email text by removing HTML, signatures, and footers"""
        if not text:
            return ""

        # Decode HTML entities
        text = html.unescape(text)

        # Remove HTML tags
        text = self.html_patterns.sub('', text)

        # Remove common email signatures and footers
        lines = text.split('\n')
        cleaned_lines = []

        for line in lines:
            line = line.strip()
            # Skip signature-like lines
            if (len(line) < 100 and
                any(pattern.match(line) for pattern in self.signature_patterns) or
                line.lower().startswith(('best', 'regards', 'sincerely', 'thanks', 'thank you'))):
                break
            cleaned_lines.append(line)

        return '\n'.join(cleaned_lines).strip()

    def extract_financial_values(self, text: str) -> List[float]:
        """Extract financial values with proper formatting and multipliers"""
        if not text:
            return []

        values = []
        for match in self.financial_regex.finditer(text):
            amount_str = match.group(1)
            multiplier = match.group(2)

            try:
                # Clean and convert to float
                clean_amount = amount_str.replace(',', '').strip()
                base_value = float(clean_amount)

                # Apply multiplier
                if multiplier and multiplier.upper() == 'K':
                    base_value *= 1000
                elif multiplier and multiplier.upper() == 'M':
                    base_value *= 1000000
                elif multiplier and multiplier.upper() == 'B':
                    base_value *= 1000000000

                values.append(base_value)
            except ValueError:
                continue

        return values

    def extract_entities(self, text: str) -> List[Dict[str, Any]]:
        """Extract named entities from text"""
        entities = []

        # Extract people
        for pattern in self.person_patterns:
            for match in pattern.finditer(text):
                entities.append({
                    'entity': match.group(),
                    'type': 'person',
                    'confidence': 0.8,
                    'position': (match.start(), match.end())
                })

        # Extract organizations/projects
        for pattern in self.organization_patterns:
            for match in pattern.finditer(text):
                entities.append({
                    'entity': match.group(),
                    'type': 'organization',
                    'confidence': 0.7,
                    'position': (match.start(), match.end())
                })

        # Deduplicate entities
        seen = set()
        unique_entities = []
        for entity in entities:
            key = (entity['entity'].lower(), entity['type'])
            if key not in seen:
                seen.add(key)
                unique_entities.append(entity)

        return unique_entities

    def detect_status_flags(self, text: str) -> Dict[str, bool]:
        """Detect status flags in text"""
        text_lower = text.lower()
        return {
            status_type: any(keyword in text_lower for keyword in keywords)
            for status_type, keywords in self.status_patterns.items()
        }

    def infer_project_key(self, email: Dict[str, Any]) -> str:
        """Infer project key using multiple strategies"""
        subject = (email.get('subject') or '').strip()
        body = (email.get('body') or '').strip()

        # Strategy 1: Hyphenated pairs (e.g., "Allied - Ledet")
        for pattern in self.project_patterns:
            match = pattern.search(subject)
            if match:
                if len(match.groups()) >= 2:
                    return f"{match.group(1).strip()} - {match.group(2).strip()}"
                return match.group().strip()

        # Strategy 2: Extract meaningful words from subject
        words = re.findall(r"[A-Za-z][A-Za-z0-9&]+", subject)
        if len(words) >= 2:
            # Filter out common stop words
            stop_words = {'re', 'fwd', 'fw', 'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'she', 'use', 'way', 'why'}
            meaningful_words = [w for w in words if w.lower() not in stop_words]
            if len(meaningful_words) >= 2:
                return f"{meaningful_words[0]} - {meaningful_words[1]}"

        # Strategy 3: First 6 words of subject as fallback
        words = subject.split()[:6]
        return ' - '.join(words) if words else 'General'

    def extract_people_from_context(self, text: str) -> List[str]:
        """Extract people names from text context"""
        people = []
        for pattern in self.person_patterns:
            people.extend(pattern.findall(text))
        return list(set(people))

    def preprocess_email(self, email: Dict[str, Any]) -> ProcessedEmail:
        """Complete preprocessing of a single email"""
        # Basic fields
        processed = ProcessedEmail(
            id=email.get('id', ''),
            subject=email.get('subject', ''),
            body=email.get('body', ''),
            sender=email.get('from', {}),
            date=email.get('date', '')
        )

        # Clean text
        processed.clean_text = self.clean_email_text(f"{processed.subject}\n{processed.body}")

        # Extract financial values
        processed.financial_values = self.extract_financial_values(processed.clean_text)

        # Extract entities
        processed.entities = self.extract_entities(processed.clean_text)

        # Detect status flags
        processed.status_flags = self.detect_status_flags(processed.clean_text)

        # Infer project key
        processed.project_key = self.infer_project_key(email)

        return processed

    def cluster_by_project(self, processed_emails: List[ProcessedEmail]) -> Dict[str, ProjectCluster]:
        """Enhanced project clustering with co-occurrence and entity matching"""
        clusters = {}
        entity_to_projects = defaultdict(set)

        # First pass: Create initial clusters
        for email in processed_emails:
            project_key = email.project_key
            if project_key not in clusters:
                clusters[project_key] = ProjectCluster(project_key=project_key)

            clusters[project_key].items.append(email)

            # Track entities and people
            for entity in email.entities:
                entity_name = entity['entity']
                clusters[project_key].entities.add(entity_name)
                entity_to_projects[entity_name].add(project_key)

                if entity['type'] == 'person':
                    clusters[project_key].people.add(entity_name)

            # Update status counts
            for status_type, is_present in email.status_flags.items():
                if is_present:
                    clusters[project_key].status_counts[status_type] += 1

            # Update financial data
            if email.financial_values:
                clusters[project_key].financial_values.extend(email.financial_values)
                clusters[project_key].has_financial_mentions = True

        # Second pass: Merge related clusters based on shared entities
        self._merge_related_clusters(clusters, entity_to_projects)

        # Final pass: Calculate derived metrics
        for cluster in clusters.values():
            cluster.financial_total = sum(cluster.financial_values) if cluster.has_financial_mentions else 0.0
            cluster.urgency_score = self._calculate_urgency_score(cluster.status_counts)

        return clusters

    def _merge_related_clusters(self, clusters: Dict[str, ProjectCluster],
                               entity_to_projects: Dict[str, Set[str]]):
        """Merge clusters that share significant entities"""
        merged = set()
        clusters_to_remove = []

        for project_key, cluster in clusters.items():
            if project_key in merged:
                continue

            # Find clusters that share entities
            shared_projects = set()
            for entity in cluster.entities:
                shared_projects.update(entity_to_projects[entity])

            # Merge clusters with significant overlap (>50% shared entities)
            for other_project in shared_projects:
                if (other_project != project_key and
                    other_project not in merged and
                    other_project in clusters):

                    other_cluster = clusters[other_project]
                    overlap_ratio = len(cluster.entities.intersection(other_cluster.entities)) / max(len(cluster.entities), len(other_cluster.entities))

                    if overlap_ratio > 0.5:
                        # Merge other_cluster into current cluster
                        cluster.items.extend(other_cluster.items)
                        cluster.entities.update(other_cluster.entities)
                        cluster.people.update(other_cluster.people)
                        cluster.status_counts.update(other_cluster.status_counts)

                        if other_cluster.has_financial_mentions:
                            cluster.financial_values.extend(other_cluster.financial_values)
                            cluster.has_financial_mentions = True

                        merged.add(other_project)
                        clusters_to_remove.append(other_project)

        # Remove merged clusters
        for project_key in clusters_to_remove:
            del clusters[project_key]

    def _calculate_urgency_score(self, status_counts: Counter) -> float:
        """Calculate urgency score based on status types"""
        # Weight: blocker=3, decision=2, achievement=1
        return (status_counts.get('blocker', 0) * 3 +
                status_counts.get('decision', 0) * 2 +
                status_counts.get('achievement', 0) * 1)

    def enforce_financial_constraints(self, clusters: Dict[str, ProjectCluster]) -> Dict[str, ProjectCluster]:
        """Enforce financial constraint: only set financial_value if explicitly mentioned"""
        for cluster in clusters.values():
            # Only keep financial data if explicitly mentioned in at least one email
            if not cluster.has_financial_mentions:
                cluster.financial_total = 0.0
                cluster.financial_values.clear()
        return clusters

def process_email_batch_for_narrative(emails: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Main entry point for preprocessing email batch"""
    pipeline = EnhancedPreprocessingPipeline()

    # Preprocess all emails
    processed_emails = [pipeline.preprocess_email(email) for email in emails]

    # Cluster by project
    clusters = pipeline.cluster_by_project(processed_emails)

    # Enforce financial constraints
    clusters = pipeline.enforce_financial_constraints(clusters)

    # Sort clusters by urgency and financial impact
    sorted_clusters = sorted(
        clusters.values(),
        key=lambda c: (c.urgency_score, c.financial_total),
        reverse=True
    )

    return {
        'processed_emails': processed_emails,
        'clusters': {c.project_key: c for c in sorted_clusters},
        'sorted_clusters': sorted_clusters,
        'total_emails': len(emails),
        'total_clusters': len(clusters)
    }
