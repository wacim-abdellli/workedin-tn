# 🎯 ORCHESTRATION PLAN: T08 (Pages) + T12 (ESLint)

**Date**: 2026-04-09  
**Orchestrator**: Kiro  
**Status**: Ready for execution

---

## 🎉 SURPRISE: T12 ALREADY COMPLETE!

Ran `npx eslint src/` and got:
- ✅ **0 errors**
- ✅ **0 warnings**
- ✅ **All files passing**

**T12 Status**: COMPLETE (no work needed)

The codebase is already ESLint-clean. Someone (probably your previous agent) already fixed all linting issues!

---

## 📊 UPDATED PROGRESS

| Task | Status | Time | Notes |
|------|--------|------|-------|
| T03 | ⏳ Ready | 5 min | SQL script ready (`T03_EXECUTE_NOW.sql`) |
| T04 | ✅ Complete | - | Wallet.tsx fixed (2 lines) |
| T05 | ✅ Complete | - | VerifyIdentity.tsx already compliant |
| T12 | ✅ Complete | - | ESLint already clean (0 errors, 0 warnings) |
| T08 | 🔨 Next | 2-3 hours | 7 pages need fixes (see below) |

**Current Progress**: 8/14 tasks (57%) → After T08: 9/14 (64%)

---

## 🎯 FOCUS: T08 - PAGE CLEANUP

### Pages That Need Fixes (7 total)

Based on grep search, these pages have hardcoded gray colors:

1. **PortfolioDashboard.tsx** - ~10 occurrences
2. **PaymentFailed.tsx** - ~3 occurrences
3. **PaymentSuccess.tsx** - (need to check)
4. **NotFound.tsx** - ~3 occurrences
5. **JobMatches.tsx** - ~5 occurrences
6. **FindFreelancers.tsx** - ~2 occurrences
7. **ContractWorkspace.tsx** - ~2 occurrences
8. **ClientJobs.tsx** - ~3 occurrences
9. **JobPost.tsx** - (need to check)
10. **AuthCallback.tsx** - (need to check)
11. **VerifyEmail.tsx** - (need to check)

### Pages Already Clean (5 total)

These were in the original T08 list but are already using design tokens:
- ✅ Terms.tsx
- ✅ Privacy.tsx
- ✅ Login.tsx
- ✅ Signup.tsx
- ✅ Wallet.tsx (fixed in T04)

---

## 📋 EXECUTION STRATEGY

### Option A: Parallel Execution (RECOMMENDED)
Create 7-10 individual agent prompts, dispatch simultaneously to multiple AI instances.

**Pros**:
- Fastest (all done in ~30 min if you have multiple AI sessions)
- Each agent gets focused, single-file task
- Easy to verify (one file at a time)

**Cons**:
- Requires multiple AI sessions or sequential execution
- More prompts to manage

### Option B: Batch Execution
Create 2-3 prompts, each handling 3-4 pages.

**Pros**:
- Fewer prompts to manage
- Can use single AI session

**Cons**:
- Slower (sequential)
- Larger context per agent
- Harder to verify

### Option C: Manual Execution
I do all fixes now in this session.

**Pros**:
- Immediate completion
- Single session

**Cons**:
- Takes 2-3 hours
- Blocks other work

---

## 🤖 RECOMMENDED: OPTION A (PARALLEL PROMPTS)

I'll create 8 individual prompts (one per page that needs fixes). You can:
1. Dispatch all 8 to different AI sessions simultaneously
2. OR execute them sequentially in one session
3. OR mix: do 2-3 now, rest later

Each prompt will be:
- Self-contained (no dependencies)
- Focused on single file
- Include verification steps
- Ready to copy-paste

---

## 📁 PROMPT STRUCTURE

Each prompt will follow this template:

```markdown
# 🤖 AGENT TASK: T08-[PAGE_NAME]

**File**: src/pages/[PageName].tsx
**Estimated time**: 15-20 minutes
**Complexity**: LOW-MEDIUM

## YOUR SINGLE TASK
Replace hardcoded Tailwind gray classes with design tokens in [PageName].tsx.

## TOKEN MAPPING
[Specific mappings for this page]

## SPECIFIC LOCATIONS
[Exact line numbers and changes needed]

## VERIFICATION
- npx tsc --noEmit
- npm run build
- grep check for remaining grays

## DELIVERABLE
Complete updated file content
```

---

## 🎯 WHAT DO YOU WANT?

Pick a number:

1. **Create 8 parallel prompts** (Option A - RECOMMENDED)
   - I create 8 files: `T08_01_PORTFOLIO.md`, `T08_02_PAYMENT_FAILED.md`, etc.
   - You dispatch to AI agents (parallel or sequential)
   - Fastest overall completion

2. **Create 3 batch prompts** (Option B)
   - I create 3 files, each handling 2-3 pages
   - You execute sequentially
   - Simpler management

3. **I fix all pages now** (Option C)
   - I do all work in this session
   - Takes 2-3 hours
   - Immediate completion

4. **Just do T03 SQL** (defer T08)
   - Focus on database cleanup only
   - Save T08 for later

5. **Something else**

---

## 💡 MY RECOMMENDATION

**Option 1** - Create 8 parallel prompts.

Why:
- You can dispatch 2-3 now, rest later
- Each prompt is 15-20 min of AI work
- Easy to track progress
- Flexible execution (parallel or sequential)
- Clean, focused tasks

**Total time if parallel**: ~30 minutes (all 8 agents working simultaneously)
**Total time if sequential**: ~2-3 hours (one after another)

---

**What's your call, orchestrator?**
