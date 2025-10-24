"""
Unit tests for Enhanced Narrative Brief System
Tests preprocessing pipeline, clustering logic, and synthesis layer
"""

import pytest
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from narrative_preprocessing import EnhancedPreprocessingPipeline, process_email_batch_for_narrative
from narrative_synthesis import EnhancedSynthesisLayer

class TestEnhancedPreprocessingPipeline:
    """Test cases for the preprocessing pipeline"""

    def setup_method(self):
        self.pipeline = EnhancedPreprocessingPipeline()

    def test_clean_email_text_html_removal(self):
        """Test HTML tag removal from email text"""
        html_text = "Hello <b>world</b>, this is a <a href='test'>test</a> email."
        cleaned = self.pipeline.clean_email_text(html_text)
        assert '<' not in cleaned and '>' not in cleaned
        assert 'Hello world, this is a test email.' == cleaned

    def test_clean_email_text_signature_removal(self):
        """Test email signature removal"""
        text_with_signature = "This is the main content.\n--\nBest regards,\nJohn Doe\nCEO"
        cleaned = self.pipeline.clean_email_text(text_with_signature)
        assert 'Best regards' not in cleaned
        assert 'John Doe' not in cleaned

    def test_extract_financial_values(self):
        """Test financial value extraction"""
        text = "The project costs $50,000 and budget is $25.5K with additional $100,000 investment."
        values = self.pipeline.extract_financial_values(text)
        assert 50000.0 in values
        assert 25500.0 in values  # 25.5K = 25,500
        assert 100000.0 in values
        assert len(values) == 3

    def test_detect_status_flags(self):
        """Test status detection in text"""
        blocker_text = "This is blocked and urgent issue that needs immediate attention."
        flags = self.pipeline.detect_status_flags(blocker_text)
        assert flags['blocker'] == True
        assert flags['decision'] == False

        decision_text = "Please approve this decision and sign off on the proposal."
        flags = self.pipeline.detect_status_flags(decision_text)
        assert flags['decision'] == True
        assert flags['blocker'] == False

    def test_infer_project_key_hyphenated(self):
        """Test project key inference with hyphenated pairs"""
        email = {
            'subject': 'Re: Allied - Ledet project update and timeline',
            'body': 'Some content here'
        }
        project_key = self.pipeline.infer_project_key(email)
        assert project_key == 'Allied - Ledet'

    def test_infer_project_key_fallback(self):
        """Test project key inference fallback to first words"""
        email = {
            'subject': 'Weekly team meeting notes and action items',
            'body': 'Some content here'
        }
        project_key = self.pipeline.infer_project_key(email)
        assert project_key == 'Weekly - team'

    def test_extract_entities_people(self):
        """Test people entity extraction"""
        text = "John Smith and Chris Laguna are working on the project with Jane Doe."
        entities = self.pipeline.extract_entities(text)
        people_entities = [e for e in entities if e['type'] == 'person']
        assert len(people_entities) >= 2
        entity_names = [e['entity'] for e in people_entities]
        assert any('John Smith' in name for name in entity_names)

    def test_preprocess_email_complete(self):
        """Test complete email preprocessing"""
        email = {
            'id': 'test-123',
            'subject': 'Allied - Ledet: Decision needed on $50K investment',
            'body': 'Chris Laguna has identified a blocker. Please approve the budget.',
            'from': {'name': 'Jane Doe', 'email': 'jane@company.com'},
            'date': '2025-01-15T10:00:00Z'
        }

        processed = self.pipeline.preprocess_email(email)

        # Check basic fields
        assert processed.id == 'test-123'
        assert processed.subject == 'Allied - Ledet: Decision needed on $50K investment'
        assert processed.project_key == 'Allied - Ledet'

        # Check financial extraction
        assert 50000.0 in processed.financial_values

        # Check status detection
        assert processed.status_flags['decision'] == True
        assert processed.status_flags['blocker'] == True

        # Check entity extraction
        assert len(processed.entities) > 0

    def test_cluster_by_project_basic(self):
        """Test basic project clustering"""
        emails = [
            {
                'id': '1',
                'subject': 'Allied - Ledet: Status update',
                'body': 'Progress is good',
                'from': {'name': 'John'},
                'date': '2025-01-15'
            },
            {
                'id': '2',
                'subject': 'Allied - Ledet: Decision needed',
                'body': 'Please approve $25K',
                'from': {'name': 'Jane'},
                'date': '2025-01-16'
            },
            {
                'id': '3',
                'subject': 'Other project: Update',
                'body': 'Different content',
                'from': {'name': 'Bob'},
                'date': '2025-01-17'
            }
        ]

        processed_emails = [self.pipeline.preprocess_email(email) for email in emails]
        clusters = self.pipeline.cluster_by_project(processed_emails)

        # Should have 2 clusters
        assert len(clusters) == 2

        # Check Allied - Ledet cluster
        allied_cluster = clusters.get('Allied - Ledet')
        assert allied_cluster is not None
        assert len(allied_cluster.items) == 2
        assert allied_cluster.has_financial_mentions == True
        assert allied_cluster.financial_total == 25000.0

        # Check Other project cluster
        other_cluster = clusters.get('Other - project')
        assert other_cluster is not None
        assert len(other_cluster.items) == 1

    def test_financial_constraint_enforcement(self):
        """Test that financial constraints are properly enforced"""
        emails = [
            {
                'id': '1',
                'subject': 'Project without money',
                'body': 'No financial mentions here',
                'from': {'name': 'John'},
                'date': '2025-01-15'
            },
            {
                'id': '2',
                'subject': 'Project with money',
                'body': 'This costs $100,000',
                'from': {'name': 'Jane'},
                'date': '2025-01-16'
            }
        ]

        processed_emails = [self.pipeline.preprocess_email(email) for email in emails]
        clusters = self.pipeline.cluster_by_project(processed_emails)
        clusters = self.pipeline.enforce_financial_constraints(clusters)

        # Project without money should have no financial data
        no_money_cluster = clusters.get('Project - without')
        assert no_money_cluster.financial_total == 0.0
        assert no_money_cluster.has_financial_mentions == False

        # Project with money should retain financial data
        money_cluster = clusters.get('Project - with')
        assert money_cluster.financial_total == 100000.0
        assert money_cluster.has_financial_mentions == True

