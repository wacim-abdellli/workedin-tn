# PHASE 1: COMPLETE FLOW TESTING

## 🎯 Objective
Test all 5 user flows from the audit PDF to ensure end-to-end functionality.

---

## FLOW 1: NEW FREELANCER REGISTRATION

### Setup
```bash
# Ensure dev server is running
npm run dev
```

### Test Execution

#### Step 1: Initial Signup
1. Open browser: http://localhost:5173/signup
2. **TEST CASE 1A: Email/Password Signup**
   - Enter email: `test-freelancer-${Date.now()}@test.com`
   - Enter password: `SecurePass123!@#`
   - Click "إنشاء حساب" (Create Account)
   - ✅ VERIFY: No errors in console (check browser DevTools)
   - ✅ VERIFY: User created in Supabase Auth dashboard

3. **TEST CASE 1B: Google OAuth**
   - Click "Continue with Google"
   - ✅ VERIFY: OAuth popup opens
   - ✅ VERIFY: After auth, redirects to /auth/callback
   - ✅ VERIFY: Then redirects to type selection

#### Step 2: User Type Selection
- Current URL should be: `/signup?step=select-type`
- Click "أنا مستقل" (I'm a Freelancer) button
- ✅ VERIFY: 
  ```sql
  -- Run in Supabase SQL Editor
  SELECT user_type FROM profiles WHERE email = 'YOUR_TEST_EMAIL';
  -- Should return: 'freelancer'
  ```
- ✅ VERIFY: Redirects to `/onboarding/freelancer`

#### Step 3: Onboarding - Skills (Step 1)
- Fill in form:
  - Full Name: "أحمد محمد التونسي"
  - Professional Title: "مطور واجهات أمامية متخصص في React و TypeScript"
  - Location: "تونس، تونس"
  - Skills: Select at least 3 from dropdown (React, TypeScript, TailwindCSS)
- ✅ VERIFY: Form validation shows errors if fields are empty
- ✅ VERIFY: Cannot proceed with less than 3 skills
- Click "التالي" (Next)

#### Step 4: Onboarding - Bio & Photo (Step 2)
- Upload avatar: Click avatar area, select image file
  - ✅ VERIFY: Image preview shows
  - ✅ VERIFY: No upload errors
- Enter bio: "مطور واجهات أمامية مع 5 سنوات خبرة..."
- Set hourly rate: 50
- Select availability: "Full-time"
- Click "التالي" (Next)

#### Step 5: Onboarding - Portfolio (Step 3)
- Click "تخطي" (Skip for now) OR add portfolio items
- Click "إكمال التسجيل" (Complete Registration)
- ✅ VERIFY: Loading state shows during save
- ✅ VERIFY: Redirects to `/freelancer/dashboard`

#### Step 6: Dashboard Verification
- ✅ VERIFY UI shows:
  - ✅ User name in header
  - ✅ Avatar (if uploaded)
  - ✅ "Profile Completion" widget
  - ✅ No JavaScript errors in console
- ✅ VERIFY Database:
  ```sql
  SELECT 
    p.full_name,
    p.user_type,
    p.onboarding_completed,
    p.avatar_url,
    fp.title,
    fp.skills,
    fp.hourly_rate
  FROM profiles p
  LEFT JOIN freelancer_profiles fp ON fp.id = p.id
  WHERE p.email = 'YOUR_TEST_EMAIL';
  ```
  Expected results:
  - onboarding_completed = true
  - user_type = 'freelancer'
  - All fields populated

#### Step 7: Browse & Apply to Job
- Click "تصفح الوظائف" or navigate to `/jobs`
- ✅ VERIFY: Jobs list loads
- Click on any job → Opens `/jobs/:jobId`
- Click "تقديم عرض" (Submit Proposal)
- Fill proposal form:
  - Cover letter: "مرحباً، أنا مهتم بهذا المشروع..."
  - Bid amount: 500
  - Delivery time: 7 (days)
- Click "إرسال العرض" (Submit Proposal)
- ✅ VERIFY: Success toast shows
- ✅ VERIFY: Proposal saved in database:
  ```sql
  SELECT * FROM proposals 
  WHERE freelancer_id = (SELECT id FROM profiles WHERE email = 'YOUR_TEST_EMAIL')
  ORDER BY created_at DESC LIMIT 1;
  ```

### Pass Criteria
- ✅ All 7 steps complete without errors
- ✅ Data persists in database
- ✅ No console errors
- ✅ All redirects work correctly
- ✅ Loading states show appropriately

---

## FLOW 2: NEW CLIENT REGISTRATION

### Test Execution

#### Step 1: Signup
- Navigate to `/signup`
- Create account with email: `test-client-${Date.now()}@test.com`
- Password: `ClientPass123!@#`

#### Step 2: Select Client Type
- Click "أنا عميل" (I'm a Client)
- ✅ VERIFY: `user_type` = 'client' in database
- ✅ VERIFY: Redirects to `/onboarding/client`

#### Step 3: Client Onboarding
- Fill form:
  - Full Name: "شركة التكنولوجيا المتقدمة"
  - Company Name: "Tech Advanced Co."
  - Company Size: "10-50"
  - Industry: "Technology"
  - Location: "تونس"
- Click "إكمال التسجيل"
- ✅ VERIFY: Redirects to `/client/dashboard`

#### Step 4: Dashboard Verification
- ✅ VERIFY: Shows client-specific UI
- ✅ VERIFY: "نشر مشروع" (Post Job) button visible
- ✅ VERIFY: Database:
  ```sql
  SELECT * FROM client_profiles 
  WHERE id = (SELECT id FROM profiles WHERE email = 'YOUR_CLIENT_EMAIL');
  ```

### Pass Criteria
- ✅ Client onboarding completes in 1 step
- ✅ Correct dashboard loads
- ✅ Client profile saved

---

## FLOW 3: JOB POSTING & HIRING

### Prerequisites
- Have a client account (from Flow 2)
- Have a freelancer account with proposal (from Flow 1)

### Test Execution

#### Step 1: Post Job
- Login as client
- Navigate to `/jobs/new`
- Fill job form:
  - Title: "تطوير موقع إلكتروني للتجارة الإلكترونية"
  - Description: "نحتاج إلى موقع متجر إلكتروني متكامل..."
  - Budget: 2000
  - Budget Type: Fixed
  - Required Skills: ["React", "Node.js", "MongoDB"]
  - Deadline: Select date 30 days from now
- Click "نشر المشروع" (Post Job)
- ✅ VERIFY: Redirects to `/jobs/posted/:jobId`
- ✅ VERIFY: Job appears in `/jobs` (public job board)

#### Step 2: Review Proposals
- Navigate to `/client/jobs/:jobId/proposals`
- ✅ VERIFY: Proposals list loads
- ✅ VERIFY: Each proposal shows:
  - Freelancer name & avatar
  - Bid amount
  - Delivery time
  - Cover letter
  - Action buttons (Message, Shortlist, Hire)

#### Step 3: Shortlist Proposal
- Click "إضافة للقائمة المختصرة" (Add to Shortlist)
- ✅ VERIFY: Button UI changes
- ✅ VERIFY: Toast shows success
- ✅ VERIFY: Database updated:
  ```sql
  SELECT status FROM proposals WHERE id = 'PROPOSAL_ID';
  -- Should be 'shortlisted'
  ```

#### Step 4: Hire Freelancer
- Click "توظيف" (Hire) on a proposal
- ✅ VERIFY: Confirmation dialog appears
- Confirm hiring
- ✅ WAIT: Loading state shows (2-3 seconds)
- ✅ VERIFY: Success toast
- ✅ VERIFY: Redirects to `/contracts/:contractId`
- ✅ VERIFY: Database changes:
  ```sql
  -- 1. Proposal accepted
  SELECT status FROM proposals WHERE id = 'HIRED_PROPOSAL_ID';
  -- Should be 'accepted'
  
  -- 2. Other proposals rejected
  SELECT status FROM proposals 
  WHERE job_id = 'JOB_ID' AND id != 'HIRED_PROPOSAL_ID';
  -- Should all be 'rejected'
  
  -- 3. Contract created
  SELECT * FROM contracts WHERE job_id = 'JOB_ID';
  -- Should have 1 row with status = 'active'
  
  -- 4. Job status updated
  SELECT status FROM jobs WHERE id = 'JOB_ID';
  -- Should be 'in_progress'
  
  -- 5. Notification sent
  SELECT * FROM notifications 
  WHERE user_id = 'FREELANCER_ID' 
  ORDER BY created_at DESC LIMIT 1;
  -- Should have message about proposal acceptance
  ```

### Pass Criteria
- ✅ Job posts successfully
- ✅ Proposals load correctly
- ✅ Shortlist toggles work
- ✅ Hire creates contract
- ✅ All database updates atomic
- ✅ Notifications sent

---

## FLOW 4: CONTRACT EXECUTION

### Prerequisites
- Active contract (from Flow 3)

### Test Execution

#### Step 1: Access Contract Workspace
- Navigate to `/contracts/:contractId`
- ✅ VERIFY: Contract details sidebar shows:
  - Job title
  - Client & freelancer names
  - Contract amount
  - Status
  - Milestones (if any)

#### Step 2: Real-time Chat
- Type message in chat: "مرحباً، سأبدأ العمل الآن"
- Click send
- ✅ VERIFY: Message appears immediately
- ✅ VERIFY: No page refresh needed
- ✅ VERIFY: Database:
  ```sql
  SELECT * FROM messages 
  WHERE contract_id = 'CONTRACT_ID' 
  ORDER BY created_at DESC LIMIT 1;
  ```

#### Step 3: File Upload
- Click attachment icon in chat
- Select a file (PDF, image, etc.)
- ✅ VERIFY: Upload progress shows
- ✅ VERIFY: File appears in chat
- ✅ VERIFY: File URL is accessible (click to open)

#### Step 4: Test in Two Browser Windows
- Open contract in two different browsers (or incognito)
- Login as client in one, freelancer in other
- Send message from one
- ✅ VERIFY: Message appears in real-time in other window
- ✅ VERIFY: No polling, uses Supabase Realtime

#### Step 5: Complete Contract (Client Side)
- As client, click "قبول التسليم" (Accept Delivery)
- ✅ VERIFY: Contract status → 'completed'
- ✅ VERIFY: Payment released (in production, actual payment)

#### Step 6: Leave Review
- Click "ترك تقييم" (Leave Review)
- Rate: 5 stars
- Comment: "عمل ممتاز، احترافية عالية"
- Submit
- ✅ VERIFY: Review saved
- ✅ VERIFY: Review appears on freelancer profile

### Pass Criteria
- ✅ Real-time chat works
- ✅ File uploads work
- ✅ Two-way communication verified
- ✅ Contract completion flow works
- ✅ Review system functional

---

## FLOW 5: IDENTITY VERIFICATION

### Test Execution

#### Step 1: Access Verification Page
- Login as any user
- Navigate to `/verify-identity` or Settings → Identity Verification

#### Step 2: Upload CIN Front
- Click "Upload Front" area
- Select CIN front image
- ✅ VERIFY: Preview shows
- ✅ VERIFY: File size validated (<5MB)

#### Step 3: Upload CIN Back
- Click "Upload Back" area
- Select CIN back image
- ✅ VERIFY: Preview shows

#### Step 4: Submit for Review
- Click "إرسال للمراجعة" (Submit for Review)
- ✅ VERIFY: Loading state
- ✅ VERIFY: Success message
- ✅ VERIFY: Database:
  ```sql
  SELECT cin_submitted, cin_verified FROM profiles 
  WHERE id = 'USER_ID';
  -- cin_submitted should be true
  -- cin_verified should be false (pending admin review)
  ```

#### Step 5: Admin Review
- Login as admin
- Navigate to `/admin/verifications`
- ✅ VERIFY: Pending verifications list shows
- Click on verification request
- ✅ VERIFY: CIN images display
- Click "Approve" or "Reject"
- ✅ VERIFY: If approved:
  ```sql
  SELECT cin_verified FROM profiles WHERE id = 'USER_ID';
  -- Should be true
  ```

### Pass Criteria
- ✅ File upload works
- ✅ Validation works
- ✅ Admin queue shows submissions
- ✅ Approval updates database
- ✅ User sees verification badge

---

## 🎯 FINAL VALIDATION CHECKLIST

After completing all 5 flows:

### Database Integrity
```sql
-- No orphaned data
SELECT COUNT(*) FROM freelancer_profiles 
WHERE id NOT IN (SELECT id FROM profiles);
-- Should be 0

-- All onboarded users have correct flags
SELECT COUNT(*) FROM profiles 
WHERE user_type IS NOT NULL 
AND onboarding_completed = false;
-- Should be 0 (or only incomplete registrations)

-- All contracts have valid references
SELECT COUNT(*) FROM contracts 
WHERE job_id NOT IN (SELECT id FROM jobs);
-- Should be 0
```

### Performance Check
- ✅ All pages load < 3 seconds
- ✅ No JavaScript errors in console
- ✅ No memory leaks (check DevTools Memory tab)
- ✅ Images lazy load
- ✅ Code splits properly (check Network tab)

### Security Check
- ✅ Cannot access other users' data
- ✅ RLS policies enforced
- ✅ Protected routes redirect to login
- ✅ No sensitive data in client-side code

### UI/UX Check
- ✅ RTL layout correct for Arabic
- ✅ Dark mode works
- ✅ Mobile responsive
- ✅ Loading states show
- ✅ Error messages clear
- ✅ Success feedback immediate

---

## 📊 Test Results Template

```
# Flow Testing Results
Date: {{DATE}}
Tester: {{NAME}}

## Flow 1: Freelancer Registration
- [ ] Signup works
- [ ] Type selection works
- [ ] Onboarding completes
- [ ] Dashboard loads
- [ ] Job application works
Issues found: ___________

## Flow 2: Client Registration
- [ ] Signup works
- [ ] Type selection works
- [ ] Onboarding completes
- [ ] Dashboard loads
Issues found: ___________

## Flow 3: Job Posting & Hiring
- [ ] Job posts successfully
- [ ] Proposals load
- [ ] Shortlist works
- [ ] Hire creates contract
Issues found: ___________

## Flow 4: Contract Execution
- [ ] Real-time chat works
- [ ] File upload works
- [ ] Contract completion works
- [ ] Review submission works
Issues found: ___________

## Flow 5: Identity Verification
- [ ] File upload works
- [ ] Admin queue works
- [ ] Approval updates database
Issues found: ___________

## Overall Assessment
Pass Rate: ___/5 flows
Ready for Production: [ ] Yes [ ] No
Blockers: ___________
```

---

## 🚀 Next Steps

After all flows pass:
1. Proceed to PHASE 2: Performance Testing
2. Generate detailed bug report if issues found
3. Re-test failed flows after fixes
