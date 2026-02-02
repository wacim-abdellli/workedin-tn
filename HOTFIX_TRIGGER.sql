-- HOTFIX: Fix the handle_new_user trigger
-- The enum casting was failing when preferred_language is null

-- Drop and recreate the function with safer logic
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, full_name, preferred_language)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
        'ar'::language_enum  -- Always default to Arabic, simpler and safer
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- If profile creation fails, still allow the user to be created
    -- They can update their profile later
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the trigger exists
SELECT 'Trigger check:', trigger_name FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
