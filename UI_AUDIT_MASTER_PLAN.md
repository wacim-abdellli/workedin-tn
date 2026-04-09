# UI Audit Master Remediation Plan
**Date**: 2026-04-09  
**Orchestrator**: Kiro (Chief Technical Auditor)  
**Sources**: 4 independent UI audits (strict visual, implementation, French report, live production)

---

## Executive Summary

Four independent audits identified **10 critical UI issues** that must be fixed before launch. The issues fall into three categories:

1. **Trust Breakers** - Encoding bugs, hidden features, test data leaks
2. **Design System Violations** - Hardcoded colors, token misuse
3. **Polish Issues** - Accessibility, UX refinements

All audits agree: the foundation is solid, but visible polish is not launch-ready.

---

## Critical Issues (Fix Before Launch)

### 🔴 ISSUE 1: Arabic Encoding Corruption (Mojibake)

**Severity**: CRITICAL  
**Pages Affected**: `/how-it-works`, `/for-clients`, `/find-freelancers`, page titles  
**Evidence**: Live screenshots show `â€"` and garbled Arabic characters  
**Root Cause**: `src/i18n/ar.ts` encoding corruption during recent edit

**Fix**:
```bash
# Revert the corrupted file
git checkout HEAD~1 src/i18n/ar.ts

# Verify encoding is UTF-8
file src/i18n/ar.ts  # Should show "UTF-8 Unicode text"
```

**Verification**:
- Visit `/?lang=ar` and check hero text on marketing pages
- Inspect browser tab titles for clean Arabic
- No `â€"` or mojibake characters visible

---

### 🔴 ISSUE 2: Hidden Homepage Payment Banner

**Severity**: CRITICAL  
**Component**: `src/components/common/ComingSoonBanner.tsx` + `src/pages/Home.tsx`  
**Problem**: Banner exists in DOM but is invisible due to z-index collision with fixed Header

**Current State**:
```tsx
// Home.tsx - Banner renders BEHIND fixed header
<div className="page-shell">
  <ComingSoonBanner />  {/* ← Invisible */}
  <Header />            {/* ← Fixed z-50, covers banner */}
```

**Fix Option A (Recommended)**: Move banner into Header component
```tsx
// src/components/layout/Header/index.tsx
<header className="fixed top-0 left-0 right-0 z-50">
  <ComingSoonBanner />  {/* ← Now visible, flows with header */}
  {/* existing header content */}
</header>
```

**Fix Option B**: Make banner fixed with higher z-index
```tsx
// src/components/common/ComingSoonBanner.tsx
<div className="fixed top-0 left-0 right-0 z-[60] ...">
  {/* banner content */}
</div>

// Then add padding to Header
<header className="fixed top-[40px] ...">  {/* Push down by banner height */}
```

**Verification**:
- Visit `/` - banner should be visible at top
- Scroll down - banner should either scroll away or stay fixed
- Dismiss button should work and persist via localStorage

---

### 🔴 ISSUE 3: Test Data Visible on Production Jobs Board

**Severity**: CRITICAL  
**Page**: `/jobs`  
**Problem**: Internal smoke-test jobs like "Live Upload Smoke..." visible to public users

**Fix**:
```sql
-- Option A: Delete test jobs
DELETE FROM jobs 
WHERE title LIKE '%smoke%' 
   OR title LIKE '%test%' 
   OR description LIKE '%test%';

-- Option B: Add is_test flag and filter
ALTER TABLE jobs ADD COLUMN is_test BOOLEAN DEFAULT FALSE;
UPDATE jobs SET is_test = TRUE WHERE title LIKE '%smoke%' OR title LIKE '%test%';

-- Then update query in src/pages/Jobs.tsx
const { data } = await supabase
  .from('jobs')
  .select('*')
  .eq('is_test', false)  // ← Filter out test data
  .order('created_at', { ascending: false });
```

**Verification**:
- Visit `/jobs` as logged-out user
- No test/smoke/internal jobs visible
- Only real production jobs shown

