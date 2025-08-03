# 360Brief Services Architecture

```mermaid
graph TD
    subgraph "Client Applications"
        A[Web App] -->|API Calls| B[Backend API]
        C[Mobile App] -->|API Calls| B
        D[Browser Extension] -->|API Calls| B
    end

    subgraph "Backend Services"
        B --> E[Auth Service]
        B --> F[Data Ingestion Service]
        B --> G[Digest Generation Service]
        B --> H[Notification Service]
        
        E -->|Auth0| I[Identity Provider]
        F -->|OAuth Tokens| J[External APIs]
        G --> K[AI/ML Models]
    end

    subgraph "Data Layer"
        L[(Supabase Database)]
        M[Redis Cache]
        N[Object Storage]
        
        E --> L
        F --> L
        G --> L
        H --> L
        F --> M
        G --> M
    end

    subgraph "External Services"
        J --> O[Gmail API]
        J --> P[Google Calendar API]
        J --> Q[Slack API]
        H --> R[Email Service]
        H --> S[Push Notification Service]
    end

    style A fill:#4CAF50,stroke:#388E3C,color:white
    style B fill:#2196F3,stroke:#1976D2,color:white
    style C fill:#4CAF50,stroke:#388E3C,color:white
    style D fill:#4CAF50,stroke:#388E3C,color:white
    style E fill:#9C27B0,stroke:#7B1FA2,color:white
    style F fill:#9C27B0,stroke:#7B1FA2,color:white
    style G fill:#9C27B0,stroke:#7B1FA2,color:white
    style H fill:#9C27B0,stroke:#7B1FA2,color:white
    style I fill:#FF9800,stroke:#F57C00,color:white
    style J fill:#FF9800,stroke:#F57C00,color:white
    style K fill:#FF9800,stroke:#F57C00,color:white
    style L fill:#607D8B,stroke:#455A64,color:white
    style M fill:#607D8B,stroke:#455A64,color:white
    style N fill:#607D8B,stroke:#455A64,color:white
    style O fill:#F44336,stroke:#D32F2F,color:white
    style P fill:#F44336,stroke:#D32F2F,color:white
    style Q fill:#F44336,stroke:#D32F2F,color:white
    style R fill:#F44336,stroke:#D32F2F,color:white
    style S fill:#F44336,stroke:#D32F2F,color:white
```

## Architecture Components

### Client Layer
- **Web App**: Primary interface for users
- **Mobile App**: Native mobile experience (future)
- **Browser Extension**: Quick access and notifications (future)

### Backend Services
- **Auth Service**: Handles authentication and user sessions
- **Data Ingestion Service**: Fetches and processes data from connected sources
- **Digest Generation Service**: Creates personalized digests using AI/ML
- **Notification Service**: Manages delivery of digests and alerts

### Data Layer
- **Supabase Database**: Primary data store for user data and preferences
- **Redis Cache**: Caching layer for improved performance
- **Object Storage**: Stores processed digests and attachments

### External Integrations
- **Identity Provider**: Auth0 for authentication
- **Email & Calendar**: Google APIs for data sources
- **Communication**: Slack API for team integration
- **Delivery**: Email and push notification services

## Data Flow
1. Users authenticate via Auth0
2. OAuth tokens are stored securely in Supabase
3. Data Ingestion Service fetches data from connected sources
4. Processed data is stored in the database
5. Digest Generation Service creates personalized digests
6. Notification Service delivers digests via preferred channels
7. User interactions are captured and used to improve future digests
