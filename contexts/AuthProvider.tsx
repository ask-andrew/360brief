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
        const returnTo = appState?.returnTo || window.location.pathname;
        window.history.replaceState({}, document.title, returnTo);
    };

    return (
        <Auth0Provider
            domain={domain}
            clientId={clientId}
            onRedirectCallback={onRedirectCallback}
            authorizationParams={{
                redirect_uri: window.location.origin, // <--- RE-ADDED THIS CRUCIAL LINE
                audience: audience, 
                // Optional: If your API needs specific permissions, you can also add scope here:
                // scope: 'openid profile email read:briefs',
            }}
        >
            {children}
        </Auth0Provider>
    );
};
