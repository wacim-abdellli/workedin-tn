# 🎯 ALL REMAINING TASKS - AGENT PROMPTS

**Date**: 2026-04-09  
**Orchestrator**: Kiro  
**Total Tasks**: 1 SQL + 7 AI Agent Prompts

---

## 📊 TASK OVERVIEW

| # | Task | File | Occurrences | Time | Priority | Prompt File |
|---|------|------|-------------|------|----------|-------------|
| 0 | Database | SQL Script | 4-6 jobs | 5 min | 🔴 CRITICAL | `T03_EXECUTE_NOW.sql` |
| 1 | Portfolio | PortfolioDashboard.tsx | ~15 | 20 min | 🟠 HIGH | `T08_01_PORTFOLIO_DASHBOARD.md` |
| 2 | Payment Failed | PaymentFailed.tsx | ~3 | 10 min | 🟡 MEDIUM | `T08_02_PAYMENT_FAILED.md` |
| 3 | Not Found | NotFound.tsx | ~3 | 10 min | 🔵 LOW | `T08_03_NOT_FOUND.md` |
| 4 | Job Matches | JobMatches.tsx | ~5 | 15 min | 🟠 HIGH | `T08_04_JOB_MATCHES.md` |
| 5 | Find Freelancers | FindFreelancers.tsx | ~2 | 10 min | 🟡 MEDIUM | `T08_05_FIND_FREELANCERS.md` |
| 6 | Contract Workspace | ContractWorkspace.tsx | ~2 | 10 min | 🟡 MEDIUM | `T08_06_CONTRACT_WORKSPACE.md` |
| 7 | Client Jobs | ClientJobs.tsx | ~3 | 10 min | 🟡 MEDIUM | `T08_07_CLIENT_JOBS.md` |

**Total Estimated Time**: 
- Sequential: 1.5-2 hours
- Parallel (7 AI agents): 20 minutes
- Database: 5 minutes (manual)

---

## 📁 ALL PROMPT FILES CREATED

### ✅ T03 - Database Cleanup (MANUAL EXECUTION)
- **File**: `T03_EXECUTE_NOW.sql`
- **Guide**: `UI_FIX_T03_DATABASE_CLEANUP.md`
- **Action**: YOU execute in Supabase SQL Editor
- **Time**: 5 minutes
- **Priority**: 🔴 CRITICAL

### ✅ T08-01 - Portfolio Dashboard
- **File**: `T08_01_PORTFOLIO_DASHBOARD.md`
- **Target**: `src/pages/PortfolioDashboard.tsx`
- **Changes**: ~15 lines (gray classes → tokens)
- **Time**: 20 minutes
- **Priority**: 🟠 HIGH

### ✅ T08-02 - Payment Failed
- **File**: `T08_02_PAYMENT_FAILED.md`
- **Target**: `src/pages/PaymentFailed.tsx`
- **Changes**: ~3 lines (remove redundant dark: classes)
- **Time**: 10 minutes
- **Priority**: 🟡 MEDIUM

### ✅ T08-03 - Not Found (404)
- **File**: `T08_03_NOT_FOUND.md`
- **Target**: `src/pages/NotFound.tsx`
- **Changes**: ~3 lines (gray classes → tokens)
- **Time**: 10 minutes
- **Priority**: 🔵 LOW

### ✅ T08-04 - Job Matches
- **File**: `T08_04_JOB_MATCHES.md`
- **Target**: `src/pages/JobMatches.tsx`
- **Changes**: ~5 lines (gray classes → tokens)
- **Time**: 15 minutes
- **Priority**: 🟠 HIGH

### ✅ T08-05 - Find Freelancers
- **File**: `T08_05_FIND_FREELANCERS.md`
- **Target**: `src/pages/FindFreelancers.tsx`
- **Changes**: ~2 lines (gray classes → tokens)
- **Time**: 10 minutes
- **Priority**: 🟡 MEDIUM

### ✅ T08-06 - Contract Workspace
- **File**: `T08_06_CONTRACT_WORKSPACE.md`
- **Target**: `src/pages/ContractWorkspace.tsx`
- **Changes**: ~2 lines (gray classes → tokens)
- **Time**: 10 minutes
- **Priority**: 🟡 MEDIUM

### ✅ T08-07 - Client Jobs
- **File**: `T08_07_CLIENT_JOBS.md`
- **Target**: `src/pages/ClientJobs.tsx`
- **Changes**: ~3 lines (gray classes → tokens)
- **Time**: 10 minutes
- **Priority**: 🟡 MEDIUM

---

## 🔧 TOKEN MAPPING REFERENCE (ALL TASKS)

Use these EXACT replacements across all files:

