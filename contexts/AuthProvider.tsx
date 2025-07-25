// src/auth/AuthProvider.tsx
import React from 'react';
import { Auth0Provider, AppState } from '@auth0/auth0-react';
import { auth0Config } from '../config';

export const AppAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { domain, clientId, audience } = auth0Config;

    // This component will render if the config is not set, guiding the user on how to fix it.
    if (!domain || !clientId || !audience || domain === "YOUR_AUTH0_DOMAIN" || clientId === "YOUR_AUTH0_CLIENT_ID" || audience === "YOUR_API_IDENTIFIER") {
        return (
            <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center text-center p-4">
                <h1 className="text-2xl font-bold text-white mb-4">Authentication Not Configured</h1>
                <p className="text-slate-400 max-w-lg">
                    To enable login, please create a free Auth0 application and add your Domain and Client ID to the 
                    <code className="bg-slate-700 text-amber-400 p-1 rounded-md mx-1">config.ts</code> file.
                    See the comments in that file for detailed instructions.
                </p>
            </div>
        );
    }

    const onRedirectCallback = (appState?: AppState) => {
        // This function is called after Auth0 redirects back to your application.
        // It helps maintain the correct path after authentication.
        const returnTo = appState?.returnTo || window.location.pathname;
        window.history.replaceState({}, document.title, returnTo);
    };

    return (
        <Auth0Provider
            domain={domain}
            clientId={clientId}
            onRedirectCallback={onRedirectCallback}
            authorizationParams={{
                // IMPORTANT: This redirect_uri must exactly match one of the "Allowed Callback URLs"
                // configured in your Auth0 application settings.
                // It should be the URL where Auth0 sends the user back after login.
                // Since your app redirects to /dashboard after Google connect, we set it here.
                redirect_uri: `${window.location.origin}/dashboard`, // <--- THIS LINE IS MODIFIED
                audience: audience, 
                // Optional: If your API needs specific permissions, you can also add scope here.
                // 'openid profile email' are standard OIDC scopes.
                // If your API needs custom scopes (e.g., 'read:data'), add them here.
                // scope: 'openid profile email read:briefs', 
            }}
            // It's often good practice to store the Auth0 session in local storage for persistence
            cacheLocation="localstorage" 
        >
            {children}
        </Auth0Provider>
    );
};
