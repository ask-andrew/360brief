import { Handler } from '@netlify/functions';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { OAuth2Client } from 'google-auth-library';
import { URLSearchParams } from 'url'; // Ensure this import is at the top if not there

const handler: Handler = async (event) => {
    console.log("google-oauth-callback function invoked!");
    const { code, state, error } = event.queryStringParameters || {};
    console.log("Query parameters received:", { code, state, error });

    // --- Helper function for JSON response ---
    const respondWithError = (message: string, details?: string, userId?: string) => {
        console.error("Function error:", message, details);
        return {
            statusCode: 200, // We'll return 200 OK for debugging, not a redirect
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
        return respondWithError("Missing Google API credentials.");
    }

    const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

    let refreshToken = '';

    try {
        console.log("Attempting to exchange authorization code for tokens...");
        const { tokens } = await oauth2Client.getToken(code);
        console.log("Tokens received.");

        if (!tokens.refresh_token) {
            return respondWithError("No refresh token received.", undefined, userId);
        }
        refreshToken = tokens.refresh_token;
        console.log("Refresh token obtained. Length:", refreshToken.length);

    } catch (tokenError) {
        const errorMessage = tokenError instanceof Error ? tokenError.message : String(tokenError);
        return respondWithError("Error exchanging code for tokens.", errorMessage, userId);
    }

    const projectId = process.env.GCP_PROJECT_ID;
    if (!projectId) {
        return respondWithError("GCP_PROJECT_ID environment variable not set at runtime.", undefined, userId);
    }
    console.log("GCP_PROJECT_ID confirmed:", projectId);

    const secretManagerClient = new SecretManagerServiceClient();
    // Use a more robust replace for secret name, allowing only valid chars
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
                console.log(`Secret ${secretName} does not exist, will create.`);
            } else {
                console.error("Error checking secret existence:", getSecretError);
                throw getSecretError;
            }
        }

        if (!secretExists) {
            await secretManagerClient.createSecret({
                parent: `projects/${projectId}`,
                secretId: secretName,
                secret: {
                    replication: {
                        automatic: {},
                    },
                },
            });
            console.log(`Secret ${secretName} created.`);
        }

        const payload = Buffer.from(refreshToken, 'utf8');
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

    } catch (secretManagerError) {
        const errorMessage = secretManagerError instanceof Error ? secretManagerError.message : String(secretManagerError);
        return respondWithError("Secret storage failed.", errorMessage, userId);
    }
};