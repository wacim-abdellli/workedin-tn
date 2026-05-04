# Hardcoded Strings Report

## ClientDashboard.tsx

- Line 288: `Profile unavailable`
  ```
  'Profile unavailable',
  ```

## ClientOnboarding.tsx

- Line 42: `Company`
  ```
  company_name: data.accountType === "Company" ? data.companyName.trim() || undefined : undefined,
  ```

## ClientProfile.tsx

- Line 445: `Failed to update client profile`
  ```
  logger.error("Failed to update client profile", error);
  ```

- Line 450: `Failed to update client profile`
  ```
  "Failed to update client profile",
  ```

- Line 517: `Error starting client conversation`
  ```
  logger.error("Error starting client conversation", error);
  ```

- Line 868: `Hiring needs`
  ```
  <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-tertiary)" }}>Hiring needs
  ```

- Line 988: `Phone Verified`
  ```
  { label: "Phone Verified", passed: false },
  ```

- Line 989: `Payment Method`
  ```
  { label: "Payment Method", passed: false },
  ```

## ContractsList.tsx

- Line 128: `Hourly`
  ```
  typeLabel: "Hourly",
  ```

- Line 153: `Completed`
  ```
  fallbackLabel: "Completed",
  ```

- Line 163: `Cancelled`
  ```
  fallbackLabel: "Cancelled",
  ```

- Line 172: `Active`
  ```
  fallbackLabel: "Active",
  ```

## ContractWorkspace.tsx

- Line 68: `No contract id`
  ```
  if (!contractId) throw new Error('No contract id');
  ```

- Line 70: `Not found`
  ```
  if (error || !data) throw error || new Error('Not found');
  ```

- Line 308: `Missing data`
  ```
  if (!contractId || !user?.id || !contractData) throw new Error('Missing data');
  ```

## ContractWorkspacePage.tsx

- Line 78: `Overview`
  ```
  {['Overview', 'Files', 'Milestones', 'Activity'].map(t => (
  ```

- Line 78: `Files`
  ```
  {['Overview', 'Files', 'Milestones', 'Activity'].map(t => (
  ```

- Line 78: `Milestones`
  ```
  {['Overview', 'Files', 'Milestones', 'Activity'].map(t => (
  ```

- Line 78: `Activity`
  ```
  {['Overview', 'Files', 'Milestones', 'Activity'].map(t => (
  ```

- Line 233: `Counterparty`
  ```
  senderName: msg.sender_id === user.id ? (profile?.full_name || 'You') : 'Counterparty',
  ```

- Line 285: `Client`
  ```
  client: userRole === 'client' ? selfProfile : { full_name: 'Client', avatar_url: null },
  ```

- Line 286: `Freelancer`
  ```
  freelancer: userRole === 'freelancer' ? selfProfile : { full_name: 'Freelancer', avatar_url: null },
  ```

- Line 488: `Submit delivery`
  ```
  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#55534F]">Submit delivery<
  ```

- Line 489: `Describe your delivery`
  ```
  <h2 id="modal-deliver-title" className="text-[16px] font-semibold text-[#F0EFE8]">Describe your deli
  ```

- Line 508: `Submit delivery`
  ```
  {isDelivering ? 'Submitting…' : 'Submit delivery'}
  ```

## FindFreelancers.tsx

- Line 20: `Design`
  ```
  | 'Design'
  ```

- Line 21: `Development`
  ```
  | 'Development'
  ```

- Line 22: `Writing`
  ```
  | 'Writing'
  ```

- Line 23: `Marketing`
  ```
  | 'Marketing'
  ```

- Line 24: `Video`
  ```
  | 'Video'
  ```

- Line 25: `Consulting`
  ```
  | 'Consulting';
  ```

- Line 68: `Design`
  ```
  const CATEGORY_OPTIONS: FreelancerCategory[] = ['Design', 'Development', 'Writing', 'Marketing', 'Vi
  ```

- Line 68: `Development`
  ```
  const CATEGORY_OPTIONS: FreelancerCategory[] = ['Design', 'Development', 'Writing', 'Marketing', 'Vi
  ```

- Line 68: `Writing`
  ```
  const CATEGORY_OPTIONS: FreelancerCategory[] = ['Design', 'Development', 'Writing', 'Marketing', 'Vi
  ```

- Line 68: `Marketing`
  ```
  const CATEGORY_OPTIONS: FreelancerCategory[] = ['Design', 'Development', 'Writing', 'Marketing', 'Vi
  ```

## FreelancerDashboard.tsx

- Line 93: `Viewed by Client`
  ```
  "Viewed by Client",
  ```

- Line 100: `Shortlisted`
  ```
  "Shortlisted",
  ```

