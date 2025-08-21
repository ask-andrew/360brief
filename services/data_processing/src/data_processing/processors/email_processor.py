""Email message processing."""
from typing import Dict, List
import spacy
from ..models import EmailMessage, ProcessedMessage, MessageType

nlp = spacy.load("en_core_web_sm")

class EmailProcessor:
    """Process email messages."""
    
    def __init__(self):
        self.marketing_indicators = {'unsubscribe', 'click here', 'special offer'}
        self.marketing_domains = {'mailchimp.com', 'constantcontact.com'}

    def is_marketing(self, email: EmailMessage) -> bool:
        """Check if email is marketing."""
        if 'List-Unsubscribe' in email.headers:
            return True
        sender_domain = email.sender.split('@')[-1].lower()
        return any(d in sender_domain for d in self.marketing_domains)

    def process(self, email: EmailMessage) -> ProcessedMessage:
        """Process single email."""
        if self.is_marketing(email):
            return None
            
        full_text = f"{email.subject}\n\n{email.body}"
        doc = nlp(full_text)
        
        # Simple entity extraction
        entities = {}
        for ent in doc.ents:
            if ent.label_ not in entities:
                entities[ent.label_] = []
            if ent.text not in entities[ent.label_]:
                entities[ent.label_].append(ent.text)
        
        return ProcessedMessage(
            message_id=email.id,
            message_type=MessageType.EMAIL,
            summary=next(doc.sents).text if list(doc.sents) else "",
            key_points=[],
            entities=entities,
            action_items=[],
            priority=0
        )
