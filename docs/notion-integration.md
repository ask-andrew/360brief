# Notion Integration

This document outlines how to set up and use the Notion integration with 360Brief.

## Prerequisites

1. A Notion account with admin access to the workspace you want to connect
2. A Notion integration (internal or public)

## Setup Instructions

### 1. Create a Notion Integration

1. Go to [Notion Developers](https://www.notion.com/my-integrations)
2. Click on the "+ New integration" button
3. Fill in the following details:
   - Name: 360Brief
   - Logo: (Optional) Upload the 360Brief logo
   - Associated workspace: Select your workspace
   - Capabilities: Select the pages and databases you want to access
   - Content Capabilities: Read content
4. Click "Submit" to create the integration

### 2. Configure Environment Variables

Copy the `.env.local.example` file to `.env.local` and update the following variables:

```bash
# Notion OAuth
NOTION_CLIENT_ID=your_notion_client_id
NOTION_CLIENT_SECRET=your_notion_client_secret

# Update these for production
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Configure Redirect URIs

In your Notion integration settings, add the following redirect URIs:

- Development: `http://localhost:3000/api/notion/callback`
- Production: `https://your-production-url.com/api/notion/callback`

### 4. Run Database Migrations

Run the following command to apply the database migrations:

```bash
npx supabase db push
```

## Using the Integration

1. Go to Settings > Integrations
2. Click "Connect" on the Notion card
3. Authorize 360Brief to access your Notion workspace
4. Once connected, you'll see your workspace name and connection status

## Troubleshooting

### Common Issues

1. **Invalid redirect_uri**
   - Make sure you've added the correct redirect URI in your Notion integration settings
   - The `NEXT_PUBLIC_SITE_URL` environment variable must match the domain in your redirect URI

2. **Missing permissions**
   - Ensure the Notion integration has access to the pages/databases you're trying to access
   - The integration needs to be added to each page/database you want to access

3. **Rate limiting**
   - Notion has rate limits on their API (typically 3-5 requests per second)
   - Implement proper error handling and retries in your code

## Security Considerations

- Never commit your `NOTION_CLIENT_SECRET` to version control
- Store access tokens securely and encrypt them at rest
- Implement proper error handling for OAuth flows
- Regularly rotate your client secret in production

## API Reference

### Endpoints

- `GET /api/notion/authorize` - Initiate OAuth flow
- `GET /api/notion/callback` - Handle OAuth callback
- `GET /api/notion/connections` - List user's Notion connections
- `DELETE /api/notion/connections?id={id}` - Remove a connection

### Data Model

```sql
CREATE TABLE IF NOT EXISTS public.notion_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  bot_id TEXT NOT NULL,
  workspace_name TEXT,
  workspace_icon TEXT,
  owner_user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  UNIQUE(user_id, bot_id)
);
```

## Support

For issues with the Notion integration, please contact support@360brief.com
