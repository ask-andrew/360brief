# memories
360Brief is a "one-stop shop" executive briefing platform that solves information overload by consolidating communication streams (emails, Slack, meeting transcripts, project management tools) into actionable insights.

CORE VALUE PROPOSITION: "Multiply time instead of drain time" - transform noise into clear signals highlighting key projects, blockers, and achievements.

COMPETITIVE DIFFERENTIATION: Democratizes executive intelligence capabilities that previously required custom AI agent setup. Users get professional-grade weekly briefings without technical configuration - just connect accounts and receive structured executive summaries.

TARGET AUDIENCE: SMB to mid-market executives (<1000 employees) - VP Operations, Head of CS, Head of Product, CEOs of small startups who need executive-level situational awareness but lack dedicated intelligence analysts.

KEY FEATURES:
- User account creation & channel connections (starting with Google)
- Data analysis & digest generation using executive briefing methodology
- Direct actionability (reply from digest)
- Personalized delivery (web, email, audio)
- Analytical dashboard with priority messages, patterns, sentiment analysis
- User preferences & feedback systems
- Executive Intelligence Analyst-style output: structured briefings with strategic insights, feature stories, recognition sections, blockers identification, and actionable recommendations

BUSINESS MODEL: Freemium subscription
- Free: Basic processing for 1-2 channels (email + calendar)
- Paid: Additional channels + advanced features

PRIVACY APPROACH: Store derived insights, not raw sensitive data. Focus on user preferences, feedback, engagement stats, and potentially previous digests.

TECH STACK: Cloud-native, API integrations, Python for data processing, multi-tenant architecture for business users.

KEY INSIGHT: 360Brief provides what specialized AI agents like weekly-activity-briefer do, but without requiring users to understand prompts, system configurations, or technical setup. It's executive intelligence as a service.Six core tenets governing the 
  development of an executive briefing/digest application:

  User-Centric Value Delivery: Prioritize time-saving, stress-reducing 
  features that enhance executive effectiveness. Choose approaches that 
  deliver immediate tangible value.
  Privacy & Security First: Strict privacy principles, minimal raw data 
  storage, secure token handling, process-and-discard approach for sensitive 
  communications.
  Efficiency & Frugality: Cost-effective solutions, optimize for reduced LLM 
  token usage, Python-first logic over LLM where possible, MVP-focused 
  development.
  Incremental Value & Phased Rollout: Follow phased approach - Discover & Hook
   → Digest Delivery → Comprehensive Briefs. Deliver incremental value early, 
  avoid scope creep.
  Maintainability & Modularity: Clean, modular code following Python best 
  practices. Architecture includes api_clients.py, data_parsers.py modules.
  Actionability & "Signals Over Noise": Output must condense information into 
  clear signals highlighting key projects, blockers, achievements, and 
  actionable items for executive decision-making.
- Product Vision
360 Brief delivers AI-powered daily and weekly digests (HTML + audio) for busy team managers, helping them track project updates, follow-ups, and team wins without sifting through endless email, Slack, and calendar noise.
Core MVP Goals
Authenticate users with Supabase (Google, Slack, Microsoft).
Ingest communications starting with Gmail → Slack → Calendar.
Filter noise (e.g., marketing emails).
Summarize into structured JSON with categories:
Project updates
Follow-up questions
Exemplary achievements

# Using Gemini CLI for Large Codebase Analysis

When analyzing large codebases or multiple files that might exceed context limits, use the Gemini CLI with its massive
context window. Use `gemini -p` to leverage Google Gemini's large context capacity.

## File and Directory Inclusion Syntax

Use the `@` syntax to include files and directories in your Gemini prompts. The paths should be relative to WHERE you run the
  gemini command:

### Examples:

**Single file analysis:**
gemini -p "@src/main.py Explain this file's purpose and structure"

Multiple files:
gemini -p "@package.json @src/index.js Analyze the dependencies used in the code"

