# Enhanced Clustering Engine for 360Brief
# Integrates with existing tiered_intelligence_engine.py

import re
import json
import numpy as np
from typing import List, Dict, Optional, Set, Tuple
from collections import defaultdict, Counter
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import DBSCAN
from sklearn.metrics.pairwise import cosine_similarity
import spacy

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
    
    def extract_entities(self, email: EmailItem) -> Dict[str, List[str]]:
        """
        Extract business entities (companies, amounts, dates, people)
        """
        combined_text = f"{email.subject} {email.body}"
        entities = {
            'companies': [],
            'amounts': [],
            'dates': [],
            'people': [],
            'emails': []
        }
        
        # Company names
        company_patterns = [
            r'\b[A-Z][a-z]+\s+(?:Corp|Corporation|Inc|LLC|Ltd|Company|Co|Services|Solutions)\b',
            r'\b[A-Z]{2,5}\s+(?:Corp|Corporation|Inc|LLC|Ltd|Company|Co|Services|Solutions)\b'
        ]
        for pattern in company_patterns:
            entities['companies'].extend(re.findall(pattern, combined_text))
        
        # Monetary amounts
        amount_patterns = [
            r'[\$\d,]+(?:\.\d{2})?[KMB]?\b',
            r'\b\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:dollars|USD|usd)\b'
        ]
        for pattern in amount_patterns:
            entities['amounts'].extend(re.findall(pattern, combined_text))
        
        # Email addresses (for tracking communication threads)
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        entities['emails'].extend(re.findall(email_pattern, combined_text))
        
        # Simple person names (from email signatures, etc.)
        name_pattern = r'\b[A-Z][a-z]+\s+[A-Z][a-z]+\b'
        potential_names = re.findall(name_pattern, combined_text)
        # Filter out common false positives
        false_positives = {'Best Regards', 'Thank You', 'Please Let', 'Next Steps'}
        entities['people'] = [name for name in potential_names if name not in false_positives]
        
        return entities

