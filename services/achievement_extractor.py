"""
Team Achievement and Pattern Extraction Module

This module extracts real team achievements and communication patterns from email data
to populate the TEAM ACHIEVEMENTS and TRENDS & PATTERNS sections with actual data.
"""

import re
import logging
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from datetime import datetime, timedelta
from collections import Counter
import spacy

logger = logging.getLogger(__name__)

@dataclass 
class TeamAchievement:
    """Structured team achievement data"""
    person_name: str
    category: str  # "Ahead of Schedule", "Innovation", "Leadership", etc.
    achievement: str
    impact: str
    confidence_score: float
    source_email_id: str
    date: datetime

@dataclass
class CommunicationPattern:
    """Communication pattern/trend data"""
    pattern_type: str  # "urgent_volume", "team_mentions", "project_completions"
    description: str
    count: int
    confidence_score: float
    examples: List[str]

class AchievementExtractor:
    """
    Extracts team achievements from email content using NLP and pattern matching.
    Replaces hardcoded mock data with real insights from email communications.
    """
    
    def __init__(self):
        # Load spaCy model for named entity recognition
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except IOError:
            logger.warning("spaCy model not loaded. Achievement extraction will be limited.")
            self.nlp = None
        
        # Achievement categories and their indicators
        self.achievement_categories = {
            "Ahead of Schedule": [
                r"\b(ahead of schedule|early|finished early|completed ahead|delivered early)\b",
                r"\b(ahead of deadline|before deadline|days early|weeks early)\b",
                r"\b(accelerated|fast-tracked|expedited)\b"
            ],
            "Innovation": [
                r"\b(innovative|breakthrough|novel approach|creative solution)\b",
                r"\b(new method|improved.*by.*\d+%|optimization|efficiency)\b",
                r"\b(patent|invention|discovered|pioneered)\b"
            ],
            "Leadership": [
                r"\b(led the team|leadership|mentored|guided)\b",
                r"\b(crisis.*management|stepped up|took charge)\b",
                r"\b(coordinated|organized|facilitated)\b"
            ],
            "Problem Solving": [
                r"\b(solved|resolved|fixed|debugged)\b",
                r"\b(root cause|troubleshoot|diagnosis|investigation)\b",
                r"\b(workaround|solution|fix)\b"
            ],
            "Revenue Impact": [
                r"\b(saved.*\$|revenue.*increase|cost.*reduction)\b",
                r"\b(ROI|return on investment|profit|earnings)\b",
                r"\b(budget.*under|efficiency.*gain)\b"
            ]
        }
        
        # Pattern indicators for trends analysis
        self.communication_patterns = {
            "urgent_communications": [
                r"\b(urgent|asap|immediate|critical|emergency)\b",
                r"\b(high priority|rush|deadline.*today)\b"
            ],
            "team_achievements": [
                r"\b(completed|finished|delivered|accomplished|achieved)\b",
                r"\b(milestone|success|win|breakthrough)\b"
            ],
            "blockers_issues": [
                r"\b(blocked|stuck|issue|problem|delay)\b",
                r"\b(impediment|obstacle|challenge|bottleneck)\b"
            ]
        }
        
        # Common name patterns (you'd customize this based on your organization)
        self.name_patterns = [
            r"\b[A-Z][a-z]+ [A-Z][a-z]+\b",  # "John Smith" format
            r"\b[A-Z][a-z]+\b"  # Single names like "Sarah"
        ]

    def extract_achievements_from_emails(self, emails: List[Any]) -> List[TeamAchievement]:
        """
        Extract team achievements from a list of processed emails.
        
        Args:
            emails: List of ProcessedMessage objects with summary, body, etc.
            
        Returns:
            List of TeamAchievement objects with real data
        """
        achievements = []
        
        for email in emails:
            email_achievements = self._extract_achievements_from_single_email(email)
            achievements.extend(email_achievements)
            
        # Deduplicate and rank by confidence score
        achievements = self._deduplicate_achievements(achievements)
        achievements.sort(key=lambda x: x.confidence_score, reverse=True)
        
        return achievements[:10]  # Return top 10 achievements

    def _extract_achievements_from_single_email(self, email: Any) -> List[TeamAchievement]:
        """Extract achievements from a single email"""
        achievements = []
        
        # Combine email content for analysis
        content = f"{email.summary} {' '.join(email.key_points)}"
        
        # Extract people mentioned in the email
        people = self._extract_people_from_text(content)
        
        # Look for achievement patterns
        for category, patterns in self.achievement_categories.items():
            for pattern in patterns:
                matches = re.finditer(pattern, content, re.IGNORECASE)
                
                for match in matches:
                    # Get context around the match
                    start = max(0, match.start() - 100)
                    end = min(len(content), match.end() + 100)
                    context = content[start:end].strip()
                    
                    # Try to identify the person responsible
                    person = self._identify_person_in_context(context, people)
                    
                    if person:
                        # Extract impact information
                        impact = self._extract_impact_from_context(context)
                        
                        # Calculate confidence score
                        confidence = self._calculate_achievement_confidence(
                            category, context, person, impact
                        )
                        
                        if confidence > 0.5:  # Only include high-confidence achievements
                            achievements.append(TeamAchievement(
                                person_name=person,
                                category=category,
                                achievement=self._clean_achievement_text(context),
                                impact=impact,
                                confidence_score=confidence,
                                source_email_id=email.message_id,
                                date=email.processed_at or datetime.now()
                            ))
        
        return achievements

    def _extract_people_from_text(self, text: str) -> List[str]:
        """Extract person names from text using NLP and patterns"""
        people = []
        
        if self.nlp:
            # Use spaCy NER for person detection
            doc = self.nlp(text)
            for ent in doc.ents:
                if ent.label_ == "PERSON":
                    people.append(ent.text.strip())
        
        # Also use regex patterns as fallback
        for pattern in self.name_patterns:
            matches = re.findall(pattern, text)
            people.extend(matches)
        
        # Clean and deduplicate
        people = list(set([p.strip() for p in people if len(p.strip()) > 2]))
        
        return people

    def _identify_person_in_context(self, context: str, potential_people: List[str]) -> Optional[str]:
        """Identify which person is responsible for the achievement in the given context"""
        # Simple heuristic: find the person name closest to the achievement mention
        context_lower = context.lower()
        
        for person in potential_people:
            person_lower = person.lower()
            if person_lower in context_lower:
                # Check if the person is mentioned as the subject/actor
                person_index = context_lower.find(person_lower)
                
                # Look for active language around the person's name
                before_context = context_lower[max(0, person_index-20):person_index]
                after_context = context_lower[person_index:min(len(context), person_index+50)]
                
                # Indicators that this person is the actor/achiever
                actor_indicators = ['by', 'thanks to', 'led by', 'completed by', 'achieved by']
                subject_indicators = ['completed', 'delivered', 'achieved', 'solved', 'led']
                
                if (any(indicator in before_context for indicator in actor_indicators) or
                    any(indicator in after_context for indicator in subject_indicators)):
                    return person
                    
        # If no clear actor found, return the first person mentioned
        return potential_people[0] if potential_people else None

    def _extract_impact_from_context(self, context: str) -> str:
        """Extract impact/benefit information from the achievement context"""
        impact_patterns = [
            r"(saved.*\$[\d,]+)",
            r"(increased.*by.*\d+%)",
            r"(reduced.*by.*\d+%)", 
            r"(ahead.*by.*\d+ days?)",
            r"(unblocked.*team)",
            r"(revenue.*\$[\d,]+)"
        ]
        
        for pattern in impact_patterns:
            match = re.search(pattern, context, re.IGNORECASE)
            if match:
                return f"*Impact: {match.group(1).strip()}*"
                
        return "*Impact: Positive team contribution*"

    def _calculate_achievement_confidence(self, category: str, context: str, 
                                        person: str, impact: str) -> float:
        """Calculate confidence score for the extracted achievement"""
        score = 0.5  # Base score
        
        # Strong category indicators boost confidence
        if category == "Ahead of Schedule" and "days" in context:
            score += 0.2
        elif category == "Innovation" and any(word in context.lower() 
                                           for word in ["improved", "optimization", "%"]):
            score += 0.3
        elif category == "Revenue Impact" and "$" in context:
            score += 0.4
            
        # Clear person attribution boosts confidence
        if person and len(person.split()) == 2:  # Full name format
            score += 0.2
            
        # Impact information boosts confidence
        if "Impact:" in impact and impact != "*Impact: Positive team contribution*":
            score += 0.2
            
        return min(1.0, score)

    def _clean_achievement_text(self, context: str) -> str:
        """Clean and format achievement text for display"""
        # Remove extra whitespace and limit length
        clean_text = re.sub(r'\s+', ' ', context).strip()
        
        # Limit to reasonable length
        if len(clean_text) > 100:
            clean_text = clean_text[:97] + "..."
            
        return clean_text

    def _deduplicate_achievements(self, achievements: List[TeamAchievement]) -> List[TeamAchievement]:
        """Remove duplicate achievements based on person + category"""
        seen = set()
        deduplicated = []
        
        for achievement in achievements:
            key = (achievement.person_name, achievement.category)
            if key not in seen:
                seen.add(key)
                deduplicated.append(achievement)
                
        return deduplicated

    def extract_communication_patterns(self, emails: List[Any]) -> List[CommunicationPattern]:
        """
        Extract communication patterns and trends from emails.
        
        Returns patterns like "High volume of urgent communications", etc.
        """
        patterns = []
        
        # Analyze all email content
        all_content = []
        for email in emails:
            content = f"{email.summary} {' '.join(email.key_points)}"
            all_content.append(content.lower())
            
        combined_content = " ".join(all_content)
        
        # Extract each pattern type
        for pattern_type, indicators in self.communication_patterns.items():
            count = 0
            examples = []
            
            for content in all_content:
                for indicator_pattern in indicators:
                    matches = re.findall(indicator_pattern, content, re.IGNORECASE)
                    count += len(matches)
                    
                    # Collect examples
                    for match in matches[:2]:  # Limit examples
                        # Get sentence containing the match
                        sentences = content.split('.')
                        for sentence in sentences:
                            if match.lower() in sentence.lower():
                                examples.append(sentence.strip()[:80] + "...")
                                break
            
            if count > 0:
                patterns.append(CommunicationPattern(
                    pattern_type=pattern_type,
                    description=self._format_pattern_description(pattern_type, count),
                    count=count,
                    confidence_score=min(1.0, count / len(emails)),
                    examples=examples[:3]  # Top 3 examples
                ))
        
        return sorted(patterns, key=lambda x: x.count, reverse=True)

    def _format_pattern_description(self, pattern_type: str, count: int) -> str:
        """Format pattern descriptions for display"""
        descriptions = {
            "urgent_communications": f"High volume of urgent communications ({count} urgent emails)",
            "team_achievements": f"Team achievements and completions mentioned ({count} emails)",
            "blockers_issues": f"Active blockers and issues identified ({count} mentions)"
        }
        
        return descriptions.get(pattern_type, f"{pattern_type.replace('_', ' ').title()} ({count} instances)")


