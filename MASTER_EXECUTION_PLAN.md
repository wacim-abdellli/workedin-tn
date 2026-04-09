# Master Execution Plan - Khedma TN Launch
**Date**: 2026-04-09  
**Role**: Chief Technical Orchestrator  
**Status**: Dhmad application submitted, waiting for response

---

## 🎯 MISSION: LAUNCH IN 7 DAYS

**Current State**: Day 1 - Dhmad application submitted  
**Target**: Day 7 - Live production launch  
**Blocker**: Waiting for Dhmad sandbox access (1-3 days)

---

## 📋 PARALLEL EXECUTION TRACKS

While waiting for Dhmad, we execute 3 parallel tracks:

### Track A: Email Setup (CRITICAL PATH)
**Owner**: You  
**Timeline**: 2-3 days  
**Blocker**: None - can start NOW

### Track B: UI/UX Polish (PARALLEL)
**Owner**: AI Agent #1  
**Timeline**: 2-3 days  
**Blocker**: None - can start NOW

### Track C: Dhmad Integration Prep (PARALLEL)
**Owner**: AI Agent #2  
**Timeline**: 1-2 days  
**Blocker**: None - prep work, actual integration waits for sandbox

---

## 🚀 TRACK A: EMAIL SETUP (YOU - START NOW)

### Priority: CRITICAL - This is your longest pole

**Task A1: Sign up for Resend (5 minutes)**
1. Go to https://resend.com
2. Click "Sign Up" (free, no credit card)
3. Verify your email
4. Login to dashboard

**Task A2: Add Domain (10 minutes)**
1. In Resend dashboard, click "Domains"
2. Click "Add Domain"
3. Enter: `khedma.tn`
4. Resend will show you DNS records

**Task A3: Add DNS Records (15 minutes)**
1. Login to your domain registrar (where you bought khedma.tn)
2. Go to DNS settings
3. Add these records (Resend will give you exact values):
   - **SPF Record** (TXT): `v=spf1 include:resend.com ~all`
   - **DKIM Record** (TXT): `resend._domainkey` → (long value from Resend)
   - **DMARC Record** (TXT): `_dmarc` → `v=DMARC1; p=none;`

**Task A4: Wait for Verification (24-48 hours)**
- DNS propagation takes time
- Check status in Resend dashboard
- Once verified, you'll get API key

**Task A5: Set API Key in Supabase (5 minutes)**
```bash
npx supabase secrets set RESEND_API_KEY=re_...
```

**Deliverable**: Email sending ready in 2-3 days

---

## 🎨 TRACK B: UI/UX POLISH (AI AGENT #1)

### Agent Prompt for Track B:

