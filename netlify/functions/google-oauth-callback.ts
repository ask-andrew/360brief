// netlify/functions/google-oauth-callback.ts

import { Handler } from '@netlify/functions';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { OAuth2Client } from 'google-auth-library';
import { URLSearchParams } from 'url';

const handler: Handler = async (event) => {
    console.log("google-oauth-callback function invoked!");
    const { code, state, error } = event.queryStringParameters || {};
    console.log("Query parameters received:", { code, state, error });

    // --- Helper function for JSON response ---
    // NOTE: For a redirect, you should return a 302 status code and a Location header,
    // not a 200 OK with JSON. I'll adjust the usage below.
    const respondWithError = (message: string, details?: string, userId?: string) => {
        console.error("Function error:", message, details);
        // For a Google OAuth callback, we should redirect to the dashboard with error params
        const redirectUrl = `/dashboard?error=true&message=${encodeURIComponent(message + (details ? `: ${details}` : ''))}`;
        return {
            statusCode: 302,
            headers: {
                Location: redirectUrl,
            },
            body: "" // Body is not needed for a 302 redirect
        };
    };
    // --- End Helper ---

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
    const userId = state; // Assuming state is directly the userId
    
    if (!userId) {
        return respondWithError("User ID not found in state.", null, userId); // Pass userId for logging
    }
    console.log("User ID from state:", userId);

    // IMPORTANT: Ensure these environment variables are correctly set in Netlify
    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    // The REDIRECT_URI must match what was sent to Google in connect-google.ts
    // It should be dynamic based on the incoming host.
    const REDIRECT_URI = `${event.headers['x-forwarded-proto'] || 'https'}://${event.headers.host}/.netlify/functions/google-oauth-callback`;


    if (!CLIENT_ID || !CLIENT_SECRET) { // REDIRECT_URI is now dynamically built
        return respondWithError("Missing Google API credentials.", "One or more of GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET environment variables are not set.", userId);
    }
    console.log("Using REDIRECT_URI:", REDIRECT_URI); // Log the constructed URI

    const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

    let refreshToken = '';

    try {
        console.log("Attempting to exchange authorization code for tokens...");
        const { tokens } = await oauth2Client.getToken(code);
        console.log("Tokens received.");

        if (!tokens.refresh_token) {
            // This can happen if access_type 'offline' was not requested or user denied it.
            // Or if it's not the first time and you already have a refresh token.
            // For initial connection, a refresh token is critical.
            return respondWithError("No refresh token received from Google.", "This usually means the user did not grant offline access, or it's a non-refreshable token. Ensure 'access_type: offline' and 'prompt: consent' are set in generateAuthUrl.", userId);
        }
        refreshToken = tokens.refresh_token;
        console.log("Refresh token obtained. Length:", refreshToken.length);

    } catch (tokenError) {
        const errorMessage = tokenError instanceof Error ? tokenError.message : String(tokenError);
        return respondWithError("Error exchanging code for tokens with Google.", errorMessage, userId);
    }

    const projectId = process.env.GCP_PROJECT_ID;
    if (!projectId) {
        return respondWithError("GCP_PROJECT_ID environment variable not set at runtime.", "Please ensure GCP_PROJECT_ID is correctly configured in Netlify environment variables.", userId);
    }
    console.log("GCP_PROJECT_ID confirmed:", projectId);

    const secretManagerClient = new SecretManagerServiceClient();
    // Sanitize userId for secret name to be safe for GCP Secret Manager
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
            // Check for NOT_FOUND error specifically
            // Google Cloud client libraries often use grpc.status.NOT_FOUND (code 5) for 404
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
                // Create the secret
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

        // Add the new secret version (this will update if secret already exists)
        const payload = Buffer.from(refreshToken, 'utf8');
        try {
            await secretManagerClient.addSecretVersion({
                parent: secretPath,
                payload: {
                    data: payload,
                },
            });
            console.log(`New secret version added for ${secretName}.`);

            // Redirect back to the dashboard on success
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

export { handler }; // <--- THIS IS THE CRUCIAL LINE THAT WAS MISSING