- Line 107: `Submitted`
  ```
  "Submitted",
  ```

- Line 349: `Avatar uploaded`
  ```
  "Avatar uploaded",
  ```

- Line 363: `Skills added`
  ```
  "Skills added",
  ```

- Line 372: `Professional title`
  ```
  "Professional title",
  ```

- Line 381: `Identity verified`
  ```
  "Identity verified",
  ```

- Line 390: `Tools listed`
  ```
  "Tools listed",
  ```

- Line 399: `Project preferences`
  ```
  "Project preferences",
  ```

- Line 422: `Freelancer`
  ```
  const firstName = profile?.full_name?.split(" ")[0] || "Freelancer";
  ```

## FreelancerEarnings.tsx

- Line 218: `Available Balance`
  ```
  "Available Balance",
  ```

- Line 255: `Total Earned`
  ```
  "Total Earned",
  ```

- Line 264: `This Month`
  ```
  "This Month",
  ```

- Line 274: `Completed Contracts`
  ```
  "Completed Contracts",
  ```

- Line 332: `Earnings Overview`
  ```
  "Earnings Overview",
  ```

- Line 352: `Up vs last month`
  ```
  "Up vs last month",
  ```

- Line 357: `Down vs last month`
  ```
  "Down vs last month",
  ```

- Line 406: `Earnings`
  ```
  "Earnings",
  ```

- Line 432: `Payment History`
  ```
  "Payment History",
  ```

- Line 453: `No transactions yet`
  ```
  "No transactions yet",
  ```

## FreelancerOnboarding.tsx

- Line 54: `As needed`
  ```
  data.availability === "As needed"
  ```

## FreelancerProfile.tsx

- Line 203: `Could not update profile picture`
  ```
  return 'Could not update profile picture';
  ```

- Line 498: `Promise`
  ```
  onSaveAvatar: (file: File) => Promise<void>;
  ```

- Line 504: `Promise`
  ```
  }) => Promise<void>;
  ```

- Line 505: `Promise`
  ```
  onSaveBio: (bio: string) => Promise<void>;
  ```

- Line 506: `Promise`
  ```
  onSaveSkills: (skills: string[]) => Promise<void>;
  ```

- Line 507: `Promise`
  ```
  onSaveTools: (tools: string[]) => Promise<void>;
  ```

- Line 508: `Promise`
  ```
  onRefreshWorkSamples: () => Promise<void>;
  ```

- Line 568: `Available`
  ```
  { value: 'available', label: 'Available' },
  ```

- Line 569: `Busy`
  ```
  { value: 'busy', label: 'Busy' },
  ```

- Line 570: `Offline`
  ```
  { value: 'offline', label: 'Offline' },
  ```

## JobBoard.tsx

- Line 77: `Hourly`
  ```
  { value: 'hourly' as const, label: 'Hourly' },
  ```

- Line 89: `Newest First`
  ```
  { value: 'newest', label: 'Newest First' },
  ```

- Line 92: `Most Proposals`
  ```
  { value: 'proposals_high', label: 'Most Proposals' },
  ```

- Line 93: `Least Proposals`
  ```
  { value: 'proposals_low', label: 'Least Proposals' },
  ```

- Line 142: `Skill`
  ```
  if (language === 'ar') return skill.name_ar || skill.name_en || 'Skill';
  ```

- Line 143: `Skill`
  ```
  if (language === 'fr') return skill.name_fr || skill.name_en || 'Skill';
  ```

- Line 144: `Skill`
  ```
  return skill.name_en || 'Skill';
  ```

- Line 156: `Budget not specified`
  ```
  return 'Budget not specified';
  ```

- Line 392: `Removed from saved jobs`
  ```
  showToast(isSaved ? 'Removed from saved jobs' : 'Saved job', 'success');
  ```

- Line 392: `Saved job`
  ```
  showToast(isSaved ? 'Removed from saved jobs' : 'Saved job', 'success');
  ```

## JobDetail.tsx

- Line 293: `No job ID`
  ```
  if (!jobId) throw new Error("No job ID");
  ```

- Line 295: `Failed to load job`
  ```
  if (error) throw new Error(error.message ?? 'Failed to load job');
  ```

- Line 520: `Missing auth or job`
  ```
  if (!user || !jobId) throw new Error("Missing auth or job");
  ```

- Line 532: `Failed to submit proposal`
  ```
  if (error) throw new Error(error.message ?? 'Failed to submit proposal');
  ```

- Line 616: `No proposal to withdraw`
  ```
  if (!myProposal) throw new Error("No proposal to withdraw");
  ```

- Line 618: `Failed to withdraw proposal`
  ```
  if (error) throw new Error(error.message ?? 'Failed to withdraw proposal');
  ```

