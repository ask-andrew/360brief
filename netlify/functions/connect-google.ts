import { getGoogleAuthUrl } from './utils/gmail';

export const handler = async (event: any) => {
  try {
    if (event.httpMethod !== 'GET') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const params = event.queryStringParameters || {};
    const account_type = params.account_type === 'business' ? 'business' : 'personal';

    // Where to return the user in your app after auth completes
    const appRedirect = params.redirect || `${process.env.APP_URL}/dashboard`;

    // This must match the redirect URI configured in the Google Console and used in the callback
    const googleRedirectUri = `${process.env.APP_URL}/api/auth/callback`;

    const url = await getGoogleAuthUrl(googleRedirectUri, {
      redirect: appRedirect,
      account_type,
    });

    return {
      statusCode: 302,
      headers: { Location: url },
      body: '',
    };
  } catch (err) {
    console.error('connect-google error', err);
    return {
      statusCode: 500,
      body: 'Failed to create Google auth URL',
    };
  }
};
