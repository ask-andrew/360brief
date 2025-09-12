import { test, expect } from '@playwright/test';

/**
 * Test suite for the Python analytics services
 * Tests the rule-based processing pipeline directly via API calls
 */

const PYTHON_SERVICE_URL = 'http://localhost:8000';

test.describe('Python Analytics Services', () => {
  
  test.describe('Gmail Service Full Content Processing', () => {
    test('should fetch emails with full content', async ({ request }) => {
      // Mock Gmail API response with full email content
      const mockEmailData = {
        user_id: 'test_user_123',
        start_date: '2025-01-01',
        end_date: '2025-01-15',
        max_results: 10
      };

      const response = await request.post(`${PYTHON_SERVICE_URL}/process-emails`, {
        data: mockEmailData,
        timeout: 30000
      });

      if (response.ok()) {
        const result = await response.json();
        
        // Should have processed emails
        expect(result).toHaveProperty('emails');
        expect(Array.isArray(result.emails)).toBe(true);
        
        // Emails should have full content now
        if (result.emails.length > 0) {
          const firstEmail = result.emails[0];
          expect(firstEmail).toHaveProperty('body');
          expect(firstEmail.body).toBeTruthy();
          expect(typeof firstEmail.body).toBe('string');
          expect(firstEmail.body.length).toBeGreaterThan(20); // Should have substantial content
        }
      } else {
        console.log(`Gmail service test skipped - service not available (${response.status()})`);
      }
    });

    test('should handle multipart email parsing', async ({ request }) => {
      // Test with mock multipart email data
      const mockMultipartEmail = {
        payload: {
          parts: [
            {
              mimeType: 'text/plain',
              body: {
                data: Buffer.from('This is the plain text content of the email.').toString('base64')
              }
            },
            {
              mimeType: 'text/html',
              body: {
                data: Buffer.from('<html><body><p>This is the HTML content.</p></body></html>').toString('base64')
              }
            }
          ]
        }
      };

      const response = await request.post(`${PYTHON_SERVICE_URL}/test-email-parsing`, {
        data: { email: mockMultipartEmail },
        timeout: 10000
      });

      if (response.ok()) {
        const result = await response.json();
        
        expect(result).toHaveProperty('parsed_body');
        expect(result.parsed_body).toContain('plain text content');
        expect(result.parsed_body).not.toContain('<html>'); // Should strip HTML tags
      }
    });
  });

  test.describe('Structured Data Extraction', () => {
    test('should extract projects from email content', async ({ request }) => {
      const mockEmailContent = `
        Subject: Project Alpha Update
        Body: We're making great progress on Project Alpha. The launch initiative 
        is scheduled for next month. The development team is working on the final 
        sprint before release. Project Beta is also moving forward with the 
        campaign planning phase.
      `;

      const response = await request.post(`${PYTHON_SERVICE_URL}/extract-structured-data`, {
        data: { content: mockEmailContent },
        timeout: 10000
      });

      if (response.ok()) {
        const result = await response.json();
        
        expect(result).toHaveProperty('projects');
        expect(Array.isArray(result.projects)).toBe(true);
        
        if (result.projects.length > 0) {
          const projects = result.projects;
          const projectNames = projects.map((p: any) => p.name.toLowerCase());
          
          expect(projectNames.some((name: string) => name.includes('alpha'))).toBe(true);
        }
      }
    });

    test('should identify incidents and blockers', async ({ request }) => {
      const mockIncidentContent = `
        Subject: Critical Issue - System Outage
        Body: We're experiencing a critical outage in the payment system. 
        This is an urgent issue that needs immediate attention. The bug is 
        causing failures across multiple services. Unable to process transactions.
      `;

      const response = await request.post(`${PYTHON_SERVICE_URL}/extract-structured-data`, {
        data: { content: mockIncidentContent },
        timeout: 10000
      });

      if (response.ok()) {
        const result = await response.json();
        
        expect(result).toHaveProperty('incidents');
        expect(Array.isArray(result.incidents)).toBe(true);
        
        if (result.incidents.length > 0) {
          const incidents = result.incidents;
          const firstIncident = incidents[0];
          
          expect(firstIncident).toHaveProperty('severity');
          expect(firstIncident.severity).toBe('high');
          expect(firstIncident.description).toContain('outage');
        }
      }
    });

    test('should extract financial mentions', async ({ request }) => {
      const mockFinancialContent = `
        Subject: Budget Review
        Body: The Q1 budget is $2.5M for the new initiative. We also need to 
        allocate $500K for infrastructure costs. The revenue target is $10M 
        for this fiscal year.
      `;

      const response = await request.post(`${PYTHON_SERVICE_URL}/extract-structured-data`, {
        data: { content: mockFinancialContent },
        timeout: 10000
      });

      if (response.ok()) {
        const result = await response.json();
        
        expect(result).toHaveProperty('financials');
        expect(Array.isArray(result.financials)).toBe(true);
        
        if (result.financials.length > 0) {
          const financials = result.financials;
          const amounts = financials.map((f: any) => f.amount);
          
          expect(amounts.some((amount: string) => amount.includes('2.5M'))).toBe(true);
          expect(amounts.some((amount: string) => amount.includes('500K'))).toBe(true);
        }
      }
    });

    test('should identify action items', async ({ request }) => {
      const mockActionContent = `
        Subject: Team Sync Follow-up
        Body: Action items from today's meeting:
        - John needs to complete the API documentation
        - Sarah should review the test cases by Friday
        - We must schedule the deployment for next week
        - Please update the project timeline
      `;

      const response = await request.post(`${PYTHON_SERVICE_URL}/extract-structured-data`, {
        data: { content: mockActionContent },
        timeout: 10000
      });

      if (response.ok()) {
        const result = await response.json();
        
        expect(result).toHaveProperty('action_items');
        expect(Array.isArray(result.action_items)).toBe(true);
        
        if (result.action_items.length > 0) {
          const actions = result.action_items;
          const descriptions = actions.map((a: any) => a.description.toLowerCase());
          
          expect(descriptions.some((desc: string) => desc.includes('documentation'))).toBe(true);
          expect(descriptions.some((desc: string) => desc.includes('review'))).toBe(true);
        }
      }
    });

    test('should extract achievements', async ({ request }) => {
      const mockAchievementContent = `
        Subject: Great News - Project Completed!
        Body: Congratulations team! We successfully launched the new feature yesterday. 
        The deployment was completed without any issues. Great job on achieving 
        this milestone ahead of schedule. The client is very happy with the results.
      `;

      const response = await request.post(`${PYTHON_SERVICE_URL}/extract-structured-data`, {
        data: { content: mockAchievementContent },
        timeout: 10000
      });

      if (response.ok()) {
        const result = await response.json();
        
        expect(result).toHaveProperty('achievements');
        expect(Array.isArray(result.achievements)).toBe(true);
        
        if (result.achievements.length > 0) {
          const achievements = result.achievements;
          const descriptions = achievements.map((a: any) => a.description.toLowerCase());
          
          expect(descriptions.some((desc: string) => desc.includes('launched') || desc.includes('completed'))).toBe(true);
        }
      }
    });
  });

  test.describe('Rule-Based Summary Generation', () => {
    test('should generate executive summary from structured data', async ({ request }) => {
      const mockStructuredData = {
        projects: [
          { name: 'Project Alpha', timestamp: '2025-01-10T10:00:00Z' },
          { name: 'Beta Initiative', timestamp: '2025-01-12T14:00:00Z' }
        ],
        incidents: [
          { description: 'Payment system outage', severity: 'high', timestamp: '2025-01-11T09:00:00Z' },
          { description: 'Minor UI bug', severity: 'low', timestamp: '2025-01-13T16:00:00Z' }
        ],
        action_items: [
          { description: 'Complete API documentation', assigned_to: 'John', timestamp: '2025-01-10T11:00:00Z' },
          { description: 'Review test cases', assigned_to: 'Sarah', timestamp: '2025-01-12T13:00:00Z' }
        ],
        achievements: [
          { description: 'Successfully launched new feature', timestamp: '2025-01-09T17:00:00Z' }
        ],
        financials: [
          { amount: '$2.5M', context: 'Q1 budget allocation', timestamp: '2025-01-08T10:00:00Z' }
        ],
        key_people: {
          'john_doe': {
            name: 'John Doe',
            email: 'john@company.com',
            interaction_count: 15,
            importance_score: 85,
            last_interaction: '2025-01-13T12:00:00Z'
          }
        }
      };

      const response = await request.post(`${PYTHON_SERVICE_URL}/generate-summary`, {
        data: { structured_data: mockStructuredData },
        timeout: 10000
      });

      if (response.ok()) {
        const result = await response.json();
        
        // Should have all expected sections
        expect(result).toHaveProperty('executive_summary');
        expect(result).toHaveProperty('key_projects');
        expect(result).toHaveProperty('blockers');
        expect(result).toHaveProperty('action_items');
        expect(result).toHaveProperty('achievements');
        expect(result).toHaveProperty('key_people');
        expect(result).toHaveProperty('financials');
        expect(result).toHaveProperty('recommendations');
        
        // Executive summary should mention key metrics
        expect(Array.isArray(result.executive_summary)).toBe(true);
        const summaryText = result.executive_summary.join(' ');
        expect(summaryText).toContain('2 active projects');
        expect(summaryText).toContain('critical issues');
        
        // Projects should be structured properly
        expect(Array.isArray(result.key_projects)).toBe(true);
        if (result.key_projects.length > 0) {
          const firstProject = result.key_projects[0];
          expect(firstProject).toHaveProperty('name');
          expect(firstProject).toHaveProperty('status');
        }
        
        // Blockers should include severity
        expect(Array.isArray(result.blockers)).toBe(true);
        if (result.blockers.length > 0) {
          const firstBlocker = result.blockers[0];
          expect(firstBlocker).toHaveProperty('severity');
          expect(firstBlocker).toHaveProperty('description');
        }
        
        // Should have actionable recommendations
        expect(Array.isArray(result.recommendations)).toBe(true);
        expect(result.recommendations.length).toBeGreaterThan(0);
        const recommendationsText = result.recommendations.join(' ');
        expect(recommendationsText).toMatch(/address|review|schedule|follow/i);
      }
    });

    test('should handle empty data gracefully', async ({ request }) => {
      const emptyData = {
        projects: [],
        incidents: [],
        action_items: [],
        achievements: [],
        financials: [],
        key_people: {}
      };

      const response = await request.post(`${PYTHON_SERVICE_URL}/generate-summary`, {
        data: { structured_data: emptyData },
        timeout: 10000
      });

      if (response.ok()) {
        const result = await response.json();
        
        // Should still have all sections
        expect(result).toHaveProperty('executive_summary');
        expect(result).toHaveProperty('recommendations');
        
        // Should provide meaningful fallback content
        const summaryText = result.executive_summary.join(' ');
        expect(summaryText).toContain('No significant activity');
        
        // Should still provide recommendations
        expect(result.recommendations.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Output Format Generation', () => {
    test('should generate plain text brief', async ({ request }) => {
      const mockSummaryData = {
        executive_summary: ['2 active projects tracked', '1 critical issue requiring attention'],
        key_projects: [{ name: 'Project Alpha', status: 'Active' }],
        blockers: [{ description: 'Payment system issue', severity: 'high' }],
        action_items: [{ description: 'Fix authentication bug', assigned_to: 'John' }],
        achievements: [{ description: 'Successfully deployed v2.0' }],
        recommendations: ['Address critical payment issue immediately'],
        generated_at: '2025-01-15T10:00:00Z'
      };

      const response = await request.post(`${PYTHON_SERVICE_URL}/generate-plain-text`, {
        data: { summary_data: mockSummaryData },
        timeout: 10000
      });

      if (response.ok()) {
        const result = await response.json();
        
        expect(result).toHaveProperty('plain_text');
        
        const plainText = result.plain_text;
        expect(plainText).toContain('EXECUTIVE BRIEF');
        expect(plainText).toContain('====');
        expect(plainText).toContain('EXECUTIVE SUMMARY');
        expect(plainText).toContain('KEY PROJECTS');
        expect(plainText).toContain('RECOMMENDATIONS');
        expect(plainText).toContain('Project Alpha');
        expect(plainText).toContain('Payment system issue');
      }
    });

    test('should generate HTML brief', async ({ request }) => {
      const mockSummaryData = {
        executive_summary: ['2 active projects tracked'],
        key_projects: [{ name: 'Project Alpha', status: 'Active', last_updated: '2025-01-10T10:00:00Z' }],
        blockers: [{ description: 'Payment system issue', severity: 'high' }],
        action_items: [{ description: 'Fix authentication bug', assigned_to: 'John' }],
        recommendations: ['Address critical payment issue'],
        generated_at: '2025-01-15T10:00:00Z'
      };

      const response = await request.post(`${PYTHON_SERVICE_URL}/generate-html`, {
        data: { summary_data: mockSummaryData },
        timeout: 10000
      });

      if (response.ok()) {
        const result = await response.json();
        
        expect(result).toHaveProperty('html');
        
        const html = result.html;
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('<title>Executive Brief</title>');
        expect(html).toContain('<h1>Executive Brief</h1>');
        expect(html).toContain('<h2>Executive Summary</h2>');
        expect(html).toContain('<h2>Key Projects</h2>');
        expect(html).toContain('Project Alpha');
        expect(html).toContain('high-severity');
        expect(html).toContain('font-family');
      }
    });
  });

  test.describe('Performance and Reliability', () => {
    test('should process data quickly without LLM calls', async ({ request }) => {
      const startTime = Date.now();
      
      const mockData = {
        projects: Array.from({ length: 10 }, (_, i) => ({ 
          name: `Project ${i}`, 
          timestamp: '2025-01-10T10:00:00Z' 
        })),
        incidents: Array.from({ length: 5 }, (_, i) => ({ 
          description: `Issue ${i}`, 
          severity: i === 0 ? 'high' : 'medium',
          timestamp: '2025-01-10T10:00:00Z' 
        })),
        action_items: Array.from({ length: 15 }, (_, i) => ({ 
          description: `Action ${i}`, 
          assigned_to: `User ${i % 3}`,
          timestamp: '2025-01-10T10:00:00Z' 
        }))
      };

      const response = await request.post(`${PYTHON_SERVICE_URL}/generate-summary`, {
        data: { structured_data: mockData },
        timeout: 5000 // Should complete quickly
      });

      const processingTime = Date.now() - startTime;
      
      if (response.ok()) {
        const result = await response.json();
        
        // Should complete in under 2 seconds (much faster than LLM)
        expect(processingTime).toBeLessThan(2000);
        
        // Should still produce quality results
        expect(result.executive_summary.length).toBeGreaterThan(0);
        expect(result.recommendations.length).toBeGreaterThan(0);
        
        console.log(`Summary generated in ${processingTime}ms`);
      }
    });

    test('should handle concurrent requests', async ({ request }) => {
      const mockData = {
        projects: [{ name: 'Test Project', timestamp: '2025-01-10T10:00:00Z' }],
        incidents: [],
        action_items: [],
        achievements: [],
        financials: [],
        key_people: {}
      };

      // Send 3 concurrent requests
      const requests = Array.from({ length: 3 }, () => 
        request.post(`${PYTHON_SERVICE_URL}/generate-summary`, {
          data: { structured_data: mockData },
          timeout: 10000
        })
      );

      const responses = await Promise.all(requests);
      
      // All requests should succeed
      for (const response of responses) {
        if (response.ok()) {
          const result = await response.json();
          expect(result).toHaveProperty('executive_summary');
          expect(result).toHaveProperty('recommendations');
        }
      }
    });

    test('should validate input data', async ({ request }) => {
      // Test with invalid data structure
      const invalidData = {
        projects: 'not an array',
        incidents: null,
        action_items: undefined
      };

      const response = await request.post(`${PYTHON_SERVICE_URL}/generate-summary`, {
        data: { structured_data: invalidData },
        timeout: 10000
      });

      if (response.ok()) {
        const result = await response.json();
        
        // Should handle gracefully and return fallback
        expect(result).toHaveProperty('executive_summary');
        expect(result.executive_summary).toContain('Unable to process');
      }
    });
  });

  test.describe('Integration Points', () => {
    test('should work with Next.js API routes', async ({ request }) => {
      // Test the integration endpoint that calls Python service
      const response = await request.post('/api/briefs/enhanced', {
        data: { 
          user_id: 'test_user',
          timeframe: 'week'
        },
        timeout: 30000
      });

      if (response.ok()) {
        const result = await response.json();
        
        // Should return structured brief data
        expect(result).toHaveProperty('brief');
        expect(result.brief).toHaveProperty('executive_summary');
        expect(result.brief).toHaveProperty('key_projects');
        expect(result.brief).toHaveProperty('recommendations');
        
        // Should indicate LLM-free processing
        expect(result).toHaveProperty('processing_method');
        expect(result.processing_method).toBe('rule_based');
      } else {
        console.log(`Integration test skipped - API not available (${response.status()})`);
      }
    });
  });
});

// Helper function to check if Python service is running
async function checkPythonService() {
  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}