```
ROLE: Frontend Polish Specialist
MISSION: Implement "Coming Soon" payment UI and polish user experience
TIMELINE: 2-3 days
STRICT RULES: 
- Only UI changes, no backend logic
- Must be production-ready
- Must follow existing design system
- Test on mobile and desktop

TASKS:

TASK B1: Create Payment Methods Configuration
FILE: src/config/paymentMethods.ts
REQUIREMENTS:
- Define 3 payment methods: Dhmad (available), Flouci (coming soon), D17 (coming soon)
- Include Arabic, French, English translations
- Include icons, descriptions, features
- Export helper functions: getAvailablePaymentMethods(), getComingSoonPaymentMethods()
ACCEPTANCE CRITERIA:
- TypeScript types defined
- All translations complete
- No hardcoded strings
REFERENCE: See LAUNCH_STRATEGY_COMING_SOON.md section "Payment Methods Configuration"

TASK B2: Create PaymentMethodSelector Component
FILE: src/components/payment/PaymentMethodSelector.tsx
REQUIREMENTS:
- Show available methods as selectable cards
- Show coming soon methods as disabled cards with badges
- Support Arabic/French/English
- Responsive design (mobile + desktop)
- Accessibility compliant (keyboard navigation, ARIA labels)
ACCEPTANCE CRITERIA:
- Component renders correctly
- Coming soon badge visible
- Info banner about future methods
- Works in RTL (Arabic) and LTR (English/French)
REFERENCE: See LAUNCH_STRATEGY_COMING_SOON.md section "Payment Method Selector Component"

TASK B3: Update Wallet Page
FILE: src/pages/Wallet.tsx
REQUIREMENTS:
- Add PaymentMethodSelector to deposit modal
- Default to 'dhmad' method
- Show coming soon methods
- Update deposit flow to use selected method
ACCEPTANCE CRITERIA:
- Selector integrated in deposit modal
- UI looks professional
- No console errors
- Mobile responsive

TASK B4: Add Homepage Banner (Optional)
FILE: src/pages/Home.tsx
REQUIREMENTS:
- Add banner: "Coming Soon: Flouci & D17 - More payment options!"
- Gradient background (blue to purple)
- Dismissible (localStorage)
- Responsive
ACCEPTANCE CRITERIA:
- Banner visible on homepage
- Can be dismissed
- Doesn't show again after dismissal

TASK B5: Update FAQ Section
FILE: src/pages/FAQ.tsx or relevant file
REQUIREMENTS:
- Add Q&A about payment methods
- Explain Dhmad escrow
- Mention Flouci/D17 coming soon
ACCEPTANCE CRITERIA:
- FAQ updated with payment info
- Clear, user-friendly language
- Translated to Arabic/French

VERIFICATION:
- Run: npm run build (must succeed)
- Test on Chrome, Firefox, Safari
- Test on mobile (responsive)
- Test in Arabic (RTL layout)
- No TypeScript errors
- No console warnings

DELIVERABLE: Pull request with all UI changes, screenshots of before/after
```

---

## 🔧 TRACK C: DHMAD INTEGRATION PREP (AI AGENT #2)

### Agent Prompt for Track C:

```
ROLE: Backend Integration Specialist
MISSION: Prepare Dhmad integration infrastructure (no live API calls yet)
TIMELINE: 1-2 days
STRICT RULES:
- No live API calls (sandbox not available yet)
- Use mock data for development
- Must be production-ready structure
- Follow existing patterns in codebase

TASKS:

TASK C1: Create Dhmad Service Layer
FILE: src/services/dhmad.ts
REQUIREMENTS:
- Create functions: createEscrow(), releaseEscrow(), refundEscrow(), getEscrowStatus()
- Use dev mode mocks (check import.meta.env.DEV)
- Call Edge Functions (not implemented yet, will return mock data)
- Proper error handling
- TypeScript types for all requests/responses
ACCEPTANCE CRITERIA:
- Service file created
- All functions defined
- Mock data returns correctly in dev mode
- TypeScript compiles
REFERENCE: See DHMAD_INTEGRATION_PLAN.md section "Create Dhmad Service"

TASK C2: Create Dhmad Edge Function Stubs
FILES: 
- supabase/functions/dhmad-create-escrow/index.ts
- supabase/functions/dhmad-release-escrow/index.ts
- supabase/functions/dhmad-refund-escrow/index.ts
REQUIREMENTS:
- Create function structure
- Add TODO comments for actual Dhmad API calls
- Return mock success responses for now
- Proper error handling structure
ACCEPTANCE CRITERIA:
- Functions deploy successfully
- Return mock data
- No runtime errors
REFERENCE: See DHMAD_INTEGRATION_PLAN.md section "Create Dhmad Edge Functions"

TASK C3: Add Database Column
FILE: supabase/migrations/[timestamp]_add_dhmad_escrow_id.sql
REQUIREMENTS:
- Add dhmad_escrow_id column to contracts table
- Add index for performance
- Make nullable (existing contracts don't have it)
ACCEPTANCE CRITERIA:
- Migration file created
- Can run: npx supabase db push (in dev)
- Column added successfully
REFERENCE: See DHMAD_INTEGRATION_PLAN.md section "Add Database Column"

TASK C4: Update Contract State Hook (Prep Only)
FILE: src/hooks/useContractState.ts
REQUIREMENTS:
- Add import for dhmad service (commented out for now)
- Add TODO comments where Dhmad calls will go
- Document the flow: create escrow → wait for funding → release on completion
ACCEPTANCE CRITERIA:
- Comments added
- No breaking changes
- Existing flow still works
REFERENCE: See DHMAD_INTEGRATION_PLAN.md section "Update Contract Flow"

TASK C5: Create Dhmad Integration Tests (Mocked)
FILE: src/services/__tests__/dhmad.test.ts
REQUIREMENTS:
- Test createEscrow() returns mock data
- Test releaseEscrow() returns success
- Test refundEscrow() returns success
- Test error handling
ACCEPTANCE CRITERIA:
- Tests pass: npm run test
- 100% coverage of dhmad service
- Uses vitest mocks

VERIFICATION:
- Run: npm run build (must succeed)
- Run: npm run test (all tests pass)
- Run: npx supabase functions deploy dhmad-create-escrow (succeeds)
- No TypeScript errors
- No breaking changes to existing features

DELIVERABLE: Pull request with Dhmad infrastructure, ready for sandbox API keys
```

