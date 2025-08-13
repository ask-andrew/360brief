import { createClient } from '@/lib/supabase/server';
import { getCompanyInfo } from './domain_intelligence_new';
import { CompanyData } from '@/types/company';

// Types are now imported from @/types/company

export async function updateUserCompanyData(userId: string, email: string): Promise<CompanyData | null> {
  try {
    const supabase = await createClient();
    
    // Extract domain from email
    const domain = email.split('@')[1];
    if (!domain) {
      console.warn('Invalid email format, cannot extract domain');
      return null;
    }

    // Get company info from domain
    const companyInfo = await getCompanyInfo(email);
    
    // Prepare company data
    const companyData: CompanyData = {
      name: companyInfo.name,
      domain: domain,
      industry: companyInfo.industry,
      employees_range: companyInfo.employees_range,
      tech_stack: companyInfo.tech_stack || [],
      logo: companyInfo.logo,
      website: companyInfo.website,
      description: companyInfo.description,
      twitter: companyInfo.twitter,
      linkedin: companyInfo.linkedin,
      phone_numbers: companyInfo.phone_numbers || [],
      last_updated: new Date().toISOString()
    };

    // Update user profile with company data
    const { data, error } = await supabase
      .from('profiles')
      .update({ company_data: companyData })
      .eq('id', userId)
      .select('company_data')
      .single();

    if (error) throw error;
    return data?.company_data as CompanyData;
    
  } catch (error) {
    console.error('Error updating company data:', error);
    return null;
  }
}

export async function getUserCompanyData(userId: string): Promise<CompanyData | null> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('company_data')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data?.company_data as CompanyData || null;
    
  } catch (error) {
    console.error('Error fetching company data:', error);
    return null;
  }
}
