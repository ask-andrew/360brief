    // netlify/functions/google-oauth-callback.ts

    import { Handler } from '@netlify/functions';
    import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
    import { OAuth2Client } from 'google-auth-library';
    import { URLSearchParams } from 'url';
    // Removed: import fs from 'fs';   // No longer needed for deployment logic

    const handler: Handler = async (event) => {
        console.log("google-oauth-callback function invoked!");
        const { code, state, error } = event.queryStringParameters || {};
        console.log("Query parameters received:", { code, state, error });

        const respondWithError = (message: string, details?: string, userId?: string) => {
            console.error("Function error:", message, details);
            const dashboardUrl = process.env.APP_DASHBOARD_URL || '/dashboard'; 
            const redirectUrl = `${dashboardUrl}?error=true&message=${encodeURIComponent(message + (details ? `: ${details}` : ''))}`;
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

        const userId = state;    
        if (!userId) {
            return respondWithError("User ID not found in state.", null, userId);    
        }
        console.log("User ID from state:", userId);

        const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
        const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
        
        const currentHost = event.headers.host;
        const protocol = currentHost.startsWith('localhost') ? 'http' : (event.headers['x-forwarded-proto'] || 'https');
        const REDIRECT_URI = `${protocol}://${currentHost}/.netlify/functions/google-oauth-callback`;


        if (!CLIENT_ID || !CLIENT_SECRET) {    
            return respondWithError("Missing Google API credentials.", "One or more of GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET environment variables are not set.", userId);
        }
        console.log("Using REDIRECT_URI for token exchange:", REDIRECT_URI);    

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

        let secretManagerClient: SecretManagerServiceClient;

        // --- Reconstruct credentials from individual environment variables (for deployment) ---
        // This logic is now the primary path as GOOGLE_APPLICATION_CREDENTIALS is for local only
        console.log("Using individual GCP service account credentials from environment variables (for deployment).");
        const privateKey = (process.env.GCP_SA_PRIVATE_KEY || '').replace(/\\n/g, '\n');
        
        console.log("Private key length after unescaping:", privateKey.length);
        console.log("Private key starts with:", privateKey.substring(0, 30)); 
        console.log("Private key ends with:", privateKey.slice(-30)); 

        const googleCredentials = {
            type: process.env.GCP_SA_TYPE,
            project_id: process.env.GCP_SA_PROJECT_ID,
            private_key_id: process.env.GCP_SA_PRIVATE_KEY_ID,
            private_key: privateKey,
            client_email: process.env.GCP_SA_CLIENT_EMAIL,
            client_id: process.env.GCP_SA_CLIENT_ID,
            auth_uri: process.env.GCP_SA_AUTH_URI,
            token_uri: process.env.GCP_SA_TOKEN_URI,
            auth_provider_x509_cert_url: process.env.GCP_SA_AUTH_PROVIDER_X509_CERT_URL,
            client_x509_cert_url: process.env.GCP_SA_CLIENT_X509_CERT_URL,
            universe_domain: process.env.GCP_SA_UNIVERSE_DOMAIN,
        };

        // --- Log all individual credential properties ---
        console.log("GCP Credentials being used:");
        console.log("  type:", googleCredentials.type);
        console.log("  project_id:", googleCredentials.project_id);
        console.log("  private_key_id:", googleCredentials.private_key_id);
        console.log("  private_key (first 30 chars):", googleCredentials.private_key?.substring(0, 30));
        console.log("  private_key (last 30 chars):", googleCredentials.private_key?.slice(-30));
        console.log("  private_key (full length):", googleCredentials.private_key?.length);
        console.log("  client_email:", googleCredentials.client_email);
        console.log("  client_id:", googleCredentials.client_id);
        console.log("  auth_uri:", googleCredentials.auth_uri);
        console.log("  token_uri:", googleCredentials.token_uri);
        console.log("  auth_provider_x509_cert_url:", googleCredentials.auth_provider_x509_cert_url);
        console.log("  client_x509_cert_url:", googleCredentials.client_x509_cert_url);
        console.log("  universe_domain:", googleCredentials.universe_domain);
        // --- END NEW LOGGING ---

        if (!projectId || !googleCredentials.private_key || !googleCredentials.client_email) {
            console.error("Missing critical GCP credentials. projectId:", projectId, "private_key_length:", googleCredentials.private_key?.length, "client_email:", googleCredentials.client_email);
            return respondWithError(
                "Missing Google Cloud Service Account Credentials.",
                "One or more of GCP_PROJECT_ID, GCP_SA_PRIVATE_KEY, or GCP_SA_CLIENT_EMAIL environment variables are not set or are empty.",
                userId
            );
        }
        secretManagerClient = new SecretManagerServiceClient({ credentials: googleCredentials });
        
        console.log("SecretManagerServiceClient initialized. Attempting to check secret existence...");

        const sanitizedUserId = userId.replace(/[^a-zA-Z0-9-]/g, '_');
        const secretName = `360brief-google-refresh-token-${sanitizedUserId}`;
        const secretPath = `projects/${projectId}/secrets/${secretName}`;

        try {
            console.log(`Attempting to get secret: ${secretPath}`);
            let secretExists = false;
            try {
                await secretManagerClient.getSecret({ name: secretPath });
                secretExists = true;
                console.log(`Secret ${secretName} already exists.`);
            } catch (getSecretError: any) {
                console.error("Error checking secret existence:", getSecretError); // Log the full error
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
                    console.log(`Creating secret: ${secretName}`);
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
                console.log(`Adding secret version to ${secretName}.`);
                await secretManagerClient.addSecretVersion({
                    parent: secretPath,
                    payload: {
                        data: payload,
                    },
                });
                console.log(`New secret version added for ${secretName}.`);

                const dashboardUrl = process.env.APP_DASHBOARD_URL || '/dashboard';
                return {
                    statusCode: 302,
                    headers: {
                        Location: `${dashboardUrl}?google_connected=true`,
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
    