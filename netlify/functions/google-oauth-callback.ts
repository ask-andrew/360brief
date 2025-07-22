import { Handler } from '@netlify/functions';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { OAuth2Client } from 'google-auth-library';
import { URLSearchParams } from 'url'; // Ensure this import is at the top if not there

const handler: Handler = async (event) => {
    console.log("google-oauth-callback function invoked!"); // This should appear in Netlify logs if they ever show up
    const { code, state, error } = event.queryStringParameters || {};
    console.log("Query parameters received:", { code, state, error });

    if (error) {
        console.error("Google OAuth error:", error);
        // Redirect with a clear error for the user
        return {
            statusCode: 302,
            headers: {
                Location: `/dashboard?auth_error=google_oauth_failed&details=${encodeURIComponent(error)}`,
            },
        };
    }

    if (!code) {
        console.error("No authorization code received.");
        return {
            statusCode: 302,
            headers: {
                Location: `/dashboard?auth_error=no_code_received`,
            },
        };
    }

    if (!state) {
        console.error("No state parameter received.");
        return {
            statusCode: 302,
            headers: {
                Location: `/dashboard?auth_error=no_state`,
            },
        };
    }

    // Decode the state to get the user ID
    const stateParams = new URLSearchParams(state);
    const userId = stateParams.get('userId');

    if (!userId) {
        console.error("User ID not found in state.");
        return {
            statusCode: 302,
            headers: {
                Location: `/dashboard?auth_error=user_id_missing_in_state`,
            },
        };
    }
    console.log("User ID from state:", userId);


    const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI; // This should be your Netlify function's callback URL

    if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
        console.error("Missing Google API credentials.");
        return {
            statusCode: 302,
            headers: {
                Location: `/dashboard?auth_error=missing_google_credentials`,
            },
        };
    }

    const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

    let refreshToken = '';

    try {
        // Exchange authorization code for tokens
        console.log("Attempting to exchange authorization code for tokens...");
        const { tokens } = await oauth2Client.getToken(code);
        console.log("Tokens received.");

        if (!tokens.refresh_token) {
            console.error("No refresh token received.");
            return {
                statusCode: 302,
                headers: {
                    Location: `/dashboard?auth_error=no_refresh_token&user=${encodeURIComponent(userId)}`,
                },
            };
        }
        refreshToken = tokens.refresh_token;
        console.log("Refresh token obtained. Length:", refreshToken.length); // Log length, not value

    } catch (tokenError) {
        console.error("Error exchanging code for tokens:", tokenError);
        const errorMessage = tokenError instanceof Error ? tokenError.message : String(tokenError);
        return {
            statusCode: 302,
            headers: {
                Location: `/dashboard?auth_error=token_exchange_failed&details=${encodeURIComponent(errorMessage)}&user=${encodeURIComponent(userId)}`,
            },
        };
    }

    const projectId = process.env.GCP_PROJECT_ID;
    if (!projectId) {
        console.error("GCP_PROJECT_ID environment variable not set at runtime.");
        return {
            statusCode: 302,
            headers: {
                Location: `/dashboard?auth_error=gcp_project_id_missing_runtime&user=${encodeURIComponent(userId)}`,
            },
        };
    }
    console.log("GCP_PROJECT_ID confirmed:", projectId);

    const secretManagerClient = new SecretManagerServiceClient();
    const secretName = `360brief-google-refresh-token-${userId.replace(/[^a-zA-Z0-9-]/g, '_')}`; // Ensure valid secret name chars
    const secretPath = `projects/${projectId}/secrets/${secretName}`;

    try {
        console.log(`Attempting to create/update secret: ${secretPath}`);
        // Check if secret exists
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
                // Re-throw other errors for getSecret, or handle specifically
                console.error("Error checking secret existence:", getSecretError);
                throw getSecretError; // Re-throw to catch in outer block
            }
        }

        if (!secretExists) {
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
            console.log(`Secret ${secretName} created.`);
        }

        // Add the new secret version (the refresh token)
        const payload = Buffer.from(refreshToken, 'utf8');
        await secretManagerClient.addSecretVersion({
            parent: secretPath,
            payload: {
                data: payload,
            },
        });
        console.log(`New secret version added for ${secretName}.`);

        // If everything worked, redirect with success
        return {
            statusCode: 302,
            headers: {
                Location: `/dashboard?google_connected=true&user=${encodeURIComponent(userId)}`,
            },
        };

    } catch (secretManagerError) {
        console.error("Error interacting with Secret Manager:", secretManagerError);
        const errorMessage = secretManagerError instanceof Error ? secretManagerError.message : String(secretManagerError);
        // Redirect with a detailed error for Secret Manager failure
        return {
            statusCode: 302,
            headers: {
                Location: `/dashboard?auth_error=secret_storage_failed&details=${encodeURIComponent(errorMessage)}&user=${encodeURIComponent(userId)}`,
            },
        };
    }
};