Entire directory:
gemini -p "@src/ Summarize the architecture of this codebase"

Multiple directories:
gemini -p "@src/ @tests/ Analyze test coverage for the source code"

Current directory and subdirectories:
gemini -p "@./ Give me an overview of this entire project"

# Or use --all_files flag:
gemini --all_files -p "Analyze the project structure and dependencies"

Implementation Verification Examples

Check if a feature is implemented:
gemini -p "@src/ @lib/ Has dark mode been implemented in this codebase? Show me the relevant files and functions"

Verify authentication implementation:
gemini -p "@src/ @middleware/ Is JWT authentication implemented? List all auth-related endpoints and middleware"

Check for specific patterns:
gemini -p "@src/ Are there any React hooks that handle WebSocket connections? List them with file paths"

Verify error handling:
gemini -p "@src/ @api/ Is proper error handling implemented for all API endpoints? Show examples of try-catch blocks"

Check for rate limiting:
gemini -p "@backend/ @middleware/ Is rate limiting implemented for the API? Show the implementation details"

Verify caching strategy:
gemini -p "@src/ @lib/ @services/ Is Redis caching implemented? List all cache-related functions and their usage"

Check for specific security measures:
gemini -p "@src/ @api/ Are SQL injection protections implemented? Show how user inputs are sanitized"

Verify test coverage for features:
gemini -p "@src/payment/ @tests/ Is the payment processing module fully tested? List all test cases"

When to Use Gemini CLI

Use gemini -p when:
- Analyzing entire codebases or large directories
- Comparing multiple large files
- Need to understand project-wide patterns or architecture
- Current context window is insufficient for the task
- Working with files totaling more than 100KB
- Verifying if specific features, patterns, or security measures are implemented
- Checking for the presence of certain coding patterns across the entire codebase

Important Notes

- Paths in @ syntax are relative to your current working directory when invoking gemini
- The CLI will include file contents directly in the context
- No need for --yolo flag for read-only analysis
- Gemini's context window can handle entire codebases that would overflow Claude's context
- When checking implementations, be specific about what you're looking for to get accurate results

Generate outputs:
HTML digest (email-style)
Audio briefing (short, manager-friendly)
Data Depth Principle
Goal: Gather comprehensive context for each communication.
Include:
Subject, sender, recipients (to/cc/bcc)
Message body (full text, not preview)
Previous messages in a thread (conversation history)
Timestamps (sent, received, replied)
Attachments metadata (filename, type, size)
Calendar fields (title, participants, date/time, location, description)
Slack/chat metadata (channel, thread, sender, mentions, reactions)


Processing Approach:
Scan deeply first, then summarize.
MVP should prioritize accuracy and completeness over load time.
Performance optimization (batching, caching) can come later.
Why Depth Matters: Enables accurate identification of follow-ups, achievements, and richer action-oriented summaries.


Privacy-First Product Principles
Data Minimalism & Control → Only ingest what the user explicitly allows; granular permissions.


Local/Client-Side Processing wherever feasible before sending to cloud.


Ephemeral Raw Data → auto-delete after digest generation unless user opts to save.


Exportability → Users can download their data (JSON, Markdown).


End-to-End Security → Encrypt in transit + at rest; comply with SOC2/GDPR best practices.


Transparent AI → Summaries show reasoning (e.g., why something is marked as a follow-up).


Audio Privacy → Preview before generation; store securely, auto-expire unless saved.


Opt-in Sharing Only → No data used to improve models without explicit user consent.


Differentiators / Moat
Manager-focused framing (not just inbox zero).


Action-oriented summaries (follow-ups, wins, updates).


Audio digest format (rare in competitors).


Trust moat via privacy-first architecture.


Inspirations (GetRecall.ai Learnings)
Knowledge linking → Relate new digests to past themes.


Digest graph → Show relationships across updates.


Light reminders → Resurface follow-ups in a weekly flash review.


