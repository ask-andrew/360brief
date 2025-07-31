/**
 * Auth0 Configuration
 * * To set up authentication, you need to create a free Auth0 account and a new 'Single Page Application'.
 * 1. Go to your Auth0 Dashboard -> Applications.
 * 2. Create a new Application and name it (e.g., '360Brief App').
 * 3. Choose 'Single Page Web Applications' as the application type.
 * 4. In the application's 'Settings' tab, find the 'Domain' and 'Client ID'.
 * 5. Copy and paste them into the corresponding fields below.
 * * Also, you must configure the callback URLs in your Auth0 Application settings:
 * - Add `http://localhost:8888/dashboard` to 'Allowed Callback URLs', 'Allowed Logout URLs', and 'Allowed Web Origins' for local development.
 * - Add your live Netlify site URL (e.g., `https://your-site-name.netlify.app`) to these fields for production.
 */
export const auth0Config = {
  domain: "dev-i7fjk3ewk3kpofry.us.auth0.com", // Replace with your Auth0 Domain
  clientId: "keCgwYGwRh1rjuFMxlIX06WQmRXK6bmW", // Replace with your Auth0 Client ID
  audience: "https://api.360brief.com", // Replace with your API Identifier
  redirectUri: "http://localhost:8888/dashboard", // <--- UPDATED THIS LINE
};
