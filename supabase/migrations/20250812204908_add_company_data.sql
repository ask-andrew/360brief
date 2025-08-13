-- Add company_data JSONB column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company_data JSONB DEFAULT '{}'::jsonb;

-- Create GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_profiles_company_data 
ON public.profiles USING GIN (company_data);

-- Add RLS policy for company data access
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own company data"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own company data"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
