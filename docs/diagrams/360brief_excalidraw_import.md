# 360Brief - All Diagrams for Excalidraw

## 1. Core Tenets
```mermaid
graph TD
    A[User-Centric Value Delivery] --> B[Privacy & Security First]
    B --> C[Efficiency & Frugality]
    C --> D[Incremental Value & Phased Rollout]
    D --> E[Maintainability & Modularity]
    E --> F[Actionability & "Signals Over Noise"]
    
    style A fill:#e9ecef,stroke:#4c6ef5,stroke-width:2px
    style B fill:#e9ecef,stroke:#4c6ef5,stroke-width:2px
    style C fill:#e9ecef,stroke:#4c6ef5,stroke-width:2px
    style D fill:#e9ecef,stroke:#4c6ef5,stroke-width:2px
    style E fill:#e9ecef,stroke:#4c6ef5,stroke-width:2px
    style F fill:#e9ecef,stroke:#4c6ef5,stroke-width:2px
```

## 2. Product Vision
```mermaid
graph LR
    A[Core Value Proposition] --> |"Multiply time instead of drain time"| B[Target Audience]
    B --> C[Key Features]
    B --> D[Business Model]
    
    subgraph Target Audience
    B1[VP Operations]
    B2[Head of CS]
    B3[Head of Product]
    B4[CEOs of Startups]
    end
    
    subgraph Key Features
    C1[Channel Connections]
    C2[Data Analysis]
    C3[Direct Actionability]
    C4[Personalized Delivery]
    end
    
    subgraph Business Model
    D1[Free: 1-2 channels]
    D2[Paid: More channels + features]
    end
    
    style A fill:#e9ecef,stroke:#4c6ef5,stroke-width:2px
    style B fill:#e9ecef,stroke:#4c6ef5,stroke-width:2px
    style C fill:#e9ecef,stroke:#4c6ef5,stroke-width:2px
    style D fill:#e9ecef,stroke:#4c6ef5,stroke-width:2px
```

## 3. Backend Implementation
```mermaid
flowchart TB
    subgraph Frontend
    A[Next.js App]
    end
    
    subgraph Backend
    B[API Routes]
    C[Auth0]
    D[Unified Data Service]
    E[Cache Layer]
    end
    
    subgraph Data
    F[Supabase]
    G[Google APIs]
    end
    
    A -->|Auth| C
    A -->|API Calls| B
    B --> D
    D --> F
    D --> G
    D -.->|Cache| E
    
    style Frontend fill:#e9ecef,stroke:#4c6ef5,stroke-width:2px
    style Backend fill:#e9ecef,stroke:#4c6ef5,stroke-width:2px
    style Data fill:#e9ecef,stroke:#4c6ef5,stroke-width:2px
```

## 4. User Flow
```mermaid
journey
    title User Journey
    section Sign Up
      Landing Page: 5: User
      Sign Up Form: 4: User
      Email Verification: 3: System
    section Onboarding
      Connect Accounts: 4: User
      Set Preferences: 3: User
      First Digest: 5: System
    section Regular Use
      View Digest: 5: User
      Take Action: 4: User
      Provide Feedback: 3: User
```

## 5. Services Architecture
```mermaid
classDiagram
    class ClientApp {
        +Next.js Frontend
        +React Components
        +State Management
    }
    
    class APIService {
        +handleAuth()
        +processRequest()
        +formatResponse()
    }
    
    class DataService {
        +fetchData()
        +processData()
        +cacheResults()
    }
    
    class Database {
        +Supabase
        +Row Level Security
        +Real-time Updates
    }
    
    ClientApp --> APIService
    APIService --> DataService
    DataService --> Database
    DataService --> ExternalAPIs
```

## How to Use in Excalidraw
1. Go to [Excalidraw](https://excalidraw.com/)
2. Click on the "+" button to create a new drawing
3. Use the "Mermaid to Excalidraw" tool (wrench icon) for each diagram
4. Copy and paste each Mermaid diagram separately
5. Arrange the diagrams on the canvas as needed

Each diagram is separated by headers and uses Mermaid syntax that's compatible with Excalidraw's Mermaid import feature. The diagrams are designed to be visually consistent with a cohesive color scheme and style.
