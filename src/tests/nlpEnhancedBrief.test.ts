import { test, expect } from '@playwright/test';
import { nlpEnhancedEmailData } from '@/mocks/nlpEnhancedEmailData';
import { generateStyledBrief } from '@/server/briefs/generateBrief';

test.describe('NLP Enhanced Brief Generation', () => {
  test('should generate a mission brief with NLP insights', () => {
    const briefData = generateStyledBrief(nlpEnhancedEmailData, 'mission_brief');
    
    // Validate overall brief structure
    expect(briefData).toBeDefined();
    expect(briefData.style).toBe('mission_brief');
    
    // Validate NLP-specific insights
    const communicationInsights = briefData.missionBrief.communicationInsights;
    expect(communicationInsights).toBeDefined();
    
    // Check email volume and action items
    expect(communicationInsights.totalEmails).toBe(2);
    expect(communicationInsights.volumeTrend).toBeDefined();
    
    // Verify NLP-enhanced context
    const keyTopics = communicationInsights.keyTopics;
    expect(keyTopics).toContain('meetings');
    expect(keyTopics).toContain('projects');
    
    // Validate urgency and priority
    const immediateActions = briefData.missionBrief.immediateActions;
    expect(immediateActions.length).toBeGreaterThan(0);
    expect(immediateActions[0].priority).toBeDefined();
  });

  test('should handle different brief styles with NLP insights', () => {
    const startupBrief = generateStyledBrief(nlpEnhancedEmailData, 'startup_velocity');
    const consultingBrief = generateStyledBrief(nlpEnhancedEmailData, 'management_consulting');
    
    expect(startupBrief.style).toBe('startup_velocity');
    expect(consultingBrief.style).toBe('management_consulting');
  });
});