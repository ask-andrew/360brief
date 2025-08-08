-- Create essential tables in public schema
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY,
  digest_frequency TEXT NOT NULL DEFAULT 'daily' CHECK (digest_frequency IN ('hourly', 'daily', 'weekly')),
  digest_time TIME NOT NULL DEFAULT '09:00:00',
  digest_timezone TEXT NOT NULL DEFAULT 'UTC',
  theme_preference TEXT DEFAULT 'system' CHECK (theme_preference IN ('light', 'dark', 'system')),
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.digests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'failed')),
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.digest_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  digest_id UUID NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('email', 'calendar', 'task', 'note')),
  source_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  metadata JSONB,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(digest_id, source_type, source_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_digests_user_id ON public.digests(user_id);
CREATE INDEX IF NOT EXISTS idx_digest_items_digest_id ON public.digest_items(digest_id);
CREATE INDEX IF NOT EXISTS idx_digests_status_scheduled_for ON public.digests(status, scheduled_for);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digest_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS policies for user_preferences
CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences FOR ALL
  USING (auth.uid() = id);

-- RLS policies for digests
CREATE POLICY "Users can view their own digests"
  ON public.digests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own digests"
  ON public.digests FOR ALL
  USING (auth.uid() = user_id);

-- RLS policies for digest_items
CREATE POLICY "Users can view their own digest items"
  ON public.digest_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.digests d 
    WHERE d.id = digest_id AND d.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their own digest items"
  ON public.digest_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.digests d 
    WHERE d.id = digest_id AND d.user_id = auth.uid()
  ));