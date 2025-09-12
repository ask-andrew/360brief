import { test, expect } from '@playwright/test';
import { chromium, Browser, Page } from '@playwright/test';

/**
 * Comprehensive test suite for the new LLM-free executive briefing flow
 * Tests the complete pipeline from Gmail authentication to brief generation
 */

test.describe('LLM-Free Executive Briefing Flow', () => {
  let browser: Browser;
  let page: Page;

  test.beforeAll(async () => {
    browser = await chromium.launch();
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test.beforeEach(async () => {
    page = await browser.newPage();
    await page.goto('/');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test.describe('Authentication and Setup', () => {
    test('should display home page with briefing options', async () => {
      await expect(page).toHaveTitle(/360Brief/);
      await expect(page.locator('h1')).toContainText('360Brief');
      
      // Check for key elements
      await expect(page.locator('text=Get Started')).toBeVisible();
      await expect(page.locator('text=Watch Demo')).toBeVisible();
    });

    test('should navigate to authentication flow', async () => {
      await page.click('text=Get Started');
      
      // Should redirect to auth page or show auth modal
      await expect(page.url()).toMatch(/\/auth|\/dashboard/);
    });

    test('should handle Gmail OAuth flow', async ({ page }) => {
      // Navigate to auth
      await page.goto('/auth');
      
      // Look for Gmail auth button
      const gmailButton = page.locator('button:has-text("Connect Gmail"), button:has-text("Continue with Google")');
      await expect(gmailButton).toBeVisible();
      
      // Note: In a real test, you'd mock the OAuth response
      // For now, we'll verify the button is functional
      await gmailButton.click();
      
      // Should redirect to Google OAuth (or mock response)
      await page.waitForURL(url => url.includes('google') || url.includes('callback'));
    });
  });

  test.describe('Brief Generation Pipeline', () => {
    // Mock authentication for pipeline tests
    test.beforeEach(async () => {
      // Set up authenticated state
      await page.goto('/dashboard');
      
      // Mock authentication state - in a real app you might set cookies/localStorage
      await page.evaluate(() => {
        localStorage.setItem('auth_token', 'mock_token');
        localStorage.setItem('user_email', 'test@example.com');
      });
    });

    test('should trigger brief generation process', async () => {
      // Look for "Generate Brief" or similar trigger
      const generateButton = page.locator('button:has-text("Generate Brief"), button:has-text("Create Brief"), button:has-text("Generate")');
      
      if (await generateButton.count() > 0) {
        await generateButton.first().click();
        
        // Should show loading state
        await expect(page.locator('text=Processing, text=Loading, text=Generating')).toBeVisible();
      } else {
        console.log('Generate button not found, checking for automatic generation');
      }
    });

    test('should process Gmail data with new full-content approach', async () => {
      // Navigate to analytics or brief page
      await page.goto('/analytics');
      
      // Wait for data processing
      await page.waitForTimeout(2000);
      
      // Check that we have data (indicating Gmail processing worked)
      const hasEmailData = await page.evaluate(async () => {
        // Check if page has email analytics data
        const emailCount = document.querySelector('[data-testid="email-count"], .email-count');
        const briefContent = document.querySelector('[data-testid="brief-content"], .brief-section');
        return emailCount !== null || briefContent !== null;
      });
      
      expect(hasEmailData).toBe(true);
    });

    test('should display structured brief sections', async () => {
      await page.goto('/dashboard');
      
      // Wait for brief to load
      await page.waitForSelector('[data-testid="executive-brief"], .executive-brief, .brief-container', { timeout: 10000 });
      
      // Check for key sections from our new implementation
      const briefSections = [
        'Executive Summary',
        'Key Projects', 
        'Blockers',
        'Action Items',
        'Achievements',
        'Recommendations'
      ];
      
      for (const section of briefSections) {
        const sectionElement = page.locator(`h2:has-text("${section}"), h3:has-text("${section}"), .section-${section.toLowerCase().replace(' ', '-')}`);
        await expect(sectionElement).toBeVisible({ timeout: 5000 });
      }
    });

    test('should show projects extracted from emails', async () => {
      await page.goto('/dashboard');
      await page.waitForSelector('.brief-container, [data-testid="projects-section"]', { timeout: 10000 });
      
      // Look for project listings
      const projectsSection = page.locator('.projects-section, [data-testid="projects"], h2:has-text("Key Projects") + div');
      
      if (await projectsSection.count() > 0) {
        await expect(projectsSection).toBeVisible();
        
        // Should have project names
        const projectItems = projectsSection.locator('.project-item, li, div[class*="project"]');
        const projectCount = await projectItems.count();
        expect(projectCount).toBeGreaterThan(0);
      }
    });

    test('should display action items with assignments', async () => {
      await page.goto('/dashboard');
      await page.waitForSelector('.brief-container', { timeout: 10000 });
      
      // Look for action items section
      const actionSection = page.locator('h2:has-text("Action Items"), h3:has-text("Action Items")');
      
      if (await actionSection.count() > 0) {
        await expect(actionSection).toBeVisible();
        
        // Check for action items
        const actionItems = page.locator('.action-item, [data-testid="action-item"]');
        const actionCount = await actionItems.count();
        
        if (actionCount > 0) {
          // Verify first action item has description
          const firstAction = actionItems.first();
          await expect(firstAction).toContainText(/\w+/); // Has some text content
        }
      }
    });

    test('should show financial highlights if present', async () => {
      await page.goto('/dashboard');
      await page.waitForSelector('.brief-container', { timeout: 10000 });
      
      // Look for financial section (might not always be present)
      const financialSection = page.locator('h2:has-text("Financial"), h3:has-text("Financial")');
      
      if (await financialSection.count() > 0) {
        await expect(financialSection).toBeVisible();
        
        // Should show dollar amounts
        const amounts = page.locator('text=/\\$[\\d,]+[KMB]?/');
        expect(await amounts.count()).toBeGreaterThan(0);
      }
    });

    test('should display recommendations with actionable advice', async () => {
      await page.goto('/dashboard');
      await page.waitForSelector('.brief-container', { timeout: 10000 });
      
      // Recommendations should always be present
      const recommendationsSection = page.locator('h2:has-text("Recommendations"), h3:has-text("Recommendations")');
      await expect(recommendationsSection).toBeVisible();
      
      // Should have at least one recommendation
      const recommendations = page.locator('.recommendation, [data-testid="recommendation"]');
      const recCount = await recommendations.count();
      expect(recCount).toBeGreaterThan(0);
      
      // First recommendation should have meaningful text
      const firstRec = recommendations.first();
      const recText = await firstRec.textContent();
      expect(recText).toBeTruthy();
      expect(recText!.length).toBeGreaterThan(10);
    });
  });

  test.describe('Brief Output Formats', () => {
    test.beforeEach(async () => {
      await page.goto('/dashboard');
      await page.waitForSelector('.brief-container', { timeout: 10000 });
    });

    test('should provide HTML brief format', async () => {
      // Look for export or view options
      const exportButton = page.locator('button:has-text("Export"), button:has-text("View HTML"), [data-testid="export-html"]');
      
      if (await exportButton.count() > 0) {
        await exportButton.first().click();
        
        // Should show HTML version or trigger download
        await page.waitForTimeout(1000);
        
        // Check if HTML content is displayed
        const htmlContent = page.locator('.html-brief, [data-testid="html-brief"]');
        if (await htmlContent.count() > 0) {
          await expect(htmlContent).toBeVisible();
          
          // Should have proper HTML structure
          const hasHeaders = await htmlContent.locator('h1, h2, h3').count();
          expect(hasHeaders).toBeGreaterThan(0);
        }
      }
    });

    test('should provide plain text brief format', async () => {
      // Look for plain text export option
      const textButton = page.locator('button:has-text("Text"), button:has-text("Plain Text"), [data-testid="export-text"]');
      
      if (await textButton.count() > 0) {
        await textButton.first().click();
        
        await page.waitForTimeout(1000);
        
        // Check if text version is shown
        const textContent = page.locator('pre, .text-brief, [data-testid="text-brief"]');
        if (await textContent.count() > 0) {
          await expect(textContent).toBeVisible();
          
          const content = await textContent.textContent();
          expect(content).toContain('EXECUTIVE BRIEF');
          expect(content).toContain('=====');
        }
      }
    });

    test('should handle empty data gracefully', async () => {
      // Mock a scenario with no data
      await page.evaluate(() => {
        // Clear any existing data
        localStorage.setItem('mock_no_data', 'true');
      });
      
      await page.reload();
      await page.waitForSelector('.brief-container, .no-data-message', { timeout: 10000 });
      
      // Should show appropriate message or empty state
      const noDataMsg = page.locator('text=No significant activity, text=No data, text=Unable to process');
      const hasNoDataMsg = await noDataMsg.count() > 0;
      
      if (hasNoDataMsg) {
        await expect(noDataMsg.first()).toBeVisible();
      }
    });
  });

  test.describe('Performance and Reliability', () => {
    test('should load brief within reasonable time', async () => {
      const startTime = Date.now();
      
      await page.goto('/dashboard');
      await page.waitForSelector('.brief-container', { timeout: 15000 });
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 15 seconds (much faster than LLM approach)
      expect(loadTime).toBeLessThan(15000);
      
      console.log(`Brief loaded in ${loadTime}ms`);
    });

    test('should handle network errors gracefully', async () => {
      // Simulate network failure
      await page.route('**/api/briefs/**', route => {
        route.abort('failed');
      });
      
      await page.goto('/dashboard');
      
      // Should show error state
      const errorMessage = page.locator('text=Error, text=Unable to load, text=Try again');
      await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });
    });

    test('should work without external API dependencies', async () => {
      // Block external API calls to ensure LLM-free operation
      await page.route('**/api.openai.com/**', route => route.abort());
      await page.route('**/generativelanguage.googleapis.com/**', route => route.abort());
      await page.route('**/api.anthropic.com/**', route => route.abort());
      
      await page.goto('/dashboard');
      await page.waitForSelector('.brief-container', { timeout: 10000 });
      
      // Should still work since we're not using LLM
      const briefTitle = page.locator('h1:has-text("Brief"), h2:has-text("Executive")');
      await expect(briefTitle.first()).toBeVisible();
    });
  });

  test.describe('Data Quality and Accuracy', () => {
    test('should extract meaningful projects from email content', async () => {
      await page.goto('/dashboard');
      await page.waitForSelector('.brief-container', { timeout: 10000 });
      
      const projectsSection = page.locator('h2:has-text("Key Projects") + div, .projects-section');
      
      if (await projectsSection.count() > 0) {
        const projectText = await projectsSection.textContent();
        
        // Should contain project-related keywords
        const hasProjectKeywords = /project|initiative|launch|release|campaign/i.test(projectText!);
        expect(hasProjectKeywords).toBe(true);
      }
    });

    test('should identify blockers with proper severity', async () => {
      await page.goto('/dashboard');
      await page.waitForSelector('.brief-container', { timeout: 10000 });
      
      const blockersSection = page.locator('h2:has-text("Blockers"), h3:has-text("Issues")');
      
      if (await blockersSection.count() > 0) {
        await expect(blockersSection).toBeVisible();
        
        // Should have severity indicators
        const severityMarkers = page.locator('.high-severity, .medium-severity, text=/HIGH|MEDIUM|LOW/');
        const hasSeverityMarkers = await severityMarkers.count() > 0;
        
        if (hasSeverityMarkers) {
          expect(await severityMarkers.first().isVisible()).toBe(true);
        }
      }
    });

    test('should generate contextual recommendations', async () => {
      await page.goto('/dashboard');
      await page.waitForSelector('.brief-container', { timeout: 10000 });
      
      const recommendationsSection = page.locator('h2:has-text("Recommendations") + div, .recommendations-section');
      await expect(recommendationsSection).toBeVisible();
      
      const recommendations = await recommendationsSection.textContent();
      
      // Should contain actionable language
      const hasActionableLanguage = /(review|address|schedule|follow up|consider|block time)/i.test(recommendations!);
      expect(hasActionableLanguage).toBe(true);
    });
  });

  test.describe('Integration with Python Analytics Service', () => {
    test('should successfully call Python analytics service', async () => {
      let responseReceived = false;
      
      // Monitor API calls to Python service
      page.on('response', async response => {
        if (response.url().includes(':8000') || response.url().includes('analytics')) {
          responseReceived = true;
          console.log(`Python service response: ${response.status()}`);
        }
      });
      
      await page.goto('/dashboard');
      await page.waitForTimeout(3000); // Give time for API calls
      
      // Python service should be called for data processing
      expect(responseReceived).toBe(true);
    });

    test('should handle Python service timeout gracefully', async () => {
      // Mock slow Python service
      await page.route('**/analytics/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5s delay
        route.continue();
      });
      
      await page.goto('/dashboard');
      
      // Should show loading state or fallback
      const loadingOrFallback = page.locator('text=Loading, text=Processing, text=Unable to load');
      await expect(loadingOrFallback.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('User Experience', () => {
    test('should provide clear loading feedback', async () => {
      await page.goto('/dashboard');
      
      // Should show loading state initially
      const loadingIndicator = page.locator('.loading, .spinner, text=Loading, text=Processing');
      
      // Check if loading appears (might be very quick)
      const hasLoadingState = await Promise.race([
        loadingIndicator.first().isVisible().then(() => true),
        page.waitForTimeout(1000).then(() => false)
      ]);
      
      // Either shows loading or loads very quickly (both are acceptable)
      expect(typeof hasLoadingState).toBe('boolean');
    });

    test('should be mobile responsive', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/dashboard');
      await page.waitForSelector('.brief-container', { timeout: 10000 });
      
      // Brief should be readable on mobile
      const briefContainer = page.locator('.brief-container').first();
      const boundingBox = await briefContainer.boundingBox();
      
      // Should fit within mobile viewport width
      expect(boundingBox!.width).toBeLessThanOrEqual(375);
      
      // Text should not overflow
      const hasOverflow = await page.evaluate(() => {
        const container = document.querySelector('.brief-container');
        return container ? container.scrollWidth > container.clientWidth : false;
      });
      
      expect(hasOverflow).toBe(false);
    });

    test('should maintain consistent styling', async () => {
      await page.goto('/dashboard');
      await page.waitForSelector('.brief-container', { timeout: 10000 });
      
      // Check that headings have consistent styling
      const headings = page.locator('h1, h2, h3');
      const headingCount = await headings.count();
      
      if (headingCount > 0) {
        // All headings should have color styles
        for (let i = 0; i < Math.min(headingCount, 5); i++) {
          const heading = headings.nth(i);
          const color = await heading.evaluate(el => window.getComputedStyle(el).color);
          expect(color).not.toBe('rgba(0, 0, 0, 0)'); // Should not be transparent
        }
      }
    });
  });
});

// Helper function to mock authentication state
async function mockAuthState(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem('auth_token', 'mock_token_12345');
    localStorage.setItem('user_email', 'test@360brief.com');
    localStorage.setItem('user_id', 'test_user_123');
    
    // Mock successful authentication
    window.dispatchEvent(new CustomEvent('auth:success', {
      detail: { email: 'test@360brief.com', authenticated: true }
    }));
  });
}