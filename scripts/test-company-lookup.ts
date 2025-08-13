import { getCompanyInfo } from '../src/services/domain_intelligence_new';

async function testCompanyLookup() {
  // Test with a known company email
  const testEmails = [
    'test@google.com',
    'test@microsoft.com',
    'test@airbnb.com'
  ];

  for (const email of testEmails) {
    try {
      console.log(`\nLooking up company for: ${email}`);
      const companyInfo = await getCompanyInfo(email);
      
      console.log('Company Info:');
      console.log('------------');
      console.log(`Name: ${companyInfo.name || 'N/A'}`);
      console.log(`Domain: ${companyInfo.domain}`);
      console.log(`Industry: ${companyInfo.industry || 'N/A'}`);
      console.log(`Size: ${companyInfo.employees_range || 'N/A'}`);
      console.log(`Website: ${companyInfo.website || 'N/A'}`);
      
      if (companyInfo.tech_stack?.length) {
        console.log(`Tech Stack: ${companyInfo.tech_stack.join(', ')}`);
      }
      
    } catch (error) {
      console.error(`Error looking up ${email}:`, error);
    }
  }
}

// Run the test
testCompanyLookup().catch(console.error);
