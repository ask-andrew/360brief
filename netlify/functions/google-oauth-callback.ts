import { Handler } from '@netlify/functions';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { OAuth2Client } from 'google-auth-library';
import { URLSearchParams } from 'url';

const handler: Handler = async (event) => {
    console.log("google-oauth-callback function invoked!");
    const { code, state, error } = event.queryStringParameters || {};
    console.log("Query parameters received:", { code, state, error });

    // --- Helper function for JSON response ---
    const respondWithError = (message: string, details?: string, userId?: string) => {
        console.error("Function error:", message, details);
        return {
            statusCode: 200, // Always return 200 OK with JSON for debugging
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                success: false,
                error: message,
                details: details,
                userId: userId,
            }),
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

    const stateParams = new URLSearchParams(state);
    const userId = stateParams.get('userId');

    if (!userId) {
        return respondWithError("User ID not found in state.");
    }
    console.log("User ID from state:", userId);

    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

    if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
        return respondWithError("Missing Google API credentials.", "One or more of GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI environment variables are not set.", userId);
    }

    const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

    let refreshToken = '';

    try {
        console.log("Attempting to exchange authorization code for tokens...");
        const { tokens } = await oauth2Client.getToken(code);
        console.log("Tokens received.");

        if (!tokens.refresh_token) {
            return respondWithError("No refresh token received from Google.", "This usually means the user did not grant offline access, or it's a non-refreshable token.", userId);
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
    const secretName = `360brief-google-refresh-token-${userId.replace(/[^a-zA-Z0-9-]/g, '_')}`;
    const secretPath = `projects/${projectId}/secrets/${secretName}`;

    try {
        console.log(`Attempting to create/update secret: ${secretPath}`);
        let secretExists = false;
        try {
            await secretManagerClient.getSecret({ name: secretPath });
            secretExists = true;
            console.log(`Secret ${secretName} already exists.`);
        } catch (getSecretError: any) {
            if (getSecretError.code === 5) { // NOT_FOUND status code in gRPC
                secretExists = false;
                console.log(`Secret ${secretName} does not exist, will attempt to create.`);
            } else {
                // If getSecret fails for reasons other than NOT_FOUND, that's an issue
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

        // Now, try to add the new secret version
        const payload = Buffer.from(refreshToken, 'utf8');
        try {
            await secretManagerClient.addSecretVersion({
                parent: secretPath,
                payload: {
                    data: payload,
                },
            });
            console.log(`New secret version added for ${secretName}.`);

            // If everything worked, return success JSON
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    success: true,
                    message: "Google refresh token stored successfully!",
                    userId: userId,
                }),
            };
        } catch (addSecretVersionError) {
            const errorMessage = addSecretVersionError instanceof Error ? addSecretVersionError.message : String(addSecretVersionError);
            return respondWithError("Failed to add secret version to Secret Manager.", errorMessage, userId);
        }

    } catch (unexpectedError) {
        // This catches any other unexpected errors in the main try block
        const errorMessage = unexpectedError instanceof Error ? unexpectedError.message : String(unexpectedError);
        return respondWithError("An unexpected error occurred during overall secret management operations.", errorMessage, userId);
    }
};