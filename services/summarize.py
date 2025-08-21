#!/usr/bin/env python3
"""
Project Summary Generation Service

This service generates concise, actionable summaries of project communications
using a pre-trained language model for efficient processing.
"""

import json
import argparse
from typing import List, Dict, Any
from transformers import pipeline, AutoModelForSeq2SeqLM, AutoTokenizer
import torch
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
MODEL_NAME = "facebook/bart-large-cnn"  # Efficient summarization model
MAX_INPUT_LENGTH = 1024
MAX_SUMMARY_LENGTH = 150
MIN_SUMMARY_LENGTH = 30

class ProjectSummarizer:
    def __init__(self):
        """Initialize the summarization pipeline with a pre-trained model."""
        self.device = 0 if torch.cuda.is_available() else -1  # Use GPU if available
        logger.info(f"Using device: {'CUDA' if self.device == 0 else 'CPU'}")
        
        # Load model and tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
        self.model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
        self.summarizer = pipeline(
            "summarization",
            model=self.model,
            tokenizer=self.tokenizer,
            device=self.device
        )

    def preprocess_messages(self, messages: List[Dict[str, Any]]) -> str:
        """Combine and preprocess messages for summarization."""
        # Sort messages by timestamp
        sorted_messages = sorted(
            messages,
            key=lambda x: x.get('timestamp', ''),
            reverse=True  # Most recent first
        )
        
        # Combine messages with sender and content
        combined = "\n\n".join(
            f"{msg.get('sender', 'Someone')}: {msg.get('content', '')}"
            for msg in sorted_messages
            if msg.get('content')
        )
        
        # Truncate to model's max length
        return combined[:MAX_INPUT_LENGTH]

    def generate_summary(self, text: str) -> Dict[str, Any]:
        """Generate a concise summary of the provided text."""
        if not text.strip():
            return {
                'summary': 'No content to summarize.',
                'key_points': [],
                'actions': []
            }
        
        try:
            # Generate summary using the model
            summary = self.summarizer(
                text,
                max_length=MAX_SUMMARY_LENGTH,
                min_length=MIN_SUMMARY_LENGTH,
                do_sample=False,
                truncation=True
            )[0]['summary_text']
            
            # Extract key points (first 3 sentences)
            key_points = [s.strip() for s in summary.split('.') if s.strip()][:3]
            
            # Simple action extraction (this could be enhanced with NER or other NLP techniques)
            actions = [
                point for point in key_points 
                if any(word in point.lower() for word in ['need', 'should', 'must', 'action', 'follow up'])
            ]
            
            return {
                'summary': summary,
                'key_points': key_points,
                'actions': actions if actions else ['No specific actions identified.']
            }
            
        except Exception as e:
            logger.error(f"Error generating summary: {str(e)}")
            return {
                'summary': 'Failed to generate summary.',
                'key_points': [],
                'actions': [],
                'error': str(e)
            }

def main():
    """Main entry point for the summarization service."""
    parser = argparse.ArgumentParser(description='Generate project summaries from messages')
    parser.add_argument('--messages', type=str, required=True, help='JSON string of messages')
    parser.add_argument('--project-id', type=str, required=True, help='Project identifier')
    args = parser.parse_args()
    
    try:
        # Parse messages
        messages = json.loads(args.messages)
        
        # Initialize summarizer
        summarizer = ProjectSummarizer()
        
        # Generate summary
        processed_text = summarizer.preprocess_messages(messages)
        result = summarizer.generate_summary(processed_text)
        
        # Add project context
        result['project_id'] = args.project_id
        result['status'] = 'success'
        
        # Output as JSON
        print(json.dumps(result))
        
    except json.JSONDecodeError:
        print(json.dumps({
            'status': 'error',
            'error': 'Invalid JSON input',
            'project_id': args.project_id
        }))
    except Exception as e:
        print(json.dumps({
            'status': 'error',
            'error': str(e),
            'project_id': args.project_id
        }))

if __name__ == '__main__':
    main()
