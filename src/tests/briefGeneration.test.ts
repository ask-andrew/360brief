// Test file to demonstrate enhanced brief generation
import { generateBrief, generateStyledBrief } from '@/server/briefs/generateBrief';
import { crisisScenario, normalOperationsScenario, highActivityScenario } from '@/mocks/data/testScenarios';

// Crisis scenario tests
console.log('=== CRISIS SCENARIO ===');

console.log('\n--- Mission Brief Style ---');
const crisisMissionBrief = generateStyledBrief(crisisScenario, 'mission_brief');
console.log(JSON.stringify(crisisMissionBrief, null, 2));

console.log('\n--- Startup Velocity Style ---');
const crisisStartupBrief = generateStyledBrief(crisisScenario, 'startup_velocity');
console.log(JSON.stringify(crisisStartupBrief, null, 2));

// Normal operations scenario
console.log('\n\n=== NORMAL OPERATIONS SCENARIO ===');

console.log('\n--- Newsletter Style ---');
const normalNewsletterBrief = generateStyledBrief(normalOperationsScenario, 'newsletter');
console.log(JSON.stringify(normalNewsletterBrief, null, 2));

console.log('\n--- Management Consulting Style ---');
const normalConsultingBrief = generateStyledBrief(normalOperationsScenario, 'management_consulting');
console.log(JSON.stringify(normalConsultingBrief, null, 2));

// High activity scenario
console.log('\n\n=== HIGH ACTIVITY SCENARIO ===');

console.log('\n--- Startup Velocity Style ---');
const activityStartupBrief = generateStyledBrief(highActivityScenario, 'startup_velocity');
console.log(JSON.stringify(activityStartupBrief, null, 2));

// Base brief generation (for comparison)
console.log('\n\n=== BASE BRIEF (Crisis) ===');
const baseBrief = generateBrief(crisisScenario);
console.log(JSON.stringify(baseBrief, null, 2));