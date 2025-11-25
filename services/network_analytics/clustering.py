#!/usr/bin/env python3
"""
Dynamic Project Clustering Module

This module implements sophisticated clustering algorithms for identifying projects
from email, calendar, and chat communications based on participant overlap and
keyword similarity analysis.
"""

import logging
import datetime
import re
from collections import defaultdict, Counter
from typing import List, Dict, Set, Tuple, Any
import numpy as np
from sklearn.cluster import AgglomerativeClustering
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
import networkx as nx

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProjectCluster:
    """Represents a dynamically identified project cluster"""

    def __init__(self, cluster_id: int):
        self.id = cluster_id
        self.interactions = []  # List of interaction IDs
        self.participants = set()  # Set of participant emails
        self.keywords = Counter()  # Keyword frequency counter
        self.start_date = None
        self.end_date = None
        self.project_name = None
        self.is_active = False

    def add_interaction(self, interaction: Dict[str, Any]):
        """Add an interaction to this cluster"""
        self.interactions.append(interaction['id'])
        self.participants.update(interaction['participants'])

        # Update keywords
        for keyword in interaction['keywords']:
            self.keywords[keyword] += 1

        # Update date range
        interaction_date = interaction.get('timestamp')
        if interaction_date:
            if not self.start_date or interaction_date < self.start_date:
                self.start_date = interaction_date
            if not self.end_date or interaction_date > self.end_date:
                self.end_date = interaction_date

    def calculate_similarity(self, other_cluster: 'ProjectCluster') -> float:
        """Calculate similarity score with another cluster"""
        # Participant overlap (Jaccard similarity)
        participant_overlap = len(self.participants.intersection(other_cluster.participants)) / \
                             len(self.participants.union(other_cluster.participants))

        # Keyword similarity (cosine similarity of top keywords)
        self_keywords = [word for word, _ in self.keywords.most_common(20)]
        other_keywords = [word for word, _ in other_cluster.keywords.most_common(20)]

        if not self_keywords or not other_keywords:
            keyword_sim = 0.0
        else:
            all_keywords = list(set(self_keywords + other_keywords))
            self_vector = [1 if kw in self_keywords else 0 for kw in all_keywords]
            other_vector = [1 if kw in other_keywords else 0 for kw in all_keywords]
            keyword_sim = cosine_similarity([self_vector], [other_vector])[0][0]

        # Temporal proximity (if dates are available)
        temporal_sim = 1.0
        if self.end_date and other_cluster.start_date:
            time_diff = abs((self.end_date - other_cluster.start_date).days)
            if time_diff > 14:  # More than 2 weeks apart
                temporal_sim = max(0, 1 - (time_diff - 14) / 30)  # Decay over 30 days

        # Weighted combination
        return 0.4 * participant_overlap + 0.4 * keyword_sim + 0.2 * temporal_sim

    def generate_name(self, nlp_model=None) -> str:
        """Generate a human-readable name for this project"""
        if self.project_name:
            return self.project_name

        # Use most common keywords to generate name
        top_keywords = [word for word, count in self.keywords.most_common(5)]
        if top_keywords:
            self.project_name = " ".join(top_keywords[:3]).title()
        else:
            self.project_name = f"Project {self.id}"

        return self.project_name

