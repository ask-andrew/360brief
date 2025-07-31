declare module 'node-mocks-http' {
  import { IncomingMessage, ServerResponse } from 'http';
  import { NextApiRequest, NextApiResponse } from 'next';

  export interface MockRequest<T = any> extends NextApiRequest {
    body: T;
    query: Record<string, string | string[]>;
    cookies: Record<string, string>;
    _setBody: (body: T) => void;
    _setQuery: (query: Record<string, string | string[]>) => void;
    _setCookies: (cookies: Record<string, string>) => void;
    _addHeader: (name: string, value: string) => void;
  }

  export interface MockResponse<T = any> extends NextApiResponse {
    _getData: () => string;
    _getJSONData: () => T;
    _getStatusCode: () => number;
    _getHeaders: () => Record<string, string>;
    _isEndCalled: () => boolean;
    _isJSON: () => boolean;
    _isUTF8: () => boolean;
    _isDataLengthValid: () => boolean;
    _getRedirectUrl: () => string;
    _getRenderData: () => any;
  }

  export interface RequestOptions {
    method?: string;
    url?: string;
    originalUrl?: string;
    query?: Record<string, any>;
    params?: Record<string, any>;
    session?: any;
    cookies?: Record<string, string>;
    signedCookies?: Record<string, string>;
    headers?: Record<string, string>;
    body?: any;
    user?: any;
    files?: any;
  }

  export interface ResponseOptions {
    eventEmitter?: any;
    writableStream?: any;
    req?: any;
  }

  export function createRequest<T = any>(
    options?: RequestOptions
  ): MockRequest<T>;

  export function createResponse<T = any>(
    options?: ResponseOptions
  ): MockResponse<T>;

  export function createMocks<T = any>(
    reqOptions?: RequestOptions,
    resOptions?: ResponseOptions
  ): { req: MockRequest<T>; res: MockResponse<T> };

  export function createNextMocks<T = any>(
    reqOptions?: RequestOptions,
    resOptions?: ResponseOptions
  ): { req: NextApiRequest & { user?: any }; res: NextApiResponse<T> };
}
