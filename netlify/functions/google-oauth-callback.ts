// netlify/functions/google-oauth-callback.ts

import { Handler } from '@netlify/functions';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { OAuth2Client } from 'google-auth-library';
import { URLSearchParams } from 'url'; // Keep this import if it's used elsewhere, though not directly in the provided snippet

const handler: Handler = async (event) => {
    console.log("google-oauth-callback function invoked!");
    const { code, state, error } = event.queryStringParameters || {};
    console.log("Query parameters received:", { code, state, error });

    const respondWithError = (message: string, details?: string, userId?: string) => {
        console.error("Function error:", message, details);
        const redirectUrl = `/dashboard?error=true&message=${encodeURIComponent(message + (details ? `: ${details}` : ''))}`;
        return {
            statusCode: 302,
            headers: {
                Location: redirectUrl,
            },
            body: ""
        };
    };

    if (error) {
        return respondWithError("Google OAuth error", error);
    }

    if (!code) {
        return respondWithError("No authorization code received.");
    }

    if (!state) {
        return respondWithError("No state parameter received.");
    }

    // The state parameter from Google OAuth will be the userId directly,
    // as set in connect-google.ts: `state: userId,`
    const userId = state;

    if (!userId) {
        return respondWithError("User ID not found in state.", null, userId);
    }
    console.log("User ID from state:", userId);

    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const REDIRECT_URI = `${event.headers['x-forwarded-proto'] || 'https'}://${event.headers.host}/.netlify/functions/google-oauth-callback`;


    if (!CLIENT_ID || !CLIENT_SECRET) {
        return respondWithError("Missing Google API credentials.", "One or more of GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET environment variables are not set.", userId);
    }
    console.log("Using REDIRECT_URI:", REDIRECT_URI);

    const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

    let refreshToken = '';

    try {
        console.log("Attempting to exchange authorization code for tokens...");
        const { tokens } = await oauth2Client.getToken(code);
        console.log("Tokens received.");

        if (!tokens.refresh_token) {
            return respondWithError("No refresh token received from Google.", "This usually means the user did not grant offline access, or it's a non-refreshable token. Ensure 'access_type: offline' and 'prompt: consent' are set in generateAuthUrl.", userId);
        }
        refreshToken = tokens.refresh_token;
        console.log("Refresh token obtained. Length:", refreshToken.length);

    } catch (tokenError) {
        const errorMessage = tokenError instanceof Error ? tokenError.message : String(tokenError);
        return respondWithError("Error exchanging code for tokens with Google.", errorMessage, userId);
    }

    const projectId = process.env.GCP_PROJECT_ID;

    // --- Reconstruct credentials from individual environment variables ---
    // Ensure private_key is a string and replace escaped newlines if present
    const privateKey = (process.env.GCP_SA_PRIVATE_KEY || '').replace(/\\n/g, '\n');

    const googleCredentials = {
        type: process.env.GCP_SA_TYPE,
        project_id: process.env.GCP_SA_PROJECT_ID,
        private_key_id: process.env.GCP_SA_PRIVATE_KEY_ID,
        private_key: privateKey, // Use the processed privateKey
        client_email: process.env.GCP_SA_CLIENT_EMAIL,
        client_id: process.env.GCP_SA_CLIENT_ID,
        auth_uri: process.env.GCP_SA_AUTH_URI,
        token_uri: process.env.GCP_SA_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.GCP_SA_AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: process.env.GCP_SA_CLIENT_X509_CERT_URL,
        universe_domain: process.env.GCP_SA_UNIVERSE_DOMAIN,
    };

    // Basic validation for essential credentials
    if (!projectId || !googleCredentials.private_key || !googleCredentials.client_email) {
        return respondWithError(
            "Missing Google API credentials.",
            "One or more of GCP_PROJECT_ID, GCP_SA_PRIVATE_KEY, or GCP_SA_CLIENT_EMAIL environment variables are not set.",
            userId
        );
    }
    console.log("GCP_PROJECT_ID confirmed:", projectId);
    console.log("Google Cloud credentials loaded from environment variables.");

    // Use the reconstructed credentials for SecretManagerServiceClient
    const secretManagerClient = new SecretManagerServiceClient({ credentials: googleCredentials });

    const sanitizedUserId = userId.replace(/[^a-zA-Z0-9-]/g, '_');
    const secretName = `360brief-google-refresh-token-${sanitizedUserId}`;
    const secretPath = `projects/${projectId}/secrets/${secretName}`;

    try {
        console.log(`Attempting to create/update secret: ${secretPath}`);
        let secretExists = false;
        try {
            await secretManagerClient.getSecret({ name: secretPath });
            secretExists = true;
            console.log(`Secret ${secretName} already exists.`);
        } catch (getSecretError: any) {
            if (getSecretError.code === 5 || getSecretError.details?.includes('NOT_FOUND')) {
                secretExists = false;
                console.log(`Secret ${secretName} does not exist, will attempt to create.`);
            } else {
                const errorMessage = getSecretError instanceof Error ? getSecretError.message : String(getSecretError);
                return respondWithError("Failed to check secret existence (unexpected error from getSecret).", errorMessage, userId);
            }
        }

        if (!secretExists) {
            try {
                await secretManagerClient.createSecret({
                    parent: `projects/${projectId}`,
                    secretId: secretName,
                    secret: {
                        replication: {
                            automatic: {},
                        },
                    },
                });
                console.log(`Secret ${secretName} created successfully.`);
            } catch (createSecretError) {
                const errorMessage = createSecretError instanceof Error ? createSecretError.message : String(createSecretError);
                return respondWithError("Failed to create secret in Secret Manager.", errorMessage, userId);
            }
        }

        const payload = Buffer.from(refreshToken, 'utf8');
        try {
            await secretManagerClient.addSecretVersion({
                parent: secretPath,
                payload: {
                    data: payload,
                },
            });
            console.log(`New secret version added for ${secretName}.`);

            return {
                statusCode: 302,
                headers: {
                    Location: `/dashboard?google_connected=true`,
                },
                body: ""
            };
        } catch (addSecretVersionError) {
            const errorMessage = addSecretVersionError instanceof Error ? addSecretVersionError.message : String(addSecretVersionError);
            return respondWithError("Failed to add secret version to Secret Manager.", errorMessage, userId);
        }

    } catch (unexpectedError) {
        const errorMessage = unexpectedError instanceof Error ? unexpectedError.message : String(unexpectedError);
        return respondWithError("An unexpected error occurred during overall secret management operations.", errorMessage, userId);
    }
};

export { handler };