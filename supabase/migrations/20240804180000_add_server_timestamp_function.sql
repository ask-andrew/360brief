-- Create a simple function to test the database connection
CREATE OR REPLACE FUNCTION public.get_server_timestamp()
RETURNS TIMESTAMPTZ
LANGUAGE SQL
AS $$
  SELECT NOW();
$$;
