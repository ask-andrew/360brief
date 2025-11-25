#!/usr/bin/env python3
"""
Network Visualization Module

This module generates interactive visualizations for collaboration networks
including chord diagrams and force-directed graphs.
"""

import json
import logging
from typing import Dict, List, Any, Set
import networkx as nx
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots

logger = logging.getLogger(__name__)

class NetworkVisualizer:
    """Generates interactive network visualizations"""

    def __init__(self):
        self.color_palette = px.colors.qualitative.Set3

    def generate_chord_diagram(self, clusters: List[Dict[str, Any]], user_email: str) -> Dict[str, Any]:
        """Generate chord diagram data for project collaboration"""

        # Build participant-project adjacency matrix
        all_participants = set()
        project_participants = {}

        for cluster in clusters:
            participants = set(cluster['participants'])
            project_participants[cluster['name']] = participants
            all_participants.update(participants)

        # Remove the target user from the diagram (they're the center)
        all_participants.discard(user_email.lower())

        # Create adjacency matrix
        participants_list = sorted(list(all_participants))
        projects_list = list(project_participants.keys())

        matrix = []
        for participant in participants_list:
            row = []
            for project in projects_list:
                if participant in project_participants[project]:
                    row.append(1)
                else:
                    row.append(0)
            matrix.append(row)

        # Generate chord diagram
        fig = go.Figure(data=go.Chord(
            matrix=matrix,
            labels=participants_list + projects_list,
            colors=self.color_palette[:len(participants_list) + len(projects_list)]
        ))

        fig.update_layout(
            title="Collaboration Network - Chord Diagram",
            font_size=12,
            annotations=[dict(
                text=f"Projects: {len(projects_list)} | Participants: {len(participants_list)}",
                showarrow=False,
                xref="paper", yref="paper",
                x=0.5, y=0.95
            )]
        )

        return {
            'plotly_data': fig.to_dict(),
            'participants': participants_list,
            'projects': projects_list,
            'matrix': matrix
        }

    def generate_force_directed_graph(self, clusters: List[Dict[str, Any]], user_email: str) -> Dict[str, Any]:
        """Generate force-directed graph visualization"""

        G = nx.Graph()

        # Add user as central node
        G.add_node(user_email, type='user', size=20, color='red')

        # Add project nodes
        for i, cluster in enumerate(clusters):
            project_name = cluster['name']
            G.add_node(project_name,
                      type='project',
                      size=15,
                      color=self.color_palette[i % len(self.color_palette)],
                      participants=len(cluster['participants']),
                      interaction_count=cluster['interaction_count'])

        # Add participant nodes (excluding user)
        all_participants = set()
        for cluster in clusters:
            all_participants.update(cluster['participants'])

        all_participants.discard(user_email.lower())

        for participant in all_participants:
            # Determine if internal or external (simplified heuristic)
            is_external = '@' in participant and not any(domain in participant for domain in ['company.com', 'internal'])
            G.add_node(participant,
                      type='participant',
                      size=10,
                      color='green' if is_external else 'blue',
                      is_external=is_external)

        # Add edges
        for cluster in clusters:
            project_name = cluster['name']

            # Connect user to project
            G.add_edge(user_email, project_name, weight=2, type='user_project')

            # Connect participants to project
            for participant in cluster['participants']:
                if participant != user_email.lower():
                    G.add_edge(participant, project_name, weight=1, type='participant_project')

            # Connect participants who share multiple projects (collaboration strength)
            participant_clusters = defaultdict(list)
            for p in cluster['participants']:
                if p != user_email.lower():
                    participant_clusters[p].append(project_name)

        # Calculate positions using spring layout
        pos = nx.spring_layout(G, k=2, iterations=50, seed=42)

        # Create edge traces
        edge_traces = []
        edge_weights = []

        for edge in G.edges(data=True):
            x0, y0 = pos[edge[0]]
            x1, y1 = pos[edge[1]]

            weight = edge[2].get('weight', 1)
            edge_weights.append(weight)

            edge_trace = go.Scatter(
                x=[x0, x1, None],
                y=[y0, y1, None],
                line=dict(width=weight*2, color='rgba(136, 136, 136, 0.3)'),
                hoverinfo='none',
                mode='lines'
            )
            edge_traces.append(edge_trace)

        # Create node traces
        node_traces = {}
        node_sizes = []
        node_colors = []
        node_labels = []

        for node in G.nodes(data=True):
            node_type = node[1]['type']
            if node_type not in node_traces:
                node_traces[node_type] = {'x': [], 'y': [], 'text': [], 'size': [], 'color': []}

            node_traces[node_type]['x'].append(pos[node[0]][0])
            node_traces[node_type]['y'].append(pos[node[0]][1])

            # Enhanced hover text
            if node_type == 'user':
                hover_text = f"<b>{node[0]}</b><br>Central User"
            elif node_type == 'project':
                hover_text = f"<b>{node[0]}</b><br>" \
                           f"Participants: {node[1]['participants']}<br>" \
                           f"Interactions: {node[1]['interaction_count']}"
            else:  # participant
                hover_text = f"<b>{node[0]}</b><br>" \
                           f"{'External' if node[1]['is_external'] else 'Internal'} Collaborator"

            node_traces[node_type]['text'].append(hover_text)
            node_traces[node_type]['size'].append(node[1]['size'])
            node_traces[node_type]['color'].append(node[1]['color'])

        # Combine all traces
        data = edge_traces.copy()

        for node_type, trace_data in node_traces.items():
            node_trace = go.Scatter(
                x=trace_data['x'],
                y=trace_data['y'],
                mode='markers+text',
                hoverinfo='text',
                text=[n.split('@')[0] if '@' in n else n for n in trace_data['text']],  # Shorten email addresses
                textposition="top center",
                hovertext=trace_data['text'],
                marker=dict(
                    size=trace_data['size'],
                    color=trace_data['color'],
                    line=dict(width=2)
                ),
                name=node_type.title()
            )
            data.append(node_trace)

        # Create figure
        fig = go.Figure(data=data)

        fig.update_layout(
            title="Collaboration Network - Force-Directed Graph",
            title_x=0.5,
            showlegend=True,
            hovermode='closest',
            margin=dict(b=20, l=5, r=5, t=40),
            annotations=[dict(
                text=f"Nodes: {len(G.nodes())} | Edges: {len(G.edges())}",
                showarrow=False,
                xref="paper", yref="paper",
                x=0.02, y=0.98,
                xanchor='left', yanchor='top'
            )],
            xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
            yaxis=dict(showgrid=False, zeroline=False, showticklabels=False)
        )

        return {
            'plotly_data': fig.to_dict(),
            'network_stats': {
                'nodes': len(G.nodes()),
                'edges': len(G.edges()),
                'projects': len([n for n, d in G.nodes(data=True) if d['type'] == 'project']),
                'participants': len([n for n, d in G.nodes(data=True) if d['type'] == 'participant']),
                'internal_participants': len([n for n, d in G.nodes(data=True) if d['type'] == 'participant' and not d['is_external']]),
                'external_participants': len([n for n, d in G.nodes(data=True) if d['type'] == 'participant' and d['is_external']])
            }
        }

    def generate_project_timeline(self, clusters: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate timeline visualization of project activity"""

        # Sort projects by start date
        active_clusters = [c for c in clusters if c['is_active']]

        if not active_clusters:
            return {'error': 'No active projects to display'}

        # Create timeline data
        timeline_data = []
        for cluster in active_clusters:
            if cluster['start_date'] and cluster['end_date']:
                timeline_data.append({
                    'Project': cluster['name'],
                    'Start': cluster['start_date'][:10],  # YYYY-MM-DD format
                    'Finish': cluster['end_date'][:10],
                    'Duration': (datetime.datetime.fromisoformat(cluster['end_date']) - datetime.datetime.fromisoformat(cluster['start_date'])).days,
                    'Participants': len(cluster['participants']),
                    'Interactions': cluster['interaction_count']
                })

        if not timeline_data:
            return {'error': 'No projects with complete date information'}

        # Create Gantt chart
        fig = px.timeline(
            timeline_data,
            x_start="Start",
            x_end="Finish",
            y="Project",
            color="Participants",
            hover_data=["Duration", "Interactions"],
            title="Project Timeline - Active Projects"
        )

        fig.update_layout(
            xaxis_title="Timeline",
            yaxis_title="Projects",
            hovermode='closest'
        )

        return {
            'plotly_data': fig.to_dict(),
            'timeline_stats': {
                'total_projects': len(timeline_data),
                'avg_duration': sum(t['Duration'] for t in timeline_data) / len(timeline_data),
                'max_duration': max(t['Duration'] for t in timeline_data),
                'min_duration': min(t['Duration'] for t in timeline_data)
            }
        }

    def generate_collaboration_heatmap(self, clusters: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate heatmap of collaboration intensity by time period"""

        # This would require more detailed timestamp data
        # For now, create a simple version based on project activity

        active_clusters = [c for c in clusters if c['is_active']]

        # Group projects by week or month
        project_activity = defaultdict(int)

        for cluster in active_clusters:
            if cluster['start_date']:
                # Simple weekly grouping
                date = datetime.datetime.fromisoformat(cluster['start_date'])
                week_key = f"{date.year}-W{date.isocalendar()[1]}"
                project_activity[week_key] += 1

        if not project_activity:
            return {'error': 'No project activity data available'}

        # Create heatmap data
        weeks = sorted(project_activity.keys())
        max_projects = max(project_activity.values())

        fig = go.Figure(data=go.Heatmap(
            z=[project_activity[week] for week in weeks],
            x=weeks,
            y=['Projects'],
            colorscale='Blues',
            hoverongaps=False
        ))

        fig.update_layout(
            title="Project Activity Heatmap",
            xaxis_title="Week",
            yaxis_title="",
            annotations=[dict(
                text=f"Active Projects: {len(active_clusters)} | Peak Week: {max(project_activity, key=project_activity.get)}",
                showarrow=False,
                xref="paper", yref="paper",
                x=0.5, y=0.95
            )]
        )

        return {
            'plotly_data': fig.to_dict(),
            'activity_stats': {
                'total_weeks': len(weeks),
                'max_weekly_projects': max_projects,
                'avg_weekly_projects': sum(project_activity.values()) / len(weeks)
            }
        }

def generate_visualization_data(clusters: List[Dict[str, Any]], user_email: str, viz_type: str = 'all') -> Dict[str, Any]:
    """Generate all visualization data for the frontend"""

    visualizer = NetworkVisualizer()
    visualizations = {}

    try:
        if viz_type in ['all', 'chord']:
            visualizations['chord_diagram'] = visualizer.generate_chord_diagram(clusters, user_email)

        if viz_type in ['all', 'force_directed']:
            visualizations['force_directed'] = visualizer.generate_force_directed_graph(clusters, user_email)

        if viz_type in ['all', 'timeline']:
            visualizations['timeline'] = visualizer.generate_project_timeline(clusters)

        if viz_type in ['all', 'heatmap']:
            visualizations['heatmap'] = visualizer.generate_collaboration_heatmap(clusters)

    except Exception as e:
        logger.error(f"Error generating visualizations: {e}")
        visualizations['error'] = str(e)

    return visualizations
