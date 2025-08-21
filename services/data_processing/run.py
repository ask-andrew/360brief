""Run the data processing API server."""
import uvicorn
from .src.data_processing.config import settings

def main():
    """Run the FastAPI application."""
    uvicorn.run(
        "src.data_processing.api:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
        log_level="info" if settings.debug else "warning"
    )

if __name__ == "__main__":
    main()
