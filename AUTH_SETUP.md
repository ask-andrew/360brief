# 360Brief - Authentication Setup

This document outlines the authentication flow and setup for the 360Brief application.

## Authentication Flow

1. **Login Page**
   - User visits `/login`
   - Clicks "Sign in with Google" button
   - Redirected to Google OAuth consent screen
   - After authentication, redirected to `/auth/callback`

2. **Callback Route**
   - Handles the OAuth callback from Google
   - Exchanges the authorization code for a session
   - Redirects to the dashboard or previously requested page

3. **Protected Routes**
   - Middleware checks for an active session
   - Unauthenticated users are redirected to `/login`
   - Authenticated users trying to access `/login` are redirected to `/dashboard`

## Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Update for production
```

## Setting up Google OAuth in Supabase

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Providers
3. Enable Google provider
4. Add your Google OAuth credentials:
   - Client ID
   - Client Secret
5. Add the following authorized redirect URL to your Google Cloud Console:
   - `http://localhost:3000/auth/callback` (development)
   - `https://your-production-url.com/auth/callback` (production)
6. Add the following authorized JavaScript origins to your Google Cloud Console:
   - `http://localhost:3000` (development)
   - `https://your-production-url.com` (production)

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Troubleshooting

- **Authentication not working**: Ensure all environment variables are set correctly
- **CORS issues**: Verify your allowed origins in both Supabase and Google Cloud Console
- **Session not persisting**: Check cookie settings in your Supabase client configuration