# Integration class to replace mock data
class RealDataPopulator:
    """
    Replaces hardcoded mock data with real extracted data from emails
    """
    
    def __init__(self):
        self.extractor = AchievementExtractor()

    def populate_briefing_sections(self, processed_emails: List[Any]) -> Dict[str, Any]:
        """
        Generate real briefing data to replace mock data
        
        Args:
            processed_emails: List of ProcessedMessage objects from your email processor
            
        Returns:
            Dictionary with real data for briefing sections
        """
        # Extract real achievements
        achievements = self.extractor.extract_achievements_from_emails(processed_emails)
        
        # Extract real communication patterns  
        patterns = self.extractor.extract_communication_patterns(processed_emails)
        
        # Format achievements for the briefing to match the Kudo interface
        formatted_achievements = []
        for achievement in achievements[:5]:  # Top 5 achievements
            formatted_achievements.append({
                "id": achievement.source_email_id,
                "message": achievement.achievement,
                "from": achievement.person_name,
                "date": achievement.date.isoformat(),
                "category": achievement.category,
                "impact": achievement.impact,
            })
        
        # Format patterns for trends section
        formatted_patterns = []
        for pattern in patterns:
            formatted_patterns.append({
                "type": pattern.pattern_type,
                "description": pattern.description,
                "count": pattern.count,
                "examples": pattern.examples
            })
        
        return {
            "team_achievements": formatted_achievements,
            "communication_patterns": formatted_patterns,
            "generated_at": datetime.now().isoformat(),
            "data_source": "real_email_analysis"  # Indicates this is real data, not mock
        }

    def generate_achievement_suggestions(self, achievements: List[TeamAchievement]) -> List[str]:
        """Generate kudos suggestions based on real achievements"""
        suggestions = []
        
        for achievement in achievements[:3]:  # Top 3
            if achievement.confidence_score > 0.7:
                suggestion = f"Consider sending kudos to {achievement.person_name} for {achievement.category.lower()}: {achievement.achievement[:60]}..."
                suggestions.append(suggestion)
                
        return suggestions


