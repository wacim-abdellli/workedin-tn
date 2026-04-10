# WorkedIn Email Templates for Supabase

## How to Use:
1. Go to Supabase Dashboard → Authentication → Email Templates
2. Select "Confirm signup" template
3. Copy the HTML below and paste it into the "Body" field
4. Update the Subject to: "Confirm Your WorkedIn Account"

---

## HTML Template (Copy this into Supabase):

```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your user:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your mail</a></p>
```

---

## Styled Template (Better Version):

If Supabase supports full HTML emails, use this styled version:

```html
<div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; background-color: #111111; border: 1px solid #222222; border-radius: 16px; overflow: hidden;">
    <div style="padding: 40px; text-align: center;">
        <div style="display: inline-block; background-color: #E8820C; width: 48px; height: 48px; border-radius: 10px; margin-bottom: 20px; line-height: 48px; color: #ffffff; font-size: 24px; font-weight: 900;">Wi</div>
        <h1 style="color: #ffffff; font-size: 28px; font-weight: 800; margin: 0 0 16px 0;">Confirm Your Account</h1>
        <p style="color: #888888; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">Welcome to WorkedIn! Click the button below to confirm your email address and activate your account.</p>
        <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #E8820C; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 800;">Confirm Your Email →</a>
        <p style="color: #666666; font-size: 13px; margin: 24px 0 8px 0;">Or copy this link:</p>
        <p style="color: #888888; font-size: 12px; background-color: #161616; padding: 12px; border-radius: 8px; word-break: break-all;">{{ .ConfirmationURL }}</p>
    </div>
    <div style="padding: 24px 40px; border-top: 1px solid #222222;">
        <p style="color: #555555; font-size: 12px; margin: 0;">If you didn't create a WorkedIn account, you can safely ignore this email.</p>
    </div>
</div>
```

---

## Subject Line:
```
Confirm Your WorkedIn Account
```

---

## Available Variables:
- `{{ .ConfirmationURL }}` - The confirmation link
- `{{ .Token }}` - The confirmation token
- `{{ .TokenHash }}` - The token hash
- `{{ .SiteURL }}` - Your site URL
- `{{ .Email }}` - User's email address

---

## Other Templates to Update:

### Invite User
Subject: `You've been invited to WorkedIn`

### Magic Link
Subject: `Your WorkedIn Sign-in Link`

### Password Reset
Subject: `Reset Your WorkedIn Password`

### Email Change
Subject: `Confirm Your New Email Address`
