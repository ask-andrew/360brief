-- Add subscription tier to profiles table
ALTER TABLE public.profiles
ADD COLUMN subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'enterprise'));

-- Create index for subscription queries
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);

-- Update existing users to have 'free' tier (default already handles this)
UPDATE public.profiles SET subscription_tier = 'free' WHERE subscription_tier IS NULL;