---

### 🔴 ISSUE 4: Brand Inconsistency (Khedma TN vs Khedmetna)

**Severity**: HIGH  
**Problem**: Public site shows "Khedmetna", authenticated header shows "Khedma TN"

**Fix**: Standardize to "Khedmetna" everywhere
```tsx
// src/components/layout/Header/index.tsx
// Find and replace "Khedma TN" with "Khedmetna"

// Also check:
// - src/components/layout/Footer.tsx
// - src/pages/Home.tsx (hero section)
// - public/index.html <title> tag
// - package.json "name" field
```

**Verification**:
- Check public homepage logo/text
- Log in and check authenticated header
- Both should say exactly "Khedmetna"

---

## Design System Violations (High Priority)

### 🟡 ISSUE 5: MobileNav.tsx Conflicting Dark Mode Classes

**Severity**: HIGH  
**File**: `src/components/layout/MobileNav.tsx`  
**Problem**: Multiple contradictory Tailwind classes break dark mode

**Current (Broken)**:
```tsx
// L255 - THREE different dark backgrounds!
className="bg-white dark:bg-gray-800 dark:bg-gray-900 p-2 dark:bg-[var(--color-bg-muted)]"

// L278 - FOUR conflicting backgrounds!
className="hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-white dark:bg-gray-800 dark:bg-gray-900/5"
```

**Fix**: Use design tokens only
```tsx
// Replace all hardcoded colors with tokens
<div 
  className="p-2 rounded-lg"
  style={{ 
    background: 'var(--color-background-elevated)',
    borderColor: 'var(--color-border-subtle)'
  }}
>

// For text
<span style={{ color: 'var(--color-text-primary)' }}>

// For hover states
<button 
  className="transition-colors"
  style={{ 
    background: 'var(--color-background-elevated)',
  }}
  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-background-hover)'}
  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-background-elevated)'}
>
```

**Verification**:
- Toggle dark mode on mobile
- No visual glitches or undefined backgrounds
- All text remains readable

---

### 🟡 ISSUE 6: Wallet.tsx Hardcoded Colors (36+ violations)

**Severity**: HIGH  
**File**: `src/pages/Wallet.tsx`  
**Problem**: Ignores design tokens, uses hardcoded Tailwind colors

**Examples**:
```tsx
// L203 - WRONG
className="bg-white dark:bg-gray-800 text-purple-600 ..."

// L210 - WRONG
className="bg-white dark:bg-gray-800/20 hover:bg-white ..."

// L365 - WRONG
className="bg-card border border-border rounded-lg hover:bg-gray-50 dark:bg-gray-900 ..."
```

**Fix Strategy**:
1. Replace `bg-white` → `bg-[var(--color-background-elevated)]`
2. Replace `dark:bg-gray-800` → remove (token handles it)
3. Replace `text-purple-600` → `text-[var(--workspace-primary)]`
4. Replace `bg-green-600` → `bg-[var(--color-success)]`
5. Replace `text-red-600` → `text-[var(--color-error)]`

**Verification**:
- Visit `/wallet` in light mode
- Visit `/wallet` in dark mode
- All buttons visible with proper contrast
- Colors match global theme

---

### 🟡 ISSUE 7: PaymentMethodSelector.tsx Hardcoded Colors

**Severity**: HIGH  
**File**: `src/components/payment/PaymentMethodSelector.tsx`  
**Problem**: Modal doesn't respect design tokens

**Fix**: Same strategy as Wallet.tsx
```tsx
// Replace hardcoded colors with tokens
style={{ 
  background: 'var(--color-background-elevated)',
  color: 'var(--color-text-primary)',
  borderColor: 'var(--color-border-default)'
}}
```

---

### 🟡 ISSUE 8: Authenticated Header Overcrowding

**Severity**: MEDIUM  
**File**: `src/components/layout/Header/index.tsx` (1300+ lines!)  
**Problem**: Search, language, theme, notifications, workspace, user menu all crammed