## JobPost.tsx

- Line 46: `Job details`
  ```
  label: 'Job details',
  ```

- Line 56: `Visibility`
  ```
  label: 'Visibility',
  ```

- Line 61: `Review`
  ```
  label: 'Review',
  ```

- Line 70: `Logo design for a food company`
  ```
  'Logo design for a food company',
  ```

- Line 71: `Landing page redesign for SaaS product`
  ```
  'Landing page redesign for SaaS product',
  ```

- Line 73: `React dashboard with analytics widgets`
  ```
  'React dashboard with analytics widgets',
  ```

- Line 78: `Scope`
  ```
  label: 'Scope',
  ```

- Line 82: `Deliverables`
  ```
  label: 'Deliverables',
  ```

- Line 86: `Success`
  ```
  label: 'Success',
  ```

- Line 406: `Clear title`
  ```
  { id: 'title', label: 'Clear title', pass: title.trim().length >= 12 },
  ```

## JobProposals.tsx

- Line 37: `Shortlisted`
  ```
  { key: 'shortlisted', label: 'Shortlisted' },
  ```

- Line 38: `Archived`
  ```
  { key: 'archived', label: 'Archived' },
  ```

- Line 283: `Failed to generate AI recommendations`
  ```
  logger.warn('Failed to generate AI recommendations', error);
  ```

- Line 289: `Failed to fetch proposals`
  ```
  logger.error('Failed to fetch proposals', error);
  ```

- Line 329: `Job Opportunity`
  ```
  title: job?.title || 'Job Opportunity',
  ```

- Line 330: `Job Opportunity`
  ```
  text: `Check out this job: ${job?.title || 'Job Opportunity'}`,
  ```

- Line 333: `Shared successfully`
  ```
  showToast('Shared successfully', 'success');
  ```

- Line 337: `Job link copied to clipboard`
  ```
  showToast('Job link copied to clipboard', 'success');
  ```

- Line 341: `AbortError`
  ```
  if (error instanceof Error && error.name !== 'AbortError') {
  ```

- Line 344: `Job link copied to clipboard`
  ```
  showToast('Job link copied to clipboard', 'success');
  ```

## LeaveReview.tsx

- Line 51: `Poor`
  ```
  1: "Poor",
  ```

- Line 52: `Fair`
  ```
  2: "Fair",
  ```

- Line 53: `Good`
  ```
  3: "Good",
  ```

- Line 54: `Very Good`
  ```
  4: "Very Good",
  ```

- Line 55: `Excellent`
  ```
  5: "Excellent",
  ```

- Line 88: `Rating`
  ```
  aria-label="Rating"
  ```

- Line 322: `Reviews open after completion`
  ```
  "Reviews open after completion",
  ```

## Login.tsx

- Line 83: `Too many`
  ```
  if (message.includes('Too many') || message.includes('Rate limit')) {
  ```

- Line 83: `Rate limit`
  ```
  if (message.includes('Too many') || message.includes('Rate limit')) {
  ```

- Line 85: `Invalid login credentials`
  ```
  } else if (message.includes('Invalid login credentials')) {
  ```

- Line 87: `Email not confirmed`
  ```
  } else if (message.includes('Email not confirmed')) {
  ```

- Line 163: `Verified profiles`
  ```
  { title: 'Verified profiles', sub: 'Every identity confirmed', icon: ShieldCheck, color: '#10b981', 
  ```

- Line 163: `Every identity confirmed`
  ```
  { title: 'Verified profiles', sub: 'Every identity confirmed', icon: ShieldCheck, color: '#10b981', 
  ```

- Line 164: `Escrow payments`
  ```
  { title: 'Escrow payments', sub: 'Funds held until delivery', icon: Lock, color: '#E8820C', bg: 'rgb
  ```

- Line 164: `Funds held until delivery`
  ```
  { title: 'Escrow payments', sub: 'Funds held until delivery', icon: Lock, color: '#E8820C', bg: 'rgb
  ```

- Line 165: `Optimised for Tunisia`
  ```
  { title: 'Local & global', sub: 'Optimised for Tunisia', icon: Globe2, color: '#3b82f6', bg: 'rgba(5
  ```

## Messages.tsx

- Line 194: `FILE`
  ```
  return normalizedMimeType.split('/')[1]?.toUpperCase() || 'FILE';
  ```

- Line 197: `FILE`
  ```
  return 'FILE';
  ```

- Line 473: `Work delivered and ready for review`
  ```
  text: details || 'Work delivered and ready for review',
  ```

- Line 480: `Revision requested by client`
  ```
  text: details || 'Revision requested by client',
  ```

