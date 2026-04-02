-- Add Admin FULL access to freelancer_profiles and notifications
-- This is required because the revoke verification mutation updates freelancer_profiles 
-- and inserts a notification to inform the user.

DROP POLICY IF EXISTS "admin_all_freelancer_profiles" ON public.freelancer_profiles;
CREATE POLICY "admin_all_freelancer_profiles" ON public.freelancer_profiles FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_all_notifications" ON public.notifications;
CREATE POLICY "admin_all_notifications" ON public.notifications FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
