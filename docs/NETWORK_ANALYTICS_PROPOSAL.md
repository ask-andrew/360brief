# Network Analytics on /analytics Page Proposal

## 1. Data Sources & Scope
*   **Data**: Utilize processed, anonymized Email Metadata (sender, recipients, timestamp, subject keywords/title) and Calendar Metadata (organizer, attendees, timestamp, title).
*   **Timeframe**: All analytics must be calculated over a rolling 90-day window.
*   **User Focus**: The page should display analytics for the viewed user (e.g., 'Target User').

## 2. Project Identification Logic (Critical)
A new methodology is required to segment communications by 'Project' to distinguish multi-project collaborations:

*   **Project Definition**: A 'Project' is defined as a unique, recurring Subject Thread/Email Chain or a unique, recurring Meeting Title/Series.
*   **Project Threshold**: A communication chain qualifies as an active 'Project' if it includes ≥ 5 total touchpoints (emails or meetings) within the 90-day window.
*   **Collaborator Grouping**: Two collaborators working on 'Project A' and 'Project B' must be counted once for each project in the Project-Specific Degree metric.

## 3. Required Analytics Metrics and Explanations
Create three distinct sections to visualize the user's network, with the required Explanation Text provided for complex metrics:

### A. Network Reach & Segmentation (Raw Count)

| Metric | Calculation Detail |
| :--- | :--- |
| **Total Active Network Size** | Count of unique people (internal or external) with whom the Target User had ≥ 3 email exchanges or ≥ 2 calendar meetings in 90 days. |
| **Internal Collaborators** | Count of people in the Network Size who share the same company domain. |
| **External Collaborators** | Count of people in the Network Size whose email domain is not the company domain. |

### B. Project-Specific Collaboration (Measuring Depth)

| Metric | Calculation Detail |
| :--- | :--- |
| **Project-Specific Degree (90-Day)** | Count of unique Project-Collaborator pairs in the 90-day window. Example: Talking to 'Sara' about 'Project X' and 'Project Y' counts as 2. |
| **Top 5 Projects (by Collaborator Count)** | List the top 5 'Projects' (based on the Project Definition) the user is involved in, ordered by the number of unique collaborators on each. |
| **Average Project Duration** | For all completed projects (those with no activity in the last 30 days), measure the time (in days) between the first and last recorded touchpoint. |

#### Explanation Text for Metric

| Metric | Content |
| :--- | :--- |
| **Project-Specific Degree** | **Concept**: Network Degree. Measures the total number of distinct collaborations across all active projects. **Why it matters**: Research shows a higher Degree (more collaborators) is strongly associated with generating higher quality ideas and maximizing innovation. |
| **Average Project Duration** | **Concept**: Collaboration Half-Life. Measures the typical time a collaboration chain lasts. **Why it matters**: Innovation research suggests the positive impact of collaboration is often "instantaneous and short-lived." A shorter duration may indicate focused, high-intensity idea generation. |

### C. Bridging & Innovation Index (Measuring Quality)

| Metric | Calculation Detail |
| :--- | :--- |
| **Cross-Unit Bridging Score** | Percentage of Internal Collaborators that belong to a different defined organizational Unit/Department (based on HR/Directory data) than the Target User. |
| **Idea Breadth Index (Diversity)** | Count the number of unique, high-level keyword categories (e.g., Sales, Engineering, Marketing, Finance) present in the subjects/titles of the Top 5 Projects. |

#### Explanation Text for Metric

| Metric | Content |
| :--- | :--- |
| **Cross-Unit Bridging Score** | **Concept**: Bridge Centrality / Structural Holes. Identifies your role in connecting otherwise disconnected parts of the organization. **Why it matters**: While initially demanding, being a Bridge significantly improves your long-term innovation quality and provides access to diverse information. |
| **Idea Breadth Index (Diversity)** | **Concept**: Idea Diversity. Measures the variety of organizational topics you are collaborating on. **Why it matters**: Brokering across Structural Holes (being a bridge) has been shown to result in a broader diversity of generated ideas, leading to more unexpected and novel innovation. |

## 4. Output & Visualization
*   **Layout**: The /analytics page should feature a clean, card-based layout for each of the three sections above.
*   **Visualization**: Include a Chord Diagram/Force-Directed Graph illustrating the 'Target User' at the center, with connections color-coded by Internal (Blue) vs. External (Green) and link thickness scaled by the number of projects shared.
*   **Tooltips**: All complex metrics must feature a clear tooltip/pop-up containing the designated Explanation Text to ensure user comprehension.