- Line 487: `Contract completed and payment released`
  ```
  text: details || 'Contract completed and payment released',
  ```

- Line 494: `Dispute opened for this contract`
  ```
  text: details || 'Dispute opened for this contract',
  ```

- Line 501: `Review submitted`
  ```
  text: details || 'Review submitted',
  ```

- Line 536: `Audio note`
  ```
  resolvedPreviewText = 'Audio note';
  ```

- Line 538: `Image`
  ```
  resolvedPreviewText = 'Image';
  ```

- Line 540: `Attachment`
  ```
  resolvedPreviewText = 'Attachment';
  ```

## MyProposals.tsx

- Line 412: `Enter`
  ```
  if (e.key !== 'Enter') return;
  ```

## PaymentSuccess.tsx

- Line 93: `SUCCESS`
  ```
  if (verification.status !== 'SUCCESS') {
  ```

- Line 143: `Contract is missing a freelancer reference`
  ```
  throw new Error('Contract is missing a freelancer reference');
  ```

- Line 157: `SUCCESS`
  ```
  if (verification.status !== 'SUCCESS') {
  ```

## SavedJobs.tsx

- Line 14: `Hourly`
  ```
  jobType: 'Fixed-price' | 'Hourly';
  ```

- Line 63: `Posted recently`
  ```
  return 'Posted recently';
  ```

- Line 69: `Posted today`
  ```
  if (diffDays === 0) return 'Posted today';
  ```

- Line 91: `Saved Jobs`
  ```
  const title = isFreelancer ? 'Saved Jobs' : 'Saved Talent';
  ```

- Line 91: `Saved Talent`
  ```
  const title = isFreelancer ? 'Saved Jobs' : 'Saved Talent';
  ```

- Line 131: `Browse Jobs`
  ```
  {isFreelancer ? 'Browse Jobs' : 'Browse Freelancers'}
  ```

- Line 131: `Browse Freelancers`
  ```
  {isFreelancer ? 'Browse Jobs' : 'Browse Freelancers'}
  ```

- Line 256: `Hourly`
  ```
  jobType: (job.job_type === 'hourly' ? 'Hourly' : 'Fixed-price') as SavedJobItem['jobType'],
  ```

- Line 345: `Freelancer`
  ```
  name: freelancer.full_name || 'Freelancer',
  ```

- Line 346: `Freelancer`
  ```
  title: profile?.title || 'Freelancer',
  ```

## SearchResults.tsx

- Line 498: `Enter`
  ```
  onKeyDown={(e) => e.key === 'Enter' && handleSearch(inputValue)}
  ```

## Settings.tsx

- Line 93: `Freelancer`
  ```
  <p className="text-sm font-semibold text-on-surface">{activeMode === 'freelancer' ? 'Freelancer' : '
  ```

- Line 93: `Client`
  ```
  <p className="text-sm font-semibold text-on-surface">{activeMode === 'freelancer' ? 'Freelancer' : '
  ```

- Line 100: `Identity`
  ```
  <p className="text-xs text-on-surface-subtle mb-1">Identity</p>
  ```

- Line 103: `Identity Verified`
  ```
  {identityVerified ? 'Identity Verified' : identityPending ? 'Verification Under Review' : 'Not Verif
  ```

- Line 103: `Verification Under Review`
  ```
  {identityVerified ? 'Identity Verified' : identityPending ? 'Verification Under Review' : 'Not Verif
  ```

- Line 103: `Not Verified`
  ```
  {identityVerified ? 'Identity Verified' : identityPending ? 'Verification Under Review' : 'Not Verif
  ```

- Line 192: `Failed to load notification settings`
  ```
  logger.error('Failed to load notification settings', error);
  ```

- Line 203: `New job matches`
  ```
  { key: 'new_job', title: 'New job matches', description: 'Get notified when jobs match your skills' 
  ```

- Line 203: `Get notified when jobs match your skills`
  ```
  { key: 'new_job', title: 'New job matches', description: 'Get notified when jobs match your skills' 
  ```

- Line 204: `New messages`
  ```
  { key: 'messages', title: 'New messages', description: 'Get notified when you receive new messages' 
  ```

## Signup.tsx

- Line 89: `User already registered`
  ```
  if (message.includes('User already registered')) {
  ```

## VerifyIdentity.tsx

- Line 65: `Failed to fetch verification status`
  ```
  logger.error('Failed to fetch verification status', error);
  ```

- Line 229: `User`
  ```
  full_name: authUserMetadata?.full_name || user.email?.split('@')[0] || 'User',
  ```

- Line 251: `Verify identity insert`
  ```
  'Verify identity insert'
  ```

## Wallet.tsx

- Line 84: `UPDATE`
  ```
  event: 'UPDATE',
  ```