```
BACKGROUNDS:
bg-gray-50                     → bg-surface
bg-gray-100                    → bg-muted
bg-gray-200                    → bg-secondary
bg-gray-400                    → bg-muted
dark:bg-gray-700               → (remove, covered by token)
dark:bg-gray-800               → (remove, covered by token)
dark:bg-gray-900               → (remove, covered by token)

TEXT:
text-gray-100                  → text-muted/20 (decorative only)
text-gray-200                  → text-muted-foreground
text-gray-300                  → text-muted
text-gray-400                  → text-muted
dark:text-gray-200             → (remove, covered by token)
dark:text-gray-300             → (remove, covered by token)
dark:text-gray-400             → (remove, covered by token)

BORDERS:
border-gray-200                → border-border
border-gray-300                → border-border
dark:border-gray-700           → (remove, covered by token)

HOVER STATES:
hover:bg-gray-200              → hover:bg-secondary
dark:hover:text-gray-300       → (remove, covered by token)
```

---

## 🚀 EXECUTION INSTRUCTIONS

### Step 1: Database Cleanup (5 minutes)
**YOU execute manually**:
1. Open `T03_EXECUTE_NOW.sql`
2. Copy entire file contents
3. Open Supabase SQL Editor
4. Paste and execute STEP 1 (preview)
5. Execute STEP 2 (hide jobs)
6. Execute STEP 3 & 4 (verify)
7. Visit https://khedma-tn.vercel.app/jobs to confirm

### Step 2: Page Cleanup (1.5 hours OR 20 minutes)

#### Option A: Parallel (FASTEST)
Open 7 AI sessions, paste one prompt per session:
1. Session 1: Copy `T08_01_PORTFOLIO_DASHBOARD.md` → Paste to AI
2. Session 2: Copy `T08_02_PAYMENT_FAILED.md` → Paste to AI
3. Session 3: Copy `T08_03_NOT_FOUND.md` → Paste to AI
4. Session 4: Copy `T08_04_JOB_MATCHES.md` → Paste to AI
5. Session 5: Copy `T08_05_FIND_FREELANCERS.md` → Paste to AI
6. Session 6: Copy `T08_06_CONTRACT_WORKSPACE.md` → Paste to AI
7. Session 7: Copy `T08_07_CLIENT_JOBS.md` → Paste to AI

Wait ~20 minutes, collect all results, apply changes.

#### Option B: Sequential (SLOWER)
Execute prompts one by one in single AI session:
1. Paste `T08_01_PORTFOLIO_DASHBOARD.md` → Get result → Apply
2. Paste `T08_02_PAYMENT_FAILED.md` → Get result → Apply
3. Continue for all 7 prompts...

Takes ~1.5 hours total.

### Step 3: Verification (5 minutes per file)
After each file update:
```bash
# Type check
npx tsc --noEmit

# Build
npm run build

# Check for remaining grays
grep -n "gray-[0-9]" src/pages/[FileName].tsx

# Visual test in browser
```

---

## 📊 PROGRESS TRACKING

After completing all tasks:

| Tier | Before | After | Status |
|------|--------|-------|--------|
| 🔴 Critical | 3/4 (75%) | 4/4 (100%) | ✅ COMPLETE |
| 🟠 High | 4/4 (100%) | 4/4 (100%) | ✅ COMPLETE |
| 🟡 Medium | 0/2 (0%) | 1/2 (50%) | T08 done |
| 🔵 Low | 0/4 (0%) | 0/4 (0%) | Not started |
| **TOTAL** | **7/14 (50%)** | **9/14 (64%)** | +14% |

---

## 🎯 RECOMMENDED ORDER

### High Priority (Do First):
1. T03 - Database (5 min) - CRITICAL
2. T08-01 - Portfolio (20 min) - HIGH
3. T08-04 - Job Matches (15 min) - HIGH

### Medium Priority (Do Next):
4. T08-02 - Payment Failed (10 min)
5. T08-05 - Find Freelancers (10 min)
6. T08-06 - Contract Workspace (10 min)
7. T08-07 - Client Jobs (10 min)

### Low Priority (Do Last):
8. T08-03 - Not Found (10 min)

---

## 💡 TIPS

1. **Each prompt is self-contained** - no dependencies between them
2. **All prompts include verification steps** - follow them
3. **All prompts specify exact line numbers** - easy to verify
4. **All prompts include before/after code** - clear expectations
5. **Parallel execution saves 1+ hour** - if you have multiple AI sessions

---

## 📞 SUPPORT

If any prompt fails:
1. Check verification steps in the prompt
2. Run `npx tsc --noEmit` for type errors
3. Run `npm run build` for build errors
4. Use `grep` to verify changes applied
5. Check `MASTER_TASK_SUMMARY.md` for troubleshooting

---

**Orchestrator**: Kiro  
**Status**: All prompts ready  
**Next Action**: Execute T03, then dispatch T08 prompts


