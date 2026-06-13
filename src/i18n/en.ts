import type { Translations } from './ar';

export const en: Translations = {
    "accountStatus": {
        "archived": {
            "body": "This account is archived and can no longer access protected platform features. Contact support for assistance.",
            "title": "Account archived"
        },
        "suspended": {
            "body": "Your account access is temporarily suspended. Contact support if you need help or think this is a mistake.",
            "title": "Account suspended"
        }
    },
    "admin": {
        "backToSite": "Back to site",
        "debug": {
            "accessTest": "Admin Access Test",
            "bypassingClient": "Bypassing Supabase JS client entirely - using raw fetch()",
            "clientProblem": "This means RLS policies are fine, but the JS client has a problem.",
            "directQueries": "Direct Supabase Queries (No React Query)",
            "executionLog": "Execution Log:",
            "queryHanging": "The query is hanging. This suggests an RLS policy issue causing infinite loops or a network problem.",
            "queryWorks": "The database query works. The issue is with React Query or component lifecycle.",
            "requestTimedOut": "The request took longer than 5 seconds. Network or database issue.",
            "restApiTest": "Direct REST API Query Test",
            "rlsBlocking": "RLS is blocking the query. Your account is not recognized as admin.",
            "successMsg": "The REST API works directly. The issue is with the Supabase JS client."
        },
        "subtitle": "System Control Center",
        "tabs": {
            "disputes": "Disputes",
            "jobs": "Jobs",
            "overview": "Overview",
            "payments": "Payments",
            "reports": "Reports",
            "settings": "Settings",
            "users": "Users",
            "verifications": "Verification"
        },
        "title": "Admin Dashboard"
    },
    "auth": {
        "accountPanel": {
            "adminDashboard": "Admin Dashboard",
            "clientDesc": "Post projects, compare proposals, and release escrow payments.",
            "clientFeatureEscrow": "Escrow-protected payments",
            "clientFeaturePostProjects": "Post projects for free",
            "clientFeatureReviewProposals": "Review verified proposals",
            "clientHint": "Finish the client basics here first, then manage billing and company details in Settings.",
            "clientLabel": "Client",
            "completeSetup": "Complete setup",
            "current": "Current",
            "darkTheme": "Dark theme",
            "defaultUser": "WorkedIn User",
            "enable": "Enable",
            "enableBothAction": "Enable both roles",
            "enableBothDesc": "Access client hiring dashboard and freelancer profile under a single credentials login.",
            "enableBothLabel": "Enable both workspace roles",
            "freelancerDesc": "Find work, send proposals, and get paid in TND.",
            "freelancerFeatureBrowseJobs": "Browse and apply to jobs",
            "freelancerFeaturePortfolio": "Build public portfolio",
            "freelancerFeatureReceivePayments": "Receive payments in TND",
            "freelancerHint": "Complete the core freelancer details here, then polish the rest later in Settings.",
            "freelancerLabel": "Freelancer",
            "goToWorkspace": "Go to {{workspace}}",
            "language": "Language",
            "logoutAction": "Sign out",
            "logoutDesc": "End this session safely on this device.",
            "manageProfile": "Manage profile",
            "needsSetup": "Needs setup",
            "onlineForMessages": "Online for messages",
            "profileAction": "Profile",
            "progressLabel": "Profile completion",
            "ready": "Ready",
            "sectionLabel": "Workspace",
            "settingsAction": "Settings",
            "setupInFiveMinutes": "Set up in 5 min",
            "statusPending": "Pending",
            "statusPro": "Pro",
            "switchAction": "Switch",
            "switchError": "We could not switch your workspace right now.",
            "switchInstantly": "Switch instantly",
            "switchOver": "Switch over",
            "switchWorkspace": "Switch workspace",
            "switchWorkspaceBoth": "Use the same account to hire and freelance without separate logins.",
            "switchWorkspaceSingle": "Enable the second workspace only when you actually need it.",
            "switchedClient": "Client workspace is now active.",
            "switchedFreelancer": "Freelancer workspace is now active.",
            "switching": "Switching",
            "tools": "Account tools",
            "walletAndEarnings": "Wallet & earnings",
            "workspaceActive": "Active Workspace"
        },
        "both": "Both",
        "client": "Client",
        "completeProfile": "Complete Registration",
        "confirmPassword": "Confirm Password",
        "confirmPasswordPlaceholder": "Re-enter your password",
        "createAccount": "Create Account",
        "email": "Email",
        "emailExists": "This email is already registered",
        "emailNotConfirmed": "Email not confirmed",
        "emailPlaceholder": "Enter your email",
        "forgotPassword": "Forgot password?",
        "forgotPasswordForm": {
            "error": "Error sending reset link",
            "rateLimited": "Too many attempts. Try again later.",
            "sendTitle": "Send reset link",
            "sent": "Reset link sent"
        },
        "freelancer": "Freelancer",
        "googleLogin": "Continue with Google",
        "googleLoginError": "Google login failed",
        "hasAccount": "Already have an account?",
        "invalidCredentials": "Invalid email or password",
        "invalidEmail": "Enter a valid email address",
        "loggingOut": "Logging out...",
        "login": "Sign in",
        "loginSubtitle": "Welcome back. Your work is waiting.",
        "loginTitle": "Sign in to WorkedIn",
        "noAccount": "Don't have an account?",
        "or": "or",
        "password": {
            "hide": "Hide password",
            "label": "Password",
            "new": "New Password",
            "show": "Show password"
        },
        "passwordMinLength": "Password must be at least 6 characters",
        "passwordMismatch": "Passwords do not match",
        "passwordPlaceholder": {
            "new": "Enter your new password"
        },
        "passwordRequirements": {
            "req1": "• At least 8 characters",
            "req2": "• At least one uppercase letter",
            "req3": "• At least one lowercase letter",
            "req4": "• At least one number",
            "title": "Password Requirements:"
        },
        "passwordStrength": {
            "label": "Password strength",
            "medium": "Medium",
            "strong": "Strong",
            "weak": "Weak"
        },
        "passwordValidation": {
            "lowercase": "Must contain at least one lowercase letter",
            "minLength": "Password must be at least 8 characters",
            "number": "Must contain at least one number",
            "uppercase": "Must contain at least one uppercase letter"
        },
        "phone": "Phone Number",
        "phonePlaceholder": "Enter your phone number",
        "resendCode": "Resend Code",
        "resendIn": "Resend in",
        "resetPassword": {
            "error": "Error changing password",
            "expiredLink": "Expired Link",
            "invalidLinkDesc": "Invalid reset link.",
            "linkExpired": "Reset link expired",
            "redirecting": "Redirecting to login...",
            "requestNewLink": "Request New Link",
            "setNew": "Set New Password",
            "setNewDesc": "Enter your new password",
            "setNewTitle": "Set new password",
            "success": "Password changed successfully",
            "successDesc": "You can now log in with your new password."
        },
        "seconds": "seconds",
        "selectUserType": "How will you use WorkedIn?",
        "selectUserTypeSubtitle": "You can always add the other role later from settings.",
        "sendCode": "Send Verification Code",
        "sessionExpired": "Your session has expired. Please sign in again.",
        "signOut": "Sign Out",
        "signup": "Create account",
        "signupSubtitle": "Join 2,500+ professionals building their career on WorkedIn.",
        "signupTitle": "Create your account",
        "socialProof": "professionals already on WorkedIn",
        "userTypeBothDesc": "I do both — I work and I hire",
        "userTypeClientDesc": "I have projects and need reliable professionals",
        "userTypeFreelancerDesc": "I offer skills and want to get paid for my work",
        "validation": {
            "invalidEmail": "أدخ�\u001e بر�`د إ�\u001eْتر��� �` صح�`ح",
            "password": {
                "lowercase": "Must contain at least one lowercase letter",
                "match": "Passwords do not match",
                "minLength": "Password must be at least 8 characters",
                "number": "Must contain at least one number",
                "uppercase": "Must contain at least one uppercase letter"
            }
        },
        "verify": "Verify",
        "verifyCode": "Verification Code"
    },
    "authPages": {
        "login": {
            "badge": "WorkedIn",
            "createAccountAction": "Create account",
            "featureCards": {
                "escrow": {
                    "sub": "Funds held until delivery",
                    "title": "Escrow payments"
                },
                "local": {
                    "sub": "Optimised for Tunisia",
                    "title": "Local & global"
                },
                "verified": {
                    "sub": "Every identity confirmed",
                    "title": "Verified profiles"
                }
            },
            "finishingSignIn": "Securing session...",
            "finishingSignInDescription": "Hang tight while we prepare your workspace.",
            "form": {
                "createOne": "Create one",
                "emailLabel": "Email",
                "forgotPassword": "Forgot password?",
                "google": "Continue with Google",
                "noAccount": "Don't have an account?",
                "orEmail": "or sign in with email",
                "passwordLabel": "Password",
                "signInButton": "Sign in →",
                "signingIn": "Signing in…",
                "subtitle": "Sign in to your WorkedIn workspace.",
                "welcomeBack": "Welcome back."
            },
            "hero": {
                "earnFairly": "Earn fairly.",
                "workSmarter": "Work smarter."
            },
            "heroDescription": "Access your workspace, manage projects securely, and connect with top talent across Tunisia.",
            "heroTitle": "Welcome back. Let's get to work.",
            "highlightLocaleDescription": "Optimized for local talent with fast transactions.",
            "highlightLocaleTitle": "Local & Global",
            "highlightPaymentsDescription": "Funds are held safely until the milestone or project is delivered.",
            "highlightPaymentsTitle": "Secure Payments",
            "highlightTrustDescription": "Work with confidence. Every profile and skill is verified.",
            "highlightTrustTitle": "Verified Profiles",
            "platformSubtitle": "Connect with verified talent, manage projects securely, and get paid in TND — every time.",
            "platformTagline": "# Tunisia's Freelance Platform",
            "rateLimitError": "Too many attempts. Please try again later."
        },
        "signup": {
            "alreadyHaveAccount": "Already have an account?",
            "badge": "Join WorkedIn",
            "confirmPasswordLabel": "Confirm Password",
            "continueWithGoogle": "Continue with Google",
            "createAccountButton": "Create account →",
            "creatingAccount": "Creating account…",
            "emailLabel": "Email",
            "emailPlaceholder": "you@example.com",
            "featureCards": {
                "escrow": {
                    "sub": "Funds held until delivery",
                    "title": "Escrow payments"
                },
                "local": {
                    "sub": "Optimised for Tunisia",
                    "title": "Local & global"
                },
                "verified": {
                    "sub": "Every identity confirmed",
                    "title": "Verified profiles"
                }
            },
            "formSubtitle": "Join 2,500+ professionals on WorkedIn",
            "formTitle": "Create your account",
            "heroDescription": "Join thousands of professionals across Tunisia. Set up your workspace and start working in minutes.",
            "heroTitle": "Ready for your next big project?",
            "heroTitleAccent": "next big project?",
            "heroTitleTop": "Ready for your",
            "highlightRoleDescription": "Sign up as a freelancer to find work, or a client to hire top talent.",
            "highlightRoleTitle": "Choose Your Path",
            "highlightTrustDescription": "Stand out instantly with identity and skill verification built right in.",
            "highlightTrustTitle": "Verified & Secure",
            "highlightWorkDescription": "Go from creating an account to landing your first contract fast.",
            "highlightWorkTitle": "Built for Speed",
            "orSignUpWithEmail": "or sign up with email",
            "passwordLabel": "Password",
            "rateLimitError15Min": "Too many attempts. Please try again in 15 minutes.",
            "rateLimitErrorMinutes": "Too many attempts. Please try again in {{minutes}} minutes.",
            "signInAction": "Sign in",
            "signInLink": "Sign in",
            "validation": {
                "passwordLowercase": "Must contain at least one lowercase letter",
                "passwordMinLength": "Password must be at least 8 characters",
                "passwordNumber": "Must contain at least one number",
                "passwordUppercase": "Must contain at least one uppercase letter"
            }
        }
    },
    "auto": {
        "escrow_not_funded_ye": "Escrow not funded yet"
    },
    "categories": {
        "availableJobs": "jobs available",
        "contentWriting": "Content Writing",
        "dataEntry": "Data Entry",
        "digitalMarketing": "Digital Marketing",
        "graphicDesign": "Graphic Design",
        "mobileApp": "Mobile Development",
        "photography": "Photography",
        "title": "Categories",
        "translation": "Translation",
        "uiux": "UI/UX Design",
        "videoEditing": "Video Editing",
        "webDev": "Web Development"
    },
    "clientProfile": {
        "activeJobs": "Active Job Postings",
        "addDescription": "+ Add description",
        "apply": "Apply",
        "avgRatingLabel": "Average Rating",
        "businessOwner": "Business Owner",
        "by": "by",
        "client": "Client",
        "companyInformation": "Company Information",
        "companyWebsite": "Company Website",
        "completedContractsLabel": "Completed Contracts",
        "copied": "Copied!",
        "exitPreview": "Exit Preview",
        "hiringAndStats": "Hiring & Stats",
        "hiringNeeds": "Hiring Needs",
        "hiringPreferences": "Hiring Preferences & Details",
        "hiringStatus": "Hiring Status",
        "jobsPostedCount": {
            "one": "{{count}} job posted",
            "other": "{{count}} jobs posted"
        },
        "jobsPostedLabel": "Jobs Posted",
        "linksTitle": "Links & Resources",
        "localTime": "{{time}} local time",
        "locationLabel": "Location",
        "memberSinceLabel": "Member since",
        "myProjects": "My Projects",
        "noActiveJobs": "No active job postings yet",
        "noActiveJobsDesc": "Post projects, launch milestone tasks, and collaborate with Top Freelancers.",
        "noBio": "No biography or about details provided yet.",
        "noCompanyDetails": "No company details added yet.",
        "noLinks": "No links added yet.",
        "noReviewsYet": "No reviews yet. Complete your first contract with a freelancer to receive feedback.",
        "notFound": "Client not found",
        "notFoundDesc": "This profile does not exist or has been removed.",
        "paymentVerified": "Payment Verified",
        "postFirstJob": "Post your first job",
        "postJob": "Post a Job",
        "previewDesc": "You are viewing your profile as other users see it.",
        "previewTitle": "Public Profile Preview",
        "proposalsCount": {
            "one": "{{count}} proposal",
            "other": "{{count}} proposals"
        },
        "reviewsCount": {
            "one": "{{count}} review",
            "other": "{{count}} reviews"
        },
        "settings": "Settings",
        "share": "Share",
        "specializedIn": "Specialized in {{industry}}",
        "standardStatus": "Standard",
        "totalSpentLabel": "Total spent",
        "upTo": "Up to",
        "verifications": {
            "identity": "Identity Verified",
            "payment": "Payment Method",
            "phone": "Phone Number"
        },
        "verificationsTitle": "Verifications",
        "workHistory": "Work History & Reviews",
        "workspaceControls": "Workspace Controls"
    },
    "common": {
        "accountHolder": "Account Holder Name",
        "accountHolderPlaceholder": "Name as it appears on the bank account",
        "active": "Active",
        "all": "All",
        "alreadyReportedSession": "Already reported in this session",
        "amountZero": "0.000 TND",
        "apply": "Apply Filters",
        "approved": "Approved",
        "attachments": "Attachments",
        "available": "Available",
        "availableForWork": "Available for work",
        "back": "Back",
        "bankName": "Bank Name",
        "bankNamePlaceholder": "Ex: Banque Nationale Agricole",
        "busy": "Busy",
        "cancel": "Cancel",
        "cancelled": "Cancelled",
        "client": "Client",
        "close": "Close",
        "closeMenu": "Close menu",
        "completed": "Completed",
        "completionDate": "Completion date",
        "confirm": "Confirm",
        "contactSupport": "Contact support",
        "currency": "TND",
        "currencyPerHour": "TND/h",
        "delete": "Delete",
        "dinar": "dinars",
        "download": "Download",
        "edit": "Edit",
        "emailPlaceholder": "Your email address",
        "error": "Error",
        "errors": {
            "unexpected": "An unexpected error occurred"
        },
        "fileSize": {
            "bytes": "Bytes",
            "kilobytes": "Kilobytes",
            "megabytes": "Megabytes"
        },
        "fileTooLarge": "Image size should be less than 5MB",
        "fileUpload": {
            "chooseFiles": "Choose files",
            "dropzoneHint": "Drag files here or click to browse",
            "fileTooLarge": "{{name}} is larger than {{size}}MB",
            "maxFilesExceeded": "Maximum {{count}} files allowed",
            "removeFileAria": "Remove {{name}}",
            "unsupportedType": "{{name}} has an unsupported file type"
        },
        "filter": "Filter",
        "fixedPrice": "Fixed Price",
        "freelancer": "Freelancer",
        "from": "From",
        "general": "General",
        "goBack": "Go back",
        "hide": "Hide details",
        "hourly": "Hourly",
        "hourlyExample": "Ex: 20",
        "hoursExample": "Ex: 10-20",
        "identityVerified": "Identity verified",
        "inactive": "Inactive",
        "invalidFileType": "Please select a JPG, PNG or WebP image",
        "loading": "Loading...",
        "loadingContent": "Loading content",
        "messageContent": "Message Content",
        "messageContentPlaceholder": "Write your message details here...",
        "messageSubject": "Message Subject",
        "messageSubjectPlaceholder": "Ex: Inquiry regarding a design project...",
        "more": "More",
        "navigate": "Navigate",
        "next": "Next",
        "no": "No",
        "none": "None",
        "notAuthenticated": "Not authenticated",
        "offline": "Offline",
        "older": "Older",
        "open": "Open",
        "openMenu": "Open menu",
        "optional": "Optional",
        "pending": "Pending",
        "posted1DayAgo": "Posted 1 day ago",
        "postedDaysAgo": "Posted {{days}} days ago",
        "postedRecently": "Posted recently",
        "postedToday": "Posted today",
        "postedWeeksAgo": "Posted {{weeks}} week{{weeks > 1 ? 's' : ''}} ago",
        "projectDescription": "Project Description",
        "projectDescriptionPlaceholder": "Describe project details, expected deliverables, and any special requirements...",
        "projectTitle": "Project Title",
        "projectTitlePlaceholder": "Ex: Logo design for a food company",
        "projectUrl": "Project URL",
        "proposalPlaceholder": "Explain why you are the right person for this project...",
        "refresh": "Refresh",
        "rejected": "Rejected",
        "reload": "Reload",
        "removeImage": "Remove image",
        "replyToReview": "Reply to review",
        "report": "Report",
        "reportContent": "Report content",
        "reportContentTitle": "Report content",
        "reportDescribePlaceholder": "Please describe the issue...",
        "reportError": "Failed to submit report",
        "reportFailed": "Failed to submit report",
        "reportSubmitButton": "Submit report",
        "reportSubmitted": "Report submitted. Our team will review it shortly.",
        "reportSubmittedSuccess": "Report submitted. Our team will review it shortly.",
        "reportTitle": "Report this content",
        "reported": "Reported",
        "retry": "Retry",
        "returnHome": "Return home",
        "reviewPlaceholder": "What did you like? What could be improved? Would you recommend them?",
        "save": "Save",
        "saveFreelancer": "Save freelancer",
        "saving": "Saving...",
        "scrollToTop": "Scroll to top",
        "search": "Search",
        "searchPlaceholder": "Search...",
        "searchProposals": "Search in proposals...",
        "select": "Select",
        "selectReason": "Please select a reason",
        "shareExperience": "Share your experience with this person...",
        "show": "Show details",
        "skill": "Skill",
        "skillsUsed": "Skills used",
        "skillsUsedPlaceholder": "Ex: Photoshop, React, UI Design (separated by commas)",
        "skipForNow": "You can skip this step and upload later",
        "sort": "Sort",
        "submit": "Submit",
        "success": "Success",
        "thumbnailUrl": "Thumbnail image URL",
        "time": {
            "ago": "ago",
            "ago_prefix": "",
            "day": "d",
            "hour": "h",
            "minute": "min",
            "now": "Just now"
        },
        "tnd": "TND",
        "tndPerHour": "TND/hr",
        "to": "To",
        "today": "Today",
        "toggleDarkMode": "Toggle dark mode",
        "toggleLightMode": "Toggle light mode",
        "tryAgain": "Try again",
        "tunisia": "Tunisia",
        "typeMessage": "Type your message here...",
        "unknownUser": "Unknown User",
        "unsave": "Unsave",
        "unsaveFreelancer": "Unsave freelancer",
        "uploadFailed": "Upload failed, you can add it later",
        "verified": "Verified",
        "view": "View",
        "viewJob": "View Job",
        "visibilityNote": "If you need rare skills or have a sensitive project, \"Invite only\" gives you more control. For public projects, \"Public\" ensures better price competitiveness.",
        "whyReport": "Why Report",
        "writeReply": "Write your reply here...",
        "yes": "Yes",
        "yesterday": "Yesterday",
        "you": "You"
    },
    "components": {
        "profileCompletion": {
            "badge": "Visibility score",
            "completeDescription": "Everything important is filled in. Keep proposals active and your portfolio fresh to stay visible.",
            "completeTitle": "Your freelancer profile is market-ready",
            "cta": "Improve profile now",
            "excellent": "Standout",
            "good": "Looking solid",
            "medium": "Getting there",
            "moreSteps": "more improvements waiting",
            "nextPriority": "Helpful next improvement",
            "nextSteps": "Highest-impact next steps",
            "nextStepsDescription": "Focus on the items below first for the fastest profile lift.",
            "progressLabel": "Completion",
            "readyBadge": "Profile ready",
            "steps": {
                "avatar": "Add a profile photo",
                "bio": "Write a stronger bio",
                "education": "Add education details",
                "fullName": "Complete your full name",
                "hourlyRate": "Set your hourly rate",
                "languages": "Add your languages",
                "location": "Set your location",
                "phone": "Add your phone number",
                "portfolio": "Show your past work",
                "skills": "Add at least 3 skills",
                "title": "Add your professional title"
            },
            "stepsCount": "steps done",
            "stepsLeft": "left",
            "subtitle": "Complete the strongest remaining items to increase trust and hiring chances.",
            "title": "Profile completion",
            "topPriority": "Top priority right now",
            "weak": "Needs work"
        }
    },
    "contract": {
        "acceptAndPay": "Accept and Pay",
        "acceptAndPayConfirm": "This will mark the contract as completed and release payment.",
        "acceptError": "Error accepting work",
        "actions": {
            "reviewExperience": "Leave a review"
        },
        "addReview": "Add your review",
        "amount": "Amount",
        "attachFile": "Attach file",
        "awaitingApproval": "Awaiting approval",
        "awaitingDelivery": "Awaiting delivery",
        "backToContracts": "Back to contracts",
        "blockedReasons": {
            "noAttachments": "Attachments are disabled for this conversation.",
            "noVoiceNotes": "Voice notes are disabled for this conversation.",
            "readOnly": "This conversation is read-only right now.",
            "safetyBlocked": "This message is blocked by contract safety rules."
        },
        "chat": "Chat",
        "chatSafetyBlocked": "Chat Safety Blocked",
        "completed": "Completed",
        "completionBanner": {
            "dismiss": "Dismiss",
            "leaveReview": "Help {{name}} grow their reputation — leave a review.",
            "readOnly": "This thread is now read-only.",
            "reviewAction": "Review",
            "title": "Contract completed!"
        },
        "confirmDelivery": "Confirm Delivery",
        "contextBar": {
            "btnAcceptPay": "Accept & Pay",
            "btnDeliverWork": "Deliver Work",
            "btnFullWorkspace": "Full Workspace",
            "btnFundEscrow": "Fund Escrow",
            "btnLeaveReview": "Leave Review",
            "btnRequestRevision": "Request Revision ({{remaining}} left)",
            "infoDeadline": "Deadline",
            "infoDeliveredOn": "Delivered On",
            "infoEscrowNotFunded": "Escrow not funded",
            "infoEscrowSecured": "Escrow secured",
            "infoEscrowStatus": "Escrow Status",
            "infoReviewBy": "Review by {{date}}",
            "infoReviewPeriod": "Review Period",
            "infoRevisionsUsed": "Revisions Used",
            "statusActive": "Active",
            "statusAwaitingPayment": "Awaiting Payment",
            "statusCancelled": "Cancelled",
            "statusCompleted": "Completed",
            "statusContract": "Contract",
            "statusDisputed": "Disputed",
            "statusInProgress": "In Progress",
            "statusRevisionRequested": "Revision Requested",
            "statusUnderReview": "Under Review"
        },
        "days": "days",
        "daysLeft": "Remaining",
        "daysRemaining": "{{days}} days remaining",
        "deliverBlocked": "Only the freelancer can deliver work for this contract.",
        "deliverError": "Error delivering work",
        "deliverNoteAria": "Delivery notes",
        "deliverNoteLabel": "Add a note for the client",
        "deliverNotePlaceholder": "Deliver Note Placeholder",
        "deliverWork": "Deliver Work",
        "details": "Details",
        "disputeBlocked": "A dispute cannot be opened in the current contract state.",
        "disputeError": "Error opening dispute",
        "disputeOpened": "Dispute Opened",
        "disputeReasonAria": "Dispute reason",
        "disputeReasonPlaceholder": "Explain reason for dispute...",
        "disputeReview": "Review within 48 hours",
        "disputeWarning": "Opening a dispute will suspend the contract while it is reviewed.",
        "employer": "Employer",
        "error": "An error occurred",
        "escrowBanner": {
            "clientFundDetail": "Fund {{amount}} TND into escrow to start working with {{name}}.",
            "clientFundSafe": "Funds are held safely until you approve delivery.",
            "clientSecureTitle": "Secure your contract",
            "dismiss": "Dismiss",
            "freelancerNotified": "You'll be notified once funds are confirmed.",
            "freelancerWaiting": "Waiting for the client to secure the escrow before work begins.",
            "fundAmount": "Fund {{amount}} TND",
            "topUpNeeded": "Top up needed",
            "walletBalance": "Wallet balance: {{balance}} TND"
        },
        "fileUploadError": "Error uploading file",
        "fileUploaded": "File uploaded:",
        "filesListEmpty": "Files List Empty",
        "finalDelivery": "Final delivery",
        "firstMessageHint": "Share context, files, and next steps to keep the project moving.",
        "hideWorkspace": "Hide Workspace",
        "inProgress": "In Progress",
        "jobInfo": "Job Information",
        "lifecycle": {
            "noComment": "No comment provided",
            "provideBothError": "Please provide deliverables for both review and final hand-off phases.",
            "uploadFailed": "{{stage}} upload failed for {{name}}: {{message}}",
            "workDeliveredMessage": "[[contract_completed]] Work has been accepted and payment released"
        },
        "loadFailedMessage": "Unable to load this contract right now.",
        "loadFailedTitle": "Contract unavailable",
        "milestones": "Milestones",
        "noDueDate": "No due date",
        "noSharedFiles": "No shared files yet",
        "notFoundDescription": "This contract may still be syncing. You can retry or return to your contracts list.",
        "notFoundTitle": "Contract not found",
        "onlineNow": "Online now",
        "openDispute": "Open Dispute",
        "openDisputeAction": "Open Dispute",
        "paymentInfo": "Payment Information",
        "pending": "Pending",
        "requestChanges": "Request Changes",
        "requestChangesBlocked": "Changes can only be requested after a delivery is submitted.",
        "requestRevision": "Request revisions",
        "requiredActions": "Required actions",
        "resubmitDelivery": "Resubmit Delivery",
        "reviewExperience": "Review Experience",
        "reviewExpired": "Review period expired",
        "reviewSent": "Review submitted successfully",
        "revisionLimitReached": "Revision limit reached for this contract.",
        "revisionSent": "Revision request sent",
        "revisionSentCompatibilityNotice": "Revision request sent. Status update will apply once the latest contract enum migration is available.",
        "role": "Role",
        "send": "Send",
        "sendMessage": "Send a message...",
        "sendMessageError": "Error sending message",
        "seoDescription": "Track conversation, files, and payment status for your contract from the workspace.",
        "sharedFiles": "Shared files",
        "startConversation": "Start the conversation",
        "startedAt": "Started",
        "statusLabel": "Status:",
        "statusUnavailable": "Status unavailable",
        "statusUnavailableHint": "Status is temporarily unavailable. This chat is still available.",
        "tabs": {
            "ariaLabel": "Workspace tabs",
            "chat": "Chat",
            "chatAria": "Show chat",
            "details": "Details",
            "detailsAria": "Show details",
            "files": "Files",
            "filesAria": "Show files"
        },
        "tnd": "TND",
        "typeMessage": "Type your message here...",
        "untitledJob": "Untitled job",
        "workAccepted": "Work accepted and payment completed!",
        "workDelivered": "Work delivered successfully!",
        "workingOnProject": "Working on this project",
        "workspaceTitle": "Workspace"
    },
    "contractWorkspace": {
        "clientView": "Client view",
        "deliveryFailed": "Failed to submit delivery.",
        "deliverySubmitted": "Delivery submitted! The client will review your work.",
        "disputeFailed": "Failed to open dispute.",
        "disputeOpened": "Dispute opened. Our team will review the case.",
        "freelancerView": "Freelancer view",
        "loadError": "Failed to load contract details. Please try again.",
        "notFound": "Contract not found or you do not have access.",
        "notParticipant": "You are not a participant in this contract.",
        "openToDeliver": "Open this contract in Messages to deliver work.",
        "openToDispute": "Open this contract in Messages to open a dispute.",
        "openToReleasePay": "Open this contract in Messages to release payment.",
        "openToRequestChanges": "Open this contract in Messages to request changes.",
        "paymentReleased": "Payment released and contract completed.",
        "releaseFailed": "Failed to release payment.",
        "revisionFailed": "Failed to request revision.",
        "revisionRequested": "Revision requested. The freelancer has been notified.",
        "unableToLoad": "Unable to load workspace"
    },
    "contracts": {
        "activeCount": "{{count}} Active",
        "empty": {
            "clientCta": "Post a project",
            "clientDescription": "Hire a freelancer to create your first contract.",
            "freelancerCta": "Browse jobs",
            "freelancerDescription": "Send proposals to get your first contract.",
            "title": "No contracts yet"
        },
        "emptyCancelledDescription": "You don't have any cancelled contracts.",
        "emptyCancelledTitle": "No cancelled contracts",
        "emptyDescription": "Try another tab or adjust your search to find contracts faster.",
        "emptyTitle": "No contracts found",
        "milestonesProgress": "1 of 3 milestones complete",
        "openWorkspace": "Open workspace ->",
        "paymentProtectionDesc": "Always communicate and request payments through WorkedIn. Contracts paid outside the platform are not protected by our secure escrow system.",
        "paymentProtectionTitle": "Payment Protection",
        "role": {
            "client": "Client",
            "freelancer": "Freelancer"
        },
        "searchPlaceholder": "Search contracts or users...",
        "startedOn": "Started {{date}}",
        "status": {
            "active": "Active",
            "cancelled": "Cancelled",
            "completed": "Completed",
            "disputed": "Disputed"
        },
        "subtitle": "Manage your active contracts, past work, and client communications.",
        "tabs": {
            "active": "Active",
            "all": "All",
            "completed": "Completed",
            "disputed": "Disputed"
        },
        "title": "Contracts",
        "unknownProject": "Unknown Project",
        "unknownUser": "Unknown User"
    },
    "counter": {
        "title": "dinars earned by Tunisians this month"
    },
    "ctaSection": {
        "badge": "Ready?",
        "browseJobs": "Browse Jobs",
        "clientDashboard": "Client Dashboard",
        "findFreelancers": "Find Freelancers",
        "goToDashboard": "Go to Dashboard",
        "primary": "Get started free",
        "secondary": "Post a project",
        "subtitle": "Join thousands of professionals already earning fairly on WorkedIn.",
        "title": "Tunisia's freelance economy starts here."
    },
    "dashboard": {
        "admin": {
            "activeContracts": "Active contracts",
            "activeJobs": "Active jobs",
            "adminDashboard": "Admin Dashboard",
            "allStatuses": "All statuses",
            "allTransactionsSuccess": "All transactions completed successfully",
            "allUsers": "All users",
            "allVerificationsProcessed": "All verification requests are processed",
            "backSide": "Back side",
            "backToSite": "Back to site",
            "cancelled": "Cancelled",
            "clients": "Clients",
            "completed": "Completed",
            "controlCenter": "Control Center",
            "disputes": "Disputes",
            "failedToLoadUsers": "Failed to load users",
            "freelancers": "Freelancers",
            "frontSide": "Front side",
            "identityVerificationRequests": "Identity verification requests",
            "inProgress": "In progress",
            "jobs": {
                "actions": "Actions",
                "allStatuses": "All statuses",
                "budget": "Budget",
                "cancel": "Cancel",
                "checkPermissions": "Check database permissions",
                "clearFilters": "Clear filters",
                "client": "Client",
                "confirm": "Confirm",
                "consistencyCount": "Consistency Count",
                "consistencyDescription": "Compares jobs.status with the latest linked contract status.",
                "consistencyHealthy": "No status mismatch detected between jobs and latest contracts.",
                "consistencyLoading": "Checking consistency...",
                "consistencyMore": "Consistency More",
                "consistencyTitle": "Lifecycle consistency check",
                "currentStatus": "Current",
                "delete": "Delete",
                "deleteConfirm": "Are you sure you want to delete this job?",
                "deleteError": "An error occurred while deleting",
                "deleteTitle": "Delete Job",
                "deletedSuccess": "Job deleted successfully",
                "expectedStatus": "Expected",
                "fromContract": "from contract",
                "job": "Job",
                "loadError": "Failed to load jobs",
                "loading": "Loading jobs...",
                "noResults": "No jobs match your filters",
                "notSpecified": "Not specified",
                "refreshCheck": "Refresh check",
                "refreshReviewTimeouts": "Refresh watch",
                "review": "Review",
                "reviewDueAt": "Review due",
                "reviewTimeoutStageOverdue": "Overdue",
                "reviewTimeoutStageReminder": "Due soon",
                "reviewTimeoutsCount": "Review Timeouts Count",
                "reviewTimeoutsDescription": "Tracks due-soon and overdue client review windows after delivery.",
                "reviewTimeoutsHealthy": "No due-soon or overdue review windows detected.",
                "reviewTimeoutsLoading": "Checking review windows...",
                "reviewTimeoutsTitle": "Contract review timeout watch",
                "searchPlaceholder": "Search jobs...",
                "status": "Status",
                "statusCancelled": "Cancelled",
                "statusCompleted": "Completed",
                "statusDisputed": "Disputed",
                "statusInProgress": "In progress",
                "statusOpen": "Open",
                "tryAdjusting": "Try adjusting your search or filter criteria"
            },
            "loading": "Loading...",
            "loadingUsers": "Loading users...",
            "nightModeReady": "Night mode ready",
            "noPendingRequests": "No pending requests",
            "noPendingVerifications": "No pending verification requests",
            "noStuckPayments": "No stuck payments",
            "open": "Open",
            "operationsCenter": "Operations Center",
            "overview": "Overview",
            "pageDescription": "Review and manage submitted identity verification requests",
            "pageTitle": "Identity verification requests - Admin dashboard",
            "payments": {
                "allSuccess": "All transactions completed successfully",
                "approvedSuccess": "Withdrawal payout executed successfully",
                "loading": "Loading...",
                "noPayments": "No stuck payments",
                "refresh": "Refresh",
                "rejectedSuccess": "Withdrawal request rejected and refunded",
                "retry": "Retry",
                "title": "Title"
            },
            "pending": "pending",
            "pendingRequests": "Pending requests",
            "refresh": "Refresh",
            "reports": "Reports",
            "revenue": "Revenue (TND)",
            "settings": "Settings",
            "stuckPayments": "Stuck payments (older than 1 hour)",
            "todayActivity": "Today activity",
            "totalUsers": "Total users",
            "users": {
                "accountStatus": "Account status",
                "accountStatusMigrationMissing": "Action blocked: account_status is missing in database. Apply latest Supabase migrations.",
                "accountType": "Account type",
                "actions": "Actions",
                "active": "Active",
                "activeMode": "Active mode",
                "activityCounts": "Activity counts",
                "admin": "Admin",
                "adminPermissionsOutOfSync": "Action blocked by database permissions. Confirm this user is admin in production DB and latest RLS migrations are applied.",
                "adminPrivilegesRequired": "Action blocked: your account is not marked as admin in profiles.",
                "allUsers": "All users",
                "archiveUser": "Archive user",
                "archiveUserConfirm": "Archive this user account and anonymize profile data while keeping legal and financial history?",
                "archived": "Archived",
                "cancel": "Cancel",
                "cannotDeleteAdminAccount": "Admin accounts cannot be permanently deleted from this action.",
                "checkDatabasePermissions": "Check Database Permissions",
                "clearSearch": "Clear search",
                "client": "Client",
                "clients": "Clients",
                "close": "Close",
                "confirm": "Confirm",
                "daysAbbr": "d",
                "deletePermanently": "Delete permanently",
                "deleteUserPermanentWarning": "This action is irreversible. User auth account and all cascading records will be removed if policy checks pass.",
                "deleteUserPermanently": "Delete user permanently",
                "edgeFunctionDeployHint": "If this is a hard delete, deploy admin-user-control edge function and verify ALLOWED_ORIGINS.",
                "email": "Email",
                "failedToLoadUsers": "Failed to load users",
                "failedToSwitchUserMode": "Failed to switch user mode",
                "freelancer": "Freelancer",
                "freelancers": "Freelancers",
                "fullAccessData": "Full access data",
                "hoursAbbr": "h",
                "identityVerification": "Identity verification",
                "justNow": "Just now",
                "lastActivity": "Last activity",
                "loadingUsers": "Loading users...",
                "minutesAbbr": "m",
                "mode": "Mode",
                "monthsAbbr": "mo",
                "name": "Name",
                "no": "No",
                "noUsersMatch": "No users match your search",
                "notificationFunctionConflict": "Database function conflict detected for notifications. Apply latest Supabase SQL fixes.",
                "reactivate": "Reactivate",
                "reactivateUser": "Reactivate user",
                "reactivateUserConfirm": "Do you want to restore access for user",
                "revoke": "Revoke",
                "revokeReasonLabel": "Revoke Reason Label",
                "revokeReasonPlaceholder": "e.g., ID document is expired...",
                "revokeVerification": "Revoke Verification",
                "revokeVerificationConfirm": "Are you sure you want to revoke verification for this user? They will need to submit their ID again.",
                "searchByNameOrEmail": "Search by name or email...",
                "sortEmailAZ": "Sort Email A Z",
                "sortEmailZA": "Sort Email Z A",
                "sortNameAZ": "Sort Name A Z",
                "sortNameZA": "Sort Name Z A",
                "sortNewest": "Newest first",
                "sortOldest": "Oldest first",
                "sortStatusAsc": "Sort Status Asc",
                "sortStatusDesc": "Sort Status Desc",
                "status": "Status",
                "superAdmin": "Super admin",
                "superAdminOnlyDelete": "Permanent deletion requires super admin privileges.",
                "superAdminProtected": "Super admin accounts cannot be moderated from this control.",
                "suspend": "Suspend",
                "suspendUser": "Suspend user",
                "suspendUserConfirm": "Do you want to suspend user",
                "suspended": "Suspended",
                "suspensionKeepsHistory": "Their contracts, payments, disputes, and audit history will be kept.",
                "switch": "Switch",
                "switchMode": "Switch mode",
                "tryAdjustingSearch": "Try adjusting your search criteria or filters",
                "type": "Type",
                "unableToDeleteUser": "Unable to delete user",
                "unableToRevokeVerification": "Unable to revoke verification",
                "unableToUpdateStatus": "Unable to update user status",
                "unverified": "Unverified",
                "user": "User",
                "userArchived": "User archived successfully",
                "userDeletedPermanently": "User deleted permanently",
                "userDetails": "User details",
                "userModeSwitchedTo": "User mode switched to",
                "userReactivated": "User reactivated successfully",
                "userSuspended": "User suspended successfully",
                "verified": "Verified",
                "view": "View",
                "weeksAbbr": "w",
                "yes": "Yes"
            },
            "verification": {
                "actionFailed": "Action failed",
                "allProcessed": "All verification requests are processed",
                "approve": "Approve",
                "backSide": "Back side",
                "frontSide": "Front side",
                "hide": "Hide",
                "idNumber": "ID number",
                "loadError": "Failed to load verification requests",
                "noImage": "No image",
                "noPending": "No pending requests",
                "notUpdated": "Verification request was not updated.",
                "pending": "pending",
                "refresh": "Refresh",
                "reject": "Reject",
                "selfie": "Selfie",
                "title": "Identity verification requests",
                "user": "User",
                "viewDocs": "View documents"
            },
            "verificationQueue": {
                "approve": "Approve",
                "approveFailed": "Failed to approve verification",
                "cancel": "Cancel",
                "cardBack": "Card back",
                "cardBackAlt": "ID card back side",
                "cardFront": "Card front",
                "cardFrontAlt": "ID card front side",
                "checkBack": "Barcode is clear on back image",
                "checkDigits": "ID number contains 8 digits",
                "checkFront": "Details are clear on front image",
                "checkMatch": "Selfie matches ID card photo",
                "checklist": "Verification checklist:",
                "confirmReject": "Confirm rejection",
                "days": "days",
                "description": "Review and manage identity verification requests submitted by users",
                "errorTitle": "Loading error",
                "hours": "hours",
                "idNumber": "ID number",
                "loadError": "Failed to load verification requests",
                "minutesAgo": "Minutes ago",
                "noPending": "No pending verification requests",
                "pending": "Pending",
                "queueTitle": "Pending requests",
                "reject": "Reject",
                "rejectDescription": "Please provide the rejection reason so the user can fix the issue",
                "rejectExample": "Example: The image is unclear, please retake it...",
                "rejectFailed": "Failed to reject verification",
                "rejectReason": "Rejection reason",
                "retry": "Retry",
                "reviewTitle": "Review verification",
                "selectRequest": "Select a request from the list to review",
                "selfie": "Selfie",
                "selfieAlt": "Selfie",
                "seoDescription": "Review and manage submitted identity verification requests",
                "seoTitle": "Identity verification requests - Admin dashboard",
                "since": "Since",
                "title": "Identity verification requests"
            }
        },
        "all": "All",
        "availableJobs": "Jobs matching your skills",
        "browseJobs": "Browse Jobs",
        "client": {
            "acrossActiveContracts": "Across {{count}} active contracts",
            "activeBadge": "Active",
            "activeContracts": "Active contracts",
            "activeContractsDescription": "Contracts currently in progress with assigned freelancers.",
            "activeJobs": "Active jobs",
            "activeJobsDetail": "Open or in-progress projects currently requiring decisions, proposals, or delivery follow-up.",
            "activeLabel": "Active",
            "activeProjects": "Active Projects",
            "allCaughtUp": "All caught up",
            "allCaughtUpDescription": "When proposal updates, contract changes, or reminders land, they will appear here in a cleaner sequence.",
            "assigneeLabel": "Assigned freelancer",
            "awaitingReview": "Awaiting review",
            "badgeUnverified": "Project Owner",
            "badgeVerified": "Verified Client",
            "clientFallback": "Client",
            "commandCenter": "Client command center",
            "commandCenterSubtitle": "Track projects, proposals & spending",
            "completedContracts": "Completed contracts",
            "completedContractsDetail": "Projects you have taken through delivery and successfully closed out.",
            "contractsBadge": "Active delivery",
            "defaultName": "Client",
            "defaultNotificationBody": "A project event needs your attention.",
            "defaultNotificationTitle": "Project update",
            "focusDeliveryDescription": "Track milestones, messages, and approvals so active projects keep moving without friction.",
            "focusDeliveryTitle": "Stay close to active delivery",
            "focusFirstJobDescription": "A clear job brief unlocks proposals, shortlists, and contracts. Start there before anything else.",
            "focusFirstJobTitle": "Post your first project brief",
            "focusLabel": "Today focus",
            "focusReviewDescription": "Your job \"{{title}}\" already has proposals waiting for your review.",
            "focusReviewTitle": "Review incoming proposals",
            "focusScaleDescription": "You have a calm dashboard right now. Tighten your next brief and invite better-fit freelancers earlier.",
            "focusScaleTitle": "Open a stronger next project",
            "freelancerFallback": "Freelancer",
            "heroDescription": "Keep your hiring pipeline clean: post sharper briefs, review proposals faster, and move active work through delivery without extra noise.",
            "heroGreeting": "Welcome back, {{name}}",
            "inProgressProjects": "In progress",
            "jobBudget": "Budget",
            "jobsWithProposals": "Jobs with proposals",
            "manageWorkspace": "Manage workspace",
            "monitorDelivery": "Monitor delivery",
            "needSomethingDone": "Need something done?",
            "nextActionLabel": "Next action",
            "nextMoves": "Best next moves",
            "noActiveContracts": "No active contracts",
            "noActiveContractsDescription": "Once you accept a proposal and fund the escrow, active contracts will appear here.",
            "noActiveProjects": "No active projects",
            "noJobsDescription": "Your dashboard will start filling up once you publish a project brief and invite proposals into the pipeline.",
            "noJobsYet": "No jobs posted yet",
            "notifications": "Notifications",
            "openNotifications": "Open notifications",
            "openProjects": "Open projects",
            "pipeline": {
                "openJobs": "open jobs",
                "totalProposals": "total proposals",
                "unreadUpdates": "unread updates"
            },
            "pipelineBadge": "Decision support",
            "pipelineSummary": "Hiring summary",
            "playbookBadge": "Client playbook",
            "postAProject": "Post a Project",
            "postFirstProject": "Post your first project to find talented freelancers",
            "postJob": "Post a new job",
            "postJobToReceiveProposals": "Post a project to start receiving proposals",
            "postProjectFree": "Post a project free. Get proposals from verified Tunisian talent.",
            "postProjectFreeCta": "Post a project — it's free",
            "profileUnavailable": "Profile unavailable",
            "profileUnavailableDesc": "We could not load your account profile yet. Please try again.",
            "projectsBadge": "Hiring pipeline",
            "projectsDescription": "Latest project briefs, proposal signals, and active delivery states in one place.",
            "projectsLabel": "Projects",
            "proposalsCountText": "proposals",
            "proposalsLabel": "Proposals",
            "proposalsSubmitted": "{{count}} proposals submitted",
            "proposalsWaiting": "Jobs awaiting review",
            "proposalsWaitingDetail": "Open jobs that already have proposals and should be reviewed before they go stale.",
            "recentProposals": "Recent Proposals",
            "refineProfile": "Refine client profile",
            "refineProfileDescription": "A clearer company profile helps freelancers trust the brief and respond faster.",
            "reviewBadge": "Review",
            "reviewPipeline": "Review project pipeline",
            "reviewPipelineDescription": "Compare open briefs, proposal activity, and active delivery in one place.",
            "reviewProposals": "Review proposals",
            "spentLabel": "Spent",
            "stats": {
                "active": "Active",
                "activeDesc": "open & in progress",
                "projects": "Projects",
                "projectsDesc": "projects posted",
                "proposals": "Proposals",
                "proposalsDesc": "received total",
                "totalSpent": "Total Spent",
                "totalSpentDesc": "across all projects"
            },
            "status": {
                "cancelled": "Cancelled"
            },
            "thisMonth": "This Month",
            "totalSpent": "Total spent",
            "totalSpentDetail": "Completed payouts released through your client wallet and escrow flows.",
            "untitledContract": "Untitled contract",
            "untitledJob": "Untitled job",
            "updatesBadge": "Inbox pulse",
            "viewAll": "View all",
            "viewAllContracts": "View all",
            "viewProject": "View project",
            "viewWallet": "View Wallet",
            "welcomeBack": "Welcome back"
        },
        "clientSubtitle": "Client Dashboard",
        "freelancer": {
            "activeContracts": "Active Contracts",
            "addSkillsToMatch": "Add skills to your profile to get matched jobs",
            "apply": "Apply",
            "badgeUnverified": "Pro Freelancer",
            "badgeVerified": "Verified Pro",
            "browseAndSendProposal": "Browse open jobs and send your first proposal",
            "browseJobs": "Browse Jobs",
            "checklist": {
                "avatar": "Avatar uploaded",
                "bio": "Bio written",
                "identity": "Identity verified",
                "preferences": "Project preferences",
                "skills": "Skills added",
                "title": "Professional title",
                "tools": "Tools listed"
            },
            "clientFallback": "Client",
            "contractsLabel": "Contracts",
            "defaultName": "Freelancer",
            "earningsLabel": "Earnings",
            "earningsThisMonth": "Earnings This Month",
            "matchedForYou": "Matched for You",
            "myProposals": "My Proposals",
            "noActiveContracts": "No active contracts",
            "noMatchesYet": "No matches yet",
            "noProposalsYet": "No proposals yet",
            "profileCompletion": "Profile Strength",
            "profileStrength": "Profile Strength",
            "proposalsLabel": "Proposals",
            "quickActions": "Quick Actions",
            "ratingLabel": "Rating",
            "recentProposals": "Recent Proposals",
            "seeAllJobs": "See all jobs",
            "completeProfileButton": "Complete profile →",
            "quota": {
                "title": "Daily Applications",
                "remainingLabel": {
                    "one": "application remaining today",
                    "other": "applications remaining today"
                }
            },
            "stats": {
                "contracts": "Contracts",
                "contractsDesc": "active now",
                "earnings": "This Month",
                "proposals": "Proposals",
                "proposalsDesc": "awaiting reply",
                "views": "Views",
                "viewsDesc": "profile views",
                "vsLastMonth": "vs last month"
            },
            "submitProposalsToStart": "Submit proposals to start getting contracts",
            "thisMonth": "This Month",
            "untitledJob": "Untitled job",
            "updateProfile": "Update Profile",
            "viewAll": "View all",
            "viewWallet": "View Wallet",
            "vsLastMonth": "vs last month",
            "wallet": {
                "available": "Available",
                "inReview": "In review",
                "lastMonth": "Last month"
            },
            "withdrawFunds": "Withdraw Funds"
        },
        "freelancerSubtitle": "Freelancer Dashboard",
        "greeting": {
            "afternoon": "Good afternoon",
            "evening": "Good evening",
            "morning": "Good morning"
        },
        "jobsCompleted": "jobs completed",
        "loading": "Loading...",
        "new": "New",
        "postNewJob": "Post a New Job",
        "postNewJobDesc": "Tell us about your job and we will find you the top 3 freelancers",
        "profileCompletion": "Profile Completion",
        "quickActions": "Quick Actions",
        "rating": "Rating",
        "recentActivity": "Recent Activity",
        "responseTime": "hours",
        "totalEarnings": "dinars",
        "updateProfile": "Update Profile",
        "urgent": "Urgent",
        "viewAll": "View All",
        "viewDetails": "View Details",
        "viewProfile": "View Profile",
        "welcome": "Welcome back",
        "yourJobs": "Your Jobs"
    },
    "dashboards": {
        "admin": {
            "headers": {
                "adminDashboard": "Admin Dashboard",
                "backToSite": "Back to site",
                "nightModeReady": "Night mode ready",
                "operationsCenter": "Operations Center"
            },
            "labels": {
                "action": "Action",
                "createdAt": "Created At",
                "date": "Date",
                "email": "Email",
                "role": "Role",
                "status": "Status",
                "updatedAt": "Updated At",
                "user": "User"
            },
            "messages": {
                "error": "Error loading data",
                "loading": "Loading...",
                "noData": "No data found"
            },
            "tabs": {
                "disputes": "Disputes",
                "jobs": "Jobs",
                "overview": "Overview",
                "payments": "Payments",
                "reports": "Reports",
                "settings": "Settings",
                "users": "Users",
                "verifications": "Verifications"
            },
            "users": {
                "suspend": "Suspend",
                "suspendUser": "Suspend user",
                "suspendUserConfirm": "Do you want to suspend user",
                "suspensionKeepsHistory": "Their contracts, payments, disputes, and audit history will be kept.",
                "switch": "Switch",
                "unableToUpdateStatus": "Unable to update user status"
            },
            "verification": {
                "approve": "Approve",
                "approved": "Approved",
                "pending": "Pending Verification",
                "reject": "Reject",
                "rejected": "Rejected",
                "resubmit": "Resubmit",
                "title": "Verification Queue",
                "viewDetails": "View Details"
            }
        },
        "client": {
            "actions": {
                "postProject": "Post a Project",
                "viewAll": "View all",
                "viewWallet": "View Wallet"
            },
            "cta": {
                "needSomethingDone": "Need something done?",
                "needSomethingDoneDesc": "Post a project free. Get proposals from verified Tunisian talent.",
                "postProjectFree": "Post a project — it's free"
            },
            "empty": {
                "noActiveProjects": "No active projects",
                "noActiveProjectsDesc": "Post your first project to find talented freelancers",
                "noProposals": "No proposals yet",
                "noProposalsDesc": "Proposals from freelancers will appear here"
            },
            "labels": {
                "freelancer": "Freelancer",
                "review": "Review",
                "untitledJob": "Untitled job"
            },
            "stats": {
                "active": "Active",
                "projects": "Projects",
                "proposals": "Proposals",
                "spent": "Spent"
            },
            "widgets": {
                "activeContracts": "Active Contracts",
                "activeProjects": "Active Projects",
                "recentProposals": "Recent Proposals",
                "thisMonth": "This Month"
            }
        },
        "freelancer": {
            "actions": {
                "browseJobs": "Browse Jobs",
                "updateProfile": "Update Profile",
                "viewWallet": "View Wallet"
            },
            "checklist": {
                "avatarUploaded": "Avatar uploaded",
                "bioWritten": "Bio written",
                "identityVerified": "Identity verified",
                "professionalTitle": "Professional title",
                "skillsAdded": "Skills added"
            },
            "empty": {
                "checkBackSoon": "Check back soon for new opportunities",
                "noActiveContracts": "No active contracts",
                "noActiveContractsDesc": "Submit proposals to start getting contracts",
                "noMatches": "No matches yet"
            },
            "labels": {
                "client": "Client",
                "untitledJob": "Untitled job",
                "vsLastMonth": "vs last month"
            },
            "profileStrength": {
                "complete": "Complete"
            },
            "stats": {
                "contracts": "Contracts",
                "earnings": "Earnings",
                "proposals": "Proposals",
                "rating": "Rating"
            },
            "widgets": {
                "activeContracts": "Active Contracts",
                "matchedForYou": "Matched for You",
                "profileStrength": "Profile Strength",
                "recentProposals": "Recent Proposals",
                "thisMonth": "This Month"
            }
        }
    },
    "dynamic_key_1004386723": "Your withdrawal request will be reviewed by admin and transferred within 2-5 business days.",
    "dynamic_key_1015995410": "Search proposals...",
    "dynamic_key_1016245850": "Your rating for",
    "dynamic_key_1039014200": "About Me",
    "dynamic_key_1053149402": "Payment Failed",
    "dynamic_key_1072185127": "Explain why you are the right person for this project...",
    "dynamic_key_1080932848": "Project Title",
    "dynamic_key_1087307158": "Reviews are permanent and cannot be edited. The other party can reply to your review.",
    "dynamic_key_1102070523": "Total Cost",
    "dynamic_key_1109099118": "Total Earnings",
    "dynamic_key_1111663922": "💡 Payment is safely held in escrow until work is delivered and approved.",
    "dynamic_key_1113257013": "Proposal Message",
    "dynamic_key_1115664379": "(500 characters max)",
    "dynamic_key_1144928517": "File uploads coming soon. Please use a direct image URL for now.",
    "dynamic_key_1163187178": "Project Description",
    "dynamic_key_1225650541": "Running...",
    "dynamic_key_1253092729": "We analyzed your requirements and found 3 freelancers matching your project at 95%.",
    "dynamic_key_1259492927": "approx. hours",
    "dynamic_key_1262868023": "Native",
    "dynamic_key_1265703203": "Service Fee",
    "dynamic_key_128175915": "Home",
    "dynamic_key_131381918": "Retry",
    "dynamic_key_1333999920": "Skills Used",
    "dynamic_key_1337275137": "Read more...",
    "dynamic_key_1347768947": "Project Link (optional)",
    "dynamic_key_1348454276": "Troubleshooting tips:",
    "dynamic_key_1393796300": "Uploading file...",
    "dynamic_key_1475699192": "Intermediate",
    "dynamic_key_1500402850": "There are no items to display at the moment.",
    "dynamic_key_1501241012": "Report",
    "dynamic_key_1501416850": "Hide",
    "dynamic_key_1502065525": "Cancel",
    "dynamic_key_1503344713": "Highest Rated",
    "dynamic_key_1505988461": "Refresh",
    "dynamic_key_1506640045": "Rating",
    "dynamic_key_1506801489": "Hire",
    "dynamic_key_1524267": "TND",
    "dynamic_key_1529240342": "Privacy Settings",
    "dynamic_key_1530768926": "Beginner",
    "dynamic_key_1530851603": "Advanced",
    "dynamic_key_1530855304": "Top Rated",
    "dynamic_key_1543783939": "View Job",
    "dynamic_key_1544269147": "Platform fee (",
    "dynamic_key_1545985538": "Freelancer Level",
    "dynamic_key_1546829780": "Written Review (optional)",
    "dynamic_key_1573622": "Earned",
    "dynamic_key_1581598": "proposal",
    "dynamic_key_158612530": "• Make sure you have sufficient balance",
    "dynamic_key_1591556203": "Share your experience with others",
    "dynamic_key_1593775": "ago",
    "dynamic_key_1594354": "Yes",
    "dynamic_key_1598663": "day",
    "dynamic_key_1607514557": "Recent Transactions",
    "dynamic_key_1608485352": "Attachments (optional)",
    "dynamic_key_1611325765": "Must write at least 100 characters",
    "dynamic_key_1637895873": "Bank Name",
    "dynamic_key_1647529322": "Skip for now",
    "dynamic_key_1655363803": "Submit Proposal",
    "dynamic_key_1659410812": "• Check your internet connection",
    "dynamic_key_1659906949": "Success Rate",
    "dynamic_key_1679990796": "Submit Review",
    "dynamic_key_1693322708": "Skills",
    "dynamic_key_1707230249": "• Check your card details are correct",
    "dynamic_key_1712849267": "Attachments",
    "dynamic_key_1716602825": "Lowest Price",
    "dynamic_key_1718339647": "Applied",
    "dynamic_key_1725907738": "We couldn't load your data. Please try again.",
    "dynamic_key_1739654371": "Work Sample",
    "dynamic_key_1761004867": "Most Helpful",
    "dynamic_key_1762109572": "Payment Verification Failed",
    "dynamic_key_1785209048": "Describe the project details and what you accomplished...",
    "dynamic_key_1789330939": "Reviews (",
    "dynamic_key_1793704877": "Sending...",
    "dynamic_key_1797922455": "Verified accounts only",
    "dynamic_key_1798326885": "Payment Successful! 🎉",
    "dynamic_key_1805513405": "Example: E-commerce store design",
    "dynamic_key_1821001923": "Please wait while we verify your payment",
    "dynamic_key_1824767388": "Completed Job",
    "dynamic_key_18255446": "Write your reply to review",
    "dynamic_key_1827230247": "French",
    "dynamic_key_1828865552": "4-star rating and above",
    "dynamic_key_1842506838": "Work history not available in this preview",
    "dynamic_key_1842976832": "Best Match",
    "dynamic_key_1933160140": "Back to Contract",
    "dynamic_key_193923978": "A contract will be created between you and this freelancer. Are you sure?",
    "dynamic_key_1954172192": "View All",
    "dynamic_key_1972795761": "Completion Date",
    "dynamic_key_197805234": "AI Recommendations",
    "dynamic_key_1991592213": "Upload File",
    "dynamic_key_1999631066": "Home",
    "dynamic_key_2001555607": "Reply to Review",
    "dynamic_key_2009227315": "Your audio introduction has been recorded",
    "dynamic_key_201330750": "• Try a different card",
    "dynamic_key_2053478334": "Posted Date",
    "dynamic_key_2071077264": "Hire Now",
    "dynamic_key_2071445136": "Submit Withdrawal Request",
    "dynamic_key_208308034": "Available Balance",
    "dynamic_key_2123673725": "Your wallet hasn't been created yet",
    "dynamic_key_2132806281": "Task:",
    "dynamic_key_2133212330": "Work Sample 1 (image)",
    "dynamic_key_2134028980": "No reviews yet",
    "dynamic_key_2137084368": "Rating",
    "dynamic_key_2144569262": "Arabic",
    "dynamic_key_214509631": "My Wallet",
    "dynamic_key_215587664": "Full name as it appears on bank account",
    "dynamic_key_217425117": "Message",
    "dynamic_key_218823582": "An unexpected error occurred",
    "dynamic_key_220193727": "Share",
    "dynamic_key_220511911": "Project:",
    "dynamic_key_223878144": "Phone Number",
    "dynamic_key_229505028": "The other party is typing...",
    "dynamic_key_232051787": "View Recommendations",
    "dynamic_key_233190025": "Helpful (",
    "dynamic_key_234965878": "Note",
    "dynamic_key_236480406": "Expected Duration",
    "dynamic_key_238952578": "View Details",
    "dynamic_key_243096717": "Pending",
    "dynamic_key_257908957": "Has portfolio",
    "dynamic_key_29050573": "Response Speed",
    "dynamic_key_300689867": "Withdrawal request submitted",
    "dynamic_key_322511046": "professionals already on WorkedIn",
    "dynamic_key_331518742": "If the problem persists, contact technical support",
    "dynamic_key_365411007": "Cover Letter",
    "dynamic_key_374761519": "Verifying payment...",
    "dynamic_key_380610698": "Overall Rating",
    "dynamic_key_392258297": "Thumbnail Image URL",
    "dynamic_key_403517891": "You will receive",
    "dynamic_key_418944631": "Work Sample 2 (image)",
    "dynamic_key_41921266": "Reviews not available in this preview",
    "dynamic_key_422731376": "Thoughtful Bid",
    "dynamic_key_426109629": "Sorry, an error occurred while loading the page. Please try again.",
    "dynamic_key_432874841": "Highest Price",
    "dynamic_key_451961555": "Delivery Time",
    "dynamic_key_452524680": "Delivery Period",
    "dynamic_key_454607345": "Example: UI design, frontend dev, photo editing (comma separated)",
    "dynamic_key_475558032": "Account Holder Name",
    "dynamic_key_476684698": "Sort by",
    "dynamic_key_480999927": "Redirecting you automatically...",
    "dynamic_key_481289425": "No transactions yet",
    "dynamic_key_48695393": "Expert",
    "dynamic_key_48788556": "Back",
    "dynamic_key_49410394": "Verified",
    "dynamic_key_49413132": "Success",
    "dynamic_key_496366041": "Lowest Rated",
    "dynamic_key_50718": "Reply",
    "dynamic_key_51299": "No",
    "dynamic_key_525136044": "Other Features",
    "dynamic_key_545901654": "You can upload PDF or image files up to 10MB",
    "dynamic_key_549959251": "Proposal Value",
    "dynamic_key_571944939": "Get started by creating your first project.",
    "dynamic_key_596156750": "Freelancer Rating",
    "dynamic_key_611934998": "Completed Projects",
    "dynamic_key_614661587": "Total to Pay",
    "dynamic_key_617719072": "Proposal Details",
    "dynamic_key_623032746": "Languages",
    "dynamic_key_624028093": "Newest",
    "dynamic_key_639337527": "Send Reply",
    "dynamic_key_669258706": "Your comment (optional)",
    "dynamic_key_6717295": "Archive Proposal",
    "dynamic_key_685712071": "Detailed Ratings",
    "dynamic_key_71417736": "Your request will be reviewed and the amount transferred within 2-5 business days",
    "dynamic_key_72742741": "Share your experience with this person...",
    "dynamic_key_730815621": "Go to Contract",
    "dynamic_key_76026069": "Example: National Agricultural Bank",
    "dynamic_key_764967864": "Return to Dashboard",
    "dynamic_key_812168715": "Amount Requested",
    "dynamic_key_829255241": "What did you like? What could be improved? Would you recommend?",
    "dynamic_key_831489996": "Payment funded successfully. Funds are securely held.",
    "dynamic_key_854531310": "Try adjusting your search or filters to find what you're looking for.",
    "dynamic_key_857615762": "Budget",
    "dynamic_key_860054720": "Owner Reply",
    "dynamic_key_872049934": "Filter Proposals",
    "dynamic_key_890920977": "Freelancer's Reply:",
    "dynamic_key_891367863": "Request Withdrawal",
    "dynamic_key_928208723": "Proposal Value (TND)",
    "dynamic_key_934974283": "Recommended (Best Match)",
    "dynamic_key_936673124": "Job Details",
    "dynamic_key_939059608": "Withdrawal Method",
    "dynamic_key_979253881": "Write your reply here...",
    "dynamic_key_9853380": "Repeat Client",
    "editJob": {
        "error": "Failed to update job",
        "goBack": "Go to jobs",
        "heroDescription": "Update the details, budget, or visibility of your existing project.",
        "heroTitle": "Edit your project brief",
        "notEditable": "Only open jobs can be edited",
        "notFound": "Job not found",
        "notFoundDescription": "This job may have been deleted or does not exist.",
        "notOwner": "You can only edit your own jobs",
        "saveChanges": "Save Changes",
        "seo": {
            "description": "Update your job posting",
            "title": "Edit Job"
        },
        "steps": {
            "reviewDescription": "Validate the changes before saving."
        },
        "success": "Job updated successfully"
    },
    "error": {
        "jobCard": "Failed to load job card",
        "retry": "Try again",
        "title": "Something went wrong",
        "unexpected": "An unexpected error occurred while rendering this section."
    },
    "errors": {
        "generic": {
            "retry": "Try again",
            "title": "Something went wrong"
        },
        "jobCard": {
            "loadFailed": "Failed to load job card"
        }
    },
    "faqPage": {
        "categories": {
            "client": {
                "items": [{"q":"How do I post a project?","a":"Click \"Post a Project\", describe your work, set your budget and timeline, then publish. You'll receive proposals from verified freelancers."},{"q":"What if I'm not satisfied with the work?","a":"If work doesn't meet agreed terms, you get a full refund. Funds are held in escrow until you approve the delivery."},{"q":"How is my money protected?","a":"Funds are held securely in escrow. The freelancer only receives payment when you approve the completed work."}],
                "title": "For Clients"
            },
            "freelancer": {
                "items": [{"q":"How do I get started as a freelancer?","a":"Sign up, complete your profile with skills and portfolio, then start browsing available projects that match your expertise."},{"q":"How much can I earn?","a":"Your earnings depend on the projects you take and the rates you set. Many Tunisian freelancers earn between 500-5000 TND per month."},{"q":"How do I get paid?","a":"Payments are made via D17, bank transfer, or other local payment methods. You set your preferred payment method in your wallet settings."}],
                "title": "For Freelancers"
            },
            "general": {
                "items": [{"q":"What is WorkedIn.tn?","a":"WorkedIn.tn is a Tunisian freelance marketplace connecting businesses with talented professionals. We believe in fair payment, verified profiles, and secure escrow-protected transactions."},{"q":"Is registration free?","a":"Yes, registration is completely free for both freelancers and clients. We only charge a small commission on successfully completed projects."},{"q":"How long does verification take?","a":"Identity verification typically takes 24-48 hours. You can start your profile setup immediately, and verification happens in the background."}],
                "title": "General"
            },
            "payment": {
                "items": [{"q":"What payment methods do you accept?","a":"We support all local Tunisian methods: cards, D17, bank transfer, and cash for small amounts."},{"q":"When do I get paid?","a":"Freelancers are paid within 48 hours after the client approves and releases the escrow."},{"q":"Are there any hidden fees?","a":"No. Our fees are transparent and clearly displayed. We charge a small commission only on completed projects."},{"q":"What payment methods are available?","a":"Currently we support Dhmad escrow for secure transactions. Flouci wallet and D17 (La Poste) are coming soon. Dhmad holds your funds securely until work is approved — the same system used by Tunisie Freelance."},{"q":"Is Dhmad safe?","a":"Yes. Dhmad is a Tunisian escrow platform authorized to hold funds as a trusted third party. Your money is protected until you approve the work."},{"q":"When will Flouci and D17 be available?","a":"We're actively working on adding Flouci and D17. They will be available soon. We'll notify all users when they launch."},{"q":"What happens if there's a dispute?","a":"If there's a disagreement, Dhmad holds the funds while the dispute is resolved. Neither party can access the money until the issue is settled."}],
                "title": "Payment & Earnings"
            },
            "security": {
                "items": [{"q":"Is my personal information safe?","a":"Yes. We use industry-standard encryption and security measures. Your data is never shared without your permission."},{"q":"Why do you need ID verification?","a":"ID verification ensures trust and safety for both freelancers and clients. Every professional on WorkedIn is ID-checked."},{"q":"Can I remain anonymous?","a":"No. Both freelancers and clients must be verified. This protects everyone and ensures accountability."}],
                "title": "Security & Privacy"
            }
        },
        "page": {
            "contactButton": "Contact us",
            "noAnswer": "Didn't find your answer?",
            "searchPlaceholder": "Search questions...",
            "subtitle": "Answers to the most common questions about using WorkedIn.tn",
            "supportReady": "Our support team is ready to help you 24/7",
            "title": "Frequently Asked Questions"
        }
    },
    "findFreelancers": {
        "activeFilters": "Active",
        "all": "All",
        "allLocations": "All Locations",
        "anyJobsAmount": "Any Jobs Amount",
        "anyJobsAmountDesc": "Show everyone",
        "anySuccessRate": "Any Success Rate",
        "anySuccessRateDesc": "Show all freelancers",
        "availableNow": "Available now",
        "availableNowDesc": "Available to start immediately",
        "category": "Category",
        "clearAll": "Clear all",
        "clearFilters": "Clear all filters",
        "filterTitle": "Filter results",
        "filterToggle": "Filter results",
        "hero": {
            "badge": "Verified Tunisian professionals",
            "subtitle": "2,500+ Tunisian developers, designers, translators and consultants — verified, rated, and ready to work.",
            "subtitleDesktop": "",
            "title": "Find the right person,",
            "titleHighlight": "not just any person."
        },
        "heroStats": {
            "fastReplies": "Average rating",
            "talentPool": "Verified profiles",
            "verified": "Identity checked"
        },
        "hourlyRate": "Hourly rate (TND)",
        "jobSuccessRate": "Job Success Rate",
        "jobs10plus": "10+ jobs completed",
        "jobs10plusDesc": "Veteran freelancer status",
        "jobs1plus": "1+ jobs completed",
        "jobs1plusDesc": "Has marketplace experience",
        "jobs5plus": "5+ jobs completed",
        "jobs5plusDesc": "Established track record",
        "jobsCompleted": "Jobs Completed",
        "location": "Location",
        "max": "Max",
        "min": "Min",
        "nLocations": "{{count}} Locations",
        "noMatchesFound": "No matches found",
        "noResults": {
            "action": "Clear all filters",
            "description": "We couldn't find any freelancers matching your criteria. Try different keywords or clear filters.",
            "title": "No matching results"
        },
        "noSkillsFound": "No skills found",
        "rate80up": "80% & up",
        "rate80upDesc": "Top tier consistency",
        "rate90up": "90% & up",
        "rate90upDesc": "Highly rated professionals",
        "rateAny": "Any",
        "rating": "Min Rating",
        "resultStats": {
            "availableNow": "Available now",
            "averageRate": "Avg rate",
            "topRating": "Top rated"
        },
        "resultsCount": "Showing {{count}} results",
        "searchLocations": "Search locations...",
        "searchPlaceholder": "Search for freelancers...",
        "searchSkills": "Search skills...",
        "skills": "Skills",
        "sort": {
            "label": "Sort by:",
            "priceLow": "Lowest price",
            "rating": "Highest rated",
            "recommended": "Recommended"
        },
        "status": "Status",
        "to": "to",
        "toasts": {
            "removedFromSaved": "Removed from saved freelancers",
            "savedFreelancer": "Saved freelancer",
            "updateSavedFailed": "Could not update saved freelancers"
        },
        "verifiedOnly": "Verified identity only",
        "verifiedOnlyDesc": "Top rated (4.5+)"
    },
    "footer": {
        "about": "About",
        "city": "Tunis, Tunisia",
        "contact": "Contact",
        "copyright": "(c) 2026 WorkedIn.tn - All rights reserved",
        "description": "Built for Tunisian professionals, with verified identities, escrow-protected payments, and projects paid in TND.",
        "faq": "FAQ",
        "legal": "Legal",
        "madeInTunisia": "Built in Tunisia.",
        "newsletterAction": "Subscribe",
        "newsletterDescription": "Get product notes, launch updates, and important trust-and-payment changes from WorkedIn.",
        "newsletterPlaceholder": "Your e-mail address",
        "newsletterTitle": "Product updates",
        "privacy": "Privacy",
        "quickLinks": "Quick Links",
        "socialFacebook": "Facebook",
        "socialInstagram": "Instagram",
        "socialLinkedin": "LinkedIn",
        "socialTwitter": "Twitter",
        "subscribed": "You're subscribed!",
        "terms": "Terms"
    },
    "forClients": {
        "benefits": {
            "local": {
                "desc": "Work with people who understand the local market, language, and culture.",
                "title": "Tunisian professionals"
            },
            "secure": {
                "desc": "Funds are held in escrow. Released only when you approve.",
                "title": "Pay when satisfied"
            },
            "speed": {
                "desc": "Post your project and receive verified proposals the same day.",
                "title": "Hire in 24 hours"
            }
        },
        "categories": {
            "items": {
                "admin": "Video & Animation",
                "data": "Education",
                "design": "Design & Creative",
                "dev": "Development",
                "finance": "Engineering",
                "marketing": "Sales & Marketing",
                "video": "Support",
                "writing": "Writing & Translation"
            },
            "title": "Every skill. One platform."
        },
        "cta": {
            "button": "Create a free client account",
            "text": "2,500+ verified professionals are ready to work. Post your project free — no subscription, no commitment.",
            "title": "Your next project starts here."
        },
        "hero": {
            "badge": "Hire verified Tunisian talent",
            "cta": "Post a project — it's free",
            "secondary": "See how it works",
            "subtitle": "Post for free. Receive proposals from verified professionals. Pay only when you approve the work — every payment protected by escrow.",
            "title": "Your project, delivered.",
            "titleHighlight": "On time. On budget."
        },
        "talent": {
            "title": "Who you'll be working with"
        }
    },
    "globalSearch": {
        "clearSearch": "Clear search",
        "freelancers": "Freelancers",
        "jobs": "Jobs",
        "noResultsFor": "No results found for \"{{query}}\"",
        "placeholder": "Search jobs, freelancers, skills...",
        "recent": "Recent searches",
        "searching": "Searching...",
        "suggestions": "Suggestions",
        "toNavigate": "to navigate",
        "toSelect": "to select"
    },
    "hero": {
        "activity": {
            "eyebrow": "Live platform activity",
            "metrics": {
                "activeProjects": "Active projects",
                "avgProjectValue": "Avg. project value",
                "projectsCompleted": "Projects completed",
                "verifiedFreelancers": "Verified freelancers"
            },
            "tag": "Now live in Tunisia",
            "title": "Real work. Real payments."
        },
        "badge": "Built in Tunisia. Built for Tunisia.",
        "ctaClient": "Post a project free",
        "ctaFreelancer": "Start earning today",
        "headlineHighlight": "Gets Paid Fairly",
        "headlineStart": "Where Tunisian Talent",
        "rating": "4.9/5 — rated by verified freelancers and clients",
        "socialProof": "2,500+ professionals already working on WorkedIn",
        "stats": {
            "escrow": "TND in escrow",
            "professionals": "Active professionals",
            "projects": "Projects completed"
        },
        "subtitle": "No auctions. No middlemen. Post a project, agree on terms, get paid in TND — secured by escrow.",
        "title": "Where Tunisian Talent Gets Paid Fairly",
        "trust": {
            "secure": "Escrow-protected payments",
            "secureBody": "Funds are held securely and released only when work is approved.",
            "users": "Users",
            "verified": "Identity-verified professionals",
            "verifiedBody": "Every freelancer is ID-checked before taking their first project."
        }
    },
    "heroSection": {
        "auth": {
            "dashboard": "Go to Dashboard",
            "welcomeBack": "Welcome back, {{name}} 👋"
        },
        "client": {
            "cta": "Get Started",
            "eyebrow": "Built in Tunisia. Ready for serious work.",
            "features": {
                "manage": {
                    "subtitle": "Payments stay protected until approval",
                    "title": "Secure milestone payments"
                },
                "post": {
                    "subtitle": "Quality matches for clients and freelancers",
                    "title": "Connect with the right people"
                },
                "review": {
                    "subtitle": "Trust signals appear before the first message",
                    "title": "Verified local profiles"
                }
            },
            "panelTitle": "Why WorkedIn",
            "promise": "Better presentation helps everyone trust the platform and build successful collaborations.",
            "secondary": "Explore Platform",
            "stats": {
                "professionals": {
                    "default": "2,500",
                    "label": "Professionals"
                },
                "projects": {
                    "default": "120",
                    "label": "Active projects"
                },
                "trust": {
                    "label": "Avg. trust score",
                    "value": "4.9/5"
                }
            },
            "subtitle": "Connect with verified professionals or find quality projects. Built for serious collaboration.",
            "titleAccent": "Trusted connections.",
            "titleTop": "Quality work.",
            "trust": {
                "escrow": "Protected payments",
                "faster": "Quality matching",
                "verified": "Verified profiles"
            }
        },
        "freelancer": {
            "cta": "Get Started",
            "eyebrow": "Built in Tunisia. Built for Tunisia.",
            "features": {
                "apply": {
                    "subtitle": "Quality matches for clients and freelancers",
                    "title": "Connect with the right people"
                },
                "track": {
                    "subtitle": "Everything secured and transparent",
                    "title": "Track milestones and payments"
                },
                "verify": {
                    "subtitle": "Build trust before the first message",
                    "title": "Verified local profiles"
                }
            },
            "panelTitle": "How it works",
            "promise": "Better presentation helps everyone build trust and successful collaborations.",
            "secondary": "Explore Platform",
            "stats": {
                "contracts": {
                    "default": "120",
                    "label": "Active projects"
                },
                "professionals": {
                    "default": "2,500",
                    "label": "Professionals"
                },
                "rating": {
                    "label": "Avg. rating",
                    "value": "4.9/5"
                }
            },
            "subtitle": "Connect with quality projects or find skilled professionals. Transparent terms, secure payments in TND.",
            "titleAccent": "Fair opportunities.",
            "titleTop": "Quality work.",
            "trust": {
                "matched": "Quality matching",
                "payouts": "Protected payments",
                "reputation": "Build reputation"
            }
        },
        "liveBadge": "Live",
        "promise": {
            "label": "WorkedIn Promise"
        },
        "typewriter": {
            "client": {
                "qualityCollaboration": "Quality collaboration.",
                "securePayments": "Secure payments.",
                "trustedConnections": "Trusted connections."
            },
            "freelancer": {
                "buildYourCareer": "Build your career.",
                "getPaidOnTime": "Get paid on time.",
                "workWithBest": "Work with the best."
            }
        }
    },
    "home": {
        "sections": {
            "categories": {
                "badge": "Categories",
                "subtitle": "Discover skills in demand in the Tunisian market"
            },
            "cta": {
                "badge": "Start Your Journey",
                "btnStart": "Start Now for Free",
                "btnWatch": "Watch How It Works",
                "subtitle": "Join thousands of Tunisians building their careers with us. Registration is free and easy.",
                "title": "Ready to Start?"
            },
            "howItWorks": {
                "badge": "How It Works",
                "clientDesc": "Hire top talent",
                "freelancerDesc": "Find work easily",
                "subtitle": "A simple and effective system connecting you with top talent or best opportunities"
            },
            "testimonials": {
                "badge": "Success Stories",
                "earned": "Earned"
            }
        },
        "stats": {
            "activeJobs": "Active Jobs",
            "live": "Live Stats",
            "rating": "Rating",
            "users": "Users"
        }
    },
    "howItWorks": {
        "brandName": "WorkedIn",
        "clientSteps": {
            "step1": {
                "description": "Describe the work, set your budget, choose fixed or hourly.",
                "title": "Post in 2 minutes"
            },
            "step2": {
                "description": "Every freelancer is ID-verified. Filter by rating, skill, and price.",
                "title": "Review verified proposals"
            },
            "step3": {
                "description": "Clear deliverables, deadlines, and progress — all in one workspace.",
                "title": "Track milestones, not guesses"
            },
            "step4": {
                "description": "Approve the work, release funds from escrow, rate the experience.",
                "title": "Release payment, leave a review"
            }
        },
        "cta": {
            "client": "Post a project free",
            "freelancer": "Start earning today"
        },
        "faq": {
            "item1": {
                "a": "Yes, registration is completely free for both freelancers and clients. We only charge a small commission on successful projects.",
                "q": "Is registration free?"
            },
            "item2": {
                "a": "WorkedIn acts as a trusted intermediary. Clients pay us, we hold funds until delivery is approved, then release to the freelancer.",
                "q": "How is my money secured?"
            },
            "item3": {
                "a": "A",
                "q": "What payment methods?"
            },
            "item4": {
                "a": "Yes, you can register a company account to hire staff or offer services as a team.",
                "q": "Can I register as a company?"
            },
            "items": {
                "item1": {
                    "a": "Yes, registration is completely free for both freelancers and clients. We only charge a small commission on successful projects.",
                    "q": "Is registration free?"
                },
                "item2": {
                    "a": "WorkedIn acts as a trusted intermediary. Clients pay us, we hold funds until delivery is approved, then release to the freelancer.",
                    "q": "How is my money secured?"
                },
                "item3": {
                    "a": "We support all local Tunisian methods: local/int'l cards, D17, bank transfer, and even cash for small amounts.",
                    "q": "What payment methods?"
                },
                "item4": {
                    "a": "Yes, you can register a company account to hire staff or offer services as a team.",
                    "q": "Can I register as a company?"
                }
            },
            "title": "Common Questions"
        },
        "freelancerSteps": {
            "step1": {
                "description": "Add skills, portfolio, and rate. Clients find you — no bidding required.",
                "title": "Build your profile once"
            },
            "step2": {
                "description": "Our system surfaces you to clients looking for exactly your skills.",
                "title": "Get matched to real projects"
            },
            "step3": {
                "description": "Chat, negotiate, and lock in the scope before any money moves.",
                "title": "Agree on terms, start work"
            },
            "step4": {
                "description": "Funds are in escrow from day one. Approve the milestone — receive your TND.",
                "title": "Get paid on approval"
            }
        },
        "heroTitle": "Simple by design.",
        "heroTitleHighlight": "Secure by default.",
        "subtitle": "Four steps from project idea to payment received — every step protected, every TND accounted for.",
        "tabs": {
            "client": "For Clients",
            "freelancer": "For Freelancers"
        },
        "title": "How WorkedIn Works",
        "trust": {
            "money": {
                "desc": "If work doesn't meet agreed terms, you get your TND back. No questions.",
                "title": "Full refund if unsatisfied"
            },
            "support": {
                "desc": "Real humans, local timezone, three languages.",
                "title": "Support in Arabic, French & English"
            },
            "verified": {
                "desc": "We check national ID before any freelancer goes live on WorkedIn.",
                "title": "Every professional is ID-verified"
            }
        }
    },
    "howItWorksSection": {
        "badge": "How it works",
        "heading": "From signup to paid in 4 steps.",
        "steps": {
            "1": {
                "step": "01",
                "subtitle": "Set your skills, rate, and portfolio in minutes.",
                "title": "Create your profile"
            },
            "2": {
                "step": "02",
                "subtitle": "Browse projects that fit your expertise.",
                "title": "Apply to matched jobs"
            },
            "3": {
                "step": "03",
                "subtitle": "Negotiate directly. No middlemen.",
                "title": "Agree on terms"
            },
            "4": {
                "step": "04",
                "subtitle": "Funds released via escrow on approval.",
                "title": "Get paid securely"
            }
        }
    },
    "inviteModal": {
        "alreadyApplied": "This freelancer has already applied to this job. You can hire them directly from the proposals.",
        "createNew": "Create a new job for this freelancer",
        "description": "Description",
        "error": "Failed to send offer. Please try again.",
        "existingJobs": "Your Open Jobs",
        "hire": "Hire",
        "noJobs": "You have no open jobs at the moment.",
        "success": "Success",
        "title": "Hire or Invite Freelancer"
    },
    "job": {
        "bankTransfer": "Bank Transfer",
        "budget": "Budget",
        "budgetHelp": "Enter your total budget",
        "cash": "Cash on Delivery",
        "d17": "D17",
        "deadline": "Deadline",
        "description": "Job Description",
        "descriptionPlaceholder": "Describe the job in detail...",
        "estimatedTime": "Within 1 hour",
        "matchesFound": "3 freelancers found!",
        "matching": "Finding freelancers...",
        "paymentMethod": "Payment Method",
        "postJob": "Post Job",
        "preview": "Preview",
        "requiredSkills": "Required Skills",
        "saveDraft": "Save Draft",
        "title": "Job Title",
        "titlePlaceholder": "Ex: Design a logo for a restaurant",
        "within1Day": "Within 1 day",
        "within1Week": "Within 1 week",
        "within3Days": "Within 3 days"
    },
    "jobDetail": {
        "aboutClient": "About Client",
        "approxHours": {
            "replace": "Replace"
        },
        "attachmentLabel": "Attachment {{index}}",
        "attachments": "Attachments",
        "avgHourlyPaid": "Avg Hourly Paid",
        "avgHourlyPaidFormat": "{{rate}} TND/hr",
        "balance": "Used today",
        "browseJobs": "Browse Jobs",
        "budget": "Budget",
        "cannotApplyTitle": "Cannot apply yet",
        "category": {
            "data": "Data",
            "design": "Design",
            "development": "Development",
            "marketing": "Marketing",
            "other": "Other",
            "translation": "Translation",
            "video": "Video",
            "writing": "Writing"
        },
        "clientCantApplyTitle": "Client accounts cannot apply",
        "clientRatingText": "{{rating}} of 5 reviews",
        "clientVerifications": "Verifications",
        "completeNow": "Complete now",
        "completeOnboardingTitle": "Complete onboarding first",
        "completeProfileTitle": "Complete your profile",
        "confirmWithdrawal": "Confirm Withdrawal",
        "dailyApplyAvailable": "Available today",
        "dailyApplyLimitDescription": "To reduce spam, you can submit up to {{limit}} proposals per day.",
        "dailyApplyLimitReached": "You reached your daily limit of {{limit}} applications. Try again tomorrow.",
        "dailyApplyLimitTitle": "Daily application limit",
        "dailyApplyReached": "Limit reached",
        "dailyApplyRemainingHint": "{{remaining}} applications remaining today.",
        "dailyApplyResetHint": "Daily limit reached. You can apply again tomorrow.",
        "deadline": "Deadline",
        "defaultCity": "Tunis",
        "defaultClient": "Client",
        "defaultMemberSince": "Mar 2026",
        "defaultTotalSpent": "15k+ TND",
        "description": "Job Description",
        "emailAddressVerified": "Email address verified",
        "error": "An error occurred",
        "experience": {
            "beginner": "Beginner",
            "expert": "Expert",
            "intermediate": "Intermediate"
        },
        "file": "File {{index}}",
        "fileType": "FILE",
        "fixedPrice": "Fixed Price",
        "hireRate": "Hire Rate",
        "hourly": "Hourly",
        "inlineRechargingHint": "Recharging in",
        "inlineRemainingHint": "{{remaining}} applications available",
        "insufficientBalance": "Daily limit reached",
        "jobNotFound": "Job not found",
        "jobRemoved": "Job removed from saved",
        "jobSaved": "Job saved",
        "jobStats": "Job Stats",
        "limit": "Limit",
        "linkCopied": "Link copied",
        "loginRequiredTitle": "Sign in to apply",
        "loginToSave": "Login to save job",
        "manageJob": "Manage job",
        "memberSince": "Member since",
        "openFile": "Open file",
        "paymentMethodVerified": "Payment method verified",
        "perHour": "/hour",
        "phoneNumberVerified": "Phone number verified",
        "postedJobs": "Posted Jobs",
        "postedLabel": "Posted",
        "proposalAccepted": "Your proposal was accepted",
        "proposalAcceptedStatus": "Accepted",
        "proposalDeclined": "Your proposal was declined",
        "proposalDeclinedStatus": "Declined",
        "proposalError": "Error submitting proposal",
        "proposalPendingStatus": "Pending",
        "proposalSent": "Proposal sent successfully!",
        "proposalSubmitted": "Your proposal was submitted",
        "proposalWithdrawn": "Proposal withdrawn successfully",
        "proposalWithdrawnStatus": "Withdrawn",
        "proposalWithdrawnTitle": "Your proposal was withdrawn",
        "proposals": "Proposals",
        "rating": "Rating",
        "readyToSubmit": "Ready to submit",
        "referenceLinks": "Reference links",
        "remaining": "Remaining",
        "removeFromSaves": "Remove from saves",
        "reportJob": "Report This Job",
        "reportJobDescription": "Tell us why this job violates our community guidelines.",
        "reportJobTitle": "Report Job",
        "reportReason": {
            "fraud": "Fraud",
            "inappropriate": "Inappropriate",
            "misleading": "Misleading",
            "other": "Other",
            "spam": "Spam"
        },
        "required": "Daily limit",
        "requiredSkills": "Required Skills",
        "saveJob": "Save this job",
        "shareJob": "Share this job",
        "signIn": "Sign in",
        "similarJobs": "Similar jobs",
        "submissionRequirements": "Submission Requirements",
        "submitProposal": "Submit Proposal",
        "submitReport": "Submit Report",
        "switchToFreelancer": "Switch to Freelancer",
        "timeAgo": {
            "day": "{{count}} day ago",
            "hour": "{{count}} hour ago",
            "minute": "{{count}} minute ago",
            "month": "{{count}} month ago",
            "week": "{{count}} week ago"
        },
        "totalSpending": "Total Spending",
        "used": "Used",
        "viewProfile": "View Profile",
        "viewProposal": "View proposal",
        "views": "Views",
        "withdrawConfirmDesc": "Are you sure you want to withdraw this proposal? This action cannot be undone.",
        "withdrawError": "Error withdrawing proposal",
        "withdrawProposal": "Withdraw Proposal",
        "yesWithdraw": "Yes, Withdraw",
        "yourBid": "Your bid:",
        "yourJob": "This is your job"
    },
    "jobMatches": {
        "contractCreated": "Contract started successfully!",
        "contractError": "Error creating contract",
        "searchError": "Error searching for matches"
    },
    "jobProposals": {
        "addedToShortlist": "Added to shortlist",
        "aiDesc": "We analyzed your requirements and found 3 freelancers that match your project at 95%.",
        "aiTitle": "AI Recommendations",
        "allProposals": "All Proposals",
        "archiveError": "Failed to archive proposal",
        "archived": "Archived",
        "clearFilters": "Clear Filters",
        "days": "days",
        "defaultCountry": "Tunisia",
        "defaultFreelancer": "Freelancer",
        "defaultUser": "User",
        "deliveryTbd": "TBD",
        "durationOngoing": "Ongoing",
        "edit": "Edit",
        "expectedDuration": "Expected Duration",
        "extraFilters": "Other Filters",
        "filterAndShow": "Filter & Show",
        "filterTitle": "Filter Proposals",
        "freelancerLevel": "Freelancer Level",
        "hasPortfolio": "Has portfolio",
        "highRated": "4 stars and above",
        "hire": "Hire",
        "hireDisabled": "Cannot hire declined proposal",
        "hireError": "Failed to hire freelancer. Try again",
        "hireFirst": "You must hire the freelancer first to start a conversation",
        "hireSuccess": "Freelancer hired successfully!",
        "interviews": "Interviews",
        "jobDetails": "Job Details",
        "jobsDone": "jobs done",
        "loadJobError": "Failed to load job data",
        "loadProposalsError": "Failed to load proposals",
        "loading": "Loading...",
        "message": "Chat",
        "modal": {
            "about": "About",
            "accepted": "Accepted",
            "archive": "Archive Proposal",
            "attachments": "Attachments",
            "available": "Available",
            "busy": "Busy",
            "confirmHire": "Hire this freelancer?",
            "confirmHireDesc": "A contract will be created and payment held in escrow.",
            "confirmYes": "Yes, Hire!",
            "coverLetter": "Cover Letter",
            "delivery": "Delivery",
            "escrowNote": "Payment is held in escrow until you approve the delivered work.",
            "freelancer": "Freelancer",
            "freelancerBid": "Freelancer's bid",
            "jobsDone": "Jobs Completed",
            "noPortfolio": "No portfolio items",
            "noPortfolioHint": "The freelancer has not added portfolio items yet.",
            "noProfile": "No profile information available.",
            "noReviews": "No reviews yet",
            "noReviewsHint": "Reviews will appear after completed contracts.",
            "proposalDetails": "Proposal Details",
            "rating": "Rating",
            "reject": "Decline",
            "rejected": "Not Selected",
            "responseTime": "Response Time",
            "responseTimeValue": "~1 hour",
            "reviews": "Reviews",
            "serviceFee": "Service fee (5%)",
            "submittedOn": "Submitted",
            "successRate": "Success Rate",
            "tabPortfolio": "Portfolio",
            "tabProfile": "Profile",
            "tabProposal": "Proposal",
            "tabReviews": "Reviews",
            "total": "Total to pay",
            "unarchive": "Unarchive Proposal"
        },
        "new": "New",
        "noCoverLetter": "No cover letter provided.",
        "noProposals": "No proposals yet",
        "noProposalsDesc": "You haven't received any proposals for this job yet. Try sharing the job to increase visibility.",
        "open": "Open",
        "proposalAccepted": "Your proposal has been accepted!",
        "proposalArchived": "Proposal archived",
        "proposalBid": "Bid Amount",
        "proposalUnarchived": "Proposal moved to active",
        "proposals": "Proposals",
        "readMore": "Read more",
        "receivedOn": "Received",
        "removedFromShortlist": "Removed from shortlist",
        "save": "Save",
        "saved": "Saved",
        "searchPlaceholder": "Search proposals...",
        "share": "Share",
        "shareProject": "Share Job",
        "shortlist": "Shortlist",
        "shortlistError": "Error updating shortlist",
        "shortlisted": "Shortlisted",
        "showLess": "Show less",
        "sort": {
            "highestBid": "Highest Bid",
            "label": "Sort proposals",
            "lowestBid": "Lowest Bid",
            "newest": "Newest",
            "rating": "Highest Rated",
            "recommended": "Best Match"
        },
        "sortBy": "Sort by",
        "successRate": "success rate",
        "topRated": "Top Rated",
        "unarchive": "Unarchive",
        "unarchiveError": "Failed to unarchive proposal",
        "verified": "Verified",
        "verifiedOnly": "Verified account only",
        "viewJob": "View Job",
        "viewSuggestions": "View Suggestions"
    },
    "jobs": {
        "apply": "Apply Now",
        "budget": "Budget",
        "empty": {
            "action": "Clear Filters",
            "subtitle": "Try changing your search criteria or filters",
            "title": "No jobs found"
        },
        "filters": {
            "budget": {
                "all": "All",
                "max": "Max",
                "min": "Min",
                "ranges": {
                    "r0_50": "0 - 50 TND",
                    "r100_250": "100 - 250 TND",
                    "r250_500": "250 - 500 TND",
                    "r500_plus": "500+ TND",
                    "r50_100": "50 - 100 TND"
                },
                "title": "Budget (TND)"
            },
            "categories": {
                "business": "Business",
                "data": "Data Entry",
                "design": "Design",
                "development": "Development",
                "marketing": "Marketing",
                "other": "Other",
                "title": "Category",
                "translation": "Translation",
                "video": "Video & Animation",
                "writing": "Writing"
            },
            "clearAll": "Clear All",
            "clearAria": "Clear all filters",
            "closeAria": "Close filters",
            "experience": {
                "entry": "Entry Level",
                "expert": "Expert",
                "intermediate": "Intermediate",
                "title": "Experience Level"
            },
            "jobType": {
                "fixed_price": "Fixed Price",
                "hourly": "Hourly",
                "title": "Job Type"
            },
            "postedDate": {
                "any": "Any Time",
                "d3": "Last 3 Days",
                "h24": "Last 24 Hours",
                "m1": "Last Month",
                "title": "Posted Date",
                "w1": "Last Week"
            },
            "title": "Filters",
            "viewResults": "View Results"
        },
        "hourlyRate": "Hourly Rate",
        "loadError": "Failed to load jobs",
        "loadMore": "Load More",
        "location": {
            "remote": "Remote"
        },
        "new": {
            "actions": {
                "next": "Next",
                "previous": "Previous",
                "publishJob": "Publish job",
                "saveDraft": "Save draft"
            },
            "autosave": {
                "lastSaved": "Last saved: {{time}}",
                "notSaved": "Not saved yet",
                "ready": "Autosave ready",
                "saved": "Saved",
                "savedAt": "Saved at {{time}}",
                "saving": "Saving..."
            },
            "currentPhase": "Current phase",
            "errors": {
                "attachmentsPartial": "Attachments Partial",
                "attachmentsUnavailable": "Attachments could not be uploaded right now. Your job will be posted without them.",
                "attachmentsUploadFailed": "Attachments upload failed. Please retry with smaller or different files.",
                "dbError": "Db Error",
                "loginRequired": "You must be logged in to post a job",
                "saveFailed": "Something went wrong while saving the job",
                "stepIncomplete": "Please complete the required fields before continuing.",
                "titleRequiredForDraft": "Please enter a job title to save draft"
            },
            "expertTips": {
                "budgetModelLabel": "Budget Model:",
                "budgetModelText": "Choose Fixed Price for well-defined outcomes, and Hourly for ongoing or dynamic briefs.",
                "deadlineBufferLabel": "Deadline Buffer:",
                "deadlineBufferText": "Setting a realistic date encourages high-quality, professional applications.",
                "inviteOnlyLabel": "Invite-only:",
                "inviteOnlyText": "Best for private/sensitive IP or when you personally select top freelancers.",
                "lockStructureLabel": "Lock Structure:",
                "lockStructureText": "Verify all specs. The core structure is finalized upon publishing to ensure bid consistency.",
                "publicBriefsLabel": "Public Briefs:",
                "publicBriefsText": "Great for maximum proposals and competitive price bidding.",
                "richContextLabel": "Rich Context:",
                "richContextText": "Provide clear parameters on scope, final deliverables, and success criteria.",
                "specificTitleLabel": "Specific Title:",
                "specificTitleText": "Describe exactly what you need. A clear title attracts matching specialists immediately."
            },
            "expertTipsTitle": "Expert Tips",
            "fields": {
                "attachments": "Attachments (optional)",
                "attachmentsDrop": "Drag files here or click to browse",
                "attachmentsHint": "PDF, DOC, DOCX, TXT, PNG, JPG, WEBP - Max 10MB per file",
                "attachmentsHint2": "Provide assets, mockups, or detailed specs to clarify work deliverables.",
                "categoryHint": "Choose the best fit category to enable automated expert match alerts.",
                "charCount": "{{current}} / {{max}} characters",
                "chooseFiles": "Choose files",
                "description": "Project description",
                "descriptionHint": "Explain the scope, expected parameters, and what successful deliverables look like.",
                "descriptionPlaceholder": "Provide detailed background, target audience, technical specifications, and key deliverables...",
                "mainCategory": "Main category",
                "requiredSkills": "Required skills (max 5)",
                "selectCategory": "Select category",
                "selectSubcategory": "Select subcategory",
                "skillsHint": "Tag precise skills to target specialized freelancers for direct application invitations.",
                "skillsPlaceholder": "Try Graphic Design, React, Motion Design...",
                "subcategory": "Subcategory",
                "subcategoryHint": "Pick the exact specialty to filter bids and ensure precise skills matching.",
                "suggested": "Suggested:",
                "title": "Project title",
                "titleHint": "Use specific technical terms to help the right freelancers find you.",
                "titlePlaceholder": "Example: Modern bilingual logo system for a Tunisian cafe"
            },
            "heroDescription": "Move through the brief in focused phases: define the work, set budget and timing, choose visibility, then review before publishing.",
            "heroTitle": "Post a project with clarity and attract better-fit freelancers.",
            "links": {
                "add": "Add link",
                "description": "Add Google Drive, portfolio, or social links so freelancers can review context quickly.",
                "duplicate": "This link was already added.",
                "invalid": "Please enter a valid URL.",
                "maxLinksReached": "You can add up to {{count}} links.",
                "placeholder": "Paste link (e.g. drive.google.com/... or linkedin.com/in/...)",
                "remove": "Remove link",
                "title": "Reference links (optional)"
            },
            "progress": "Progress",
            "quality": {
                "categorySelected": "Category selected",
                "clearTitle": "Clear title",
                "relevantSkills": "Relevant skills",
                "strongDescription": "Strong description",
                "title": "Quality Score"
            },
            "restoreDraft": {
                "description": "We found a saved draft from {{time}}. Do you want to restore and continue?",
                "jobTitle": "Title",
                "restore": "Restore draft",
                "startFresh": "Start fresh",
                "title": "Restore draft",
                "untitled": "(Untitled)"
            },
            "seo": {
                "description": "Create a new project, define budget and timeline, and publish it to receive freelancer proposals.",
                "title": "Post a Project"
            },
            "snippetDeliverables": "Deliverables",
            "snippetDeliverablesText": "Deliverables: Source files, deployment-ready build, and concise documentation.",
            "snippetScope": "Scope",
            "snippetScopeText": "Scope: Build a responsive experience aligned with our brand guidelines.",
            "snippetSuccess": "Success",
            "snippetSuccessText": "Success criteria: Pixel-perfect UI, strong performance, and clean handoff.",
            "step1": {
                "subtitle": "Start with a clear title and strong context."
            },
            "stepBasics": {
                "attachmentLabel": "Attachment Label",
                "attachments": "Attachments (optional)",
                "attachmentsDescription": "PDF, DOC, DOCX, TXT - Max 10MB per file",
                "badge": "Project brief",
                "categoryDesign": "Design and Creativity",
                "categoryDevelopment": "Development",
                "categoryMarketing": "Marketing and Sales",
                "categoryWriting": "Writing and Translation",
                "characterCount": "{{current}} / {{max}} characters",
                "currentAttachments": "Current attachments",
                "mainCategory": "Main category",
                "projectDescription": "Project description",
                "projectDescriptionPlaceholder": "Describe project details, expected deliverables, and any special requirements...",
                "projectTitle": "Project title",
                "projectTitlePlaceholder": "Example: Logo design for a food company",
                "removeExistingAttachment": "Remove attachment",
                "requiredSkills": "Required skills (max 5)",
                "selectCategory": "Select category",
                "selectSubcategory": "Select subcategory",
                "subcategory": "Subcategory",
                "subtitle": "Start with a clear title and a detailed project description to attract the best freelancers.",
                "tip1": "Be specific about the required work",
                "tip2": "Clearly define final deliverables",
                "tip3": "Add links to similar projects if available",
                "tip4": "Clarify what should be delivered and when you expect completion",
                "title": "Job details"
            },
            "stepBudget": {
                "badge": "Pricing setup",
                "beginner": "Entry Level",
                "beginnerSubtitle": "Simple tasks or budget-friendly options",
                "budgetAmount": "Budget Amount",
                "deadline": "Deadline Date",
                "duration": "Project Duration",
                "duration1To3Months": "1 to 3 months",
                "duration3To6Months": "3 to 6 months",
                "durationLessThan1Month": "Less than 1 month",
                "durationMoreThan6Months": "More than 6 months",
                "estimatedBudget": "Estimated Project Budget",
                "experienceLevel": "Required Experience Level",
                "experienceLevelHint": "Select the expertise level needed to ensure relevant applications.",
                "expert": "Expert",
                "expertSubtitle": "High-tier specialists for complex needs",
                "fixedExact": "Fixed Price (Exact)",
                "fixedExactDescription": "Specify a set budget for the entire scope of work. Best for well-defined tasks.",
                "fixedExactHint": "Specify the exact fixed price for this project.",
                "fixedExactSubtitle": "Single fixed budget",
                "fixedPrice": "Fixed price",
                "fixedPriceDescription": "Pay a fixed amount for the entire project upon completion.",
                "fixedRange": "Fixed Price (Range)",
                "fixedRangeDescription": "Define a budget window to invite proposals matching your expected bracket.",
                "fixedRangeHint": "Specify a range to attract bids within your target cost.",
                "fixedRangeSubtitle": "Budget min-max range",
                "fullTime30": "Full-time (up to 30 hrs/week)",
                "fullTime40": "Full-time (up to 40 hrs/week)",
                "hourly": "Hourly Rate",
                "hourlyDescription": "Pay by the hour based on tracked logs. Best for ongoing or evolving work.",
                "hourlyHint": "Determine the hourly rate and weekly time commitment limit.",
                "hourlyRate": "Hourly Rate",
                "hourlyRateExample": "Example: 20",
                "hourlySetup": "Hourly Pricing Details",
                "hourlySubtitle": "Time-logged billing",
                "intermediate": "Intermediate",
                "intermediateSubtitle": "Solid experience for standard goals",
                "max": "Maximum Budget",
                "min": "Minimum Budget",
                "partTime10": "Part-time (up to 10 hrs/week)",
                "partTime20": "Part-time (up to 20 hrs/week)",
                "pricingMode": "Pricing Model",
                "selectDuration": "Select duration",
                "subtitle": "Choose the payment model and set your project budget",
                "title": "Budget and timeline",
                "weeklyHours": "Weekly hours limit",
                "weeklyHoursExample": "Example: 10-20"
            },
            "stepCounter": "Step {{current}} of {{total}}",
            "stepReview": {
                "attachmentLabel": "Attachment Label",
                "attachments": "Attachments",
                "badge": "Final check",
                "beginner": "Beginner",
                "budget": "Budget",
                "budgetRange": "Budget Range",
                "currentAttachments": "Current attachments",
                "deadline": "Deadline",
                "duration1To3Months": "1 - 3 months",
                "duration3To6Months": "3 - 6 months",
                "durationLessThan1Month": "Less than 1 month",
                "durationMoreThan6Months": "More than 6 months",
                "estimatedHours": "Estimated Hours",
                "experienceLevel": "Required level",
                "expert": "Expert",
                "fileSize": "File Size",
                "hourlyBudget": "{{rate}} TND / hour",
                "intermediate": "Intermediate",
                "inviteOnlyVisibility": "Private (invite only)",
                "linkLabel": "Link Label",
                "links": "Reference links",
                "now": "Now",
                "privacyLevel": "Privacy level",
                "projectDescription": "Project description",
                "projectDuration": "Project duration",
                "publicVisibility": "Public (everyone)",
                "requiredSkills": "Required skills",
                "subtitle": "Review the brief one last time before it goes live to freelancers.",
                "title": "Review and publish",
                "visibility": "Visibility",
                "warning": "Please review your job details carefully before publishing. After publishing, only some details can be edited.",
                "weeklyHoursBadge": "Weekly Schedule"
            },
            "stepVisibility": {
                "badge": "Audience control",
                "inviteOnlyDescription": "The job will not appear in search. Only invited freelancers can submit proposals.",
                "inviteOnlyTitle": "Invite only",
                "publicDescription": "All freelancers can see and submit proposals. Best for getting more proposals.",
                "publicTitle": "Public",
                "subtitle": "Choose the privacy level that fits your project.",
                "tipDescription": "If your project is sensitive or requires niche skills, invite-only gives you more control. For general projects, public visibility increases competition and pricing options.",
                "tipTitle": "Tip:",
                "title": "Who can see your job?"
            },
            "steps": {
                "basics": "Job details",
                "basicsDescription": "Define the brief, category, and required skills clearly.",
                "budget": "Budget and timeline",
                "budgetDescription": "Set pricing model, expected duration, and experience level.",
                "review": "Review and publish",
                "reviewDescription": "Validate the brief before sending it live.",
                "visibility": "Visibility",
                "visibilityDescription": "Choose whether the brief is public or invite-only."
            },
            "time": {
                "hoursAgo": "{{count}} h ago",
                "minutesAgo": "{{count}} min ago",
                "now": "Just now"
            },
            "tips": {
                "handoff": "Clarify what should be delivered at handoff.",
                "references": "Add links, references, or examples if available.",
                "scope": "Be specific about scope and expected quality.",
                "success": "Clearly define what success looks like."
            },
            "titleTemplateDash": "React dashboard with analytics widgets",
            "titleTemplateLanding": "Landing page redesign for SaaS product",
            "titleTemplateLogo": "Logo design for a food company",
            "titleTemplateVideo": "Short-form video editor for social ads",
            "toasts": {
                "draftRestored": "Draft restored successfully",
                "draftSaved": "Draft saved successfully",
                "jobPosted": "Job posted successfully!",
                "repostPrefilled": "Previous project loaded. Review and publish when ready."
            },
            "validation": {
                "budgetMax": "Maximum budget must be at least 1",
                "budgetMin": "Minimum budget must be at least 1",
                "budgetRange": "Maximum budget must be greater than or equal to minimum budget",
                "budgetRequired": "Please set a budget",
                "categoryRequired": "Please select a category",
                "deadlineFuture": "Deadline must be today or later",
                "deadlineRequired": "Please select a deadline",
                "descriptionMin": "Description must be at least 80 characters",
                "durationRequired": "Please select a duration",
                "estimatedHours": "Please enter estimated weekly hours",
                "hourlyRate": "Hourly rate must be at least 1",
                "maxFiles": "Maximum 5 files",
                "maxReferenceLinks": "Max Reference Links",
                "referenceLinksInvalid": "Please enter valid links only",
                "skillsRequired": "Please select at least one skill",
                "subcategoryInvalid": "Please select a valid subcategory",
                "subcategoryRequired": "Please select a subcategory",
                "titleMin": "Title must be at least 8 characters"
            },
            "warnings": {
                "linksTemporarilyUnavailable": "Links were saved in the form but could not be persisted yet. Please run latest migrations."
            },
            "wizard": {
                "badge": "Project posting flow",
                "currentPhase": "Current phase",
                "metaDraft": "Draft-safe flow",
                "progress": "Progress",
                "stepsLeft": "steps left"
            }
        },
        "newClient": "New Client",
        "posted": {
            "description": "Your brief has been published successfully. Freelancers can now discover it, and proposals will start rolling in soon.",
            "goToDashboard": "Dashboard",
            "linkCopied": "Job link copied to clipboard!",
            "shareNetwork": "Share with your network",
            "title": "Your job is live and ready.",
            "viewJob": "View Job / Proposals"
        },
        "postedAgo": "Posted {{time}}",
        "proposals": "proposals",
        "save": "Save Job",
        "saved": "Job Saved",
        "savedJobs": {
            "title": "Saved Jobs",
            "viewAll": "View All"
        },
        "searchPlaceholder": "Search for jobs...",
        "sort": {
            "budgetHigh": "Budget: High to Low",
            "budgetLow": "Budget: Low to High",
            "newest": "Newest First",
            "proposalsHigh": "Most Proposals",
            "proposalsLow": "Fewest Proposals"
        },
        "stats": {
            "availableJobs": "jobs available"
        },
        "time": {
            "ago": "ago",
            "ago_prefix": "",
            "day": "d",
            "hour": "h",
            "minute": "min",
            "now": "Just now"
        },
        "title": "Available Jobs",
        "type": {
            "fixed": "Fixed",
            "hourly": "Hourly"
        },
        "unsave": "Unsave Job",
        "unverifiedPayment": "Payment Unverified",
        "verifiedPayment": "Payment Verified"
    },
    "languages": {
        "ar": {
            "code": "AR",
            "country": "TN",
            "name": "العربية"
        },
        "en": {
            "code": "EN",
            "country": "GB",
            "name": "English"
        },
        "fr": {
            "code": "FR",
            "country": "FR",
            "name": "Français"
        }
    },
    "legalPages": {
        "privacy": {
            "lastUpdated": "Last updated: January 2026",
            "sections": {
                "contact": {
                    "emailLabel": "Email:",
                    "intro": "For privacy-related inquiries:",
                    "title": "7. Contact"
                },
                "cookies": {
                    "text": "We use cookies to improve your experience. You can manage these settings in your browser.",
                    "title": "6. Cookies"
                },
                "dataCollection": {
                    "intro": "We collect the following information when you use the platform:",
                    "items": {
                        "account": "Account information: name, email, phone number",
                        "payment": "Payment information: bank account details (encrypted)",
                        "profile": "Profile information: skills, experience, images",
                        "usage": "Usage data: visited pages, time spent"
                    },
                    "title": "1. Data We Collect"
                },
                "protection": {
                    "intro": "We use advanced security measures to protect your data:",
                    "items": {
                        "audits": "Regular security reviews",
                        "database": "Encryption of sensitive database data",
                        "ssl": "SSL/TLS encryption for all communications"
                    },
                    "title": "4. Data Protection"
                },
                "rights": {
                    "items": {
                        "access": "Access your personal data",
                        "correction": "Correct inaccurate data",
                        "deletion": "Delete your account and data",
                        "export": "Export your data"
                    },
                    "title": "5. Your Rights"
                },
                "sharing": {
                    "intro": "We do not sell your personal data. We may share it with:",
                    "items": {
                        "legalAuthorities": "Legal authorities (upon official request)",
                        "paymentProviders": "Payment service providers (to process transactions)",
                        "publicProfile": "Other users (public profile information)"
                    },
                    "title": "3. Data Sharing"
                },
                "usage": {
                    "items": {
                        "experience": "Improve user experience",
                        "improve": "Provide and improve our services",
                        "notifications": "Send important notifications",
                        "security": "Prevent fraud and protect security",
                        "transactions": "Process financial transactions"
                    },
                    "title": "2. How We Use Your Data"
                }
            },
            "title": "Privacy Policy"
        },
        "terms": {
            "lastUpdated": "Last updated: January 2026",
            "sections": {
                "contact": {
                    "emailLabel": "Email:",
                    "intro": "To contact us about these terms:",
                    "title": "6. Contact"
                },
                "contractsPayments": {
                    "intro": "WorkedIn.tn acts as an intermediary between freelancers and clients. We are not a party to the contracts between them.",
                    "items": {
                        "fee": "Platform fee: 5% of each contract value",
                        "holdPeriod": "Payment hold period: 7 days",
                        "secureMethods": "Payments are processed via secure approved methods"
                    },
                    "title": "4. Contracts and Payments"
                },
                "disputes": {
                    "text": "In case of dispute, we provide an arbitration mechanism. Support team decisions are final and binding.",
                    "title": "5. Dispute Resolution"
                },
                "intro": {
                    "text": "Welcome to WorkedIn.tn, Tunisia's leading freelance platform. By using this platform, you agree to comply with these terms and conditions.",
                    "title": "1. Introduction"
                },
                "platformUse": {
                    "intro": "Using the platform for the following is prohibited:",
                    "items": {
                        "abusive": "Posting abusive or harmful content",
                        "dataHarvesting": "Collecting user data without authorization",
                        "illegal": "Any illegal activity",
                        "impersonation": "Impersonating others",
                        "paymentBypass": "Bypassing payment mechanisms"
                    },
                    "title": "3. Platform Use"
                },
                "registration": {
                    "items": {
                        "accuracy": "Provided information must be accurate and up to date",
                        "age": "You must be at least 18 years old to register",
                        "report": "You must notify us immediately of any unauthorized use",
                        "security": "You are responsible for keeping your account secure"
                    },
                    "title": "2. Registration and Accounts"
                }
            },
            "title": "Terms of Service"
        }
    },
    "messages": {
        "attachFile": "Attach file",
        "filters": {
            "unread": "Unread"
        },
        "lifecycleBanner": "Lifecycle Banner",
        "messagePlaceholder": "Write your message...",
        "noConversationsFound": "No conversations found.",
        "readOnlyThread": "Read Only Thread",
        "recordVoice": "Record voice message",
        "recording": "Recording...",
        "searchPlaceholder": "Search messages...",
        "sentAttachment": "Sent an attachment",
        "stopRecording": "Stop recording",
        "title": "Messages"
    },
    "mobileNav": {
        "client": "Client",
        "freelancer": "Freelancer"
    },
    "nav": {
        "account": "Account",
        "adminDashboard": "Admin Dashboard",
        "client": {
            "activeProjects": "Active Projects",
            "activeProjectsDesc": "Manage live briefs and hiring",
            "browseTalent": "Browse Talent",
            "browseTalentDesc": "Find skilled Tunisian freelancers",
            "drafts": "Drafts",
            "draftsDesc": "All your posted projects",
            "finished": "Finished",
            "finishedDesc": "Review completed project history",
            "freelancers": "Freelancers",
            "savedProfiles": "Saved Profiles",
            "savedProfilesDesc": "Return to shortlisted talent"
        },
        "contracts": "Contracts",
        "dashboard": "Dashboard",
        "findFreelancers": "Find Freelancers",
        "findFreelancersTitle": "Find Freelancers",
        "findWork": "Find Work",
        "forClients": "For Clients",
        "forFreelancers": "For Freelancers",
        "freelancer": {
            "bestMatches": "Best Matches",
            "bestMatchesDesc": "Opportunities tuned to your profile",
            "browseJobs": "Browse Jobs",
            "browseJobsDesc": "Explore open local projects",
            "overview": "Overview",
            "overviewDesc": "Balance and payment status",
            "savedJobs": "Saved Jobs",
            "savedJobsDesc": "Track roles you want to revisit",
            "transactions": "Transactions",
            "transactionsDesc": "Review payout activity",
            "withdraw": "Withdraw",
            "withdrawDesc": "Move earnings to your account"
        },
        "home": "Home",
        "howItWorks": "How It Works",
        "jobs": "Available Jobs",
        "login": "Sign in",
        "logout": "Logout",
        "messages": "Messages",
        "myJobs": "My Jobs",
        "myProjects": "My Projects",
        "postProject": "Post Project",
        "pricing": "Pricing",
        "profile": "Profile",
        "proposals": "Proposals",
        "saved": "Saved",
        "settings": "Settings",
        "signup": "Create account",
        "wallet": "Wallet"
    },
    "notFound": {
        "description": "The page you're looking for doesn't exist or has been moved.",
        "goBack": "Go Back",
        "goHome": "Go Home",
        "title": "Page Not Found"
    },
    "notificationSettings": {
        "contractUpdates": "Contracts"
    },
    "notifications": {
        "caughtUp": "You're all caught up",
        "contract": {
            "active": {
                "body": "{{body}}",
                "title": "Contract Started"
            },
            "cancelled": {
                "body": "{{body}}",
                "title": "Contract Cancelled"
            },
            "completed": {
                "body": "{{body}}",
                "title": "Contract Completed"
            },
            "disputed": {
                "body": "{{body}}",
                "title": "Contract in Dispute"
            },
            "update": {
                "body": "{{body}}",
                "title": "Contract Update"
            }
        },
        "delete": "Delete notification",
        "empty": "No notifications",
        "emptyDesc": "We will notify you when something important happens with your projects or payments",
        "errors": {
            "deleteFailed": "Failed to delete notification"
        },
        "identity": {
            "rejected": {
                "body": "Your identity verification request was rejected. Please make sure the images are clear and submit again.",
                "title": "Identity verification request rejected"
            },
            "submitted": {
                "body": "Your identity verification request has been received. Our team is reviewing your documents.",
                "title": "Verification request received"
            },
            "verified": {
                "body": "Your account is now verified. You received the verification badge.",
                "title": "Identity verified successfully"
            }
        },
        "message": {
            "deleted": "This message has been deleted",
            "title": "New message from {{sender}}"
        },
        "overview": {
            "description": "Keep track of all actions, updates, and deliverables on your projects.",
            "settings": "Preferences",
            "title": "Activity Summary",
            "total": "Total notifications",
            "unread": "Unread alerts"
        },
        "proposal": {
            "accepted": {
                "body": "Your proposal on '{{jobTitle}}' was accepted!",
                "title": "Proposal Accepted"
            },
            "new": {
                "body": "{{freelancer}} submitted a proposal on '{{jobTitle}}'",
                "title": "New Proposal Received"
            }
        },
        "readAll": "Mark all as read",
        "time": {
            "daysAgo": "{{count}}d ago",
            "hoursAgo": "{{count}}h ago",
            "justNow": "Just now",
            "minutesAgo": "{{count}}m ago"
        },
        "title": "Notifications",
        "unreadCount": "Unread Count",
        "viewAll": "View all notifications"
    },
    "onboarding": {
        "client": {
            "profileDesc": "The basic info freelancers will see first.",
            "profileTitle": "Client Profile",
            "timeoutError": "The request took too long. Please try again.",
            "welcome": "Welcome",
            "welcomeDesc": "Finalize your client profile to post projects with confidence."
        },
        "currentStep": "Current step",
        "freelancer": {
            "basicInfoSaved": "Basic info saved",
            "completeLaterHint": "You can add certificates, portfolio, and additional profile details later from Settings.",
            "completionFailed": "Failed to complete onboarding. Please try again.",
            "connectionFailed": "Connection failed. Check your internet connection and try again.",
            "finishSetup": "Finish setup",
            "hourlyRateHint": "Shown to clients on your profile and used in search filters. You can update it later.",
            "hourlyRateLabel": "Hourly Rate Label",
            "hourlyRatePlaceholder": "e.g. 35",
            "maxSkills": "Max 5 skills",
            "noAuthSession": "No auth session - please login again",
            "selectAtLeastOneSkill": "Please select at least one skill",
            "serverConnectionFailed": "Failed to connect to server. Check your internet connection and try again.",
            "skillsClarification": "These skills appear on your profile and in client search filters. Pick only what you can deliver now.",
            "skillsRateAndAvailability": "Skills, rate, and availability",
            "skillsSaveFailed": "Failed to save skills",
            "step1Description": "Add the details clients will see first when deciding whether to trust your profile.",
            "step2Description": "Use Upwork-style profile signals: clear services, realistic hourly rate, and current availability.",
            "step2TitleUpdated": "Choose skills and set your hourly rate",
            "step3Description": "Upwork-style profile details: tools you actually use, industries you understand, portfolio links, and clear revision terms.",
            "step3Title": "Show proof and set delivery expectations",
            "stepBasicInfo": "Basic information",
            "stepCounter": "Step {{step}} of {{total}}",
            "stepProof": "Profile details and proof",
            "stepSkillsExperience": "Skills and experience",
            "steps": {
                "bio": "Bio",
                "experience": "Experience",
                "portfolio": "Portfolio",
                "skills": "Skills"
            },
            "uploadAvatar": "Profile Picture",
            "uploadAvatarDesc": "A professional photo is recommended",
            "welcome": "Welcome",
            "welcomeDesc": "Complete your freelancer profile and start receiving real opportunities.",
            "welcomeToast": "Welcome to WorkedIn!"
        },
        "progressive": {
            "client": {
                "accountTypes": {
                    "company": "Company",
                    "individual": "Individual"
                },
                "completedMessage": "Client onboarding data is complete and ready.",
                "completedSubtitle": "Your client profile is now ready. You can continue to your dashboard.",
                "completedTitle": "Onboarding completed",
                "errors": {
                    "accountTypeRequired": "Account type is required.",
                    "companyNameRequired": "Company name is required for company accounts.",
                    "fullNameRequired": "Full name is required.",
                    "locationRequired": "Location is required.",
                    "phoneRequired": "Phone number is required.",
                    "primaryGoalRequired": "Primary goal is required."
                },
                "fields": {
                    "accountType": "Account Type",
                    "companyName": "Company Name",
                    "primaryGoal": "Primary Goal"
                },
                "placeholders": {
                    "companyName": "Your company name",
                    "phoneNumber": "+216 00 000 000"
                },
                "primaryGoals": {
                    "buildTeam": "Build a team",
                    "justBrowsing": "Just browsing",
                    "specificProject": "Hire for a specific project"
                },
                "stepSubtitles": {
                    "accountDetails": "Just the essentials so your account is trusted and complete.",
                    "hiringIntent": "Tell us what you want to hire for so we can personalize matching."
                },
                "steps": {
                    "accountDetails": "Account Details",
                    "hiringIntent": "Hiring Intent"
                },
                "tips": {
                    "accountDetails": "A complete account profile increases reply rates and reduces drop-off during first client-freelancer contact.",
                    "hiringIntent": "Clear hiring intent improves recommendations and helps the platform suggest higher-quality candidates."
                }
            },
            "common": {
                "accountInactive": "Your account is not active. Please contact support.",
                "back": "Back",
                "completeProfile": "Complete Profile",
                "completeRequiredFields": "Please complete required fields before continuing.",
                "completing": "Completing...",
                "completionFailed": "Failed to complete onboarding. Please try again.",
                "conflictRetry": "A conflicting update was detected. Please try again.",
                "exitOnboarding": "Exit Onboarding",
                "fields": {
                    "fullName": "Full Name",
                    "location": "Location",
                    "phoneNumber": "Phone Number"
                },
                "fixBeforeContinue": "Please fix this before continuing: {{error}}",
                "invalidPhone": "Please enter a valid phone number.",
                "nextStep": "Next Step",
                "onboardingRequired": "Please complete your onboarding profile before accessing other pages.",
                "phoneTaken": "This phone number is already in use by another account.",
                "placeholders": {
                    "fullName": "Your full name",
                    "selectLocation": "Select location"
                },
                "proTip": "Pro Tip",
                "removeTagAria": "Remove {{item}}",
                "saveExit": "Save & Exit",
                "stepCounter": "Step {{step}} of {{total}}",
                "unsavedConfirm": "You have unsaved onboarding progress. Exit anyway?"
            },
            "freelancer": {
                "availability": {
                    "asNeeded": "As needed",
                    "fullTime": "Full-time",
                    "partTime": "Part-time"
                },
                "categories": {
                    "business": "Business",
                    "data": "Data",
                    "design": "Design",
                    "development": "Development",
                    "marketing": "Marketing",
                    "video": "Video",
                    "writing": "Writing"
                },
                "completedMessage": "Thanks. Your onboarding information has been captured with a progressive structure.",
                "completedSubtitle": "Your freelancer onboarding data is ready. You can now move to your dashboard.",
                "completedTitle": "Profile setup completed",
                "currency": "TND",
                "errors": {
                    "availabilityRequired": "Select availability.",
                    "avatarRequired": "Avatar is required.",
                    "coreSkillRequired": "Add at least one core skill.",
                    "experienceRequired": "Select years of experience.",
                    "fullNameRequired": "Full name is required.",
                    "hourlyRateInvalid": "Hourly rate must be greater than 0.",
                    "locationRequired": "Location is required.",
                    "mainCategoryRequired": "Main category is required.",
                    "phoneRequired": "Phone number is required.",
                    "portfolioRequired": "Portfolio link is required.",
                    "professionalTitleRequired": "Professional title is required.",
                    "summaryRequired": "Summary is required.",
                    "summaryTooLong": "Summary must be 500 characters or less.",
                    "toolRequired": "Add at least one tool."
                },
                "experience": {
                    "0to2": "0-2",
                    "3to5": "3-5",
                    "5plus": "5+"
                },
                "fields": {
                    "availability": "Availability",
                    "avatarHint": "PNG, JPG, WEBP",
                    "avatarPreviewAlt": "Avatar preview",
                    "avatarUpload": "Avatar Upload (Required)",
                    "bioSummary": "Bio/Summary",
                    "chooseAvatar": "Choose avatar",
                    "coreSkills": "Core Skills",
                    "hourlyRate": "Hourly Rate",
                    "mainCategory": "Main Category",
                    "portfolioLink": "Portfolio Link",
                    "professionalTitle": "Professional Title",
                    "toolsUsed": "Tools Used",
                    "yearsOfExperience": "Years of Experience"
                },
                "hints": {
                    "coreSkills": "Search and add up to 30 skills",
                    "phoneNumber": "For security and verified badge.",
                    "toolsUsed": "Search and add up to 15 tools"
                },
                "placeholders": {
                    "availability": "Select availability",
                    "bioSummary": "What do you do best and what kind of projects excite you?",
                    "coreSkills": "Type a skill and press Enter",
                    "experienceRange": "Select range",
                    "hourlyRate": "80",
                    "phoneNumber": "For security and verified badge",
                    "portfolioLink": "https://your-portfolio.com",
                    "professionalTitle": "Senior React Developer",
                    "selectCategory": "Select category",
                    "toolsUsed": "Type a tool and press Enter"
                },
                "skillSuggestions": {
                    "contentWriting": "Content Writing",
                    "dataAnalysis": "Data Analysis",
                    "figma": "Figma",
                    "googleAds": "Google Ads",
                    "illustrator": "Illustrator",
                    "motionDesign": "Motion Design",
                    "nextjs": "Next.js",
                    "nodejs": "Node.js",
                    "projectManagement": "Project Management",
                    "python": "Python",
                    "react": "React",
                    "seo": "SEO",
                    "tailwind": "Tailwind CSS",
                    "typescript": "TypeScript",
                    "uiux": "UI/UX Design"
                },
                "stepSubtitles": {
                    "businessRates": "Set clear business terms to align expectations.",
                    "expertise": "Define your strengths so matching quality improves.",
                    "identityPitch": "Start with who you are and how you present your value.",
                    "trustProof": "Add trust signals that make clients confident to hire."
                },
                "steps": {
                    "businessRates": "Business & Rates",
                    "expertise": "Expertise",
                    "identityPitch": "Identity & Pitch",
                    "trustProof": "Trust & Proof"
                },
                "tips": {
                    "businessRates": "Transparent rates reduce negotiation friction and help serious clients shortlist you faster.",
                    "expertise": "The right tags make matching smarter. Add only your strongest skills and tools to attract best-fit projects.",
                    "identityPitch": "Clients decide in seconds. A clear title and confident profile summary instantly builds trust.",
                    "trustProof": "Verified details and a portfolio link are your credibility boosters. They increase response rates significantly."
                },
                "toolSuggestions": {
                    "canva": "Canva",
                    "docker": "Docker",
                    "figma": "Figma",
                    "framer": "Framer",
                    "github": "GitHub",
                    "illustrator": "Illustrator",
                    "jira": "Jira",
                    "notion": "Notion",
                    "photoshop": "Photoshop",
                    "slack": "Slack",
                    "vscode": "VS Code",
                    "webflow": "Webflow"
                }
            }
        }
    },
    "pages": {
        "authCallback": {
            "backToLogin": "Back to login",
            "errorCode": "Error code: {{code}}",
            "loginIncomplete": "Login did not complete",
            "loginIncompleteDescription": "We could not confirm your session yet. Try again, or return to login and retry the provider sign-in.",
            "signingIn": "Signing you in",
            "signingInDescription": "We are finishing your secure login. This should only take a moment.",
            "tryAgain": "Try again"
        },
        "clientJobs": {
            "active": "Active",
            "all": "All",
            "budgetNotSet": "Budget not set",
            "completed": "Completed",
            "daysAgo": "{{days}} days ago",
            "delete": "Delete",
            "deleteBlocked": "Cannot delete a project that already has a contract.",
            "deleteConfirmText": "Are you sure you want to delete this project permanently? This action cannot be undone.",
            "deleteConfirmTitle": "Delete Project",
            "deleteError": "Failed to delete project",
            "deleteSuccess": "Project deleted",
            "deleting": "Deleting...",
            "edit": "Edit",
            "emptyDescription": "Post your first project and receive proposals from verified professionals.",
            "emptyFilteredDescription": "Try another tab or adjust search to see your other projects.",
            "emptyFilteredTitle": "No projects in this tab",
            "emptyTitle": "No projects yet",
            "finished": "Finished",
            "finishedBreakdown": "Finished Breakdown",
            "fixedPrice": "Fixed Price",
            "hourlyRate": "Hourly Rate",
            "inProgress": "In progress",
            "inReview": "In review",
            "loading": "Loading projects...",
            "needsAttention": "Needs attention",
            "oneDayAgo": "1 day ago",
            "open": "Open",
            "openContract": "Workspace",
            "postFree": "Post a project - it's free",
            "postProject": "Post a project",
            "postedAgo": "Posted {{time}}",
            "proposalsCount": "{{count}} proposals",
            "proposalsReceived": "Total proposals received",
            "repostProject": "Repost project",
            "result": {
                "attention": "Result: Action required before proceeding",
                "deliveryReview": "Result: Delivery submitted, awaiting your review",
                "open": "Result: Waiting for a hire decision",
                "progress": "Result: Work in progress",
                "success": "Success",
                "unsuccessful": "Unsuccessful"
            },
            "showAll": "Reset search and show all",
            "status": {
                "actionRequired": "Action Required",
                "completed": "Completed",
                "disputed": "Disputed",
                "finished": "Finished",
                "inProgress": "In Progress",
                "inReview": "In Review",
                "open": "Open",
                "reviewNeeded": "Review Needed"
            },
            "subtitle": "Manage your posted projects and proposals",
            "title": "My Projects",
            "today": "Today",
            "uncategorized": "Uncategorized",
            "viewProposals": "View proposals",
            "viewResult": "View result",
            "withProposals": "With Proposals"
        },
        "errorBoundary": {
            "backHome": "Back to home",
            "description": "An unexpected error interrupted this page. Refresh and try again, or head back to the homepage.",
            "details": "Error Details",
            "refresh": "Refresh page",
            "title": "Something went wrong"
        },
        "forgotPassword": {
            "backToLogin": "Back to sign in",
            "checkSpamDescription": "If the email takes a minute, check your spam folder before retrying.",
            "checkSpamTitle": "Check spam if needed",
            "contactUs": "Contact us",
            "needHelp": "Need help?",
            "protection": "We protect this flow with rate limits and one-time recovery sessions.",
            "sentDescription": "We sent a reset link to",
            "sentTitle": "Check your email",
            "subtitle": "Enter your email and we will send a secure recovery link so you can get back into your workspace quickly.",
            "title": "Reset your password without losing your place"
        },
        "freelancerCard": {
            "badges": {
                "availableNow": "Available",
                "availableNowTitle": "Available for new projects right now.",
                "fastResponder": "Fast Responder",
                "fastResponderTitle": "Usually replies quickly to new clients.",
                "newTalent": "New Talent",
                "newTalentTitle": "Fresh profile with early momentum.",
                "topRated": "Top Rated",
                "topRatedTitle": "Consistently excellent client feedback.",
                "verified": "Verified",
                "verifiedTitle": "Identity and payment details reviewed."
            },
            "completedJobs": "{{count}} completed",
            "defaultTitle": "Freelancer",
            "hourlyRate": "Hourly rate",
            "jobsLabel": "Jobs",
            "repliesIn": "Replies in {{time}}",
            "reviewsCount": {
                "one": "1 review",
                "other": "{{count}} reviews",
                "zero": "no reviews"
            },
            "snippet": "Professional, responsive, and much more polished than typical marketplace profiles.",
            "success": "Success",
            "successRate": "{{rate}}% success rate",
            "successScore": "Success score",
            "tndPerHour": "TND/hr",
            "verifiedProfile": "Verified profile",
            "viewProfile": "View profile"
        },
        "freelancerDashboard": {
            "allCaughtUp": "All caught up!",
            "browseJobs": "Browse jobs",
            "earnings": "Earnings",
            "earningsDescription": "Last 6 months of released escrow payments.",
            "earningsTrajectory": "Earnings trajectory",
            "greetingFallback": "there",
            "noDueDate": "No due date",
            "noEarningsData": "No earnings data yet",
            "noRecentActivity": "No recent activity",
            "noUpcomingMilestones": "No upcoming milestones",
            "profileSettings": "Profile settings",
            "quickActions": "Quick actions",
            "recentActivity": "Recent activity",
            "recentActivityDescription": "Your latest notifications and updates.",
            "sixMonthTrend": "6 month trend",
            "stat": {
                "activeContracts": "Active Contracts",
                "pendingProposals": "Pending Proposals",
                "profileViews": "Profile Views",
                "totalEarnings": "Total Earnings"
            },
            "upcomingMilestones": "Upcoming milestones",
            "welcomeBack": "Welcome back",
            "welcomeDescription": "Your freelancer business is looking sharper. Keep the momentum high and the profile polished."
        },
        "freelancerEarnings": {
            "availableBalance": "Available balance",
            "browseJobs": "Browse jobs",
            "clientId": "Client #{{id}}",
            "completedContracts": "Completed contracts",
            "contractPayment": "Contract payment",
            "earningsOverview": "Earnings overview",
            "noEarningsDescription": "Complete your first project to see earnings here.",
            "noEarningsTitle": "No earnings yet",
            "notAvailable": "N/A",
            "paymentHistory": "Payment history",
            "pendingClearance": "{{amount}} TND pending clearance",
            "seoDescription": "Your earnings and payment history on WorkedIn.",
            "seoTitle": "Earnings | WorkedIn",
            "thisMonth": "This month",
            "totalEarned": "Total earned",
            "withdraw": "Withdraw"
        },
        "freelancerProfile": {
            "actions": {
                "changeProfilePicture": "Change profile picture",
                "editProfile": "Edit profile",
                "nextProject": "Next project",
                "openLink": "Open link",
                "openProjectLink": "Open project link",
                "previousProject": "Previous project",
                "viewFullProject": "View full project"
            },
            "addFirstWorkSample": "Add your first work sample",
            "addPortfolio": "Add Portfolio",
            "available": "Available",
            "busy": "Busy right now",
            "completedJobs": "Completed",
            "contactModal": {
                "body": "A direct conversation with {{name}} will open in your messages workspace.",
                "cannotMessageSelf": "You cannot message yourself",
                "createFailed": "Failed to create conversation",
                "loginPrompt": "You need to sign in before contacting freelancers.",
                "loginRequired": "You need to sign in to send a message",
                "opening": "Opening...",
                "sectionLabel": "Direct message",
                "startAction": "Start conversation",
                "startError": "Something went wrong while starting the conversation",
                "title": "Message {{name}}",
                "trustNote": "Use WorkedIn messages to keep project communication organized."
            },
            "cta": {
                "editProfile": "Edit Profile",
                "hireMe": "Hire Me",
                "myProposals": "My Proposals",
                "myProposalsDescription": "Track statuses and follow up faster.",
                "portfolioDashboard": "Portfolio Dashboard",
                "portfolioDashboardDescription": "Add and organize your best work samples.",
                "sendMessage": "Send Message",
                "viewPublicProfile": "View Public Profile",
                "viewPublicProfileDescription": "Preview exactly how clients and visitors see your profile.",
                "workspaceSettings": "Workspace Settings",
                "workspaceSettingsDescription": "Notifications, security, and account controls."
            },
            "education": {
                "add": "+ Add education details",
                "empty": "No education entered yet.",
                "studyField": "{{degree}} in {{field}}",
                "title": "Education"
            },
            "form": {
                "fullName": "Full name",
                "hourlyRateTnd": "Hourly rate (TND)",
                "professionalTitle": "Professional title"
            },
            "hearVoice": "Voice intro",
            "hireNow": "Hire Now",
            "info": {
                "lastSeen": "Last seen",
                "memberSince": "Member since"
            },
            "jobFallback": "Project",
            "labels": {
                "skillsUsed": "Skills used",
                "toolsUsed": "Tools used"
            },
            "languages": {
                "empty": "No languages listed.",
                "title": "Languages"
            },
            "lastSeen": "Last seen",
            "lastSeenRecently": "Recently",
            "main": {
                "add": "Add",
                "addDescription": "+ Add description",
                "addFirstWorkSample": "Add your first work sample",
                "copied": "Copied!",
                "hourlyRateFormat": "{{rate}}/hr",
                "independentSpecialist": "Independent Specialist",
                "industries": "Industries",
                "jobsCompletedCount": {
                    "one": "{{count}} job completed",
                    "other": "{{count}} jobs completed"
                },
                "localTime": "{{time}} local time",
                "noBio": "No biography details provided yet.",
                "noDescription": "No description provided.",
                "openLink": "Open Link",
                "photosCount": {
                    "one": "{{count}} photo",
                    "other": "{{count}} photos"
                },
                "portfolio": "Portfolio",
                "projectCollaboration": "Project Collaboration",
                "responseTimeSuffix": "response time",
                "reviewBy": "by {{name}}",
                "reviewsCount": {
                    "one": "{{count}} review",
                    "other": "{{count}} reviews"
                },
                "services": "Services",
                "share": "Share",
                "skills": "Skills",
                "specializedFreelancer": "Specialized Freelancer",
                "specializedIn": "Specialized in {{skills}}",
                "tools": "Tools",
                "untitledWork": "Untitled work",
                "viewProject": "View Project",
                "workHistoryAndReviews": "Work History & Reviews",
                "workSamplesEmptyDesc": "Showcase case studies, designs, products, and measurable outcomes to attract clients."
            },
            "manageProfile": "Manage Profile",
            "memberSince": "Member since",
            "message": "Send Message",
            "noPortfolio": "No work samples added yet",
            "noPortfolioDescription": "Showcase case studies, shipped products, and measurable outcomes.",
            "noReviewsTrust": "No reviews yet - complete your first contract to receive feedback",
            "noSkills": "No skills added yet",
            "offline": "Offline",
            "portfolio": {
                "skillsUsed": "Skills Used",
                "visitProject": "Visit Project"
            },
            "portfolioLinks": {
                "add": "+ Add portfolio links",
                "empty": "No links added yet.",
                "title": "Portfolio Links"
            },
            "portfolioTitle": "Portfolio",
            "profileStrength": "Profile strength",
            "projectPreferences": {
                "projectPreferences": "Project Preferences",
                "projectPreferencesDefault": "Open to project scope changes, regular text/call communication, and milestone-based deliverables.",
                "revisionPolicy": "Revision Policy",
                "revisionPolicyDefault": "2 revisions included, additional billed separately.",
                "title": "Project Preferences & Details"
            },
            "publicPreview": {
                "description": "You are viewing your profile as other users see it.",
                "exit": "Exit Preview",
                "title": "Public Profile Preview"
            },
            "responseSpeed": "Response",
            "reviews": {
                "empty": "No reviews yet. Complete your first contract to receive feedback."
            },
            "sectionLabelIntro": "Introduction",
            "sectionLabelSkills": "Core strengths",
            "sectionLabelTrust": "Client trust",
            "sectionLabelWork": "Selected work",
            "sections": {
                "clientTrust": "Client trust",
                "coreStrengths": "Core strengths",
                "selectedWork": "Selected work",
                "workInformation": "Work information"
            },
            "stats": {
                "availabilityAndStats": "Availability & Stats",
                "availableForWork": "Available for work",
                "hourlyRate": "Hourly rate",
                "hoursPerWeek": "{{hours}} hrs/week",
                "hoursResponseTime": "< {{hours}} hrs",
                "jobSuccess": "Job Success",
                "lessThanTwoHours": "< 2 hrs",
                "profileVisibility": "Profile Visibility",
                "public": "Public",
                "responseTime": "Response time",
                "status": "Status",
                "weeklyAvailability": "Weekly availability",
                "yearsCount": {
                    "one": "{{count}} year",
                    "other": "{{count}} years"
                },
                "yearsOfExperience": "Years of experience"
            },
            "status": "Status",
            "successRate": "success",
            "toasts": {
                "avatarUpdated": "Profile picture updated",
                "bioUpdateError": "Could not update bio",
                "bioUpdated": "Bio updated",
                "contactDisabledOwnProfile": "Public preview mode: contact action is disabled on your own profile.",
                "linkCopied": "Profile link copied to clipboard",
                "loginRequired": "Please log in to continue",
                "profileUpdateError": "Could not update profile details",
                "profileUpdated": "Profile details updated",
                "skillsUpdateError": "Could not update skills",
                "skillsUpdated": "Skills updated",
                "toolsUpdateError": "Could not update tools",
                "toolsUpdated": "Tools updated",
                "workSampleDeleteError": "Could not delete work sample",
                "workSampleDeleted": "Work sample deleted"
            },
            "totalEarnings": "Earned",
            "validation": {
                "avatarSize": "Image size should be less than 5MB.",
                "avatarType": "Please upload JPG, PNG, WEBP, or GIF image.",
                "fullNameRequired": "Full name is required",
                "validHourlyRate": "Please enter a valid hourly rate"
            },
            "verificationEmail": "Email",
            "verificationIdentity": "Identity",
            "verificationPayment": "Payment method",
            "verificationPhone": "Phone",
            "verifications": {
                "emailAddress": "Email Address",
                "identityVerified": "Identity Verified",
                "paymentMethod": "Payment Method",
                "phoneNumber": "Phone Number",
                "title": "Verifications"
            },
            "viewer": {
                "close": "Close portfolio viewer",
                "nextImage": "Next image",
                "previousImage": "Previous image"
            },
            "workInfo": "Work information",
            "workSamples": {
                "deleteConfirm": "Delete this work sample? This action cannot be undone.",
                "emptyTitle": "No work samples added yet"
            },
            "works": "works"
        },
        "jobBoard": {
            "actions": {
                "applied": "Applied",
                "applyNow": "Apply Now"
            },
            "budgetNotSpecified": "Budget not specified",
            "currency": "TND",
            "empty": {
                "filtered": "No jobs found for the selected filters.",
                "saved": "You haven't saved any jobs yet."
            },
            "errors": {
                "loadFailed": "Failed to load jobs. Please try again."
            },
            "filters": {
                "clearAll": "Clear All",
                "jobType": "Job Type",
                "searchPlaceholder": "Search jobs...",
                "showing": "Showing {{count}} jobs"
            },
            "header": {
                "jobsYouMightLike": "Jobs you might like",
                "subtitle": "Browse and apply to freelance opportunities in Tunisia.",
                "title": "Find Work"
            },
            "hourlyRateFormat": "TND/hr",
            "infoBanner": {
                "addSkillsLink": "Add skills",
                "clientModePrompt": "You are viewing jobs as a client. Switch to freelancer to see matching jobs.",
                "loginPrompt": "Sign in to view jobs tailored to your skills.",
                "matchingSkills": "Matching jobs based on your skills: ___SKILLS___",
                "noSkillsPrompt": "Add skills to your profile to see matching jobs."
            },
            "jobCard": {
                "appliedLabel": "Applied",
                "noDescription": "No description provided.",
                "untitledJob": "Untitled job"
            },
            "proposals": {
                "lessThan5": "Less than 5 proposals",
                "range10_15": "10 to 15 proposals",
                "range15_20": "15 to 20 proposals",
                "range5_10": "5 to 10 proposals",
                "twentyPlus": "20+ proposals",
                "zero": "0 proposals"
            },
            "tabs": {
                "bestMatches": "Best Matches",
                "mostRecent": "Most Recent",
                "savedJobs": "Saved Jobs"
            },
            "toasts": {
                "removedFromSaved": "Removed from saved jobs",
                "savedJob": "Saved job",
                "savedJobsUpdateError": "Could not update saved jobs"
            }
        },
        "jobDetail": {
            "timeAgo": {
                "day": "Day",
                "hour": "Hour",
                "minute": "Minute",
                "week": "Week"
            }
        },
        "leaveReview": {
            "error": "Failed to submit review. Try again.",
            "rating": {
                "excellent": "Excellent",
                "fair": "Fair",
                "good": "Good",
                "poor": "Poor",
                "veryGood": "Very Good"
            },
            "submitted": "Review submitted successfully!"
        },
        "login": {
            "finishingSignIn": "Securing session...",
            "finishingSignInDescription": "Hang tight while we prepare your workspace."
        },
        "messages": {
            "a11y": {
                "openAttachment": "Open attachment",
                "openImageAttachment": "Open image attachment"
            },
            "allConversationsLabel": "All conversations",
            "archive": "Archive",
            "archiveAriaArchive": "Archive conversation",
            "archiveAriaUnarchive": "Unarchive conversation",
            "archiveConversation": "Archive conversation",
            "archiveSuccess": "Conversation archived",
            "archivedLabel": "ARCHIVED",
            "attachFile": "Attach file",
            "attachmentFallback": "Attachment",
            "attachmentLabel": "Attachment",
            "attachmentsDisabled": "Attachments are disabled for this conversation.",
            "audioNote": "Audio note",
            "audioPreviewUnavailable": "Audio preview unavailable.",
            "backToInbox": "Back to inbox",
            "cancelReply": "Cancel reply",
            "clientInboxLabel": "Client inbox",
            "contract": {
                "nextStep": {
                    "clientReviewDelivery": "Review delivery, then accept, request changes, or dispute.",
                    "clientWaitingDelivery": "Freelancer is working. Delivery will appear here.",
                    "completedDefault": "Contract is complete.",
                    "completedLeaveReview": "Leave a review to close the trust loop.",
                    "disputed": "Dispute is open. Evidence is preserved.",
                    "freelancerSubmitReviewFiles": "Submit review files and locked final files when ready.",
                    "freelancerWaitingForReview": "Waiting for client review. Final files stay protected.",
                    "paymentPending": "Payment must be confirmed before work begins.",
                    "syncing": "Keep the conversation open while the contract syncs."
                },
                "status": {
                    "cancelled": "Cancelled",
                    "completed": "Completed",
                    "disputed": "Disputed",
                    "inProgress": "In progress",
                    "paymentPending": "Payment pending",
                    "revisionRequested": "Revision requested",
                    "syncing": "Syncing",
                    "underReview": "Under review"
                }
            },
            "contractContext": "Contract chat",
            "contractDetails": {
                "amount": "Amount",
                "amountReleased": "Amount Released",
                "contractMilestones": "Contract Milestones",
                "due": "Due",
                "fundEscrowBody": "Fund Escrow Body",
                "milestoneDefaultTitle": "Milestone Default Title",
                "requestRevisionLeft": "Request Revision Left",
                "revLeft": "Rev Left",
                "revUsed": "Rev Used",
                "review": "Review",
                "reviewDue": "Review Due",
                "workspace": "Workspace"
            },
            "contractOpenFailed": "Could not open this contract thread yet. Please refresh and try again.",
            "contractProjectWithTitle": "Contract project • {{title}}",
            "contractReferenceFallback": "Contract",
            "contractReferenceWithId": "Contract #{{id}}",
            "contractSessionFallbackTitle": "Contract",
            "contractSidebarUnavailable": "Contract details are not available for this conversation yet.",
            "contractWithName": "Contract with {{name}}",
            "contractWorkspaceTitle": "Contract workspace",
            "contractsAction": "Contracts",
            "copyMessage": "Copy message",
            "delete": "Delete",
            "deleteConversation": "Delete conversation",
            "deleteForEveryone": "Delete for everyone",
            "deleteForMe": "Delete for me",
            "deleteMessage": "Delete message",
            "deleteMessagePrompt": "Are you sure you want to delete this message?",
            "deletedMessage": "This message was deleted",
            "delivery": {
                "finalLockedFiles": "Final Locked Files",
                "finalLockedFilesDescription": "Files that stay locked until the client accepts and payment is released.",
                "provideBothError": "Please provide deliverables for both review and final hand-off phases.",
                "resubmitLabel": "Resubmit delivery",
                "reviewFiles": "Review Files",
                "reviewFilesDescription": "Files the client can review immediately before accepting.",
                "submitLabel": "Submit delivery",
                "submitting": "Submitting delivery...",
                "submittingLabel": "Submitting delivery...",
                "uploadFailed": "{{stage}} upload failed for {{file}}: {{message}}",
                "workDeliveredReview": "Work delivered and ready for review"
            },
            "directChat": "Direct chat",
            "directContext": "Direct chat",
            "edited": "Edited",
            "empty": {
                "noArchivedTitle": "No archived conversations",
                "noConversationsDescription": "Start by sending a proposal or contacting a freelancer.",
                "noConversationsTitle": "No conversations yet",
                "noMatchingDescription": "Try a different name or clear your search.",
                "noMatchingTitle": "No matching conversations"
            },
            "emptyThread": "No messages yet. Start the conversation!",
            "errors": {
                "audioUpload": "Failed to upload audio",
                "fileInspectionFailed": "Could not verify this file safely. Please choose another file.",
                "fileTooLarge": "File size must be less than 10 MB",
                "fileUnsupported": "Unsupported file type",
                "fileUpload": "Failed to upload file",
                "invalidAttachment": "Attachment link is not available",
                "openAttachment": "Failed to open attachment right now",
                "recordingLimit": "Recording limit reached (5 minutes)",
                "sendFailed": "Failed to send message"
            },
            "escrowNotFunded": "Escrow not funded yet",
            "filterAll": "All",
            "filterUnread": "Unread",
            "filters": {
                "all": "All",
                "unread": "Unread"
            },
            "freelancerInboxLabel": "Freelancer inbox",
            "hideWorkspace": "Hide Workspace",
            "imageLabel": "Image",
            "inboxLabel": "Inbox",
            "jumpToRepliedMessage": "Jump to replied message",
            "lifecycle": {
                "cancelled": "Cancelled",
                "completed": "Completed",
                "disputed": "Disputed",
                "unknown": "Unknown"
            },
            "lifecycleBanner": "{{message}}",
            "lightbox": {
                "altText": "Preview",
                "ariaLabel": "Image preview",
                "closeAria": "Close image preview",
                "closeTitle": "Close",
                "downloadAria": "Download image",
                "downloadFilename": "image",
                "downloadTitle": "Download",
                "imagePreviewAria": "Image preview",
                "previewAlt": "Preview"
            },
            "loadMore": "Load more messages",
            "loadingContractSidebar": "Loading contract details...",
            "loadingConversations": "Loading conversations...",
            "loadingMessages": "Loading messages...",
            "markUnread": "Mark as Unread",
            "messagePlaceholder": "Write your message...",
            "noCommentPlaceholder": "No comment provided",
            "noConversationsFound": "No conversations found.",
            "noDueDate": "No due date",
            "noMessagesYet": "No messages yet",
            "offline": {
                "attachmentPending": "Attachment pending",
                "audioTooLarge": "Audio too large for offline storage",
                "encodingFailed": "Failed to prepare file for offline storage",
                "fileTooLarge": "File too large for offline storage (max 5MB)",
                "queued": "You are offline. Message queued and will send when reconnected.",
                "statusWaiting": "Waiting",
                "storageFailed": "Failed to save message offline",
                "synced": "Offline messages synced successfully"
            },
            "openContract": "Open Contract",
            "pauseAudio": "Pause audio",
            "placeholder": "Type a message...",
            "playAudio": "Play audio",
            "profileAction": "Profile",
            "reacting": "Reacting...",
            "readOnlyFallback": "This conversation is read-only.",
            "readOnlyPlaceholder": "{{message}}",
            "readOnlyRightNow": "This conversation is read-only right now.",
            "readOnlyThread": "{{message}}",
            "recordVoice": "Record voice message",
            "recording": "Recording...",
            "reply": "Reply",
            "replyAction": "Reply to message",
            "replyTargetMissing": "Original message is no longer available.",
            "replyTo": "Reply to message",
            "replyingTo": "Replying to",
            "reportReason": {
                "fraud": "Fraud or scam attempt",
                "harassment": "Harassment or abuse",
                "inappropriate": "Inappropriate behavior or content",
                "other": "Other",
                "spam": "Spam or misleading"
            },
            "reportSubmittedSuccess": "Report submitted successfully. Our team will review it.",
            "reportUser": "Report User",
            "reportUserDescription": "Tell us why you are reporting this user. Our team will review their profile and recent activity.",
            "reportUserTitle": "Report User",
            "reviewBanners": {
                "overdueClient": "Review is overdue. Please accept, request changes, or open a dispute now. If you stay inactive, the platform may escalate or auto-resolve this contract based on policy.",
                "overdueFreelancer": "Client review is overdue. The platform will follow the contract protection policy next if the client stays inactive.",
                "underReviewClient": "Under Review Client",
                "underReviewFreelancer": "Under Review Freelancer"
            },
            "searchPlaceholder": "Search conversations...",
            "searchResultsSummary": "{{count}} results",
            "seeLess": "See less",
            "seeMore": "See more",
            "selectConversationDescription": "Select a conversation from the sidebar to start messaging, or wait for someone to reach out.",
            "selectConversationDetails": "Select a conversation to view details",
            "selectConversationTitle": "Your messages",
            "senderAlt": "Sender",
            "sentAttachment": "Sent an attachment",
            "startConversationDesc": "Start the conversation by sending a message or file below.",
            "startConversationTitle": "No messages yet",
            "stopRecording": "Stop recording",
            "summaryEmpty": "Summary Empty",
            "summaryUnread": "Summary Unread",
            "system": {
                "completedTitle": "Contract Completed",
                "deliveryTitle": "Work Delivered",
                "disputePrefix": "Dispute Prefix",
                "disputeTitle": "Dispute Opened",
                "eventTitle": "System Update",
                "reviewFormat": "Review Format",
                "reviewTitle": "Review Submitted",
                "revisionTitle": "Revision Requested"
            },
            "systemEventTitle": "System Update",
            "threadCountSummary": "{{count}} threads",
            "time": {
                "daysAgo": "{{count}} d ago",
                "hoursAgo": "{{count}} h ago",
                "minutesAgo": "{{count}} min ago",
                "now": "Now"
            },
            "title": "Messages",
            "today": "Today",
            "typingIndicator": {
                "plural": "people are typing...",
                "singular": "is typing..."
            },
            "unarchive": "Unarchive",
            "unarchiveSuccess": "Conversation returned to inbox",
            "unfundedLabel": "Unfunded",
            "unknownFileType": "FILE",
            "unknownSender": "User",
            "userFallback": "User",
            "viewArchived": "Archived conversations",
            "viewWorkspace": "View workspace",
            "voiceMemo": "Audio note",
            "voiceNotesDisabled": "Voice notes are disabled for this conversation."
        },
        "mobileNav": {
            "brandName": "WorkedIn",
            "client": "Client",
            "freelancer": "Freelancer",
            "help": "Help",
            "more": "More",
            "searchPlaceholder": "Search...",
            "userFallback": "User",
            "workspaceClient": "Client workspace",
            "workspaceFreelancer": "Freelancer workspace"
        },
        "myProposals": {
            "accepted": "Accepted",
            "all": "All",
            "browseJobs": "Browse Jobs",
            "daysAgo": "{{days}} days ago",
            "deliveryDays": "{{days}} days delivery",
            "emptyDescription": "Browse open projects and send your first proposal to start working.",
            "emptyTabHint": "You have proposals, but none in {{tab}} right now. Try the All tab.",
            "emptyTabTitle": "No {{tab}} proposals",
            "emptyTitle": "You haven't applied to any jobs yet",
            "hoursAgo": "{{hours}}h ago",
            "justNow": "Just now",
            "loading": "Loading proposals...",
            "minsAgo": "{{mins}} min ago",
            "oneDayAgo": "1 day ago",
            "pending": "Pending",
            "proposalAccepted": "Your proposal was accepted!",
            "rejected": "Declined",
            "sent": "Sent",
            "submittedAgo": "Submitted {{time}}",
            "subtitle": "Track every proposal you've sent",
            "title": "My Proposals",
            "today": "Today",
            "unknownProject": "Unknown Project",
            "viewContract": "View Contract",
            "viewJob": "View Job",
            "yourBid": "Your bid: {{amount}} TND"
        },
        "postJob": {
            "stepDetails": {
                "duration1To3Months": "1–3 months",
                "duration3To6Months": "3–6 months",
                "durationLessThan1Month": "Less than 1 month",
                "durationMoreThan6Months": "6+ months"
            }
        },
        "resetPassword": {
            "backToLogin": "Back to sign in",
            "expiredDescription": "Request a fresh reset link and we will send you back through a clean password recovery flow.",
            "expiredTitle": "This recovery link is no longer valid",
            "requestNew": "Request new link",
            "requirementsDescription": "Use a password with upper/lowercase letters and numbers.",
            "requirementsTitle": "Strong password rules",
            "retryDescription": "Generate a new recovery email instead of fighting with an expired token.",
            "retryTitle": "Start again cleanly",
            "securityDescription": "Recovery links stay temporary and tied to your active session.",
            "securityTitle": "Security first",
            "subtitle": "We are validating your recovery session before letting you update your password.",
            "title": "Choose a new password",
            "validating": "Validating your recovery link..."
        },
        "savedJobs": {
            "actions": {
                "applyNow": "Apply Now",
                "inviteToJob": "Invite to Job",
                "removeSavedFreelancer": "Remove saved freelancer",
                "removeSavedJob": "Remove saved job"
            },
            "browseFreelancers": "Browse Freelancers",
            "browseJobs": "Browse Jobs",
            "empty": {
                "title": "Nothing saved yet"
            },
            "labels": {
                "budget": "Budget:"
            },
            "savedTalent": "Saved Talent",
            "subtitle": "Keep track of jobs you want to apply for.",
            "subtitleTalent": "Keep track of top freelancers for your projects.",
            "title": "Saved Jobs"
        },
        "searchModal": {
            "allResults": "All results",
            "closeHint": "close",
            "enterHint": "Press Enter to view all results for \"{{query}}\"",
            "filterAll": "All",
            "filterAllDesc": "Search everything",
            "filterJobs": "Jobs",
            "filterJobsDesc": "Open job postings",
            "filterProjects": "Projects",
            "filterProjectsDesc": "Quick links & pages",
            "filterTalent": "Talent",
            "filterTalentDesc": "Freelancers & agencies",
            "globalTitle": "Global search",
            "goTo": "Go to",
            "headerHint": "Jump to pages, search live jobs, and open common actions faster.",
            "navHint": "navigate",
            "noResultsFor": "No results for \"{{query}}\"",
            "openAction": "Open",
            "placeholderAll": "Search jobs, freelancers, pages...",
            "placeholderClient": "Search freelancers, skills...",
            "placeholderFreelancer": "Search jobs, skills...",
            "placeholderJobs": "Search jobs...",
            "placeholderProjects": "Search pages...",
            "placeholderTalent": "Search freelancers...",
            "quickActions": "Quick actions",
            "quickLinksRecent": "Quick links & recent",
            "recentSection": "Recent jumps",
            "removeSearch": "Remove search",
            "resultsCount": "{{count}} results",
            "resultsHeadline": "Results · {{category}}",
            "searchEverything": "Search everything for \"{{query}}\"",
            "searchEverythingMeta": "Open the full search page with all matching results",
            "searchIn": "Search in",
            "searching": "Searching...",
            "sectionActions": "Actions",
            "sectionBestMatch": "Best match",
            "sectionGeneral": "Results",
            "sectionJobs": "Jobs",
            "selectHint": "select",
            "shortcuts": {
                "browseAllJobs": "Browse all jobs",
                "browseJobs": "Browse jobs",
                "contracts": "Contracts",
                "createAccount": "Create account",
                "findFreelancers": "Find freelancers",
                "howItWorks": "How it works",
                "myEarnings": "My earnings",
                "myProjects": "My projects",
                "myProposals": "My proposals",
                "postProject": "Post a project",
                "settings": "Settings"
            },
            "trendingNow": "Trending now",
            "tryDifferent": "Try a different search term",
            "workspaceClient": "Client workspace",
            "workspaceFreelancer": "Freelancer workspace"
        },
        "settings": {
            "account": {
                "accountType": "Account type",
                "currentWorkspace": "Current workspace",
                "goToDashboard": "Go to dashboard",
                "identity": "Identity",
                "identityVerified": "Identity Verified",
                "manageNotifications": "Manage notifications",
                "notVerified": "Not Verified",
                "openPublicProfileEditor": "Open public profile editor",
                "overviewDescription": "Manage your workspace and general account details.",
                "overviewTitle": "Account Overview",
                "quickActions": "Quick Actions",
                "verificationUnderReview": "Verification Under Review"
            },
            "actions": {
                "signOut": "Sign Out"
            },
            "menu": {
                "account": "Account",
                "billing": "Billing",
                "clientMode": "Client Mode",
                "earnings": "Earnings",
                "freelancerMode": "Freelancer Mode",
                "notifications": "Notifications",
                "privacy": "Privacy",
                "profile": "Profile Settings"
            },
            "notifications": {
                "newJobMatches": "New job matches",
                "newJobMatchesDesc": "Get notified when jobs match your skills",
                "newMessages": "New messages",
                "newMessagesDesc": "Get notified when you receive new messages",
                "offersAndUpdates": "Offers and updates",
                "offersAndUpdatesDesc": "Tips and updates from WorkedIn",
                "payments": "Payments",
                "paymentsDesc": "Get notified when you send or receive payments",
                "reviews": "Reviews",
                "reviewsDesc": "Get notified when you receive a new review",
                "toasts": {
                    "loadError": "Failed to load notification settings",
                    "saveError": "Could not save notification settings"
                }
            },
            "payment": {
                "accountHolderNamePlaceholder": "Account holder full name *",
                "active": "ACTIVE",
                "addAccount": "Add account",
                "addBankAccount": "Add bank account",
                "addBankAccountDesc": "Add a bank account to receive your earnings.",
                "addMethod": "Add method",
                "bankNamePlaceholder": "Bank Name Placeholder",
                "bankTransfer": "Bank transfer",
                "cardDesc": "Pay securely with local Visa, Mastercard, or CIB cards",
                "cardName": "Credit / Debit Card",
                "clientDesc": "How you fund contracts for your projects.",
                "default": "DEFAULT",
                "deleteMethod": "Delete payment method",
                "dhmadClientDesc": "Active billing gateway. Supports Visa, Mastercard, Flouci, and e-Dinar checkouts natively during contract funding.",
                "dhmadFreelancerDesc": "Active escrow clearinghouse. Contract funds are secured safely by Dhmad until delivery is approved, then credited to your wallet balance.",
                "dhmadName": "Dhmad Escrow",
                "directFunding": "Direct Funding Options",
                "directFundingDesc": "Fund contracts securely through Dhmad Escrow checkout.",
                "directFundingTip": "Contracts are funded directly during checkout when you hire a freelancer. No pre-funding or complex deposits are needed!",
                "edinarDesc": "Pay with La Poste e-Dinar card",
                "edinarName": "Edinar Name",
                "empty": {
                    "description": "Add a payout method now so contracts are ready when you need them.",
                    "title": "No payment method added yet"
                },
                "flouciDesc": "Fund using your Flouci mobile wallet account",
                "flouciName": "Flouci Wallet",
                "freelancerDesc": "How your clients fund contracts - your earnings go through escrow.",
                "friendlyLabelPlaceholder": "Friendly Label Placeholder",
                "live": "LIVE",
                "methods": "Payment Methods",
                "newBankAccount": "New bank account",
                "noPayoutAccountYet": "No payout account yet",
                "openWallet": "Open Wallet Dashboard",
                "payoutAccounts": "Payout Accounts",
                "payoutDesc": "Where your earnings land when you withdraw.",
                "payoutInfo": "Payout Info",
                "providers": "Payment Providers",
                "saveAccount": "Save account",
                "setDefault": "Set default",
                "soon": "SOON",
                "title": "Payment Methods",
                "toasts": {
                    "addError": "Could not add payment method",
                    "added": "Payment method added",
                    "defaultUpdateError": "Could not update default payment method",
                    "defaultUpdated": "Default payment method updated",
                    "loadError": "Failed to load payment methods",
                    "removeError": "Could not remove payment method",
                    "removed": "Payment method removed"
                },
                "validIban": "Valid Tunisian IBAN",
                "walletDesc": "View your escrow balance and withdraw earnings.",
                "walletMetrics": "Balance, transactions, withdrawals",
                "yourWallet": "Your Wallet"
            },
            "privacy": {
                "activeSessions": "Active sessions",
                "changePassword": "Change password",
                "currentSession": "This device is your current session.",
                "deleteAccount": "Delete account",
                "deleteAccountButton": "Delete my account",
                "deleteAccountWarning": "Your account and all data will be permanently deleted. This action cannot be undone.",
                "signOutAllDevices": "Sign out from all devices",
                "submitting": "Submitting...",
                "title": "Security & Privacy",
                "toasts": {
                    "deleteRequestError": "Could not submit deletion request",
                    "deleteRequestInProgress": "A deletion request is already in progress",
                    "deleteRequestSubmitted": "Account deletion request submitted",
                    "signOutAllError": "Could not sign out all devices"
                }
            },
            "title": "Settings"
        }
    },
    "payment": {
        "amount": "Amount",
        "cardHolder": "Card Holder Name",
        "cardNumber": "Card Number",
        "cardNumberPlaceholder": "0000 0000 0000 0000",
        "cardSchemes": "Visa / Mastercard / CIB",
        "chooseMethod": "Choose payment method",
        "completeTitle": "Complete Payment",
        "creditCard": "Credit Card",
        "cvc": "CVC",
        "cvcPlaceholder": "123",
        "d17Desc": "Fastest way to pay in Tunisia",
        "d17PhoneLabel": "D17 phone number",
        "d17PhonePlaceholder": "+216 00 000 000",
        "dhmadDescription": "Payments are securely held in escrow by Dhmad.tn",
        "escrowFunded": "Escrow funded successfully",
        "expiryDate": "Expiry Date",
        "expiryDatePlaceholder": "MM/YY",
        "flouciDesc": "Your secure digital wallet",
        "flouciDescription": "Pay via Flouci - bank cards & digital wallets",
        "flouciRedirect": "Redirection to Flouci for secure payment",
        "flouciTitle": "Flouci",
        "fundEscrowAction": "Fund escrow now",
        "fundEscrowHint": "You need to fund escrow before the freelancer starts. Funds remain protected until you approve the delivery.",
        "fundEscrowSubtitle": "Funds are protected until the work is completed",
        "fundEscrowTitle": "Fund escrow",
        "noPaymentLink": "Payment link was not generated",
        "noResponse": "No response received from escrow server",
        "openFlouci": "Open Flouci app",
        "orEnterPhone": "Or enter your phone number",
        "payNow": "Pay now",
        "payVia": "Pay via",
        "platformFee": "Platform fee",
        "processing": "Processing payment...",
        "processingDesc": "Please wait, do not close this window",
        "projectBudget": "Project budget",
        "recipient": "Recipient",
        "redirectingToPayment": "Redirecting to secure payment...",
        "refundFailed": "Failed to refund escrow. Please try again.",
        "releaseFailed": "Failed to release escrow. Please try again.",
        "scanD17": "Scan with D17 app",
        "secureTransaction": "100% secure and encrypted transaction",
        "sessionFailed": "Failed to create payment session. Please try again.",
        "startFailed": "Failed to start payment. Please try again.",
        "statusFailed": "Failed to get escrow status. Please try again.",
        "success": "Payment successful!",
        "successDetails": {
            "backToContract": "Back to Contract",
            "backToWallet": "Back to Wallet",
            "goToWallet": "Go to Wallet",
            "missingInfo": "Missing payment identifier",
            "timeout": "Timeout waiting for payment verification. Please check your dashboard.",
            "verificationError": "Payment verification failed. Please contact support.",
            "walletFunded": "Wallet balance updated successfully."
        },
        "to": "To",
        "total": "Total",
        "totalToPay": "Total to pay",
        "transactionId": "Transaction ID",
        "transferred": "Amount transferred"
    },
    "portfolio": {
        "addFirst": "Add Your First Work",
        "addNew": "Add New Work",
        "card": {
            "clientPrefix": "Client",
            "deleteItem": "Delete portfolio item",
            "editItem": "Edit portfolio item"
        },
        "deleteConfirm": "Are you sure you want to delete this work?",
        "deleteError": "Error during deletion",
        "empty": {
            "description": "Add samples of your previous work so clients can see your skills and quality",
            "title": "No works to display"
        },
        "form": {
            "actions": {
                "add": "Add Work",
                "cancel": "Cancel",
                "save": "Save Changes"
            },
            "addTitle": "Add New Work",
            "editTitle": "Edit Work",
            "fields": {
                "clientName": {
                    "label": "Client / Brand (optional)",
                    "placeholder": "Example: Acme Corp"
                },
                "completionDate": {
                    "label": "Completion date"
                },
                "description": {
                    "label": "Project description",
                    "placeholder": "Describe the project details and what you delivered..."
                },
                "imageUpload": {
                    "label": "Upload preview image"
                },
                "imageUrl": {
                    "label": "Or paste image URL",
                    "placeholder": "https://..."
                },
                "projectUrl": {
                    "label": "Project URL (optional)",
                    "placeholder": "https://example.com"
                },
                "skills": {
                    "label": "Skills used",
                    "placeholder": "Example: UI design, Frontend development, Image editing (comma-separated)",
                    "searchPlaceholder": "Search and select skills..."
                },
                "title": {
                    "label": "Project title",
                    "placeholder": "Example: E-commerce storefront design"
                },
                "tools": {
                    "label": "Tools used (optional)",
                    "searchPlaceholder": "Search and select tools..."
                }
            },
            "imageHint": "Upload a preview image or paste a direct image URL.",
            "skills": {
                "clearAll": "Delete all",
                "edit": "Edit",
                "noResults": "No matching skills found.",
                "noneSelected": "No skills selected yet.",
                "remove": "Remove skill",
                "sections": {
                    "business": "Business",
                    "data": "Data",
                    "design": "Design",
                    "development": "Development",
                    "marketing": "Marketing",
                    "other": "Other",
                    "video": "Video",
                    "writing": "Writing"
                }
            },
            "tools": {
                "clearAll": "Delete all",
                "edit": "Edit",
                "noResults": "No matching tools found.",
                "noneSelected": "No tools selected yet.",
                "remove": "Remove tool",
                "sections": {
                    "design": "Design",
                    "development": "Development",
                    "marketing": "Marketing",
                    "other": "Other",
                    "productivity": "Productivity",
                    "video": "Video"
                }
            },
            "upload": {
                "action": "Upload image",
                "addExtraUrl": "Add",
                "addMore": "Add image",
                "addUrl": "Add URL",
                "coverUrlPlaceholder": "https://example.com/cover-image.jpg",
                "delete": "Delete image",
                "deleteCover": "Delete Cover",
                "dragDropHint": "Drag & drop or click to browse. JPEG, PNG, WEBP (Max 5MB)",
                "edit": "Edit image",
                "error": "Failed to upload image",
                "extraAdded": "Image added to gallery",
                "extraImageUrlPlaceholder": "Add extra image URL...",
                "extraUrlPlaceholder": "https://image-url.com/preview.jpg",
                "galleryLabel": "Project Gallery (Optional)",
                "loginRequired": "Please sign in to upload images.",
                "networkError": "Upload service is unreachable right now. You can still paste a direct image URL.",
                "pasteUrlHint": "Or paste a direct image URL for the cover:",
                "permissionError": "You do not have permission to upload files to storage.",
                "previewAlt": "Portfolio preview image",
                "remove": "Remove",
                "replace": "Replace image",
                "replaceCover": "Replace Cover",
                "success": "Image uploaded successfully",
                "uploadCover": "Upload Cover Image",
                "uploading": "Uploading..."
            },
            "validation": {
                "descriptionMin": "Description must be at least 10 characters",
                "imageRequired": "Please upload an image or provide a direct image URL",
                "invalidImageUrl": "Please use a direct http/https image URL",
                "invalidUrl": "Please use a valid http/https URL",
                "skillsLimit": "You can select up to {{count}} skills",
                "titleMin": "Title must be at least 3 characters",
                "toolsLimit": "You can select up to {{count}} tools"
            }
        },
        "loadError": "Error loading portfolio",
        "modal": {
            "description": "Project Description",
            "skills": "Skills Used",
            "tools": "Tools Used"
        },
        "saveError": "Error saving work",
        "subtitle": "Add and edit your previous work to increase your chances of getting hired",
        "title": "Portfolio Management",
        "view": {
            "gridAria": "Grid view",
            "listAria": "List view"
        },
        "workAdded": "Work added successfully",
        "workDeleted": "Work deleted successfully",
        "workSaved": "Work saved successfully",
        "workUpdated": "Work updated successfully"
    },
    "profile": {
        "addLanguage": "Add Language",
        "availability": "Availability",
        "bio": "Professional title",
        "bioHint": "A short summary improves credibility and response quality.",
        "bioPlaceholder": "Tell clients what you do best",
        "browse": "Browse files",
        "budgetOptions": {
            "fixed": "Fixed price",
            "flexible": "Flexible / Depends on project",
            "hourly": "Hourly rate"
        },
        "budgetPreference": "Default budget preference",
        "communicationPlaceholder": "e.g. Prefer Slack or email, weekly updates expected...",
        "communicationPreferences": "Communication preferences",
        "companyDetailsDesc": "Company info, hiring preferences and communication style",
        "companyDetailsTitle": "Company Details",
        "companyIndustry": "Industry",
        "companyName": "Company name",
        "companyNamePlaceholder": "Enter your company name",
        "companyRole": "Your role",
        "companyRolePlaceholder": "e.g. Hiring Manager, CEO",
        "companySize": "Company size",
        "companySizeOptions": {
            "elevenToFifty": "11–50 employees",
            "fiftyOneToTwoHundred": "51–200 employees",
            "justMe": "Just me",
            "oneToTen": "1–10 employees",
            "twoHundredPlus": "201+ employees"
        },
        "companyWebsite": "Website",
        "dragDrop": "Drag files here or upload from your device",
        "education": {
            "add": "Add education",
            "degree": "Degree",
            "degreePlaceholder": "Degree Placeholder",
            "endYear": "End year",
            "endYearPlaceholder": "e.g. 2023",
            "field": "Field of study",
            "fieldPlaceholder": "e.g. Computer Science",
            "institution": "Institution",
            "institutionPlaceholder": "e.g. University of Tunis",
            "noEducation": "No education added yet",
            "noEducationList": "No education details listed. Click \"Add Education\" to add.",
            "startYear": "Start year",
            "startYearPlaceholder": "e.g. 2020",
            "title": "Education"
        },
        "fullName": "Full name",
        "fullNamePlaceholder": "Enter your full name",
        "generalInfo": "General Professional Info",
        "headline": "Professional title",
        "headlinePlaceholder": "UI/UX Designer, Full-stack Developer...",
        "hiringNeeds": "Hiring needs (comma separated)",
        "hiringNeedsPlaceholder": "e.g. Designers, Developers",
        "hourlyRate": "Hourly Rate",
        "hourlyRatePlaceholder": "e.g. 35",
        "industries": "Industries you understand",
        "industriesHint": "Select up to 4 industries where you can work confidently.",
        "industriesLimit": "Industries Limit",
        "industriesTitle": "Industries",
        "languages": {
            "add": "Add language",
            "levels": {
                "basic": "Basic",
                "conversational": "Conversational",
                "fluent": "Fluent",
                "native": "Native",
                "nativeBilingual": "Native or Bilingual"
            },
            "names": {
                "arabic": "Arabic",
                "english": "English",
                "french": "French"
            },
            "select": "Select a language",
            "title": "Languages"
        },
        "legalPlaceholder": "e.g. NDA required before starting...",
        "legalPreferences": "Legal preferences",
        "location": "Location",
        "noLanguages": "No languages listed. Click \"Add Language\" to add.",
        "noMatchingSkills": "No matching skills found.",
        "noSkills": "No skills selected yet. Search below to add skills.",
        "optional": "Optional",
        "phone": "Phone number",
        "phonePlaceholder": "Used for trust and contact follow-up",
        "portfolioLinks": "Portfolio Links",
        "portfolioLinksHint": "Share links clients can open fast. Avoid private links.",
        "portfolioLinksPlaceholder": "https://site.com/work-1, https://behance.net/mywork",
        "portfolioPreferencesTitle": "Portfolio & Work Preferences",
        "professionalDetails": "Professional Details",
        "professionalDetailsDesc": "Manage your title, rate, skills and availability",
        "projectPreferences": "Project preferences",
        "projectPreferencesPlaceholder": "Describe ideal project size, communication style, and decision cadence.",
        "recordVoice": "Record voice intro",
        "revisionPolicy": "Revision policy",
        "revisionPolicyPlaceholder": "Example: 2 revisions included, additional revisions billed separately.",
        "screeningPlaceholder": "e.g. Portfolio required, technical test expected...",
        "screeningPreferences": "Screening preferences",
        "searchResults": "Search Results",
        "searchSkills": "Search skills...",
        "searchSkillsPlaceholder": "Type to search e.g. React, UI/UX...",
        "searchTools": "Search tools...",
        "secondarySkills": "more",
        "selectIndustry": "Select industry",
        "selectLanguagePlaceholder": "Select language...",
        "selectLocation": "Select your governorate",
        "skills": "Skills",
        "skillsLimit": "Skills Limit",
        "skillsSpec": "Skills you specialize in",
        "skillsTitle": "Expertise & Skills",
        "stopRecording": "Stop recording",
        "suggestedSkills": "Suggested Skills",
        "timelineOptions": {
            "asap": "As soon as possible",
            "flexible": "Flexible",
            "oneToThreeMonths": "1 to 3 months",
            "threeToSixMonths": "3 to 6 months"
        },
        "timelinePreference": "Default timeline preference",
        "tools": "Tools",
        "toolsHint": "Select up to 6 tools. This is visible to clients.",
        "toolsLimit": "Tools Limit",
        "toolsOptional": "Tools Optional",
        "toolsTitle": "Tools you use",
        "voiceIntro": "Voice introduction",
        "weeklyAvailability": "Weekly Availability",
        "weeklyAvailabilityHint": "Clients use this to decide if your timeline fits their project.",
        "weeklyAvailabilityHours": "Weekly Availability Hours",
        "weeklyAvailabilityPlaceholder": "e.g. 30",
        "workSamples": "Work samples",
        "workspaceModeTip": "You are currently in ___MODE___ mode. Switch your workspace in the header to edit the other profile\\'s settings.",
        "yearsExperience": "Years of experience",
        "yearsExperiencePlaceholder": "e.g. 3"
    },
    "proposalModal": {
        "addFile": "Add File",
        "attachmentsOptional": "Attachments (optional)",
        "bidLabel": "Your bid:",
        "cancel": "Cancel",
        "coverLetter": "Cover letter",
        "coverLetterMinHint": "Minimum {{count}} characters",
        "coverLetterPlaceholder": "Describe your approach, relevant experience, and why you're the best fit for this job...",
        "delivery": {
            "fiveDays": "5 days",
            "oneDay": "1 day",
            "oneMonth": "1 month",
            "oneWeek": "1 week",
            "threeDays": "3 days",
            "twoDays": "2 days",
            "twoMonths": "2 months",
            "twoWeeks": "2 weeks"
        },
        "deliveryTime": "Delivery time",
        "fileLimit": "Max {{size}}MB per file",
        "jobContext": "JOB CONTEXT",
        "platformFee": "Platform fee ({{percent}}%)",
        "removeAttachmentAria": "Remove attachment: {{name}}",
        "submit": "Submit Proposal",
        "submitting": "Submitting...",
        "title": "Submit Proposal",
        "validation": {
            "bidMax": "Maximum bid is {{amount}} {{currency}}",
            "bidMin": "Minimum bid is {{amount}} {{currency}}",
            "coverLetterMax": "Cover letter must be less than {{count}} characters",
            "coverLetterMin": "Cover letter must be at least {{count}} characters",
            "deliveryMax": "Maximum delivery is {{count}} days",
            "deliveryMin": "Minimum delivery is {{count}} day"
        },
        "youReceive": "You will receive"
    },
    "publicProfile": {
        "about": "About",
        "available": "Available",
        "busy": "Busy",
        "earned": "Earned",
        "editProfile": "Edit Profile",
        "memberSince": "Member since",
        "months": "months",
        "noBio": "No bio yet",
        "noReviews": "No reviews yet",
        "noSamples": "No samples yet",
        "offline": "Offline",
        "reviews": "Reviews",
        "sendMessage": "Send Message",
        "showMore": "Show more",
        "skills": "Skills",
        "voiceIntro": "Voice Introduction",
        "workSamples": "Work Samples"
    },
    "reviews": {
        "client": "Client",
        "commentLabel": "Comment Label",
        "commentPlaceholder": "Share details of your experience...",
        "freelancer": "Freelancer",
        "helpful": "Helpful",
        "jobLabel": "Job",
        "leavingReviewFor": "Leaving a review for:",
        "rating1": "Poor",
        "rating2": "Fair",
        "rating3": "Good",
        "rating4": "Very Good 👍",
        "rating5": "Excellent! 🌟",
        "ratingLabel": "How was your experience?",
        "respond": "Respond",
        "response": "Response",
        "responsePlaceholder": "Type your response...",
        "responseTitle": "Write a response",
        "responseTo": "Responding to",
        "reviewCountLabel": "reviews",
        "submitAction": "Submit Review",
        "submitResponse": "Submit Response",
        "title": "Reviews & work history"
    },
    "search": {
        "budgetNegotiable": "Negotiable",
        "budgets": {
            "0_50": "Under 50 TND",
            "100_250": "100 – 250 TND",
            "250_500": "250 – 500 TND",
            "500_plus": "500+ TND",
            "50_100": "50 – 100 TND",
            "range1": "Under 50 TND",
            "range2": "50 – 100 TND",
            "range3": "100 – 250 TND",
            "range4": "250 – 500 TND",
            "range5": "500+ TND"
        },
        "categories": {
            "design": "Design",
            "development": "Development",
            "marketing": "Marketing",
            "writing": "Writing"
        },
        "clearAll": "Clear all",
        "empty": {
            "browseAllJobs": "Or browse all jobs",
            "popularLabel": "Popular",
            "proTipLabel": "Pro Tip",
            "subtitle": "Discover talented freelancers and amazing projects in just a few clicks.",
            "tipFilters": "Use filters to narrow results by budget and category",
            "tipLabel": "Tip",
            "tipPopular": "React and UI/UX design are trending this week",
            "tipSpecific": "Be specific with keywords to find the best match faster",
            "titleHighlight": "Match",
            "titlePrefix": "Find Your Perfect",
            "trendingTitle": "Trending now"
        },
        "error": {
            "description": "We're having trouble searching right now.",
            "retry": "Try Again",
            "title": "Something went wrong"
        },
        "filterSections": {
            "budgetRange": "Budget range",
            "category": "Category"
        },
        "filters": "Filters",
        "filtersTitle": "Filters",
        "freelancers": "Freelancers",
        "jobs": "Jobs",
        "labels": {
            "freelancer": "Freelancer",
            "projects": "projects",
            "successRate": "success"
        },
        "negotiable": "Negotiable",
        "noResults": "No results found",
        "noResultsDesc": "We could not find anything matching your search",
        "noResultsView": {
            "didYouMeanPlaceholder": "Did you mean trying a broader keyword?",
            "subtitle": "Don't worry! Try one of these suggestions:",
            "suggestionCategoriesBody": "Check out trending skills",
            "suggestionCategoriesTitle": "Browse Popular Categories",
            "suggestionFiltersBody": "Remove budget or category filters",
            "suggestionFiltersTitle": "Broaden Your Filters",
            "suggestionKeywordsBody": "Different wording finds better results",
            "suggestionKeywordsTitle": "Try Alternative Keywords",
            "title": "Nothing found for"
        },
        "pagination": {
            "next": "Next",
            "pageOf": "Page {{page}} of {{total}}",
            "prev": "Prev"
        },
        "placeholder": "Search...",
        "recent": "Recent searches",
        "resetFilters": "Clear all filters",
        "resultsCount": "Showing {{count}} results for \"{{query}}\"",
        "resultsFor": "Results for",
        "resultsLabel": "results for",
        "skills": "Skills",
        "sort": {
            "budgetHigh": "Budget: High to Low",
            "budgetLow": "Budget: Low to High",
            "newest": "Newest first",
            "proposalsHigh": "Most proposals"
        },
        "tabs": {
            "all": "All",
            "freelancers": "Freelancers",
            "jobs": "Jobs"
        },
        "trending": {
            "logoDesign": "Logo Design",
            "reactJs": "React JS",
            "translation": "Translation",
            "uiux": "UI/UX"
        },
        "trendingMeta": {
            "logoDesign": "Popular now",
            "reactJs": "High demand",
            "translation": "Fast moving",
            "uiux": "Trending this week"
        },
        "trendingTags": {
            "logoDesign": "Logo Design",
            "reactJs": "React JS",
            "translation": "Translation",
            "uiux": "UI/UX"
        }
    },
    "selection": {
        "cancel": "Cancel",
        "completionRate": "Completion rate",
        "confirmSelection": "Are you sure?",
        "hours": "hours",
        "jobsCompleted": "jobs",
        "matchScore": "Match",
        "noSamples": "No samples",
        "noVoice": "No voice intro",
        "readMore": "Read more",
        "responseTimeLabel": "Responds in",
        "select": "Select",
        "startWork": "Yes, start working",
        "topMatches": "Top 3 freelancers for your job",
        "viewFullProfile": "View Full Profile",
        "voiceIntro": "Voice Introduction",
        "workSamples": "Work Samples"
    },
    "seo": {
        "faq": {
            "description": "Find answers about payments, escrow, identity verification, and how WorkedIn works.",
            "title": "Frequently Asked Questions"
        },
        "findFreelancers": {
            "description": "Find 2,500+ verified Tunisian developers, designers, translators, and consultants ready to start.",
            "title": "Find Verified Tunisian Professionals"
        },
        "forClients": {
            "description": "Post your project for free, receive proposals from verified professionals, and pay only when work is approved.",
            "title": "Hire Verified Tunisian Talent"
        },
        "freelancerProfile": {
            "addSkillPlaceholder": "Add skill...",
            "descriptionFallback": "Freelancer on the WorkedIn platform",
            "titleSuffix": "Freelancer on WorkedIn",
            "typeSkillPlaceholder": "Type a skill and press Enter..."
        },
        "home": {
            "description": "Connect with verified Tunisian professionals for your projects. Secure payments in TND and escrow protection.",
            "title": "WorkedIn"
        },
        "howItWorks": {
            "description": "See how WorkedIn takes you from project idea to approved payment in four protected steps.",
            "title": "How WorkedIn Works"
        },
        "jobBoard": {
            "description": "Browse freelance jobs in Tunisia and find projects that match your skills, rate, and availability.",
            "title": "Freelance Jobs"
        },
        "jobDetail": {
            "descriptionFallback": "View project details, budget, and requirements before applying.",
            "titleSuffix": "Project Details"
        },
        "login": {
            "description": "Sign in to your WorkedIn account to manage projects, messages, and payments.",
            "title": "Sign in to WorkedIn"
        },
        "notifications": {
            "description": "Your notifications",
            "title": "Notifications | WorkedIn"
        },
        "signup": {
            "description": "Create your account and join 2,500+ professionals building their career on WorkedIn.",
            "title": "Create your WorkedIn account"
        }
    },
    "settings": {
        "account": "Account",
        "accountOverview": "Account overview",
        "accountOverviewDescription": "This tab is the control point for how your account is set up. Switch to Profile when you want to edit details or change workspace readiness.",
        "accountOverviewTitle": "Your workspace identity and setup status",
        "accountTabHint": "Update your details and workspace",
        "accountType": "Account type",
        "accountTypeBoth": "Both",
        "accountTypeBothDesc": "Use both modes",
        "accountTypeClient": "Client",
        "accountTypeClientDesc": "Hire freelancers",
        "accountTypeFreelancer": "Freelancer",
        "accountTypeFreelancerDesc": "Offer my services",
        "accountTypeUnknown": "Not set",
        "accountVerificationTitle": "Account Verification & Trust",
        "activeContext": "Active context",
        "activeSessionsMessage": "This device is your only active session",
        "activeSessionsTitle": "Active sessions",
        "add": "Add",
        "addMethod": "Add method",
        "addPassword": "Add password",
        "addPaymentMethod": "Add payment method",
        "addPaymentMethodModalTitle": "Add payment method",
        "bankAccountNumber": "Bank account number",
        "bankTransfer": "Bank transfer",
        "bioLabel": "Bio",
        "bioPlaceholder": "Write a short bio about yourself...",
        "changePassword": "Change Password",
        "changePasswordTitle": "Change password",
        "cinVerification": "ID Verification",
        "completeProfile": "Complete your profile",
        "completion": {
            "accountType": "Account type",
            "avatar": "Profile photo",
            "bio": "Bio",
            "fullName": "Name",
            "identityVerification": "Identity verification",
            "location": "Location",
            "onboarding": "Onboarding"
        },
        "confirmPassword": "Confirm Password",
        "currentPassword": "Current Password",
        "currentWorkspace": "Current workspace",
        "default": "Default",
        "deleteAccount": "Delete Account",
        "deleteAccountConfirmAction": "Yes, delete my account",
        "deleteAccountConfirmMessage": "Are you sure you want to delete your account? All your data will be permanently removed.",
        "deleteAccountConfirmTitle": "Confirm account deletion",
        "deleteAccountDescription": "Your account and all data will be permanently deleted. This action cannot be undone.",
        "deleteAccountTitle": "Delete account",
        "deleteMyAccount": "Delete my account",
        "deletePaymentMethod": "Delete {{label}}",
        "deleteWarning": "This action cannot be undone",
        "deletingRequestSubmitting": "Submitting...",
        "deliveryMethod": {
            "email": "Email",
            "inApp": "In-app only",
            "sms": "SMS"
        },
        "discard": "Discard",
        "editProfile": "Edit Profile",
        "emailOptionalLabel": "Email (optional)",
        "emailPlaceholder": "email@example.com",
        "fullName": "Full name",
        "globalPermission": "Global permission",
        "goToDashboard": "Go to dashboard",
        "goToDashboardDescription": "Return to your workspace",
        "goToProfile": "Edit profile",
        "heroDescription": "Keep account details, security, payouts, and notification behavior in one consistent control surface. Update what matters without losing your place in the product.",
        "identityPending": "Under review",
        "identityVerificationTitle": "Identity",
        "identityVerified": "Identity verified",
        "language": "Language",
        "location": "Location",
        "logout": "Sign out",
        "moreRequired": "+{{count}} more",
        "newPassword": "New Password",
        "noBio": "No bio added yet",
        "noPasswordMessage": "No password set - you are using phone sign in",
        "noPasswordOAuth": "Signed in via {{provider}} — no password needed",
        "noPaymentMethods": "No payment method added yet",
        "noPaymentMethodsDescription": "Add a payout method now so contracts, earnings, and withdrawals are ready when you need them. Secure and encrypted.",
        "notificationChannel": "Channels",
        "notificationSettings": {
            "contractUpdates": "Contract updates",
            "marketing": "Offers and updates",
            "marketingDesc": "Tips and updates from WorkedIn",
            "newMatches": "New job matches",
            "newMatchesDesc": "Get notified when jobs match your skills",
            "newMessages": "New messages",
            "newMessagesDesc": "Get notified when you receive new messages",
            "payments": "Payments",
            "paymentsDesc": "Get notified when you send or receive payments",
            "platformNews": "Platform news",
            "reviews": "Reviews",
            "reviewsDesc": "Get notified when you receive a new review"
        },
        "notifications": "Notifications",
        "notificationsEnabled": "Active rules",
        "notificationsSubtitle": "Choose which notifications you want to receive",
        "notificationsTotal": "Delivery speed",
        "oauthPasswordMessage": "You signed in with {{provider}}. Password management is handled by your identity provider.",
        "onboardingStatus": "Onboarding",
        "pageTitle": "Settings",
        "passwordChanged": "Password updated successfully",
        "passwordSet": "Password is set",
        "passwordStatus": "Password status",
        "passwordTooShort": "Password must be at least 8 characters",
        "passwordUpdateFailed": "Failed to update password",
        "passwordsDoNotMatch": "Passwords do not match",
        "payment": "Payment",
        "paymentDetails": "Payment details",
        "paymentMethodType": "Payment method type",
        "paymentMethods": "Payment Methods",
        "paymentMethodsCount": "Saved methods",
        "paymentSubtitle": "Payment and payout methods",
        "pending": "Pending",
        "phoneNumber": "Phone number",
        "phoneNumberLabel": "Phone number",
        "phoneUnverifiedBadge": "Add a number to show a phone-verified trust badge on job posts & profiles",
        "phoneVerifiedBadge": "Verified for project and transaction notifications",
        "preferredMethod": "Preferred method",
        "privacy": "Privacy",
        "privacySettings": {
            "activeContracts": "Active contracts only",
            "anyone": "Anyone",
            "hidden": "Hidden",
            "profileVisibility": "Profile visibility",
            "public": "Public",
            "showEarnings": "Show earnings to everyone",
            "whoCanMessage": "Who can message you"
        },
        "profile": "Profile",
        "profileComplete": "Profile complete",
        "profileCompletion": "Profile completion",
        "profileCompletionTitle": "Profile completion",
        "profileDetailsTitle": "Profile Details",
        "profileReadiness": "Profile readiness",
        "profileTabs": {
            "basic": "Basic Info",
            "client": "Client",
            "freelancer": "Freelancer",
            "workspace": "Workspace"
        },
        "quickActions": "Quick actions",
        "readyForTransactions": "Ready for transactions",
        "requiredLabel": "Required:",
        "reviewNotifications": "Manage notifications",
        "reviewNotificationsDescription": "Control your alerts",
        "save": "Save",
        "saveAll": "Save all changes",
        "saveChanges": "Save changes",
        "saved": "Saved",
        "saving": "Saving...",
        "securityPosture": "Security posture",
        "securityPostureValue": "Protected by account session controls",
        "setDefault": "Set as default",
        "setupStatus": {
            "allDone": "All required setup steps are complete.",
            "complete": "Complete",
            "done": "Done",
            "identityVerification": "Identity verification",
            "pending": "Pending",
            "profileBasics": "Profile basics",
            "workspaceSetup": "Workspace setup"
        },
        "signOutAllDevices": "Sign out from all devices",
        "tabDescriptions": {
            "account": "Workspace mode, account overview, and setup guidance.",
            "notifications": "Choose what reaches you and how often.",
            "payment": "Payout methods, defaults, and transaction-ready details.",
            "profile": "Identity, bio, avatar, and workspace readiness.",
            "security": "Session control, account safety, and destructive actions."
        },
        "toasts": {
            "avatarUpdateError": "Failed to upload profile image",
            "avatarUpdated": "Profile image updated",
            "defaultPaymentUpdated": "Default payment method updated",
            "deleteRequestAlreadyOpen": "You already have an active account deletion request under review.",
            "deleteRequestSent": "Your account deletion request was sent. It will be processed within 48 hours.",
            "genericError": "Something went wrong",
            "invalidPhone": "Please enter a valid phone number.",
            "paymentAddError": "Failed to add payment method",
            "paymentAdded": "Payment method added",
            "paymentDeleteError": "Failed to delete payment method",
            "paymentDeleted": "Payment method deleted",
            "phoneTaken": "Phone number already in use.",
            "profileSaveError": "Failed to save profile changes",
            "profileSaved": "Profile updated successfully",
            "workspaceBothEnabled": "Both workspaces are now enabled on your account.",
            "workspaceUpdated": "Workspace updated successfully."
        },
        "toggleNotification": "Toggle {{label}}",
        "unsavedChanges": "You have unsaved changes",
        "updatePassword": "Update password",
        "updatingPassword": "Updating...",
        "uploadCin": "Upload ID",
        "userFallback": "User",
        "verified": "Verified",
        "verifiedLoginEmail": "Verified Login Email",
        "verifyIdentity": "Verify your identity",
        "viewProfile": "View public profile"
    },
    "support": {
        "errors": {
            "permissions": "Support request could not be submitted due to account permissions. Please email us directly at support@workedin.tn",
            "requiredFields": "Please fill in all required fields",
            "sendFailed": "Failed to send message. Please try again or email us directly at support@workedin.tn"
        },
        "form": {
            "description": "Fill out the form below and our support team will get back to you as soon as possible.",
            "emailAddress": "Email Address",
            "fullName": "Full Name",
            "fullNamePlaceholder": "Enter your full name",
            "message": "Message",
            "messagePlaceholder": "Please describe your issue in detail...",
            "sendMessage": "Send Message",
            "sending": "Sending...",
            "subject": "Subject",
            "subjectPlaceholder": "Brief description of your issue"
        },
        "success": {
            "sent": "Your message has been sent successfully. We will get back to you soon."
        }
    },
    "testimonials": {
        "items": [{"name":"Mohamed Ali","role":"Graphic Designer","quote":"Thanks to WorkedIn.tn, I earned over 5000 TND in just 2 months. The platform is easy to use and payment is fast.","earned":"5,200","image":"https://i.pravatar.cc/150?img=11"},{"name":"Fatima Ben Said","role":"Translator","quote":"The best talent marketplace in Tunisia. No bidding wars, clients find me automatically.","earned":"3,800","image":"https://i.pravatar.cc/150?img=32"},{"name":"Ahmed El Hadi","role":"Web Developer","quote":"Local payment made everything easy. D17 or bank transfer, all methods are available.","earned":"8,500","image":"https://i.pravatar.cc/150?img=53"}],
        "title": "Success Stories"
    },
    "time": {
        "days": "Days",
        "hours": "Hours",
        "lessThanHour": "Just now"
    },
    "toast": {
        "close": "Close",
        "error": "Error",
        "info": "Info",
        "success": "Success",
        "warning": "Warning"
    },
    "toasts": {
        "common": {
            "error": "An error occurred",
            "genericError": "Error",
            "success": "Operation successful"
        },
        "contract": {
            "acceptError": "Failed to accept work",
            "acceptSuccess": "Work accepted and payment released!",
            "deliverError": "Failed to deliver work",
            "deliverSuccess": "Work delivered successfully!",
            "disputeError": "Failed to open dispute",
            "disputeSuccess": "Dispute opened. Will be reviewed within 48 hours.",
            "requestChanges": "Request changes",
            "requestChangesSuccess": "Change request sent",
            "reviewSuccess": "Your review submitted successfully"
        },
        "forgotPassword": {
            "linkSent": "Reset link sent",
            "rateLimitError": "Too many attempts. Please try again later."
        },
        "job": {
            "linkCopied": "Link copied",
            "loginRequired": "Sign in to save jobs",
            "saved": "Job saved",
            "unsaved": "Job removed from saved"
        },
        "matches": {
            "contractError": "Failed to create contract",
            "contractSuccess": "Contract started successfully!",
            "searchError": "Failed to search matches"
        },
        "portfolio": {
            "addSuccess": "Work added successfully",
            "deleteError": "Failed to delete work",
            "deleteSuccess": "Work deleted successfully",
            "loadError": "Failed to load portfolio",
            "saveError": "Failed to save work",
            "updateSuccess": "Portfolio updated successfully"
        },
        "proposals": {
            "archiveError": "Failed to archive proposal",
            "archiveSuccess": "Proposal archived",
            "hireError": "Failed to hire freelancer. Please try again",
            "hireFirstMessage": "You must hire the freelancer first to start a conversation",
            "hireSuccess": "Freelancer hired successfully!",
            "loadError": "Failed to load proposals",
            "loadJobError": "Failed to load job details",
            "shortlistAdded": "Added to shortlist",
            "shortlistError": "Failed to update shortlist",
            "shortlistRemoved": "Removed from shortlist",
            "submitSuccess": "Proposal submitted successfully!",
            "withdrawError": "Failed to withdraw proposal",
            "withdrawSuccess": "Proposal withdrawn successfully"
        },
        "resetPassword": {
            "linkExpired": "Reset link expired",
            "success": "Password changed successfully"
        }
    },
    "ui": {
        "addNow": "Add now",
        "admin": "ADMIN",
        "avatar": "Avatar",
        "back": "back",
        "basic_empty_state": "Basic Empty State",
        "basic_progress": "Basic Progress",
        "cancel": "Cancel",
        "card_skeleton": "Card Skeleton",
        "change": "Change",
        "circular_skeleton": "Circular Skeleton",
        "coming_soon": "Coming Soon",
        "complete": "complete",
        "contact_workedin_tn": "contact@workedin.tn",
        "ctrl_k": "Ctrl+K",
        "custom_label": "Custom Label",
        "default": "Default",
        "delivered": "Delivered",
        "e_g": "e.g. 50",
        "edit": "Edit",
        "empty_state": "Empty State",
        "enter": "Enter",
        "error": "Error",
        "error_state": "Error State",
        "esc": "ESC",
        "f": "F",
        "front": "front",
        "hr": "/hr",
        "https": "https://...",
        "https_example_com": "https://example.com",
        "iban": "IBAN Number",
        "id": "ID",
        "in": "IN",
        "indeterminate_progress": "Indeterminate Progress",
        "kb": "KB)",
        "legal_workedin_tn": "legal@workedin.tn",
        "loading": "Loading...",
        "max_files": "Max: 5 files",
        "mb": "MB",
        "no_items_found": "No items found",
        "no_projects_yet": "No projects yet",
        "no_results_found": "No results found",
        "playing": "Playing...",
        "popular": "Popular",
        "preview": "Preview",
        "privacy_workedin_tn": "privacy@workedin.tn",
        "progress": "Progress",
        "progress_bar": "Progress Bar",
        "read": "Read",
        "recommended": "✓ Recommended",
        "recording": "Recording:",
        "rectangular_skeleton": "Rectangular Skeleton",
        "s": "s",
        "save": "Save",
        "selfie": "selfie",
        "sizes": "Sizes",
        "skeleton": "Skeleton",
        "skeleton_group": "Skeleton Group",
        "something_went_wrong": "Something went wrong",
        "spinner": "Spinner",
        "success": "Success",
        "text_skeleton": "Text Skeleton",
        "times": "&times;",
        "tip": "Tip",
        "title": "Title",
        "tn": "TN59 ...",
        "tn_xxxxx": "TN59XXXXX...",
        "toast": {
            "close": "Close"
        },
        "uploading_files": "Uploading files...",
        "variants": "Variants",
        "verified": "Verified",
        "warning": "Warning",
        "with_action": "With Action",
        "with_label": "With Label",
        "with_secondary_action": "With Secondary Action",
        "worked": "WORKED",
        "workedin": "WorkedIn •",
        "xx_xxx_xxx": "+216 XX XXX XXX"
    },
    "valuePropositions": {
        "badge": "Why WorkedIn",
        "heading": "Built different. For Tunisia.",
        "matched": {
            "description": "Apply to projects that match your exact skill level and rate. No competing on price - just on quality.",
            "title": "Matched work"
        },
        "protected": {
            "description": "Funds are held in escrow before work starts. You get paid the moment the client approves.",
            "title": "Protected payouts"
        },
        "reputation": {
            "description": "Show your verified status, portfolio, and reviews. Win trust before you say a word.",
            "title": "Build reputation"
        }
    },
    "values": {
        "localPayment": {
            "description": "D17, bank transfer, or cash",
            "title": "Local Payment"
        },
        "microJobs": {
            "description": "Starting from 10 dinars",
            "title": "Quick Jobs"
        },
        "noBidding": {
            "description": "We select the 3 best freelancers for you",
            "title": "No Bidding"
        }
    },
    "verifyEmail": {
        "checkSpam": "If you don't see the email, check your spam folder.",
        "noEmail": "Email address is required",
        "resend": "Resend verification email",
        "resendCooldown": "Resend in {{seconds}} seconds",
        "resendSuccess": "Verification email sent successfully",
        "subtitle": "We sent a verification link to {{email}}. Click it to activate your account.",
        "title": "Check your email",
        "wrongEmail": "Wrong email? Go back to signup"
    },
    "verifyIdentity": {
        "backToSettings": "Back to settings",
        "changeImage": "Change",
        "dragDropHint": "or drag and drop here",
        "errors": {
            "alreadySubmitted": "You already have a verification request.",
            "alreadyUnderReview": "Your verification request is already under review.",
            "alreadyVerified": "Your identity is already verified.",
            "fileReadFailed": "Failed to read this file. Please try another image.",
            "fileTooLarge": "File is too large (maximum 5MB)",
            "insertTimeout": "Database insert timed out after 30 seconds. Supabase may be under maintenance.",
            "invalidCin": "ID number must contain 8 digits",
            "invalidImage": "Please upload a valid image",
            "lowResolution": "Image resolution is too low. Use a clearer photo.",
            "missingImages": "Please upload all required images",
            "noSession": "No auth session - please login again",
            "permissions": "Permission denied. Please sign out and sign in again.",
            "resubmitBlocked": "Unable to reset your previous request. Please contact support.",
            "unexpected": "An unexpected error occurred",
            "withMessage": "Error: {{message}}"
        },
        "fileFormatHint": "JPG, PNG (Max 5MB)",
        "goToDashboard": "Go to dashboard",
        "header": {
            "eta": "Takes about 2-3 minutes to complete",
            "kicker": "Secure Account Upgrade",
            "subtitle": "One step away from boosting client trust and protecting your account",
            "title": "Identity verification"
        },
        "loginAgainError": "Please log in again",
        "pending": {
            "badge": "Under review",
            "description": "Your identity verification request has been received successfully. Our team is reviewing your documents.",
            "emailNotice": "You will be notified once the review is complete",
            "reviewTime": "Review time: up to 24 hours",
            "seoDescription": "Your identity verification request is under review by our team",
            "seoTitle": "Verification request under review",
            "title": "Your request is under review"
        },
        "preview": "Preview",
        "processing": "Processing...",
        "progress": {
            "back": "Back side",
            "front": "Front side",
            "review": "Review",
            "selfie": "Selfie"
        },
        "removeImage": "Remove",
        "review": {
            "backImage": "Back side",
            "checkBack": "Back image added",
            "checkCin": "CIN number valid",
            "checkConsent": "Privacy consent accepted",
            "checkFront": "Front image added",
            "checkSelfie": "Selfie added",
            "cinLabel": "ID number (8 digits)",
            "cinPlaceholder": "12345678",
            "consentPrefix": "I agree to the use of my personal information to verify my identity according to the ",
            "editBack": "Edit back image",
            "editFront": "Edit front image",
            "editSelfie": "Edit selfie",
            "frontImage": "Front side",
            "privacyNotice": "Your data is stored securely and encrypted. Your identity information will not be shared with any third party and is used only for account verification.",
            "privacyPolicy": "Privacy Policy",
            "readiness": "Readiness score",
            "selfieImage": "Selfie",
            "submit": "Confirm and submit",
            "submitting": "Submitting...",
            "title": "Review details"
        },
        "security": {
            "desc": "Your documents are encrypted and only used for account verification.",
            "qualityDesc": "We validate file format, size, and basic image quality before upload.",
            "qualityTitle": "Smart quality checks",
            "reviewDesc": "Most verification requests are reviewed within 24 hours.",
            "reviewTitle": "Fast review",
            "title": "Encrypted storage"
        },
        "seo": {
            "description": "Verify your identity to increase client trust and unlock all platform features",
            "title": "Identity Verification"
        },
        "stepCounter": "Step {{current}} of {{total}}",
        "steps": {
            "back": {
                "description": "Please upload a clear image of the back side of your national ID card",
                "title": "ID card back side"
            },
            "front": {
                "description": "Please upload a clear image of the front side of your national ID card",
                "title": "ID card front side"
            },
            "selfie": {
                "description": "Please take a clear selfie photo to verify your identity",
                "title": "Selfie photo"
            }
        },
        "submitted": {
            "description": "Our team will review your documents and respond as soon as possible (usually within 24 hours). We will notify you by email when the review is complete.",
            "seoDescription": "Your identity verification request has been received",
            "seoTitle": "Request submitted",
            "title": "Your request has been received successfully"
        },
        "success": {
            "submitted": "Verification request submitted successfully"
        },
        "tipLabel": "Tip:",
        "tips": {
            "back": "Make sure all edges and numbers are visible and in focus.",
            "front": "Place the ID on a dark background and avoid flash reflections.",
            "selfie": "Face the camera in good light and avoid hats or sunglasses."
        },
        "uploadHint": "Click to upload image",
        "verified": {
            "description": "Your account is now verified and you received the blue verification badge. You can now enjoy all platform features.",
            "title": "Your identity has been verified successfully"
        }
    },
    "wallet": {
        "accHolderName": "Account Holder Name",
        "accountHolder": "Account Holder Name",
        "activeEscrow": "Active Escrow",
        "addedToWallet": "Added to wallet",
        "amount": "Amount",
        "available": "Available",
        "availableBalance": "Available Balance",
        "balance": "Available Balance",
        "bankName": "Bank Name",
        "bankTransfer": "Bank Transfer",
        "bankTransferDesc": "Withdraw directly to your local bank account",
        "cancel": "Cancel",
        "clearingHold": "Clearing Hold",
        "comingSoonLabel": "Coming soon",
        "continueToPayment": "Continue to payment",
        "d17": "D17",
        "d17Desc": "Withdraw via e-Dinar. Coming soon.",
        "date": "Date",
        "deposit": "Deposit Funds",
        "depositAmountError": "Amount must be between {{min}} and {{max}} TND",
        "depositAmountLabel": "Deposit Amount (TND)",
        "depositLimits": "Min: 10 TND - Max: 5,000 TND",
        "depositPreview": "Deposit Preview",
        "description": "Description",
        "earningsGrowth": "Earnings Growth",
        "enterPhone": "Please enter phone number",
        "errors": {
            "accountHolderRequired": "Account holder name is required",
            "bankNameRequired": "Bank name is required",
            "ibanInvalid": "IBAN must start with TN",
            "ibanRequired": "IBAN is required",
            "phoneInvalid": "Enter a valid phone number",
            "phoneRequired": "Phone number is required"
        },
        "fillBankDetails": "Please fill all bank details",
        "flouci": "Flouci",
        "flouciDesc": "Withdraw via Flouci mobile wallet. Coming soon.",
        "free": "Free",
        "frozenDisputed": "Frozen Disputed",
        "fullPaymentHistory": "Full payment history",
        "genericError": "An error occurred. Please try again.",
        "howItWorksTitle": "How it works",
        "iban": "IBAN",
        "inReview": "In Review",
        "invalidAmount": "Invalid amount",
        "locked": "Locked",
        "lockedFunds": "Locked Funds Schedule",
        "lockedFundsTitle": "Locked Funds Schedule",
        "method": "Withdrawal Method",
        "minAmount": "Min {{min}} TND",
        "minWithdrawalNotice": "Minimum withdrawal is {{min}} TND. Requests are reviewed manually before processing.",
        "mockDepositFailed": "Failed to credit mock wallet deposit",
        "monthlyBillingVolume": "Monthly billing volume generated (last 6 months)",
        "monthlyFundingVolume": "Monthly platform funding volume spent (last 6 months)",
        "moreMethodsSoon": "More payment methods will be available soon.",
        "moveEarnings": "Move earnings to bank",
        "netAmount": "Net Amount",
        "next": "Next",
        "noLockedFunds": "No funds currently locked",
        "noPaymentLink": "Payment link was not generated",
        "noTransactions": "No transactions yet",
        "noTransactionsDesc": "Your transaction history will appear here",
        "noWithdrawals": "No withdrawals yet",
        "noWithdrawalsDesc": "Request a withdrawal to see it here",
        "notAuthenticated": "Not authenticated",
        "pageOf": "Page {{page}} of {{totalPages}}",
        "paymentMethod": "Payment Method",
        "pendingBalance": "Pending in Escrow",
        "phone": "Phone Number",
        "platformFeeNotice": "Platform fee (~1%)",
        "previous": "Previous",
        "processingDeposit": "Processing...",
        "processingFee": "Processing fee",
        "quickAmounts": "Quick Amounts",
        "recentTransactions": "Recent Transactions",
        "requestWithdrawal": "Request Withdrawal",
        "seo": {
            "description": "Track your balance, transactions, and withdrawal requests.",
            "title": "Wallet"
        },
        "spendingHistory": "Spending History",
        "status": {
            "approved": "Approved",
            "completed": "Completed",
            "pending": "Pending",
            "processing": "Processing",
            "rejected": "Rejected"
        },
        "statusLabel": "Status",
        "steps": {
            "review": "Review (2–5 days)",
            "reviewDesc": "Our team verifies your request",
            "submitRequest": "Submit request",
            "submitRequestDesc": "Fill and submit your withdrawal details",
            "transferSent": "Transfer sent",
            "transferSentDesc": "Funds hit your account"
        },
        "submit": "Submit",
        "submitWithdrawal": "Submit Withdrawal Request",
        "submitting": "Submitting...",
        "summary": "Summary",
        "tabs": {
            "deposit": "Deposit",
            "overview": "Overview",
            "transactions": "Transactions",
            "withdraw": "Withdraw"
        },
        "title": "My Wallet",
        "topUpWallet": "Top up your wallet",
        "topUpWalletDesc": "Top up your wallet securely via escrow",
        "totalEarned": "Total Earned",
        "totalWithdrawn": "Total Withdrawn",
        "transactionHistory": "Transaction History",
        "transactionLabel": "Transaction",
        "transferEarningsDesc": "Transfer earnings to your payment method",
        "type": "Type",
        "unknownUser": "Unknown User",
        "viewAllArrow": "View all →",
        "whyEscrow": "Why Dhmad Escrow?",
        "whyEscrow1": "Funds held securely until work approved",
        "whyEscrow2": "Dispute resolution built in",
        "whyEscrow3": "Zero deposit fees — pay only what you deposit",
        "withdrawalAmount": "Withdrawal Amount",
        "withdrawalError": "Failed to submit withdrawal request",
        "withdrawalHistory": "Withdrawal History",
        "withdrawalSubmittedDesc": "Your request will be reviewed within 2-5 business days",
        "withdrawalSubmittedTitle": "Withdrawal Request Submitted",
        "withdrawalSuccess": "Withdrawal request submitted successfully",
        "youPay": "You pay",
        "youReceive": "You receive",
        "youWithdraw": "You withdraw"
    }
};
