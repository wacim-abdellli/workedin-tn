# Diagnostic Commands

## Run these in your browser console (F12 → Console tab)

### 1. Check current session and user data
```javascript
const { data: { session } } = await window.supabase.auth.getSession();
console.log('User ID:', session?.user?.id);
console.log('Email:', session?.user?.email);
console.log('User metadata:', session?.user?.user_metadata);
console.log('App metadata:', session?.user?.app_metadata);
```

### 2. Check if you can query profiles
```javascript
const { data, error } = await window.supabase
    .from('profiles')
    .select('id,email,is_admin')
    .limit(5);
    
console.log('Profiles data:', data);
console.log('Profiles error:', error);
```

### 3. Check your own profile
```javascript
const { data: { user } } = await window.supabase.auth.getUser();
const { data: profile, error } = await window.supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
console.log('Your profile:', profile);
console.log('Error:', error);
```

### 4. Force refresh session
```javascript
const { data, error } = await window.supabase.auth.refreshSession();
console.log('Refresh result:', data);
console.log('Refresh error:', error);
location.reload();
```

## What to look for:

- If you see `error: { code: "PGRST301", message: "..." }` → RLS is blocking
- If `is_admin` is `false` or `undefined` → Database not updated
- If you see `row level security policy` in error → RLS policies are active but blocking you

## Copy the output and send it to me!
