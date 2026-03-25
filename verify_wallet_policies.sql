-- Query to verify wallet RLS policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'wallets' 
ORDER BY policyname;
