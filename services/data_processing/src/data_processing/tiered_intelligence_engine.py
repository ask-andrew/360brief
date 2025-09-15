# services/data_processing/tiered_intelligence_engine.py

import re
import asyncio
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
from collections import Counter, defaultdict
import logging
from dataclasses import dataclass
import json
import statistics

@dataclass
class IntelligenceSignal:
    """Core intelligence signal that works without AI"""
    signal_type: str  # decision, blocker, opportunity, urgency, pattern
    priority: int  # 1-10 scale
    title: str
    description: str
    evidence: List[str]
    stakeholders: List[str]
    confidence: float
    business_category: str  # revenue, cost, team, customer, product, risk

class PowerfulNonAIIntelligenceEngine:
    """
    Sophisticated intelligence extraction using pattern matching, statistical analysis,
    and business logic - NO AI required but still delivers real value
    """
    
    def __init__(self, user_id: str = None):
        self.logger = logging.getLogger(__name__)
        self.user_id = user_id
        
        # Business intelligence patterns (refined through data analysis)
        self.urgency_indicators = {
            'critical': ['urgent', 'critical', 'emergency', 'asap', 'immediately', 'crisis'],
            'high': ['important', 'priority', 'deadline', 'due', 'tomorrow', 'today', 'eod'],
            'medium': ['soon', 'next week', 'follow up', 'when you can', 'upcoming'],
            'timeline_pressure': [r'\b(by|due|deadline|before)\s+\w+day\b', r'\b(this|next)\s+(week|month)\b']
        }
        
        self.decision_indicators = {
            'approval_needed': ['approve', 'approval', 'sign off', 'authorize', 'permission'],
            'choice_required': ['decide', 'decision', 'choose', 'option', 'alternative', 'should we'],
            'budget_decision': ['budget', 'cost', 'expense', 'investment', 'spend', 'funding'],
            'strategic_decision': ['strategy', 'direction', 'approach', 'plan', 'roadmap']
        }
        
        self.blocker_indicators = {
            'dependency': ['waiting for', 'blocked by', 'depends on', 'need from', 'requires'],
            'issue': ['problem', 'issue', 'trouble', 'difficulty', 'challenge'],
            'delay': ['delayed', 'postponed', 'behind', 'slip', 'late'],
            'resource_constraint': ['overloaded', 'capacity', 'bandwidth', 'resources']
        }
        
        self.business_impact_keywords = {
            'revenue': ['revenue', 'sales', 'income', 'profit', 'customers', 'growth'],
            'cost': ['cost', 'expense', 'budget', 'savings', 'efficiency'],
            'team': ['team', 'hire', 'staff', 'capacity', 'workload', 'velocity'],
            'product': ['product', 'feature', 'launch', 'development', 'roadmap'],
            'customer': ['customer', 'client', 'user', 'satisfaction', 'feedback'],
            'risk': ['risk', 'concern', 'issue', 'problem', 'threat']
        }

    async def generate_powerful_free_intelligence(
        self, 
        emails: List[Dict], 
        calendar_events: List[Dict] = None
    ) -> Dict[str, Any]:
        """
        Generate sophisticated intelligence without AI that provides real value
        """
        
        # Fix current issues first
        enhanced_emails = await self._enhance_email_extraction(emails)
        
        if not enhanced_emails:
            return self._generate_no_data_response()
        
        # Core intelligence extraction (sophisticated but non-AI)
        intelligence = {
            'processing_metadata': {
                'emails_processed': len(enhanced_emails),
                'processing_method': 'advanced_pattern_analysis',
                'intelligence_level': 'sophisticated_non_ai',
                'processing_time': datetime.utcnow().isoformat()
            },
            
            # 1. SOPHISTICATED PATTERN RECOGNITION
            'communication_intelligence': await self._analyze_communication_patterns(enhanced_emails),
            
            # 2. BUSINESS SIGNAL DETECTION
            'business_signals': await self._extract_business_signals(enhanced_emails),
            
            # 3. STAKEHOLDER NETWORK ANALYSIS
            'stakeholder_intelligence': await self._analyze_stakeholder_networks(enhanced_emails),
            
            # 4. URGENCY & PRIORITY ANALYSIS
            'priority_intelligence': await self._analyze_priority_signals(enhanced_emails),
            
            # 5. TREND & PATTERN ANALYSIS
            'trend_analysis': await self._analyze_trends_and_patterns(enhanced_emails),
            
            # 6. ACTION INTELLIGENCE
            'action_intelligence': await self._extract_action_intelligence(enhanced_emails),
            
            # 7. EFFICIENCY METRICS
            'efficiency_metrics': await self._calculate_efficiency_metrics(enhanced_emails),
            
            # 8. CALENDAR CORRELATION (if available)
            'calendar_intelligence': await self._correlate_calendar_data(enhanced_emails, calendar_events or [])
        }
        
        # Generate executive brief from sophisticated analysis
        return await self._generate_sophisticated_brief(intelligence, enhanced_emails)

    async def _enhance_email_extraction(self, emails: List[Dict]) -> List[Dict]:
        """Fix current email extraction issues"""
        enhanced = []
        
        for email in emails:
            # Extract more complete email data
            enhanced_email = {
                'id': email.get('id'),
                'subject': email.get('subject', '').strip(),
                'from_name': self._extract_clean_name(email.get('from', {})),
                'from_email': self._extract_clean_email(email.get('from', {})),
                'body': self._extract_clean_body(email),
                'date': email.get('date'),
                'timestamp': self._parse_timestamp(email.get('date')),
                'thread_id': email.get('threadId'),
                'snippet': email.get('snippet', ''),
                'labels': email.get('labels', []),
                'word_count': 0,
                'business_relevance_score': 0
            }
            
            # Calculate content quality metrics
            enhanced_email['word_count'] = len(enhanced_email['body'].split())
            enhanced_email['business_relevance_score'] = self._calculate_business_relevance(enhanced_email)
            
            # Only include emails with substantial content
            if enhanced_email['word_count'] > 10 and enhanced_email['business_relevance_score'] > 0.3:
                enhanced.append(enhanced_email)
        
        return enhanced

    def _extract_clean_name(self, from_data: Dict) -> str:
        """Extract clean sender name"""
        if isinstance(from_data, dict):
            name = from_data.get('name', '')
            if name and name.strip():
                return name.strip().replace('"', '')
        
        # Fallback to email parsing
        if isinstance(from_data, str):
            match = re.match(r'^(.*?)\s*<([^>]+)>', from_data)
            if match:
                return match.group(1).strip().replace('"', '')
        
        return from_data.get('email', 'Unknown') if isinstance(from_data, dict) else str(from_data)

    def _extract_clean_email(self, from_data: Dict) -> str:
        """Extract clean sender email"""
        if isinstance(from_data, dict):
            return from_data.get('email', '')
        
        if isinstance(from_data, str):
            match = re.match(r'^.*?<([^>]+)>', from_data)
            if match:
                return match.group(1)
            elif '@' in from_data:
                return from_data
        
        return ''

    def _extract_clean_body(self, email: Dict) -> str:
        """Extract clean email body with better content extraction"""
        body = email.get('body', '')
        
        if not body or len(body.strip()) < 20:
            body = email.get('snippet', '')
        
        if not body:
            return ''
        
        # Clean HTML and email artifacts
        body = re.sub(r'<[^>]+>', ' ', body)  # Remove HTML
        body = re.sub(r'&[a-zA-Z0-9#]+;', ' ', body)  # Remove HTML entities
        body = re.sub(r'On.*?wrote:', '', body, flags=re.DOTALL)  # Remove forwarded content
        body = re.sub(r'From:.*?Subject:.*?\n', '', body, flags=re.DOTALL)  # Remove headers
        body = re.sub(r'\s+', ' ', body).strip()  # Normalize whitespace
        
        return body

    def _calculate_business_relevance(self, email: Dict) -> float:
        """Calculate how business-relevant an email is (0-1 score)"""
        content = f"{email['subject']} {email['body']}".lower()
        
        # Exclude obvious non-business content
        excluded_patterns = [
            'newsletter', 'unsubscribe', 'noreply', 'marketing', 'promotion',
            'social media', 'facebook', 'instagram', 'twitter'
        ]
        
        if any(pattern in content for pattern in excluded_patterns):
            return 0.1
        
        # Score based on business indicators
        score = 0.5  # Base score
        
        # Business terms
        business_terms = ['meeting', 'project', 'decision', 'budget', 'team', 'client', 'customer']
        score += min(0.3, sum(0.05 for term in business_terms if term in content))
        
        # Action indicators
        action_terms = ['need', 'require', 'please', 'can you', 'follow up', 'deadline']
        score += min(0.2, sum(0.03 for term in action_terms if term in content))
        
        return min(1.0, score)

    async def _analyze_communication_patterns(self, emails: List[Dict]) -> Dict[str, Any]:
        """Analyze communication patterns for insights"""
        
        # Volume analysis
        total_emails = len(emails)
        today = datetime.now().date()
        emails_by_day = defaultdict(int)
        
        for email in emails:
            if email['timestamp']:
                day = email['timestamp'].date()
                emails_by_day[day] += 1
        
        # Response time analysis
        response_patterns = self._analyze_response_patterns(emails)
        
        # Sender analysis
        sender_analysis = self._analyze_sender_patterns(emails)
        
        # Thread analysis
        thread_analysis = self._analyze_thread_patterns(emails)
        
        return {
            'volume_metrics': {
                'total_emails': total_emails,
                'daily_average': total_emails / max(1, len(emails_by_day)),
                'busiest_day': max(emails_by_day, key=emails_by_day.get) if emails_by_day else None,
                'volume_trend': self._calculate_volume_trend(emails_by_day)
            },
            'response_patterns': response_patterns,
            'sender_analysis': sender_analysis,
            'thread_analysis': thread_analysis
        }

    async def _extract_business_signals(self, emails: List[Dict]) -> List[IntelligenceSignal]:
        """Extract business signals using sophisticated pattern matching"""
        signals = []
        
        for email in emails:
            content = f"{email['subject']} {email['body']}"
            
            # Decision signals
            decision_signals = self._detect_decision_signals(email, content)
            signals.extend(decision_signals)
            
            # Blocker signals  
            blocker_signals = self._detect_blocker_signals(email, content)
            signals.extend(blocker_signals)
            
            # Urgency signals
            urgency_signals = self._detect_urgency_signals(email, content)
            signals.extend(urgency_signals)
            
            # Opportunity signals
            opportunity_signals = self._detect_opportunity_signals(email, content)
            signals.extend(opportunity_signals)
        
        # Rank and prioritize signals
        prioritized_signals = sorted(signals, key=lambda x: (x.priority, x.confidence), reverse=True)
        
        return prioritized_signals[:15]  # Top 15 signals

    def _detect_decision_signals(self, email: Dict, content: str) -> List[IntelligenceSignal]:
        """Detect decision-related signals"""
        signals = []
        content_lower = content.lower()
        
        for category, keywords in self.decision_indicators.items():
            for keyword in keywords:
                if keyword in content_lower:
                    # Extract context around the decision
                    context = self._extract_context_around_keyword(content, keyword, 50)
                    
                    signal = IntelligenceSignal(
                        signal_type='decision',
                        priority=self._calculate_decision_priority(content, keyword),
                        title=f"Decision Required: {email['subject'][:50]}",
                        description=f"{category.replace('_', ' ').title()}: {context}",
                        evidence=[context],
                        stakeholders=[email['from_name']],
                        confidence=self._calculate_confidence(content, keyword),
                        business_category=self._categorize_business_impact(content)
                    )
                    signals.append(signal)
                    break  # One signal per category per email
        
        return signals

    def _detect_blocker_signals(self, email: Dict, content: str) -> List[IntelligenceSignal]:
        """Detect blocker/impediment signals"""
        signals = []
        content_lower = content.lower()
        
        for category, keywords in self.blocker_indicators.items():
            for keyword in keywords:
                if keyword in content_lower:
                    context = self._extract_context_around_keyword(content, keyword, 50)
                    
                    signal = IntelligenceSignal(
                        signal_type='blocker',
                        priority=self._calculate_decision_priority(content, keyword),
                        title=f"Potential Blocker: {category.replace('_', ' ').title()}",
                        description=context,
                        evidence=[context],
                        stakeholders=[email['from_name']],
                        confidence=self._calculate_confidence(content, keyword),
                        business_category=self._categorize_business_impact(content)
                    )
                    signals.append(signal)
                    break
        
        return signals

    def _detect_urgency_signals(self, email: Dict, content: str) -> List[IntelligenceSignal]:
        """Detect urgency signals"""
        signals = []
        content_lower = content.lower()
        
        urgency_level = 'low'
        urgency_keywords = []
        
        for level, keywords in self.urgency_indicators.items():
            if level != 'timeline_pressure':
                for keyword in keywords:
                    if keyword in content_lower:
                        urgency_level = level
                        urgency_keywords.append(keyword)
        
        # Check for timeline patterns
        for pattern in self.urgency_indicators['timeline_pressure']:
            if re.search(pattern, content_lower):
                urgency_level = 'high' if urgency_level == 'low' else urgency_level
                urgency_keywords.append('timeline pressure')
        
        if urgency_keywords:
            signal = IntelligenceSignal(
                signal_type='urgency',
                priority=self._urgency_to_priority(urgency_level),
                title=f"Urgent Item: {email['subject'][:50]}",
                description=f"Urgency level: {urgency_level}. Keywords: {', '.join(urgency_keywords)}",
                evidence=[content[:200]],
                stakeholders=[email['from_name']],
                confidence=0.8,
                business_category=self._categorize_business_impact(content)
            )
            signals.append(signal)
        
        return signals

    def _detect_opportunity_signals(self, email: Dict, content: str) -> List[IntelligenceSignal]:
        """Detect opportunity signals"""
        signals = []
        content_lower = content.lower()
        
        opportunity_keywords = [
            'opportunity', 'potential', 'growth', 'expand', 'new client',
            'partnership', 'collaboration', 'win', 'success', 'achievement'
        ]
        
        found_keywords = [kw for kw in opportunity_keywords if kw in content_lower]
        
        if found_keywords:
            # Extract context for the first keyword found
            context = self._extract_context_around_keyword(content, found_keywords[0] if found_keywords else "", 100)
            
            signal = IntelligenceSignal(
                signal_type='opportunity',
                priority=self._calculate_decision_priority(content, found_keywords[0] if found_keywords else "opportunity"),
                title=f"Opportunity Identified: {email['subject'][:50]}",
                description=context,
                evidence=[context],
                stakeholders=[email['from_name']],
                confidence=0.7,
                business_category=self._categorize_business_impact(content)
            )
            signals.append(signal)
        
        return signals

    async def _analyze_stakeholder_networks(self, emails: List[Dict]) -> Dict[str, Any]:
        """Analyze stakeholder networks and communication patterns"""
        
        # Build communication frequency map
        stakeholder_frequency = Counter()
        stakeholder_contexts = defaultdict(list)
        
        for email in emails:
            sender = email['from_name']
            if sender and sender != 'Unknown':
                stakeholder_frequency[sender] += 1
                stakeholder_contexts[sender].append({
                    'subject': email['subject'],
                    'date': email['date'],
                    'business_category': self._categorize_business_impact(email['body'])
                })
        
        # Analyze stakeholder influence
        stakeholder_influence = {}
        for stakeholder, count in stakeholder_frequency.items():
            contexts = stakeholder_contexts[stakeholder]
            business_categories = [ctx['business_category'] for ctx in contexts]
            
            stakeholder_influence[stakeholder] = {
                'communication_frequency': count,
                'influence_score': self._calculate_influence_score(count, business_categories),
                'primary_topics': Counter(business_categories).most_common(3),
                'recent_activity': len([ctx for ctx in contexts if self._is_recent(ctx['date'])])
            }
        
        # Identify key stakeholders
        key_stakeholders = sorted(
            stakeholder_influence.items(),
            key=lambda x: x[1]['influence_score'],
            reverse=True
        )[:10]
        
        return {
            'total_stakeholders': len(stakeholder_frequency),
            'key_stakeholders': dict(key_stakeholders),
            'communication_distribution': dict(stakeholder_frequency.most_common(10)),
            'network_health': self._assess_network_health(stakeholder_influence)
        }

    async def _analyze_priority_signals(self, emails: List[Dict]) -> Dict[str, Any]:
        """Analyze priority and urgency signals"""
        
        priority_distribution = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0}
        urgent_items = []
        deadline_items = []
        
        for email in emails:
            content = f"{email['subject']} {email['body']}".lower()
            
            # Assess priority level
            priority = self._assess_email_priority(content)
            priority_distribution[priority] += 1
            
            if priority in ['critical', 'high']:
                urgent_items.append({
                    'subject': email['subject'],
                    'from': email['from_name'],
                    'priority': priority,
                    'reasoning': self._explain_priority_reasoning(content)
                })
            
            # Detect deadlines
            deadlines = self._extract_deadlines(content)
            if deadlines:
                deadline_items.append({
                    'subject': email['subject'],
                    'from': email['from_name'],
                    'deadlines': deadlines
                })
        
        return {
            'priority_distribution': priority_distribution,
            'urgent_items': urgent_items[:10],
            'deadline_items': deadline_items[:10],
            'attention_score': self._calculate_attention_score(priority_distribution)
        }

    async def _analyze_trends_and_patterns(self, emails: List[Dict]) -> Dict[str, Any]:
        """Analyze trends and patterns in communications"""
        
        # Topic frequency analysis
        all_content = ' '.join([f"{email['subject']} {email['body']}" for email in emails])
        topic_analysis = self._extract_topic_frequencies(all_content)
        
        # Temporal patterns
        temporal_patterns = self._analyze_temporal_patterns(emails)
        
        # Communication style analysis
        style_analysis = self._analyze_communication_styles(emails)
        
        # Recurring themes
        recurring_themes = self._identify_recurring_themes(emails)
        
        return {
            'topic_frequencies': topic_analysis,
            'temporal_patterns': temporal_patterns,
            'communication_styles': style_analysis,
            'recurring_themes': recurring_themes,
            'pattern_insights': self._generate_pattern_insights(topic_analysis, temporal_patterns)
        }

    async def _extract_action_intelligence(self, emails: List[Dict]) -> Dict[str, Any]:
        """Extract actionable intelligence"""
        
        action_items = []
        follow_ups = []
        decisions_needed = []
        
        for email in emails:
            content = f"{email['subject']} {email['body']}"
            
            # Extract action items
            actions = self._extract_action_items(content)
            for action in actions:
                action_items.append({
                    'action': action,
                    'source_email': email['subject'],
                    'from': email['from_name'],
                    'urgency': self._assess_action_urgency(action)
                })
            
            # Extract follow-up needs
            if self._requires_follow_up(content):
                follow_ups.append({
                    'subject': email['subject'],
                    'from': email['from_name'],
                    'follow_up_type': self._classify_follow_up_type(content)
                })
            
            # Extract decision needs
            if self._requires_decision(content):
                decisions_needed.append({
                    'subject': email['subject'],
                    'from': email['from_name'],
                    'decision_type': self._classify_decision_type(content)
                })
        
        return {
            'action_items': action_items[:15],
            'follow_ups_needed': follow_ups[:10],
            'decisions_needed': decisions_needed[:10],
            'actionability_score': self._calculate_actionability_score(action_items, follow_ups, decisions_needed)
        }

    async def _calculate_efficiency_metrics(self, emails: List[Dict]) -> Dict[str, Any]:
        """Calculate communication efficiency metrics"""
        
        total_emails = len(emails)
        
        # Response requirement analysis
        responses_needed = sum(1 for email in emails if self._requires_response(email['body']))
        
        # Thread efficiency
        thread_analysis = self._analyze_thread_efficiency(emails)
        
        # Content quality analysis
        quality_metrics = self._analyze_content_quality(emails)
        
        return {
            'total_communications': total_emails,
            'responses_needed': responses_needed,
            'response_rate': responses_needed / max(1, total_emails),
            'thread_efficiency': thread_analysis,
            'content_quality': quality_metrics,
            'communication_load': self._assess_communication_load(total_emails),
            'efficiency_recommendations': self._generate_efficiency_recommendations(thread_analysis, quality_metrics)
        }

    async def _correlate_calendar_data(self, emails: List[Dict], calendar_events: List[Dict]) -> Dict[str, Any]:
        """Correlate email and calendar data for insights"""
        
        if not calendar_events:
            return {'status': 'no_calendar_data'}
        
        # Find email-meeting correlations
        correlations = []
        meeting_follow_ups = []
        
        for event in calendar_events:
            # Look for related emails
            related_emails = self._find_related_emails(event, emails)
            if related_emails:
                correlations.append({
                    'meeting': event.get('summary', 'Untitled'),
                    'date': event.get('start_time'),
                    'related_emails': len(related_emails),
                    'follow_up_ratio': self._calculate_follow_up_ratio(event, related_emails)
                })
        
        return {
            'email_meeting_correlations': correlations,
            'meeting_follow_up_analysis': meeting_follow_ups,
            'calendar_email_efficiency': self._calculate_calendar_email_efficiency(correlations)
        }

    async def _generate_sophisticated_brief(self, intelligence: Dict, emails: List[Dict]) -> Dict[str, Any]:
        """Generate sophisticated executive brief from intelligence"""
        
        business_signals = intelligence['business_signals']
        communication_intel = intelligence['communication_intelligence']
        stakeholder_intel = intelligence['stakeholder_intelligence']
        priority_intel = intelligence['priority_intelligence']
        action_intel = intelligence['action_intelligence']
        
        return {
            'userId': self.user_id or 'unknown',
            'generatedAt': datetime.utcnow().isoformat(),
            'style': 'sophisticated_free_tier',
            'version': '4.0_advanced_non_ai',
            'dataSource': 'sophisticated_pattern_analysis',
            
            # Executive Summary (sophisticated but non-AI)
            'executiveSummary': self._generate_executive_summary_sophisticated(intelligence),
            
            # Key insights
            'keyInsights': self._extract_key_insights(business_signals, communication_intel),
            
            # Priority items with business context
            'priorityItems': self._format_priority_items(priority_intel['urgent_items']),
            
            # Stakeholder intelligence
            'stakeholderIntelligence': stakeholder_intel,
            
            # Action intelligence
            'actionIntelligence': action_intel,
            
            # Communication patterns
            'communicationPatterns': communication_intel,
            
            # Business signals
            'businessSignals': [self._format_signal(signal) for signal in business_signals[:10]],
            
            # Trends and patterns
            'trendsAndPatterns': intelligence['trend_analysis'],
            
            # Efficiency metrics
            'efficiencyMetrics': intelligence['efficiency_metrics'],
            
            # Processing metadata
            'processing_metadata': {
                **intelligence['processing_metadata'],
                'intelligence_signals_detected': len(business_signals),
                'stakeholders_analyzed': len(stakeholder_intel['key_stakeholders']),
                'patterns_identified': len(intelligence['trend_analysis']['recurring_themes']),
                'value_tier': 'free_sophisticated'
            }
        }

    # Helper methods for sophisticated analysis...
    def _parse_timestamp(self, date_str: str) -> Optional[datetime]:
        """Parse email timestamp"""
        if not date_str:
            return None
        try:
            # Handle various date formats
            from email.utils import parsedate_to_datetime
            return parsedate_to_datetime(date_str)
        except:
            return None

    def _calculate_volume_trend(self, emails_by_day: Dict) -> str:
        """Calculate volume trend"""
        if len(emails_by_day) < 2:
            return 'insufficient_data'
        
        daily_counts = list(emails_by_day.values())
        if len(daily_counts) >= 3:
            recent_avg = statistics.mean(daily_counts[-3:])
            earlier_avg = statistics.mean(daily_counts[:-3])
            if recent_avg > earlier_avg * 1.2:
                return 'increasing'
            elif recent_avg < earlier_avg * 0.8:
                return 'decreasing'
        
        return 'stable'

    def _extract_context_around_keyword(self, content: str, keyword: str, context_length: int) -> str:
        """Extract context around a keyword"""
        content_lower = content.lower()
        keyword_lower = keyword.lower()
        
        pos = content_lower.find(keyword_lower)
        if pos == -1:
            return content[:context_length]
        
        start = max(0, pos - context_length // 2)
        end = min(len(content), pos + len(keyword) + context_length // 2)
        
        return content[start:end].strip()

    def _calculate_decision_priority(self, content: str, keyword: str) -> int:
        """Calculate priority for decision signals"""
        base_priority = 6
        
        # Boost priority based on urgency indicators
        if any(word in content.lower() for word in ['urgent', 'critical', 'asap']):
            base_priority += 2
        
        # Boost for business impact keywords
        if any(word in content.lower() for word in ['revenue', 'customer', 'budget']):
            base_priority += 1
        
        return min(10, base_priority)

    def _calculate_confidence(self, content: str, keyword: str) -> float:
        """Calculate confidence in signal detection"""
        base_confidence = 0.6
        
        # Increase confidence if keyword appears multiple times
        occurrences = content.lower().count(keyword.lower())
        base_confidence += min(0.3, occurrences * 0.1)
        
        # Increase confidence if in subject line
        if keyword.lower() in content[:100].lower():  # Approximate subject area
            base_confidence += 0.1
        
        return min(1.0, base_confidence)

    def _urgency_to_priority(self, urgency_level: str) -> int:
        """Convert urgency level to priority score (1-10)"""
        if urgency_level == 'high':
            return 9
        elif urgency_level == 'medium':
            return 6
        else:  # low
            return 3

    def _classify_decision_type(self, content: str) -> str:
        """Classify the type of decision needed"""
        content_lower = content.lower()

        # Check for different decision types
        if any(keyword in content_lower for keyword in ['budget', 'cost', 'spend', 'finance', 'money']):
            return 'financial'
        elif any(keyword in content_lower for keyword in ['hire', 'team', 'personnel', 'staff']):
            return 'personnel'
        elif any(keyword in content_lower for keyword in ['strategy', 'direction', 'plan', 'roadmap']):
            return 'strategic'
        elif any(keyword in content_lower for keyword in ['approve', 'authorization', 'permission']):
            return 'approval'
        elif any(keyword in content_lower for keyword in ['priority', 'urgent', 'timeline', 'deadline']):
            return 'priority'
        else:
            return 'general'

    def _calculate_actionability_score(self, action_items: list, follow_ups: list, decisions_needed: list) -> float:
        """Calculate overall actionability score based on identified items"""
        if not any([action_items, follow_ups, decisions_needed]):
            return 0.0

        total_items = len(action_items) + len(follow_ups) + len(decisions_needed)

        # Weight different types of actionable items
        action_weight = len(action_items) * 1.0
        followup_weight = len(follow_ups) * 0.8
        decision_weight = len(decisions_needed) * 1.2

        weighted_score = (action_weight + followup_weight + decision_weight) / 10.0
        return min(1.0, weighted_score)

    def _categorize_business_impact(self, content: str) -> str:
        """Categorize business impact area"""
        content_lower = content.lower()

        category_scores = {}
        for category, keywords in self.business_impact_keywords.items():
            score = sum(1 for keyword in keywords if keyword in content_lower)
            if score > 0:
                category_scores[category] = score

        if category_scores:
            return max(category_scores, key=category_scores.get)

        return 'general'

    def _analyze_thread_efficiency(self, emails: List[Dict]) -> Dict[str, Any]:
        """Analyze email thread efficiency metrics"""
        thread_stats = {}

        # Group emails by subject (simple thread detection)
        threads = {}
        for email in emails:
            subject = email.get('subject', '').lower()
            # Remove common prefixes for thread grouping
            clean_subject = re.sub(r'^(re:|fwd:|fw:)\s*', '', subject).strip()
            if clean_subject:
                if clean_subject not in threads:
                    threads[clean_subject] = []
                threads[clean_subject].append(email)

        # Calculate thread metrics
        thread_lengths = [len(thread) for thread in threads.values()]

        return {
            'total_threads': len(threads),
            'avg_thread_length': sum(thread_lengths) / max(1, len(thread_lengths)),
            'max_thread_length': max(thread_lengths) if thread_lengths else 0,
            'single_message_threads': sum(1 for length in thread_lengths if length == 1),
            'long_threads': sum(1 for length in thread_lengths if length > 5),
            'efficiency_score': min(1.0, 5.0 / max(1, sum(thread_lengths) / max(1, len(thread_lengths))))
        }

    def _analyze_content_quality(self, emails: List[Dict]) -> Dict[str, Any]:
        """Analyze email content quality metrics"""
        quality_scores = []

        for email in emails:
            content = email.get('body', '')
            score = 0

            # Check for clarity indicators
            if len(content) > 50 and len(content) < 500:
                score += 0.3  # Good length

            # Check for action words
            action_words = ['please', 'need', 'require', 'must', 'should', 'will', 'can you']
            if any(word in content.lower() for word in action_words):
                score += 0.3

            # Check for structure (paragraphs, lists)
            if '\n\n' in content or '•' in content or '- ' in content:
                score += 0.2

            # Check for questions
            if '?' in content:
                score += 0.2

            quality_scores.append(min(1.0, score))

        return {
            'avg_quality_score': sum(quality_scores) / max(1, len(quality_scores)),
            'high_quality_count': sum(1 for score in quality_scores if score > 0.7),
            'low_quality_count': sum(1 for score in quality_scores if score < 0.3),
            'clarity_rating': 'high' if sum(quality_scores) / max(1, len(quality_scores)) > 0.7 else 'medium' if sum(quality_scores) / max(1, len(quality_scores)) > 0.4 else 'low'
        }

    def _assess_communication_load(self, total_emails: int) -> str:
        """Assess overall communication load"""
        if total_emails < 10:
            return 'light'
        elif total_emails < 30:
            return 'moderate'
        elif total_emails < 60:
            return 'heavy'
        else:
            return 'overwhelming'

    def _generate_efficiency_recommendations(self, thread_analysis: Dict, quality_metrics: Dict) -> List[str]:
        """Generate efficiency recommendations based on metrics"""
        recommendations = []

        if thread_analysis.get('long_threads', 0) > 3:
            recommendations.append("Consider scheduling meetings for lengthy email threads")

        if thread_analysis.get('single_message_threads', 0) > 10:
            recommendations.append("Many single-message threads - consider batching communications")

        if quality_metrics.get('low_quality_count', 0) > 5:
            recommendations.append("Several unclear messages detected - request clarification where needed")

        if quality_metrics.get('clarity_rating') == 'low':
            recommendations.append("Overall message clarity is low - establish clearer communication guidelines")

        if not recommendations:
            recommendations.append("Communication patterns appear efficient")

        return recommendations

    def _find_related_emails(self, event: Dict, emails: List[Dict]) -> List[Dict]:
        """Find emails related to a calendar event"""
        related = []
        event_title = event.get('summary', '').lower()
        event_date = event.get('start_time')

        for email in emails:
            email_subject = email.get('subject', '').lower()
            email_body = email.get('body', '').lower()

            # Check if event title appears in email
            if event_title and (event_title in email_subject or event_title in email_body):
                related.append(email)
                continue

            # Check for meeting-related keywords near the event date
            if event_date and 'meeting' in email_subject:
                # Simple date proximity check (would need proper date parsing in production)
                related.append(email)

        return related

    def _calculate_follow_up_ratio(self, event: Dict, related_emails: List[Dict]) -> float:
        """Calculate follow-up ratio for a meeting"""
        if not related_emails:
            return 0.0

        # Simple heuristic: emails after the event are follow-ups
        # In production, would need proper date comparison
        follow_up_count = len(related_emails) // 2  # Simplified assumption

        return min(1.0, follow_up_count / max(1, len(related_emails)))

    def _calculate_calendar_email_efficiency(self, correlations: List[Dict]) -> float:
        """Calculate overall calendar-email efficiency"""
        if not correlations:
            return 0.5  # Neutral score if no data

        follow_up_ratios = [c.get('follow_up_ratio', 0) for c in correlations]
        avg_ratio = sum(follow_up_ratios) / max(1, len(follow_up_ratios))

        # Good efficiency means appropriate follow-up (not too little, not too much)
        if 0.3 <= avg_ratio <= 0.7:
            return 0.8
        elif avg_ratio < 0.3:
            return 0.5  # Too few follow-ups
        else:
            return 0.6  # Too many follow-ups

    def _assess_action_urgency(self, action: str) -> str:
        """Assess the urgency level of an action item"""
        action_lower = action.lower()

        # High urgency keywords
        high_urgency_keywords = [
            'urgent', 'asap', 'immediately', 'emergency', 'critical',
            'deadline', 'today', 'tomorrow', 'by end of day', 'eod',
            'rush', 'priority', 'escalate'
        ]

        # Medium urgency keywords
        medium_urgency_keywords = [
            'soon', 'this week', 'next week', 'follow up', 'review',
            'schedule', 'plan', 'prepare', 'discuss', 'meeting'
        ]

        # Check for high urgency
        if any(keyword in action_lower for keyword in high_urgency_keywords):
            return 'high'

        # Check for medium urgency
        if any(keyword in action_lower for keyword in medium_urgency_keywords):
            return 'medium'

        # Default to low urgency
        return 'low'

    def _generate_no_data_response(self) -> Dict[str, Any]:
        """Generate response when no substantial data is found"""
        return {
            'userId': self.user_id or 'unknown',
            'generatedAt': datetime.utcnow().isoformat(),
            'style': 'no_data',
            'version': '4.0_no_data',
            'dataSource': 'insufficient_data',
            'executiveSummary': 'No substantial business communications found in current period.',
            'keyInsights': [],
            'processing_metadata': {
                'emails_processed': 0,
                'reason': 'insufficient_business_relevant_content',
                'suggestion': 'Check email filters or extend time range'
            }
        }

    # Additional helper methods would be implemented here...
    # This provides a sophisticated foundation without requiring AI/LLM

    def _format_signal(self, signal: IntelligenceSignal) -> Dict:
        """Format signal for output"""
        return {
            'type': signal.signal_type,
            'priority': signal.priority,
            'title': signal.title,
            'description': signal.description,
            'stakeholders': signal.stakeholders,
            'business_category': signal.business_category,
            'confidence': signal.confidence
        }

    def _generate_executive_summary_sophisticated(self, intelligence: Dict) -> str:
        """Generate sophisticated executive summary without AI"""
        
        business_signals = intelligence['business_signals']
        communication_intel = intelligence['communication_intelligence']
        priority_intel = intelligence['priority_intelligence']
        stakeholder_intel = intelligence['stakeholder_intelligence']
        
        # Count high-priority items
        high_priority_count = len([s for s in business_signals if s.priority >= 7])
        urgent_count = priority_intel['priority_distribution']['critical'] + priority_intel['priority_distribution']['high']
        
        # Identify top stakeholder
        top_stakeholder = None
        if stakeholder_intel['key_stakeholders']:
            top_stakeholder = list(stakeholder_intel['key_stakeholders'].keys())[0]
        
        # Build summary components
        summary_parts = []
        
        # Volume and activity
        total_emails = communication_intel['volume_metrics']['total_emails']
        summary_parts.append(f"**Communication Analysis**: {total_emails} business communications processed")
        
        # Priority assessment
        if high_priority_count > 0:
            summary_parts.append(f"**Priority Items**: {high_priority_count} high-priority signals detected requiring attention")
        
        if urgent_count > 0:
            summary_parts.append(f"**Urgent Actions**: {urgent_count} items marked as urgent or critical")
        
        # Key stakeholder activity
        if top_stakeholder:
            stakeholder_data = stakeholder_intel['key_stakeholders'][top_stakeholder]
            summary_parts.append(f"**Key Contact**: {top_stakeholder} (influence score: {stakeholder_data['influence_score']:.1f})")
        
        # Business signal summary
        signal_types = Counter([s.signal_type for s in business_signals])
        if signal_types:
            top_signal_type = signal_types.most_common(1)[0]
            summary_parts.append(f"**Primary Focus**: {top_signal_type[0]} signals ({top_signal_type[1]} detected)")
        
        return '\n'.join(summary_parts)

    def _extract_key_insights(self, business_signals: List[IntelligenceSignal], communication_intel: Dict) -> List[Dict]:
        """Extract key insights from analysis"""
        insights = []
        
        # Signal-based insights
        signal_categories = Counter([s.business_category for s in business_signals])
        for category, count in signal_categories.most_common(3):
            insights.append({
                'insight_type': 'business_focus',
                'title': f"{category.title()} Activity",
                'description': f"{count} signals detected in {category} category",
                'importance': 'high' if count >= 3 else 'medium'
            })
        
        # Communication pattern insights
        volume_trend = communication_intel['volume_metrics']['volume_trend']
        if volume_trend != 'stable':
            insights.append({
                'insight_type': 'communication_trend',
                'title': f"Communication Volume {volume_trend.title()}",
                'description': f"Email volume is {volume_trend} compared to recent patterns",
                'importance': 'medium'
            })
        
        # Stakeholder insights
        if 'sender_analysis' in communication_intel:
            sender_data = communication_intel['sender_analysis']
            if 'top_senders' in sender_data:
                top_sender = sender_data['top_senders'][0] if sender_data['top_senders'] else None
                if top_sender:
                    insights.append({
                        'insight_type': 'stakeholder_activity',
                        'title': 'Active Stakeholder Communication',
                        'description': f"High communication frequency with {top_sender['name']}",
                        'importance': 'medium'
                    })
        
        return insights[:5]  # Top 5 insights

    def _format_priority_items(self, urgent_items: List[Dict]) -> List[Dict]:
        """Format priority items for display"""
        formatted_items = []
        
        for item in urgent_items[:10]:
            formatted_items.append({
                'title': item['subject'],
                'from': item['from'],
                'priority_level': item['priority'],
                'reasoning': item['reasoning'],
                'action_required': self._suggest_action(item),
                'urgency_score': self._priority_to_urgency_score(item['priority'])
            })
        
        return formatted_items

    def _suggest_action(self, item: Dict) -> str:
        """Suggest appropriate action for priority item"""
        priority = item['priority']
        subject = item['subject'].lower()
        
        if 'approval' in subject or 'approve' in subject:
            return "Review and provide approval decision"
        elif 'meeting' in subject:
            return "Confirm attendance or reschedule"
        elif 'decision' in subject:
            return "Make strategic decision"
        elif priority == 'critical':
            return "Immediate response required"
        else:
            return "Review and respond as appropriate"

    def _priority_to_urgency_score(self, priority: str) -> int:
        """Convert priority to urgency score"""
        priority_map = {
            'critical': 10,
            'high': 8,
            'medium': 5,
            'low': 2
        }
        return priority_map.get(priority, 5)

    # Additional sophisticated analysis methods
    def _analyze_response_patterns(self, emails: List[Dict]) -> Dict:
        """Analyze response patterns"""
        # Group emails by thread
        threads = defaultdict(list)
        for email in emails:
            if email['thread_id']:
                threads[email['thread_id']].append(email)
        
        response_analysis = {
            'total_threads': len(threads),
            'single_message_threads': len([t for t in threads.values() if len(t) == 1]),
            'multi_message_threads': len([t for t in threads.values() if len(t) > 1]),
            'average_thread_length': statistics.mean([len(t) for t in threads.values()]) if threads else 0
        }
        
        return response_analysis

    def _analyze_sender_patterns(self, emails: List[Dict]) -> Dict:
        """Analyze sender patterns"""
        sender_counts = Counter([email['from_name'] for email in emails if email['from_name']])
        
        return {
            'total_unique_senders': len(sender_counts),
            'top_senders': [
                {'name': name, 'count': count} 
                for name, count in sender_counts.most_common(5)
            ],
            'sender_distribution': dict(sender_counts)
        }

    def _analyze_thread_patterns(self, emails: List[Dict]) -> Dict:
        """Analyze thread patterns"""
        threads = defaultdict(list)
        for email in emails:
            if email['thread_id']:
                threads[email['thread_id']].append(email)
        
        thread_lengths = [len(thread) for thread in threads.values()]
        
        return {
            'total_threads': len(threads),
            'average_thread_length': statistics.mean(thread_lengths) if thread_lengths else 0,
            'longest_thread': max(thread_lengths) if thread_lengths else 0,
            'thread_efficiency': 'high' if statistics.mean(thread_lengths) <= 3 else 'needs_improvement'
        }

    def _calculate_influence_score(self, frequency: int, business_categories: List[str]) -> float:
        """Calculate stakeholder influence score"""
        base_score = min(10, frequency * 0.5)  # Frequency component
        
        # Boost for business-critical categories
        critical_categories = ['revenue', 'customer', 'product', 'risk']
        critical_mentions = sum(1 for cat in business_categories if cat in critical_categories)
        
        category_boost = min(3, critical_mentions * 0.5)
        
        return round(base_score + category_boost, 1)

    def _is_recent(self, date_str: str) -> bool:
        """Check if date is recent (within last 3 days)"""
        if not date_str:
            return False
        
        try:
            date_obj = self._parse_timestamp(date_str)
            if date_obj:
                return (datetime.now(date_obj.tzinfo) - date_obj).days <= 3
        except:
            pass
        
        return False

    def _assess_network_health(self, stakeholder_influence: Dict) -> str:
        """Assess overall network health"""
        if not stakeholder_influence:
            return 'no_data'
        
        active_stakeholders = len([s for s in stakeholder_influence.values() if s['recent_activity'] > 0])
        total_stakeholders = len(stakeholder_influence)
        
        activity_ratio = active_stakeholders / total_stakeholders if total_stakeholders > 0 else 0
        
        if activity_ratio >= 0.7:
            return 'highly_active'
        elif activity_ratio >= 0.4:
            return 'moderately_active'
        else:
            return 'low_activity'

    def _assess_email_priority(self, content: str) -> str:
        """Assess email priority level"""
        content_lower = content.lower()
        
        # Critical indicators
        if any(word in content_lower for word in self.urgency_indicators['critical']):
            return 'critical'
        
        # High priority indicators
        if any(word in content_lower for word in self.urgency_indicators['high']):
            return 'high'
        
        # Medium priority indicators
        if any(word in content_lower for word in self.urgency_indicators['medium']):
            return 'medium'
        
        return 'low'

    def _explain_priority_reasoning(self, content: str) -> str:
        """Explain why email was marked as priority"""
        content_lower = content.lower()
        reasons = []
        
        for level, keywords in self.urgency_indicators.items():
            if level != 'timeline_pressure':
                found_keywords = [kw for kw in keywords if kw in content_lower]
                if found_keywords:
                    reasons.append(f"{level} keywords: {', '.join(found_keywords[:3])}")
        
        # Check timeline pressure
        for pattern in self.urgency_indicators['timeline_pressure']:
            if re.search(pattern, content_lower):
                reasons.append("timeline pressure detected")
                break
        
        return '; '.join(reasons) if reasons else 'priority indicators detected'

    def _extract_deadlines(self, content: str) -> List[str]:
        """Extract deadline information"""
        deadline_patterns = [
            r'\b(by|due|deadline|before)\s+(\w+day|\w+\s+\d{1,2})\b',
            r'\b(today|tomorrow|this week|next week|eod|end of day)\b',
            r'\b\d{1,2}[\/\-]\d{1,2}[\/\-]?\d{0,4}\b'
        ]
        
        deadlines = []
        for pattern in deadline_patterns:
            matches = re.findall(pattern, content.lower())
            deadlines.extend([' '.join(match) if isinstance(match, tuple) else match for match in matches])
        
        return list(set(deadlines))[:5]  # Remove duplicates, limit to 5

    def _calculate_attention_score(self, priority_distribution: Dict) -> float:
        """Calculate attention score based on priority distribution"""
        total = sum(priority_distribution.values())
        if total == 0:
            return 0.0
        
        # Weight priorities
        weights = {'critical': 4, 'high': 3, 'medium': 2, 'low': 1}
        weighted_score = sum(priority_distribution[level] * weights[level] for level in weights)
        
        # Normalize to 0-10 scale
        max_possible = total * 4  # All critical
        return round((weighted_score / max_possible) * 10, 1)

    def _extract_topic_frequencies(self, content: str) -> Dict[str, int]:
        """Extract topic frequencies using sophisticated text analysis"""
        # Clean and tokenize
        words = re.findall(r'\b[a-zA-Z]{3,}\b', content.lower())
        
        # Filter stopwords and common terms
        stopwords = {
            'the', 'and', 'you', 'that', 'this', 'for', 'are', 'with', 'have', 'will',
            'from', 'they', 'been', 'were', 'said', 'each', 'which', 'their', 'time',
            'email', 'message', 'gmail', 'com', 'sent', 'thanks', 'best', 'regards'
        }
        
        filtered_words = [word for word in words if word not in stopwords and len(word) > 3]
        
        # Count frequencies
        word_counts = Counter(filtered_words)
        
        # Return top topics
        return dict(word_counts.most_common(15))

    def _analyze_temporal_patterns(self, emails: List[Dict]) -> Dict:
        """Analyze temporal communication patterns"""
        if not emails:
            return {}
        
        # Group by day of week and hour
        day_counts = defaultdict(int)
        hour_counts = defaultdict(int)
        
        for email in emails:
            if email['timestamp']:
                day_counts[email['timestamp'].strftime('%A')] += 1
                hour_counts[email['timestamp'].hour] += 1
        
        return {
            'busiest_day': max(day_counts, key=day_counts.get) if day_counts else None,
            'busiest_hour': max(hour_counts, key=hour_counts.get) if hour_counts else None,
            'day_distribution': dict(day_counts),
            'hour_distribution': dict(hour_counts),
            'communication_pattern': self._classify_communication_pattern(day_counts, hour_counts)
        }

    def _classify_communication_pattern(self, day_counts: Dict, hour_counts: Dict) -> str:
        """Classify communication pattern"""
        if not day_counts or not hour_counts:
            return 'insufficient_data'
        
        # Check for weekend activity
        weekend_activity = day_counts.get('Saturday', 0) + day_counts.get('Sunday', 0)
        weekday_activity = sum(day_counts.values()) - weekend_activity
        
        if weekend_activity > weekday_activity * 0.3:
            return 'high_weekend_activity'
        
        # Check for after-hours activity
        business_hours_activity = sum(hour_counts.get(hour, 0) for hour in range(9, 18))
        total_activity = sum(hour_counts.values())
        
        if business_hours_activity < total_activity * 0.7:
            return 'significant_after_hours'
        
        return 'standard_business_pattern'

    def _analyze_communication_styles(self, emails: List[Dict]) -> Dict:
        """Analyze communication styles"""
        total_words = 0
        total_emails = len(emails)
        formal_indicators = 0
        urgent_indicators = 0
        
        for email in emails:
            words = len(email['body'].split())
            total_words += words
            
            content_lower = email['body'].lower()
            
            # Check for formal language
            formal_terms = ['please', 'thank you', 'regards', 'sincerely', 'respectfully']
            if any(term in content_lower for term in formal_terms):
                formal_indicators += 1
            
            # Check for urgent language
            urgent_terms = ['urgent', 'asap', 'immediately', 'critical']
            if any(term in content_lower for term in urgent_terms):
                urgent_indicators += 1
        
        avg_length = total_words / total_emails if total_emails > 0 else 0
        
        return {
            'average_email_length': round(avg_length, 1),
            'formality_score': formal_indicators / total_emails if total_emails > 0 else 0,
            'urgency_frequency': urgent_indicators / total_emails if total_emails > 0 else 0,
            'communication_style': self._classify_communication_style(avg_length, formal_indicators, total_emails)
        }

    def _classify_communication_style(self, avg_length: float, formal_indicators: int, total_emails: int) -> str:
        """Classify overall communication style"""
        if avg_length > 100:
            style = 'detailed'
        elif avg_length > 50:
            style = 'moderate'
        else:
            style = 'concise'
        
        formality_ratio = formal_indicators / total_emails if total_emails > 0 else 0
        if formality_ratio > 0.7:
            style += '_formal'
        elif formality_ratio > 0.3:
            style += '_professional'
        else:
            style += '_casual'
        
        return style

    def _identify_recurring_themes(self, emails: List[Dict]) -> List[Dict]:
        """Identify recurring themes across emails"""
        # Extract themes from subjects and content
        themes = defaultdict(list)
        
        for email in emails:
            # Extract potential themes from subject
            subject_words = re.findall(r'\b[A-Za-z]{4,}\b', email['subject'].lower())
            
            # Extract themes from content
            content_words = re.findall(r'\b[A-Za-z]{4,}\b', email['body'].lower())
            
            # Combine and filter
            all_words = subject_words + content_words
            filtered_words = [word for word in all_words if word not in {
                'email', 'message', 'gmail', 'thanks', 'best', 'regards', 'sent', 'from'
            }]
            
            for word in filtered_words:
                themes[word].append(email['subject'])
        
        # Find recurring themes (mentioned in multiple emails)
        recurring = []
        for theme, occurrences in themes.items():
            if len(occurrences) >= 2:  # Appears in at least 2 emails
                recurring.append({
                    'theme': theme,
                    'frequency': len(occurrences),
                    'examples': occurrences[:3]  # First 3 examples
                })
        
        # Sort by frequency
        recurring.sort(key=lambda x: x['frequency'], reverse=True)
        
        return recurring[:10]

    def _generate_pattern_insights(self, topic_analysis: Dict, temporal_patterns: Dict) -> List[str]:
        """Generate insights from pattern analysis"""
        insights = []
        
        # Topic insights
        if topic_analysis:
            top_topic = max(topic_analysis, key=topic_analysis.get)
            insights.append(f"Most discussed topic: '{top_topic}' ({topic_analysis[top_topic]} mentions)")
        
        # Temporal insights
        if temporal_patterns.get('busiest_day'):
            insights.append(f"Highest communication day: {temporal_patterns['busiest_day']}")
        
        if temporal_patterns.get('communication_pattern'):
            pattern = temporal_patterns['communication_pattern']
            if pattern == 'high_weekend_activity':
                insights.append("High weekend communication activity detected")
            elif pattern == 'significant_after_hours':
                insights.append("Significant after-hours communication pattern")
        
        return insights

    # Continue with remaining methods...
    def _extract_action_items(self, content: str) -> List[str]:
        """Extract action items from content"""
        action_patterns = [
            r'(?i)(please\s+\w+.*?)[\.\n]',
            r'(?i)(need\s+to\s+\w+.*?)[\.\n]',
            r'(?i)(can\s+you\s+\w+.*?)[\?\.\n]',
            r'(?i)(action\s+required.*?)[\.\n]',
            r'(?i)(follow\s+up.*?)[\.\n]'
        ]
        
        actions = []
        for pattern in action_patterns:
            matches = re.findall(pattern, content)
            actions.extend([match.strip() for match in matches if len(match.strip()) > 10])
        
        return actions[:5]  # Limit to 5 actions per email

    def _requires_follow_up(self, content: str) -> bool:
        """Check if email requires follow-up"""
        follow_up_indicators = [
            'follow up', 'get back to', 'let me know', 'waiting for',
            'pending', 'need response', 'please respond'
        ]
        
        content_lower = content.lower()
        return any(indicator in content_lower for indicator in follow_up_indicators)

    def _requires_decision(self, content: str) -> bool:
        """Check if email requires a decision"""
        decision_indicators = [
            'decision', 'decide', 'choose', 'approve', 'approval',
            'should we', 'what do you think', 'your thoughts'
        ]
        
        content_lower = content.lower()
        return any(indicator in content_lower for indicator in decision_indicators)

    def _requires_response(self, content: str) -> bool:
        """Check if email requires a response"""
        response_indicators = [
            '?', 'please respond', 'let me know', 'need your',
            'can you', 'what do you think', 'your input'
        ]
        
        content_lower = content.lower()
        return any(indicator in content_lower for indicator in response_indicators)

# Usage Implementation
async def generate_sophisticated_free_intelligence(emails: List[Dict], user_id: str = None) -> Dict[str, Any]:
    """
    Main function to generate sophisticated intelligence for free tier users
    """
    engine = PowerfulNonAIIntelligenceEngine(user_id=user_id)
    return await engine.generate_powerful_free_intelligence(emails)