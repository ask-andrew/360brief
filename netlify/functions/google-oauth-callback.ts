import { Handler } from '@netlify/functions';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs';

interface QueryParams {
  code?: string;
  state?: string;
  error?: string;
}

const handler: Handler = async (event) => {
  console.log("google-oauth-callback function invoked!");
  const query: QueryParams = event.queryStringParameters || {};
  const { code, state, error } = query;
  console.log("Query parameters received:", { code, state, error });

  const respondWithError = (
    message: string,
    details?: string,
    userId?: string
  ) => {
    console.error("Function error:", message, details || '');
    const dashboardUrl = process.env.APP_DASHBOARD_URL || '/dashboard';
    const redirectUrl = `${dashboardUrl}?error=true&message=${encodeURIComponent(
      message + (details ? `: ${details}` : '')
    )}`;
    return {
      statusCode: 302,
      headers: { Location: redirectUrl },
      body: "",
    };
  };

  if (error) return respondWithError("Google OAuth error", error);
  if (!code) return respondWithError("No authorization code received.");
  if (!state) return respondWithError("No state parameter received.");

  const userId = state;
  console.log("User ID from state:", userId);

  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    return respondWithError(
      "Missing Google API credentials.",
      "GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables are not set.",
      userId
    );
  }

  const host = event.headers.host || '';
  const protocol =
    host.startsWith('localhost') || process.env.NETLIFY_DEV === 'true'
      ? 'http'
      : event.headers['x-forwarded-proto'] || 'https';

  const REDIRECT_URI = `${protocol}://${host}/.netlify/functions/google-oauth-callback`;
  console.log("Using REDIRECT_URI for token exchange:", REDIRECT_URI);

  const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

  let refreshToken = '';

  try {
    console.log("Exchanging authorization code for tokens...");
    const { tokens } = await oauth2Client.getToken(code);
    console.log("Tokens received.");

    if (!tokens.refresh_token) {
      return respondWithError(
        "No refresh token received from Google.",
        "Ensure 'access_type: offline' and 'prompt: consent' are set when generating the auth URL.",
        userId
      );
    }
    refreshToken = tokens.refresh_token;
    console.log(`Refresh token obtained (length: ${refreshToken.length})`);
  } catch (tokenError: any) {
    return respondWithError(
      "Error exchanging code for tokens with Google.",
      tokenError?.message || String(tokenError),
      userId
    );
  }

  const projectId = process.env.GCP_PROJECT_ID;
  if (!projectId) {
    return respondWithError(
      "Missing GCP_PROJECT_ID environment variable.",
      undefined,
      userId
    );
  }

  let secretManagerClient: SecretManagerServiceClient;

  const googleApplicationCredentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (googleApplicationCredentialsPath && host.startsWith('localhost')) {
    console.log("Using GOOGLE_APPLICATION_CREDENTIALS for local development.");
    try {
      fs.accessSync(googleApplicationCredentialsPath, fs.constants.R_OK);
      console.log(`Credentials file found at: ${googleApplicationCredentialsPath}`);
      secretManagerClient = new SecretManagerServiceClient();
    } catch (fileError: any) {
      return respondWithError(
        "Failed to load Google Application Credentials file.",
        fileError.message || String(fileError),
        userId
      );
    }
  } else {
    console.log("Using individual GCP service account environment variables.");
    const privateKey = (process.env.GCP_SA_PRIVATE_KEY || '').replace(/\\n/g, '\n');

    if (!privateKey || !process.env.GCP_SA_CLIENT_EMAIL) {
      return respondWithError(
        "Missing GCP service account private key or client email.",
        undefined,
        userId
      );
    }

    secretManagerClient = new SecretManagerServiceClient({
      credentials: {
        type: process.env.GCP_SA_TYPE,
        project_id: process.env.GCP_SA_PROJECT_ID,
        private_key_id: process.env.GCP_SA_PRIVATE_KEY_ID,
        private_key: privateKey,
        client_email: process.env.GCP_SA_CLIENT_EMAIL,
        client_id: process.env.GCP_SA_CLIENT_ID,
      },
    });
  }

  const sanitizedUserId = userId.replace(/[^a-zA-Z0-9-]/g, '_');
  const secretName = `360brief-google-refresh-token-${sanitizedUserId}`;
  const secretPath = `projects/${projectId}/secrets/${secretName}`;

  try {
    let secretExists = true;
    try {
      await secretManagerClient.getSecret({ name: secretPath });
      console.log(`Secret ${secretName} exists.`);
    } catch (getSecretError: any) {
      if (getSecretError.code === 5 || getSecretError.details?.includes('NOT_FOUND')) {
        secretExists = false;
        console.log(`Secret ${secretName} does not exist; creating.`);
      } else {
        throw getSecretError;
      }
    }

    if (!secretExists) {
      await secretManagerClient.createSecret({
        parent: `projects/${projectId}`,
        secretId: secretName,
        secret: {
          replication: { automatic: {} },
        },
      });
      console.log(`Secret ${secretName} created.`);
    }

    const payload = Buffer.from(refreshToken, 'utf8');

    await secretManagerClient.addSecretVersion({
      parent: secretPath,
      payload: { data: payload },
    });
    console.log(`New secret version added for ${secretName}.`);

    // --- Store refresh token in Supabase for backend access ---
    try {
      const { userTokens } = await import('../../services/db');
      console.log('[OAuth Callback] Storing token:', { userId, provider: 'google', refreshToken });
      await userTokens.set(userId, 'google', { refreshToken });
      console.log(`✅ Refresh token stored in Supabase for user ${userId}`);
    } catch (supabaseError: any) {
      console.error("❌ Failed to store refresh token in Supabase:", supabaseError.message || String(supabaseError));
      // Optionally, you could return an error here or proceed with just Secret Manager storage
    }

    const dashboardUrl = process.env.APP_DASHBOARD_URL || '/dashboard';
    return {
      statusCode: 302,
      headers: {
        Location: `${dashboardUrl}?google_connected=true`,
      },
      body: '',
    };
  } catch (err: any) {
    return respondWithError(
      "Error managing secrets in Google Secret Manager.",
      err.message || String(err),
      userId
    );
  }
};

export { handler };
