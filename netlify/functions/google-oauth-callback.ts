
import type { Handler } from "@netlify/functions";
import { google } from "googleapis";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { Buffer } from "buffer";

const secretManagerClient = new SecretManagerServiceClient();

const handler: Handler = async (event) => {
  const { code, state, error } = event.queryStringParameters || {};

  const siteUrl = process.env.URL || 'http://localhost:8888';

  if (error) {
    console.error("Google OAuth Error:", error);
    return {
      statusCode: 302,
      headers: { Location: `${siteUrl}/?error=google-auth-failed&message=${encodeURIComponent(error)}` },
    };
  }

  if (!code || !state) {
    return { statusCode: 400, body: "Missing authorization code or state." };
  }

  const userId = state;

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${siteUrl}/api/google-oauth-callback`
    );

    const { tokens } = await oauth2Client.getToken(code);
    const refreshToken = tokens.refresh_token;

    if (!refreshToken) {
      throw new Error("Refresh token not received from Google. This can happen if consent was not granted or if it was a re-authentication without 'prompt: consent'.");
    }
    
    const projectId = process.env.GCP_PROJECT_ID;
    if (!projectId) {
        throw new Error("GCP_PROJECT_ID environment variable not set.");
    }

    const safeUserId = userId.replace(/[^a-zA-Z0-9-]/g, '-');
    const secretId = `360brief-google-refresh-token-${safeUserId}`;
    const secretPath = `projects/${projectId}/secrets/${secretId}`;
    
    try {
        await secretManagerClient.getSecret({ name: secretPath });
    } catch (e: any) {
        if (e.code === 5) { // GRPC 'NOT_FOUND' error
            await secretManagerClient.createSecret({
                parent: `projects/${projectId}`,
                secretId: secretId,
                secret: { replication: { automatic: {} } },
            });
        } else {
            throw e;
        }
    }
    
    await secretManagerClient.addSecretVersion({
        parent: secretPath,
        payload: { data: Buffer.from(refreshToken, 'utf8') },
    });

    return {
      statusCode: 302,
      headers: { Location: `${siteUrl}/?google_connected=true` },
    };
  } catch (err: any) {
    console.error("Failed to process Google OAuth callback:", err);
    return {
      statusCode: 302,
      headers: { Location: `${siteUrl}/?error=token-exchange-failed&message=${encodeURIComponent(err.message)}` },
    };
  }
};

export { handler };