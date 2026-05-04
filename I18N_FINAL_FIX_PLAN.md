# Complete i18n Fix Plan

Based on the hardcoded strings report, here are ALL the strings that need translation keys added:

## High Priority (User-Facing UI)

### ClientDashboard.tsx
- ✅ Already uses tx() - just needs keys verified

### FreelancerDashboard.tsx
- "Viewed by Client", "Shortlisted", "Submitted" - proposal status badges
- "Avatar uploaded", "Skills added", "Professional title", etc. - checklist items

### FreelancerEarnings.tsx
- "Available Balance", "Total Earned", "This Month", "Completed Contracts"
- "Earnings Overview", "Up vs last month", "Down vs last month"
- "Payment History", "No transactions yet"

### JobBoard.tsx
- "Hourly", "Newest First", "Most Proposals", "Least Proposals"
- "Removed from saved jobs", "Saved job"

### SavedJobs.tsx
- "Saved Jobs", "Saved Talent", "Browse Jobs", "Browse Freelancers"
- "Posted recently", "Posted today"

### Settings.tsx
- "Freelancer", "Client", "Identity", "Identity Verified"
- "Verification Under Review", "Not Verified"
- "New job matches", "New messages"

### LeaveReview.tsx
- "Poor", "Fair", "Good", "Very Good", "Excellent"
- "Reviews open after completion"

### ContractWorkspace.tsx & ContractWorkspacePage.tsx
- "Overview", "Files", "Milestones", "Activity"
- "Submit delivery", "Describe your delivery"
- "Client", "Freelancer", "Counterparty"

### Messages.tsx (System Messages)
- "Work delivered and ready for review"
- "Revision requested by client"
- "Contract completed and payment released"
- "Dispute opened for this contract"
- "Review submitted"
- "Audio note", "Image", "Attachment", "FILE"

## Medium Priority (Form Labels & Validation)

### JobPost.tsx
- Step labels, example titles, quality indicators

### ClientProfile.tsx & FreelancerProfile.tsx
- "Hiring needs", "Phone Verified", "Payment Method"
- Availability options: "Available", "Busy", "Offline"

### FindFreelancers.tsx
- Category options: "Design", "Development", "Writing", "Marketing", "Video", "Consulting"

## Low Priority (Error Messages & Technical)

### Various Error Messages
- "Failed to update", "Missing data", "No contract id", etc.
- These are mostly for logging and can stay in English

## Action Plan

1. ✅ Messages page - DONE
2. ✅ ContractWorkspacePage - DONE  
3. ⏳ Add all missing keys to ar.ts, en.ts, fr.ts
4. ⏳ Update components to use tx() for remaining hardcoded strings
5. ⏳ Test all pages in all three languages

