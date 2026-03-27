-- Check if is_admin() function has SECURITY DEFINER
SELECT 
    proname as function_name,
    prosecdef as is_security_definer,
    provolatile as volatility
FROM pg_proc 
WHERE proname = 'is_admin';

-- Check the actual function definition
SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'is_admin';

-- Check RLS policies on profiles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_clause,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