# Usage example showing integration with your existing system
async def integrate_with_email_processor(email_processor_results: List[Any]) -> Dict[str, Any]:
    """
    Example of how to integrate this with your existing email processing pipeline
    """
    # Initialize the real data populator
    populator = RealDataPopulator()
    
    # Generate real briefing data instead of using mock data
    real_briefing_data = populator.populate_briefing_sections(email_processor_results)
    
    # Generate kudos suggestions
    achievements = populator.extractor.extract_achievements_from_emails(email_processor_results)
    kudos_suggestions = populator.generate_achievement_suggestions(achievements)
    
    # This data can now replace your hardcoded mock data
    return {
        "winbox_achievements": real_briefing_data["team_achievements"],
        "trends_patterns": real_briefing_data["communication_patterns"],
        "kudos_suggestions": kudos_suggestions,
        "metadata": {
            "total_emails_analyzed": len(email_processor_results),
            "achievements_found": len(achievements),
            "confidence_threshold": 0.5
        }
    }


if __name__ == "__main__":
    # Example usage with mock email data
    class MockEmail:
        def __init__(self, summary, key_points, message_id):
            self.summary = summary
            self.key_points = key_points
            self.message_id = message_id
            self.processed_at = datetime.now()
    
    # Sample emails that would come from your email processor
    sample_emails = [
        MockEmail(
            "Sarah completed the API integration 3 days ahead of schedule",
            ["Delivered API integration early", "Unblocked mobile team"],
            "msg_001"
        ),
        MockEmail(
            "Marcus proposed new onboarding flow increasing conversion by 23%",
            ["Innovation in user experience", "Revenue impact projected"],
            "msg_002"
        ),
        MockEmail(
            "Urgent: Production issue needs immediate attention",
            ["Critical system down", "Customer impact"],
            "msg_003"
        )
    ]
    
    # Test the extraction
    import asyncio
    result = asyncio.run(integrate_with_email_processor(sample_emails))
    
    print("=== REAL TEAM ACHIEVEMENTS (replaces hardcoded data) ===")
    for achievement in result["winbox_achievements"]:
        print(f"**{achievement['from']} ({achievement['category']})**")
        print(f"{achievement['message']}")
        print(f"{achievement['impact']}")
        print()
    
    print("=== REAL TRENDS & PATTERNS ===")
    for pattern in result["trends_patterns"]:
        print(f"• {pattern['description']}")
    
    print("=== KUDOS SUGGESTIONS ===") 
    for suggestion in result["kudos_suggestions"]:
        print(f"💡 {suggestion}")