---

## 📊 EXECUTION TIMELINE

### Day 1 (TODAY) ✅
- [x] Dhmad application submitted
- [ ] YOU: Sign up for Resend
- [ ] YOU: Add domain to Resend
- [ ] YOU: Add DNS records
- [ ] AI Agent #1: Start Track B (UI polish)
- [ ] AI Agent #2: Start Track C (Dhmad prep)

### Day 2 (TOMORROW)
- [ ] YOU: Check Resend domain verification status
- [ ] YOU: Check Dhmad email for response
- [ ] AI Agent #1: Complete TASK B1, B2
- [ ] AI Agent #2: Complete TASK C1, C2, C3

### Day 3
- [ ] YOU: Resend domain should be verified → Get API key
- [ ] YOU: Set RESEND_API_KEY in Supabase
- [ ] YOU: Test email sending
- [ ] AI Agent #1: Complete TASK B3, B4, B5
- [ ] AI Agent #2: Complete TASK C4, C5
- [ ] Dhmad should respond (sandbox access)

### Day 4
- [ ] AI Agent #1: Submit PR for Track B (UI polish)
- [ ] AI Agent #2: Submit PR for Track C (Dhmad prep)
- [ ] YOU: Review and merge PRs
- [ ] YOU: Get Dhmad sandbox API key
- [ ] AI Agent #2: Update Edge Functions with real Dhmad API calls

### Day 5
- [ ] Test Dhmad integration in sandbox
- [ ] Test email sending
- [ ] Fix any bugs
- [ ] Run full smoke test

### Day 6
- [ ] Final testing
- [ ] Deploy to production
- [ ] Monitor for errors

### Day 7
- [ ] 🚀 LAUNCH
- [ ] Announce on social media
- [ ] Monitor closely

---

## 🎯 CRITICAL PATH ANALYSIS

