import { NextResponse } from 'next/server';

export async function GET() {
  const auth0Domain = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const redirectUri = `${process.env.AUTH0_BASE_URL}/api/auth/callback`;
  const scope = 'openid profile email';
  const responseType = 'code';
  const codeChallenge = 'challenge';
  const codeChallengeMethod = 'S256';

  const authUrl = new URL(`https://${auth0Domain}/authorize`);
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scope);
  authUrl.searchParams.set('response_type', responseType);
  authUrl.searchParams.set('code_challenge', codeChallenge);
  authUrl.searchParams.set('code_challenge_method', codeChallengeMethod);

  return NextResponse.redirect(authUrl.toString());
}
