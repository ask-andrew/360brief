const { OAuth2Client } = require('google-auth-library');

// Replace these with your actual values
const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_GOOGLE_CLIENT_SECRET';
const REDIRECT_URI = 'YOUR_GOOGLE_REDIRECT_URI';
const REFRESH_TOKEN = 'YOUR_REFRESH_TOKEN';

async function main() {
  const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  client.setCredentials({ refresh_token: REFRESH_TOKEN });

  const { credentials } = await client.refreshAccessToken();
  console.log('New access token:', credentials.access_token);
  console.log('Full credentials:', credentials);
}

main().catch(console.error);