**Longest Poles** (things that take the most time):
1. **Email DNS verification**: 24-48 hours (YOU - start NOW)
2. **Dhmad sandbox approval**: 1-3 days (WAITING)
3. **UI polish**: 2-3 days (AI Agent #1 - start NOW)

**Parallel Work** (can happen simultaneously):
- Email setup (YOU)
- UI polish (AI Agent #1)
- Dhmad prep (AI Agent #2)

**Dependencies**:
- Email: No dependencies, start NOW
- UI: No dependencies, start NOW
- Dhmad prep: No dependencies, start NOW
- Dhmad integration: Depends on sandbox access (Day 3-4)

---

## 📋 YOUR IMMEDIATE ACTIONS (NEXT 30 MINUTES)

### Action 1: Email Setup (15 minutes)
1. Open https://resend.com in new tab
2. Sign up (free)
3. Add domain: khedma.tn
4. Copy DNS records
5. Login to domain registrar
6. Add DNS records
7. ✅ DONE - now wait 24-48 hours

### Action 2: Delegate to AI Agents (15 minutes)
1. Copy "Agent Prompt for Track B" above
2. Give to AI Agent #1 (Claude, ChatGPT, or another Kiro instance)
3. Copy "Agent Prompt for Track C" above
4. Give to AI Agent #2 (different AI instance)
5. ✅ DONE - agents work in parallel

### Action 3: Check Dhmad Email (5 minutes)
1. Check your email for Dhmad response
2. If no response yet, that's normal (1-3 days)
3. Set reminder to check tomorrow
4. ✅ DONE

---

## 🚨 RISK MANAGEMENT

### Risk 1: Dhmad Takes Longer Than Expected
**Mitigation**: 
- We're doing prep work in parallel
- If Day 5 and still no response, send follow-up email
- Worst case: Launch with manual escrow, add Dhmad later

### Risk 2: Email DNS Doesn't Verify
**Mitigation**:
- Double-check DNS records are correct
- Use DNS checker tool: https://mxtoolbox.com
- Contact Resend support if issues
- Worst case: Launch without email, add within 1 week

### Risk 3: AI Agents Make Mistakes
**Mitigation**:
- I review all PRs before merge
- Run tests: npm run test
- Run build: npm run build
- Manual testing on staging

### Risk 4: Bugs Found During Testing
**Mitigation**:
- Day 5-6 are buffer days for bug fixes
- Prioritize critical bugs only
- Non-critical bugs go to post-launch backlog

---

## ✅ SUCCESS CRITERIA

### Must Have (Launch Blockers):
- [ ] Email sending works (password reset, notifications)
- [ ] Dhmad escrow works (create, release, refund)
- [ ] "Coming Soon" UI looks professional
- [ ] No critical bugs
- [ ] Mobile responsive
- [ ] Arabic/French/English all work

### Nice to Have (Post-Launch):
- [ ] Homepage banner
- [ ] FAQ updated
- [ ] Perfect mobile UX
- [ ] All edge cases handled

---

## 📞 COMMUNICATION PROTOCOL

### Daily Standup (Every Morning):
**You report to me**:
1. What you did yesterday
2. What you're doing today
3. Any blockers

**I report to you**:
1. AI Agent progress
2. Any issues found
3. Next priorities

### When to Escalate to Me:
- Dhmad responds (immediately)
- Email DNS verified (immediately)
- AI Agent stuck or confused (immediately)
- Any blocker that stops progress (immediately)
- Critical bug found (immediately)

### When to Make Decisions Without Me:
- Minor UI tweaks
- Text/translation changes
- Non-critical bug fixes
- Styling adjustments

---

## 🎯 YOUR ROLE vs MY ROLE

### You (Business/Ops):
- Email setup (Resend)
- Dhmad communication
- Domain/DNS management
- Testing from user perspective
- Final launch decision

### Me (Chief Technical Orchestrator):
- Delegate to AI agents
- Review all code changes
- Ensure quality and standards
- Technical decisions
- Integration architecture
- Risk management

### AI Agent #1 (Frontend):
- UI/UX implementation
- Component creation
- Styling and responsiveness
- Translations

### AI Agent #2 (Backend):
- Dhmad integration
- Edge Functions
- Database migrations
- Service layer

---

## 📝 NEXT STEPS (RIGHT NOW)

1. **YOU**: Go to Resend, sign up, add domain, add DNS records (15 min)
2. **YOU**: Copy Track B prompt, give to AI Agent #1
3. **YOU**: Copy Track C prompt, give to AI Agent #2
4. **YOU**: Report back to me when done

Then we wait for:
- Email DNS verification (24-48 hours)
- Dhmad response (1-3 days)
- AI Agents to complete their work (2-3 days)

**I'll check in with you tomorrow morning for daily standup.**

---

**Last Updated**: 2026-04-09  
**Status**: EXECUTION MODE - Day 1  
**Next Checkpoint**: Tomorrow morning standup
