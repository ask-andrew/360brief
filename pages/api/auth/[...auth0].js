import { handleAuth, handleCallback, handleLogin, handleLogout } from '@auth0/nextjs-auth0';

export default handleAuth({
  async login(req, res) {
    try {
      await handleLogin(req, res, {
        authorizationParams: {
          scope: 'openid profile email',
        },
        returnTo: '/dashboard',
      });
    } catch (error) {
      res.status(error.status || 500).end(error.message);
    }
  },
  async logout(req, res) {
    try {
      await handleLogout(req, res, {
        returnTo: '/',
      });
    } catch (error) {
      res.status(error.status || 500).end(error.message);
    }
  },
  async callback(req, res) {
    try {
      await handleCallback(req, res, { afterCallback });
    } catch (error) {
      res.status(error.status || 500).end(error.message);
    }
  },
});

async function afterCallback(req, res, session, state) {
  // You can add any post-authentication logic here
  return session;
}
