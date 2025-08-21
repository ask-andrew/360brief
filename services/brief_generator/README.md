# 360Brief Generator Service

A FastAPI microservice for generating executive briefs using LLMs.

## Features

- RESTful API for generating executive briefs
- Support for multiple communication styles (Mission Brief, Management Consulting, etc.)
- Integration with multiple LLM providers (OpenAI, Google Gemini, Anthropic)
- Structured output with metadata
- Health check endpoint

## Setup

1. Clone the repository
2. Navigate to the service directory:
   ```bash
   cd services/brief_generator
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the example environment file and update with your API keys:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your API keys and configuration.

## Running the Service

### Development
```bash
uvicorn main:app --reload
```

The service will be available at `http://localhost:8000`

### Production
For production, use a production ASGI server like Gunicorn with Uvicorn workers:
```bash
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
```

## API Documentation

Once the service is running, you can access:
- Interactive API docs: `http://localhost:8000/docs`
- Alternative API docs: `http://localhost:8000/redoc`

## API Endpoints

### Generate Brief

**POST** `/api/v1/generate-brief`

Generate an executive brief based on the provided data and style.

**Request Body:**
```json
{
  "data": {
    // Your raw data here
  },
  "style": "mission_brief",
  "llm_provider": "openai"
}
```

**Response:**
```json
{
  "content": {
    // Generated brief content
  },
  "metadata": {
    "generated_at": "2025-08-07T10:00:00.000000",
    "model": "openai",
    "style": "mission_brief"
  }
}
```

### Health Check

**GET** `/health`

Check if the service is running.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-07T10:00:00.000000"
}
```

## Environment Variables

- `OPENAI_API_KEY`: API key for OpenAI (required if using OpenAI)
- `GEMINI_API_KEY`: API key for Google Gemini (required if using Gemini)
- `ANTHROPIC_API_KEY`: API key for Anthropic (required if using Claude)
- `PORT`: Port to run the server on (default: 8000)
- `HOST`: Host to bind the server to (default: 0.0.0.0)
- `LOG_LEVEL`: Logging level (default: INFO)

## Development

### Testing

To run tests:
```bash
pytest
```

### Linting

```bash
black .
isort .
flake8
```

## Deployment

### Docker

Build the Docker image:
```bash
docker build -t 360brief-generator .
```

Run the container:
```bash
docker run -p 8000:8000 --env-file .env 360brief-generator
```

## License

[Your License Here]