class EnhancedClusteringEngine:
    """
    Main clustering engine that integrates with existing 360Brief architecture
    """
    
    def __init__(self, user_tier: str = 'free', user_preferences: Dict = None):
        self.user_tier = user_tier
        self.preferences = user_preferences or {}
        self.priority_keywords = self.preferences.get('priority_keywords', [])
        self.key_contacts = self.preferences.get('key_contacts', [])
        
        # Initialize components
        self.pattern_detector = ProfessionalPatternDetector()
        
        # Initialize sentence transformer for semantic clustering
        try:
            self.sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
        except Exception as e:
            print(f"Could not load sentence transformer: {e}")
            self.sentence_model = None
        
        # Initialize spaCy if available
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            print("SpaCy model not available. Some features will be limited.")
            self.nlp = None
    
    def process_email_batch(self, email_items: List[EmailItem]) -> ClusteringResult:
        """
        Main processing method - integrates with existing tiered_intelligence_engine.py
        """
        start_time = datetime.now()
        
        if not email_items:
            return self._empty_result()
        
        # Step 1: Extract patterns and entities from all emails
        enriched_emails = self._enrich_emails_with_patterns(email_items)
        
        # Step 2: Perform clustering based on patterns and semantics
        clusters = self._cluster_emails(enriched_emails)
        
        # Step 3: Generate cluster summaries and metadata
        cluster_results = self._generate_cluster_results(clusters, enriched_emails)
        
        # Step 4: Identify unclustered emails
        clustered_email_ids = set()
        for cluster in cluster_results:
            clustered_email_ids.update(cluster['email_ids'])
        
        unclustered_emails = [
            email for email in email_items 
            if email.id not in clustered_email_ids
        ]
        
        # Step 5: Calculate metrics and upgrade suggestions
        metrics = self._calculate_metrics(email_items, cluster_results, unclustered_emails)
        upgrade_suggestions = self._generate_upgrade_suggestions(cluster_results)
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return ClusteringResult(
            clusters=cluster_results,
            unclustered_emails=unclustered_emails,
            metrics=metrics,
            upgrade_suggestions=upgrade_suggestions,
            processing_time_ms=int(processing_time)
        )
    
    def _enrich_emails_with_patterns(self, emails: List[EmailItem]) -> List[Dict]:
        """
        Extract patterns and entities from emails
        """
        enriched = []
        
        for email in emails:
            # Extract professional patterns
            patterns = self.pattern_detector.extract_patterns(email)
            entities = self.pattern_detector.extract_entities(email)
            
            # Create combined text for semantic analysis
            combined_text = f"{email.subject} {email.body}"
            clean_text = self._clean_text(combined_text)
            
            # Check for priority keywords and key contacts
            priority_score = self._calculate_priority_score(email, patterns, entities)
            
            enriched_email = {
                'email': email,
                'patterns': patterns,
                'entities': entities,
                'clean_text': clean_text,
                'priority_score': priority_score,
                'thread_context': self._extract_thread_context(email)
            }
            
            enriched.append(enriched_email)
        
        return enriched
    
    def _cluster_emails(self, enriched_emails: List[Dict]) -> List[List[int]]:
        """
        Cluster emails based on patterns, entities, and semantic similarity
        """
        if len(enriched_emails) < 2:
            return []
        
        # Strategy 1: Pattern-based clustering
        pattern_clusters = self._cluster_by_patterns(enriched_emails)
        
        # Strategy 2: Entity-based clustering
        entity_clusters = self._cluster_by_entities(enriched_emails)
        
        # Strategy 3: Semantic clustering (if available)
        semantic_clusters = []
        if self.sentence_model:
            semantic_clusters = self._cluster_by_semantics(enriched_emails)
        
        # Merge clustering results intelligently
        final_clusters = self._merge_clustering_results(
            pattern_clusters, entity_clusters, semantic_clusters, enriched_emails
        )
        
        return final_clusters
    
    def _cluster_by_patterns(self, enriched_emails: List[Dict]) -> List[List[int]]:
        """
        Cluster emails based on detected professional patterns
        """
        clusters = defaultdict(list)
        
        for i, enriched_email in enumerate(enriched_emails):
            patterns = enriched_email['patterns']
            
            # Create pattern signature
            pattern_signature = set()
            for pattern_type, matches in patterns.items():
                if matches:  # If pattern was detected
                    pattern_signature.add(pattern_type)
            
            # Find existing cluster with similar pattern signature
            best_cluster = None
            best_overlap = 0
            
            for cluster_key, cluster_indices in clusters.items():
                # Calculate pattern overlap with existing cluster
                cluster_patterns = set()
                for idx in cluster_indices:
                    for pattern_type in enriched_emails[idx]['patterns']:
                        if enriched_emails[idx]['patterns'][pattern_type]:
                            cluster_patterns.add(pattern_type)
                
                overlap = len(pattern_signature & cluster_patterns)
                overlap_ratio = overlap / max(len(pattern_signature | cluster_patterns), 1)
                
                if overlap_ratio > 0.5 and overlap > best_overlap:
                    best_cluster = cluster_key
                    best_overlap = overlap
            
            if best_cluster is not None:
                clusters[best_cluster].append(i)
            else:
                # Create new cluster
                new_key = f"pattern_{len(clusters)}"
                clusters[new_key].append(i)
        
        # Return only clusters with 2+ emails
        return [cluster for cluster in clusters.values() if len(cluster) >= 2]
    
    def _cluster_by_entities(self, enriched_emails: List[Dict]) -> List[List[int]]:
        """
        Cluster emails based on shared entities (companies, amounts, people)
        """
        clusters = defaultdict(list)
        
        for i, enriched_email in enumerate(enriched_emails):
            entities = enriched_email['entities']
            
            # Create entity signature
            entity_signature = set()
            for entity_type, entity_list in entities.items():
                entity_signature.update([f"{entity_type}:{entity}" for entity in entity_list])
            
            # Find existing cluster with overlapping entities
            best_cluster = None
            best_overlap_ratio = 0
            
            for cluster_key, cluster_indices in clusters.items():
                cluster_entities = set()
                for idx in cluster_indices:
                    for entity_type, entity_list in enriched_emails[idx]['entities'].items():
                        cluster_entities.update([f"{entity_type}:{entity}" for entity in entity_list])
                
                if not cluster_entities:
                    continue
                
                overlap = len(entity_signature & cluster_entities)
                total_entities = len(entity_signature | cluster_entities)
                overlap_ratio = overlap / max(total_entities, 1)
                
                if overlap_ratio > 0.3 and overlap_ratio > best_overlap_ratio:
                    best_cluster = cluster_key
                    best_overlap_ratio = overlap_ratio
            
            if best_cluster is not None:
                clusters[best_cluster].append(i)
            else:
                new_key = f"entity_{len(clusters)}"
                clusters[new_key].append(i)
        
        return [cluster for cluster in clusters.values() if len(cluster) >= 2]
    
    def _cluster_by_semantics(self, enriched_emails: List[Dict]) -> List[List[int]]:
        """
        Cluster emails based on semantic similarity
        """
        if not self.sentence_model or len(enriched_emails) < 2:
            return []
        
        # Get embeddings for all emails
        texts = [email['clean_text'] for email in enriched_emails]
        embeddings = self.sentence_model.encode(texts)
        
        # Calculate similarity matrix
        similarity_matrix = cosine_similarity(embeddings)
        distance_matrix = 1 - similarity_matrix
        
        # Use DBSCAN for clustering
        clustering = DBSCAN(
            metric='precomputed',
            eps=0.25,  # 0.75 similarity threshold
            min_samples=2
        ).fit(distance_matrix)
        
        # Group by cluster labels
        clusters = defaultdict(list)
        for idx, cluster_id in enumerate(clustering.labels_):
            if cluster_id != -1:  # -1 means noise/outlier
                clusters[cluster_id].append(idx)
        
        return list(clusters.values())
    
    def _merge_clustering_results(self, pattern_clusters: List[List[int]], 
                                entity_clusters: List[List[int]],
                                semantic_clusters: List[List[int]],
                                enriched_emails: List[Dict]) -> List[List[int]]:
        """
        Intelligently merge different clustering results
        """
        final_clusters = []
        used_indices = set()
        
        # Priority 1: Pattern clusters (most reliable for professional context)
        for cluster in pattern_clusters:
            if not any(idx in used_indices for idx in cluster):
                final_clusters.append(cluster)
                used_indices.update(cluster)
        
        # Priority 2: Entity clusters that don't significantly overlap
        for cluster in entity_clusters:
            overlap = len(set(cluster) & used_indices)
            if overlap / len(cluster) < 0.5:  # Less than 50% overlap
                final_clusters.append(cluster)
                used_indices.update(cluster)
        
        # Priority 3: Semantic clusters for remaining emails
        for cluster in semantic_clusters:
            overlap = len(set(cluster) & used_indices)
            if overlap / len(cluster) < 0.5:
                final_clusters.append(cluster)
                used_indices.update(cluster)
        
        return final_clusters
    
    def _generate_cluster_results(self, clusters: List[List[int]], 
                                enriched_emails: List[Dict]) -> List[Dict]:
        """
        Generate cluster metadata and summaries
        """
        cluster_results = []
        
        for i, cluster_indices in enumerate(clusters):
            cluster_emails = [enriched_emails[idx] for idx in cluster_indices]
            
            # Generate cluster metadata
            cluster_info = self._analyze_cluster(cluster_emails)
            
            # Create cluster result
            cluster_result = {
                'cluster_id': f"cluster_{i}_{cluster_info['topic_category']}",
                'topic_name': cluster_info['topic_name'],
                'topic_category': cluster_info['topic_category'],
                'description': cluster_info['description'],
                'email_ids': [email['email'].id for email in cluster_emails],
                'email_count': len(cluster_emails),
                'confidence_score': cluster_info['confidence'],
                'key_entities': cluster_info['key_entities'],
                'key_patterns': cluster_info['key_patterns'],
                'priority_score': cluster_info['priority_score'],
                'time_span': cluster_info['time_span'],
                'upgrade_hint': self._generate_cluster_upgrade_hint(cluster_info)
            }
            
            # Update email metadata with cluster information
            for email_data in cluster_emails:
                email = email_data['email']
                if 'clustering' not in email.metadata:
                    email.metadata['clustering'] = {}
                
                email.metadata['clustering'] = {
                    'cluster_id': cluster_result['cluster_id'],
                    'topic_name': cluster_result['topic_name'],
                    'topic_category': cluster_result['topic_category'],
                    'cluster_size': cluster_result['email_count'],
                    'confidence': cluster_result['confidence_score']
                }
            
            cluster_results.append(cluster_result)
        
        return cluster_results
    
    def _analyze_cluster(self, cluster_emails: List[Dict]) -> Dict:
        """
        Analyze a cluster to determine topic, confidence, and key information
        """
        # Collect all patterns and entities
        all_patterns = defaultdict(list)
        all_entities = defaultdict(list)
        all_subjects = []
        all_senders = set()
        all_dates = []
        total_priority = 0
        
        for email_data in cluster_emails:
            email = email_data['email']
            patterns = email_data['patterns']
            entities = email_data['entities']
            
            # Collect patterns
            for pattern_type, matches in patterns.items():
                all_patterns[pattern_type].extend(matches)
            
            # Collect entities
            for entity_type, entity_list in entities.items():
                all_entities[entity_type].extend(entity_list)
            
            all_subjects.append(email.subject)
            all_senders.add(email.from_address)
            all_dates.append(email.date)
            total_priority += email_data['priority_score']
        
        # Determine topic category and name
        topic_info = self._determine_topic_from_patterns(all_patterns, all_entities, all_subjects)
        
        # Calculate confidence based on pattern strength and entity overlap
        confidence = self._calculate_cluster_confidence(all_patterns, all_entities, cluster_emails)
        
        # Calculate time span
        if all_dates:
            time_span_days = (max(all_dates) - min(all_dates)).days
        else:
            time_span_days = 0
        
        return {
            'topic_name': topic_info['name'],
            'topic_category': topic_info['category'],
            'description': topic_info['description'],
            'confidence': confidence,
            'key_entities': self._get_top_entities(all_entities),
            'key_patterns': self._get_top_patterns(all_patterns),
            'priority_score': total_priority / len(cluster_emails),
            'time_span': time_span_days,
            'sender_count': len(all_senders)
        }
    
    def _determine_topic_from_patterns(self, patterns: Dict, entities: Dict, subjects: List[str]) -> Dict:
        """
        Determine topic name and category from patterns and entities
        """
        # Count pattern types to determine dominant category
        category_scores = defaultdict(int)
        
        for pattern_type, matches in patterns.items():
            if matches:
                if 'vendor' in pattern_type or 'quote' in pattern_type or 'invoice' in pattern_type:
                    category_scores['vendor_management'] += len(matches)
                elif 'project' in pattern_type or 'status' in pattern_type:
                    category_scores['project_management'] += len(matches)
                elif 'meeting' in pattern_type:
                    category_scores['meetings'] += len(matches)
                elif 'financial' in pattern_type or 'budget' in pattern_type:
                    category_scores['finance'] += len(matches)
                elif 'client' in pattern_type:
                    category_scores['client_communication'] += len(matches)
        
        # Determine primary category
        if category_scores:
            primary_category = max(category_scores.items(), key=lambda x: x[1])[0]
        else:
            primary_category = 'general'
        
        # Generate topic name based on entities and patterns
        topic_name = self._generate_topic_name(primary_category, entities, subjects, patterns)
        
        # Generate description
        description = self._generate_topic_description(primary_category, entities, len(subjects))
        
        return {
            'name': topic_name,
            'category': primary_category,
            'description': description
        }
    
    def _generate_topic_name(self, category: str, entities: Dict, subjects: List[str], patterns: Dict) -> str:
        """
        Generate human-readable topic name
        """
        # Get most common company if available
        companies = entities.get('companies', [])
        company_counts = Counter(companies)
        top_company = company_counts.most_common(1)[0][0] if company_counts else None
        
        # Get most common subject words
        subject_words = []
        for subject in subjects:
            words = re.findall(r'\b[A-Za-z]{3,}\b', subject.lower())
            subject_words.extend(words)
        
        common_words = [word for word, count in Counter(subject_words).most_common(3) 
                       if word not in {'the', 'and', 'for', 'with', 'your', 'our', 'this', 'that'}]
        
        # Generate name based on category
        if category == 'vendor_management':
            if top_company:
                if any('quote' in p for p in patterns.keys()):
                    return f"{top_company} Quotes & Estimates"
                else:
                    return f"{top_company} Communications"
            elif common_words:
                return f"{common_words[0].title()} Vendor Communications"
            else:
                return "Vendor Communications"
        
        elif category == 'project_management':
            if common_words:
                return f"{common_words[0].title()} Project Updates"
            else:
                return "Project Communications"
        
        elif category == 'meetings':
            if common_words:
                return f"{common_words[0].title()} Meetings"
            else:
                return "Meeting Communications"
        
        elif category == 'finance':
            return "Financial Communications"
        
        elif category == 'client_communication':
            if top_company:
                return f"{top_company} Client Communications"
            else:
                return "Client Communications"
        
        else:
            if common_words:
                return f"{common_words[0].title()} Discussion"
            else:
                return "Email Thread"
    
    def _generate_topic_description(self, category: str, entities: Dict, email_count: int) -> str:
        """
        Generate topic description
        """
        descriptions = {
            'vendor_management': f"Communications with vendors and contractors ({email_count} messages)",
            'project_management': f"Project status updates and coordination ({email_count} messages)",
            'meetings': f"Meeting arrangements and follow-ups ({email_count} messages)",
            'finance': f"Financial discussions and approvals ({email_count} messages)",
            'client_communication': f"Client interactions and requirements ({email_count} messages)",
            'general': f"Related email communications ({email_count} messages)"
        }
        
        return descriptions.get(category, f"Email thread with {email_count} messages")
    
    def _calculate_cluster_confidence(self, patterns: Dict, entities: Dict, cluster_emails: List[Dict]) -> float:
        """
        Calculate confidence score for clustering
        """
        # Base confidence from pattern overlap
        pattern_strength = min(len([p for p in patterns.values() if p]), 5) / 5.0
        
        # Entity overlap strength
        entity_overlap = 0
        if len(cluster_emails) > 1:
            shared_entities = 0
            total_entities = 0
            
            for entity_type, entity_list in entities.items():
                entity_counts = Counter(entity_list)
                shared_entities += sum(1 for count in entity_counts.values() if count > 1)
                total_entities += len(entity_counts)
            
            if total_entities > 0:
                entity_overlap = shared_entities / total_entities
        
        # Semantic consistency (if available)
        semantic_score = 0.5  # Default neutral score
        
        # Combined confidence
        confidence = (pattern_strength * 0.4 + entity_overlap * 0.4 + semantic_score * 0.2)
        return min(confidence, 0.95)  # Cap at 95%
    
    def _get_top_entities(self, entities: Dict) -> Dict:
        """
        Get top entities by frequency
        """
        top_entities = {}
        for entity_type, entity_list in entities.items():
            if entity_list:
                top_entities[entity_type] = [
                    entity for entity, count in Counter(entity_list).most_common(3)
                ]
        return top_entities
    
    def _get_top_patterns(self, patterns: Dict) -> List[str]:
        """
        Get most significant patterns detected
        """
        significant_patterns = []
        for pattern_type, matches in patterns.items():
            if matches:
                significant_patterns.append(pattern_type)
        return significant_patterns[:5]  # Top 5 patterns
    
    def _generate_cluster_upgrade_hint(self, cluster_info: Dict) -> Optional[str]:
        """
        Generate subtle upgrade hint for free tier users
        """
        if self.user_tier != 'free':
            return None
        
        category = cluster_info['topic_category']
        email_count = cluster_info.get('email_count', 0)
        
        hints = {
            'vendor_management': f"AI could compare {email_count} vendor quotes and highlight best options",
            'project_management': f"AI could extract action items from {email_count} project updates",
            'meetings': f"AI could summarize key decisions from {email_count} meeting discussions",
            'finance': f"AI could identify approval requirements in {email_count} financial messages",
            'client_communication': f"AI could track client requirements across {email_count} messages"
        }
        
        return hints.get(category, f"AI could provide smart summaries for this {email_count}-message thread")
    
    def _calculate_metrics(self, original_emails: List[EmailItem], 
                         clusters: List[Dict], unclustered_emails: List[EmailItem]) -> Dict:
        """
        Calculate clustering performance metrics
        """
        total_messages = len(original_emails)
        clustered_messages = sum(cluster['email_count'] for cluster in clusters)
        clustering_rate = clustered_messages / total_messages if total_messages > 0 else 0
        
        # Estimate time saved (rough calculation)
        time_saved_minutes = max(1, int(clustered_messages * 0.5))  # 30 seconds saved per clustered message
        
        # Calculate average cluster size
        avg_cluster_size = clustered_messages / len(clusters) if clusters else 0
        
        return {
            'total_messages': total_messages,
            'clusters_found': len(clusters),
            'messages_clustered': clustered_messages,
            'messages_unclustered': len(unclustered_emails),
            'clustering_rate': round(clustering_rate, 3),
            'time_saved_minutes': time_saved_minutes,
            'average_cluster_size': round(avg_cluster_size, 1),
            'largest_cluster_size': max([c['email_count'] for c in clusters], default=0),
            'confidence_scores': [c['confidence_score'] for c in clusters],
            'avg_confidence': round(sum(c['confidence_score'] for c in clusters) / len(clusters), 3) if clusters else 0
        }
    
    def _generate_upgrade_suggestions(self, clusters: List[Dict]) -> List[str]:
        """
        Generate upgrade suggestions for free tier users
        """
        if self.user_tier != 'free':
            return []
        
        suggestions = []
        
        # Add general suggestions based on clustering results
        if len(clusters) >= 3:
            suggestions.append("AI could create executive summaries for each topic cluster")
        
        # Add specific suggestions based on cluster types
        vendor_clusters = [c for c in clusters if 'vendor' in c['topic_category']]
        if vendor_clusters:
            suggestions.append("AI could automatically compare vendor quotes and extract key differences")
        
        project_clusters = [c for c in clusters if 'project' in c['topic_category']]
        if project_clusters:
            suggestions.append("AI could track project status and identify blockers across updates")
        
        # Add suggestion for high-confidence clusters
        high_conf_clusters = [c for c in clusters if c['confidence_score'] > 0.8]
        if len(high_conf_clusters) >= 2:
            suggestions.append("AI could identify relationships between different topics")
        
        return suggestions[:3]  # Limit to 3 suggestions to avoid overwhelming
    
    def _calculate_priority_score(self, email: EmailItem, patterns: Dict, entities: Dict) -> float:
        """
        Calculate priority score based on user preferences and content
        """
        score = 0.0
        
        # Check for priority keywords
        combined_text = f"{email.subject} {email.body}".lower()
        for keyword in self.priority_keywords:
            if keyword.lower() in combined_text:
                score += 0.3
        
        # Check for key contacts
        for contact in self.key_contacts:
            if contact.lower() in email.from_address.lower():
                score += 0.5
        
        # Check for urgency patterns
        urgency_patterns = [
            r'\b(?:urgent|asap|immediate|critical|emergency)\b',
            r'\b(?:deadline|due today|overdue)\b',
            r'\b(?:please respond|need response|waiting for)\b'
        ]
        
        for pattern in urgency_patterns:
            if re.search(pattern, combined_text, re.IGNORECASE):
                score += 0.2
        
        # Check for financial indicators (often high priority)
        if entities.get('amounts') or any('financial' in p for p in patterns.keys()):
            score += 0.2
        
        return min(score, 1.0)  # Cap at 1.0
    
    def _extract_thread_context(self, email: EmailItem) -> Dict:
        """
        Extract context about email thread relationships
        """
        context = {
            'is_reply': email.subject.lower().startswith(('re:', 'fwd:', 'fw:')),
            'thread_id': email.thread_id,
            'has_thread': bool(email.thread_id)
        }
        
        # Extract reply indicators from body
        reply_indicators = [
            r'wrote:|said:|on .* wrote:',
            r'from:.*sent:.*to:.*subject:',
            r'original message|original appointment'
        ]
        
        for pattern in reply_indicators:
            if re.search(pattern, email.body, re.IGNORECASE):
                context['has_quoted_content'] = True
                break
        else:
            context['has_quoted_content'] = False
        
        return context
    
    def _clean_text(self, text: str) -> str:
        """
        Clean text for analysis
        """
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', ' ', text)
        
        # Remove email signatures and quoted content
        text = re.sub(r'\n\s*--+.*', '', text, flags=re.DOTALL)
        text = re.sub(r'\n\s*From:.*', '', text, flags=re.DOTALL)
        text = re.sub(r'On .* wrote:.*', '', text, flags=re.DOTALL)
        
        # Remove URLs and email addresses
        text = re.sub(r'http\S+|www\S+', ' URL ', text)
        text = re.sub(r'\S+@\S+', ' EMAIL ', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()
    
    def _empty_result(self) -> ClusteringResult:
        """
        Return empty clustering result
        """
        return ClusteringResult(
            clusters=[],
            unclustered_emails=[],
            metrics={
                'total_messages': 0,
                'clusters_found': 0,
                'messages_clustered': 0,
                'messages_unclustered': 0,
                'clustering_rate': 0,
                'time_saved_minutes': 0,
                'average_cluster_size': 0,
                'largest_cluster_size': 0,
                'confidence_scores': [],
                'avg_confidence': 0
            },
            upgrade_suggestions=[],
            processing_time_ms=0
        )

# Integration wrapper for existing 360Brief architecture
class TieredIntelligenceEngineEnhancement:
    """
    Wrapper to integrate with existing tiered_intelligence_engine.py
    """
    
    def __init__(self):
        self.clustering_engine = None
    
    def initialize_clustering(self, user_id: str, user_tier: str = 'free') -> None:
        """
        Initialize clustering engine with user preferences
        """
        # This would integrate with your existing user preferences system
        user_preferences = self._get_user_preferences(user_id)
        
        self.clustering_engine = EnhancedClusteringEngine(
            user_tier=user_tier,
            user_preferences=user_preferences
        )
    
    def enhance_existing_grouping(self, email_items: List[EmailItem], user_id: str) -> Dict:
        """
        Drop-in enhancement for existing email grouping logic
        """
        if not self.clustering_engine:
            # Get user info from your existing systems
            user_tier = self._get_user_tier(user_id)
            self.initialize_clustering(user_id, user_tier)
        
        # Process emails with enhanced clustering
        clustering_result = self.clustering_engine.process_email_batch(email_items)
        
        # Convert to format compatible with existing digest generation
        return self._convert_to_digest_format(clustering_result)
    
    def _get_user_preferences(self, user_id: str) -> Dict:
        """
        Fetch user preferences from your database
        Replace with actual database call
        """
        # This should integrate with your existing user_preferences table
        return {
            'priority_keywords': [],  # From user_preferences.priority_keywords
            'key_contacts': [],       # From user_preferences.key_contacts
            'industry': None,         # From new user_preferences.industry field
            'role': None             # From new user_preferences.role field
        }
    
    def _get_user_tier(self, user_id: str) -> str:
        """
        Determine user tier (free/paid)
        Replace with actual subscription check
        """
        # This should check user's subscription status
        return 'free'  # Default to free
    
    def _convert_to_digest_format(self, clustering_result: ClusteringResult) -> Dict:
        """
        Convert clustering result to format expected by digest generation
        """
        # Format for integration with existing digest_items table
        digest_items = []
        
        for cluster in clustering_result.clusters:
            digest_item = {
                'type': 'cluster',
                'title': cluster['topic_name'],
                'summary': cluster['description'],
                'email_ids': cluster['email_ids'],
                'metadata': {
                    'cluster_id': cluster['cluster_id'],
                    'topic_category': cluster['topic_category'],
                    'confidence_score': cluster['confidence_score'],
                    'key_entities': cluster['key_entities'],
                    'upgrade_hint': cluster.get('upgrade_hint'),
                    'clustering_stats': clustering_result.metrics
                }
            }
            digest_items.append(digest_item)
        
        # Add unclustered emails as individual items
        for email in clustering_result.unclustered_emails:
            digest_item = {
                'type': 'individual',
                'title': email.subject,
                'summary': f"Individual email from {email.from_address}",
                'email_ids': [email.id],
                'metadata': {
                    'standalone': True
                }
            }
            digest_items.append(digest_item)
        
        return {
            'digest_items': digest_items,
            'clustering_metrics': clustering_result.metrics,
            'upgrade_suggestions': clustering_result.upgrade_suggestions,
            'processing_time_ms': clustering_result.processing_time_ms
        }

# Example usage and testing
def test_enhanced_clustering():
    """
    Test function to validate the enhanced clustering
    """
    # Sample emails matching your EmailItem structure
    sample_emails = [
        EmailItem(
            id="email_1",
            subject="HVAC Quote - Heating System Replacement",
            body="Thank you for your interest. We can replace your heating system for $4,500.",
            from_address="quotes@abchvac.com",
            to=["user@example.com"],
            date=datetime(2024, 1, 15, 10, 30),
            thread_id="thread_hvac_1"
        ),
        EmailItem(
            id="email_2", 
            subject="Re: Air Conditioning Estimate Request",
            body="Our quote for HVAC installation is $5,200 including all materials.",
            from_address="estimates@xyzhvac.com",
            to=["user@example.com"],
            date=datetime(2024, 1, 16, 14, 20),
            thread_id="thread_hvac_2"
        ),
        EmailItem(
            id="email_3",
            subject="Project Alpha Status Update",
            body="Project Alpha is on track. We completed milestone 2 and are proceeding to phase 3.",
            from_address="pm@company.com",
            to=["user@example.com"],
            date=datetime(2024, 1, 17, 9, 15),
            thread_id="thread_project_1"
        )
    ]
    
    # Initialize clustering engine
    engine = EnhancedClusteringEngine(user_tier='free')
    
    # Process emails
    result = engine.process_email_batch(sample_emails)
    
    # Display results
    print("=== Enhanced Clustering Results ===")
    print(f"Processing time: {result.processing_time_ms}ms")
    print(f"Metrics: {json.dumps(result.metrics, indent=2)}")
    print(f"\nClusters found: {len(result.clusters)}")
    
    for i, cluster in enumerate(result.clusters):
        print(f"\nCluster {i+1}: {cluster['topic_name']}")
        print(f"  Category: {cluster['topic_category']}")
        print(f"  Emails: {cluster['email_count']}")
        print(f"  Confidence: {cluster['confidence_score']:.2f}")
        print(f"  Description: {cluster['description']}")
        if cluster.get('upgrade_hint'):
            print(f"  💡 Upgrade hint: {cluster['upgrade_hint']}")
    
    print(f"\nUnclustered emails: {len(result.unclustered_emails)}")
    print(f"Upgrade suggestions: {result.upgrade_suggestions}")

if __name__ == "__main__":
    test_enhanced_clustering()
