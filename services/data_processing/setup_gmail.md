# Gmail API Setup Guide

To connect real Gmail data to the analytics dashboard, you need to set up Google OAuth2 credentials.

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API:
   - Go to "APIs & Services" → "Library" 
   - Search for "Gmail API"
   - Click "Enable"

## Step 2: Create OAuth2 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "+ CREATE CREDENTIALS" → "OAuth client ID"
3. Choose "Web application"
4. Add these redirect URIs:
   ```
   http://localhost:3000/api/auth/gmail/callback
   http://localhost:8080/callback
   ```
5. Download the JSON credentials file

## Step 3: Configure Environment

1. Save the downloaded JSON file as `gmail_credentials.json` in the `services/data_processing/` directory
2. Set the environment variable:
   ```bash
   export GMAIL_CREDENTIALS_FILE="./gmail_credentials.json"
   ```
   
   Or add to your `.env` file:
   ```
   GMAIL_CREDENTIALS_FILE=./gmail_credentials.json
   ```

## Step 4: Test the Integration

1. Restart the analytics API server
2. Go to `http://localhost:3000/analytics`
3. Toggle to "My Data"
4. Click "Connect Gmail Account"
5. Complete the OAuth2 authorization flow

## Troubleshooting

- **"credentials file not found"**: Check the file path and environment variable
- **"redirect URI mismatch"**: Ensure the redirect URIs in Google Cloud Console match exactly
- **"access denied"**: Make sure the Gmail API is enabled in your Google Cloud project

## Security Notes

- The credentials file contains sensitive information - never commit it to git
- Tokens are stored locally and can be revoked at any time from your Google Account settings
- The application only requests read-only access to Gmail data