class DynamicProjectClustering:
    """Main clustering engine for project identification"""

    def __init__(self, similarity_threshold: float = 0.6, min_interactions: int = 3):
        self.similarity_threshold = similarity_threshold
        self.min_interactions = min_interactions
        self.clusters = []
        self.next_cluster_id = 1
        self.sentence_model = None

    def initialize_sentence_model(self):
        """Initialize sentence transformer for semantic similarity"""
        try:
            self.sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("Sentence transformer model loaded successfully")
        except Exception as e:
            logger.warning(f"Failed to load sentence transformer: {e}")
            self.sentence_model = None

    def extract_interaction_features(self, interaction: Dict[str, Any], nlp_model=None) -> Dict[str, Any]:
        """Extract features from a single interaction"""
        participants = set()

        # Extract participants from different sources
        if 'from_email' in interaction:
            participants.add(interaction['from_email'].lower())
        if 'to_recipients' in interaction:
            participants.update([r.lower() for r in interaction['to_recipients']])
        if 'cc_recipients' in interaction:
            participants.update([r.lower() for r in interaction['cc_recipients']])
        if 'attendees' in interaction:
            participants.update([att['email'].lower() for att in interaction['attendees'] if att.get('email')])

        # Extract keywords
        keywords = set()
        text_sources = []

        if 'subject' in interaction:
            text_sources.append(interaction['subject'])
        if 'body' in interaction:
            text_sources.append(interaction['body'])
        if 'summary' in interaction:
            text_sources.append(interaction['summary'])
        if 'description' in interaction:
            text_sources.append(interaction['description'])

        combined_text = " ".join(text_sources)

        # Extract keywords using NLP if available
        if nlp_model:
            try:
                doc = nlp_model(combined_text.lower())
                for token in doc:
                    if token.is_alpha and not token.is_stop and len(token.text) > 2:
                        if token.pos_ in ["NOUN", "PROPN", "ADJ"]:
                            keywords.add(token.text.lower())
            except Exception as e:
                logger.warning(f"NLP keyword extraction failed: {e}")

        # Fallback to regex-based extraction
        if not keywords:
            words = re.findall(r'\b[a-zA-Z]{3,}\b', combined_text.lower())
            keyword_counts = Counter(words)
            keywords = {word for word, count in keyword_counts.most_common(10)}

        return {
            'id': interaction.get('id', f"interaction_{len(self.clusters)}"),
            'participants': participants,
            'keywords': keywords,
            'timestamp': interaction.get('timestamp'),
            'text': combined_text
        }

    def cluster_interactions(self, interactions: List[Dict[str, Any]], nlp_model=None) -> List[ProjectCluster]:
        """Main clustering algorithm"""
        if not interactions:
            return []

        logger.info(f"Clustering {len(interactions)} interactions")

        # Initialize sentence model for semantic similarity if needed
        if not self.sentence_model:
            self.initialize_sentence_model()

        # Extract features from all interactions
        interaction_features = []
        for interaction in interactions:
            features = self.extract_interaction_features(interaction, nlp_model)
            interaction_features.append(features)

        # Phase 1: Initial clustering based on direct connections (reply-to, thread IDs)
        self._initial_clustering(interaction_features)

        # Phase 2: Iterative clustering based on similarity
        self._iterative_clustering(interaction_features)

        # Phase 3: Merge similar clusters
        self._merge_similar_clusters()

        # Phase 4: Filter and finalize clusters
        self._finalize_clusters()

        logger.info(f"Generated {len(self.clusters)} project clusters")
        return self.clusters

    def _initial_clustering(self, interaction_features: List[Dict[str, Any]]):
        """Initial clustering based on direct connections"""
        thread_clusters = defaultdict(list)

        # Group by thread/reply relationships
        for features in interaction_features:
            thread_id = features.get('thread_id', features['id'])
            thread_clusters[thread_id].append(features)

        # Create initial clusters from threads
        for thread_id, thread_interactions in thread_clusters.items():
            if len(thread_interactions) >= 2:  # Only create clusters for threads with multiple messages
                cluster = ProjectCluster(self.next_cluster_id)
                self.next_cluster_id += 1

                for interaction in thread_interactions:
                    cluster.add_interaction(interaction)

                self.clusters.append(cluster)

    def _iterative_clustering(self, interaction_features: List[Dict[str, Any]]):
        """Iterative clustering based on similarity scores"""
        unclustered = [f for f in interaction_features if not any(f['id'] in c.interactions for c in self.clusters)]

        for interaction in unclustered:
            best_cluster = None
            best_score = 0

            for cluster in self.clusters:
                score = self._calculate_interaction_cluster_similarity(interaction, cluster)
                if score > self.similarity_threshold and score > best_score:
                    best_cluster = cluster
                    best_score = score

            if best_cluster:
                best_cluster.add_interaction(interaction)

    def _calculate_interaction_cluster_similarity(self, interaction: Dict[str, Any], cluster: ProjectCluster) -> float:
        """Calculate how well an interaction fits with a cluster"""
        # Participant overlap
        participant_overlap = len(interaction['participants'].intersection(cluster.participants)) / \
                             len(interaction['participants'].union(cluster.participants)) if interaction['participants'] else 0

        # Keyword similarity
        interaction_keywords = set(interaction['keywords'])
        cluster_keywords = set([word for word, _ in cluster.keywords.most_common(20)])

        if not interaction_keywords or not cluster_keywords:
            keyword_sim = 0
        else:
            keyword_overlap = len(interaction_keywords.intersection(cluster_keywords)) / \
                             len(interaction_keywords.union(cluster_keywords))
            keyword_sim = keyword_overlap

        # Temporal proximity
        temporal_sim = 1.0
        if interaction['timestamp'] and cluster.end_date:
            time_diff = abs((interaction['timestamp'] - cluster.end_date).days)
            if time_diff > 7:
                temporal_sim = max(0, 1 - time_diff / 30)

        return 0.5 * participant_overlap + 0.3 * keyword_sim + 0.2 * temporal_sim

    def _merge_similar_clusters(self):
        """Merge clusters that are too similar"""
        merged = True
        while merged:
            merged = False
            for i in range(len(self.clusters)):
                for j in range(i + 1, len(self.clusters)):
                    if self._should_merge_clusters(self.clusters[i], self.clusters[j]):
                        self._merge_two_clusters(self.clusters[i], self.clusters[j])
                        self.clusters.pop(j)
                        merged = True
                        break
                if merged:
                    break

    def _should_merge_clusters(self, cluster1: ProjectCluster, cluster2: ProjectCluster) -> bool:
        """Determine if two clusters should be merged"""
        similarity = cluster1.calculate_similarity(cluster2)
        participant_overlap = len(cluster1.participants.intersection(cluster2.participants)) / \
                             len(cluster1.participants.union(cluster2.participants))

        return similarity > 0.7 and participant_overlap > 0.5

    def _merge_two_clusters(self, cluster1: ProjectCluster, cluster2: ProjectCluster):
        """Merge two clusters into one"""
        cluster1.interactions.extend(cluster2.interactions)
        cluster1.participants.update(cluster2.participants)

        # Merge keywords
        for keyword, count in cluster2.keywords.items():
            cluster1.keywords[keyword] += count

        # Update date range
        if cluster2.start_date and (not cluster1.start_date or cluster2.start_date < cluster1.start_date):
            cluster1.start_date = cluster2.start_date
        if cluster2.end_date and (not cluster1.end_date or cluster2.end_date > cluster1.end_date):
            cluster1.end_date = cluster2.end_date

    def _finalize_clusters(self):
        """Filter clusters and generate names"""
        self.clusters = [c for c in self.clusters if len(c.interactions) >= self.min_interactions]

        for cluster in self.clusters:
            cluster.generate_name()
            # Mark as active if it has recent activity (within last 30 days)
            if cluster.end_date:
                days_since_last_activity = (datetime.datetime.now() - cluster.end_date).days
                cluster.is_active = days_since_last_activity <= 30

