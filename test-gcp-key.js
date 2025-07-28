// test-gcp-key.js
import { SecretManagerServiceClient } from '@google-cloud/secret-manager'; // Changed to import

// IMPORTANT: Replace these placeholders with the EXACT values from your .env file
// Ensure PRIVATE_KEY is exactly as it appears in your .env, including the quotes and \\n
const GCP_PROJECT_ID = "hidden-slice-465318-d0";
const GCP_SA_TYPE = "service_account";
const GCP_SA_PROJECT_ID = "hidden-slice-465318-d0";
const GCP_SA_PRIVATE_KEY_ID = "ad2d79fccca7f2b2b7a74ca4494f3b19f2062586";
const GCP_SA_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC8msW9Acd5ZoZE\\n3UZGxsUNAz3bKa4hZrgZWqGRbNHqlBbhdyooZqNc7l3dfcxmBg0NiQMGHLm5ixW8\\nvM1poNl+YlvRNwZkoFmg2YJJivokgYxM2lC2h7+RxfLFftif61YTgRETaNiEvRqc\\n+0KtCCUkc6k+P0VT/ujC0LRkREXICBzss6MijXQAIPuX0PLk5DnCiRtyWhoS7aa4\\n0FtTJnih3MRh5+38zaCJH3qQe6JmSWSfoIVYmdql8GjIC2QfxgV+h2s+ujJD0rJl\\n+Qh5AAMiZojaOshluMwYnCtnAMNoMhai+5nDEf34FVi/3F4/C+GBp5eiHbn3X/zq\\nFYOHy2K1AgMBAAECggEAA1mMYYsCi/lyMQ7tDJzDKzP/iUD4QsecRXcCn56bK9tt\\nfJutOAJ6rE/fguuVEcrRuIfSce1Yrx71R+DilRmyQzhkARdFGcxvSxgR5FR/lN5o\\nK4VFIbjPgjtN0IwsNMrtQHNuZjXagqEJM/iSephGcJtNSjm9dXx1jeA/E/jSdHcI\\nnI/t0rBMBDExMWdeIQJMdqntAXjg4tNGUGrXIH54D4+OCpnkS0+9qjuIQvonY790\nkoeXL8S6liKaFFypisVzdfXmtlkRSE8tOB3uzLOcJRXFgQDBNyHWob12wniLtB6C\\nwr+B98xHXp9EWk3iE4SuBCMo804sRwcgFLs65/HFAQKBgQDlCqxWH/kqUZemK7R8\\nGGKIzkeGM6JBFFgDBMRbtxOrOnsLiqVOpdt5MVMp1e2HqseBQF+Bd5JuzN7c+95e\\n/XRJ3vh7pQOBZBm8k0BuW36qITzc7/54+mb0pk8LAUOxJtl73b34iV86AJ8Hw5NK\\ni5sKw8UodnSu4IF4HfYWtzw9cQKBgQDSza0LVa/YFvU8OBWHbkgvbEDGpFoUAE8C\\nyAbSAqZ5YjAa5Vm8/FOWok+5vmwngpRKvjp6yGpP8lG4Av7bCCYirjbQwVmFdu8q\\nwxKSf4EpWLa85jhNr0RB/GWmIUXUhzyzIDu2fdKeYVQ7hspQGADGuhtgjYCq72m2\\nF+49fbdnhQKBgCLGEhApXoz8QkfqTsagdSVMHDPV1waGbi5XJPC/xO60PEYuUJa2\\nO7IUuQma/ysf1JZdDaL8YnEMDbIDU2mclXE5twQes3+LkRS+ToPyxDJURYdNsJbx\\nfXwbW9jR4lMdENvreJIpWRnXSk3FdbFVrL5fpqlUArciQsXX1qrwOuchAoGATcut\\nwvMadAr08gZYm6Rta2Lt/OEGhT8f6YzcR4DG4yEDU8m0dnRAfOTlu0y1KVedVoAh\\noNJ5uYtZ8SjZ2QeG22GjxSK14PVlikh3gC0iA5pDxi7INJMsA5YcBVVeKfLGyexp\\nXQ3OPrj4lwdFfo19K9ne5KEUDQFR5+uo9nSAzOkCgYEA1i3+Bih3aChkkGrvOjI4\\np/I5+lmrN7GcXDshfZx+yARE7bTc5WXPOBCATM2NBEFtfizauPpPuS2iY788od0o\\nr7rKUZWzrzJz9BSzBmtC3pdga3R4ZGHiFzpsTR+t7dS50LH855IE+yCDsnAGHWp4\\nBf9hFWx5o5dxp8DCPhbfdxA=\\n-----END PRIVATE KEY-----\\n"; // <-- THIS IS THE KEY YOU PROVIDED
const GCP_SA_CLIENT_EMAIL = "netlify-secret-manager-access@hidden-slice-465318-d0.iam.gserviceaccount.com";
const GCP_SA_CLIENT_ID = "115478421600194251564";
const GCP_SA_AUTH_URI = "https://accounts.google.com/o/oauth2/auth";
const GCP_SA_TOKEN_URI = "https://oauth2.googleapis.com/token";
const GCP_SA_AUTH_PROVIDER_X509_CERT_URL = "https://www.googleapis.com/oauth2/v1/certs";
const GCP_SA_CLIENT_X509_CERT_URL = "https://www.googleapis.com/robot/v1/metadata/x509/netlify-secret-manager-access%40hidden-slice-465318-d0.iam.gserviceaccount.com";
const GCP_SA_UNIVERSE_DOMAIN = "googleapis.com";


async function testSecretManagerClient() {
    try {
        console.log("Attempting to initialize SecretManagerServiceClient with provided credentials...");

        const googleCredentials = {
            type: GCP_SA_TYPE,
            project_id: GCP_SA_PROJECT_ID,
            private_key_id: GCP_SA_PRIVATE_KEY_ID,
            private_key: GCP_SA_PRIVATE_KEY.replace(/\\n/g, '\n'), // Unescape newlines
            client_email: GCP_SA_CLIENT_EMAIL,
            client_id: GCP_SA_CLIENT_ID,
            auth_uri: GCP_SA_AUTH_URI,
            token_uri: GCP_SA_TOKEN_URI,
            auth_provider_x509_cert_url: GCP_SA_AUTH_PROVIDER_X509_CERT_URL,
            client_x509_cert_url: GCP_SA_CLIENT_X509_CERT_URL,
            universe_domain: GCP_SA_UNIVERSE_DOMAIN,
        };

        const client = new SecretManagerServiceClient({ credentials: googleCredentials });
        console.log("SecretManagerServiceClient initialized successfully!");

        // Attempt a simple API call to verify credentials (e.g., list secrets)
        // Note: This requires the service account to have 'Secret Manager Viewer' or similar permission
        // If you don't have any secrets yet, this might still error, but it will confirm key parsing.
        try {
            const [secrets] = await client.listSecrets({
                parent: `projects/${GCP_PROJECT_ID}`,
            });
            console.log(`Successfully listed ${secrets.length} secrets.`);
        } catch (listSecretsError) {
            console.warn("Could not list secrets (this might be due to no secrets or insufficient permissions beyond key parsing):", listSecretsError);
        }

    } catch (error) {
        console.error("Error initializing SecretManagerServiceClient or during API call:", error);
        if (error.details && error.details.includes('DECODER routines::unsupported')) {
            console.error("This is the 'DECODER routines::unsupported' error. The private key format is likely the issue.");
        }
    }
}

testSecretManagerClient();
