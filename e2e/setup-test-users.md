# Setting Up Test Users

Before running the e2e tests, you need to create test users in your Supabase database.

## Option 1: Manual Setup (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Users
3. Click "Add user" and create:

### Freelancer Test User
- Email: `freelancer-test@khedma.tn`
- Password: `TestPassword123!`
- Confirm email: Yes

### Client Test User
- Email: `client-test@khedma.tn`
- Password: `TestPassword123!`
- Confirm email: Yes

4. After creating users, complete their profiles:
   - For freelancer: Set `user_type` to `'freelancer'` in the profiles table
   - For client: Set `user_type` to `'client'` in the profiles table

## Option 2: SQL Script

Run this SQL in your Supabase SQL Editor:

```sql
-- Note: You'll need to create these users through the Supabase Auth UI first
-- Then run this to set up their profiles

-- Insert freelancer profile
INSERT INTO profiles (id, user_type, full_name, is_available)
SELECT 
  id,
  'freelancer',
  'Test Freelancer',
  true
FROM auth.users
WHERE email = 'freelancer-test@khedma.tn'
ON CONFLICT (id) DO UPDATE
SET user_type = 'freelancer',
    full_name = 'Test Freelancer',
    is_available = true;

-- Insert client profile
INSERT INTO profiles (id, user_type, full_name)
SELECT 
  id,
  'client',
  'Test Client'
FROM auth.users
WHERE email = 'client-test@khedma.tn'
ON CONFLICT (id) DO UPDATE
SET user_type = 'client',
    full_name = 'Test Client';
```

## Option 3: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Create freelancer user
supabase auth signup --email freelancer-test@khedma.tn --password TestPassword123!

# Create client user
supabase auth signup --email client-test@khedma.tn --password TestPassword123!
```

## Verification

After setup, verify the users exist:

```sql
SELECT email, confirmed_at 
FROM auth.users 
WHERE email IN ('freelancer-test@khedma.tn', 'client-test@khedma.tn');
```

Both users should have `confirmed_at` set (not null).

## Troubleshooting

### Users not logging in
- Verify email is confirmed in Supabase Auth dashboard
- Check that profiles exist with correct `user_type`
- Ensure RLS policies allow the test users to access data

### Authentication state not persisting
- Clear the `e2e/.auth/` directory
- Re-run the setup: `npx playwright test e2e/auth.setup.ts`

### Tests failing with "user not found"
- Double-check the email addresses match exactly
- Verify the passwords are correct
- Check Supabase logs for authentication errors
