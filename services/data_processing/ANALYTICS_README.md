# 360Brief Analytics Service

This service provides unified communication analytics and insights for the 360Brief executive dashboard. It processes data from various communication channels (email, Slack, meetings) and provides a RESTful API for accessing analytics.

## Features

- **Unified Data Model**: Consistent representation of communications across different channels
- **Comprehensive Analytics**: Volume, engagement, response times, and network analysis
- **RESTful API**: Easy integration with frontend applications
- **Extensible Architecture**: Designed to support additional data sources in the future

## Getting Started

### Prerequisites

- Python 3.8+
- pip (Python package manager)
- Redis (for caching, optional)
- PostgreSQL (for production, optional)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/360brief.git
   cd 360brief/services/data_processing
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Install the package in development mode:
   ```bash
   pip install -e .
   ```

### Configuration

Create a `.env` file in the `services/data_processing` directory with the following variables:

```env
# Application
DEBUG=True
LOG_LEVEL=INFO

# Database (optional for development)
POSTGRES_SERVER=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=yourpassword
POSTGRES_DB=analytics

# Redis (optional for development)
REDIS_URL=redis://localhost:6379/0

# API Keys (optional for development)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SLACK_CLIENT_ID=your-slack-client-id
SLACK_CLIENT_SECRET=your-slack-client-secret
```

### Running the Service

Start the development server:

```bash
python -m src.analytics.main
```

The API will be available at `http://localhost:8000`

### API Documentation

Once the service is running, you can access the interactive API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Get Analytics

```
GET /api/analytics
```

**Query Parameters:**
- `start_date`: Optional start date for filtering (ISO 8601 format)
- `end_date`: Optional end date for filtering (ISO 8601 format)

**Example Response:**

```json
{
  "email_stats": {
    "total_count": 42,
    "inbound_count": 30,
    "outbound_count": 12,
    "avg_response_time_minutes": 125.5,
    "engagement_by_contact": {
      "user1@example.com": 15,
      "user2@example.com": 10
    },
    "volume_by_date": {
      "2023-01-01": 5,
      "2023-01-02": 7
    }
  },
  "slack_stats": {
    "total_count": 87,
    "inbound_count": 45,
    "outbound_count": 42,
    "avg_response_time_minutes": 15.2,
    "engagement_by_contact": {
      "U12345678": 25,
      "U87654321": 20
    },
    "volume_by_date": {
      "2023-01-01": 12,
      "2023-01-02": 15
    }
  },
  "meeting_stats": {
    "total_meetings": 8,
    "total_hours": 6.5,
    "avg_duration_minutes": 48.8,
    "meetings_by_type": {
      "1:1": 5,
      "Team": 2,
      "External": 1
    },
    "participant_stats": {
      "total_participants": 24,
      "avg_participants_per_meeting": 3.0,
      "max_participants": 8
    }
  },
  "combined_stats": {
    "total_count": 137,
    "inbound_count": 75,
    "outbound_count": 62,
    "avg_response_time_minutes": 45.2,
    "engagement_by_contact": {
      "user1@example.com": 30,
      "U12345678": 25,
      "user2@example.com": 20,
      "U87654321": 15
    },
    "volume_by_date": {
      "2023-01-01": 17,
      "2023-01-02": 22
    }
  },
  "top_contacts": [
    {
      "id": "user1@example.com",
      "name": "Alex Johnson",
      "email": "user1@example.com",
      "is_external": false,
      "interaction_count": 30,
      "last_interaction": "2023-01-02T15:30:00"
    },
    {
      "id": "U12345678",
      "name": "Taylor Smith",
      "email": "taylor@example.com",
      "is_external": true,
      "interaction_count": 25,
      "last_interaction": "2023-01-02T14:15:00"
    }
  ],
  "time_series_data": {
    "dates": ["2023-01-01", "2023-01-02"],
    "email": {
      "inbound": [3, 4],
      "outbound": [2, 3]
    },
    "slack": {
      "inbound": [6, 7],
      "outbound": [6, 8]
    },
    "meeting": {
      "inbound": [1, 1],
      "outbound": [1, 1]
    }
  },
  "network_graph": {
    "nodes": [
      {
        "id": "user1@example.com",
        "name": "Alex Johnson",
        "email": "user1@example.com",
        "is_external": false,
        "degree": 5
      }
    ],
    "links": [
      {
        "source": "user1@example.com",
        "target": "user2@example.com",
        "weight": 3
      }
    ]
  }
}
```

### Get Recent Communications

```
GET /api/communications/recent
```

**Query Parameters:**
- `limit`: Maximum number of communications to return (default: 10, max: 100)

### Get Network Graph

```
GET /api/network/graph
```

**Query Parameters:**
- `min_weight`: Minimum edge weight to include (default: 1)

## Development

### Running Tests

```bash
python -m pytest tests/
```

### Code Style

This project uses:
- Black for code formatting
- isort for import sorting
- mypy for type checking
- pylint for code quality

Run the following commands to ensure code quality:

```bash
black src/
isort src/
mypy src/
pylint src/
```

## Deployment

### Production

For production deployment, it's recommended to use a production-grade ASGI server like Uvicorn with Gunicorn:

```bash
pip install gunicorn

# Run with 4 worker processes
gunicorn src.analytics.main:create_app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Docker

A `Dockerfile` is provided for containerized deployment:

```bash
# Build the image
docker build -t 360brief-analytics .

# Run the container
docker run -d -p 8000:8000 --name 360brief-analytics 360brief-analytics
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
