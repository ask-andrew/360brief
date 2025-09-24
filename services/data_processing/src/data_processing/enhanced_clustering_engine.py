# Enhanced Clustering Engine for 360Brief
# Integrates with existing tiered_intelligence_engine.py

import re
import json
import numpy as np
from typing import List, Dict, Optional, Set, Tuple
from collections import defaultdict, Counter
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
import time

# Try to import ML libraries, fallback to basic clustering if not available
try:
    from sentence_transformers import SentenceTransformer
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.cluster import DBSCAN
    from sklearn.metrics.pairwise import cosine_similarity
    ADVANCED_ML_AVAILABLE = True
except ImportError:
    ADVANCED_ML_AVAILABLE = False
    print("Advanced ML libraries not available. Using pattern-based clustering only.")

try:
    import spacy
    nlp = spacy.load("en_core_web_sm")
    SPACY_AVAILABLE = True
except (ImportError, OSError):
    SPACY_AVAILABLE = False
    print("SpaCy not available. Using basic NLP.")

@dataclass
class EmailItem:
    """
    Mirror of your TypeScript EmailItem interface
    """
    id: str
    subject: str
    body: str
    from_address: str
    to: List[str]
    date: datetime
    thread_id: Optional[str] = None
    labels: List[str] = None
    has_attachments: bool = False
    metadata: Dict = None

    def __post_init__(self):
        if self.labels is None:
            self.labels = []
        if self.metadata is None:
            self.metadata = {
                'actionItems': [],
                'projectContext': {},
                'nlpInsights': {},
                'intelligence': {}
            }

@dataclass
class ClusteringResult:
    """
    Result structure for clustering operation
    """
    clusters: List[Dict]
    unclustered_emails: List[EmailItem]
    metrics: Dict
    upgrade_suggestions: List[str]
    processing_time_ms: int

class ProfessionalPatternDetector:
    """
    Detects professional communication patterns without predefined categories
    """

    def __init__(self):
        # Core professional patterns - expandable based on usage
        self.base_patterns = {
            'vendor_communication': {
                'quote_indicators': [
                    r'\b(?:quote|estimate|proposal|bid|pricing)\b',
                    r'[\$\d,]+(?:\.\d{2})?',
                    r'\b(?:cost|price|rate|fee)\b'
                ],
                'invoice_indicators': [
                    r'\b(?:invoice|payment|billing|due|overdue)\b',
                    r'\b(?:net \d+|payment terms)\b'
                ],
                'vendor_names': [
                    r'\b[A-Z][a-z]+\s+(?:Corp|Corporation|Inc|LLC|Ltd|Company|Co|Services|Solutions)\b',
                    r'\b[A-Z]{2,}\s+(?:Corp|Corporation|Inc|LLC|Ltd|Company|Co|Services|Solutions)\b'
                ]
            },
            'project_management': {
                'project_identifiers': [
                    r'\b(?:project|initiative|program|campaign)\s+[\w\-]+',
                    r'\b[\w\-]+\s+(?:project|initiative|program|campaign)\b',
                    r'\bQ[1-4]\s*\d{4}\b',
                    r'\b\d{4}\s+(?:planning|roadmap|strategy)\b'
                ],
                'status_indicators': [
                    r'\b(?:status update|progress report|milestone|deliverable)\b',
                    r'\b(?:completed|in progress|blocked|delayed)\b',
                    r'\b(?:on track|behind schedule|ahead of schedule)\b'
                ],
                'meeting_indicators': [
                    r'\b(?:meeting|call|conference|standup|sync|review)\b',
                    r'\b(?:agenda|minutes|action items|follow.?up)\b'
                ]
            },
            'financial_communication': {
                'budget_indicators': [
                    r'\b(?:budget|funding|allocation|expense|cost center)\b',
                    r'\b(?:ROI|EBITDA|profit|revenue|margin)\b'
                ],
                'approval_indicators': [
                    r'\b(?:approval|authorize|sign off|approve)\b',
                    r'\b(?:pending approval|awaiting approval)\b'
                ]
            },
            'client_communication': {
                'client_indicators': [
                    r'\b(?:client|customer|stakeholder|end user)\b',
                    r'\b(?:requirement|specification|feedback)\b'
                ],
                'delivery_indicators': [
                    r'\b(?:delivery|deploy|launch|go.?live)\b',
                    r'\b(?:production|live environment)\b'
                ]
            }
        }

        # Temporal patterns for recurring communications
        self.temporal_patterns = {
            'recurring_meetings': [
                r'\b(?:weekly|daily|monthly|quarterly)\s+(?:meeting|standup|sync|review)\b',
                r'\b(?:monday|tuesday|wednesday|thursday|friday)\s+(?:meeting|call)\b'
            ],
            'deadlines': [
                r'\b(?:due|deadline|deliver|complete)\s+(?:by|before|on)\s+[\w\s,]+\b',
                r'\b(?:EOD|end of day|COB|close of business)\b'
            ]
        }

    def extract_patterns(self, email: EmailItem) -> Dict[str, List[str]]:
        """
        Extract professional patterns from email content
        """
        combined_text = f"{email.subject} {email.body}".lower()
        detected_patterns = defaultdict(list)

        # Check all pattern categories
        for category, pattern_groups in self.base_patterns.items():
            for pattern_type, patterns in pattern_groups.items():
                for pattern in patterns:
                    matches = re.findall(pattern, combined_text, re.IGNORECASE)
                    if matches:
                        detected_patterns[f"{category}_{pattern_type}"].extend(matches)

        # Check temporal patterns
        for pattern_type, patterns in self.temporal_patterns.items():
            for pattern in patterns:
                matches = re.findall(pattern, combined_text, re.IGNORECASE)
                if matches:
                    detected_patterns[pattern_type].extend(matches)

        return dict(detected_patterns)

