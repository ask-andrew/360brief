# 360Brief - Executive Briefing Platform

360Brief is a comprehensive executive briefing platform that consolidates multiple communication streams (emails, calendar, Slack, etc.) into actionable insights, transforming noise into clear signals for executive decision-making.

## 🎯 Core Value Proposition

**"Multiply time instead of drain time"** - Transform information overload into actionable executive briefings.

### Target Audience
- SMB to mid-market executives (<1000 employees)
- VP Operations, Head of Customer Success, Head of Product
- CEOs of small startups

## 🏗️ Architecture Overview

### Backend Services
- **UnifiedDataService**: Fetches and processes data from multiple sources (Gmail, Calendar)
- **Database Layer**: Secure token storage and user preferences (Supabase)
- **API Endpoints**: RESTful APIs for frontend consumption
- **Authentication**: Auth0 integration for secure user management
- **Caching**: In-memory caching for performance optimization

### Key Features
- 🔐 **Privacy-First**: Only derived insights stored, not raw sensitive data
- ⚡ **Real-time Processing**: Efficient data fetching with intelligent caching
- 🎨 **Personalization**: User preferences for digest style, timing, and content
- 📊 **Analytics Dashboard**: Priority messages, sentiment analysis, patterns
- 📧 **Multi-format Delivery**: Email, web dashboard, and future audio briefings

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Auth0 account
- Google Cloud Console project (for Gmail/Calendar APIs)

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd 360brief
   npm install
   ```

2. **Environment Setup:**
   Create `.env.local` with the following variables:
   ```env
   # Auth0 Configuration
   AUTH0_SECRET='your-auth0-secret'
   AUTH0_BASE_URL='http://localhost:3000'
   AUTH0_ISSUER_BASE_URL='https://your-domain.auth0.com'
   AUTH0_CLIENT_ID='your-auth0-client-id'
   AUTH0_CLIENT_SECRET='your-auth0-client-secret'
   
   # Google OAuth
   GOOGLE_CLIENT_ID='your-google-client-id'
   GOOGLE_CLIENT_SECRET='your-google-client-secret'
   GOOGLE_REDIRECT_URI='http://localhost:3000/api/auth/callback/google'
   
   # Supabase
   SUPABASE_URL='your-supabase-url'
   SUPABASE_ANON_KEY='your-supabase-anon-key'
   
   # Optional: Gemini API for future AI features
   GEMINI_API_KEY='your-gemini-api-key'
   ```

3. **Database Setup:**
   ```bash
   # Initialize Supabase (if using local development)
   npx supabase init
   npx supabase start
   
   # Run migrations
   npx supabase db push
   ```

4. **Run the application:**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

## 📁 Project Structure

```
360brief/
├── components/           # React components
├── lib/                 # Utility libraries
│   └── auth0.ts        # Authentication utilities
├── pages/              # Next.js pages
│   └── api/            # API routes
│       └── brief-data.ts # Main data endpoint
├── services/           # Backend services
│   ├── cache.ts        # Caching utilities
│   ├── db.ts          # Database operations
│   └── unifiedDataService.ts # Core data processing
├── supabase/          # Database schema and migrations
│   └── migrations/    # SQL migration files
├── types/             # TypeScript type definitions
└── netlify/           # Netlify functions (alternative deployment)
```

## 🔌 API Endpoints

### `GET /api/brief-data`
Main endpoint that returns unified briefing data for authenticated users.

**Response Format:**
```json
{
  "success": true,
  "data": {
    "metadata": {
      "userId": "user123",
      "timeRange": {
        "start": "2024-01-01T00:00:00Z",
        "end": "2024-01-08T00:00:00Z",
        "timeZone": "America/Chicago"
      },
      "generatedAt": "2024-01-08T10:00:00Z"
    },
    "overview": {
      "totalEmails": 45,
      "unreadEmails": 12,
      "totalMeetings": 8,
      "upcomingMeetings": 3
    },
    "priorities": [...],
    "emailAnalytics": {...},
    "meetingAnalytics": {...},
    "insights": {...},
    "actionItems": [...]
  }
}
```

**Query Parameters:**
- `refresh=true`: Force cache refresh

## 🗄️ Database Schema

### Tables

#### `user_tokens`
Stores OAuth refresh tokens for external service integrations.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | TEXT | Auth0 user identifier |
| provider | ENUM | OAuth provider (google, microsoft, etc.) |
| refresh_token | TEXT | Encrypted refresh token |
| access_token | TEXT | Current access token (optional) |
| expires_at | BIGINT | Token expiration timestamp |
| scopes | TEXT[] | Granted OAuth scopes |
| token_metadata | JSONB | Additional token metadata |

#### `user_preferences`
Stores user preferences for digest generation and delivery.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | TEXT | Auth0 user identifier |
| timezone | TEXT | User's timezone |
| digest_frequency | ENUM | daily, weekly, weekdays, custom |
| digest_time | TEXT | Time of day (HH:MM format) |
| digest_style | ENUM | management, executive, minimal, detailed |
| preferred_format | ENUM | email, web, both |
| priority_keywords | TEXT[] | Keywords that increase message priority |
| key_contacts | TEXT[] | Important contact email addresses |

## 🔒 Security & Privacy

### Data Handling
- **Process-and-Discard**: Raw email/calendar data is processed and discarded
- **Derived Insights Only**: Only analytical insights and metadata are stored
- **Token Encryption**: OAuth tokens encrypted at rest in Supabase
- **Row-Level Security**: Database policies ensure users only access their data

### Authentication
- Auth0 integration for secure user management
- JWT-based API authentication
- Automatic token refresh handling
- Secure session management

## 🚀 Deployment

### Production Environment Variables
Ensure all environment variables are set in your production environment:
- Auth0 configuration with production URLs
- Google OAuth with production redirect URIs
- Supabase production database credentials

### Deployment Options

#### Vercel (Recommended)
```bash
npm run build
vercel --prod
```

#### Netlify
```bash
npm run build
netlify deploy --prod
```

## 🧪 Development

### Key Development Principles
1. **User-Centric Value**: Prioritize time-saving, stress-reducing features
2. **Privacy & Security First**: Minimal data storage, secure token handling
3. **Efficiency & Frugality**: Cost-effective solutions, optimized API usage
4. **Incremental Value**: Phased rollout approach
5. **Maintainability**: Clean, modular code following best practices
6. **Actionability**: Focus on signals over noise

### Testing
```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run integration tests
npm run test:integration
```

### Code Quality
```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

## 📊 Monitoring & Analytics

- **Performance Monitoring**: API response times, cache hit rates
- **Error Tracking**: Comprehensive error logging and alerting
- **Usage Analytics**: User engagement and feature adoption
- **Security Monitoring**: Failed authentication attempts, suspicious activity

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@360brief.com or join our Slack community.

---

**Built with ❤️ for executives who value their time**
