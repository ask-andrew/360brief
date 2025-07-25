// src/components/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { GoogleLoginIcon, CheckCircleIcon, LinkIcon, SlackIcon } from './Icons';
import StyleSelector from './StyleSelector'; // From HEAD - crucial for the style preference step
import { auth0Config } from '../config'; // From main - crucial for Auth0 configuration

const Dashboard: React.FC = () => {
    const { user, getAccessTokenSilently } = useAuth0();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isGoogleConnected, setIsGoogleConnected] = useState(false);
    // This state is from HEAD and enables the multi-step dashboard flow
    const [stylePreferenceSaved, setStylePreferenceSaved] = useState(false); 

    const handleConnectGoogle = async () => {
        setIsLoading(true);
        setError(null);
        try {
            console.log("DEBUG: handleConnectGoogle initiated."); // From main - useful debug
            const accessToken = await getAccessTokenSilently({
                authorizationParams: {
                    audience: auth0Config.audience, // From main - important for Auth0 security
                },
            });
            console.log("DEBUG: Access Token obtained:", accessToken); // From main - useful debug

            const response = await fetch('/.netlify/functions/connect-google', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            console.log("DEBUG: Fetch response received. Status:", response.status); // From main - useful debug

            if (!response.ok) {
                const errorData = await response.json();
                console.error("DEBUG: Fetch response NOT OK. Error data:", errorData); // From main - useful debug
                throw new Error(errorData.message || 'Failed to start Google connection process.');
            }

            const { authUrl } = await response.json();
            console.log("DEBUG: Received authUrl. Redirecting..."); // From main - useful debug
            window.location.href = authUrl;

        } catch (err: any) {
            console.error("DEBUG: Error in handleConnectGoogle:", err); // From main - useful debug
            setError(err.message || 'An unexpected error occurred.');
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        if (queryParams.get('google_connected') === 'true') {
            setIsGoogleConnected(true);
            // Clean the URL (from HEAD)
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        if (queryParams.get('error')) {
            setError(`Failed to connect Google Account: ${queryParams.get('message') || 'Unknown error.'}`);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    // This entire render logic is taken from HEAD as it provides the multi-step flow
    const renderContent = () => {
        if (!isGoogleConnected) {
            return (
                <div className="mt-12 bg-slate-800/50 p-8 rounded-2xl border border-slate-700 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    <h2 className="text-2xl font-bold text-white mb-6">Connect Your Services</h2>
                    {error && (
                        <div className="bg-red-900/50 border border-red-500 text-red-300 p-4 rounded-lg mb-6">
                            <strong>Connection Error:</strong> {error}
                        </div>
                    )}
                    <div className="space-y-4">
                        {/* Google Connect Section - combined styling from main, button text from HEAD */}
                        <div className={`p-6 rounded-lg flex items-center justify-between transition-all duration-300 ${isGoogleConnected ? 'bg-green-900/20 border border-green-500/30' : 'bg-slate-800 border border-slate-600'}`}>
                            <div className="flex items-center gap-4">
                                <GoogleLoginIcon className="w-8 h-8" />
                                <div>
                                    <h3 className="font-bold text-lg text-white">Google Account</h3>
                                    <p className="text-sm text-slate-400">Connect Gmail and Calendar for emails and events.</p>
                                </div>
                            </div>
                            {isGoogleConnected ? (
                                <div className="flex items-center gap-2 text-green-400">
                                    <CheckCircleIcon className="w-6 h-6" />
                                    <span className="font-semibold">Connected</span>
                                </div>
                            ) : (
                                <button
                                    onClick={handleConnectGoogle}
                                    disabled={isLoading}
                                    className="flex items-center gap-2 bg-brand-blue text-white font-semibold py-2 px-5 rounded-lg hover:bg-sky-400 transition-colors duration-300 disabled:bg-slate-600 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-white"></div>
                                            <span>Connecting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <LinkIcon className="w-5 h-5" />
                                            <span>Connect</span> {/* Keeping "Connect" from HEAD */}
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                        {/* Slack Section (unchanged from both, assumed no conflict) */}
                        <div className="p-6 rounded-lg flex items-center justify-between bg-slate-800 border border-slate-600 opacity-50">
                             <div className="flex items-center gap-4">
                                <SlackIcon className="w-8 h-8 text-slate-500" />
                                <div>
                                    <h3 className="font-bold text-lg text-slate-500">Slack</h3>
                                    <p className="text-sm text-slate-600">Coming soon</p>
                                </div>
                            </div>
                            <button disabled className="bg-slate-700 text-slate-500 font-semibold py-2 px-5 rounded-lg cursor-not-allowed">Connect</button>
                        </div>
                    </div>
                </div>
            );
        }

        // This entire block for StyleSelector is from HEAD
        if (isGoogleConnected && !stylePreferenceSaved) {
            return <StyleSelector onSave={() => setStylePreferenceSaved(true)} />;
        }
        
        // This entire block for "You're all set!" is from HEAD, providing more detail
        if (isGoogleConnected && stylePreferenceSaved) {
            return (
                <div className="mt-12 text-center animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    <div className="max-w-md mx-auto bg-slate-800/50 p-8 rounded-2xl border border-green-500/30">
                        <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto" />
                        <h2 className="text-2xl font-bold text-white mt-6">You're all set!</h2>
                        <p className="mt-2 text-slate-400">Your briefing style is saved. Your first brief will be generated shortly and sent to your email.</p>
                    </div>
                </div>
            );
        }
        
        return null; // Default return
    };

    // This function and its usage are from HEAD
    const getSubtitle = () => {
        if (!isGoogleConnected) {
            return "Let's get your accounts connected to start generating your personalized briefs.";
        }
        if (isGoogleConnected && !stylePreferenceSaved) {
            return "One last step: choose how you'd like to receive your briefings.";
        }
        return "You're ready to go. Your next briefing is on its way.";
    };

    return (
        <main className="container mx-auto px-6 md:px-12 py-12">
            <div className="max-w-4xl mx-auto">
                <div className="animate-fade-in-up">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white">
                        Welcome, <span className="text-brand-blue">{user?.given_name || user?.name}</span>
                    </h1>
                    <p className="mt-4 text-lg text-slate-400">
                        {getSubtitle()} {/* Using the combined subtitle logic */}
                    </p>
                </div>
                
                {renderContent()} {/* Using the combined render content logic */}
            </div>
        </main>
    );
};

export default Dashboard;