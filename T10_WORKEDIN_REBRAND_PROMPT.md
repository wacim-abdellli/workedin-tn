# 🤖 AGENT TASK: WorkedIn Rebrand — Full App Rename

**Project**: Khedmetna → WorkedIn  
**Stack**: React 18, TypeScript, Tailwind CSS, Vite  
**Date**: 2026-04-09

---

## YOUR SINGLE TASK

Rename the app from "Khedmetna" / "Khedma" to "WorkedIn" across the entire codebase.

**No logic changes. Text/string replacements only.**

---

## REPLACEMENT RULES

```
"Khedmetna"          → "WorkedIn"
"khedmetna"          → "workedin"
"Khedma"             → "WorkedIn"
"khedma"             → "workedin"
"khedma-tn"          → "workedin"
"Khedma TN"          → "WorkedIn"
"khedma tn"          → "workedin"
"خدمتنا"             → "WorkedIn"
"خدمة"               → "WorkedIn"  (only when used as brand name, NOT as the word "service")
```

**IMPORTANT**: Only replace when used as a BRAND NAME. Do NOT replace:
- Arabic words used as regular vocabulary (خدمة meaning "service" in sentences)
- Variable names that are part of logic (e.g., `khedmaService` function names — keep those)
- Database table names or Supabase references
- Git-related strings
- Comments that explain history

---

## FILES TO UPDATE (40 files total)

### HIGH PRIORITY — User-facing strings

**1. `src/i18n/en.ts`** (~39 occurrences)
- Replace all "Khedmetna" → "WorkedIn" in string values
- Replace all "khedmetna" → "workedin" in URLs/slugs within strings

**2. `src/i18n/fr.ts`** (~39 occurrences)
- Same as en.ts — replace all brand name occurrences

**3. `src/i18n/ar.ts`** (~4 occurrences)
- Replace "Khedmetna" / "khedmetna" → "WorkedIn"
- Keep Arabic vocabulary words as-is

**4. `src/components/common/SEO.tsx`** (~37 occurrences)
- Replace all brand name occurrences in meta titles, descriptions, OG tags
- Replace "khedma-tn.vercel.app" → "workedin.com" (or keep as placeholder)

**5. `src/components/ui/Logo.tsx`** (~5 occurrences)
- Replace brand name in logo text/alt attributes

**6. `index.html`** (~4 occurrences)
- Line 18: keywords meta tag
- Line 19: og:title
- Line 30: apple-mobile-web-app-title
- Any other brand references

### MEDIUM PRIORITY — App logic strings

**7. `src/components/auth/SignupForm.tsx`** (~4 occurrences)
**8. `src/components/common/ComingSoonBanner.tsx`** (~3 occurrences)
**9. `src/services/dhmad.ts`** (~3 occurrences)
**10. `src/hooks/useAuthRateLimit.ts`** (~2 occurrences)
**11. `src/pages/JobPost.tsx`** (~2 occurrences)
**12. `src/pages/FreelancerEarnings.tsx`** (~2 occurrences)
**13. `src/types/payment.ts`** (~1 occurrence)
**14. `src/pages/Terms.tsx`** (~1 occurrence)
**15. `src/pages/Privacy.tsx`** (~1 occurrence)
**16. `src/main.tsx`** (~1 occurrence)
**17. `src/pages/FindFreelancers.tsx`** (~1 occurrence)
**18. `src/pages/ForgotPassword.tsx`** (~1 occurrence)
**19. `src/pages/FreelancerOnboarding.tsx`** (~1 occurrence)
**20. `src/pages/Notifications.tsx`** (~1 occurrence)
**21. `src/pages/Login.tsx`** (~1 occurrence)
**22. `src/pages/JobBoard.tsx`** (~1 occurrence)
**23. `src/pages/Signup.tsx`** (~1 occurrence)
**24. `src/pages/FAQ.tsx`** (~1 occurrence)
**25. `src/components/layout/MobileNav.tsx`** (~1 occurrence)
**26. `src/components/routing/AccountStatusGate.tsx`** (~1 occurrence)
**27. `src/components/settings/NotificationSettings.tsx`** (~1 occurrence)
**28. `src/components/layout/Footer.tsx`** (~1 occurrence)
**29. `src/components/freelancer/ContactModal.tsx`** (~1 occurrence)
**30. `src/components/jobs/JobCard.tsx`** (~1 occurrence)
**31. `src/components/layout/Header/SearchModal.tsx`** (~1 occurrence)
**32. `src/lib/workspaceRoutes.ts`** (~1 occurrence)
**33. `src/pages/AdminDashboard.tsx`** (~1 occurrence)
**34. `src/pages/ClientOnboarding.tsx`** (~1 occurrence)
**35. `src/lib/logger.ts`** (~1 occurrence)
**36. `src/contexts/AuthContext.tsx`** (~1 occurrence)
**37. `src/lib/currencyUtils.ts`** (~1 occurrence)
**38. `src/lib/flouci.ts`** (~1 occurrence)
**39. `src/lib/supabase.ts`** (~3 occurrences)

### CONFIG FILES

**40. `package.json`**
- Line 2: `"name": "khedma-tn"` → `"name": "workedin"`

---

## LOGO UPDATE

In `src/components/ui/Logo.tsx`, update the logo text to display "WorkedIn" with this styling suggestion:
- "Worked" in regular weight
- "In" in bold or accent color (like LinkedIn does "in")
- Keep existing size/responsive classes

---

## WHAT NOT TO CHANGE

- Database column names, table names, Supabase schema
- Supabase project URL (keep as-is — that's infrastructure)
- Environment variable names (VITE_SUPABASE_URL etc.)
- Function/variable names in logic code (only change string values)
- Test file descriptions (optional — low priority)
- Git history or comments referencing old name for context
- The word "خدمة" when used as regular Arabic vocabulary meaning "service"

---

## VERIFICATION

After all changes:

```bash
npx tsc --noEmit
npm run build
```

Both must pass.

Then do a final scan:
```
Search for: khedma
Expected: 0 results in user-facing strings
Acceptable: infrastructure references (Supabase URL, env vars)
```

---

## DELIVERABLE

Provide complete updated content for all 40 files.

Start with the highest impact files first:
1. `src/i18n/en.ts`
2. `src/i18n/fr.ts`
3. `src/i18n/ar.ts`
4. `src/components/common/SEO.tsx`
5. `src/components/ui/Logo.tsx`
6. `index.html`
7. `package.json`
8. All remaining files

---

**Orchestrator**: Kiro  
**Priority**: HIGH — Brand identity  
**Blocking**: Launch  
**Estimated time**: 45-60 minutes