def analyze_collaboration_network(email_data: List[Dict], calendar_data: List[Dict], nlp_model=None) -> Dict[str, Any]:
    """Main function to analyze collaboration network and identify projects"""

    # Combine all interaction data
    all_interactions = []

    # Process email data
    for email in email_data:
        interaction = {
            'id': email.get('id', f"email_{len(all_interactions)}"),
            'from_email': email.get('from_email'),
            'to_recipients': email.get('to_recipients', []),
            'cc_recipients': email.get('cc_recipients', []),
            'subject': email.get('subject', ''),
            'body': email.get('body', ''),
            'timestamp': email.get('timestamp'),
            'thread_id': email.get('threadId'),
            'type': 'email'
        }
        all_interactions.append(interaction)

    # Process calendar data
    for event in calendar_data:
        interaction = {
            'id': event.get('id', f"calendar_{len(all_interactions)}"),
            'organizer_email': event.get('organizer_email'),
            'attendees': event.get('attendees', []),
            'summary': event.get('summary', ''),
            'description': event.get('description', ''),
            'start_time': event.get('start_time'),
            'end_time': event.get('end_time'),
            'type': 'calendar'
        }
        # Convert calendar timestamp to datetime if it's a string
        if isinstance(interaction['start_time'], str):
            try:
                interaction['timestamp'] = datetime.datetime.fromisoformat(interaction['start_time'].replace('Z', '+00:00'))
            except:
                interaction['timestamp'] = None
        else:
            interaction['timestamp'] = interaction['start_time']

        all_interactions.append(interaction)

    # Run clustering algorithm
    clustering_engine = DynamicProjectClustering()
    clusters = clustering_engine.cluster_interactions(all_interactions, nlp_model)

    # Generate network analysis results
    results = {
        'total_projects': len(clusters),
        'active_projects': len([c for c in clusters if c.is_active]),
        'total_interactions': len(all_interactions),
        'projects': []
    }

    # Format cluster data for frontend
    for cluster in clusters:
        project_data = {
            'id': cluster.id,
            'name': cluster.project_name,
            'interaction_count': len(cluster.interactions),
            'participant_count': len(cluster.participants),
            'start_date': cluster.start_date.isoformat() if cluster.start_date else None,
            'end_date': cluster.end_date.isoformat() if cluster.end_date else None,
            'is_active': cluster.is_active,
            'top_keywords': [word for word, _ in cluster.keywords.most_common(5)],
            'participants': list(cluster.participants)
        }
        results['projects'].append(project_data)

    # Calculate network metrics
    results['network_metrics'] = calculate_network_metrics(clusters, all_interactions)

    return results

def calculate_network_metrics(clusters: List[ProjectCluster], interactions: List[Dict]) -> Dict[str, Any]:
    """Calculate network-level metrics"""

    # Build participant-project matrix
    all_participants = set()
    for cluster in clusters:
        all_participants.update(cluster.participants)

    participant_project_matrix = {}
    for participant in all_participants:
        projects = [i for i, cluster in enumerate(clusters) if participant in cluster.participants]
        participant_project_matrix[participant] = projects

    # Calculate network metrics
    metrics = {
        'total_unique_participants': len(all_participants),
        'average_project_participation': sum(len(projects) for projects in participant_project_matrix.values()) / len(all_participants) if all_participants else 0,
        'max_project_participation': max(len(projects) for projects in participant_project_matrix.values()) if participant_project_matrix else 0,
        'project_distribution': Counter(len(projects) for projects in participant_project_matrix.values())
    }

    return metrics