class BusinessEntityExtractor:
    """
    Extract business entities like company names, project names, etc.
    """

    def __init__(self):
        self.company_suffixes = ['Corp', 'Corporation', 'Inc', 'LLC', 'Ltd', 'Company', 'Co', 'Services', 'Solutions', 'Group', 'Partners']
        self.project_keywords = ['project', 'initiative', 'program', 'campaign', 'effort', 'workstream']

    def extract_entities(self, email: EmailItem) -> Dict[str, List[str]]:
        """
        Extract business entities from email
        """
        combined_text = f"{email.subject} {email.body}"
        entities = defaultdict(list)

        # Extract company names
        company_pattern = r'\b[A-Z][a-zA-Z]*\s+(?:' + '|'.join(self.company_suffixes) + r')\b'
        companies = re.findall(company_pattern, combined_text)
        entities['companies'] = list(set(companies))

        # Extract project names (basic approach)
        project_pattern = r'\b(?:' + '|'.join(self.project_keywords) + r')\s+([A-Z][a-zA-Z\s]{2,20})\b'
        projects = re.findall(project_pattern, combined_text, re.IGNORECASE)
        entities['projects'] = list(set([p.strip() for p in projects]))

        # Extract monetary amounts
        money_pattern = r'\$[\d,]+(?:\.\d{2})?'
        amounts = re.findall(money_pattern, combined_text)
        entities['amounts'] = list(set(amounts))

        # Extract email addresses (excluding sender/recipient)
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        mentioned_emails = re.findall(email_pattern, combined_text)
        # Filter out sender and recipients
        filtered_emails = [e for e in mentioned_emails if e != email.from_address and e not in email.to]
        entities['mentioned_contacts'] = list(set(filtered_emails))

        # Use SpaCy for better entity extraction if available
        if SPACY_AVAILABLE:
            try:
                doc = nlp(combined_text[:1000])  # Limit text length
                for ent in doc.ents:
                    if ent.label_ in ['ORG', 'PERSON', 'MONEY', 'DATE']:
                        entity_type = ent.label_.lower()
                        if entity_type not in entities:
                            entities[entity_type] = []
                        entities[entity_type].append(ent.text)
            except Exception as e:
                print(f"SpaCy processing error: {e}")

        return dict(entities)

