# 360Brief Architecture Documentation

This directory contains architecture diagrams for the 360Brief application, providing a comprehensive view of the system's design, components, and workflows.

## Diagrams Overview

### 1. System Architecture
- **File**: `architecture.puml`
- **Purpose**: High-level overview of the system components and their interactions
- **Key Elements**: Frontend, Backend Services, External Integrations

### 2. Component Diagram
- **File**: `component_diagram.puml`
- **Purpose**: Detailed view of system components and their relationships
- **Key Elements**: Frontend components, Backend services, Data layer, External integrations

### 3. Sequence Diagram
- **File**: `sequence_diagram.puml`
- **Purpose**: Shows the flow of interactions during user authentication and data loading
- **Key Flows**: User login, Data fetching, Cache handling

### 4. Use Case Diagram
- **File**: `use_case_diagram.puml`
- **Purpose**: Illustrates system functionality from a user perspective
- **Key Actors**: Executive User, System Administrator

### 5. Data Flow Diagram
- **File**: `data_flow_diagram.puml`
- **Purpose**: Visualizes how data moves through the system
- **Key Processes**: Data collection, processing, digest generation

### 6. Deployment Diagram
- **File**: `deployment_diagram.puml`
- **Purpose**: Shows the production infrastructure and networking
- **Key Components**: CDN, Web servers, Serverless functions, Database

### 7. Class Diagram
- **File**: `class_diagram.puml`
- **Purpose**: Represents the core domain model
- **Key Classes**: User, Digest, DataSource, DigestSection

### 8. State Diagram
- **File**: `state_diagram.puml`
- **Purpose**: Illustrates the digest generation state machine
- **Key States**: Idle, Collecting, Processing, Generating, Delivering

### 9. User Journey
- **File**: `user_journey.puml`
- **Purpose**: Maps the executive user's interaction with the system
- **Key Flows**: Onboarding, Initial setup, Daily usage

## How to View

1. **VS Code**:
   - Install the "PlantUML" extension
   - Open any `.puml` file
   - Use the preview feature (usually available in the top-right corner)

2. **Online**:
   - Use the [PlantUML Web Server](http://www.plantuml.com/plantuml/uml/)
   - Copy the content of any `.puml` file and paste it into the editor

## Generating Images

To generate image files from the `.puml` files, you can use the PlantUML command line tool:

```bash
# Install PlantUML (requires Java)
brew install plantuml

# Generate PNG files
plantuml docs/architecture/*.puml -o ../../generated/
```

## Updating Diagrams

1. Open the relevant `.puml` file
2. Make your changes following PlantUML syntax
3. Update this README if you add, remove, or significantly modify any diagrams

## Dependencies

- PlantUML (for local rendering)
- Java Runtime Environment (JRE) for local PlantUML execution
- VS Code with PlantUML extension (recommended for editing)
