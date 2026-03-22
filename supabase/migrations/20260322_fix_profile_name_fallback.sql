-- ============================================
-- FIX: Profile name fallback based on user language
-- Date: 2026-03-22
-- Purpose: Use language-appropriate default name instead of hardcoded Arabic
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, full_name, phone, preferred_language)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            CASE COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'ar')
                WHEN 'fr' THEN 'Nouvel utilisateur'
                WHEN 'en' THEN 'New User'
                ELSE 'مستخدم جديد'
            END
        ),
        NEW.phone,
        COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'ar')::language_enum
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
