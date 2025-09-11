# Google OAuth Production Setup Instructions

## Current Issue
The production site at https://360brief.com is showing "invalid_client" error because the Google OAuth client redirect URIs don't include the production callback URL.

## ✅ Environment Variables Status
All production environment variables are correctly configured in Netlify:
- `NEXT_PUBLIC_APP_URL`: `https://360brief.com` ✅
- `GOOGLE_CLIENT_ID`: `903551999211-1i1buetcsfq1lrbmsjqr7nvfmaqgn105.apps.googleusercontent.com` ✅  
- `GOOGLE_CLIENT_SECRET`: Configured ✅

## ❌ Missing Google Console Configuration

### URGENT: Add Production Redirect URI
In the Google Cloud Console OAuth 2.0 Client:
1. Navigate to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find OAuth 2.0 Client ID: `903551999211-1i1buetcsfq1lrbmsjqr7nvfmaqgn105.apps.googleusercontent.com`
3. Click EDIT on the OAuth client
4. In "Authorized redirect URIs" section, ADD:
   ```
   https://360brief.com/api/auth/gmail/callback
   ```
5. Keep existing localhost URI:
   ```
   http://localhost:3000/api/auth/gmail/callback
   ```
6. Click SAVE

### Optional: Add Production Origins
In "Authorized JavaScript origins" section, ADD:
```
https://360brief.com
```

## Testing Steps

### 1. Local Testing ✅ WORKING
- OAuth flow works with localhost callback
- Callback creates Supabase user session  
- Tokens are stored correctly
- Brief generation works with real Gmail data

### 2. Production Testing (After OAuth Console Fix)
1. ✅ Environment variables configured in Netlify
2. ❌ **BLOCKING**: Add `https://360brief.com/api/auth/gmail/callback` to Google OAuth client
3. ✅ Code deployed and ready
4. **Next**: Test login flow at https://360brief.com/login
5. **Next**: Verify Gmail token storage and brief generation in production

## Deployment Status
- **Platform**: Netlify ✅
- **Site ID**: `2e9151a5-401a-4f3a-be25-15f6146ae300`
- **Production URL**: https://360brief.com
- **Environment**: All variables configured ✅

## Current OAuth Flow Status
✅ **Local Development**: Working  
❌ **Production**: Blocked by Google Console OAuth configuration  
✅ **Code Implementation**: Complete  
✅ **Environment Variables**: Configured  
✅ **Netlify Deployment**: Ready  

## Manual Action Required
**Only remaining step**: Add the production callback URL to Google OAuth client in Google Cloud Console.  