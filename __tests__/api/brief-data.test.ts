import { NextApiRequest, NextApiResponse } from 'next';
import briefDataHandler from '../../pages/api/brief-data';
import { createMockRequestResponse, withAuth } from '../test-utils';

// Mock the auth middleware
jest.mock('@auth0/nextjs-auth0');

// Mock the UnifiedDataService
jest.mock('../../services/unifiedDataService', () => {
  return {
    UnifiedDataService: jest.fn().mockImplementation(() => ({
      getUnifiedData: jest.fn().mockResolvedValue({
        emails: [
          {
            id: 'email1',
            subject: 'Test Email',
            from: 'test@example.com',
            date: new Date().toISOString(),
            snippet: 'This is a test email',
            priority: 'medium',
            hasAttachment: false,
            read: false,
            labels: ['INBOX'],
            actionItems: []
          }
        ],
        calendarEvents: [
          {
            id: 'event1',
            summary: 'Team Meeting',
            start: { dateTime: new Date(Date.now() + 3600000).toISOString() },
            end: { dateTime: new Date(Date.now() + 7200000).toISOString() },
            description: 'Weekly team sync',
            location: 'Zoom',
            attendees: [{ email: 'team@example.com' }],
            conferenceData: { entryPoints: [] },
            hangoutLink: null,
            status: 'confirmed'
          }
        ],
        actionItems: [
          {
            id: 'action1',
            text: 'Review PR #123',
            source: { type: 'email', id: 'email1' },
            dueDate: new Date(Date.now() + 86400000).toISOString(),
            status: 'pending',
            priority: 'medium'
          }
        ],
        summary: {
          emailStats: {
            total: 1,
            unread: 1,
            highPriority: 0,
            withAttachments: 0
          },
          meetingStats: {
            upcoming: 1,
            today: 0,
            thisWeek: 1
          },
          actionItems: {
            pending: 1,
            completed: 0,
            overdue: 0
          }
        }
      })
    }))
  };
});

describe('GET /api/brief-data', () => {
  it('should return 200 and unified data for authenticated user', async () => {
    const { req, res } = createMockRequestResponse({
      method: 'GET',
      headers: {
        'authorization': 'Bearer test-token'
      }
    });

    // Add authenticated user to request
    withAuth(req);

    await briefDataHandler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toHaveProperty('emails');
    expect(res._getJSONData()).toHaveProperty('calendarEvents');
    expect(res._getJSONData()).toHaveProperty('actionItems');
    expect(res._getJSONData()).toHaveProperty('summary');
  });

  it('should return 401 for unauthenticated requests', async () => {
    const { req, res } = createMockRequestResponse({
      method: 'GET'
    });

    await briefDataHandler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

    expect(res.statusCode).toBe(401);
    expect(res._getJSONData()).toHaveProperty('error', 'Unauthorized');
  });

  it('should return 500 if data fetch fails', async () => {
    // Force an error in the mock
    const { UnifiedDataService } = require('../../services/unifiedDataService');
    UnifiedDataService.mockImplementationOnce(() => ({
      getUnifiedData: jest.fn().mockRejectedValue(new Error('Failed to fetch data'))
    }));

    const { req, res } = createMockRequestResponse({
      method: 'GET',
      headers: {
        'authorization': 'Bearer test-token'
      }
    });

    withAuth(req);

    await briefDataHandler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

    expect(res.statusCode).toBe(500);
    expect(res._getJSONData()).toHaveProperty('error', 'Failed to fetch unified data');
  });

  it('should only allow GET method', async () => {
    const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    
    for (const method of methods) {
      const { req, res } = createMockRequestResponse({
        method,
        headers: {
          'authorization': 'Bearer test-token'
        }
      });

      withAuth(req);

      await briefDataHandler(req as unknown as NextApiRequest, res as unknown as NextApiResponse);

      expect(res.statusCode).toBe(405);
      expect(res._getJSONData()).toHaveProperty('error', 'Method not allowed');
    }
  });
});
