import { google } from 'googleapis';

// Server-only Google OAuth2 client factory
export function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!clientId || !clientSecret || !appUrl) {
    throw new Error('Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET or NEXT_PUBLIC_APP_URL');
  }

  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    `${appUrl}/api/auth/google/callback`
  );
}

export const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

export function generateAuthUrl(state?: { redirect?: string; account_type?: 'personal' | 'business' }): string {
  const oauth2Client = getOAuthClient();
  const params: any = {
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  };

  if (state) {
    try {
      const payload = Buffer.from(JSON.stringify({
        redirect: state.redirect || '/dashboard',
        account_type: state.account_type || 'personal',
      }), 'utf-8').toString('base64');
      params.state = encodeURIComponent(payload);
    } catch {
      // ignore if serialization fails
    }
  }

  return oauth2Client.generateAuthUrl(params);
}

export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = getOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
}