class EnhancedClusteringEngine:
    """
    Main clustering engine that adapts to user tier and preferences
    """

    def __init__(self, user_tier: str = 'free', user_preferences: Dict = None):
        self.user_tier = user_tier
        self.user_preferences = user_preferences or {}
        self.pattern_detector = ProfessionalPatternDetector()
        self.entity_extractor = BusinessEntityExtractor()
        self.last_method_used = 'pattern_based'

        # Initialize ML models if available and user is on paid tier
        if ADVANCED_ML_AVAILABLE and user_tier == 'paid':
            try:
                self.sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
                self.tfidf_vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
                self.ml_available = True
            except Exception as e:
                print(f"Failed to initialize ML models: {e}")
                self.ml_available = False
        else:
            self.ml_available = False

    def _extract_text_features(self, email: EmailItem) -> str:
        """
        Extract relevant text for clustering
        """
        # Weight subject higher than body
        subject_weighted = " ".join([email.subject] * 3)
        body_snippet = email.body[:500]  # First 500 chars
        return f"{subject_weighted} {body_snippet}"

    def _calculate_pattern_similarity(self, email1: EmailItem, email2: EmailItem) -> float:
        """
        Calculate similarity based on detected patterns
        """
        patterns1 = self.pattern_detector.extract_patterns(email1)
        patterns2 = self.pattern_detector.extract_patterns(email2)

        if not patterns1 and not patterns2:
            return 0.0

        # Count overlapping pattern types
        pattern_types1 = set(patterns1.keys())
        pattern_types2 = set(patterns2.keys())

        if not pattern_types1 and not pattern_types2:
            return 0.0

        overlap = len(pattern_types1.intersection(pattern_types2))
        total_unique = len(pattern_types1.union(pattern_types2))

        return overlap / total_unique if total_unique > 0 else 0.0

    def _calculate_entity_similarity(self, email1: EmailItem, email2: EmailItem) -> float:
        """
        Calculate similarity based on shared entities
        """
        entities1 = self.entity_extractor.extract_entities(email1)
        entities2 = self.entity_extractor.extract_entities(email2)

        total_overlap = 0
        total_entities = 0

        for entity_type in set(entities1.keys()).union(set(entities2.keys())):
            list1 = entities1.get(entity_type, [])
            list2 = entities2.get(entity_type, [])

            if list1 or list2:
                overlap = len(set(list1).intersection(set(list2)))
                total = len(set(list1).union(set(list2)))
                total_overlap += overlap
                total_entities += total

        return total_overlap / total_entities if total_entities > 0 else 0.0

    def _pattern_based_clustering(self, emails: List[EmailItem]) -> Tuple[List[Dict], List[EmailItem]]:
        """
        Free tier: Pattern-based clustering
        """
        clusters = []
        unclustered = []
        email_to_cluster = {}

        for email in emails:
            patterns = self.pattern_detector.extract_patterns(email)
            entities = self.entity_extractor.extract_entities(email)

            if not patterns:
                unclustered.append(email)
                continue

            # Find dominant pattern category
            dominant_category = None
            max_patterns = 0

            for category in ['vendor_communication', 'project_management', 'financial_communication', 'client_communication']:
                category_patterns = [k for k in patterns.keys() if k.startswith(category)]
                if len(category_patterns) > max_patterns:
                    max_patterns = len(category_patterns)
                    dominant_category = category

            if not dominant_category:
                unclustered.append(email)
                continue

            # Try to find existing cluster
            found_cluster = None
            for cluster in clusters:
                if cluster['topic_category'] == dominant_category:
                    # Check if entities overlap
                    cluster_entities = cluster['key_entities']
                    entity_overlap = False

                    for entity_type, entity_list in entities.items():
                        if entity_type in cluster_entities:
                            if set(entity_list).intersection(set(cluster_entities[entity_type])):
                                entity_overlap = True
                                break

                    if entity_overlap:
                        found_cluster = cluster
                        break

            if found_cluster:
                # Add to existing cluster
                found_cluster['email_ids'].append(email.id)
                found_cluster['email_count'] += 1
                # Merge entities
                for entity_type, entity_list in entities.items():
                    if entity_type not in found_cluster['key_entities']:
                        found_cluster['key_entities'][entity_type] = []
                    found_cluster['key_entities'][entity_type].extend(entity_list)
                    found_cluster['key_entities'][entity_type] = list(set(found_cluster['key_entities'][entity_type]))

                email_to_cluster[email.id] = found_cluster['cluster_id']
            else:
                # Create new cluster
                cluster_id = f"cluster_{len(clusters)}_{dominant_category}"
                topic_name = self._generate_topic_name(dominant_category, entities, patterns)

                new_cluster = {
                    'cluster_id': cluster_id,
                    'topic_name': topic_name,
                    'topic_category': dominant_category,
                    'description': self._generate_description(dominant_category, entities),
                    'email_ids': [email.id],
                    'email_count': 1,
                    'confidence_score': 0.75,  # Pattern-based confidence
                    'key_entities': entities,
                    'key_patterns': list(patterns.keys()),
                    'priority_score': self._calculate_priority(email, patterns),
                    'upgrade_hint': self._get_upgrade_hint(dominant_category)
                }

                clusters.append(new_cluster)
                email_to_cluster[email.id] = cluster_id

        return clusters, unclustered

    def _ml_enhanced_clustering(self, emails: List[EmailItem]) -> Tuple[List[Dict], List[EmailItem]]:
        """
        Paid tier: ML-enhanced clustering with semantic similarity
        """
        if not self.ml_available:
            return self._pattern_based_clustering(emails)

        # Extract text features
        texts = [self._extract_text_features(email) for email in emails]

        try:
            # Generate embeddings
            embeddings = self.sentence_model.encode(texts)

            # Perform DBSCAN clustering
            dbscan = DBSCAN(eps=0.3, min_samples=2, metric='cosine')
            cluster_labels = dbscan.fit_predict(embeddings)

            # Organize results
            clusters = []
            unclustered = []
            cluster_groups = defaultdict(list)

            for i, label in enumerate(cluster_labels):
                if label == -1:  # Unclustered
                    unclustered.append(emails[i])
                else:
                    cluster_groups[label].append(emails[i])

            # Process each cluster
            for cluster_id, cluster_emails in cluster_groups.items():
                if len(cluster_emails) >= 2:  # Only keep clusters with 2+ emails
                    cluster_dict = self._create_ml_cluster(cluster_id, cluster_emails)
                    clusters.append(cluster_dict)
                else:
                    unclustered.extend(cluster_emails)

            return clusters, unclustered

        except Exception as e:
            print(f"ML clustering failed: {e}")
            # Fallback to pattern-based
            return self._pattern_based_clustering(emails)

    def _create_ml_cluster(self, cluster_id: int, emails: List[EmailItem]) -> Dict:
        """
        Create cluster dictionary from ML clustering results
        """
        # Extract patterns and entities from all emails
        all_patterns = defaultdict(list)
        all_entities = defaultdict(list)

        for email in emails:
            patterns = self.pattern_detector.extract_patterns(email)
            entities = self.entity_extractor.extract_entities(email)

            for pattern_type, matches in patterns.items():
                all_patterns[pattern_type].extend(matches)

            for entity_type, entity_list in entities.items():
                all_entities[entity_type].extend(entity_list)

        # Determine dominant category
        category_scores = Counter()
        for pattern_type in all_patterns.keys():
            for category in ['vendor_communication', 'project_management', 'financial_communication', 'client_communication']:
                if pattern_type.startswith(category):
                    category_scores[category] += len(all_patterns[pattern_type])

        dominant_category = category_scores.most_common(1)[0][0] if category_scores else 'general'

        # Generate topic name using ML insights
        topic_name = self._generate_ml_topic_name(emails, all_entities, dominant_category)

        # Calculate confidence based on clustering quality
        confidence = min(0.95, 0.6 + (len(emails) * 0.05))  # Higher confidence for larger clusters

        return {
            'cluster_id': f"ml_cluster_{cluster_id}_{dominant_category}",
            'topic_name': topic_name,
            'topic_category': dominant_category,
            'description': self._generate_ml_description(emails, all_entities),
            'email_ids': [email.id for email in emails],
            'email_count': len(emails),
            'confidence_score': confidence,
            'key_entities': {k: list(set(v)) for k, v in all_entities.items()},
            'key_patterns': list(set(all_patterns.keys())),
            'priority_score': self._calculate_cluster_priority(emails),
        }

    def _generate_topic_name(self, category: str, entities: Dict, patterns: Dict) -> str:
        """
        Generate human-readable topic name
        """
        category_names = {
            'vendor_communication': 'Vendor Communication',
            'project_management': 'Project Updates',
            'financial_communication': 'Financial Matters',
            'client_communication': 'Client Relations'
        }

        base_name = category_names.get(category, 'Communication')

        # Try to make it more specific based on entities
        if 'companies' in entities and entities['companies']:
            return f"{base_name} - {entities['companies'][0]}"
        elif 'projects' in entities and entities['projects']:
            return f"{base_name} - {entities['projects'][0]}"

        return base_name

    def _generate_ml_topic_name(self, emails: List[EmailItem], entities: Dict, category: str) -> str:
        """
        Generate topic name using ML insights
        """
        # Extract common keywords from subjects
        subjects = [email.subject for email in emails]
        subject_text = " ".join(subjects).lower()

        # Find most common meaningful words
        words = re.findall(r'\b[a-z]{3,}\b', subject_text)
        word_freq = Counter(words)

        # Filter out common words
        stop_words = {'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'}
        meaningful_words = [word for word, count in word_freq.most_common(5) if word not in stop_words and count >= 2]

        if meaningful_words:
            return f"{meaningful_words[0].title()} {category.replace('_', ' ').title()}"

        return self._generate_topic_name(category, entities, {})

    def _generate_description(self, category: str, entities: Dict) -> str:
        """
        Generate cluster description
        """
        descriptions = {
            'vendor_communication': 'Communications with vendors and suppliers',
            'project_management': 'Project updates and management discussions',
            'financial_communication': 'Financial and budgetary communications',
            'client_communication': 'Client-related correspondence'
        }

        base_desc = descriptions.get(category, 'General business communication')

        if entities.get('companies'):
            return f"{base_desc} involving {', '.join(entities['companies'][:2])}"

        return base_desc

    def _generate_ml_description(self, emails: List[EmailItem], entities: Dict) -> str:
        """
        Generate description using ML insights
        """
        # Extract key phrases from email bodies
        bodies = [email.body[:200] for email in emails]  # First 200 chars
        combined_text = " ".join(bodies).lower()

        # Look for action-oriented phrases
        action_phrases = re.findall(r'\b(?:need to|should|must|please|urgent|asap|deadline|complete|finish|deliver)\s+\w+', combined_text)

        if action_phrases:
            return f"Discussion thread requiring action: {action_phrases[0]}"

        return f"Communication thread with {len(emails)} messages"

    def _calculate_priority(self, email: EmailItem, patterns: Dict) -> float:
        """
        Calculate priority score for email/cluster
        """
        priority = 2.5  # Base priority

        # Boost for certain patterns
        if any('urgent' in str(v).lower() for v in patterns.values()):
            priority += 1.0
        if any('deadline' in str(v).lower() for v in patterns.values()):
            priority += 0.8
        if any('approval' in str(v).lower() for v in patterns.values()):
            priority += 0.6

        # Boost for recent emails
        if email.date and (datetime.now() - email.date).days <= 1:
            priority += 0.5

        return min(5.0, priority)

    def _calculate_cluster_priority(self, emails: List[EmailItem]) -> float:
        """
        Calculate priority for entire cluster
        """
        priorities = []
        for email in emails:
            patterns = self.pattern_detector.extract_patterns(email)
            priorities.append(self._calculate_priority(email, patterns))

        return sum(priorities) / len(priorities) if priorities else 2.5

    def _get_upgrade_hint(self, category: str) -> str:
        """
        Generate upgrade hints for free users
        """
        hints = {
            'vendor_communication': 'AI could extract action items and track vendor performance',
            'project_management': 'AI could identify project risks and suggest next steps',
            'financial_communication': 'AI could track budget impacts and financial insights',
            'client_communication': 'AI could analyze client sentiment and satisfaction'
        }

        return hints.get(category, 'AI could provide deeper insights and automation')

    def process_email_batch(self, emails: List[EmailItem]) -> ClusteringResult:
        """
        Main entry point for clustering
        """
        start_time = time.time()

        if len(emails) < 2:
            # Not enough emails to cluster
            return ClusteringResult(
                clusters=[],
                unclustered_emails=emails,
                metrics={
                    'total_messages': len(emails),
                    'clusters_found': 0,
                    'messages_clustered': 0,
                    'clustering_rate': 0.0,
                    'time_saved_minutes': 0,
                    'avg_confidence': 0.0,
                    'largest_cluster_size': 0
                },
                upgrade_suggestions=[],
                processing_time_ms=int((time.time() - start_time) * 1000)
            )

        # Choose clustering method based on tier
        if self.user_tier == 'paid' and self.ml_available:
            clusters, unclustered = self._ml_enhanced_clustering(emails)
            self.last_method_used = 'ml_enhanced'
        else:
            clusters, unclustered = self._pattern_based_clustering(emails)
            self.last_method_used = 'pattern_based'

        # Calculate metrics
        messages_clustered = sum(cluster['email_count'] for cluster in clusters)
        clustering_rate = messages_clustered / len(emails) if emails else 0
        avg_confidence = sum(cluster['confidence_score'] for cluster in clusters) / len(clusters) if clusters else 0
        largest_cluster = max([cluster['email_count'] for cluster in clusters], default=0)
        time_saved = messages_clustered * 0.5  # Estimate 30 seconds saved per clustered message

        # Generate upgrade suggestions for free users
        upgrade_suggestions = []
        if self.user_tier == 'free':
            upgrade_suggestions = [
                'Get AI-powered semantic clustering for better accuracy',
                'Unlock automatic action item extraction',
                'Access advanced sentiment analysis',
                'Get personalized priority scoring'
            ]

        processing_time = int((time.time() - start_time) * 1000)

        return ClusteringResult(
            clusters=clusters,
            unclustered_emails=unclustered,
            metrics={
                'total_messages': len(emails),
                'clusters_found': len(clusters),
                'messages_clustered': messages_clustered,
                'clustering_rate': clustering_rate,
                'time_saved_minutes': time_saved,
                'avg_confidence': avg_confidence,
                'largest_cluster_size': largest_cluster
            },
            upgrade_suggestions=upgrade_suggestions,
            processing_time_ms=processing_time
        )

