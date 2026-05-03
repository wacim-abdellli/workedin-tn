# Testing Loading Styles by User Type

## Quick Test Guide

### Test 1: Freelancer Loading Page
1. Open browser DevTools Console
2. Set freelancer mode in localStorage:
   ```javascript
   localStorage.setItem('profile', JSON.stringify({ active_mode: 'freelancer' }));
   ```
3. Navigate to any page that shows a loading state
4. **Expected**: Purple theme (#9333ea)
   - Purple logo
   - Purple spinner/progress bar
   - Purple accent lines

### Test 2: Client Loading Page
1. Open browser DevTools Console
2. Set client mode in localStorage:
   ```javascript
   localStorage.setItem('profile', JSON.stringify({ active_mode: 'client' }));
   ```
3. Navigate to any page that shows a loading state
4. **Expected**: Gold/Amber theme (#d97706)
   - Gold logo
   - Gold spinner/progress bar
   - Gold accent lines

### Test 3: Error Boundary (Freelancer)
1. Set freelancer mode (see Test 1)
2. Navigate to `/freelancer/dashboard`
3. Trigger an error (or use React DevTools to throw an error)
4. **Expected**: 
   - Purple logo in error page
   - Purple outline button
   - Purple solid button

### Test 4: Error Boundary (Client)
1. Set client mode (see Test 2)
2. Navigate to `/client/dashboard`
3. Trigger an error
4. **Expected**:
   - Gold logo in error page
   - Gold outline button
   - Gold solid button

### Test 5: Workspace Switching
1. Log in as a user with both freelancer and client profiles
2. Switch between workspaces using the workspace switcher
3. **Expected**: 
   - Switching loader shows correct color for target workspace
   - All subsequent loading states match the new workspace

### Test 6: OAuth Callback
1. Sign out
2. Set workspace preference in localStorage (see Test 1 or 2)
3. Sign in with Google/OAuth provider
4. **Expected**: 
   - Callback loading page matches your stored workspace preference

## Visual Checklist

### Freelancer Theme (Purple)
- [ ] Logo is purple variant
- [ ] Spinner/loader is purple (#9333ea)
- [ ] Progress bar is purple gradient
- [ ] Accent lines are purple
- [ ] Buttons use purple colors
- [ ] Glow effects are purple

### Client Theme (Gold)
- [ ] Logo is gold/amber variant
- [ ] Spinner/loader is gold (#d97706)
- [ ] Progress bar is gold gradient
- [ ] Accent lines are gold
- [ ] Buttons use gold colors
- [ ] Glow effects are gold

## Pages to Test

1. **FullScreenLoader** - Used in:
   - Route transitions
   - Initial app load
   - Workspace switching

2. **ErrorBoundary** - Triggered by:
   - JavaScript errors
   - Component crashes
   - Network failures

3. **Inline Loaders** - Found in:
   - Wallet page (transactions, withdrawals)
   - Client jobs page
   - Job proposals page
   - Admin dashboard
   - Profile modals

4. **AuthCallback** - Accessed via:
   - OAuth sign-in flow
   - Email confirmation links
   - Password recovery links

## Browser Testing

Test in multiple browsers to ensure CSS variables work correctly:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

## Dark Mode Testing

All loading states should work in both light and dark mode:
- [ ] Light mode + Freelancer theme
- [ ] Light mode + Client theme
- [ ] Dark mode + Freelancer theme
- [ ] Dark mode + Client theme

Toggle dark mode and verify colors remain consistent with the workspace theme.
