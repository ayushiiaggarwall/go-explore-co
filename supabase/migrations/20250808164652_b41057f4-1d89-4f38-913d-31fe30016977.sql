-- Configure Supabase auth settings to use custom verification email
-- This sets up the webhook URL for custom email verification

-- Note: The actual webhook configuration needs to be done through the Supabase dashboard
-- This migration creates any necessary supporting infrastructure

-- Create a function to handle auth events if needed
CREATE OR REPLACE FUNCTION public.handle_auth_user_new()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the new user registration
  RAISE LOG 'New user registered: %', NEW.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to log new user registrations
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_new();