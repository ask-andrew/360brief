-- Drop existing policies if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users can view their own preferences') THEN
    DROP POLICY "Users can view their own preferences" ON public.user_preferences;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users can insert their own preferences') THEN
    DROP POLICY "Users can insert their own preferences" ON public.user_preferences;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users can update their own preferences') THEN
    DROP POLICY "Users can update their own preferences" ON public.user_preferences;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users can delete their own preferences') THEN
    DROP POLICY "Users can delete their own preferences" ON public.user_preferences;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error dropping policies: %', SQLERRM;
END $$;

-- Create new policies
CREATE POLICY "Users can view their own preferences" 
ON public.user_preferences
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" 
ON public.user_preferences
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
ON public.user_preferences
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences" 
ON public.user_preferences
FOR DELETE 
USING (auth.uid() = user_id);

-- Update migration record
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES ('20240805160100', 'fix_rls_policies', ARRAY['Fixed RLS policies for user_preferences table'])
ON CONFLICT (version) DO NOTHING;
