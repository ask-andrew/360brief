import { CompanyData } from '@/types/company';

// In-memory cache with TTL (24 hours)
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const companyCache = new Map<string, { data: CompanyData; timestamp: number }>();

/**
 * Get company information from email domain using Hunter.io API
 * @param email User's email address
 * @returns Company data or null if not found
 */
export async function getCompanyInfo(email: string): Promise<CompanyData> {
  const domain = email.split('@')[1];
  if (!domain) {
    throw new Error('Invalid email format');
  }

  // Check cache first
  const cached = companyCache.get(domain);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }

  try {
    const apiKey = process.env.HUNTER_API_KEY;
    if (!apiKey) {
      console.warn('HUNTER_API_KEY not configured, using minimal domain info');
      return { domain };
    }

    // Call Hunter.io API
    const response = await fetch(
      `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Hunter.io API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform response to our CompanyData format
    const companyInfo = data?.data || {};
    const companyData: CompanyData = {
      name: companyInfo.name,
      domain: domain,
      industry: companyInfo.industry,
      employees_range: companyInfo.employees_range,
      tech_stack: companyInfo.technologies?.map((t: any) => t.name) || [],
      logo: companyInfo.logo,
      website: companyInfo.website,
      description: companyInfo.description,
      twitter: companyInfo.twitter?.handle,
      linkedin: companyInfo.linkedin?.handle,
      phone_numbers: companyInfo.phone_numbers || [],
      last_updated: new Date().toISOString()
    };

    // Cache the result
    companyCache.set(domain, {
      data: companyData,
      timestamp: Date.now()
    });

    return companyData;

  } catch (error) {
    console.error('Error fetching company info:', error);
    // Return minimal domain info if API fails
    return { domain };
  }
}

/**
 * Clear the company cache (useful for testing)
 */
export function clearCompanyCache(): void {
  companyCache.clear();
}
