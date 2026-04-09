# Fix OAuth Redirect Issue

## Problem
When logging in from `workedin-tn.vercel.app`, you get redirected to `localhost` instead of staying on the production site.

## Solution
Update Supabase redirect URLs to include your production domain.

---

## Steps:

### 1. Go to Supabase Auth Settings
https://supabase.com/dashboard/project/wvgkezmboewtlpnyjnyd/auth/url-configuration

### 2. Update Site URL
Change **Site URL** to:
```
https://workedin-tn.vercel.app
```

### 3. Add Redirect URLs
In the **Redirect URLs** section, add these (one per line):
```
https://workedin-tn.vercel.app/**
http://localhost:5173/**
```

The `**` wildcard allows all paths under that domain.

### 4. Save Changes
Click **Save** at the bottom of the page.

---

## Test It
1. Go to: https://workedin-tn.vercel.app/login
2. Click "Continue with Google"
3. After authentication, you should stay on `workedin-tn.vercel.app`

---

## Why This Happens
Supabase OAuth redirects users back to the URL configured in your project settings. If only `localhost` is configured, it will always redirect there, even when logging in from production.

By adding your production URL, Supabase will redirect users back to the same domain they came from.

---

**Estimated Time**: 2 minutes