class TieredIntelligenceEngineEnhancement:
    """
    Integration wrapper for existing tiered_intelligence_engine.py
    """

    def __init__(self):
        self.clustering_engine = None

    def initialize_clustering(self, user_id: str, user_tier: str, user_preferences: Dict = None):
        """
        Initialize clustering for a user
        """
        self.clustering_engine = EnhancedClusteringEngine(
            user_tier=user_tier,
            user_preferences=user_preferences or {}
        )

    def enhance_existing_grouping(self, email_items: List[EmailItem], user_id: str) -> Dict:
        """
        Enhance existing digest grouping with clustering
        Returns format compatible with existing digest_items structure
        """
        if not self.clustering_engine:
            raise ValueError("Clustering engine not initialized")

        # Process emails through clustering
        clustering_result = self.clustering_engine.process_email_batch(email_items)

        # Convert clustering result to digest_items format
        digest_items = []

        # Add clustered emails
        for cluster in clustering_result.clusters:
            # Find emails in this cluster
            cluster_emails = [email for email in email_items if email.id in cluster['email_ids']]

            for email in cluster_emails:
                # Enhance metadata with clustering info
                if 'clustering' not in email.metadata:
                    email.metadata['clustering'] = {}

                email.metadata['clustering'] = {
                    'cluster_id': cluster['cluster_id'],
                    'topic_name': cluster['topic_name'],
                    'topic_category': cluster['topic_category'],
                    'cluster_size': cluster['email_count'],
                    'confidence': cluster['confidence_score'],
                    'upgrade_hint': cluster.get('upgrade_hint')
                }

                digest_items.append({
                    'id': email.id,
                    'type': 'email',
                    'title': email.subject,
                    'content': email.body[:500],  # Truncate for digest
                    'metadata': email.metadata,
                    'priority': cluster['priority_score'],
                    'clustering_info': email.metadata['clustering']
                })

        # Add unclustered emails
        for email in clustering_result.unclustered_emails:
            digest_items.append({
                'id': email.id,
                'type': 'email',
                'title': email.subject,
                'content': email.body[:500],
                'metadata': email.metadata,
                'priority': 2.5,  # Default priority
                'clustering_info': None
            })

        return {
            'digest_items': digest_items,
            'clustering_metrics': clustering_result.metrics,
            'upgrade_suggestions': clustering_result.upgrade_suggestions,
            'processing_time_ms': clustering_result.processing_time_ms
        }