**Fix**: Refactor into sub-components
```
src/components/layout/Header/
  ├── index.tsx (main orchestrator, <200 lines)
  ├── SearchBar.tsx
  ├── LanguageSwitcher.tsx
  ├── ThemeToggle.tsx
  ├── NotificationBell.tsx
  ├── WorkspaceSwitcher.tsx
  └── UserMenu.tsx
```

**Benefits**:
- Easier to maintain
- Better performance (smaller re-renders)
- Cleaner visual spacing

---

## Polish Issues (Medium Priority)

### 🟢 ISSUE 9: Messages Avatar Fallback

**File**: `src/pages/Messages.tsx`  
**Fix**: Add `onError` handler for broken avatars
```tsx
<img 
  src={avatar} 
  alt={name}
  onError={(e) => {
    e.currentTarget.style.display = 'none';
    // Show fallback initial
  }}
/>
```

---

### 🟢 ISSUE 10: Login/Signup Autofill Hygiene

**Files**: `src/pages/Login.tsx`, `src/pages/Signup.tsx`  
**Fix**: Add autocomplete attributes
```tsx
<input
  type="email"
  autoComplete="email"
  className="..."
/>
<input
  type="password"
  autoComplete="current-password"  // or "new-password" for signup
  className="..."
/>
```

---

## Execution Order

### Phase 1: Trust Breakers (Deploy Blocker)
**Timeline**: Immediate (today)

1. ✅ Fix Arabic encoding (git revert + verify)
2. ✅ Fix hidden banner (move to Header or fix z-index)
3. ✅ Remove test jobs from production
4. ✅ Standardize brand name

### Phase 2: Design System (This Sprint)
**Timeline**: 2-3 days

5. ✅ Fix MobileNav dark mode conflicts
6. ✅ Refactor Wallet.tsx to use tokens
7. ✅ Refactor PaymentMethodSelector to use tokens
8. ✅ Refactor Header into sub-components

### Phase 3: Polish (Next Sprint)
**Timeline**: 1 week

9. ✅ Add avatar fallbacks
10. ✅ Fix autofill attributes

---

## Verification Checklist

After Phase 1 fixes:

```bash
# Build check
npm run build

# Type check
npm run type-check

# Visual regression
npm run dev
# Then manually test:
# - / (banner visible)
# - /?lang=ar (no mojibake)
# - /jobs (no test data)
# - /wallet (buttons visible in light mode)
```

---

## Agent Task Assignments

While waiting for Dhmad response, we can parallelize UI fixes:

### Agent UI-1: Arabic Encoding Fix
**Model**: Gemini 3.1 Pro (fast, simple)  
**Task**: Revert `ar.ts` and verify encoding
**Time**: 5 minutes

### Agent UI-2: Banner Z-Index Fix
**Model**: Claude Sonnet 4.5 (layout complexity)  
**Task**: Move `ComingSoonBanner` into Header component
**Time**: 15 minutes

### Agent UI-3: MobileNav Token Refactor
**Model**: Claude Sonnet 4.5 (complex refactor)  
**Task**: Replace all hardcoded colors with design tokens
**Time**: 30 minutes

### Agent UI-4: Wallet Token Refactor
**Model**: Claude Sonnet 4.5 (large file)  
**Task**: Replace 36+ hardcoded colors with tokens
**Time**: 45 minutes

---

## Success Criteria

- ✅ No mojibake on any page in any language
- ✅ Banner visible on homepage
- ✅ No test data on public pages
- ✅ Consistent branding everywhere
- ✅ Dark mode works perfectly on all components
- ✅ All colors use design tokens (no hardcoded Tailwind grays)

---

**Last Updated**: 2026-04-09  
**Status**: Ready to execute Phase 1  
**Blocked By**: Dhmad response (for payment integration)  
**Can Proceed**: All UI fixes are independent of payment backend
