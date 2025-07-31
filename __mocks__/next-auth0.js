// Mock for @auth0/nextjs-auth0
const withApiAuthRequired = (handler) => {
  return async (req, res) => {
    // Skip actual auth in tests
    if (!req.user) {
      req.user = { sub: 'auth0|testuser123' };
    }
    return handler(req, res);
  };
};

const getSession = () => ({
  user: { sub: 'auth0|testuser123' },
  accessToken: 'test-access-token'
});

const withPageAuthRequired = (component) => component;

// Export as CommonJS
module.exports = {
  withApiAuthRequired,
  getSession,
  withPageAuthRequired,
  default: {
    withApiAuthRequired,
    getSession,
    withPageAuthRequired
  }
};
