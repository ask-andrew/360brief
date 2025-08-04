# Data Processing Service

This service handles the core data processing pipeline for 360Brief, including data ingestion, noise reduction, and feature extraction from various communication channels.

## Getting Started

### Prerequisites
- Python 3.9+
- pip

### Installation

1. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   python -m spacy download en_core_web_sm
   ```

### Project Structure

```
data_processing/
├── src/
│   └── data_processing/     # Main package
│       ├── __init__.py
│       ├── config.py        # Configuration management
│       ├── models.py        # Data models
│       ├── processors/      # Processing modules
│       │   ├── __init__.py
│       │   ├── email_processor.py
│       │   └── calendar_processor.py
│       └── services/        # Core services
│           ├── __init__.py
│           ├── data_service.py
│           └── nlp_service.py
├── tests/                   # Unit tests
├── scripts/                 # Utility scripts
├── config/                  # Configuration files
└── requirements.txt         # Dependencies
```

## Development

### Running Tests
```bash
pytest tests/
```

### Code Style
```bash
black .
isort .
mypy .
pylint src/
```

## Integration

The service exposes a FastAPI endpoint that can be called by the main application. See `src/data_processing/api.py` for details.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True
```
