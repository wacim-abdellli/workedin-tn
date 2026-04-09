# 🎯 ORCHESTRATOR SUMMARY: T03-T05 Fix Prompts

**Date**: 2026-04-09  
**Orchestrator**: Kiro  
**Status**: Ready for execution

---

## 📋 TASK OVERVIEW

| Task | File | Complexity | Time | Status |
|------|------|-----------|------|--------|
| T03 | Database | LOW | 5 min | Ready (manual SQL) |
| T04 | Wallet.tsx | MEDIUM | 30 min | Ready (AI agent) |
| T05 | VerifyIdentity.tsx | MEDIUM | 45 min | **ALREADY COMPLETE** |

---

## 📄 PROMPT FILES CREATED

1. **UI_FIX_T03_DATABASE_CLEANUP.md**
   - Manual SQL execution guide
   - 3 approaches: hide, cancel, or delete
   - Recommended: Set `visibility = 'invite_only'`
   - Includes verification steps

2. **UI_FIX_T04_WALLET_PROMPT.md**
   - AI agent prompt for Wallet.tsx
   - 2-3 line changes (minimal)
   - Remove redundant `dark:border-gray-600`
   - Replace `text-gray-400` with `text-muted`

3. **UI_FIX_T05_VERIFYIDENTITY_PROMPT.md**
   - AI agent prompt for VerifyIdentity.tsx
   - **SURPRISE**: File is already compliant!
   - No changes needed
   - Uses correct tokens throughout

---

## 🚀 EXECUTION PLAN

### Phase 1: Database Cleanup (5 minutes)
**YOU execute this manually**

1. Open `UI_FIX_T03_DATABASE_CLEANUP.md`
2. Follow Step 3 (recommended approach)
3. Run SQL in Supabase SQL Editor
4. Verify on https://khedma-tn.vercel.app/jobs
5. Report back: "T03 complete, X jobs hidden"

### Phase 2: Wallet.tsx Fix (30 minutes)
**AI agent executes this**

1. Open `UI_FIX_T04_WALLET_PROMPT.md`
2. Copy entire prompt
3. Paste into Claude Sonnet 4.5 or GPT-5.4
4. Agent returns updated Wallet.tsx
5. You paste the code
6. Run verification:
   ```bash
   npx tsc --noEmit
   npm run build
   ```
7. Report back: "T04 complete, 2 lines changed"

### Phase 3: VerifyIdentity.tsx (0 minutes)
**NO WORK NEEDED**

1. Open `UI_FIX_T05_VERIFYIDENTITY_PROMPT.md`
2. Read the conclusion section
3. File is already compliant with design system
4. Mark T05 as complete in tracking
5. Report back: "T05 already complete, no changes needed"

---

## 📊 EXPECTED OUTCOMES

### After T03 (Database Cleanup)
- ✅ No test jobs visible on `/jobs` page
- ✅ Production looks professional
- ✅ Test data preserved in database (if using invite_only)

### After T04 (Wallet.tsx)
- ✅ Withdrawal modal uses design tokens
- ✅ Deposit modal uses design tokens
- ✅ Consistent with rest of application
- ✅ Dark mode works correctly

### After T05 (VerifyIdentity.tsx)
- ✅ Already compliant (no work needed)
- ✅ All status screens use correct tokens
- ✅ Glass effects intentional and correct

---

## 🎯 PROGRESS TRACKING

Update `UI_AUDIT_STATUS_FINAL.md` after completion:

```markdown
### Critical Tier (🔴)
- [x] T01 - French SEO mojibake ✅
- [x] T02 - French i18n dictionary ✅
- [x] T03 - Database cleanup ✅ (2026-04-09)
- [x] T10 - Em-dash in title ✅

### High Priority Tier (🟠)
- [x] T04 - Wallet.tsx colors ✅ (2026-04-09)
- [x] T05 - VerifyIdentity.tsx colors ✅ (already compliant)
- [x] T06 - Terms/Privacy backgrounds ✅
- [x] T07 - Login/Signup autocomplete ✅

**Critical Tier**: 4/4 complete (100%)
**High Priority Tier**: 4/4 complete (100%)
**Overall**: 8/14 complete (57%)
```

---

## 🤖 AI MODEL RECOMMENDATIONS

| Task | Best Model | Fallback |
|------|-----------|----------|
| T03 | N/A (manual) | N/A |
| T04 | Claude Sonnet 4.5 | GPT-5.4 |
| T05 | N/A (no work) | N/A |

---

## ⚠️ CRITICAL RULES

1. **T03**: Use `invite_only` approach (don't delete)
2. **T04**: Only change 2-3 lines (minimal changes)
3. **T05**: Don't change anything (already correct)
4. **Verification**: Always run `npx tsc --noEmit` after changes
5. **Testing**: Always test in browser before committing

---

## 📝 COMMIT MESSAGES

After completion, use these commit messages:

```bash
# After T03
git commit -m "fix(db): hide test jobs from production job board

- Set visibility=invite_only for test/smoke jobs
- Preserves data for debugging
- Fixes production credibility issue
- Resolves T03 from UI audit"

# After T04
git commit -m "fix(wallet): replace hardcoded colors with design tokens

- Remove redundant dark:border-gray-600 from method selector
- Replace text-gray-400 with text-muted in phone icon
- Improves consistency with design system
- Resolves T04 from UI audit"

# After T05 (no commit needed)
# Just update tracking document
```

---

## 🎉 COMPLETION CRITERIA

You can mark this phase complete when:

- [x] T03: No test jobs visible on production `/jobs` page
- [x] T04: Wallet.tsx uses design tokens (2-3 lines changed)
- [x] T05: Confirmed already compliant (no changes)
- [x] All type checks pass
- [x] Build succeeds
- [x] Visual testing complete
- [x] Tracking document updated

**Total time**: ~40 minutes (5 min manual + 30 min AI + 5 min verification)

---

## 🔄 NEXT STEPS AFTER COMPLETION

Once T03-T05 are done, you'll have:
- ✅ 100% of Critical tier complete
- ✅ 100% of High Priority tier complete
- ✅ 57% overall progress

**Remaining work**:
- T08: 12 pages with hardcoded colors (2-3 hours)
- T09: 38 components with hardcoded colors (4-5 hours)
- T11: Header decomposition (3-4 hours)
- T12: ESLint fixes (1 hour)
- T13: Keyboard navigation (1-2 hours)
- T14: framer-motion optimization (2-3 hours)

**Recommended next**: T08 (page cleanup) or T12 (ESLint auto-fix)

---

**Orchestrator**: Kiro  
**Status**: Prompts ready for execution  
**Blocking**: None  
**Priority**: Execute T03 first (5 min), then T04 (30 min)
