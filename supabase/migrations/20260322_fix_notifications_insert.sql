-- ============================================
-- FIX: Add INSERT policy for notifications
-- Date: 2026-03-22
-- Purpose: Allow authenticated users to create notifications
-- ============================================

-- Add INSERT policy (required for createNotification() to work)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Authenticated users can create notifications'
    ) THEN
        CREATE POLICY "Authenticated users can create notifications" ON notifications
            FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    END IF;
END $$;
