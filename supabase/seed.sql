-- ============================================
-- Database Seed File — Khedma TN Development Data
-- Date: 2026-03-22
-- Usage: supabase db seed (or run manually in SQL editor)
-- ============================================

-- 1. SKILLS (predefined catalog)
INSERT INTO skills (id, name_ar, name_fr, name_en) VALUES
    ('graphic-design', 'تصميم جرافيكي', 'Design Graphique', 'Graphic Design'),
    ('web-dev', 'برمجة مواقع', 'Développement Web', 'Web Development'),
    ('mobile-dev', 'برمجة تطبيقات', 'Développement Mobile', 'Mobile Development'),
    ('ui-ux', 'تصميم واجهات', 'Design UI/UX', 'UI/UX Design'),
    ('translation', 'ترجمة', 'Traduction', 'Translation'),
    ('content-writing', 'كتابة محتوى', 'Rédaction', 'Content Writing'),
    ('video-editing', 'مونتاج فيديو', 'Montage Vidéo', 'Video Editing'),
    ('photography', 'تصوير', 'Photographie', 'Photography'),
    ('digital-marketing', 'تسويق رقمي', 'Marketing Digital', 'Digital Marketing'),
    ('seo', 'تحسين محركات البحث', 'Référencement SEO', 'SEO'),
    ('data-entry', 'إدخال بيانات', 'Saisie de Données', 'Data Entry'),
    ('social-media', 'إدارة مواقع التواصل', 'Gestion Réseaux Sociaux', 'Social Media Management'),
    ('accounting', 'محاسبة', 'Comptabilité', 'Accounting'),
    ('3d-modeling', 'نمذجة ثلاثية الأبعاد', 'Modélisation 3D', '3D Modeling'),
    ('voice-over', 'تعليق صوتي', 'Voix Off', 'Voice Over')
ON CONFLICT (id) DO NOTHING;

-- 2. CATEGORIES (if you have a categories table)
-- Otherwise these are just used as strings in the jobs table

-- 3. TEST USERS (for development only — remove before production)
-- Note: These must be created through Supabase Auth first, then profiles are auto-created
-- via the handle_new_user() trigger. This seed only provides profile data for existing auth users.

-- Example: If you've created test auth users, update their profiles:
-- UPDATE profiles SET full_name = 'أحمد المطور', user_type = 'freelancer', location = 'تونس العاصمة' WHERE id = '<auth-user-uuid>';
