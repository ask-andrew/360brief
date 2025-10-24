# Enhanced Narrative Brief System Documentation

## Overview

The Enhanced Narrative Brief System implements the user's detailed specification for transforming fragmented email data into "Cognitive Relief and Actionable Focus" through advanced preprocessing and synthesis layers.

## Architecture

### Two-Layer System

1. **Preprocessing Pipeline (Mandatory, Non-LLM)**
   - Data cleaning and normalization
   - Named Entity Recognition (NER)
   - Coreference resolution
   - Project clustering with co-occurrence analysis
   - Financial constraint enforcement

2. **Synthesis Layer (Optional, LLM-Enhanced)**
   - Contextual summary generation
   - Executive synthesis
   - Action item derivation
   - Recurring content coherence

## Key Features Implemented

### ✅ Enhanced Preprocessing Pipeline

- **Data Cleaning**: HTML removal, signature stripping, text normalization
- **Financial Extraction**: Regex-based extraction with proper formatting
- **Entity Recognition**: People, organizations, and project names
- **Status Detection**: Blocker, decision, and achievement classification
- **Project Clustering**: Heuristic co-occurrence with entity sharing
- **Financial Guardrails**: Only tags financial_value if explicitly mentioned

### ✅ Enhanced Synthesis Layer

- **Contextual Summaries**: 2-3 sentence summaries covering Cause, Impact/Risk, Next Steps
- **Executive Synthesis**: Narrative highlighting primary blockers, decisions, and financial impact
- **Action Derivation**: Specific actionable items with people, deadlines, and deliverables
- **Recurring Content**: Topic modeling for newsletters and general updates

### ✅ Hybrid Architecture

- Rule-based preprocessing for reliability and cost-effectiveness
- LLM synthesis for high-quality narrative generation
- Graceful fallback when LLM services are unavailable

## API Endpoints

### Generate Enhanced Narrative Brief

**POST** `/generate-narrative-brief`

Generate an enhanced narrative brief using the new preprocessing and synthesis pipeline.

**Request Body:**
```json
{
  "emails": [
    {
      "id": "email-123",
      "subject": "Allied - Ledet: Decision needed on $40K investment",
      "body": "Chris Laguna identified a blocker. Please approve budget.",
      "from": {"name": "Jane Doe", "email": "jane@company.com"},
      "date": "2025-01-15T10:00:00Z"
    }
  ],
  "max_projects": 8,
  "include_clusters": true
}
```

**Response:**
```json
{
  "markdown": "# 360Brief - Executive Narrative\n\n# Executive Summary\n\n# Project Deep Dive\n\n## Allied - Ledet | Status: Decision & Blocker\n\n...",
  "clusters": [...],
  "generated_at": "2025-01-15T10:00:00Z",
  "engine": "enhanced_narrative_v2_llm",
  "total_emails": 1,
  "total_projects": 1
}
```

## Configuration

### Environment Variables

- `GEMINI_API_KEY`: Required for LLM-based synthesis layer
- `BRIEF_GENERATOR_URL`: Primary service URL (default: http://localhost:8000)
- `SUPABASE_SERVICE_ROLE_KEY`: For user subscription management

### Feature Flags

- **LLM Enhancement**: Automatically enabled when `GEMINI_API_KEY` is present
- **Fallback Mode**: Automatically falls back to rule-based generation when LLM unavailable
- **Financial Constraints**: Always enforced regardless of LLM availability

## Testing Strategy

### Unit Tests

Run unit tests for individual components:
```bash
cd services
python test_enhanced_narrative.py
```

### Integration Tests

Test the complete pipeline with sample data:
```bash
cd services
python -c "
from test_enhanced_narrative import TestIntegration
test = TestIntegration()
test.test_end_to_end_narrative_generation()
print('Integration test passed!')
"
```

### Test Coverage

- ✅ Email preprocessing and cleaning
- ✅ Financial value extraction and validation
- ✅ Entity recognition and project clustering
- ✅ Status detection and urgency scoring
- ✅ Financial constraint enforcement
- ✅ Synthesis layer fallbacks
- ✅ End-to-end narrative generation

## Deployment

### Development

Start the enhanced service:
```bash
cd services/brief_generator
pip install -r requirements_narrative.txt
python main.py
```

### Production

The system is designed for horizontal scaling:
- Preprocessing pipeline is stateless and thread-safe
- Synthesis layer uses external LLM APIs
- Caching layer prevents redundant processing
- Graceful degradation when services unavailable

## Performance Characteristics

### Cost Optimization

- **Preprocessing**: Runs entirely on CPU, minimal cost
- **Synthesis**: Only uses LLM when explicitly requested
- **Caching**: Prevents redundant processing of similar content
- **Incremental Processing**: Only processes new/changed content

### Latency Targets

- **Rule-based generation**: < 500ms
- **LLM-enhanced generation**: 2-5 seconds (depending on LLM response time)
- **Preprocessing only**: < 100ms per email

## Error Handling

### Graceful Degradation

1. **LLM Unavailable**: Falls back to rule-based synthesis
2. **Network Issues**: Uses cached results when possible
3. **Invalid Data**: Skips malformed emails with logging
4. **API Limits**: Implements exponential backoff

### Monitoring

- Comprehensive logging for all pipeline stages
- Performance metrics for preprocessing and synthesis
- Error tracking with detailed context
- Success/failure rates by component

## Security Considerations

### Privacy First

- **Process-and-Discard**: No permanent storage of email content
- **Entity Extraction**: Only stores derived insights, not raw data
- **Financial Data**: Only processes explicitly mentioned amounts
- **Access Control**: Respects user subscription tiers

### Data Protection

- **Input Validation**: Strict validation of all email data
- **Output Sanitization**: Removes sensitive information from summaries
- **Audit Logging**: Tracks processing without storing content
- **Rate Limiting**: Prevents abuse of synthesis layer

## Future Enhancements

### Phase 2 Features

- **Coreference Resolution**: Advanced pronoun/name resolution
- **Temporal Analysis**: Timeline and deadline extraction
- **Sentiment Analysis**: Communication tone and urgency detection
- **Multi-language Support**: Extended entity recognition

### Integration Opportunities

- **Calendar Integration**: Meeting context and scheduling data
- **Slack Integration**: Real-time communication patterns
- **CRM Integration**: Customer and deal context
- **Project Management**: Task and milestone tracking

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure all dependencies are installed
2. **LLM Failures**: Check API key and network connectivity
3. **Clustering Issues**: Verify email format matches expected schema
4. **Performance Issues**: Monitor memory usage and processing time

### Debug Mode

Enable debug logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Test Data

Use the provided test cases to validate functionality:
```python
from test_enhanced_narrative import *
# Run individual test methods
```

## Support

For issues with the Enhanced Narrative Brief System:

1. Check the logs for detailed error messages
2. Verify environment variables are properly configured
3. Test with minimal data to isolate issues
4. Review the fallback mechanisms are working correctly
