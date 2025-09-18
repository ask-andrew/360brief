#!/usr/bin/env python3
"""
Project Summary Generation Service (Flask API)

This service provides an API endpoint to generate concise, actionable summaries
of project communications using a pre-trained language model.
"""

import logging
from flask import Flask, request, jsonify
from transformers import pipeline, AutoModelForSeq2SeqLM, AutoTokenizer
import torch

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Model Loading ---
# Placed in a class to manage initialization
class SummarizationModel:
    def __init__(self):
        self.device = 0 if torch.cuda.is_available() else -1
        logger.info(f"Initializing model on device: {'CUDA' if self.device == 0 else 'CPU'}")
        
        model_name = "facebook/bart-large-cnn"
        try:
            tokenizer = AutoTokenizer.from_pretrained(model_name)
            model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
            self.summarizer = pipeline(
                "summarization",
                model=model,
                tokenizer=tokenizer,
                device=self.device
            )
            logger.info("Summarization model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            self.summarizer = None

    def summarize(self, text: str) -> dict:
        """Generates a summary and extracts key points and actions."""
        if not self.summarizer or not text.strip():
            return {
                'summary': 'No content provided or model not available.',
                'key_points': [],
                'actions': []
            }

        try:
            summary_text = self.summarizer(
                text,
                max_length=150,
                min_length=30,
                do_sample=False,
                truncation=True
            )[0]['summary_text']

            # Simple extraction for key points and actions
            sentences = [s.strip() for s in summary_text.split('.') if s.strip()]
            action_keywords = ['review', 'approve', 'send', 'schedule', 'confirm', 'provide', 'let me know']
            
            actions = [s for s in sentences if any(keyword in s.lower() for keyword in action_keywords)]
            key_points = [s for s in sentences if s not in actions]

            return {
                'summary': summary_text,
                'key_points': key_points if key_points else ['No key information identified.'],
                'actions': actions if actions else ['No specific actions identified.']
            }
        except Exception as e:
            logger.error(f"Error during summarization: {e}")
            return {
                'summary': 'Failed to generate summary.',
                'key_points': [],
                'actions': [],
                'error': str(e)
            }

# --- Flask App ---
app = Flask(__name__)
summarization_model = SummarizationModel() # Global instance

@app.route('/summarize', methods=['POST'])
def handle_summarize():
    """
    API endpoint to summarize email content.
    Expects JSON: { "emails": [{ "id": "...", "content": "..." }] }
    Returns JSON: { "summaries": [{ "id": "...", "summary": "...", ... }] }
    """
    if not summarization_model.summarizer:
        return jsonify({"error": "Summarization model is not available."}), 503

    data = request.get_json()
    if not data or 'emails' not in data or not isinstance(data['emails'], list):
        return jsonify({"error": "Invalid input. Expected a JSON object with an 'emails' list."}), 400

    results = []
    for email in data['emails']:
        email_id = email.get('id')
        content = email.get('content')

        if not email_id or not content:
            continue

        summary_data = summarization_model.summarize(content)
        summary_data['id'] = email_id
        results.append(summary_data)

    return jsonify({"summaries": results})

@app.route('/analytics/stream', methods=['GET'])
def handle_analytics_stream():
    """
    API endpoint for streaming analytics data.
    This is a placeholder that returns mock data for now.
    Query params: user_id, data_sources, days_back, chunk_size, memory_limit_mb
    """
    # For now, return a simple response indicating the service is available
    # In production, this would fetch real data from Gmail/other sources
    user_id = request.args.get('user_id')
    data_sources = request.args.get('data_sources', 'gmail')
    days_back = request.args.get('days_back', '7')

    logger.info(f"Analytics stream requested for user: {user_id}, sources: {data_sources}, days: {days_back}")

    # Return mock data for development
    return jsonify({
        "status": "success",
        "user_id": user_id,
        "data_sources": data_sources.split(',') if data_sources else ['gmail'],
        "days_back": int(days_back) if days_back.isdigit() else 7,
        "emails": [],  # Empty for now, will be populated with real data
        "message": "Analytics stream endpoint is available but not yet implemented"
    })

if __name__ == '__main__':
    # Use Gunicorn for production, Flask's server for development
    app.run(host='0.0.0.0', port=8000, debug=False)