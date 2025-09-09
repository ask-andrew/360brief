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
    `${appUrl}/api/auth/gmail/callback`
  );
}

export const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.metadata', 
  'https://www.googleapis.com/auth/gmail.modify', // More comprehensive Gmail access
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'openid'
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

export async function refreshAccessToken(refreshToken: string, retryCount: number = 0): Promise<any> {
  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  
  try {
    console.log(`🔄 Attempting token refresh (attempt ${retryCount + 1})`);
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    // Ensure we have both access_token and expiry_date
    if (!credentials.access_token) {
      throw new Error('No access token received from refresh');
    }
    
    // Google returns expiry_date as Unix timestamp in milliseconds
    const expiryDate = credentials.expiry_date;
    
    console.log(`✅ Token refresh successful, expires at: ${expiryDate ? new Date(expiryDate).toISOString() : 'unknown'}`);
    
    return {
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token || refreshToken, // Keep original if not returned
      expiry_date: expiryDate,
      token_type: credentials.token_type || 'Bearer'
    };
    
  } catch (error: any) {
    console.error(`❌ Token refresh failed (attempt ${retryCount + 1}):`, error.message);
    
    // Implement exponential backoff for transient errors
    if (retryCount < 3 && isRetriableError(error)) {
      const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
      console.log(`⏰ Retrying token refresh in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return refreshAccessToken(refreshToken, retryCount + 1);
    }
    
    // Re-throw with more context
    throw new Error(`Token refresh failed after ${retryCount + 1} attempts: ${error.message}`);
  }
}

function isRetriableError(error: any): boolean {
  // Retry on network errors, rate limits, and temporary server errors
  const retriableCodes = [429, 500, 502, 503, 504];
  const httpStatus = error.response?.status || error.status;
  
  return (
    retriableCodes.includes(httpStatus) ||
    error.code === 'ECONNRESET' ||
    error.code === 'ETIMEDOUT' ||
    error.message?.includes('network') ||
    error.message?.includes('timeout')
  );
}
