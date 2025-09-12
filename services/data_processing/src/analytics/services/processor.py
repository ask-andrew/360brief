from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
import pandas as pd
import numpy as np
from collections import defaultdict
import networkx as nx
import re

from ..models.communication import (
    CommunicationType, Direction, EmailCommunication, SlackCommunication, 
    MeetingCommunication, CommunicationStats, CommunicationAnalytics
)


class CommunicationProcessor:
    """Processes communication data and generates analytics."""
    
    def __init__(self):
        self.communications = []
        self.contacts = {}
        self.network_graph = nx.Graph()
        self.structured_data = {
            'projects': [],
            'incidents': [],
            'financials': [],
            'key_people': {},
            'action_items': [],
            'decisions': [],
            'achievements': []
        }
        
    def add_communication(self, comm):
        """Add a communication record to the processor."""
        self.communications.append(comm)
        self._update_contacts(comm)
        self._update_network_graph(comm)
        self._process_content(comm)
    
    def _update_contacts(self, comm):
        """Update internal contact information."""
        for participant in comm.participants:
            if participant.id not in self.contacts:
                self.contacts[participant.id] = {
                    'name': participant.name,
                    'email': participant.email,
                    'is_external': participant.is_external,
                    'interaction_count': 0,
                    'last_interaction': None
                }
            
            self.contacts[participant.id]['interaction_count'] += 1
            if not self.contacts[participant.id]['last_interaction'] or \
               comm.timestamp > self.contacts[participant.id]['last_interaction']:
                self.contacts[participant.id]['last_interaction'] = comm.timestamp
    
    def _update_network_graph(self, comm):
        """Update the network graph with communication data."""
        if not comm.participants:
            return
            
        # Get all unique participant IDs
        participant_ids = [p.id for p in comm.participants]
        
        # Add nodes for all participants
        for p in comm.participants:
            if not self.network_graph.has_node(p.id):
                self.network_graph.add_node(p.id, 
                                         name=p.name,
                                         email=p.email,
                                         is_external=p.is_external)
        
        # Add edges between all participants in this communication
        for i in range(len(participant_ids)):
            for j in range(i + 1, len(participant_ids)):
                n1, n2 = participant_ids[i], participant_ids[j]
                if self.network_graph.has_edge(n1, n2):
                    # Increment weight if edge exists
                    self.network_graph[n1][n2]['weight'] += 1
                else:
                    # Create new edge with weight 1
                    self.network_graph.add_edge(n1, n2, weight=1)
    
    def generate_analytics(self, start_date: datetime = None, 
                         end_date: datetime = None) -> CommunicationAnalytics:
        """Generate analytics for the given time period."""
        # Filter communications by date range if provided
        comms = self._filter_by_date_range(self.communications, start_date, end_date)
        
        # Generate stats by communication type
        email_comms = [c for c in comms if isinstance(c, EmailCommunication)]
        slack_comms = [c for c in comms if isinstance(c, SlackCommunication)]
        meeting_comms = [c for c in comms if isinstance(c, MeetingCommunication)]
        
        # Calculate stats
        email_stats = self._calculate_communication_stats(email_comms, CommunicationType.EMAIL)
        slack_stats = self._calculate_communication_stats(slack_comms, CommunicationType.SLACK)
        meeting_stats = self._calculate_meeting_stats(meeting_comms)
        combined_stats = self._calculate_communication_stats(comms, None)
        
        # Get top contacts
        top_contacts = self._get_top_contacts(limit=10)
        
        # Generate time series data
        time_series = self._generate_time_series(comms, start_date, end_date)
        
        # Generate network graph data
        network_data = self._generate_network_data()
        
        return CommunicationAnalytics(
            email_stats=email_stats,
            slack_stats=slack_stats,
            meeting_stats=meeting_stats,
            combined_stats=combined_stats,
            top_contacts=top_contacts,
            time_series_data=time_series,
            network_graph=network_data
        )
    
    def _filter_by_date_range(self, communications, start_date, end_date):
        """Filter communications by date range."""
        if not start_date and not end_date:
            return communications
            
        filtered = []
        for comm in communications:
            if start_date and comm.timestamp < start_date:
                continue
            if end_date and comm.timestamp > end_date:
                continue
            filtered.append(comm)
        return filtered
    
    def _calculate_communication_stats(self, communications, comm_type):
        """Calculate statistics for a list of communications."""
        if not communications:
            return CommunicationStats()
            
        inbound = [c for c in communications if c.direction == Direction.INBOUND]
        outbound = [c for c in communications if c.direction == Direction.OUTBOUND]
        
        # Calculate response times (for emails and Slack)
        response_times = []
        if comm_type in [CommunicationType.EMAIL, CommunicationType.SLACK]:
            response_times = self._calculate_response_times(communications)
        
        # Calculate engagement by contact
        engagement = defaultdict(int)
        for comm in communications:
            for p in comm.participants:
                engagement[p.id] += 1
        
        # Calculate volume by date
        volume_by_date = defaultdict(int)
        for comm in communications:
            date_str = comm.timestamp.strftime('%Y-%m-%d')
            volume_by_date[date_str] += 1
        
        return CommunicationStats(
            total_count=len(communications),
            inbound_count=len(inbound),
            outbound_count=len(outbound),
            avg_response_time_minutes=np.mean(response_times) if response_times else None,
            engagement_by_contact=dict(engagement),
            volume_by_date=dict(volume_by_date)
        )
    
    def _calculate_meeting_stats(self, meetings):
        """Calculate meeting-specific statistics."""
        if not meetings:
            return {}
            
        total_duration = sum(m.duration_minutes for m in meetings)
        avg_duration = total_duration / len(meetings) if meetings else 0
        
        # Categorize meetings
        meeting_types = defaultdict(int)
        for m in meetings:
            if len(m.participants) <= 2:
                meeting_types['1:1'] += 1
            elif any(p.is_external for p in m.participants):
                meeting_types['External'] += 1
            else:
                meeting_types['Internal'] += 1
        
        return {
            'total_meetings': len(meetings),
            'total_hours': round(total_duration / 60, 1),
            'avg_duration_minutes': round(avg_duration, 1),
            'meetings_by_type': dict(meeting_types),
            'participant_stats': self._calculate_participant_stats(meetings)
        }
    
    def _calculate_participant_stats(self, meetings):
        """Calculate participant statistics for meetings."""
        if not meetings:
            return {}
            
        participant_counts = [len(m.participants) for m in meetings]
        return {
            'total_participants': sum(participant_counts),
            'avg_participants_per_meeting': round(np.mean(participant_counts), 1) if participant_counts else 0,
            'max_participants': max(participant_counts) if participant_counts else 0
        }
    
    def _calculate_response_times(self, communications):
        """Calculate response times for communications (emails/Slack)."""
        # Group communications by thread
        threads = {}
        for comm in communications:
            thread_id = getattr(comm, 'thread_id', None) or getattr(comm, 'channel_id', '') + getattr(comm, 'thread_ts', '')
            if not thread_id:
                continue
                
            if thread_id not in threads:
                threads[thread_id] = []
            threads[thread_id].append(comm)
        
        # Calculate response times for each thread
        response_times = []
        for thread_comms in threads.values():
            # Sort by timestamp
            sorted_comms = sorted(thread_comms, key=lambda x: x.timestamp)
            
            # Look for reply pairs
            for i in range(1, len(sorted_comms)):
                prev_comm = sorted_comms[i-1]
                curr_comm = sorted_comms[i]
                
                # Only consider if direction changed (someone replied)
                if prev_comm.direction != curr_comm.direction:
                    response_time = (curr_comm.timestamp - prev_comm.timestamp).total_seconds() / 60  # in minutes
                    if response_time > 0:  # Ignore out-of-order timestamps
                        response_times.append(response_time)
        
        return response_times
    
    def _get_top_contacts(self, limit=10):
        """Get top contacts by interaction count."""
        if not self.contacts:
            return []
            
        # Sort contacts by interaction count
        sorted_contacts = sorted(
            self.contacts.items(),
            key=lambda x: x[1]['interaction_count'],
            reverse=True
        )
        
        # Format the results
        return [
            {
                'id': contact_id,
                'name': info['name'],
                'email': info['email'],
                'is_external': info['is_external'],
                'interaction_count': info['interaction_count'],
                'last_interaction': info['last_contact'].isoformat() if info['last_contact'] else None
            }
            for contact_id, info in sorted_contacts[:limit]
        ]
    
    def _generate_time_series(self, communications, start_date, end_date):
        """Generate time series data for visualization."""
        if not communications:
            return {}
            
        # Determine date range
        if not start_date:
            start_date = min(c.timestamp for c in communications)
        if not end_date:
            end_date = max(c.timestamp for c in communications)
            
        # Create date range
        date_range = pd.date_range(
            start=start_date.date(),
            end=end_date.date(),
            freq='D'
        )
        
        # Initialize data structures
        data = {
            'dates': [d.strftime('%Y-%m-%d') for d in date_range],
            'email': {'inbound': [0] * len(date_range), 'outbound': [0] * len(date_range)},
            'slack': {'inbound': [0] * len(date_range), 'outbound': [0] * len(date_range)},
            'meeting': {'inbound': [0] * len(date_range), 'outbound': [0] * len(date_range)}
        }
        
        # Count communications by type and direction
        for comm in communications:
            date_idx = (comm.timestamp.date() - start_date.date()).days
            if 0 <= date_idx < len(date_range):
                comm_type = comm.type.value if comm.type else 'meeting'
                direction = comm.direction.value
                data[comm_type][direction][date_idx] += 1
        
        return data
    
    def _generate_network_data(self):
        """Generate data for network visualization."""
        if not self.network_graph:
            return {'nodes': [], 'links': []}
            
        # Convert nodes to list of dictionaries
        nodes = [
            {
                'id': node_id,
                'name': data.get('name', 'Unknown'),
                'email': data.get('email', ''),
                'is_external': data.get('is_external', False),
                'degree': self.network_graph.degree(node_id)
            }
            for node_id, data in self.network_graph.nodes(data=True)
        ]
        
        # Convert edges to list of dictionaries
        links = [
            {
                'source': source,
                'target': target,
                'weight': data.get('weight', 1)
            }
            for source, target, data in self.network_graph.edges(data=True)
        ]
        
        return {
            'nodes': nodes,
            'links': links
        }
    
    def _process_content(self, comm):
        """Extract structured data from communication content using keyword/regex patterns."""
        # Get text content from communication
        content = ''
        subject = ''
        
        if hasattr(comm, 'body'):
            content = comm.body or ''
        if hasattr(comm, 'subject'):
            subject = comm.subject or ''
        
        full_text = f"{subject} {content}"
        
        if not full_text.strip():
            return
        
        # Extract projects/initiatives
        self._extract_projects(full_text, comm)
        
        # Extract blockers/incidents
        self._extract_incidents(full_text, comm)
        
        # Extract financial mentions
        self._extract_financials(full_text, comm)
        
        # Extract action items
        self._extract_action_items(full_text, comm)
        
        # Extract decisions
        self._extract_decisions(full_text, comm)
        
        # Extract achievements
        self._extract_achievements(full_text, comm)
        
        # Update key people tracking
        self._update_key_people(comm)
    
    def _extract_projects(self, text, comm):
        """Extract project mentions from text."""
        # Project keywords
        project_keywords = [
            'project', 'initiative', 'campaign', 'program', 'launch', 
            'sprint', 'release', 'milestone', 'deployment', 'rollout'
        ]
        
        # Regex patterns for project extraction
        patterns = [
            r'\b(?:project|initiative|campaign|program)\s+([A-Z][\w\s]+?)(?:[,\.]|$)',
            r'\b(?:Project|Initiative|Campaign|Program)\s+([A-Z0-9][\w\s\-]+?)(?:[,\.]|$)',
            r'\b([A-Z][\w]+)\s+(?:project|initiative|launch|release)\b',
            r'\b(?:working on|developing|building)\s+([A-Z][\w\s]+?)(?:[,\.]|$)'
        ]
        
        text_lower = text.lower()
        
        # Check for project keywords
        for keyword in project_keywords:
            if keyword in text_lower:
                # Try to extract project names using patterns
                for pattern in patterns:
                    matches = re.findall(pattern, text, re.IGNORECASE)
                    for match in matches:
                        project_name = match.strip()
                        if len(project_name) > 3 and len(project_name) < 50:
                            self.structured_data['projects'].append({
                                'name': project_name,
                                'source': comm.id if hasattr(comm, 'id') else None,
                                'timestamp': comm.timestamp,
                                'context': text[:200]  # Store context snippet
                            })
    
    def _extract_incidents(self, text, comm):
        """Extract blockers and incidents from text."""
        # Blocker/incident keywords
        incident_keywords = [
            'outage', 'bug', 'critical issue', 'failure', 'unable to',
            'blocker', 'blocked', 'error', 'crash', 'down', 'broken',
            'urgent', 'emergency', 'critical', 'severity', 'incident'
        ]
        
        # Regex patterns for incident extraction
        patterns = [
            r'\b(?:outage|failure|error|bug)\s+(?:in|with|on)\s+([\w\s]+?)(?:[,\.]|$)',
            r'\b([\w\s]+?)\s+(?:is|are)\s+(?:down|broken|failing|blocked)\b',
            r'\b(?:critical|urgent|emergency)\s+(?:issue|problem|bug)\s*:?\s*([^,\.]+)',
            r'\bunable to\s+([^,\.]+)'
        ]
        
        text_lower = text.lower()
        
        # Check for incident keywords
        for keyword in incident_keywords:
            if keyword in text_lower:
                # Try to extract incident details
                for pattern in patterns:
                    matches = re.findall(pattern, text, re.IGNORECASE)
                    for match in matches:
                        incident_desc = match.strip()
                        if len(incident_desc) > 5:
                            self.structured_data['incidents'].append({
                                'description': incident_desc,
                                'source': comm.id if hasattr(comm, 'id') else None,
                                'timestamp': comm.timestamp,
                                'severity': self._determine_severity(text_lower),
                                'context': text[:200]
                            })
                            break  # One incident per pattern match
    
    def _extract_financials(self, text, comm):
        """Extract financial mentions from text."""
        # Regex patterns for financial data
        patterns = [
            r'\$([\d,]+(?:\.\d+)?(?:[KMB])?)',  # $100, $1.5M, $20K
            r'([\d,]+(?:\.\d+)?)\s*(?:dollars|USD)',  # 100 dollars, 1000 USD
            r'\b([\d,]+(?:\.\d+)?)\s*(?:million|billion|thousand)\s+(?:dollars|USD|\$)',
            r'\b(?:budget|cost|revenue|profit|loss|expense)\s*(?:of|:)?\s*\$?([\d,]+(?:\.\d+)?[KMB]?)'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                amount = match.strip()
                if amount:
                    # Normalize amount format
                    normalized = self._normalize_financial_amount(amount)
                    if normalized:
                        self.structured_data['financials'].append({
                            'amount': normalized,
                            'raw_text': amount,
                            'source': comm.id if hasattr(comm, 'id') else None,
                            'timestamp': comm.timestamp,
                            'context': self._extract_financial_context(text, amount)
                        })
    
    def _extract_action_items(self, text, comm):
        """Extract action items from text."""
        # Action item patterns
        patterns = [
            r'\b(?:action item|todo|to-do|task)\s*:?\s*([^,\.\n]+)',
            r'\b(?:need to|needs to|must|should|will)\s+([^,\.\n]+)',
            r'\b(?:please|kindly)\s+([^,\.\n]+)',
            r'^[-*]\s+([^\n]+)$'  # Bullet points
        ]
        
        text_lower = text.lower()
        
        # Look for action-oriented language
        if any(keyword in text_lower for keyword in ['action', 'todo', 'task', 'need to', 'please', 'must']):
            for pattern in patterns:
                matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
                for match in matches:
                    action = match.strip()
                    if len(action) > 10 and len(action) < 200:
                        self.structured_data['action_items'].append({
                            'description': action,
                            'source': comm.id if hasattr(comm, 'id') else None,
                            'timestamp': comm.timestamp,
                            'assigned_to': self._extract_assignee(text, action)
                        })
    
    def _extract_decisions(self, text, comm):
        """Extract decisions from text."""
        # Decision patterns
        decision_keywords = [
            'decided', 'decision', 'approved', 'rejected', 'agreed',
            'concluded', 'determined', 'resolved', 'finalized'
        ]
        
        patterns = [
            r'\b(?:decided|agreed|approved)\s+(?:to|that)\s+([^,\.]+)',
            r'\b(?:decision|conclusion)\s*:?\s*([^,\.]+)',
            r'\b(?:we|I|team)\s+(?:will|shall|are going to)\s+([^,\.]+)'
        ]
        
        text_lower = text.lower()
        
        for keyword in decision_keywords:
            if keyword in text_lower:
                for pattern in patterns:
                    matches = re.findall(pattern, text, re.IGNORECASE)
                    for match in matches:
                        decision = match.strip()
                        if len(decision) > 10:
                            self.structured_data['decisions'].append({
                                'description': decision,
                                'source': comm.id if hasattr(comm, 'id') else None,
                                'timestamp': comm.timestamp
                            })
                            break
    
    def _extract_achievements(self, text, comm):
        """Extract achievements and wins from text."""
        # Achievement patterns
        achievement_keywords = [
            'completed', 'achieved', 'accomplished', 'succeeded',
            'launched', 'shipped', 'delivered', 'milestone',
            'congratulations', 'great job', 'well done', 'success'
        ]
        
        patterns = [
            r'\b(?:completed|achieved|accomplished|delivered)\s+([^,\.]+)',
            r'\b(?:successfully)\s+([^,\.]+)',
            r'\b(?:congratulations|kudos|great job)\s+(?:on|for)?\s*([^,\.]+)',
            r'\b([\w\s]+?)\s+(?:is|was)\s+(?:complete|successful|launched|live)\b'
        ]
        
        text_lower = text.lower()
        
        for keyword in achievement_keywords:
            if keyword in text_lower:
                for pattern in patterns:
                    matches = re.findall(pattern, text, re.IGNORECASE)
                    for match in matches:
                        achievement = match.strip()
                        if len(achievement) > 5 and len(achievement) < 200:
                            self.structured_data['achievements'].append({
                                'description': achievement,
                                'source': comm.id if hasattr(comm, 'id') else None,
                                'timestamp': comm.timestamp
                            })
                            break
    
    def _update_key_people(self, comm):
        """Update key people tracking based on communication."""
        if hasattr(comm, 'participants'):
            for participant in comm.participants:
                person_id = participant.id if hasattr(participant, 'id') else str(participant)
                
                if person_id not in self.structured_data['key_people']:
                    self.structured_data['key_people'][person_id] = {
                        'name': participant.name if hasattr(participant, 'name') else str(participant),
                        'email': participant.email if hasattr(participant, 'email') else None,
                        'interaction_count': 0,
                        'last_interaction': None,
                        'topics': [],
                        'importance_score': 0
                    }
                
                person_data = self.structured_data['key_people'][person_id]
                person_data['interaction_count'] += 1
                person_data['last_interaction'] = comm.timestamp
                
                # Track topics discussed
                if hasattr(comm, 'subject') and comm.subject:
                    person_data['topics'].append(comm.subject)
                
                # Calculate importance score
                person_data['importance_score'] = self._calculate_person_importance(person_data)
    
    def _determine_severity(self, text_lower):
        """Determine incident severity based on keywords."""
        if any(word in text_lower for word in ['critical', 'emergency', 'urgent', 'severe']):
            return 'high'
        elif any(word in text_lower for word in ['important', 'moderate', 'issue']):
            return 'medium'
        else:
            return 'low'
    
    def _normalize_financial_amount(self, amount_str):
        """Normalize financial amount to standard format."""
        try:
            # Remove commas and dollar signs
            clean = amount_str.replace(',', '').replace('$', '').strip()
            
            # Handle K, M, B suffixes
            multiplier = 1
            if clean[-1].upper() == 'K':
                multiplier = 1000
                clean = clean[:-1]
            elif clean[-1].upper() == 'M':
                multiplier = 1000000
                clean = clean[:-1]
            elif clean[-1].upper() == 'B':
                multiplier = 1000000000
                clean = clean[:-1]
            
            # Convert to float and apply multiplier
            value = float(clean) * multiplier
            
            # Format based on size
            if value >= 1000000000:
                return f"${value/1000000000:.1f}B"
            elif value >= 1000000:
                return f"${value/1000000:.1f}M"
            elif value >= 1000:
                return f"${value/1000:.1f}K"
            else:
                return f"${value:.0f}"
        except:
            return None
    
    def _extract_financial_context(self, text, amount):
        """Extract context around financial mention."""
        # Find position of amount in text
        pos = text.find(amount)
        if pos == -1:
            return ""
        
        # Extract surrounding context (50 chars before and after)
        start = max(0, pos - 50)
        end = min(len(text), pos + len(amount) + 50)
        
        context = text[start:end]
        
        # Clean up context
        if start > 0:
            context = "..." + context
        if end < len(text):
            context = context + "..."
        
        return context.strip()
    
    def _extract_assignee(self, text, action):
        """Try to extract who an action is assigned to."""
        # Look for assignment patterns
        patterns = [
            r'\b([A-Z][a-z]+)\s+(?:will|should|needs to|must)',
            r'\bassigned to\s+([A-Z][a-z]+)',
            r'\b@([\w]+)'  # Mentions
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(1)
        
        return None
    
    def _calculate_person_importance(self, person_data):
        """Calculate importance score for a person."""
        score = 0
        
        # Base score from interaction count
        score += person_data['interaction_count'] * 10
        
        # Recency bonus
        if person_data['last_interaction']:
            days_ago = (datetime.now() - person_data['last_interaction']).days
            if days_ago <= 1:
                score += 50
            elif days_ago <= 7:
                score += 20
            elif days_ago <= 30:
                score += 10
        
        # Topic diversity bonus
        unique_topics = len(set(person_data['topics'][-10:]))  # Last 10 topics
        score += unique_topics * 5
        
        return score
    
    def get_structured_data(self):
        """Return the extracted structured data."""
        # Deduplicate and clean up data
        self._deduplicate_structured_data()
        
        # Sort and rank items
        self._rank_structured_data()
        
        return self.structured_data
    
    def _deduplicate_structured_data(self):
        """Remove duplicate entries from structured data."""
        # Deduplicate projects
        seen_projects = set()
        unique_projects = []
        for project in self.structured_data['projects']:
            key = project['name'].lower()
            if key not in seen_projects:
                seen_projects.add(key)
                unique_projects.append(project)
        self.structured_data['projects'] = unique_projects
        
        # Similar deduplication for other categories
        self._deduplicate_list('incidents', 'description')
        self._deduplicate_list('action_items', 'description')
        self._deduplicate_list('decisions', 'description')
        self._deduplicate_list('achievements', 'description')
    
    def _deduplicate_list(self, category, key_field):
        """Generic deduplication for list categories."""
        seen = set()
        unique = []
        for item in self.structured_data[category]:
            key = item[key_field].lower() if key_field in item else str(item)
            if key not in seen:
                seen.add(key)
                unique.append(item)
        self.structured_data[category] = unique
    
    def _rank_structured_data(self):
        """Rank and sort structured data by importance."""
        # Sort projects by frequency (could be enhanced)
        self.structured_data['projects'].sort(
            key=lambda x: x['timestamp'] if 'timestamp' in x else datetime.min,
            reverse=True
        )
        
        # Sort incidents by severity and recency
        severity_order = {'high': 3, 'medium': 2, 'low': 1}
        self.structured_data['incidents'].sort(
            key=lambda x: (severity_order.get(x.get('severity', 'low'), 0), x['timestamp']),
            reverse=True
        )
        
        # Sort action items by recency
        self.structured_data['action_items'].sort(
            key=lambda x: x['timestamp'],
            reverse=True
        )
        
        # Sort key people by importance score
        sorted_people = sorted(
            self.structured_data['key_people'].items(),
            key=lambda x: x[1]['importance_score'],
            reverse=True
        )
        self.structured_data['key_people'] = dict(sorted_people[:20])  # Keep top 20