Local-first ethos → Position brand as “your data, your device.”


Cross-platform integration → Plan for browser extensions / mobile notifications later.

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

# current-issues-to-fix
## Brief Generation Issues (2025-09-03)
**Status**: Brief generation works with mock data but fails with real Gmail data

### Critical Issues:
1. **OAuth Token Management**
   - Tokens expiring: `Token expired (2025-09-02T23:29:30.000Z < 2025-09-03T20:04:20.929Z)`
   - Gmail API returning 401 Unauthorized
   - Token refresh mechanism not working properly

2. **Database Schema Issues** 
   - Constraint error: `duplicate key value violates unique constraint "user_tokens_user_id_provider_key"`
   - Type mismatch: `invalid input syntax for type bigint: "2025-09-03T21:04:43.422Z"`
   - Timestamp format incompatible with database schema

3. **Python Analytics Service**
   - Service running on port 8000 but timing out
   - Returning 202 (processing) status but never completing
   - Multiple fallback attempts all failing

### Next Steps for Debugging:
1. Fix OAuth token refresh mechanism in Gmail API integration
2. Resolve database constraint errors for user tokens table
3. Fix timestamp format issues in database queries
4. Debug Python analytics service timeout issues
5. Test Gmail API authentication flow end-to-end
6. Verify brief generation works with real Gmail data

## Email Fetching Optimization Strategy (2025-09-05)
**Priority**: Implement after resolving current OAuth/database issues

### Optimization Plan:
1. **Phase 1: Metadata-First Approach (Week 1)**
   - Fetch only metadata (subject, sender, date, labels) initially
   - Score emails based on importance before fetching full content
   - Extract first 500 chars of body for top 50-100 emails only
   - Skip marketing emails and artifacts early in pipeline
   - Expected: 75% reduction in processing time (15min → 3-4min)

2. **Phase 2: Smart Caching (Week 2)**
   - Cache processed results with timestamps
   - Only fetch new emails since last successful run
   - Store importance scores to avoid recalculation
   - Implement intelligent cache invalidation

3. **Phase 3: Parallel Processing (Week 3)**
   - Add async processing with rate limiting (10-20 concurrent)
   - Process emails in batches of 20-50
   - Implement exponential backoff for rate limit errors

### Implementation Notes:
- Current `GmailService` at `services/data_processing/src/data_processing/services/gmail_service.py` needs refactoring
- Prioritization algorithm should focus on:
  - Subject keywords (urgent, meeting, decision)
  - Sender importance (executives, key clients)
  - Recency and Gmail labels
- Maintain executive-focused value delivery throughout optimization

## Future Development Items (2025-09-05)
**Status**: Potential enhancements identified during home page audit

### Demo Page Enhancements:
- Current demo at `/demo` shows static time lapse animation
- Consider adding:
  - Interactive demo with real sample data
  - Video walkthrough of actual briefing generation
  - Before/after comparison showing time savings
  - Live preview of different brief formats (web, email, audio)

### Missing Marketing Pages (if needed for launch):
- All current home page links are working ✅
- Consider adding for future marketing:
  - Customer testimonials/case studies page
  - Detailed feature comparison page  
  - Integration showcase page
  - ROI calculator for executive time savings

### Home Page Status:
- ✅ Hero section with working signup link
- ✅ "Watch Demo" button links to functional demo page
- ✅ All navigation and CTA buttons have valid paths
- ✅ No broken links found during audit

### Current Working State:
- Next.js dev server: ✅ Running on http://localhost:3000
- Python analytics service: ✅ Running on http://localhost:8000
- Authentication flow: ✅ Working (OAuth succeeds)
- Brief generation: ✅ Working with mock data
- Real data integration: ❌ Failing due to above issues

### Commands to Restart Services:
```bash
# Kill any processes on port 3000
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Start Next.js
npm run dev

# Start Python analytics (if needed)
cd services/data_processing && python3 simple_analytics_api.py
```