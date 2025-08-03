# 360Brief User Flow

```mermaid
flowchart TD
    A[User Signs Up/Logs In] --> B[Connect Data Sources]
    B --> C[Select Preferences]
    C --> D[Daily Digest Generation]
    D --> E[View Digest]
    E --> F[Take Actions]
    F --> G[Provide Feedback]
    G --> D
    
    subgraph "Authentication & Setup"
        A -->|Auth0| B
        B -->|Google OAuth| C
    end
    
    subgraph "Core User Journey"
        C -->|Set preferences| D
        D -->|Process data| E
        E -->|Review| F
        F -->|Respond/Act| G
    end
    
    subgraph "Continuous Improvement"
        G -->|Feedback loop| D
    end

    style A fill:#4CAF50,stroke:#388E3C,color:white
    style B fill:#2196F3,stroke:#1976D2,color:white
    style C fill:#2196F3,stroke:#1976D2,color:white
    style D fill:#673AB7,stroke:#5E35B1,color:white
    style E fill:#673AB7,stroke:#5E35B1,color:white
    style F fill:#FF9800,stroke:#F57C00,color:white
    style G fill:#607D8B,stroke:#455A64,color:white
```

## Flow Description
1. **Authentication**: Users sign up/log in via Auth0
2. **Onboarding**: 
   - Connect data sources (Gmail, Calendar, etc.)
   - Set preferences for digest content and delivery
3. **Daily Digest**:
   - System processes connected data sources
   - Generates personalized digest
   - Delivers via preferred channel (web/email/audio)
4. **Interaction**:
   - User reviews digest
   - Takes actions directly from digest (reply, snooze, etc.)
   - Provides feedback to improve future digests
5. **Improvement**:
   - System learns from user feedback
   - Continuously improves digest quality and relevance