class TestEnhancedSynthesisLayer:
    """Test cases for the synthesis layer"""

    def setup_method(self):
        self.synthesis = EnhancedSynthesisLayer()

    def test_fallback_contextual_summary(self):
        """Test fallback contextual summary generation"""
        cluster = {
            'project_key': 'Test Project',
            'items': [
                {
                    'subject': 'Decision needed',
                    'body': 'Please approve this request',
                    'clean_text': 'Decision needed. Please approve this request'
                }
            ],
            'status_counts': {'decision': 1, 'blocker': 0, 'achievement': 0},
            'people': ['John Doe'],
            'financial_total': 0.0,
            'has_financial_mentions': False
        }

        summary = self.synthesis._fallback_contextual_summary(cluster)
        assert 'decision' in summary.lower()
        assert 'John Doe' in summary

    def test_fallback_executive_synthesis(self):
        """Test fallback executive synthesis"""
        clusters = [
            {
                'project_key': 'Project A',
                'status_counts': {'decision': 1, 'blocker': 1},
                'financial_total': 50000.0,
                'urgency_score': 5
            },
            {
                'project_key': 'Project B',
                'status_counts': {'blocker': 1},
                'financial_total': 0.0,
                'urgency_score': 3
            }
        ]

        synthesis = self.synthesis._fallback_executive_synthesis(clusters)
        assert 'Project A' in synthesis
        assert 'Project B' in synthesis
        assert 'decision' in synthesis.lower()

    def test_fallback_action_derivation(self):
        """Test fallback action item derivation"""
        cluster = {
            'project_key': 'Test Project',
            'status_counts': {'decision': 1, 'blocker': 1}
        }

        actions = self.synthesis._fallback_action_derivation(cluster)
        assert len(actions) > 0
        assert any('Decision' in action for action in actions)

    def test_fallback_recurring_summary(self):
        """Test fallback recurring content summary"""
        clusters = [
            {
                'project_key': 'Newsletter Updates',
                'items': [{'subject': 'Morning Brief'}, {'subject': 'Tech News'}]
            }
        ]

        summary = self.synthesis._fallback_recurring_summary(clusters)
        assert 'newsletter' in summary.lower()
        assert '2 items' in summary

class TestIntegration:
    """Integration tests for the complete narrative brief system"""

    def test_end_to_end_narrative_generation(self):
        """Test complete narrative brief generation pipeline"""
        emails = [
            {
                'id': '1',
                'subject': 'Allied - Ledet: Critical blocker identified',
                'body': 'Chris Laguna found an issue with vendor terms. Timeline is stalled. Need decision on $40,000 crisis response package.',
                'from': {'name': 'Jane Doe', 'email': 'jane@company.com'},
                'date': '2025-01-15T10:00:00Z'
            },
            {
                'id': '2',
                'subject': 'Allied - Ledet: Follow up on decision',
                'body': 'Still waiting for approval on the $40K package. This is urgent.',
                'from': {'name': 'Chris Laguna', 'email': 'chris@company.com'},
                'date': '2025-01-15T14:00:00Z'
            },
            {
                'id': '3',
                'subject': 'Marketing newsletter: Weekly insights',
                'body': 'Market trends and industry updates for this week.',
                'from': {'name': 'Newsletter Bot'},
                'date': '2025-01-16T09:00:00Z'
            }
        ]

        result = process_email_batch_for_narrative(emails)

        # Check basic structure
        assert 'processed_emails' in result
        assert 'clusters' in result
        assert 'sorted_clusters' in result
        assert result['total_emails'] == 3
        assert result['total_clusters'] >= 2

        # Check clusters are properly sorted by urgency
        clusters = result['sorted_clusters']
        allied_cluster = next((c for c in clusters if 'Allied - Ledet' in c.get('project_key', '')), None)
        assert allied_cluster is not None

        # Check financial constraint enforcement
        assert allied_cluster.get('has_financial_mentions', False) == True
        assert allied_cluster.get('financial_total', 0) == 40000.0

        # Check newsletter cluster exists
        newsletter_cluster = next((c for c in clusters if 'newsletter' in c.get('project_key', '').lower()), None)
        assert newsletter_cluster is not None

if __name__ == "__main__":
    # Run basic tests
    test_preprocessing = TestEnhancedPreprocessingPipeline()
    test_preprocessing.setup_method()
    test_preprocessing.test_clean_email_text_html_removal()
    test_preprocessing.test_extract_financial_values()
    test_preprocessing.test_detect_status_flags()

    print("✅ Basic preprocessing tests passed")

    # Test integration
    test_integration = TestIntegration()
    test_integration.test_end_to_end_narrative_generation()

    print("✅ Integration tests passed")
    print("🎉 All tests completed successfully!")
