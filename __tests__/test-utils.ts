import { NextApiRequest, NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';

type MockRequestResponseOptions = {
  method?: string;
  body?: any;
  query?: Record<string, string | string[]>;
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
};

type MockResponse<T = any> = NextApiResponse<T> & {
  _getJSONData: () => T;
  status: (code: number) => MockResponse<T>;
  json: (data: T) => MockResponse<T>;
  statusCode: number;
};

type MockRequest = NextApiRequest & {
  user?: any;
  session?: any;
};

export const createMockRequestResponse = <T = any>({
  method = 'GET',
  body = null,
  query = {},
  headers = {},
  cookies = {}
}: MockRequestResponseOptions = {}) => {
  const mockReqRes = createMocks({
    method,
    body,
    query,
    headers: {
      'content-type': 'application/json',
      ...headers
    },
    cookies
  });

  // Cast to our custom types
  const req = mockReqRes.req as unknown as MockRequest;
  const res = mockReqRes.res as unknown as MockResponse<T>;

  // Add json method to response if not present
  if (!res.json) {
    res.json = function(data: T) {
      (this as any)._setJSONBody(data);
      return this;
    };
  }

  // Add status method to response if not present
  if (!res.status) {
    res.status = function(statusCode: number) {
      this.statusCode = statusCode;
      return this;
    };
  }

  return { req, res };
};

export const withAuth = <T extends { user?: any }>(
  req: T,
  userId = 'auth0|testuser123'
): T & { user: { sub: string } } => ({
  ...req,
  user: { sub: userId }
});
