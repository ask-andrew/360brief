export interface CompanyData {
  name?: string;
  domain?: string;
  industry?: string;
  size?: string;
  employees_range?: string;
  tech_stack?: string[];
  logo?: string;
  website?: string;
  description?: string;
  twitter?: string;
  linkedin?: string;
  phone_numbers?: string[];
  last_updated?: string;
}

export interface UserContext {
  name?: string;
  email?: string;
  company?: CompanyData;
}

export interface BriefContext {
  user: UserContext;
}
