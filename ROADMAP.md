# 360Brief MVP Roadmap

## Phase 1: Core Infrastructure
- [x] Set up Next.js project with TypeScript
- [x] Configure Supabase project
- [x] Set up Netlify deployment
- [x] Configure environment variables
- [ ] Set up CI/CD pipeline

## Phase 2: Authentication (Completed ✅)
- [x] Configure Supabase auth
- [x] Implement Google OAuth with PKCE flow
- [x] Set up session management with refresh tokens
- [x] Implement protected routes with middleware
- [x] Add error handling and user feedback
- [x] Implement secure redirects after login/logout
- [ ] Add rate limiting and security headers
- [ ] Implement account linking for multiple OAuth providers

## Phase 3: Data Pipeline
- [ ] Set up Gmail API integration
- [ ] Implement email ingestion
- [ ] Set up email parsing
- [ ] Configure data storage in Supabase
- [ ] Implement data refresh mechanism

## Phase 4: Digest Generation
- [ ] Implement basic digest template
- [ ] Add email formatting
- [ ] Implement digest scheduling
- [ ] Add digest preview
- [ ] Set up email delivery

## Phase 5: Frontend
- [ ] Build dashboard layout
- [ ] Implement digest preview
- [ ] Add settings page
- [ ] Implement digest scheduling UI
- [ ] Add loading/error states

## Phase 6: Launch Preparation
- [ ] Set up analytics
- [ ] Implement error tracking
- [ ] Set up monitoring
- [ ] Prepare marketing site
- [ ] Deploy to production

## Current Focus
- [ ] Test end-to-end authentication flow
- [ ] Add error boundaries and fallback UI
- [ ] Implement password reset flow
- [ ] Add email verification
- [ ] Update documentation with auth setup guide

## Phase 7: Executive Communication & Time-Use Dashboard Visuals

These visuals are designed to transform raw message and meeting metadata (sender, recipient, subject, time, duration, platform) into strategic insights on **Focus, Flow, and Network**.

### Phase 1: Data Infrastructure & Core Metrics (Backend)

*   **Task 1.1: Expand Data Gathering - Calendar Integration**
    *   **1.1.1 Research Calendar APIs:** Investigate Google Calendar API and Outlook Calendar API for event metadata extraction (start/end time, attendees, subject).
    *   **1.1.2 Implement Calendar Data Fetching:** Add logic to `app/api/analytics/route.ts` (or a new dedicated API route) to connect to calendar APIs, authenticate, and fetch event data for the executive.
    *   **1.1.3 Normalize Calendar Data:** Create a consistent data structure for calendar events, similar to how email messages are normalized.
    *   **1.1.4 Store/Cache Calendar Data:** Determine if calendar data needs to be stored or cached for performance, similar to email data.

*   **Task 1.2: Expand Data Gathering - IM Integration (Placeholder)**
    *   **1.2.1 Research IM APIs:** Investigate Slack API, Microsoft Teams API for message metadata (sender, recipient, timestamp). (Note: This is more complex due to privacy and real-time nature, might be a later phase).
    *   **1.2.2 Implement IM Data Fetching:** (Placeholder - defer until email/calendar are solid).

*   **Task 1.3: Enhance `convertGmailToAnalytics` for Calendar Data**
    *   **1.3.1 Integrate Calendar Events:** Modify `convertGmailToAnalytics` (or create a new `convertAllDataToAnalytics`) to accept and process calendar event data alongside email data.
    *   **1.3.2 Calculate Focus vs. Flow vs. Fragmented Time:**
        *   Define rules for classifying calendar blocks (e.g., long unbooked = Focus, 1-2 attendees = Flow, many attendees/back-to-back = Fragmented).
        *   Implement logic to calculate the distribution of these time types.
    *   **1.3.3 Calculate Meeting Cost & Attendance:**
        *   Implement logic to calculate `participant-hours` for each meeting (`duration * attendees`).
    *   **1.3.4 Calculate Time-by-Stakeholder/Function Treemap:**
        *   Implement logic to categorize meeting attendees by department/function and sum meeting time.
    *   **1.3.5 Calculate Calendar Overload Heatmap Data:**
        *   Aggregate meeting density by day of week and time of day.

*   **Task 1.4: Refine Email/IM Data Processing (Current `convertGmailToAnalytics`)**
    *   **1.4.1 Implement Reply Time Distribution:**
        *   For email threads, identify initial message and executive's first reply. Calculate time difference.
        *   Store reply times for histogram generation.
    *   **1.4.2 Prepare for Sentiment Analysis:**
        *   Extract message content (beyond just metadata) for sentiment analysis (will be used in Phase 3).
    *   **1.4.3 Prepare for Decision Rate Gauge:**
        *   Identify conversation threads (email/IM) for later LLM processing.

### Phase 2: Dashboard Visuals (Frontend)

*   **Task 2.1: Implement Focus vs. Flow vs. Fragmented Time Chart**
*   **Task 2.2: Implement Meeting Cost & Attendance Bubble Chart**
*   **Task 2.3: Implement Time-by-Stakeholder/Function Treemap**
*   **Task 2.4: Implement Calendar Overload Heatmap**
*   **Task 2.5: Implement Inbound/Outbound Communication Volume Chart**
*   **Task 2.6: Implement Reply Time Distribution Histogram**
*   **Task 2.7: Implement Executive Response Sentiment Flow (Placeholder for now)**
*   **Task 2.8: Implement Decision Rate Gauge (Placeholder for now)**
*   **Task 2.9: Implement Internal vs. External Communication Mix Donut Chart**
*   **Task 2.10: Implement "Hidden Bottlenecks" Network Graph (Placeholder for now)**
*   **Task 2.11: Implement Delegation Funnel (Placeholder for now)**

### Phase 3: LLM Prescriptive Interventions (Backend & Frontend)

*   **Task 3.1: Implement "Context-Switching Cost" Detector**
*   **Task 3.2: Implement "Strategic Misalignment" Flagger**
*   **Task 3.3: Implement Proactive Buffer Management (Automation)**
*   **Task 3.4: Implement Tone Checker (Pre-Send Intervention)**