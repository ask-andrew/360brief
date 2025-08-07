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

-- Create new policies with proper UUID casting
CREATE POLICY "Users can view their own preferences" 
ON public.user_preferences
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own preferences" 
ON public.user_preferences
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own preferences" 
ON public.user_preferences
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own preferences" 
ON public.user_preferences
FOR DELETE 
USING (auth.uid()::text = user_id::text);

-- Update migration record
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES ('20240805160200', 'fix_rls_policies_uuid', ARRAY['Fixed RLS policies with proper UUID casting for user_preferences table'])
ON CONFLICT (version) DO NOTHING;
