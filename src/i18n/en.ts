import type { Translations } from './ar';

export const en: Translations = {
    "nav": {
        "home": "Home",
        "howItWorks": "How It Works",
        "forFreelancers": "For Freelancers",
        "forClients": "For Clients",
        "pricing": "Pricing",
        "login": "Sign in",
        "signup": "Create account",
        "dashboard": "Dashboard",
        "jobs": "Available Jobs",
        "messages": "Messages",
        "profile": "Profile",
        "settings": "Settings",
        "logout": "Logout",
        "findWork": "Find Work",
        "findFreelancers": "Find Freelancers",
        "findFreelancersTitle": "Find Freelancers",
        "myJobs": "My Jobs",
        "saved": "Saved",
        "contracts": "Contracts",
        "proposals": "Proposals",
        "postProject": "Post Project",
        "myProjects": "My Projects",
        "wallet": "Wallet",
        "adminDashboard": "Admin Dashboard"
    },
    "notFound": {
        "title": "Page Not Found",
        "description": "The page you're looking for doesn't exist or has been moved.",
        "goBack": "Go Back",
        "goHome": "Go Home"
    },
    "jobs": {
        "title": "Available Jobs",
        "loadError": "Failed to load jobs",
        "searchPlaceholder": "Search for jobs...",
        "filters": {
            "title": "Filters",
            "clearAll": "Clear All",
            "categories": {
                "title": "Category",
                "design": "Design",
                "development": "Development",
                "writing": "Writing",
                "marketing": "Marketing",
                "translation": "Translation",
                "video": "Video & Animation",
                "business": "Business",
                "data": "Data Entry",
                "other": "Other"
            },
            "jobType": {
                "title": "Job Type",
                "fixed_price": "Fixed Price",
                "hourly": "Hourly"
            },
            "budget": {
                "title": "Budget (TND)",
                "all": "All",
                "min": "Min",
                "max": "Max",
                "ranges": {
                    "r0_50": "0 - 50 TND",
                    "r50_100": "50 - 100 TND",
                    "r100_250": "100 - 250 TND",
                    "r250_500": "250 - 500 TND",
                    "r500_plus": "500+ TND"
                }
            },
            "experience": {
                "title": "Experience Level",
                "entry": "Entry Level",
                "intermediate": "Intermediate",
                "expert": "Expert"
            },
            "postedDate": {
                "title": "Posted Date",
                "any": "Any Time",
                "h24": "Last 24 Hours",
                "d3": "Last 3 Days",
                "w1": "Last Week",
                "m1": "Last Month"
            },
            "viewResults": "View Results"
        },
        "sort": {
            "newest": "Newest First",
            "budgetHigh": "Budget: High to Low",
            "budgetLow": "Budget: Low to High",
            "proposalsHigh": "Most Proposals",
            "proposalsLow": "Fewest Proposals"
        },
        "stats": {
            "availableJobs": "jobs available"
        },
        "empty": {
            "title": "No jobs found",
            "subtitle": "Try changing your search criteria or filters",
            "action": "Clear Filters"
        },
        "loadMore": "Load More",
        "save": "Save Job",
        "saved": "Job Saved",
        "unsave": "Unsave Job",
        "apply": "Apply Now",
        "postedAgo": "Posted {{time}}",
        "budget": "Budget",
        "hourlyRate": "Hourly Rate",
        "proposals": "proposals",
        "verifiedPayment": "Payment Verified",
        "unverifiedPayment": "Payment Unverified",
        "newClient": "New Client",
        "savedJobs": {
            "title": "Saved Jobs",
            "viewAll": "View All"
        },
        "time": {
            "now": "Just now",
            "minute": "min",
            "hour": "h",
            "day": "d",
            "ago_prefix": "",
            "ago": "ago"
        },
        "location": {
            "remote": "Remote"
        },
        "new": {
            "seo": {
                "title": "Post a Project",
                "description": "Create a new project, define budget and timeline, and publish it to receive freelancer proposals."
            },
            "heroTitle": "Post a project with clarity and attract better-fit freelancers.",
            "heroDescription": "Move through the brief in focused phases: define the work, set budget and timing, choose visibility, then review before publishing.",
            "steps": {
                "basics": "Job details",
                "basicsDescription": "Define the brief, category, and required skills clearly.",
                "budget": "Budget and timeline",
                "budgetDescription": "Set pricing model, expected duration, and experience level.",
                "visibility": "Visibility",
                "visibilityDescription": "Choose whether the brief is public or invite-only.",
                "review": "Review and publish",
                "reviewDescription": "Validate the brief before sending it live."
            },
            "stepCounter": "Step {{current}} of {{total}}",
            "autosave": {
                "saving": "Saving...",
                "saved": "Saved",
                "lastSaved": "Last saved: {{time}}",
                "ready": "Autosave ready"
            },
            "wizard": {
                "badge": "Project posting flow",
                "currentPhase": "Current phase",
                "progress": "Progress",
                "stepsLeft": "steps left",
                "metaDraft": "Draft-safe flow"
            },
            "actions": {
                "previous": "Previous",
                "saveDraft": "Save draft",
                "next": "Next",
                "publishJob": "Publish job"
            },
            "restoreDraft": {
                "title": "Restore draft",
                "description": "We found a saved draft from {{time}}. Do you want to restore and continue?",
                "jobTitle": "Title",
                "untitled": "(Untitled)",
                "startFresh": "Start fresh",
                "restore": "Restore draft"
            },
            "toasts": {
                "draftRestored": "Draft restored successfully",
                "draftSaved": "Draft saved successfully",
                "jobPosted": "Job posted successfully!"
            },
            "errors": {
                "titleRequiredForDraft": "Please enter a job title to save draft",
                "loginRequired": "You must be logged in to post a job",
                "saveFailed": "Something went wrong while saving the job",
                "attachmentsUnavailable": "Attachments could not be uploaded right now. Your job will be posted without them.",
                "stepIncomplete": "Please complete the required fields before continuing."
            },
            "time": {
                "now": "Just now",
                "minutesAgo": "{{count}} min ago",
                "hoursAgo": "{{count}} h ago"
            },
            "stepBasics": {
                "badge": "Project brief",
                "title": "Job details",
                "subtitle": "Start with a clear title and a detailed project description to attract the best freelancers.",
                "categoryDesign": "Design and Creativity",
                "categoryDevelopment": "Development",
                "categoryMarketing": "Marketing and Sales",
                "categoryWriting": "Writing and Translation",
                "projectTitle": "Project title",
                "projectTitlePlaceholder": "Example: Logo design for a food company",
                "mainCategory": "Main category",
                "subcategory": "Subcategory",
                "selectCategory": "Select category",
                "selectSubcategory": "Select subcategory",
                "projectDescription": "Project description",
                "projectDescriptionPlaceholder": "Describe project details, expected deliverables, and any special requirements...",
                "characterCount": "{{current}} / {{max}} characters",
                "tip1": "Be specific about the required work",
                "tip2": "Clearly define final deliverables",
                "tip3": "Add links to similar projects if available",
                "tip4": "Clarify what should be delivered and when you expect completion",
                "requiredSkills": "Required skills (max 5)",
                "attachments": "Attachments (optional)",
                "attachmentsDescription": "PDF, DOC, DOCX, TXT - Max 10MB per file"
            },
            "stepBudget": {
                "badge": "Pricing setup",
                "title": "Budget and timeline",
                "subtitle": "Choose the payment model and set your project budget",
                "fixedPrice": "Fixed price",
                "fixedPriceDescription": "Pay a fixed amount for the entire project upon completion.",
                "hourly": "Hourly",
                "hourlyDescription": "Pay the freelancer based on hours worked.",
                "estimatedBudget": "Estimated project budget (TND)",
                "min": "Min",
                "max": "Max",
                "hourlyRate": "Hourly rate (TND)",
                "hourlyRateExample": "Example: 20",
                "weeklyHours": "Estimated weekly hours",
                "weeklyHoursExample": "Example: 10-20",
                "duration": "Project duration",
                "selectDuration": "Select duration",
                "durationLessThan1Month": "Less than 1 month",
                "duration1To3Months": "1 to 3 months",
                "duration3To6Months": "3 to 6 months",
                "durationMoreThan6Months": "More than 6 months",
                "experienceLevel": "Required experience level",
                "beginner": "Beginner",
                "intermediate": "Intermediate",
                "expert": "Expert",
                "deadline": "Deadline"
            },
            "stepVisibility": {
                "badge": "Audience control",
                "title": "Who can see your job?",
                "subtitle": "Choose the privacy level that fits your project.",
                "publicTitle": "Public",
                "publicDescription": "All freelancers can see and submit proposals. Best for getting more proposals.",
                "inviteOnlyTitle": "Invite only",
                "inviteOnlyDescription": "The job will not appear in search. Only invited freelancers can submit proposals.",
                "tipTitle": "Tip:",
                "tipDescription": "If your project is sensitive or requires niche skills, invite-only gives you more control. For general projects, public visibility increases competition and pricing options."
            },
            "stepReview": {
                "badge": "Final check",
                "title": "Review and publish",
                "subtitle": "Review the brief one last time before it goes live to freelancers.",
                "warning": "Please review your job details carefully before publishing. After publishing, only some details can be edited.",
                "now": "Now",
                "projectDescription": "Project description",
                "budget": "Budget",
                "hourlyBudget": "{{rate}} TND / hour",
                "experienceLevel": "Required level",
                "projectDuration": "Project duration",
                "visibility": "Visibility",
                "inviteOnlyVisibility": "Private (invite only)",
                "publicVisibility": "Public (everyone)",
                "privacyLevel": "Privacy level",
                "attachments": "Attachments",
                "requiredSkills": "Required skills",
                "durationLessThan1Month": "Less than 1 month",
                "duration1To3Months": "1 - 3 months",
                "duration3To6Months": "3 - 6 months",
                "durationMoreThan6Months": "More than 6 months",
                "beginner": "Beginner",
                "intermediate": "Intermediate",
                "expert": "Expert",
                "deadline": "Deadline"
            },
            "validation": {
                "deadlineRequired": "Please select a deadline",
                "deadlineFuture": "Deadline must be today or later",
                "titleMin": "Title must be at least 8 characters",
                "categoryRequired": "Please select a category",
                "subcategoryRequired": "Please select a subcategory",
                "descriptionMin": "Description must be at least 80 characters",
                "skillsRequired": "Please select at least one skill",
                "maxFiles": "Maximum 5 files",
                "budgetMin": "Minimum budget must be at least 1",
                "budgetMax": "Maximum budget must be at least 1",
                "hourlyRate": "Hourly rate must be at least 1",
                "estimatedHours": "Please enter estimated weekly hours",
                "durationRequired": "Please select a duration",
                "budgetRequired": "Please set a budget",
                "budgetRange": "Maximum budget must be greater than or equal to minimum budget",
                "subcategoryInvalid": "Please select a valid subcategory"
            }
        }
    },
    "hero": {
        "title": "Where Tunisian Talent Gets Paid Fairly",
        "headlineStart": "Where Tunisian Talent",
        "headlineHighlight": "Gets Paid Fairly",
        "subtitle": "No auctions. No middlemen. Post a project, agree on terms, get paid in TND — secured by escrow.",
        "ctaFreelancer": "Start earning today",
        "ctaClient": "Post a project free",
        "badge": "Built in Tunisia. Built for Tunisia.",
        "socialProof": "2,500+ professionals already working on WorkedIn",
        "rating": "4.9/5 — rated by verified freelancers and clients",
        "activity": {
            "eyebrow": "Live platform activity",
            "title": "Real work. Real payments.",
            "tag": "Now live in Tunisia",
            "metrics": {
                "activeProjects": "Active projects",
                "avgProjectValue": "Avg. project value",
                "verifiedFreelancers": "Verified freelancers",
                "projectsCompleted": "Projects completed"
            }
        },
        "stats": {
            "professionals": "Active professionals",
            "projects": "Projects completed",
            "escrow": "TND in escrow"
        },
        "trust": {
            "verified": "Identity-verified professionals",
            "verifiedBody": "Every freelancer is ID-checked before taking their first project.",
            "secure": "Escrow-protected payments",
            "secureBody": "Funds are held securely and released only when work is approved.",
            "users": "Users"
        }
    },
    "home": {
        "stats": {
            "live": "Live Stats",
            "activeJobs": "Active Jobs",
            "users": "Users",
            "rating": "Rating"
        },
        "sections": {
            "howItWorks": {
                "badge": "How It Works",
                "subtitle": "A simple and effective system connecting you with top talent or best opportunities",
                "freelancerDesc": "Find work easily",
                "clientDesc": "Hire top talent"
            },
            "categories": {
                "badge": "Categories",
                "subtitle": "Discover skills in demand in the Tunisian market"
            },
            "testimonials": {
                "badge": "Success Stories",
                "earned": "Earned"
            },
            "cta": {
                "badge": "Start Your Journey",
                "title": "Ready to Start?",
                "subtitle": "Join thousands of Tunisians building their careers with us. Registration is free and easy.",
                "btnStart": "Start Now for Free",
                "btnWatch": "Watch How It Works"
            }
        }
    },
    "values": {
        "noBidding": {
            "title": "No Bidding",
            "description": "We select the 3 best freelancers for you"
        },
        "localPayment": {
            "title": "Local Payment",
            "description": "D17, bank transfer, or cash"
        },
        "microJobs": {
            "title": "Quick Jobs",
            "description": "Starting from 10 dinars"
        }
    },
    "howItWorks": {
        "title": "How WorkedIn Works",
        "heroTitle": "Simple by design.",
        "heroTitleHighlight": "Secure by default.",
        "brandName": "WorkedIn",
        "subtitle": "Four steps from project idea to payment received — every step protected, every TND accounted for.",
        "tabs": {
            "freelancer": "For Freelancers",
            "client": "For Clients"
        },
        "cta": {
            "freelancer": "Start earning today",
            "client": "Post a project free"
        },
        "freelancerSteps": [
            {
                "title": "Build your profile once",
                "description": "Add skills, portfolio, and rate. Clients find you — no bidding required."
            },
            {
                "title": "Get matched to real projects",
                "description": "Our system surfaces you to clients looking for exactly your skills."
            },
            {
                "title": "Agree on terms, start work",
                "description": "Chat, negotiate, and lock in the scope before any money moves."
            },
            {
                "title": "Get paid on approval",
                "description": "Funds are in escrow from day one. Approve the milestone — receive your TND."
            }
        ],
        "clientSteps": [
            {
                "title": "Post in 2 minutes",
                "description": "Describe the work, set your budget, choose fixed or hourly."
            },
            {
                "title": "Review verified proposals",
                "description": "Every freelancer is ID-verified. Filter by rating, skill, and price."
            },
            {
                "title": "Track milestones, not guesses",
                "description": "Clear deliverables, deadlines, and progress — all in one workspace."
            },
            {
                "title": "Release payment, leave a review",
                "description": "Approve the work, release funds from escrow, rate the experience."
            }
        ],
        "trust": {
            "money": {
                "title": "Full refund if unsatisfied",
                "desc": "If work doesn't meet agreed terms, you get your TND back. No questions."
            },
            "verified": {
                "title": "Every professional is ID-verified",
                "desc": "We check national ID before any freelancer goes live on WorkedIn."
            },
            "support": {
                "title": "Support in Arabic, French & English",
                "desc": "Real humans, local timezone, three languages."
            }
        },
        "faq": {
            "title": "Common Questions",
            "items": [
                {
                    "q": "Is registration free?",
                    "a": "Yes, registration is completely free for both freelancers and clients. We only charge a small commission on successful projects."
                },
                {
                    "q": "How is my money secured?",
                    "a": "WorkedIn acts as a trusted intermediary. Clients pay us, we hold funds until delivery is approved, then release to the freelancer."
                },
                {
                    "q": "What payment methods?",
                    "a": "We support all local Tunisian methods: local/int'l cards, D17, bank transfer, and even cash for small amounts."
                },
                {
                    "q": "Can I register as a company?",
                    "a": "Yes, you can register a company account to hire staff or offer services as a team."
                }
            ]
        }
    },
    "forClients": {
        "hero": {
            "badge": "Hire verified Tunisian talent",
            "title": "Your project, delivered.",
            "titleHighlight": "On time. On budget.",
            "subtitle": "Post for free. Receive proposals from verified professionals. Pay only when you approve the work — every payment protected by escrow.",
            "cta": "Post a project — it's free",
            "secondary": "See how it works"
        },
        "benefits": {
            "speed": {
                "title": "Hire in 24 hours",
                "desc": "Post your project and receive verified proposals the same day."
            },
            "secure": {
                "title": "Pay when satisfied",
                "desc": "Funds are held in escrow. Released only when you approve."
            },
            "local": {
                "title": "Tunisian professionals",
                "desc": "Work with people who understand the local market, language, and culture."
            }
        },
        "categories": {
            "title": "Every skill. One platform.",
            "items": [
                "Development",
                "Design & Creative",
                "Writing & Translation",
                "Sales & Marketing",
                "Video & Animation",
                "Engineering",
                "Support",
                "Education"
            ]
        },
        "talent": {
            "title": "Who you'll be working with"
        },
        "cta": {
            "title": "Your next project starts here.",
            "text": "2,500+ verified professionals are ready to work. Post your project free — no subscription, no commitment.",
            "button": "Create a free client account"
        }
    },
    "categories": {
        "title": "Categories",
        "graphicDesign": "Graphic Design",
        "webDev": "Web Development",
        "translation": "Translation",
        "videoEditing": "Video Editing",
        "contentWriting": "Content Writing",
        "dataEntry": "Data Entry",
        "digitalMarketing": "Digital Marketing",
        "photography": "Photography",
        "uiux": "UI/UX Design",
        "mobileApp": "Mobile Development",
        "availableJobs": "jobs available"
    },
    "counter": {
        "title": "dinars earned by Tunisians this month"
    },
    "testimonials": {
        "title": "Success Stories",
        "items": [
            {
                "name": "Mohamed Ali",
                "role": "Graphic Designer",
                "quote": "Thanks to WorkedIn.tn, I earned over 5000 TND in just 2 months. The platform is easy to use and payment is fast.",
                "earned": "5,200",
                "image": "https://i.pravatar.cc/150?img=11"
            },
            {
                "name": "Fatima Ben Said",
                "role": "Translator",
                "quote": "The best talent marketplace in Tunisia. No bidding wars, clients find me automatically.",
                "earned": "3,800",
                "image": "https://i.pravatar.cc/150?img=32"
            },
            {
                "name": "Ahmed El Hadi",
                "role": "Web Developer",
                "quote": "Local payment made everything easy. D17 or bank transfer, all methods are available.",
                "earned": "8,500",
                "image": "https://i.pravatar.cc/150?img=53"
            }
        ]
    },
    "auth": {
        "phone": "Phone Number",
        "phonePlaceholder": "Enter your phone number",
        "email": "Email",
        "emailPlaceholder": "Enter your email",
        "password": {
            "label": "Password",
            "show": "Show password",
            "hide": "Hide password"
        },
        "passwordPlaceholder": "Enter your password",
        "confirmPassword": "Confirm Password",
        "confirmPasswordPlaceholder": "Re-enter your password",
        "sendCode": "Send Verification Code",
        "verifyCode": "Verification Code",
        "verify": "Verify",
        "resendCode": "Resend Code",
        "resendIn": "Resend in",
        "seconds": "seconds",
        "selectUserType": "How will you use WorkedIn?",
        "selectUserTypeSubtitle": "You can always add the other role later from settings.",
        "freelancer": "Freelancer",
        "client": "Client",
        "both": "Both",
        "completeProfile": "Complete Registration",
        "createAccount": "Create Account",
        "loginTitle": "Sign in to WorkedIn",
        "loginSubtitle": "Welcome back. Your work is waiting.",
        "signupTitle": "Create your account",
        "signupSubtitle": "Join 2,500+ professionals building their career on WorkedIn.",
        "noAccount": "Don't have an account?",
        "hasAccount": "Already have an account?",
        "invalidCredentials": "Invalid email or password",
        "emailExists": "This email is already registered",
        "passwordMismatch": "Passwords do not match",
        "passwordMinLength": "Password must be at least 6 characters",
        "passwordValidation": {
            "minLength": "Password must be at least 8 characters",
            "uppercase": "Must contain at least one uppercase letter",
            "lowercase": "Must contain at least one lowercase letter",
            "number": "Must contain at least one number"
        },
        "passwordStrength": {
            "weak": "Weak",
            "medium": "Medium",
            "strong": "Strong"
        },
        "invalidEmail": "Enter a valid email address",
        "emailNotConfirmed": "Email not confirmed",
        "resetPassword": {
            "linkExpired": "Reset link expired",
            "success": "Password changed successfully",
            "error": "Error changing password",
            "setNewTitle": "Set new password"
        },
        "forgotPassword": "Forgot password?",
        "forgotPasswordForm": {
            "rateLimited": "Too many attempts. Try again later.",
            "sent": "Reset link sent",
            "error": "Error sending reset link",
            "sendTitle": "Send reset link"
        },
        "login": "Sign in",
        "signup": "Create account",
        "signOut": "Sign Out",
        "googleLogin": "Continue with Google",
        "googleLoginError": "Google login failed",
        "or": "or",
        "loggingOut": "Logging out...",
        "userTypeFreelancerDesc": "I offer skills and want to get paid for my work",
        "userTypeClientDesc": "I have projects and need reliable professionals",
        "userTypeBothDesc": "I do both — I work and I hire",
        "accountPanel": {
            "sectionLabel": "Workspace",
            "switchWorkspace": "Switch workspace",
            "switchWorkspaceBoth": "Use the same account to hire and freelance without separate logins.",
            "switchWorkspaceSingle": "Enable the second workspace only when you actually need it.",
            "completeSetup": "Complete setup",
            "freelancerLabel": "Freelancer",
            "clientLabel": "Client",
            "ready": "Ready",
            "needsSetup": "Needs setup",
            "progressLabel": "Profile completion",
            "freelancerDesc": "Find work, send proposals, and get paid in TND.",
            "clientDesc": "Post projects, compare proposals, and release escrow payments.",
            "current": "Current",
            "switchAction": "Switch",
            "enable": "Enable",
            "switching": "Switching",
            "switchedFreelancer": "Freelancer workspace is now active.",
            "switchedClient": "Client workspace is now active.",
            "switchError": "We could not switch your workspace right now.",
            "manageProfile": "Manage profile",
            "freelancerHint": "Complete the core freelancer details here, then polish the rest later in Settings.",
            "clientHint": "Finish the client basics here first, then manage billing and company details in Settings.",
            "tools": "Account tools",
            "profileAction": "Profile",
            "settingsAction": "Settings",
            "logoutAction": "Sign out",
            "logoutDesc": "End this session safely on this device.",
            "defaultUser": "WorkedIn User",
            "statusPro": "Pro",
            "statusPending": "Pending",
            "workspaceActive": "Active Workspace",
            "setupInFiveMinutes": "Set up in 5 min",
            "switchOver": "Switch over",
            "switchInstantly": "Switch instantly",
            "adminDashboard": "Admin Dashboard",
            "walletAndEarnings": "Wallet & earnings",
            "freelancerFeatureBrowseJobs": "Browse and apply to jobs",
            "freelancerFeatureReceivePayments": "Receive payments in TND",
            "freelancerFeaturePortfolio": "Build public portfolio",
            "clientFeaturePostProjects": "Post projects for free",
            "clientFeatureReviewProposals": "Review verified proposals",
            "clientFeatureEscrow": "Escrow-protected payments"
        }
    },
    "dashboard": {
        "welcome": "Welcome back",
        "jobsCompleted": "jobs completed",
        "totalEarnings": "dinars",
        "responseTime": "hours",
        "rating": "Rating",
        "availableJobs": "Jobs matching your skills",
        "all": "All",
        "new": "New",
        "urgent": "Urgent",
        "viewDetails": "View Details",
        "recentActivity": "Recent Activity",
        "updateProfile": "Update Profile",
        "profileCompletion": "Profile Completion",
        "freelancerSubtitle": "Freelancer Dashboard",
        "clientSubtitle": "Client Dashboard",
        "quickActions": "Quick Actions",
        "viewProfile": "View Profile",
        "browseJobs": "Browse Jobs",
        "postNewJob": "Post a New Job",
        "postNewJobDesc": "Tell us about your job and we will find you the top 3 freelancers",
        "yourJobs": "Your Jobs",
        "viewAll": "View All",
        "client": {
            "defaultName": "Client",
            "activeJobs": "Active jobs",
            "activeJobsDetail": "Open or in-progress projects currently requiring decisions, proposals, or delivery follow-up.",
            "totalSpent": "Total spent",
            "totalSpentDetail": "Completed payouts released through your client wallet and escrow flows.",
            "completedContracts": "Completed contracts",
            "completedContractsDetail": "Projects you have taken through delivery and successfully closed out.",
            "proposalsWaiting": "Jobs awaiting review",
            "proposalsWaitingDetail": "Open jobs that already have proposals and should be reviewed before they go stale.",
            "commandCenter": "Client command center",
            "welcomeBack": "Welcome back",
            "heroGreeting": "Welcome back, {{name}}",
            "heroDescription": "Keep your hiring pipeline clean: post sharper briefs, review proposals faster, and move active work through delivery without extra noise.",
            "focusLabel": "Today focus",
            "focusFirstJobTitle": "Post your first project brief",
            "focusFirstJobDescription": "A clear job brief unlocks proposals, shortlists, and contracts. Start there before anything else.",
            "focusReviewTitle": "Review incoming proposals",
            "focusReviewDescription": "Your job \"{{title}}\" already has proposals waiting for your review.",
            "reviewProposals": "Review proposals",
            "focusDeliveryTitle": "Stay close to active delivery",
            "focusDeliveryDescription": "Track milestones, messages, and approvals so active projects keep moving without friction.",
            "openProjects": "Open projects",
            "focusScaleTitle": "Open a stronger next project",
            "focusScaleDescription": "You have a calm dashboard right now. Tighten your next brief and invite better-fit freelancers earlier.",
            "pipeline": {
                "totalProposals": "total proposals",
                "openJobs": "open jobs",
                "unreadUpdates": "unread updates"
            },
            "manageWorkspace": "Manage workspace",
            "postJob": "Post a new job",
            "projectsBadge": "Hiring pipeline",
            "projectsDescription": "Latest project briefs, proposal signals, and active delivery states in one place.",
            "noJobsYet": "No jobs posted yet",
            "noJobsDescription": "Your dashboard will start filling up once you publish a project brief and invite proposals into the pipeline.",
            "jobBudget": "Budget",
            "proposalsLabel": "Proposals",
            "proposalsSubmitted": "{{count}} proposals submitted",
            "assigneeLabel": "Assigned freelancer",
            "freelancerFallback": "Freelancer",
            "nextActionLabel": "Next action",
            "monitorDelivery": "Monitor delivery",
            "viewProject": "View project",
            "contractsBadge": "Active delivery",
            "activeContracts": "Active contracts",
            "activeContractsDescription": "Contracts currently in progress with assigned freelancers.",
            "viewAllContracts": "View all",
            "noActiveContracts": "No active contracts",
            "noActiveContractsDescription": "Once you accept a proposal and fund the escrow, active contracts will appear here.",
            "untitledContract": "Untitled contract",
            "activeBadge": "Active",
            "pipelineBadge": "Decision support",
            "pipelineSummary": "Hiring summary",
            "awaitingReview": "Awaiting review",
            "inProgressProjects": "In progress",
            "jobsWithProposals": "Jobs with proposals",
            "updatesBadge": "Inbox pulse",
            "notifications": "Notifications",
            "allCaughtUp": "All caught up",
            "allCaughtUpDescription": "When proposal updates, contract changes, or reminders land, they will appear here in a cleaner sequence.",
            "defaultNotificationTitle": "Project update",
            "defaultNotificationBody": "A project event needs your attention.",
            "openNotifications": "Open notifications",
            "playbookBadge": "Client playbook",
            "nextMoves": "Best next moves",
            "reviewPipeline": "Review project pipeline",
            "reviewPipelineDescription": "Compare open briefs, proposal activity, and active delivery in one place.",
            "refineProfile": "Refine client profile",
            "refineProfileDescription": "A clearer company profile helps freelancers trust the brief and respond faster.",
            "projectsLabel": "Projects",
            "activeLabel": "Active",
            "spentLabel": "Spent",
            "activeProjects": "Active Projects",
            "noActiveProjects": "No active projects",
            "viewAll": "View all",
            "postFirstProject": "Post your first project to find talented freelancers",
            "postAProject": "Post a Project",
            "recentProposals": "Recent Proposals",
            "postJobToReceiveProposals": "Post a project to start receiving proposals",
            "reviewBadge": "Review",
            "untitledJob": "Untitled job",
            "acrossActiveContracts": "Across {{count}} active contracts",
            "viewWallet": "View Wallet",
            "needSomethingDone": "Need something done?",
            "postProjectFree": "Post a project free. Get proposals from verified Tunisian talent.",
            "postProjectFreeCta": "Post a project — it's free",
            "thisMonth": "This Month",
            "proposalsCountText": "proposals",
            "status": {
                "cancelled": "Cancelled"
            }
        },
        "freelancer": {
            "defaultName": "Freelancer",
            "contractsLabel": "Contracts",
            "proposalsLabel": "Proposals",
            "earningsLabel": "Earnings",
            "ratingLabel": "Rating",
            "activeContracts": "Active Contracts",
            "viewAll": "View all",
            "noActiveContracts": "No active contracts",
            "submitProposalsToStart": "Submit proposals to start getting contracts",
            "browseJobs": "Browse Jobs",
            "recentProposals": "Recent Proposals",
            "noProposalsYet": "No proposals yet",
            "browseAndSendProposal": "Browse open jobs and send your first proposal",
            "untitledJob": "Untitled job",
            "matchedForYou": "Matched for You",
            "seeAllJobs": "See all jobs",
            "noMatchesYet": "No matches yet",
            "addSkillsToMatch": "Add skills to your profile to get matched jobs",
            "updateProfile": "Update Profile",
            "apply": "Apply",
            "profileStrength": "Profile Strength",
            "thisMonth": "This Month",
            "vsLastMonth": "vs last month",
            "viewWallet": "View Wallet",
            "quickActions": "Quick Actions",
            "checklist": {
                "avatar": "Avatar uploaded",
                "bio": "Bio written",
                "skills": "Skills added",
                "title": "Professional title",
                "identity": "Identity verified",
                "tools": "Tools listed",
                "preferences": "Project preferences"
            },
            "clientFallback": "Client"
        },
        "greeting": {
            "morning": "Good morning",
            "afternoon": "Good afternoon",
            "evening": "Good evening"
        },
        "admin": {
            "overview": "Overview",
            "users": "Users",
            "jobs": "Jobs",
            "payments": "Payments",
            "verification": "Verification",
            "disputes": "Disputes",
            "reports": "Reports",
            "settings": "Settings",
            "totalUsers": "Total users",
            "activeJobs": "Active jobs",
            "activeContracts": "Active contracts",
            "revenue": "Revenue (TND)",
            "todayActivity": "Today activity",
            "loadingUsers": "Loading users...",
            "failedToLoadUsers": "Failed to load users",
            "allUsers": "All users",
            "freelancers": "Freelancers",
            "clients": "Clients",
            "allStatuses": "All statuses",
            "open": "Open",
            "inProgress": "In progress",
            "completed": "Completed",
            "cancelled": "Cancelled",
            "stuckPayments": "Stuck payments (older than 1 hour)",
            "refresh": "Refresh",
            "loading": "Loading...",
            "noStuckPayments": "No stuck payments",
            "allTransactionsSuccess": "All transactions completed successfully",
            "identityVerificationRequests": "Identity verification requests",
            "pending": "pending",
            "noPendingRequests": "No pending requests",
            "allVerificationsProcessed": "All verification requests are processed",
            "frontSide": "Front side",
            "backSide": "Back side",
            "pendingRequests": "Pending requests",
            "noPendingVerifications": "No pending verification requests",
            "pageTitle": "Identity verification requests - Admin dashboard",
            "pageDescription": "Review and manage submitted identity verification requests",
            "adminDashboard": "Admin Dashboard",
            "operationsCenter": "Operations Center",
            "controlCenter": "Control Center",
            "nightModeReady": "Night mode ready",
            "backToSite": "Back to site"
        }
    },
    "job": {
        "title": "Job Title",
        "titlePlaceholder": "Ex: Design a logo for a restaurant",
        "description": "Job Description",
        "descriptionPlaceholder": "Describe the job in detail...",
        "budget": "Budget",
        "budgetHelp": "Enter your total budget",
        "deadline": "Deadline",
        "within1Day": "Within 1 day",
        "within3Days": "Within 3 days",
        "within1Week": "Within 1 week",
        "requiredSkills": "Required Skills",
        "paymentMethod": "Payment Method",
        "bankTransfer": "Bank Transfer",
        "d17": "D17",
        "cash": "Cash on Delivery",
        "postJob": "Post Job",
        "saveDraft": "Save Draft",
        "preview": "Preview",
        "matching": "Finding freelancers...",
        "matchesFound": "3 freelancers found!",
        "estimatedTime": "Within 1 hour"
    },
    "selection": {
        "topMatches": "Top 3 freelancers for your job",
        "matchScore": "Match",
        "completionRate": "Completion rate",
        "responseTimeLabel": "Responds in",
        "hours": "hours",
        "jobsCompleted": "jobs",
        "voiceIntro": "Voice Introduction",
        "noVoice": "No voice intro",
        "workSamples": "Work Samples",
        "noSamples": "No samples",
        "readMore": "Read more",
        "select": "Select",
        "viewFullProfile": "View Full Profile",
        "confirmSelection": "Are you sure?",
        "startWork": "Yes, start working",
        "cancel": "Cancel"
    },
    "contract": {
        "chat": "Chat",
        "details": "Details",
        "sendMessage": "Send a message...",
        "attachFile": "Attach file",
        "send": "Send",
        "jobInfo": "Job Information",
        "daysLeft": "Remaining",
        "days": "days",
        "inProgress": "In Progress",
        "paymentInfo": "Payment Information",
        "awaitingDelivery": "Awaiting delivery",
        "awaitingApproval": "Awaiting approval",
        "deliverWork": "Deliver Work",
        "acceptAndPay": "Accept and Pay",
        "requestChanges": "Request Changes",
        "openDispute": "Open Dispute",
        "disputeOpened": "Dispute Opened",
        "disputeReview": "Review within 48 hours",
        "startConversation": "Start the conversation",
        "typeMessage": "Type your message here...",
        "completed": "Completed",
        "daysRemaining": "{{days}} days remaining",
        "requiredActions": "Required actions",
        "addReview": "Add your review",
        "milestones": "Milestones",
        "finalDelivery": "Final delivery",
        "pending": "Pending",
        "sharedFiles": "Shared files",
        "noSharedFiles": "No shared files yet",
        "workingOnProject": "Working on this project",
        "employer": "Employer",
        "onlineNow": "Online now",
        "workspaceTitle": "Workspace",
        "sendMessageError": "Error sending message",
        "fileUploadError": "Error uploading file",
        "workDelivered": "Work delivered successfully!",
        "deliverError": "Error delivering work",
        "workAccepted": "Work accepted and payment completed!",
        "acceptError": "Error accepting work",
        "requestRevision": "Request revisions",
        "revisionSent": "Revision request sent",
        "error": "An error occurred",
        "disputeError": "Error opening dispute",
        "reviewSent": "Review submitted successfully"
    },
    "jobMatches": {
        "searchError": "Error searching for matches",
        "contractCreated": "Contract started successfully!",
        "contractError": "Error creating contract"
    },
    "profile": {
        "fullName": "Full name",
        "fullNamePlaceholder": "Enter your full name",
        "companyName": "Company name",
        "companyNamePlaceholder": "Enter your company name",
        "bio": "Professional title",
        "bioPlaceholder": "Tell clients what you do best",
        "location": "Location",
        "selectLocation": "Select your governorate",
        "skills": "Skills",
        "optional": "Optional",
        "voiceIntro": "Voice introduction",
        "recordVoice": "Record voice intro",
        "stopRecording": "Stop recording",
        "workSamples": "Work samples",
        "dragDrop": "Drag files here or upload from your device",
        "browse": "Browse files",
        "languages": {
            "title": "Languages",
            "add": "Add language",
            "select": "Select a language",
            "levels": {
                "native": "Native",
                "fluent": "Fluent",
                "conversational": "Conversational",
                "basic": "Basic"
            }
        },
        "education": {
            "title": "Education",
            "add": "Add education",
            "noEducation": "No education added yet",
            "institution": "Institution",
            "degree": "Degree",
            "field": "Field of study",
            "startYear": "Start year",
            "endYear": "End year"
        }
    },
    "publicProfile": {
        "available": "Available",
        "busy": "Busy",
        "offline": "Offline",
        "memberSince": "Member since",
        "months": "months",
        "earned": "Earned",
        "skills": "Skills",
        "showMore": "Show more",
        "about": "About",
        "noBio": "No bio yet",
        "voiceIntro": "Voice Introduction",
        "workSamples": "Work Samples",
        "noSamples": "No samples yet",
        "reviews": "Reviews",
        "noReviews": "No reviews yet",
        "sendMessage": "Send Message",
        "editProfile": "Edit Profile"
    },
    "settings": {
        "profile": "Profile",
        "account": "Account",
        "notifications": "Notifications",
        "payment": "Payment",
        "privacy": "Privacy",
        "tabDescriptions": {
            "account": "Workspace mode, account overview, and setup guidance.",
            "profile": "Identity, bio, avatar, and workspace readiness.",
            "notifications": "Choose what reaches you and how often.",
            "payment": "Payout methods, defaults, and transaction-ready details.",
            "security": "Session control, account safety, and destructive actions."
        },
        "pageTitle": "Settings",
        "heroDescription": "Keep account details, security, payouts, and notification behavior in one consistent control surface. Update what matters without losing your place in the product.",
        "accountOverview": "Account overview",
        "profileCompletion": "Profile completion",
        "logout": "Sign out",
        "notificationsSubtitle": "Choose which notifications you want to receive",
        "paymentSubtitle": "Payment and payout methods",
        "paymentMethodsCount": "Saved methods",
        "readyForTransactions": "Ready for transactions",
        "noPaymentMethodsDescription": "Add a payout method now so contracts, earnings, and withdrawals are ready when you need them. Secure and encrypted.",
        "addMethod": "Add method",
        "default": "Default",
        "setDefault": "Set as default",
        "noPaymentMethods": "No payment method added yet",
        "saveChanges": "Save changes",
        "bioLabel": "Bio",
        "bioPlaceholder": "Write a short bio about yourself...",
        "changePasswordTitle": "Change password",
        "securityPosture": "Security posture",
        "securityPostureValue": "Protected by account session controls",
        "passwordStatus": "Password status",
        "passwordSet": "Password is set",
        "noPasswordOAuth": "Signed in via {{provider}} — no password needed",
        "noPasswordMessage": "No password set - you are using phone sign in",
        "addPassword": "Add password",
        "activeSessionsTitle": "Active sessions",
        "activeSessionsMessage": "This device is your only active session",
        "signOutAllDevices": "Sign out from all devices",
        "deleteAccountTitle": "Delete account",
        "deleteAccountDescription": "Your account and all data will be permanently deleted. This action cannot be undone.",
        "deleteMyAccount": "Delete my account",
        "deleteAccountConfirmTitle": "Confirm account deletion",
        "deleteAccountConfirmMessage": "Are you sure you want to delete your account? All your data will be permanently removed.",
        "deleteAccountConfirmAction": "Yes, delete my account",
        "addPaymentMethodModalTitle": "Add payment method",
        "paymentMethodType": "Payment method type",
        "paymentDetails": "Payment details",
        "bankTransfer": "Bank transfer",
        "bankAccountNumber": "Bank account number",
        "phoneNumber": "Phone number",
        "add": "Add",
        "accountType": "Account type",
        "accountTypeFreelancer": "Freelancer",
        "accountTypeFreelancerDesc": "Offer my services",
        "accountTypeClient": "Client",
        "accountTypeClientDesc": "Hire freelancers",
        "accountTypeBoth": "Both",
        "accountTypeBothDesc": "Use both modes",
        "accountTypeUnknown": "Not set",
        "userFallback": "User",
        "currentWorkspace": "Current workspace",
        "onboardingStatus": "Onboarding",
        "activeContext": "Active context",
        "globalPermission": "Global permission",
        "profileReadiness": "Profile readiness",
        "accountOverviewTitle": "Your workspace identity and setup status",
        "accountOverviewDescription": "This tab is the control point for how your account is set up. Switch to Profile when you want to edit details or change workspace readiness.",
        "setupStatus": {
            "profileBasics": "Profile basics",
            "identityVerification": "Identity verification",
            "workspaceSetup": "Workspace setup",
            "complete": "Complete",
            "pending": "Pending",
            "done": "Done",
            "allDone": "All required setup steps are complete."
        },
        "identityVerified": "Identity verified",
        "identityPending": "Under review",
        "verifyIdentity": "Verify your identity",
        "profileComplete": "Profile complete",
        "completeProfile": "Complete your profile",
        "profileCompletionTitle": "Profile completion",
        "requiredLabel": "Required:",
        "moreRequired": "+{{count}} more",
        "completion": {
            "fullName": "Name",
            "avatar": "Profile photo",
            "location": "Location",
            "bio": "Bio",
            "accountType": "Account type",
            "identityVerification": "Identity verification",
            "onboarding": "Onboarding"
        },
        "fullName": "Full name",
        "phoneNumberLabel": "Phone number",
        "emailOptionalLabel": "Email (optional)",
        "location": "Location",
        "notificationsEnabled": "Active rules",
        "notificationsTotal": "Delivery speed",
        "notificationChannel": "Channels",
        "emailPlaceholder": "email@example.com",
        "toasts": {
            "profileSaved": "Profile updated successfully",
            "profileSaveError": "Failed to save profile changes",
            "defaultPaymentUpdated": "Default payment method updated",
            "genericError": "Something went wrong",
            "paymentDeleted": "Payment method deleted",
            "paymentDeleteError": "Failed to delete payment method",
            "paymentAdded": "Payment method added",
            "paymentAddError": "Failed to add payment method",
            "deleteRequestSent": "Your account deletion request was sent. It will be processed within 48 hours.",
            "avatarUpdated": "Profile image updated",
            "avatarUpdateError": "Failed to upload profile image",
            "workspaceBothEnabled": "Both workspaces are now enabled on your account.",
            "workspaceUpdated": "Workspace updated successfully."
        },
        "language": "Language",
        "save": "Save",
        "saved": "Saved",
        "changePassword": "Change Password",
        "currentPassword": "Current Password",
        "newPassword": "New Password",
        "confirmPassword": "Confirm Password",
        "cinVerification": "ID Verification",
        "uploadCin": "Upload ID",
        "pending": "Pending",
        "verified": "Verified",
        "deleteAccount": "Delete Account",
        "deleteWarning": "This action cannot be undone",
        "notificationSettings": {
            "newMatches": "New job matches",
            "newMessages": "New messages",
            "payments": "Payments",
            "contractUpdates": "Contract updates",
            "platformNews": "Platform news"
        },
        "deliveryMethod": {
            "email": "Email",
            "sms": "SMS",
            "inApp": "In-app only"
        },
        "paymentMethods": "Payment Methods",
        "addPaymentMethod": "Add payment method",
        "preferredMethod": "Preferred method",
        "privacySettings": {
            "profileVisibility": "Profile visibility",
            "public": "Public",
            "hidden": "Hidden",
            "whoCanMessage": "Who can message you",
            "anyone": "Anyone",
            "activeContracts": "Active contracts only",
            "showEarnings": "Show earnings to everyone"
        }
    },
    "contracts": {
        "title": "Contracts",
        "activeCount": "{{count}} Active",
        "tabs": {
            "all": "All",
            "active": "Active",
            "completed": "Completed",
            "disputed": "Disputed"
        },
        "status": {
            "active": "Active",
            "completed": "Completed",
            "disputed": "Disputed"
        },
        "role": {
            "client": "Client",
            "freelancer": "Freelancer"
        },
        "empty": {
            "title": "No contracts yet",
            "freelancerDescription": "Send proposals to get your first contract.",
            "clientDescription": "Hire a freelancer to create your first contract.",
            "freelancerCta": "Browse jobs",
            "clientCta": "Post a project"
        },
        "unknownProject": "Unknown Project",
        "unknownUser": "Unknown User",
        "startedOn": "Started {{date}}",
        "milestonesProgress": "1 of 3 milestones complete",
        "openWorkspace": "Open workspace ->"
    },
    "common": {
        "loading": "Loading...",
        "loadingContent": "Loading content",
        "error": "An error occurred",
        "retry": "Retry",
        "next": "Next",
        "back": "Back",
        "submit": "Submit",
        "confirm": "Confirm",
        "cancel": "Cancel",
        "close": "Close",
        "search": "Search",
        "filter": "Filter",
        "sort": "Sort",
        "report": "Report",
        "reportSubmitted": "Report submitted. Our team will review it shortly.",
        "reportError": "Failed to submit report",
        "reportTitle": "Report this content",
        "reportContent": "Report content",
        "reportDescribePlaceholder": "Please describe the issue...",
        "reportSubmitButton": "Submit report",
        "reload": "Reload",
        "errors": {
            "unexpected": "An unexpected error occurred"
        },
        "navigate": "Navigate",
        "select": "Select",
        "dinar": "dinars",
        "tnd": "TND",
        "time": {
            "now": "Just now",
            "minute": "min",
            "hour": "h",
            "day": "d",
            "ago_prefix": "",
            "ago": "ago"
        },
        "today": "Today",
        "toggleDarkMode": "Toggle dark mode",
        "toggleLightMode": "Toggle light mode",
        "openMenu": "Open menu",
        "closeMenu": "Close menu",
        "refresh": "Refresh",
        "save": "Save",
        "unsave": "Unsave",
        "returnHome": "Return home",
        "contactSupport": "Contact support",
        "verified": "Verified",
        "availableForWork": "Available for work",
        "replyToReview": "Reply to review",
        "from": "From",
        "to": "To",
        "optional": "Optional",
        "attachments": "Attachments",
        "removeImage": "Remove image",
        "invalidFileType": "Please select a JPG, PNG or WebP image",
        "fileTooLarge": "Image size should be less than 5MB",
        "uploadFailed": "Upload failed, you can add it later",
        "skipForNow": "You can skip this step and upload later",
        "writeReply": "Write your reply here...",
        "shareExperience": "Share your experience with this person...",
        "projectTitle": "Project Title",
        "projectTitlePlaceholder": "Ex: Logo design for a food company",
        "projectDescription": "Project Description",
        "projectDescriptionPlaceholder": "Describe project details, expected deliverables, and any special requirements...",
        "bankName": "Bank Name",
        "bankNamePlaceholder": "Ex: Banque Nationale Agricole",
        "accountHolder": "Account Holder Name",
        "accountHolderPlaceholder": "Name as it appears on the bank account",
        "searchPlaceholder": "Search...",
        "emailPlaceholder": "Your email address",
        "identityVerified": "Identity verified",
        "saveFreelancer": "Save freelancer",
        "unsaveFreelancer": "Unsave freelancer",
        "typeMessage": "Type your message here...",
        "messageSubject": "Message Subject",
        "messageSubjectPlaceholder": "Ex: Inquiry regarding a design project...",
        "messageContent": "Message Content",
        "messageContentPlaceholder": "Write your message details here...",
        "proposalPlaceholder": "Explain why you are the right person for this project...",
        "reviewPlaceholder": "What did you like? What could be improved? Would you recommend them?",
        "visibilityNote": "If you need rare skills or have a sensitive project, \"Invite only\" gives you more control. For public projects, \"Public\" ensures better price competitiveness.",
        "skillsUsed": "Skills used",
        "skillsUsedPlaceholder": "Ex: Photoshop, React, UI Design (separated by commas)",
        "thumbnailUrl": "Thumbnail image URL",
        "projectUrl": "Project URL",
        "completionDate": "Completion date",
        "searchProposals": "Search in proposals...",
        "hourlyExample": "Ex: 20",
        "hoursExample": "Ex: 10-20",
        "scrollToTop": "Scroll to top",
        "fileUpload": {
            "dropzoneHint": "Drag files here or click to browse",
            "chooseFiles": "Choose files",
            "fileTooLarge": "{{name}} is larger than {{size}}MB",
            "unsupportedType": "{{name}} has an unsupported file type",
            "maxFilesExceeded": "Maximum {{count}} files allowed",
            "removeFileAria": "Remove {{name}}"
        }
    },
    "accountStatus": {
        "suspended": {
            "title": "Account suspended",
            "body": "Your account access is temporarily suspended. Contact support if you need help or think this is a mistake."
        },
        "archived": {
            "title": "Account archived",
            "body": "This account is archived and can no longer access protected platform features. Contact support for assistance."
        }
    },
    "payment": {
        "completeTitle": "Complete Payment",
        "payVia": "Pay via",
        "chooseMethod": "Choose payment method",
        "d17Desc": "Fastest way to pay in Tunisia",
        "scanD17": "Scan with D17 app",
        "amount": "Amount",
        "recipient": "Recipient",
        "to": "To",
        "orEnterPhone": "Or enter your phone number",
        "d17PhoneLabel": "D17 phone number",
        "d17PhonePlaceholder": "+216 00 000 000",
        "flouciTitle": "Flouci",
        "flouciDesc": "Your secure digital wallet",
        "flouciRedirect": "Redirection to Flouci for secure payment",
        "openFlouci": "Open Flouci app",
        "secureTransaction": "100% secure and encrypted transaction",
        "creditCard": "Credit Card",
        "cardSchemes": "Visa / Mastercard / CIB",
        "cardNumber": "Card Number",
        "cardNumberPlaceholder": "0000 0000 0000 0000",
        "expiryDate": "Expiry Date",
        "expiryDatePlaceholder": "MM/YY",
        "cvc": "CVC",
        "cvcPlaceholder": "123",
        "cardHolder": "Card Holder Name",
        "processing": "Processing payment...",
        "processingDesc": "Please wait, do not close this window",
        "success": "Payment successful!",
        "transferred": "Amount transferred",
        "transactionId": "Transaction ID",
        "totalToPay": "Total to pay",
        "payNow": "Pay now",
        "flouciDescription": "Ã˜Â§Ã™â€žÃ˜Â¯Ã™ÂÃ˜Â¹ Ã˜Â¹Ã˜Â¨Ã˜Â± Flouci - Ã˜Â¨Ã˜Â·Ã˜Â§Ã™â€šÃ˜Â§Ã˜Âª Ã˜Â¨Ã™â€ Ã™Æ’Ã™Å Ã˜Â© Ã™Ë†Ã™â€¦Ã˜Â­Ã˜Â§Ã™ÂÃ˜Â¸ Ã˜Â¥Ã™â€žÃ™Æ’Ã˜ÂªÃ˜Â±Ã™Ë†Ã™â€ Ã™Å Ã˜Â©"
    },
    "notifications": {
        "title": "Notifications",
        "time": {
            "justNow": "Just now",
            "minutesAgo": "{{count}}m ago",
            "hoursAgo": "{{count}}h ago",
            "daysAgo": "{{count}}d ago"
        },
        "readAll": "Mark all as read",
        "empty": "No notifications",
        "caughtUp": "You're all caught up",
        "emptyDesc": "We will notify you when something important happens with your projects or payments",
        "viewAll": "View all notifications",
        "delete": "Delete notification",
        "identity": {
            "rejected": {
                "title": "Identity verification request rejected",
                "body": "Your identity verification request was rejected. Please make sure the images are clear and submit again."
            }
        }
    },
    "globalSearch": {
        "placeholder": "Search jobs, freelancers, skills...",
        "recent": "Recent searches",
        "suggestions": "Suggestions",
        "searching": "Searching...",
        "jobs": "Jobs",
        "freelancers": "Freelancers",
        "noResultsFor": "No results found for \"{{query}}\"",
        "clearSearch": "Clear search",
        "toSelect": "to select",
        "toNavigate": "to navigate"
    },
    "pages": {
        "clientJobs": {
            "title": "My Projects",
            "subtitle": "Manage your posted projects and proposals",
            "postProject": "Post a project",
            "active": "Active",
            "proposalsReceived": "Total proposals received",
            "completed": "Completed",
            "all": "All",
            "inReview": "In review",
            "loading": "Loading projects...",
            "emptyTitle": "No projects yet",
            "emptyDescription": "Post your first project and receive proposals from verified professionals.",
            "postFree": "Post a project - it's free",
            "viewProposals": "View proposals",
            "edit": "Edit",
            "fixedPrice": "Fixed Price",
            "hourlyRate": "Hourly Rate",
            "proposalsCount": "{{count}} proposals",
            "postedAgo": "Posted {{time}}",
            "today": "Today",
            "oneDayAgo": "1 day ago",
            "daysAgo": "{{days}} days ago",
            "status": {
                "open": "Open",
                "inProgress": "In Progress",
                "inReview": "In Review",
                "completed": "Completed"
            }
        },
        "myProposals": {
            "title": "My Proposals",
            "subtitle": "Track every proposal you've sent",
            "sent": "Sent",
            "accepted": "Accepted",
            "pending": "Pending",
            "rejected": "Rejected",
            "all": "All",
            "loading": "Loading proposals...",
            "emptyTitle": "No proposals yet",
            "emptyDescription": "Browse open projects and send your first proposal.",
            "browseJobs": "Browse jobs",
            "unknownProject": "Unknown Project",
            "yourBid": "Your bid: {{amount}} TND",
            "deliveryDays": "{{days}} days delivery",
            "submittedAgo": "Submitted {{time}}",
            "today": "Today",
            "oneDayAgo": "1 day ago",
            "daysAgo": "{{days}} days ago",
            "viewContract": "View contract"
        },
        "freelancerEarnings": {
            "seoTitle": "Earnings | WorkedIn",
            "seoDescription": "Your earnings and payment history on WorkedIn.",
            "availableBalance": "Available balance",
            "pendingClearance": "{{amount}} TND pending clearance",
            "withdraw": "Withdraw",
            "totalEarned": "Total earned",
            "thisMonth": "This month",
            "completedContracts": "Completed contracts",
            "earningsOverview": "Earnings overview",
            "paymentHistory": "Payment history",
            "noEarningsTitle": "No earnings yet",
            "noEarningsDescription": "Complete your first project to see earnings here.",
            "browseJobs": "Browse jobs",
            "contractPayment": "Contract payment",
            "clientId": "Client #{{id}}",
            "notAvailable": "N/A"
        },
        "authCallback": {
            "signingIn": "Signing you in",
            "signingInDescription": "We are finishing your secure login. This should only take a moment.",
            "loginIncomplete": "Login did not complete",
            "loginIncompleteDescription": "We could not confirm your session yet. Try again, or return to login and retry the provider sign-in.",
            "errorCode": "Error code: {{code}}",
            "tryAgain": "Try again",
            "backToLogin": "Back to login"
        },
        "freelancerCard": {
            "tndPerHour": "TND/hr",
            "successRate": "{{rate}}% success rate",
            "verifiedProfile": "Verified profile",
            "snippet": "Professional, responsive, and much more polished than typical marketplace profiles.",
            "hourlyRate": "Hourly rate",
            "successScore": "Success score",
            "completedJobs": "{{count}} completed",
            "repliesIn": "Replies in {{time}}",
            "viewProfile": "View profile",
            "badges": {
                "verified": "Verified",
                "verifiedTitle": "Identity and payment details reviewed.",
                "topRated": "Top Rated",
                "topRatedTitle": "Consistently excellent client feedback.",
                "fastResponder": "Fast Responder",
                "fastResponderTitle": "Usually replies quickly to new clients.",
                "newTalent": "New Talent",
                "newTalentTitle": "Fresh profile with early momentum."
            }
        },
        "errorBoundary": {
            "title": "Something went wrong",
            "description": "An unexpected error interrupted this page. Refresh and try again, or head back to the homepage.",
            "refresh": "Refresh page",
            "backHome": "Back to home"
        },
        "freelancerDashboard": {
            "greetingFallback": "there",
            "welcomeBack": "Welcome back",
            "welcomeDescription": "Your freelancer business is looking sharper. Keep the momentum high and the profile polished.",
            "quickActions": "Quick actions",
            "browseJobs": "Browse jobs",
            "profileSettings": "Profile settings",
            "earningsTrajectory": "Earnings trajectory",
            "earningsDescription": "Last 6 months of released escrow payments.",
            "sixMonthTrend": "6 month trend",
            "noEarningsData": "No earnings data yet",
            "earnings": "Earnings",
            "recentActivity": "Recent activity",
            "recentActivityDescription": "Your latest notifications and updates.",
            "noRecentActivity": "No recent activity",
            "upcomingMilestones": "Upcoming milestones",
            "noUpcomingMilestones": "No upcoming milestones",
            "noDueDate": "No due date",
            "allCaughtUp": "All caught up!",
            "stat": {
                "activeContracts": "Active Contracts",
                "pendingProposals": "Pending Proposals",
                "totalEarnings": "Total Earnings",
                "profileViews": "Profile Views"
            }
        },
        "messages": {
            "title": "Messages",
            "searchPlaceholder": "Search conversations...",
            "noMessagesYet": "No messages yet",
            "emptyThread": "No messages yet. Start the conversation!",
            "messagePlaceholder": "Write your message...",
            "selectConversationTitle": "Select a conversation",
            "selectConversationDescription": "Choose a conversation from the list to start messaging",
            "selectConversationDetails": "Select a conversation to view details",
            "profileAction": "Profile",
            "contractsAction": "Contracts",
            "archiveConversation": "Archive conversation",
            "deleteConversation": "Delete conversation",
            "attachFile": "Attach file",
            "stopRecording": "Stop recording",
            "recordVoice": "Record voice message",
            "recording": "Recording...",
            "voiceMemo": "Voice memo",
            "userFallback": "user",
            "loadingConversations": "Loading conversations...",
            "loadingMessages": "Loading messages...",
            "typingIndicator": {
                "singular": "is typing...",
                "plural": "people are typing..."
            },
            "filters": {
                "all": "All",
                "unread": "Unread"
            },
            "empty": {
                "noMatchingTitle": "No matching conversations",
                "noMatchingDescription": "Try a different name or clear your search.",
                "noConversationsTitle": "No conversations yet",
                "noConversationsDescription": "Start by sending a proposal or contacting a freelancer."
            },
            "errors": {
                "audioUpload": "Failed to upload audio",
                "fileUpload": "Failed to upload file",
                "fileTooLarge": "File size must be less than 10 MB"
            },
            "time": {
                "now": "Now",
                "minutesAgo": "{{count}} min ago",
                "hoursAgo": "{{count}} h ago",
                "daysAgo": "{{count}} d ago"
            }
        },
        "freelancerProfile": {
            "portfolio": {
                "skillsUsed": "Skills Used",
                "visitProject": "Visit Project"
            },
            "contactModal": {
                "sectionLabel": "Direct message",
                "title": "Message {{name}}",
                "body": "A direct conversation with {{name}} will open in your messages workspace.",
                "trustNote": "Use WorkedIn messages to keep project communication organized.",
                "loginRequired": "You need to sign in to send a message",
                "loginPrompt": "You need to sign in before contacting freelancers.",
                "cannotMessageSelf": "You cannot message yourself",
                "createFailed": "Failed to create conversation",
                "startError": "Something went wrong while starting the conversation",
                "opening": "Opening...",
                "startAction": "Start conversation"
            }
        },
        "searchModal": {
            "placeholderFreelancer": "Search jobs, skills...",
            "placeholderClient": "Search freelancers, skills...",
            "trendingNow": "Trending now",
            "resultsCount": "{{count}} results",
            "goTo": "Go to",
            "tryDifferent": "Try a different search term",
            "globalTitle": "Global search",
            "workspaceFreelancer": "Freelancer workspace",
            "workspaceClient": "Client workspace",
            "headerHint": "Jump to pages, search live jobs, and open common actions faster.",
            "quickActions": "Quick actions",
            "openAction": "Open",
            "recentSection": "Recent jumps",
            "searchEverything": "Search everything for \"{{query}}\"",
            "searchEverythingMeta": "Open the full search page with all matching results",
            "sectionBestMatch": "Best match",
            "sectionJobs": "Jobs",
            "sectionActions": "Actions",
            "sectionGeneral": "Results",
            "enterHint": "Press Enter to view all results for \"{{query}}\"",
            "shortcuts": {
                "browseAllJobs": "Browse all jobs",
                "myProposals": "My proposals",
                "myEarnings": "My earnings",
                "settings": "Settings",
                "postProject": "Post a project",
                "myProjects": "My projects",
                "findFreelancers": "Find freelancers",
                "contracts": "Contracts",
                "browseJobs": "Browse jobs",
                "howItWorks": "How it works",
                "createAccount": "Create account"
            }
        },
        "mobileNav": {
            "more": "More",
            "help": "Help",
            "workspaceFreelancer": "Freelancer workspace",
            "workspaceClient": "Client workspace",
            "freelancer": "Freelancer",
            "client": "Client",
            "userFallback": "User",
            "searchPlaceholder": "Search...",
            "brandName": "WorkedIn"
        },
        "login": {
            "finishingSignIn": "Securing session...",
            "finishingSignInDescription": "Hang tight while we prepare your workspace."
        }
    },
    "search": {
        "placeholder": "Search...",
        "trending": "Trending",
        "recent": "Recent searches",
        "clearAll": "Clear all",
        "jobs": "Jobs",
        "freelancers": "Freelancers",
        "skills": "Skills",
        "resultsFor": "Results for",
        "noResults": "No results found",
        "noResultsDesc": "We could not find anything matching your search",
        "suggestions": {
            "mobileApp": "Mobile app",
            "logo": "Logo",
            "seo": "SEO",
            "logoDesign": "Logo design",
            "reactJs": "React JS",
            "translation": "Translation",
            "videoEditing": "Video editing",
            "python": "Python"
        }
    },
    "onboarding": {
        "currentStep": "Current step",
        "client": {
            "welcome": "Welcome",
            "welcomeDesc": "Finalize your client profile to post projects with confidence.",
            "profileTitle": "Client Profile",
            "profileDesc": "The basic info freelancers will see first.",
            "timeoutError": "The request took too long. Please try again."
        },
        "freelancer": {
            "welcome": "Welcome",
            "welcomeDesc": "Complete your freelancer profile and start receiving real opportunities.",
            "maxSkills": "Max 5 skills",
            "noAuthSession": "No auth session - please login again",
            "basicInfoSaved": "Basic info saved",
            "serverConnectionFailed": "Failed to connect to server. Check your internet connection and try again.",
            "selectAtLeastOneSkill": "Please select at least one skill",
            "connectionFailed": "Connection failed. Check your internet connection and try again.",
            "skillsSaveFailed": "Failed to save skills",
            "completionFailed": "Failed to complete onboarding. Please try again.",
            "welcomeToast": "Welcome to WorkedIn!",
            "stepCounter": "Step {{step}} of {{total}}",
            "stepBasicInfo": "Basic information",
            "stepSkillsExperience": "Skills and experience",
            "completeLaterHint": "You can add certificates, portfolio, and additional profile details later from Settings.",
            "steps": {
                "skills": "Skills",
                "bio": "Bio",
                "experience": "Experience",
                "portfolio": "Portfolio"
            },
            "uploadAvatar": "Profile Picture",
            "uploadAvatarDesc": "A professional photo is recommended"
        }
    },
    "verifyIdentity": {
        "preview": "Preview",
        "changeImage": "Change",
        "removeImage": "Remove",
        "uploadHint": "Click to upload image",
        "dragDropHint": "or drag and drop here",
        "fileFormatHint": "JPG, PNG (Max 5MB)",
        "processing": "Processing...",
        "stepCounter": "Step {{current}} of {{total}}",
        "tipLabel": "Tip:",
        "backToSettings": "Back to settings",
        "goToDashboard": "Go to dashboard",
        "loginAgainError": "Please log in again",
        "seo": {
            "title": "Identity Verification",
            "description": "Verify your identity to increase client trust and unlock all platform features"
        },
        "header": {
            "kicker": "Secure Account Upgrade",
            "title": "Identity verification",
            "subtitle": "One step away from boosting client trust and protecting your account",
            "eta": "Takes about 2-3 minutes to complete"
        },
        "security": {
            "title": "Encrypted storage",
            "desc": "Your documents are encrypted and only used for account verification.",
            "qualityTitle": "Smart quality checks",
            "qualityDesc": "We validate file format, size, and basic image quality before upload.",
            "reviewTitle": "Fast review",
            "reviewDesc": "Most verification requests are reviewed within 24 hours."
        },
        "steps": {
            "front": {
                "title": "ID card front side",
                "description": "Please upload a clear image of the front side of your national ID card"
            },
            "back": {
                "title": "ID card back side",
                "description": "Please upload a clear image of the back side of your national ID card"
            },
            "selfie": {
                "title": "Selfie photo",
                "description": "Please take a clear selfie photo to verify your identity"
            }
        },
        "tips": {
            "front": "Place the ID on a dark background and avoid flash reflections.",
            "back": "Make sure all edges and numbers are visible and in focus.",
            "selfie": "Face the camera in good light and avoid hats or sunglasses."
        },
        "verified": {
            "title": "Your identity has been verified successfully",
            "description": "Your account is now verified and you received the blue verification badge. You can now enjoy all platform features."
        },
        "pending": {
            "seoTitle": "Verification request under review",
            "seoDescription": "Your identity verification request is under review by our team",
            "badge": "Under review",
            "title": "Your request is under review",
            "description": "Your identity verification request has been received successfully. Our team is reviewing your documents.",
            "reviewTime": "Review time: up to 24 hours",
            "emailNotice": "You will be notified once the review is complete"
        },
        "submitted": {
            "seoTitle": "Request submitted",
            "seoDescription": "Your identity verification request has been received",
            "title": "Your request has been received successfully",
            "description": "Our team will review your documents and respond as soon as possible (usually within 24 hours). We will notify you by email when the review is complete."
        },
        "review": {
            "title": "Review details",
            "readiness": "Readiness score",
            "cinLabel": "ID number (8 digits)",
            "cinPlaceholder": "12345678",
            "frontImage": "Front side",
            "backImage": "Back side",
            "selfieImage": "Selfie",
            "checkFront": "Front image added",
            "checkBack": "Back image added",
            "checkSelfie": "Selfie added",
            "checkCin": "CIN number valid",
            "checkConsent": "Privacy consent accepted",
            "editFront": "Edit front image",
            "editBack": "Edit back image",
            "editSelfie": "Edit selfie",
            "privacyNotice": "Your data is stored securely and encrypted. Your identity information will not be shared with any third party and is used only for account verification.",
            "consentPrefix": "I agree to the use of my personal information to verify my identity according to the ",
            "privacyPolicy": "Privacy Policy",
            "submitting": "Submitting...",
            "submit": "Confirm and submit"
        },
        "success": {
            "submitted": "Verification request submitted successfully"
        },
        "errors": {
            "fileTooLarge": "File is too large (maximum 5MB)",
            "invalidImage": "Please upload a valid image",
            "lowResolution": "Image resolution is too low. Use a clearer photo.",
            "fileReadFailed": "Failed to read this file. Please try another image.",
            "invalidCin": "ID number must contain 8 digits",
            "missingImages": "Please upload all required images",
            "noSession": "No auth session - please login again",
            "insertTimeout": "Database insert timed out after 30 seconds. Supabase may be under maintenance.",
            "alreadySubmitted": "You already have a verification request.",
            "permissions": "Permission denied. Please sign out and sign in again.",
            "unexpected": "An unexpected error occurred",
            "withMessage": "Error: {{message}}"
        },
        "progress": {
            "front": "Front side",
            "back": "Back side",
            "selfie": "Selfie",
            "review": "Review"
        }
    },
    "legalPages": {
        "privacy": {
            "title": "Privacy Policy",
            "lastUpdated": "Last updated: January 2026",
            "sections": {
                "dataCollection": {
                    "title": "1. Data We Collect",
                    "intro": "We collect the following information when you use the platform:",
                    "items": {
                        "account": "Account information: name, email, phone number",
                        "profile": "Profile information: skills, experience, images",
                        "usage": "Usage data: visited pages, time spent",
                        "payment": "Payment information: bank account details (encrypted)"
                    }
                },
                "usage": {
                    "title": "2. How We Use Your Data",
                    "items": {
                        "improve": "Provide and improve our services",
                        "transactions": "Process financial transactions",
                        "notifications": "Send important notifications",
                        "security": "Prevent fraud and protect security",
                        "experience": "Improve user experience"
                    }
                },
                "sharing": {
                    "title": "3. Data Sharing",
                    "intro": "We do not sell your personal data. We may share it with:",
                    "items": {
                        "paymentProviders": "Payment service providers (to process transactions)",
                        "legalAuthorities": "Legal authorities (upon official request)",
                        "publicProfile": "Other users (public profile information)"
                    }
                },
                "protection": {
                    "title": "4. Data Protection",
                    "intro": "We use advanced security measures to protect your data:",
                    "items": {
                        "ssl": "SSL/TLS encryption for all communications",
                        "database": "Encryption of sensitive database data",
                        "audits": "Regular security reviews"
                    }
                },
                "rights": {
                    "title": "5. Your Rights",
                    "items": {
                        "access": "Access your personal data",
                        "correction": "Correct inaccurate data",
                        "deletion": "Delete your account and data",
                        "export": "Export your data"
                    }
                },
                "cookies": {
                    "title": "6. Cookies",
                    "text": "We use cookies to improve your experience. You can manage these settings in your browser."
                },
                "contact": {
                    "title": "7. Contact",
                    "intro": "For privacy-related inquiries:",
                    "emailLabel": "Email:"
                }
            }
        },
        "terms": {
            "title": "Terms of Service",
            "lastUpdated": "Last updated: January 2026",
            "sections": {
                "intro": {
                    "title": "1. Introduction",
                    "text": "Welcome to WorkedIn.tn, Tunisia's leading freelance platform. By using this platform, you agree to comply with these terms and conditions."
                },
                "registration": {
                    "title": "2. Registration and Accounts",
                    "items": {
                        "age": "You must be at least 18 years old to register",
                        "accuracy": "Provided information must be accurate and up to date",
                        "security": "You are responsible for keeping your account secure",
                        "report": "You must notify us immediately of any unauthorized use"
                    }
                },
                "platformUse": {
                    "title": "3. Platform Use",
                    "intro": "Using the platform for the following is prohibited:",
                    "items": {
                        "illegal": "Any illegal activity",
                        "impersonation": "Impersonating others",
                        "abusive": "Posting abusive or harmful content",
                        "paymentBypass": "Bypassing payment mechanisms",
                        "dataHarvesting": "Collecting user data without authorization"
                    }
                },
                "contractsPayments": {
                    "title": "4. Contracts and Payments",
                    "intro": "WorkedIn.tn acts as an intermediary between freelancers and clients. We are not a party to the contracts between them.",
                    "items": {
                        "fee": "Platform fee: 10% of each contract value",
                        "secureMethods": "Payments are processed via secure approved methods",
                        "holdPeriod": "Payment hold period: 7 days"
                    }
                },
                "disputes": {
                    "title": "5. Dispute Resolution",
                    "text": "In case of dispute, we provide an arbitration mechanism. Support team decisions are final and binding."
                },
                "contact": {
                    "title": "6. Contact",
                    "intro": "To contact us about these terms:",
                    "emailLabel": "Email:"
                }
            }
        }
    },
    "footer": {
        "about": "About",
        "faq": "FAQ",
        "terms": "Terms",
        "privacy": "Privacy",
        "contact": "Contact",
        "quickLinks": "Quick Links",
        "legal": "Legal",
        "description": "Built for Tunisian professionals, with verified identities, escrow-protected payments, and projects paid in TND.",
        "city": "Tunis, Tunisia",
        "newsletterTitle": "Product updates",
        "newsletterDescription": "Get product notes, launch updates, and important trust-and-payment changes from WorkedIn.",
        "newsletterPlaceholder": "Your e-mail address",
        "newsletterAction": "Subscribe",
        "madeInTunisia": "Built in Tunisia.",
        "copyright": "(c) 2026 WorkedIn.tn - All rights reserved",
        "socialFacebook": "Facebook",
        "socialTwitter": "Twitter",
        "socialInstagram": "Instagram",
        "socialLinkedin": "LinkedIn"
    },
    "findFreelancers": {
        "searchPlaceholder": "Search for freelancers...",
        "availableNow": "Available now",
        "availableNowDesc": "Available to start immediately",
        "category": "Category",
        "skills": "Skills",
        "hourlyRate": "Hourly rate (TND)",
        "clearFilters": "Clear all filters",
        "verifiedOnly": "Verified identity only",
        "verifiedOnlyDesc": "Top rated (4.5+)",
        "hero": {
            "badge": "Verified Tunisian professionals",
            "title": "Find the right person,",
            "titleHighlight": "not just any person.",
            "subtitle": "2,500+ Tunisian developers, designers, translators and consultants — verified, rated, and ready to work.",
            "subtitleDesktop": ""
        },
        "heroStats": {
            "talentPool": "Verified profiles",
            "verified": "Identity checked",
            "fastReplies": "Average rating"
        },
        "filterToggle": "Filter results",
        "filterTitle": "Filter results",
        "clearAll": "Clear all",
        "resultsCount": "Showing {{count}} results",
        "activeFilters": "Active",
        "sort": {
            "label": "Sort by:",
            "recommended": "Recommended",
            "rating": "Highest rated",
            "priceLow": "Lowest price"
        },
        "resultStats": {
            "availableNow": "Available now",
            "averageRate": "Avg rate",
            "topRating": "Top rated"
        },
        "noResults": {
            "title": "No matching results",
            "description": "We could not find any freelancers matching your criteria. Try different keywords or clear filters.",
            "action": "Clear all filters"
        }
    },
    "wallet": {
        "seo": {
            "title": "Wallet",
            "description": "Track your balance, transactions, and withdrawal requests."
        },
        "title": "My Wallet",
        "balance": "Available Balance",
        "pendingBalance": "Pending in Escrow",
        "totalEarned": "Total Earned",
        "totalWithdrawn": "Total Withdrawn",
        "requestWithdrawal": "Request Withdrawal",
        "transactionHistory": "Transaction History",
        "withdrawalHistory": "Withdrawal History",
        "amount": "Amount",
        "method": "Withdrawal Method",
        "bankTransfer": "Bank Transfer",
        "d17": "D17",
        "flouci": "Flouci",
        "bankName": "Bank Name",
        "iban": "IBAN",
        "phone": "Phone Number",
        "submit": "Submit",
        "cancel": "Cancel",
        "noTransactions": "No transactions yet",
        "noTransactionsDesc": "Your transaction history will appear here",
        "date": "Date",
        "type": "Type",
        "description": "Description",
        "netAmount": "Net Amount",
        "statusLabel": "Status",
        "transactionLabel": "Transaction",
        "previous": "Previous",
        "next": "Next",
        "pageOf": "Page {{page}} of {{totalPages}}",
        "noWithdrawals": "No withdrawals yet",
        "noWithdrawalsDesc": "Request a withdrawal to see it here",
        "invalidAmount": "Invalid amount",
        "fillBankDetails": "Please fill all bank details",
        "enterPhone": "Please enter phone number",
        "notAuthenticated": "Not authenticated",
        "withdrawalSuccess": "Withdrawal request submitted successfully",
        "withdrawalError": "Failed to submit withdrawal request",
        "withdrawalSubmittedTitle": "Withdrawal Request Submitted",
        "withdrawalSubmittedDesc": "Your request will be reviewed within 2-5 business days",
        "availableBalance": "Available Balance",
        "accountHolder": "Account Holder Name",
        "submitting": "Submitting...",
        "submitWithdrawal": "Submit Withdrawal Request",
        "minAmount": "Min {{min}} TND",
        "status": {
            "pending": "Pending",
            "approved": "Approved",
            "processing": "Processing",
            "completed": "Completed",
            "rejected": "Rejected"
        }
    },
    "verifyEmail": {
        "title": "Check your email",
        "subtitle": "We sent a verification link to {{email}}. Click it to activate your account.",
        "resend": "Resend verification email",
        "resendSuccess": "Verification email sent successfully",
        "resendCooldown": "Resend in {{seconds}} seconds",
        "wrongEmail": "Wrong email? Go back to signup",
        "checkSpam": "If you don't see the email, check your spam folder.",
        "noEmail": "Email address is required"
    },
    "seo": {
        "home": {
            "title": "WorkedIn",
            "description": "Connect with verified Tunisian professionals for your projects. Secure payments in TND and escrow protection."
        },
        "howItWorks": {
            "title": "How WorkedIn Works",
            "description": "See how WorkedIn takes you from project idea to approved payment in four protected steps."
        },
        "forClients": {
            "title": "Hire Verified Tunisian Talent",
            "description": "Post your project for free, receive proposals from verified professionals, and pay only when work is approved."
        },
        "faq": {
            "title": "Frequently Asked Questions",
            "description": "Find answers about payments, escrow, identity verification, and how WorkedIn works."
        },
        "jobBoard": {
            "title": "Freelance Jobs",
            "description": "Browse freelance jobs in Tunisia and find projects that match your skills, rate, and availability."
        },
        "jobDetail": {
            "titleSuffix": "Project Details",
            "descriptionFallback": "View project details, budget, and requirements before applying."
        },
        "findFreelancers": {
            "title": "Find Verified Tunisian Professionals",
            "description": "Find 2,500+ verified Tunisian developers, designers, translators, and consultants ready to start."
        },
        "freelancerProfile": {
            "addSkillPlaceholder": "Add skill...",
            "typeSkillPlaceholder": "Type a skill and press Enter...",
            "titleSuffix": "Freelancer on WorkedIn",
            "descriptionFallback": "Freelancer on the WorkedIn platform"
        },
        "login": {
            "title": "Sign in to WorkedIn",
            "description": "Sign in to your WorkedIn account to manage projects, messages, and payments."
        },
        "signup": {
            "title": "Create your WorkedIn account",
            "description": "Create your account and join 2,500+ professionals building their career on WorkedIn."
        },
        "notifications": {
            "title": "Notifications | WorkedIn",
            "description": "Your notifications"
        }
    },
    "toasts": {
        "portfolio": {
            "loadError": "Failed to load portfolio",
            "updateSuccess": "Portfolio updated successfully",
            "addSuccess": "Work added successfully",
            "saveError": "Failed to save work",
            "deleteSuccess": "Work deleted successfully",
            "deleteError": "Failed to delete work"
        },
        "proposals": {
            "loadJobError": "Failed to load job details",
            "loadError": "Failed to load proposals",
            "hireFirstMessage": "You must hire the freelancer first to start a conversation",
            "shortlistRemoved": "Removed from shortlist",
            "shortlistAdded": "Added to shortlist",
            "shortlistError": "Failed to update shortlist",
            "hireSuccess": "Freelancer hired successfully!",
            "hireError": "Failed to hire freelancer. Please try again",
            "archiveSuccess": "Proposal archived",
            "archiveError": "Failed to archive proposal",
            "submitSuccess": "Proposal submitted successfully!",
            "withdrawSuccess": "Proposal withdrawn and connects refunded",
            "withdrawError": "Failed to withdraw proposal"
        },
        "contract": {
            "deliverSuccess": "Work delivered successfully!",
            "deliverError": "Failed to deliver work",
            "acceptSuccess": "Work accepted and payment released!",
            "acceptError": "Failed to accept work",
            "requestChanges": "Request changes",
            "requestChangesSuccess": "Change request sent",
            "disputeSuccess": "Dispute opened. Will be reviewed within 48 hours.",
            "disputeError": "Failed to open dispute",
            "reviewSuccess": "Your review submitted successfully"
        },
        "job": {
            "saved": "Job saved",
            "unsaved": "Job removed from saved",
            "loginRequired": "Sign in to save jobs",
            "linkCopied": "Link copied"
        },
        "matches": {
            "searchError": "Failed to search matches",
            "contractSuccess": "Contract started successfully!",
            "contractError": "Failed to create contract"
        },
        "resetPassword": {
            "linkExpired": "Reset link expired",
            "success": "Password changed successfully"
        },
        "forgotPassword": {
            "rateLimitError": "Too many attempts. Please try again later.",
            "linkSent": "Reset link sent"
        },
        "common": {
            "error": "An error occurred",
            "success": "Operation successful",
            "genericError": "Error"
        }
    },
    "portfolio": {
        "title": "Portfolio Management",
        "subtitle": "Add and edit your previous work to increase your chances of getting hired",
        "addNew": "Add New Work",
        "addFirst": "Add Your First Work",
        "empty": {
            "title": "No works to display",
            "description": "Add samples of your previous work so clients can see your skills and quality"
        },
        "loadError": "Error loading portfolio",
        "workUpdated": "Work updated successfully",
        "workAdded": "Work added successfully",
        "workSaved": "Work saved successfully",
        "workDeleted": "Work deleted successfully",
        "deleteError": "Error during deletion",
        "deleteConfirm": "Are you sure you want to delete this work?"
    },
    "jobProposals": {
        "loadJobError": "Failed to load job data",
        "loadProposalsError": "Failed to load proposals",
        "hireFirst": "You must hire the freelancer first to start a conversation",
        "removedFromShortlist": "Removed from shortlist",
        "addedToShortlist": "Added to shortlist",
        "shortlistError": "Error updating shortlist",
        "hireSuccess": "Freelancer hired successfully! ðŸŽ‰",
        "hireError": "Failed to hire freelancer. Try again",
        "proposalArchived": "Proposal archived",
        "archiveError": "Failed to archive proposal",
        "defaultUser": "User",
        "defaultCountry": "Tunisia",
        "defaultFreelancer": "Freelancer",
        "proposalAccepted": "Your proposal has been accepted!",
        "loading": "Loading...",
        "open": "Open",
        "proposals": "Proposals",
        "interviews": "Interviews",
        "shortlist": "Shortlist",
        "share": "Share",
        "edit": "Edit",
        "filterAndShow": "Filter & Show",
        "allProposals": "All Proposals",
        "new": "New",
        "archived": "Archived",
        "noProposals": "No proposals yet",
        "noProposalsDesc": "You haven't received any proposals for this job yet. Try sharing the job to increase visibility.",
        "shareProject": "Share Job"
    },
    "jobDetail": {
        "jobSaved": "Job saved",
        "jobRemoved": "Job removed from saved",
        "error": "An error occurred",
        "loginToSave": "Login to save job",
        "proposalSent": "Proposal sent successfully!",
        "proposalError": "Error submitting proposal",
        "proposalWithdrawn": "Proposal withdrawn and connects refunded",
        "withdrawError": "Error withdrawing proposal",
        "linkCopied": "Link copied",
        "fixedPrice": "Fixed Price",
        "hourly": "Hourly",
        "experience": {
            "beginner": "Beginner",
            "intermediate": "Intermediate",
            "expert": "Expert"
        },
        "category": {
            "design": "Design",
            "development": "Development",
            "writing": "Writing",
            "translation": "Translation",
            "video": "Video",
            "marketing": "Marketing",
            "data": "Data",
            "other": "Other"
        },
        "timeAgo": {
            "minute": "{{count}} minute ago",
            "hour": "{{count}} hour ago",
            "day": "{{count}} day ago",
            "week": "{{count}} week ago",
            "month": "{{count}} month ago"
        },
        "budget": "Budget",
        "perHour": "/hour",
        "approxHours": "(approx {{count}} hours)",
        "description": "Job Description",
        "requiredSkills": "Required Skills",
        "attachments": "Attachments",
        "file": "File {{index}}",
        "defaultClient": "Client",
        "connectsNeeded": "You need {{count}} connects to submit a proposal. Your current balance: {{balance}}",
        "jobNotFound": "Job not found",
        "submitProposal": "Submit Proposal",
        "withdrawProposal": "Withdraw Proposal",
        "browseJobs": "Browse Jobs",
        "submissionRequirements": "Submission Requirements",
        "connectsRequiredDescription": "This proposal requires connects before sending.",
        "readyToSubmit": "Ready to submit",
        "insufficientBalance": "Insufficient balance",
        "balance": "Balance",
        "required": "Required",
        "remaining": "Remaining",
        "connectsDeductionWarning": "{{count}} connects will be deducted immediately after submitting the proposal.",
        "additionalConnectsNeeded": "You need {{count}} additional connects before submitting this proposal.",
        "memberSince": "Member since",
        "postedJobs": "Posted Jobs",
        "totalSpending": "Total Spending",
        "rating": "Rating",
        "viewProfile": "View Profile",
        "proposals": "Proposals",
        "views": "Views",
        "deadline": "Deadline",
        "reportJob": "Report This Job",
        "aboutClient": "About Client",
        "jobStats": "Job Stats"
    },
    "reviews": {
        "client": "Client",
        "freelancer": "Freelancer",
        "jobLabel": "Job"
    },
    "admin": {
        "debug": {
            "restApiTest": "Direct REST API Query Test",
            "bypassingClient": "Bypassing Supabase JS client entirely - using raw fetch()",
            "successMsg": "The REST API works directly. The issue is with the Supabase JS client.",
            "clientProblem": "This means RLS policies are fine, but the JS client has a problem.",
            "rlsBlocking": "RLS is blocking the query. Your account is not recognized as admin.",
            "requestTimedOut": "The request took longer than 5 seconds. Network or database issue.",
            "accessTest": "Admin Access Test",
            "directQueries": "Direct Supabase Queries (No React Query)",
            "executionLog": "Execution Log:",
            "queryWorks": "The database query works. The issue is with React Query or component lifecycle.",
            "queryHanging": "The query is hanging. This suggests an RLS policy issue causing infinite loops or a network problem."
        }
    },
    "heroSection": {
        "liveBadge": "Live",
        "freelancer": {
            "panelTitle": "How it works",
            "eyebrow": "Built in Tunisia. Built for Tunisia.",
            "titleTop": "Where Tunisian talent",
            "titleAccent": "gets paid fairly.",
            "subtitle": "No auctions. No middlemen. Post a project, agree on terms, get paid in TND - secured by escrow.",
            "cta": "Start earning today",
            "secondary": "Browse projects",
            "trust": {
                "payouts": "Protected payouts",
                "matched": "Matched work",
                "reputation": "Build reputation"
            },
            "stats": {
                "professionals": {
                    "default": "2,500",
                    "label": "Professionals"
                },
                "contracts": {
                    "default": "120",
                    "label": "Contracts done"
                },
                "rating": {
                    "value": "4.9/5",
                    "label": "Avg. rating"
                }
            },
            "features": {
                "apply": {
                    "title": "Apply to matched projects",
                    "subtitle": "Jobs that fit your skill level and rate"
                },
                "verify": {
                    "title": "Show verification status",
                    "subtitle": "Build trust before you say a word"
                },
                "track": {
                    "title": "Track milestones and payouts",
                    "subtitle": "Everything in one place, secured by escrow"
                }
            },
            "promise": "Better presentation helps great freelancers look credible before they say a word."
        },
        "client": {
            "panelTitle": "Why WorkedIn",
            "eyebrow": "Built in Tunisia. Ready for serious hiring.",
            "titleTop": "Drop the amateurs.",
            "titleAccent": "Work with the elite.",
            "subtitle": "Post your project, skip the gambling, and hire exclusively verified talent.",
            "cta": "Hire an Expert",
            "secondary": "See Top Talent",
            "trust": {
                "verified": "Verified profiles",
                "faster": "Faster hiring",
                "escrow": "Protected escrow"
            },
            "stats": {
                "professionals": {
                    "default": "2,500",
                    "label": "Professionals"
                },
                "projects": {
                    "default": "120",
                    "label": "Open projects"
                },
                "trust": {
                    "value": "4.9/5",
                    "label": "Avg. trust score"
                }
            },
            "features": {
                "post": {
                    "title": "Post once and get relevant proposals",
                    "subtitle": "No noisy bidding wars, just quality responses"
                },
                "review": {
                    "title": "Review verified local profiles",
                    "subtitle": "Trust signals appear before the first message"
                },
                "manage": {
                    "title": "Manage milestones with escrow",
                    "subtitle": "Payments stay protected until approval"
                }
            },
            "promise": "Better presentation helps serious clients trust the platform before they post a project."
        },
        "promise": {
            "label": "WorkedIn Promise"
        }
    },
    "valuePropositions": {
        "matched": {
            "title": "Matched work",
            "description": "Apply to projects that match your exact skill level and rate. No competing on price - just on quality."
        },
        "protected": {
            "title": "Protected payouts",
            "description": "Funds are held in escrow before work starts. You get paid the moment the client approves."
        },
        "reputation": {
            "title": "Build reputation",
            "description": "Show your verified status, portfolio, and reviews. Win trust before you say a word."
        },
        "badge": "Why WorkedIn",
        "heading": "Built different. For Tunisia."
    },
    "howItWorksSection": {
        "steps": {
            "1": {
                "step": "01",
                "title": "Create your profile",
                "subtitle": "Set your skills, rate, and portfolio in minutes."
            },
            "2": {
                "step": "02",
                "title": "Apply to matched jobs",
                "subtitle": "Browse projects that fit your expertise."
            },
            "3": {
                "step": "03",
                "title": "Agree on terms",
                "subtitle": "Negotiate directly. No middlemen."
            },
            "4": {
                "step": "04",
                "title": "Get paid securely",
                "subtitle": "Funds released via escrow on approval."
            }
        },
        "badge": "How it works",
        "heading": "From signup to paid in 4 steps."
    },
    "ctaSection": {
        "badge": "Ready?",
        "title": "Tunisia's freelance economy starts here.",
        "subtitle": "Join thousands of professionals already earning fairly on WorkedIn.",
        "primary": "Get started free",
        "secondary": "Post a project"
    },
    "faqPage": {
        "page": {
            "title": "Frequently Asked Questions",
            "subtitle": "Answers to the most common questions about using WorkedIn.tn",
            "searchPlaceholder": "Search questions...",
            "noAnswer": "Didn't find your answer?",
            "supportReady": "Our support team is ready to help you 24/7",
            "contactButton": "Contact us"
        },
        "categories": {
            "general": {
                "title": "General",
                "items": [
                    {
                        "q": "What is WorkedIn.tn?",
                        "a": "WorkedIn.tn is a Tunisian freelance marketplace connecting businesses with talented professionals. We believe in fair payment, verified profiles, and secure escrow-protected transactions."
                    },
                    {
                        "q": "Is registration free?",
                        "a": "Yes, registration is completely free for both freelancers and clients. We only charge a small commission on successfully completed projects."
                    },
                    {
                        "q": "How long does verification take?",
                        "a": "Identity verification typically takes 24-48 hours. You can start your profile setup immediately, and verification happens in the background."
                    }
                ]
            },
            "freelancer": {
                "title": "For Freelancers",
                "items": [
                    {
                        "q": "How do I get started as a freelancer?",
                        "a": "Sign up, complete your profile with skills and portfolio, then start browsing available projects that match your expertise."
                    },
                    {
                        "q": "How much can I earn?",
                        "a": "Your earnings depend on the projects you take and the rates you set. Many Tunisian freelancers earn between 500-5000 TND per month."
                    },
                    {
                        "q": "How do I get paid?",
                        "a": "Payments are made via D17, bank transfer, or other local payment methods. You set your preferred payment method in your wallet settings."
                    }
                ]
            },
            "client": {
                "title": "For Clients",
                "items": [
                    {
                        "q": "How do I post a project?",
                        "a": "Click \"Post a Project\", describe your work, set your budget and timeline, then publish. You'll receive proposals from verified freelancers."
                    },
                    {
                        "q": "What if I'm not satisfied with the work?",
                        "a": "If work doesn't meet agreed terms, you get a full refund. Funds are held in escrow until you approve the delivery."
                    },
                    {
                        "q": "How is my money protected?",
                        "a": "Funds are held securely in escrow. The freelancer only receives payment when you approve the completed work."
                    }
                ]
            },
            "payment": {
                "title": "Payment & Earnings",
                "items": [
                    {
                        "q": "What payment methods do you accept?",
                        "a": "We support all local Tunisian methods: cards, D17, bank transfer, and cash for small amounts."
                    },
                    {
                        "q": "When do I get paid?",
                        "a": "Freelancers are paid within 48 hours after the client approves and releases the escrow."
                    },
                    {
                        "q": "Are there any hidden fees?",
                        "a": "No. Our fees are transparent and clearly displayed. We charge a small commission only on completed projects."
                    },
                    {
                        "q": "What payment methods are available?",
                        "a": "Currently we support Dhmad escrow for secure transactions. Flouci wallet and D17 (La Poste) are coming soon. Dhmad holds your funds securely until work is approved — the same system used by Tunisie Freelance."
                    },
                    {
                        "q": "Is Dhmad safe?",
                        "a": "Yes. Dhmad is a Tunisian escrow platform authorized to hold funds as a trusted third party. Your money is protected until you approve the work."
                    },
                    {
                        "q": "When will Flouci and D17 be available?",
                        "a": "We're actively working on adding Flouci and D17. They will be available soon. We'll notify all users when they launch."
                    },
                    {
                        "q": "What happens if there's a dispute?",
                        "a": "If there's a disagreement, Dhmad holds the funds while the dispute is resolved. Neither party can access the money until the issue is settled."
                    }
                ]
            },
            "security": {
                "title": "Security & Privacy",
                "items": [
                    {
                        "q": "Is my personal information safe?",
                        "a": "Yes. We use industry-standard encryption and security measures. Your data is never shared without your permission."
                    },
                    {
                        "q": "Why do you need ID verification?",
                        "a": "ID verification ensures trust and safety for both freelancers and clients. Every professional on WorkedIn is ID-checked."
                    },
                    {
                        "q": "Can I remain anonymous?",
                        "a": "No. Both freelancers and clients must be verified. This protects everyone and ensures accountability."
                    }
                ]
            }
        }
    },
    "languages": {
        "ar": {
            "name": "العربية",
            "code": "AR",
            "country": "TN"
        },
        "fr": {
            "name": "FranÃ§ais",
            "code": "FR",
            "country": "FR"
        },
        "en": {
            "name": "English",
            "code": "EN",
            "country": "GB"
        }
    },
    "error": {
        "unexpected": "An unexpected error occurred while rendering this section.",
        "title": "Something went wrong",
        "retry": "Try again",
        "jobCard": "Failed to load job card"
    },
    "authPages": {
        "login": {
            "badge": "WorkedIn",
            "heroTitle": "Welcome back. Let's get to work.",
            "heroDescription": "Access your workspace, manage projects securely, and connect with top talent across Tunisia.",
            "highlightTrustTitle": "Verified Profiles",
            "highlightTrustDescription": "Work with confidence. Every profile and skill is verified.",
            "highlightPaymentsTitle": "Secure Payments",
            "highlightPaymentsDescription": "Funds are held safely until the milestone or project is delivered.",
            "highlightLocaleTitle": "Local & Global",
            "highlightLocaleDescription": "Optimized for local talent with fast transactions.",
            "createAccountAction": "Create account",
            "finishingSignIn": "Securing session...",
            "finishingSignInDescription": "Hang tight while we prepare your workspace.",
            "rateLimitError": "Too many attempts. Please try again later."
        },
        "signup": {
            "badge": "Join WorkedIn",
            "heroTitle": "Ready for your next big project?",
            "heroDescription": "Join thousands of professionals across Tunisia. Set up your workspace and start working in minutes.",
            "highlightRoleTitle": "Choose Your Path",
            "highlightRoleDescription": "Sign up as a freelancer to find work, or a client to hire top talent.",
            "highlightTrustTitle": "Verified & Secure",
            "highlightTrustDescription": "Stand out instantly with identity and skill verification built right in.",
            "highlightWorkTitle": "Built for Speed",
            "highlightWorkDescription": "Go from creating an account to landing your first contract fast.",
            "signInAction": "Sign in",
            "validation": {
                "passwordMinLength": "Password must be at least 8 characters",
                "passwordUppercase": "Must contain at least one uppercase letter",
                "passwordLowercase": "Must contain at least one lowercase letter",
                "passwordNumber": "Must contain at least one number"
            },
            "rateLimitErrorMinutes": "Too many attempts. Please try again in {{minutes}} minutes.",
            "rateLimitError15Min": "Too many attempts. Please try again in 15 minutes."
        }
    },
    "dashboards": {
        "client": {
            "stats": {
                "projects": "Projects",
                "active": "Active",
                "proposals": "Proposals",
                "spent": "Spent"
            },
            "widgets": {
                "activeProjects": "Active Projects",
                "activeContracts": "Active Contracts",
                "recentProposals": "Recent Proposals",
                "thisMonth": "This Month"
            },
            "empty": {
                "noActiveProjects": "No active projects",
                "noActiveProjectsDesc": "Post your first project to find talented freelancers",
                "noProposals": "No proposals yet",
                "noProposalsDesc": "Proposals from freelancers will appear here"
            },
            "cta": {
                "needSomethingDone": "Need something done?",
                "needSomethingDoneDesc": "Post a project free. Get proposals from verified Tunisian talent.",
                "postProjectFree": "Post a project — it's free"
            },
            "actions": {
                "viewAll": "View all",
                "viewWallet": "View Wallet",
                "postProject": "Post a Project"
            },
            "labels": {
                "freelancer": "Freelancer",
                "untitledJob": "Untitled job",
                "review": "Review"
            }
        },
        "freelancer": {
            "stats": {
                "contracts": "Contracts",
                "proposals": "Proposals",
                "earnings": "Earnings",
                "rating": "Rating"
            },
            "checklist": {
                "avatarUploaded": "Avatar uploaded",
                "bioWritten": "Bio written",
                "skillsAdded": "Skills added",
                "professionalTitle": "Professional title",
                "identityVerified": "Identity verified"
            },
            "widgets": {
                "activeContracts": "Active Contracts",
                "recentProposals": "Recent Proposals",
                "matchedForYou": "Matched for You",
                "profileStrength": "Profile Strength",
                "thisMonth": "This Month"
            },
            "empty": {
                "noActiveContracts": "No active contracts",
                "noActiveContractsDesc": "Submit proposals to start getting contracts",
                "noMatches": "No matches yet",
                "checkBackSoon": "Check back soon for new opportunities"
            },
            "actions": {
                "browseJobs": "Browse Jobs",
                "updateProfile": "Update Profile",
                "viewWallet": "View Wallet"
            },
            "labels": {
                "client": "Client",
                "untitledJob": "Untitled job",
                "vsLastMonth": "vs last month"
            },
            "profileStrength": {
                "complete": "Complete"
            }
        },
        "admin": {
            "tabs": {
                "overview": "Overview",
                "users": "Users",
                "jobs": "Jobs",
                "payments": "Payments",
                "verifications": "Verifications",
                "disputes": "Disputes",
                "reports": "Reports",
                "settings": "Settings"
            },
            "headers": {
                "adminDashboard": "Admin Dashboard",
                "operationsCenter": "Operations Center",
                "nightModeReady": "Night mode ready",
                "backToSite": "Back to site"
            },
            "verification": {
                "title": "Verification Queue",
                "pending": "Pending Verification",
                "approved": "Approved",
                "rejected": "Rejected",
                "resubmit": "Resubmit",
                "approve": "Approve",
                "reject": "Reject",
                "viewDetails": "View Details"
            },
            "labels": {
                "status": "Status",
                "user": "User",
                "date": "Date",
                "action": "Action",
                "email": "Email",
                "role": "Role",
                "createdAt": "Created At",
                "updatedAt": "Updated At"
            },
            "messages": {
                "loading": "Loading...",
                "noData": "No data found",
                "error": "Error loading data"
            },
            "users": {
                "switch": "Switch",
                "suspend": "Suspend",
                "suspendUser": "Suspend user",
                "suspendUserConfirm": "Do you want to suspend user",
                "suspensionKeepsHistory": "Their contracts, payments, disputes, and audit history will be kept.",
                "unableToUpdateStatus": "Unable to update user status"
            }
        }
    },
    "ui": {
        "loading": "Loading...",
        "kb": "KB)",
        "complete": "complete",
        "https_example_com": "https://example.com",
        "https": "https://...",
        "edit": "Edit",
        "cancel": "Cancel",
        "save": "Save",
        "playing": "Playing...",
        "verified": "Verified",
        "contact_workedin_tn": "contact@workedin.tn",
        "xx_xxx_xxx": "+216 XX XXX XXX",
        "ctrl_k": "Ctrl+K",
        "esc": "ESC",
        "enter": "Enter",
        "admin": "ADMIN",
        "progress": "Progress",
        "avatar": "Avatar",
        "e_g": "e.g. 50",
        "s": "s",
        "max_files": "Max: 5 files",
        "preview": "Preview",
        "title": "Title",
        "mb": "MB",
        "recommended": "✓ Recommended",
        "coming_soon": "Coming Soon",
        "f": "F",
        "iban": "رقم IBAN",
        "tn_xxxxx": "TN59XXXXX...",
        "spinner": "Spinner",
        "sizes": "Sizes",
        "skeleton": "Skeleton",
        "text_skeleton": "Text Skeleton",
        "circular_skeleton": "Circular Skeleton",
        "rectangular_skeleton": "Rectangular Skeleton",
        "skeleton_group": "Skeleton Group",
        "card_skeleton": "Card Skeleton",
        "progress_bar": "Progress Bar",
        "basic_progress": "Basic Progress",
        "with_label": "With Label",
        "custom_label": "Custom Label",
        "uploading_files": "Uploading files...",
        "variants": "Variants",
        "default": "Default",
        "success": "Success",
        "warning": "Warning",
        "error": "Error",
        "indeterminate_progress": "Indeterminate Progress",
        "empty_state": "Empty State",
        "basic_empty_state": "Basic Empty State",
        "no_items_found": "No items found",
        "with_action": "With Action",
        "no_projects_yet": "No projects yet",
        "with_secondary_action": "With Secondary Action",
        "no_results_found": "No results found",
        "error_state": "Error State",
        "something_went_wrong": "Something went wrong",
        "worked": "WORKED",
        "in": "IN",
        "id": "ID",
        "front": "front",
        "back": "back",
        "selfie": "selfie",
        "workedin": "WorkedIn â€¢",
        "times": "&times;",
        "read": "Read",
        "delivered": "Delivered",
        "recording": "Recording:",
        "privacy_workedin_tn": "privacy@workedin.tn",
        "tip": "Tip",
        "popular": "Popular",
        "hr": "/hr",
        "legal_workedin_tn": "legal@workedin.tn",
        "tn": "TN59 ...",
        "toast": {
            "close": "Close"
        }
    },
    "dynamic_key_322511046": "professionals already on WorkedIn",
    "dynamic_key_229505028": "الطرف الآخر يكتب الآن",
    "dynamic_key_1393796300": "جاري رفع الملف...",
    "dynamic_key_1524267": "د.ت",
    "dynamic_key_218823582": "حدث خطأ غير متوقع",
    "dynamic_key_426109629": "عذراً، حدث خطأ أثناء تحميل الصفحة. يرجى المحاولة مرة أخرى.",
    "dynamic_key_131381918": "إعادة المحاولة",
    "dynamic_key_1999631066": "الرئيسية",
    "dynamic_key_1080932848": "عنوان المشروع",
    "dynamic_key_1805513405": "مثال: تصميم متجر إلكتروني",
    "dynamic_key_1163187178": "وصف المشروع",
    "dynamic_key_1785209048": "اشرح تفاصيل المشروع وما قمت بإنجازه...",
    "dynamic_key_1347768947": "رابط المشروع (اختياري)",
    "dynamic_key_1972795761": "تاريخ الإنجاز",
    "dynamic_key_1333999920": "المهارات المستخدمة",
    "dynamic_key_454607345": "مثال: تصميم واجهات، تطوير واجهات، تحرير صور (افصل بينها بفاصلة)",
    "dynamic_key_392258297": "رابط صورة العرض",
    "dynamic_key_1144928517": "سنقوم بدعم رفع الملفات قريباً. يرجى استخدام رابط مباشر للصورة حالياً.",
    "dynamic_key_1502065525": "إلغاء",
    "dynamic_key_1115664379": "(500 حرف كحد أقصى)",
    "dynamic_key_2009227315": "تم تسجيل مقدمتك الصوتية",
    "dynamic_key_2123673725": "لم يتم إنشاء محفظتك بعد",
    "dynamic_key_1505988461": "تحديث",
    "dynamic_key_214509631": "محفظتي",
    "dynamic_key_208308034": "الرصيد المتاح",
    "dynamic_key_243096717": "قيد الانتظار",
    "dynamic_key_1109099118": "إجمالي الأرباح",
    "dynamic_key_891367863": "طلب سحب",
    "dynamic_key_1607514557": "آخر المعاملات",
    "dynamic_key_1954172192": "عرض الكل",
    "dynamic_key_481289425": "لا توجد معاملات بعد",
    "dynamic_key_300689867": "تم إرسال طلب السحب",
    "dynamic_key_71417736": "سيتم مراجعة طلبك وتحويل المبلغ خلال 2-5 أيام عمل",
    "dynamic_key_812168715": "المبلغ المطلوب",
    "dynamic_key_939059608": "طريقة السحب",
    "dynamic_key_1637895873": "اسم البنك",
    "dynamic_key_76026069": "مثال: البنك الوطني الفلاحي",
    "dynamic_key_475558032": "اسم صاحب الحساب",
    "dynamic_key_215587664": "الاسم كما يظهر في الحساب البنكي",
    "dynamic_key_223878144": "رقم الهاتف",
    "dynamic_key_1004386723": "سيتم مراجعة طلب السحب من قبل الإدارة وتحويل المبلغ خلال 2-5 أيام عمل.",
    "dynamic_key_1793704877": "جاري الإرسال...",
    "dynamic_key_2071445136": "إرسال طلب السحب",
    "dynamic_key_936673124": "تفاصيل الوظيفة",
    "dynamic_key_857615762": "الميزانية",
    "dynamic_key_236480406": "المدة المتوقعة",
    "dynamic_key_2053478334": "تاريخ النشر",
    "dynamic_key_220193727": "مشاركة",
    "dynamic_key_1543783939": "عرض الوظيفة",
    "dynamic_key_197805234": "توصيات الذكاء الاصطناعي",
    "dynamic_key_1253092729": "قمنا بتحليل متطلباتك ووجدنا 3 مستقلين يطابقون مشروعك بنسبة 95%.",
    "dynamic_key_232051787": "عرض التوصيات",
    "dynamic_key_49410394": "موثق",
    "dynamic_key_1530855304": "متميز",
    "dynamic_key_1824767388": "وظيفة مكتملة",
    "dynamic_key_49413132": "نجاح",
    "dynamic_key_1337275137": "قراءة المزيد...",
    "dynamic_key_1593775": "منذ",
    "dynamic_key_422731376": "عرض مدروس",
    "dynamic_key_451961555": "مدة التنفيذ",
    "dynamic_key_1598663": "يوم",
    "dynamic_key_1102070523": "إجمالي التكلفة",
    "dynamic_key_1506801489": "توظيف",
    "dynamic_key_2137084368": "التقييم",
    "dynamic_key_611934998": "مشاريع مكتملة",
    "dynamic_key_1659906949": "نسبة النجاح",
    "dynamic_key_29050573": "سرعة الرد",
    "dynamic_key_1259492927": "ساعة تقريباً",
    "dynamic_key_1693322708": "المهارات",
    "dynamic_key_1718339647": "تم التقديم منذ",
    "dynamic_key_365411007": "خطاب التقديم",
    "dynamic_key_1712849267": "المرفقات",
    "dynamic_key_1039014200": "نبذة عني",
    "dynamic_key_623032746": "اللغات",
    "dynamic_key_2144569262": "العربية",
    "dynamic_key_1262868023": "اللغة الأم",
    "dynamic_key_1827230247": "الفرنسية",
    "dynamic_key_1530851603": "متقدم",
    "dynamic_key_2133212330": "مثال عمل 1 (صورة)",
    "dynamic_key_418944631": "مثال عمل 2 (صورة)",
    "dynamic_key_1842506838": "سجل العمل غير متوفر في هذه المعاينة",
    "dynamic_key_41921266": "التقييمات غير متوفرة في هذه المعاينة",
    "dynamic_key_617719072": "تفاصيل العرض",
    "dynamic_key_549959251": "قيمة العرض",
    "dynamic_key_1265703203": "رسوم الخدمة",
    "dynamic_key_614661587": "الإجمالي للدفع",
    "dynamic_key_1111663922": "💡 الدفع معلق بشكل آمن في حساب الضمان حتى يتم تسليم العمل والموافقة عليه.",
    "dynamic_key_2071077264": "توظيف الآن",
    "dynamic_key_217425117": "مراسلة",
    "dynamic_key_6717295": "أرشفة العرض",
    "dynamic_key_872049934": "تصفية العروض",
    "dynamic_key_1581598": "عرض",
    "dynamic_key_1015995410": "بحث في العروض...",
    "dynamic_key_476684698": "الترتيب حسب",
    "dynamic_key_934974283": "الموصى به (الأفضل تطابقاً)",
    "dynamic_key_1716602825": "الأقل سعراً",
    "dynamic_key_432874841": "الأعلى سعراً",
    "dynamic_key_624028093": "الأحدث",
    "dynamic_key_596156750": "تقييم المستقل",
    "dynamic_key_1545985538": "مستوى المستقل",
    "dynamic_key_1530768926": "مبتدئ",
    "dynamic_key_1475699192": "متوسط الخبرة",
    "dynamic_key_48695393": "خبير",
    "dynamic_key_525136044": "خصائص أخرى",
    "dynamic_key_1797922455": "حساب موثق فقط",
    "dynamic_key_1828865552": "تقييم 4 نجوم وأكثر",
    "dynamic_key_257908957": "لديه معرض أعمال",
    "dynamic_key_928208723": "قيمة العرض (د.ت)",
    "dynamic_key_1544269147": "رسوم المنصة (",
    "dynamic_key_403517891": "ستحصل على",
    "dynamic_key_452524680": "مدة التسليم",
    "dynamic_key_1113257013": "رسالة العرض",
    "dynamic_key_1072185127": "اشرح لماذا أنت الشخص المناسب لهذا المشروع...",
    "dynamic_key_1611325765": "يجب كتابة 100 حرف على الأقل",
    "dynamic_key_1608485352": "مرفقات (اختياري)",
    "dynamic_key_1991592213": "رفع ملف",
    "dynamic_key_545901654": "يمكنك رفع ملفات بصيغة PDF أو صور حتى 10MB",
    "dynamic_key_1655363803": "إرسال العرض",
    "dynamic_key_1506640045": "تقييم",
    "dynamic_key_1789330939": "التقييمات (",
    "dynamic_key_1503344713": "الأعلى تقييماً",
    "dynamic_key_496366041": "الأقل تقييماً",
    "dynamic_key_1761004867": "الأكثر فائدة",
    "dynamic_key_238952578": "عرض التفاصيل",
    "dynamic_key_860054720": "رد المالك",
    "dynamic_key_233190025": "مفيد (",
    "dynamic_key_1501241012": "إبلاغ",
    "dynamic_key_2134028980": "لا توجد تقييمات بعد",
    "dynamic_key_220511911": "مشروع:",
    "dynamic_key_380610698": "التقييم العام",
    "dynamic_key_685712071": "تقييمات تفصيلية",
    "dynamic_key_1594354": "نعم",
    "dynamic_key_51299": "لا",
    "dynamic_key_1546829780": "مراجعة مكتوبة (اختياري)",
    "dynamic_key_1591556203": "شارك تجربتك مع الآخرين",
    "dynamic_key_829255241": "ما الذي أعجبك؟ ما الذي يمكن تحسينه؟ هل توصي به للآخرين؟",
    "dynamic_key_1529240342": "إعدادات الخصوصية",
    "dynamic_key_234965878": "ملاحظة",
    "dynamic_key_1087307158": "التقييمات دائمة ولا يمكن تعديلها. يمكن للطرف الآخر الرد على تقييمك.",
    "dynamic_key_1647529322": "تخطي الآن",
    "dynamic_key_1679990796": "إرسال التقييم",
    "dynamic_key_1500402850": "There are no items to display at the moment.",
    "dynamic_key_571944939": "Get started by creating your first project.",
    "dynamic_key_854531310": "Try adjusting your search or filters to find what you're looking for.",
    "dynamic_key_1725907738": "We couldn't load your data. Please try again.",
    "dynamic_key_890920977": "رد الموظف:",
    "dynamic_key_50718": "رد",
    "dynamic_key_2001555607": "الرد على التقييم",
    "dynamic_key_18255446": "اكتب ردك على تقييم",
    "dynamic_key_979253881": "اكتب ردك هنا...",
    "dynamic_key_639337527": "إرسال الرد",
    "dynamic_key_1016245850": "تقييمك لـ",
    "dynamic_key_2132806281": "المهمة:",
    "dynamic_key_669258706": "تعليقك (اختياري)",
    "dynamic_key_72742741": "شارك تجربتك مع هذا الشخص...",
    "dynamic_key_48788556": "رجوع",
    "dynamic_key_1842976832": "أفضل تطابق",
    "dynamic_key_1225650541": "جاري التشغيل...",
    "dynamic_key_1739654371": "نموذج عمل",
    "dynamic_key_1501416850": "إخفاء",
    "dynamic_key_9853380": "عميل متكرر",
    "dynamic_key_1573622": "ربح",
    "dynamic_key_193923978": "سيتم إنشاء عقد بينك وبين هذا الموظف. هل أنت متأكد؟",
    "dynamic_key_1053149402": "فشلت عملية الدفع",
    "dynamic_key_1348454276": "نصائح لحل المشكلة:",
    "dynamic_key_1707230249": "• تأكد من صحة بيانات البطاقة",
    "dynamic_key_158612530": "• تحقق من توفر رصيد كافي",
    "dynamic_key_201330750": "• جرب استخدام بطاقة أخرى",
    "dynamic_key_1659410812": "• تأكد من اتصال الإنترنت",
    "dynamic_key_1933160140": "العودة للعقد",
    "dynamic_key_128175915": "الصفحة الرئيسية",
    "dynamic_key_331518742": "إذا استمرت المشكلة، تواصل مع الدعم الفني",
    "dynamic_key_374761519": "جاري التحقق من الدفع...",
    "dynamic_key_1821001923": "يرجى الانتظار بينما نتحقق من عملية الدفع",
    "dynamic_key_1798326885": "تم الدفع بنجاح! 🎉",
    "dynamic_key_831489996": "تم تمويل الضمان بنجاح. الأموال محفوظة حتى اكتمال العمل.",
    "dynamic_key_480999927": "جاري تحويلك تلقائياً...",
    "dynamic_key_730815621": "الذهاب للعقد",
    "dynamic_key_1762109572": "فشل التحقق من الدفع",
    "dynamic_key_764967864": "العودة للوحة التحكم",
    "toast": {
        "close": "Close"
    }
};
