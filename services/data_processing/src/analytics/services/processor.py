from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
import pandas as pd
import numpy as np
from collections import defaultdict
import networkx as nx

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
        
    def add_communication(self, comm):
        """Add a communication record to the processor."""
        self.communications.append(comm)
        self._update_contacts(comm)
        self._update_network_graph(comm)
    
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
