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
        "adminDashboard": "Admin Dashboard",
        "client": {
            "activeProjects": "Active Projects",
            "activeProjectsDesc": "Manage live briefs and hiring",
            "drafts": "Drafts",
            "draftsDesc": "All your posted projects",
            "finished": "Finished",
            "finishedDesc": "Review completed project history",
            "freelancers": "Freelancers",
            "browseTalent": "Browse Talent",
            "browseTalentDesc": "Find skilled Tunisian freelancers",
            "savedProfiles": "Saved Profiles",
            "savedProfilesDesc": "Return to shortlisted talent"
        },
        "freelancer": {
            "browseJobs": "Browse Jobs",
            "browseJobsDesc": "Explore open local projects",
            "bestMatches": "Best Matches",
            "bestMatchesDesc": "Opportunities tuned to your profile",
            "savedJobs": "Saved Jobs",
            "savedJobsDesc": "Track roles you want to revisit",
            "overview": "Overview",
            "overviewDesc": "Balance and payment status",
            "withdraw": "Withdraw",
            "withdrawDesc": "Move earnings to your account",
            "transactions": "Transactions",
            "transactionsDesc": "Review payout activity"
        }
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
            "currentPhase": "Current phase",
            "progress": "Progress",
            "step1": {
                "subtitle": "Start with a clear title and strong context."
            },
            "fields": {
                "title": "Project title",
                "mainCategory": "Main category",
                "selectCategory": "Select category",
                "subcategory": "Subcategory",
                "selectSubcategory": "Select subcategory",
                "description": "Project description",
                "requiredSkills": "Required skills (max 5)",
                "suggested": "Suggested:",
                "attachments": "Attachments (optional)",
                "attachmentsDrop": "Drag files here or click to browse",
                "chooseFiles": "Choose files",
                "titleHint": "Use specific technical terms to help the right freelancers find you.",
                "categoryHint": "Choose the best fit category to enable automated expert match alerts.",
                "subcategoryHint": "Pick the exact specialty to filter bids and ensure precise skills matching.",
                "descriptionHint": "Explain the scope, expected parameters, and what successful deliverables look like.",
                "skillsHint": "Tag precise skills to target specialized freelancers for direct application invitations.",
                "attachmentsHint2": "Provide assets, mockups, or detailed specs to clarify work deliverables.",
                "charCount": "{{current}} / {{max}} characters",
                "skillsPlaceholder": "Try Graphic Design, React, Motion Design...",
                "attachmentsHint": "PDF, DOC, DOCX, TXT, PNG, JPG, WEBP - Max 10MB per file",
                "descriptionPlaceholder": "Provide detailed background, target audience, technical specifications, and key deliverables...",
                "titlePlaceholder": "Example: Modern bilingual logo system for a Tunisian cafe"
            },
            "quality": {
                "title": "Quality Score",
                "clearTitle": "Clear title",
                "categorySelected": "Category selected",
                "strongDescription": "Strong description",
                "relevantSkills": "Relevant skills"
            },
            "autosave": {
                "saving": "Saving...",
                "saved": "Saved",
                "lastSaved": "Last saved: {{time}}",
                "ready": "Autosave ready",
                "savedAt": "Saved at {{time}}",
                "notSaved": "Not saved yet"
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
            "links": {
                "title": "Reference links (optional)",
                "description": "Add Google Drive, portfolio, or social links so freelancers can review context quickly.",
                "placeholder": "Paste link (e.g. drive.google.com/... or linkedin.com/in/...)",
                "add": "Add link",
                "remove": "Remove link",
                "maxLinksReached": "You can add up to {{count}} links.",
                "duplicate": "This link was already added.",
                "invalid": "Please enter a valid URL."
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
                "pricingMode": "Pricing Model",
                "fixedExact": "Fixed Price (Exact)",
                "fixedExactSubtitle": "Single fixed budget",
                "fixedExactDescription": "Specify a set budget for the entire scope of work. Best for well-defined tasks.",
                "fixedExactHint": "Specify the exact fixed price for this project.",
                "fixedRange": "Fixed Price (Range)",
                "fixedRangeSubtitle": "Budget min-max range",
                "fixedRangeDescription": "Define a budget window to invite proposals matching your expected bracket.",
                "fixedRangeHint": "Specify a range to attract bids within your target cost.",
                "fixedPrice": "Fixed price",
                "fixedPriceDescription": "Pay a fixed amount for the entire project upon completion.",
                "hourly": "Hourly Rate",
                "hourlySubtitle": "Time-logged billing",
                "hourlyDescription": "Pay by the hour based on tracked logs. Best for ongoing or evolving work.",
                "hourlyHint": "Determine the hourly rate and weekly time commitment limit.",
                "hourlySetup": "Hourly Pricing Details",
                "estimatedBudget": "Estimated Project Budget",
                "budgetAmount": "Budget Amount",
                "min": "Minimum Budget",
                "max": "Maximum Budget",
                "hourlyRate": "Hourly Rate",
                "hourlyRateExample": "Example: 20",
                "weeklyHours": "Weekly hours limit",
                "weeklyHoursExample": "Example: 10-20",
                "partTime10": "Part-time (up to 10 hrs/week)",
                "partTime20": "Part-time (up to 20 hrs/week)",
                "fullTime30": "Full-time (up to 30 hrs/week)",
                "fullTime40": "Full-time (up to 40 hrs/week)",
                "duration": "Project Duration",
                "selectDuration": "Select duration",
                "durationLessThan1Month": "Less than 1 month",
                "duration1To3Months": "1 to 3 months",
                "duration3To6Months": "3 to 6 months",
                "durationMoreThan6Months": "More than 6 months",
                "experienceLevel": "Required Experience Level",
                "experienceLevelHint": "Select the expertise level needed to ensure relevant applications.",
                "beginner": "Entry Level",
                "beginnerSubtitle": "Simple tasks or budget-friendly options",
                "intermediate": "Intermediate",
                "intermediateSubtitle": "Solid experience for standard goals",
                "expert": "Expert",
                "expertSubtitle": "High-tier specialists for complex needs",
                "deadline": "Deadline Date"
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
            },
            "expertTips": {
                "specificTitleLabel": "Specific Title:",
                "specificTitleText": "Describe exactly what you need. A clear title attracts matching specialists immediately.",
                "richContextLabel": "Rich Context:",
                "richContextText": "Provide clear parameters on scope, final deliverables, and success criteria.",
                "budgetModelLabel": "Budget Model:",
                "budgetModelText": "Choose Fixed Price for well-defined outcomes, and Hourly for ongoing or dynamic briefs.",
                "deadlineBufferLabel": "Deadline Buffer:",
                "deadlineBufferText": "Setting a realistic date encourages high-quality, professional applications.",
                "publicBriefsLabel": "Public Briefs:",
                "publicBriefsText": "Great for maximum proposals and competitive price bidding.",
                "inviteOnlyLabel": "Invite-only:",
                "inviteOnlyText": "Best for private/sensitive IP or when you personally select top freelancers.",
                "lockStructureLabel": "Lock Structure:",
                "lockStructureText": "Verify all specs. The core structure is finalized upon publishing to ensure bid consistency."
            },
            "titleTemplateLogo": "Logo design for a food company",
            "titleTemplateLanding": "Landing page redesign for SaaS product",
            "titleTemplateVideo": "Short-form video editor for social ads",
            "titleTemplateDash": "React dashboard with analytics widgets",
            "snippetScope": "Scope",
            "snippetScopeText": "Scope: Build a responsive experience aligned with our brand guidelines.",
            "snippetDeliverables": "Deliverables",
            "snippetDeliverablesText": "Deliverables: Source files, deployment-ready build, and concise documentation.",
            "snippetSuccess": "Success",
            "snippetSuccessText": "Success criteria: Pixel-perfect UI, strong performance, and clean handoff.",
            "expertTipsTitle": "Expert Tips",
            "tips": {
                "scope": "Be specific about scope and expected quality.",
                "success": "Clearly define what success looks like.",
                "references": "Add links, references, or examples if available.",
                "handoff": "Clarify what should be delivered at handoff."
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
            "clientFeatureEscrow": "Escrow-protected payments",
            "goToWorkspace": "Go to {{workspace}}",
            "onlineForMessages": "Online for messages",
            "darkTheme": "Dark theme",
            "language": "Language"
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
        "reviewSent": "Review submitted successfully",
        "statusUnavailable": "Status unavailable",
        "statusUnavailableHint": "Status is temporarily unavailable. This chat is still available."
    },
    "jobMatches": {
        "searchError": "Error searching for matches",
        "contractCreated": "Contract started successfully!",
        "contractError": "Error creating contract"
    },
    "profile": {
        "companyDetailsTitle": "Company Details",
        "companyDetailsDesc": "Company info, hiring preferences and communication style",
        "companyWebsite": "Website",
        "companyIndustry": "Industry",
        "selectIndustry": "Select industry",
        "companySize": "Company size",
        "companyRole": "Your role",
        "companyRolePlaceholder": "e.g. Hiring Manager, CEO",
        "hiringNeeds": "Hiring needs (comma separated)",
        "hiringNeedsPlaceholder": "e.g. Designers, Developers",
        "budgetPreference": "Default budget preference",
        "timelinePreference": "Default timeline preference",
        "communicationPreferences": "Communication preferences",
        "communicationPlaceholder": "e.g. Prefer Slack or email, weekly updates expected...",
        "screeningPreferences": "Screening preferences",
        "screeningPlaceholder": "e.g. Portfolio required, technical test expected...",
        "legalPreferences": "Legal preferences",
        "legalPlaceholder": "e.g. NDA required before starting...",
        "companySizeOptions": {
            "justMe": "Just me",
            "oneToTen": "1–10 employees",
            "elevenToFifty": "11–50 employees",
            "fiftyOneToTwoHundred": "51–200 employees",
            "twoHundredPlus": "201+ employees"
        },
        "budgetOptions": {
            "fixed": "Fixed price",
            "hourly": "Hourly rate",
            "flexible": "Flexible / Depends on project"
        },
        "timelineOptions": {
            "asap": "As soon as possible",
            "oneToThreeMonths": "1 to 3 months",
            "threeToSixMonths": "3 to 6 months",
            "flexible": "Flexible"
        },
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
        "passwordTooShort": "Password must be at least 8 characters",
        "passwordsDoNotMatch": "Passwords do not match",
        "passwordChanged": "Password updated successfully",
        "passwordUpdateFailed": "Failed to update password",
        "updatingPassword": "Updating...",
        "updatePassword": "Update password",
        "oauthPasswordMessage": "You signed in with {{provider}}. Password management is handled by your identity provider.",
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
        "identityVerificationTitle": "Identity",
        "quickActions": "Quick actions",
        "goToProfile": "Edit profile",
        "accountTabHint": "Update your details and workspace",
        "goToDashboard": "Go to dashboard",
        "goToDashboardDescription": "Return to your workspace",
        "reviewNotifications": "Manage notifications",
        "reviewNotificationsDescription": "Control your alerts",
        "toggleNotification": "Toggle {{label}}",
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
            "newMatchesDesc": "Get notified when jobs match your skills",
            "newMessages": "New messages",
            "newMessagesDesc": "Get notified when you receive new messages",
            "payments": "Payments",
            "paymentsDesc": "Get notified when you send or receive payments",
            "reviews": "Reviews",
            "reviewsDesc": "Get notified when you receive a new review",
            "marketing": "Offers and updates",
            "marketingDesc": "Tips and updates from WorkedIn",
            "contractUpdates": "Contract updates",
            "platformNews": "Platform news"
        },
        "deletePaymentMethod": "Delete {{label}}",
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
            "disputed": "Disputed",
            "cancelled": "Cancelled"
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
        "openWorkspace": "Open workspace ->",
        "subtitle": "Manage your active contracts, past work, and client communications.",
        "paymentProtectionTitle": "Payment Protection",
        "paymentProtectionDesc": "Always communicate and request payments through WorkedIn. Contracts paid outside the platform are not protected by our secure escrow system.",
        "searchPlaceholder": "Search contracts or users...",
        "emptyTitle": "No contracts found",
        "emptyDescription": "Try another tab or adjust your search to find contracts faster.",
        "emptyCancelledTitle": "No cancelled contracts",
        "emptyCancelledDescription": "You don't have any cancelled contracts."
    },
    "common": {
        "viewJob": "View Job",
        "loading": "Loading...",
        "loadingContent": "Loading content",
        "error": "Error",
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
        "freelancer": "Freelancer",
        "client": "Client",
        "hourly": "Hourly",
        "fixedPrice": "Fixed Price",
        "skill": "Skill",
        "tunisia": "Tunisia",
        "general": "General",
        "postedRecently": "Posted recently",
        "postedToday": "Posted today",
        "posted1DayAgo": "Posted 1 day ago",
        "postedDaysAgo": "Posted {{days}} days ago",
        "postedWeeksAgo": "Posted {{weeks}} week{{weeks > 1 ? 's' : ''}} ago",
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
        },
        "goBack": "Go back",
        "success": "Success",
        "delete": "Delete",
        "edit": "Edit",
        "view": "View",
        "open": "Open",
        "yes": "Yes",
        "no": "No",
        "all": "All",
        "none": "None",
        "you": "You",
        "available": "Available",
        "busy": "Busy",
        "offline": "Offline",
        "active": "Active",
        "inactive": "Inactive",
        "completed": "Completed",
        "pending": "Pending",
        "cancelled": "Cancelled",
        "approved": "Approved",
        "rejected": "Rejected",
        "tndPerHour": "TND/hr"
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
        "flouciDescription": "Pay via Flouci - bank cards & digital wallets",
        "escrowFunded": "Escrow funded successfully",
        "redirectingToPayment": "Redirecting to secure payment...",
        "startFailed": "Failed to start payment. Please try again.",
        "fundEscrowTitle": "Fund escrow",
        "fundEscrowSubtitle": "Funds are protected until the work is completed",
        "fundEscrowHint": "You need to fund escrow before the freelancer starts. Funds remain protected until you approve the delivery.",
        "projectBudget": "Project budget",
        "platformFee": "Platform fee",
        "total": "Total",
        "fundEscrowAction": "Fund escrow now",
        "dhmadDescription": "Payments are securely held in escrow by Dhmad.tn",
        "noResponse": "No response received from escrow server",
        "releaseFailed": "Failed to release escrow. Please try again.",
        "refundFailed": "Failed to refund escrow. Please try again.",
        "statusFailed": "Failed to get escrow status. Please try again.",
        "noPaymentLink": "Payment link was not generated",
        "sessionFailed": "Failed to create payment session. Please try again.",
        "successDetails": {
            "missingInfo": "Missing payment identifier",
            "timeout": "Timeout waiting for payment verification. Please check your dashboard.",
            "verificationError": "Payment verification failed. Please contact support.",
            "walletFunded": "Wallet balance updated successfully.",
            "goToWallet": "Go to Wallet",
            "backToContract": "Back to Contract",
            "backToWallet": "Back to Wallet"
        }
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
            "submitted": {
                "title": "Verification request received",
                "body": "Your identity verification request has been received. Our team is reviewing your documents."
            },
            "verified": {
                "title": "Identity verified successfully",
                "body": "Your account is now verified. You received the verification badge."
            },
            "rejected": {
                "title": "Identity verification request rejected",
                "body": "Your identity verification request was rejected. Please make sure the images are clear and submit again."
            }
        },
        "message": {
            "title": "New message from {{sender}}",
            "deleted": "This message has been deleted"
        },
        "proposal": {
            "accepted": {
                "title": "Proposal Accepted",
                "body": "Your proposal on '{{jobTitle}}' was accepted!"
            },
            "new": {
                "title": "New Proposal Received",
                "body": "{{freelancer}} submitted a proposal on '{{jobTitle}}'"
            }
        },
        "contract": {
            "active": {
                "title": "Contract Started",
                "body": "{{body}}"
            },
            "completed": {
                "title": "Contract Completed",
                "body": "{{body}}"
            },
            "cancelled": {
                "title": "Contract Cancelled",
                "body": "{{body}}"
            },
            "disputed": {
                "title": "Contract in Dispute",
                "body": "{{body}}"
            },
            "update": {
                "title": "Contract Update",
                "body": "{{body}}"
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
            "rejected": "Declined",
            "all": "All",
            "loading": "Loading proposals...",
            "emptyTitle": "You haven't applied to any jobs yet",
            "emptyTabTitle": "No {{tab}} proposals",
            "emptyDescription": "Browse open projects and send your first proposal to start working.",
            "emptyTabHint": "You have proposals, but none in {{tab}} right now. Try the All tab.",
            "browseJobs": "Browse Jobs",
            "unknownProject": "Unknown Project",
            "yourBid": "Your bid: {{amount}} TND",
            "deliveryDays": "{{days}} days delivery",
            "submittedAgo": "Submitted {{time}}",
            "justNow": "Just now",
            "minsAgo": "{{mins}} min ago",
            "hoursAgo": "{{hours}}h ago",
            "today": "Today",
            "oneDayAgo": "1 day ago",
            "daysAgo": "{{days}} days ago",
            "viewContract": "View Contract",
            "viewJob": "View Job",
            "proposalAccepted": "Your proposal was accepted!"
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
        "savedJobs": {
            "title": "Saved Jobs",
            "savedTalent": "Saved Talent",
            "subtitle": "Keep track of jobs you want to apply for.",
            "subtitleTalent": "Keep track of top freelancers for your projects.",
            "empty": {
                "title": "Nothing saved yet"
            },
            "browseJobs": "Browse Jobs",
            "browseFreelancers": "Browse Freelancers",
            "labels": {
                "budget": "Budget:"
            },
            "actions": {
                "applyNow": "Apply Now",
                "removeSavedJob": "Remove saved job",
                "inviteToJob": "Invite to Job",
                "removeSavedFreelancer": "Remove saved freelancer"
            }
        },
        "jobBoard": {
            "currency": "TND",
            "hourlyRateFormat": "TND/hr",
            "tabs": {
                "bestMatches": "Best Matches",
                "mostRecent": "Most Recent",
                "savedJobs": "Saved Jobs"
            },
            "infoBanner": {
                "loginPrompt": "Sign in to view jobs tailored to your skills.",
                "clientModePrompt": "You are viewing jobs as a client. Switch to freelancer to see matching jobs.",
                "noSkillsPrompt": "Add skills to your profile to see matching jobs.",
                "addSkillsLink": "Add skills",
                "matchingSkills": "Matching jobs based on your skills: ___SKILLS___"
            },
            "jobCard": {
                "untitledJob": "Untitled job",
                "noDescription": "No description provided.",
                "appliedLabel": "Applied"
            },
            "proposals": {
                "zero": "0 proposals",
                "lessThan5": "Less than 5 proposals",
                "range5_10": "5 to 10 proposals",
                "range10_15": "10 to 15 proposals",
                "range15_20": "15 to 20 proposals",
                "twentyPlus": "20+ proposals"
            },
            "budgetNotSpecified": "Budget not specified",
            "toasts": {
                "removedFromSaved": "Removed from saved jobs",
                "savedJob": "Saved job",
                "savedJobsUpdateError": "Could not update saved jobs"
            },
            "header": {
                "jobsYouMightLike": "Jobs you might like",
                "title": "Find Work",
                "subtitle": "Browse and apply to freelance opportunities in Tunisia."
            },
            "filters": {
                "clearAll": "Clear All",
                "jobType": "Job Type",
                "searchPlaceholder": "Search jobs...",
                "showing": "Showing {{count}} jobs"
            },
            "actions": {
                "applied": "Applied",
                "applyNow": "Apply Now"
            },
            "empty": {
                "saved": "You haven't saved any jobs yet.",
                "filtered": "No jobs found for the selected filters."
            },
            "errors": {
                "loadFailed": "Failed to load jobs. Please try again."
            }
        },
        "settings": {
            "title": "Settings",
            "menu": {
                "account": "Account",
                "profile": "Profile Settings",
                "notifications": "Notifications",
                "earnings": "Earnings",
                "billing": "Billing",
                "privacy": "Privacy",
                "freelancerMode": "Freelancer Mode",
                "clientMode": "Client Mode"
            },
            "account": {
                "currentWorkspace": "Current workspace",
                "accountType": "Account type",
                "identity": "Identity",
                "identityVerified": "Identity Verified",
                "verificationUnderReview": "Verification Under Review",
                "notVerified": "Not Verified",
                "quickActions": "Quick Actions",
                "overviewTitle": "Account Overview",
                "overviewDescription": "Manage your workspace and general account details.",
                "openPublicProfileEditor": "Open public profile editor",
                "goToDashboard": "Go to dashboard",
                "manageNotifications": "Manage notifications"
            },
            "notifications": {
                "newJobMatches": "New job matches",
                "newJobMatchesDesc": "Get notified when jobs match your skills",
                "newMessages": "New messages",
                "newMessagesDesc": "Get notified when you receive new messages",
                "payments": "Payments",
                "paymentsDesc": "Get notified when you send or receive payments",
                "reviews": "Reviews",
                "reviewsDesc": "Get notified when you receive a new review",
                "offersAndUpdates": "Offers and updates",
                "offersAndUpdatesDesc": "Tips and updates from WorkedIn",
                "toasts": {
                    "loadError": "Failed to load notification settings",
                    "saveError": "Could not save notification settings"
                }
            },
            "actions": {
                "signOut": "Sign Out"
            },
            "payment": {
                "title": "Payment Methods",
                "addMethod": "Add method",
                "bankTransfer": "Bank transfer",
                "setDefault": "Set default",
                "deleteMethod": "Delete payment method",
                "empty": {
                    "title": "No payment method added yet",
                    "description": "Add a payout method now so contracts are ready when you need them."
                },
                "toasts": {
                    "loadError": "Failed to load payment methods",
                    "added": "Payment method added",
                    "addError": "Could not add payment method",
                    "defaultUpdated": "Default payment method updated",
                    "defaultUpdateError": "Could not update default payment method",
                    "removed": "Payment method removed",
                    "removeError": "Could not remove payment method"
                }
            },
            "privacy": {
                "title": "Security & Privacy",
                "changePassword": "Change password",
                "activeSessions": "Active sessions",
                "currentSession": "This device is your current session.",
                "signOutAllDevices": "Sign out from all devices",
                "deleteAccount": "Delete account",
                "deleteAccountWarning": "Your account and all data will be permanently deleted. This action cannot be undone.",
                "toasts": {
                    "deleteRequestInProgress": "A deletion request is already in progress",
                    "deleteRequestSubmitted": "Account deletion request submitted",
                    "deleteRequestError": "Could not submit deletion request",
                    "signOutAllError": "Could not sign out all devices"
                }
            }
        },
        "leaveReview": {
            "rating": {
                "poor": "Poor",
                "fair": "Fair",
                "good": "Good",
                "veryGood": "Very Good",
                "excellent": "Excellent"
            },
            "submitted": "Review submitted successfully!",
            "error": "Failed to submit review. Try again."
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
            "defaultTitle": "Freelancer",
            "jobsLabel": "Jobs",
            "success": "Success",
            "reviewsCount": {
                "zero": "no reviews",
                "one": "1 review",
                "other": "{{count}} reviews"
            },
            "badges": {
                "verified": "Verified",
                "verifiedTitle": "Identity and payment details reviewed.",
                "topRated": "Top Rated",
                "topRatedTitle": "Consistently excellent client feedback.",
                "fastResponder": "Fast Responder",
                "fastResponderTitle": "Usually replies quickly to new clients.",
                "newTalent": "New Talent",
                "newTalentTitle": "Fresh profile with early momentum.",
                "availableNow": "Available",
                "availableNowTitle": "Available for new projects right now."
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
            "filterAll": "All",
            "filterUnread": "Unread",
            "searchPlaceholder": "Search conversations...",
            "noMessagesYet": "No messages yet",
            "emptyThread": "No messages yet. Start the conversation!",
            "messagePlaceholder": "Write your message...",
            "selectConversationTitle": "Your messages",
            "selectConversationDescription": "Select a conversation from the sidebar to start messaging, or wait for someone to reach out.",
            "selectConversationDetails": "Select a conversation to view details",
            "profileAction": "Profile",
            "contractsAction": "Contracts",
            "directContext": "Direct chat",
            "contractContext": "Contract chat",
            "directChat": "Direct chat",
            "openContract": "Open Contract",
            "archiveConversation": "Archive conversation",
            "deleteConversation": "Delete conversation",
            "attachFile": "Attach file",
            "stopRecording": "Stop recording",
            "recordVoice": "Record voice message",
            "recording": "Recording...",
            "voiceMemo": "Audio note",
            "attachmentLabel": "Attachment",
            "userFallback": "User",
            "loadingConversations": "Loading conversations...",
            "loadingMessages": "Loading messages...",
            "clientInboxLabel": "Client inbox",
            "freelancerInboxLabel": "Freelancer inbox",
            "allConversationsLabel": "All conversations",
            "archivedLabel": "ARCHIVED",
            "noConversationsFound": "No conversations found.",
            "sentAttachment": "Sent an attachment",
            "backToInbox": "Back to inbox",
            "viewArchived": "Archived conversations",
            "contractWorkspaceTitle": "Contract workspace",
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
                "noConversationsDescription": "Start by sending a proposal or contacting a freelancer.",
                "noArchivedTitle": "No archived conversations"
            },
            "errors": {
                "audioUpload": "Failed to upload audio",
                "fileUpload": "Failed to upload file",
                "fileTooLarge": "File size must be less than 10 MB",
                "invalidAttachment": "Attachment link is not available",
                "openAttachment": "Failed to open attachment right now",
                "recordingLimit": "Recording limit reached (5 minutes)",
                "sendFailed": "Failed to send message",
                "fileUnsupported": "Unsupported file type",
                "fileInspectionFailed": "Could not verify this file safely. Please choose another file."
            },
            "offline": {
                "synced": "Offline messages synced successfully",
                "fileTooLarge": "File too large for offline storage (max 5MB)",
                "audioTooLarge": "Audio too large for offline storage",
                "encodingFailed": "Failed to prepare file for offline storage",
                "storageFailed": "Failed to save message offline",
                "queued": "You are offline. Message queued and will send when reconnected.",
                "attachmentPending": "Attachment pending",
                "statusWaiting": "Waiting"
            },
            "time": {
                "now": "Now",
                "minutesAgo": "{{count}} min ago",
                "hoursAgo": "{{count}} h ago",
                "daysAgo": "{{count}} d ago"
            },
            "deletedMessage": "This message was deleted",
            "deleteMessage": "Delete message",
            "deleteMessagePrompt": "Are you sure you want to delete this message?",
            "deleteForMe": "Delete for me",
            "deleteForEveryone": "Delete for everyone",
            "loadMore": "Load more messages",
            "reacting": "Reacting...",
            "copyMessage": "Copy message",
            "replyTo": "Reply to message",
            "replyingTo": "Replying to",
            "cancelReply": "Cancel reply",
            "edited": "Edited",
            "readOnlyThread": "{{message}}",
            "readOnlyPlaceholder": "{{message}}",
            "lifecycleBanner": "{{message}}",
            "contractSessionFallbackTitle": "Contract",
            "contractReferenceFallback": "Contract",
            "contractReferenceWithId": "Contract #{{id}}",
            "contractWithName": "Contract with {{name}}",
            "contractProjectWithTitle": "Contract project • {{title}}",
            "seeLess": "See less",
            "seeMore": "See more",
            "contractDetails": {
                "amount": "Amount",
                "due": "Due",
                "review": "Review",
                "workspace": "Workspace"
            },
            "delivery": {
                "reviewFiles": "Review Files",
                "reviewFilesDescription": "Files the client can review immediately before accepting.",
                "finalLockedFiles": "Final Locked Files",
                "finalLockedFilesDescription": "Files that stay locked until the client accepts and payment is released."
            },
            "markUnread": "Mark as Unread",
            "reportUser": "Report User",
            "reportUserTitle": "Report User",
            "reportUserDescription": "Tell us why you are reporting this user. Our team will review their profile and recent activity.",
            "reportSubmittedSuccess": "Report submitted successfully. Our team will review it.",
            "reportReason": {
                "spam": "Spam or misleading",
                "inappropriate": "Inappropriate behavior or content",
                "fraud": "Fraud or scam attempt",
                "harassment": "Harassment or abuse",
                "other": "Other"
            },
            "unarchive": "Unarchive",
            "archiveSuccess": "Conversation archived",
            "unarchiveSuccess": "Conversation returned to inbox",
            "contractOpenFailed": "Could not open this contract thread yet. Please refresh and try again.",
            "loadingContractSidebar": "Loading contract details...",
            "contractSidebarUnavailable": "Contract details are not available for this conversation yet.",
            "imageLabel": "Image",
            "replyTargetMissing": "Original message is no longer available.",
            "searchResultsSummary": "{{count}} results",
            "threadCountSummary": "{{count}} threads",
            "reply": "Reply",
            "delete": "Delete",
            "unfundedLabel": "Unfunded",
            "replyingTo": "Replying to",
            "cancelReply": "Cancel reply",
            "a11y": {
                "openImageAttachment": "Open image attachment",
                "openAttachment": "Open attachment"
            }
        },
        "freelancerProfile": {
            "actions": {
                "changeProfilePicture": "Change profile picture",
                "editProfile": "Edit profile",
                "openLink": "Open link",
                "viewFullProject": "View full project",
                "openProjectLink": "Open project link",
                "previousProject": "Previous project",
                "nextProject": "Next project"
            },
            "cta": {
                "viewPublicProfile": "View Public Profile",
                "viewPublicProfileDescription": "Preview exactly how clients and visitors see your profile.",
                "portfolioDashboard": "Portfolio Dashboard",
                "portfolioDashboardDescription": "Add and organize your best work samples.",
                "myProposals": "My Proposals",
                "myProposalsDescription": "Track statuses and follow up faster.",
                "workspaceSettings": "Workspace Settings",
                "workspaceSettingsDescription": "Notifications, security, and account controls.",
                "hireMe": "Hire Me",
                "sendMessage": "Send Message"
            },
            "form": {
                "fullName": "Full name",
                "professionalTitle": "Professional title",
                "hourlyRateTnd": "Hourly rate (TND)"
            },
            "info": {
                "memberSince": "Member since",
                "lastSeen": "Last seen"
            },
            "labels": {
                "skillsUsed": "Skills used",
                "toolsUsed": "Tools used"
            },
            "publicPreview": {
                "title": "Public Profile Preview",
                "description": "You are viewing your profile as other users see it.",
                "exit": "Exit Preview"
            },
            "reviews": {
                "empty": "No reviews yet. Complete your first contract to receive feedback."
            },
            "sections": {
                "coreStrengths": "Core strengths",
                "selectedWork": "Selected work",
                "clientTrust": "Client trust",
                "workInformation": "Work information"
            },
            "stats": {
                "hourlyRate": "Hourly rate",
                "lessThanTwoHours": "< 2 hrs",
                "hoursResponseTime": "< {{hours}} hrs",
                "availabilityAndStats": "Availability & Stats",
                "status": "Status",
                "availableForWork": "Available for work",
                "weeklyAvailability": "Weekly availability",
                "hoursPerWeek": "{{hours}} hrs/week",
                "yearsOfExperience": "Years of experience",
                "yearsCount": {
                    "one": "{{count}} year",
                    "other": "{{count}} years"
                },
                "responseTime": "Response time",
                "jobSuccess": "Job Success",
                "profileVisibility": "Profile Visibility",
                "public": "Public"
            },
            "toasts": {
                "workSampleDeleted": "Work sample deleted",
                "workSampleDeleteError": "Could not delete work sample",
                "profileUpdated": "Profile details updated",
                "profileUpdateError": "Could not update profile details",
                "bioUpdated": "Bio updated",
                "bioUpdateError": "Could not update bio",
                "skillsUpdated": "Skills updated",
                "skillsUpdateError": "Could not update skills",
                "toolsUpdated": "Tools updated",
                "toolsUpdateError": "Could not update tools",
                "avatarUpdated": "Profile picture updated",
                "loginRequired": "Please log in to continue",
                "contactDisabledOwnProfile": "Public preview mode: contact action is disabled on your own profile."
            },
            "validation": {
                "fullNameRequired": "Full name is required",
                "validHourlyRate": "Please enter a valid hourly rate",
                "avatarType": "Please upload JPG, PNG, WEBP, or GIF image.",
                "avatarSize": "Image size should be less than 5MB."
            },
            "verifications": {
                "title": "Verifications",
                "identityVerified": "Identity Verified",
                "phoneNumber": "Phone Number",
                "emailAddress": "Email Address",
                "paymentMethod": "Payment Method"
            },
            "viewer": {
                "close": "Close portfolio viewer",
                "previousImage": "Previous image",
                "nextImage": "Next image"
            },
            "workSamples": {
                "emptyTitle": "No work samples added yet"
            },
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
            },
            "main": {
                "portfolio": "Portfolio",
                "add": "Add",
                "untitledWork": "Untitled work",
                "noDescription": "No description provided.",
                "openLink": "Open Link",
                "viewProject": "View Project",
                "workSamplesEmptyDesc": "Showcase case studies, designs, products, and measurable outcomes to attract clients.",
                "addFirstWorkSample": "Add your first work sample",
                "workHistoryAndReviews": "Work History & Reviews",
                "projectCollaboration": "Project Collaboration",
                "reviewBy": "by {{name}}",
                "reviewsCount": {
                    "one": "{{count}} review",
                    "other": "{{count}} reviews"
                },
                "hourlyRateFormat": "{{rate}}/hr",
                "localTime": "{{time}} local time",
                "jobsCompletedCount": {
                    "one": "{{count}} job completed",
                    "other": "{{count}} jobs completed"
                },
                "responseTimeSuffix": "response time",
                "copied": "Copied!",
                "share": "Share",
                "independentSpecialist": "Independent Specialist",
                "specializedIn": "Specialized in {{skills}}",
                "specializedFreelancer": "Specialized Freelancer",
                "noBio": "No biography details provided yet.",
                "addDescription": "+ Add description",
                "skills": "Skills",
                "services": "Services",
                "tools": "Tools",
                "industries": "Industries",
                "photosCount": {
                    "one": "{{count}} photo",
                    "other": "{{count}} photos"
                }
            },
            "projectPreferences": {
                "title": "Project Preferences & Details",
                "revisionPolicy": "Revision Policy",
                "revisionPolicyDefault": "2 revisions included, additional billed separately.",
                "projectPreferences": "Project Preferences",
                "projectPreferencesDefault": "Open to project scope changes, regular text/call communication, and milestone-based deliverables."
            },
            "portfolioLinks": {
                "title": "Portfolio Links",
                "empty": "No links added yet.",
                "add": "+ Add portfolio links"
            },
            "languages": {
                "title": "Languages",
                "empty": "No languages listed."
            },
            "education": {
                "title": "Education",
                "studyField": "{{degree}} in {{field}}",
                "empty": "No education entered yet.",
                "add": "+ Add education details"
            },
            "jobFallback": "Project"
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
            "navHint": "navigate",
            "selectHint": "select",
            "closeHint": "close",
            "allResults": "All results",
            "resultsHeadline": "Results · {{category}}",
            "searchIn": "Search in",
            "searching": "Searching...",
            "noResultsFor": "No results for \"{{query}}\"",
            "quickLinksRecent": "Quick links & recent",
            "removeSearch": "Remove search",
            "filterAll": "All",
            "filterAllDesc": "Search everything",
            "filterJobs": "Jobs",
            "filterJobsDesc": "Open job postings",
            "filterTalent": "Talent",
            "filterTalentDesc": "Freelancers & agencies",
            "filterProjects": "Projects",
            "filterProjectsDesc": "Quick links & pages",
            "placeholderJobs": "Search jobs...",
            "placeholderTalent": "Search freelancers...",
            "placeholderProjects": "Search pages...",
            "placeholderAll": "Search jobs, freelancers, pages...",
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
        "recent": "Recent searches",
        "clearAll": "Clear all",
        "jobs": "Jobs",
        "freelancers": "Freelancers",
        "skills": "Skills",
        "resultsFor": "Results for",
        "noResults": "No results found",
        "noResultsDesc": "We could not find anything matching your search",
        "negotiable": "Negotiable",
        "budgetNegotiable": "Negotiable",
        "resultsLabel": "results for",
        "filters": "Filters",
        "filterSections": {
            "category": "Category",
            "budgetRange": "Budget range"
        },
        "filtersTitle": "Filters",
        "resetFilters": "Clear all filters",
        "tabs": {
            "all": "All",
            "jobs": "Jobs",
            "freelancers": "Freelancers"
        },
        "categories": {
            "development": "Development",
            "design": "Design",
            "marketing": "Marketing",
            "writing": "Writing"
        },
        "budgets": {
            "0_50": "Under 50 TND",
            "50_100": "50 – 100 TND",
            "100_250": "100 – 250 TND",
            "250_500": "250 – 500 TND",
            "500_plus": "500+ TND",
            "range1": "Under 50 TND",
            "range2": "50 – 100 TND",
            "range3": "100 – 250 TND",
            "range4": "250 – 500 TND",
            "range5": "500+ TND"
        },
        "sort": {
            "newest": "Newest first",
            "budgetHigh": "Budget: High to Low",
            "budgetLow": "Budget: Low to High",
            "proposalsHigh": "Most proposals"
        },
        "pagination": {
            "prev": "Prev",
            "next": "Next",
            "pageOf": "Page {{page}} of {{total}}"
        },
        "empty": {
            "titlePrefix": "Find Your Perfect",
            "titleHighlight": "Match",
            "subtitle": "Discover talented freelancers and amazing projects in just a few clicks.",
            "trendingTitle": "Trending now",
            "browseAllJobs": "Or browse all jobs",
            "tipLabel": "Tip",
            "tipSpecific": "Be specific with keywords to find the best match faster",
            "popularLabel": "Popular",
            "tipPopular": "React and UI/UX design are trending this week",
            "proTipLabel": "Pro Tip",
            "tipFilters": "Use filters to narrow results by budget and category"
        },
        "noResultsView": {
            "title": "Nothing found for",
            "subtitle": "Don't worry! Try one of these suggestions:",
            "didYouMeanPlaceholder": "Did you mean trying a broader keyword?",
            "suggestionFiltersTitle": "Broaden Your Filters",
            "suggestionFiltersBody": "Remove budget or category filters",
            "suggestionKeywordsTitle": "Try Alternative Keywords",
            "suggestionKeywordsBody": "Different wording finds better results",
            "suggestionCategoriesTitle": "Browse Popular Categories",
            "suggestionCategoriesBody": "Check out trending skills"
        },
        "error": {
            "title": "Something went wrong",
            "description": "We're having trouble searching right now.",
            "retry": "Try Again"
        },
        "resultsCount": "Showing {{count}} results for \"{{query}}\"",
        "labels": {
            "freelancer": "Freelancer",
            "projects": "projects",
            "successRate": "success"
        },
        "trendingTags": {
            "logoDesign": "Logo Design",
            "reactJs": "React JS",
            "translation": "Translation",
            "uiux": "UI/UX"
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
        },
        "progressive": {
            "common": {
                "removeTagAria": "Remove {{item}}",
                "stepCounter": "Step {{step}} of {{total}}",
                "saveExit": "Save & Exit",
                "back": "Back",
                "proTip": "Pro Tip",
                "onboardingRequired": "Please complete your onboarding profile before accessing other pages.",
                "fixBeforeContinue": "Please fix this before continuing: {{error}}",
                "completeRequiredFields": "Please complete required fields before continuing.",
                "completionFailed": "Failed to complete onboarding. Please try again.",
                "conflictRetry": "A conflicting update was detected. Please try again.",
                "phoneTaken": "This phone number is already in use by another account.",
                "invalidPhone": "Please enter a valid phone number.",
                "accountInactive": "Your account is not active. Please contact support.",
                "unsavedConfirm": "You have unsaved onboarding progress. Exit anyway?",
                "exitOnboarding": "Exit Onboarding",
                "completing": "Completing...",
                "completeProfile": "Complete Profile",
                "nextStep": "Next Step",
                "fields": {
                    "fullName": "Full Name",
                    "location": "Location",
                    "phoneNumber": "Phone Number"
                },
                "placeholders": {
                    "fullName": "Your full name",
                    "selectLocation": "Select location"
                }
            },
            "freelancer": {
                "steps": {
                    "identityPitch": "Identity & Pitch",
                    "expertise": "Expertise",
                    "businessRates": "Business & Rates",
                    "trustProof": "Trust & Proof"
                },
                "stepSubtitles": {
                    "identityPitch": "Start with who you are and how you present your value.",
                    "expertise": "Define your strengths so matching quality improves.",
                    "businessRates": "Set clear business terms to align expectations.",
                    "trustProof": "Add trust signals that make clients confident to hire."
                },
                "tips": {
                    "identityPitch": "Clients decide in seconds. A clear title and confident profile summary instantly builds trust.",
                    "expertise": "The right tags make matching smarter. Add only your strongest skills and tools to attract best-fit projects.",
                    "businessRates": "Transparent rates reduce negotiation friction and help serious clients shortlist you faster.",
                    "trustProof": "Verified details and a portfolio link are your credibility boosters. They increase response rates significantly."
                },
                "categories": {
                    "development": "Development",
                    "design": "Design",
                    "marketing": "Marketing",
                    "writing": "Writing",
                    "video": "Video",
                    "data": "Data",
                    "business": "Business"
                },
                "skillSuggestions": {
                    "react": "React",
                    "typescript": "TypeScript",
                    "nodejs": "Node.js",
                    "uiux": "UI/UX Design",
                    "figma": "Figma",
                    "contentWriting": "Content Writing",
                    "seo": "SEO",
                    "googleAds": "Google Ads",
                    "motionDesign": "Motion Design",
                    "dataAnalysis": "Data Analysis",
                    "python": "Python",
                    "nextjs": "Next.js",
                    "tailwind": "Tailwind CSS",
                    "illustrator": "Illustrator",
                    "projectManagement": "Project Management"
                },
                "toolSuggestions": {
                    "figma": "Figma",
                    "vscode": "VS Code",
                    "photoshop": "Photoshop",
                    "illustrator": "Illustrator",
                    "notion": "Notion",
                    "jira": "Jira",
                    "slack": "Slack",
                    "github": "GitHub",
                    "docker": "Docker",
                    "canva": "Canva",
                    "framer": "Framer",
                    "webflow": "Webflow"
                },
                "experience": {
                    "0to2": "0-2",
                    "3to5": "3-5",
                    "5plus": "5+"
                },
                "availability": {
                    "partTime": "Part-time",
                    "fullTime": "Full-time",
                    "asNeeded": "As needed"
                },
                "errors": {
                    "avatarRequired": "Avatar is required.",
                    "fullNameRequired": "Full name is required.",
                    "locationRequired": "Location is required.",
                    "professionalTitleRequired": "Professional title is required.",
                    "summaryRequired": "Summary is required.",
                    "summaryTooLong": "Summary must be 500 characters or less.",
                    "mainCategoryRequired": "Main category is required.",
                    "coreSkillRequired": "Add at least one core skill.",
                    "toolRequired": "Add at least one tool.",
                    "hourlyRateInvalid": "Hourly rate must be greater than 0.",
                    "experienceRequired": "Select years of experience.",
                    "availabilityRequired": "Select availability.",
                    "portfolioRequired": "Portfolio link is required.",
                    "phoneRequired": "Phone number is required."
                },
                "completedTitle": "Profile setup completed",
                "completedSubtitle": "Your freelancer onboarding data is ready. You can now move to your dashboard.",
                "completedMessage": "Thanks. Your onboarding information has been captured with a progressive structure.",
                "currency": "TND",
                "fields": {
                    "avatarUpload": "Avatar Upload (Required)",
                    "avatarPreviewAlt": "Avatar preview",
                    "chooseAvatar": "Choose avatar",
                    "avatarHint": "PNG, JPG, WEBP",
                    "professionalTitle": "Professional Title",
                    "bioSummary": "Bio/Summary",
                    "mainCategory": "Main Category",
                    "coreSkills": "Core Skills",
                    "toolsUsed": "Tools Used",
                    "hourlyRate": "Hourly Rate",
                    "yearsOfExperience": "Years of Experience",
                    "availability": "Availability",
                    "portfolioLink": "Portfolio Link"
                },
                "placeholders": {
                    "professionalTitle": "Senior React Developer",
                    "bioSummary": "What do you do best and what kind of projects excite you?",
                    "selectCategory": "Select category",
                    "coreSkills": "Type a skill and press Enter",
                    "toolsUsed": "Type a tool and press Enter",
                    "hourlyRate": "80",
                    "experienceRange": "Select range",
                    "availability": "Select availability",
                    "portfolioLink": "https://your-portfolio.com",
                    "phoneNumber": "For security and verified badge"
                },
                "hints": {
                    "coreSkills": "Search and add up to 30 skills",
                    "toolsUsed": "Search and add up to 15 tools",
                    "phoneNumber": "For security and verified badge."
                }
            },
            "client": {
                "steps": {
                    "accountDetails": "Account Details",
                    "hiringIntent": "Hiring Intent"
                },
                "tips": {
                    "accountDetails": "A complete account profile increases reply rates and reduces drop-off during first client-freelancer contact.",
                    "hiringIntent": "Clear hiring intent improves recommendations and helps the platform suggest higher-quality candidates."
                },
                "accountTypes": {
                    "individual": "Individual",
                    "company": "Company"
                },
                "primaryGoals": {
                    "specificProject": "Hire for a specific project",
                    "buildTeam": "Build a team",
                    "justBrowsing": "Just browsing"
                },
                "errors": {
                    "fullNameRequired": "Full name is required.",
                    "locationRequired": "Location is required.",
                    "phoneRequired": "Phone number is required.",
                    "accountTypeRequired": "Account type is required.",
                    "companyNameRequired": "Company name is required for company accounts.",
                    "primaryGoalRequired": "Primary goal is required."
                },
                "stepSubtitles": {
                    "accountDetails": "Just the essentials so your account is trusted and complete.",
                    "hiringIntent": "Tell us what you want to hire for so we can personalize matching."
                },
                "completedTitle": "Onboarding completed",
                "completedSubtitle": "Your client profile is now ready. You can continue to your dashboard.",
                "completedMessage": "Client onboarding data is complete and ready.",
                "fields": {
                    "accountType": "Account Type",
                    "companyName": "Company Name",
                    "primaryGoal": "Primary Goal"
                },
                "placeholders": {
                    "phoneNumber": "+216 00 000 000",
                    "companyName": "Your company name"
                }
            }
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
                        "fee": "Platform fee: 5% of each contract value",
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
            "description": "We couldn't find any freelancers matching your criteria. Try different keywords or clear filters.",
            "action": "Clear all filters"
        },
        "location": "Location",
        "allLocations": "All Locations",
        "nLocations": "{{count}} Locations",
        "searchLocations": "Search locations...",
        "noMatchesFound": "No matches found",
        "searchSkills": "Search skills...",
        "noSkillsFound": "No skills found",
        "min": "Min",
        "max": "Max",
        "to": "to",
        "rateAny": "Any",
        "jobSuccessRate": "Job Success Rate",
        "anySuccessRate": "Any Success Rate",
        "anySuccessRateDesc": "Show all freelancers",
        "rate90up": "90% & up",
        "rate90upDesc": "Highly rated professionals",
        "rate80up": "80% & up",
        "rate80upDesc": "Top tier consistency",
        "jobsCompleted": "Jobs Completed",
        "anyJobsAmount": "Any Jobs Amount",
        "anyJobsAmountDesc": "Show everyone",
        "jobs1plus": "1+ jobs completed",
        "jobs1plusDesc": "Has marketplace experience",
        "jobs5plus": "5+ jobs completed",
        "jobs5plusDesc": "Established track record",
        "jobs10plus": "10+ jobs completed",
        "jobs10plusDesc": "Veteran freelancer status"
    },
    "wallet": {
        "tabs": {
            "overview": "Overview",
            "withdraw": "Withdraw",
            "deposit": "Deposit",
            "transactions": "Transactions"
        },
        "withdrawalAmount": "Withdrawal Amount",
        "bankTransferDesc": "Withdraw directly to your local bank account",
        "d17Desc": "Withdraw via e-Dinar. Coming soon.",
        "flouciDesc": "Withdraw via Flouci mobile wallet. Coming soon.",
        "youWithdraw": "You withdraw",
        "minWithdrawalNotice": "Minimum withdrawal is {{min}} TND. Requests are reviewed manually before processing.",
        "recentTransactions": "Recent Transactions",
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
        "deposit": "Deposit Funds",
        "paymentMethod": "Payment Method",
        "depositAmountLabel": "Deposit Amount (TND)",
        "depositLimits": "Min: 10 TND - Max: 5,000 TND",
        "continueToPayment": "Continue to payment",
        "processingDeposit": "Processing...",
        "depositAmountError": "Amount must be between {{min}} and {{max}} TND",
        "noPaymentLink": "Payment link was not generated",
        "genericError": "An error occurred. Please try again.",
        "comingSoonLabel": "Coming soon",
        "moreMethodsSoon": "More payment methods will be available soon.",
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
        "errors": {
            "bankNameRequired": "Bank name is required",
            "accountHolderRequired": "Account holder name is required",
            "ibanRequired": "IBAN is required",
            "ibanInvalid": "IBAN must start with TN",
            "phoneRequired": "Phone number is required",
            "phoneInvalid": "Enter a valid phone number"
        },
        "status": {
            "pending": "Pending",
            "approved": "Approved",
            "processing": "Processing",
            "completed": "Completed",
            "rejected": "Rejected"
        },
        "mockDepositFailed": "Failed to credit mock wallet deposit",
        "lockedFundsTitle": "Locked Funds Schedule",
        "noLockedFunds": "No funds currently locked in escrow",
        "moveEarnings": "Move earnings to bank",
        "topUpWallet": "Top up your wallet",
        "fullPaymentHistory": "Full payment history",
        "viewAllArrow": "View all →",
        "summary": "Summary",
        "platformFeeNotice": "Platform fee (~1%)",
        "youReceive": "You receive",
        "howItWorksTitle": "How it works",
        "steps": {
            "submitRequest": "Submit request",
            "submitRequestDesc": "Fill and submit your withdrawal details",
            "review": "Review (2–5 days)",
            "reviewDesc": "Our team verifies your request",
            "transferSent": "Transfer sent",
            "transferSentDesc": "Funds hit your account"
        },
        "available": "Available",
        "transferEarningsDesc": "Transfer earnings to your payment method",
        "earningsGrowth": "Earnings Growth",
        "spendingHistory": "Spending History",
        "monthlyBillingVolume": "Monthly billing volume generated (last 6 months)",
        "monthlyFundingVolume": "Monthly platform funding volume spent (last 6 months)"
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
            "withdrawSuccess": "Proposal withdrawn successfully",
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
        "saveError": "Error saving work",
        "workDeleted": "Work deleted successfully",
        "deleteError": "Error during deletion",
        "deleteConfirm": "Are you sure you want to delete this work?",
        "view": {
            "gridAria": "Grid view",
            "listAria": "List view"
        },
        "form": {
            "addTitle": "Add New Work",
            "editTitle": "Edit Work",
            "imageHint": "Upload a preview image or paste a direct image URL.",
            "fields": {
                "title": {
                    "label": "Project title",
                    "placeholder": "Example: E-commerce storefront design"
                },
                "description": {
                    "label": "Project description",
                    "placeholder": "Describe the project details and what you delivered..."
                },
                "projectUrl": {
                    "label": "Project URL (optional)",
                    "placeholder": "https://example.com"
                },
                "clientName": {
                    "label": "Client / Brand (optional)",
                    "placeholder": "Example: Acme Corp"
                },
                "completionDate": {
                    "label": "Completion date"
                },
                "skills": {
                    "label": "Skills used",
                    "placeholder": "Example: UI design, Frontend development, Image editing (comma-separated)",
                    "searchPlaceholder": "Search and select skills..."
                },
                "tools": {
                    "label": "Tools used (optional)",
                    "searchPlaceholder": "Search and select tools..."
                },
                "imageUpload": {
                    "label": "Upload preview image"
                },
                "imageUrl": {
                    "label": "Or paste image URL",
                    "placeholder": "https://..."
                }
            },
            "actions": {
                "cancel": "Cancel",
                "add": "Add Work",
                "save": "Save Changes"
            },
            "upload": {
                "action": "Upload image",
                "replace": "Replace image",
                "remove": "Remove",
                "edit": "Edit image",
                "delete": "Delete image",
                "addMore": "Add image",
                "addUrl": "Add URL",
                "extraUrlPlaceholder": "https://image-url.com/preview.jpg",
                "galleryLabel": "Project Gallery (Optional)",
                "extraAdded": "Image added to gallery",
                "uploading": "Uploading...",
                "success": "Image uploaded successfully",
                "error": "Failed to upload image",
                "networkError": "Upload service is unreachable right now. You can still paste a direct image URL.",
                "permissionError": "You do not have permission to upload files to storage.",
                "loginRequired": "Please sign in to upload images.",
                "previewAlt": "Portfolio preview image",
                "replaceCover": "Replace Cover",
                "deleteCover": "Delete Cover",
                "uploadCover": "Upload Cover Image",
                "dragDropHint": "Drag & drop or click to browse. JPEG, PNG, WEBP (Max 5MB)",
                "pasteUrlHint": "Or paste a direct image URL for the cover:",
                "coverUrlPlaceholder": "https://example.com/cover-image.jpg",
                "extraImageUrlPlaceholder": "Add extra image URL...",
                "addExtraUrl": "Add"
            },
            "skills": {
                "remove": "Remove skill",
                "edit": "Edit",
                "clearAll": "Delete all",
                "noneSelected": "No skills selected yet.",
                "noResults": "No matching skills found.",
                "sections": {
                    "design": "Design",
                    "development": "Development",
                    "writing": "Writing",
                    "marketing": "Marketing",
                    "video": "Video",
                    "business": "Business",
                    "data": "Data",
                    "other": "Other"
                }
            },
            "tools": {
                "remove": "Remove tool",
                "edit": "Edit",
                "clearAll": "Delete all",
                "noneSelected": "No tools selected yet.",
                "noResults": "No matching tools found.",
                "sections": {
                    "design": "Design",
                    "development": "Development",
                    "productivity": "Productivity",
                    "video": "Video",
                    "marketing": "Marketing",
                    "other": "Other"
                }
            },
            "validation": {
                "titleMin": "Title must be at least 3 characters",
                "descriptionMin": "Description must be at least 10 characters",
                "invalidUrl": "Please use a valid http/https URL",
                "invalidImageUrl": "Please use a direct http/https image URL",
                "imageRequired": "Please upload an image or provide a direct image URL",
                "skillsLimit": "You can select up to {{count}} skills",
                "toolsLimit": "You can select up to {{count}} tools"
            }
        },
        "card": {
            "clientPrefix": "Client",
            "editItem": "Edit portfolio item",
            "deleteItem": "Delete portfolio item"
        }
    },
    "jobProposals": {
        "loadJobError": "Failed to load job data",
        "loadProposalsError": "Failed to load proposals",
        "hireFirst": "You must hire the freelancer first to start a conversation",
        "removedFromShortlist": "Removed from shortlist",
        "addedToShortlist": "Added to shortlist",
        "shortlistError": "Error updating shortlist",
        "hireSuccess": "Freelancer hired successfully!",
        "hireError": "Failed to hire freelancer. Try again",
        "proposalArchived": "Proposal archived",
        "proposalUnarchived": "Proposal moved to active",
        "archiveError": "Failed to archive proposal",
        "unarchiveError": "Failed to unarchive proposal",
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
        "shareProject": "Share Job",
        "jobDetails": "Job Details",
        "expectedDuration": "Expected Duration",
        "viewJob": "View Job",
        "aiTitle": "AI Recommendations",
        "aiDesc": "We analyzed your requirements and found 3 freelancers that match your project at 95%.",
        "viewSuggestions": "View Suggestions",
        "filterTitle": "Filter Proposals",
        "searchPlaceholder": "Search proposals...",
        "sortBy": "Sort by",
        "sort": {
            "recommended": "Best Match",
            "lowestBid": "Lowest Bid",
            "highestBid": "Highest Bid",
            "newest": "Newest",
            "rating": "Highest Rated"
        },
        "freelancerLevel": "Freelancer Level",
        "extraFilters": "Other Filters",
        "verifiedOnly": "Verified account only",
        "highRated": "4 stars and above",
        "hasPortfolio": "Has portfolio",
        "clearFilters": "Clear Filters",
        "shortlisted": "Shortlisted",
        "verified": "Verified",
        "topRated": "Top Rated",
        "jobsDone": "jobs done",
        "successRate": "success rate",
        "noCoverLetter": "No cover letter provided.",
        "readMore": "Read more",
        "showLess": "Show less",
        "receivedOn": "Received",
        "proposalBid": "Bid Amount",
        "days": "days",
        "deliveryTbd": "TBD",
        "hire": "Hire",
        "unarchive": "Unarchive",
        "message": "Chat",
        "save": "Save",
        "saved": "Saved",
        "modal": {
            "tabProposal": "Proposal",
            "tabProfile": "Profile",
            "tabPortfolio": "Portfolio",
            "tabReviews": "Reviews",
            "freelancer": "Freelancer",
            "available": "Available",
            "busy": "Busy",
            "rating": "Rating",
            "jobsDone": "Jobs Completed",
            "successRate": "Success Rate",
            "reviews": "Reviews",
            "responseTime": "Response Time",
            "responseTimeValue": "~1 hour",
            "about": "About",
            "noProfile": "No profile information available.",
            "noPortfolio": "No portfolio items",
            "noPortfolioHint": "The freelancer has not added portfolio items yet.",
            "noReviews": "No reviews yet",
            "noReviewsHint": "Reviews will appear after completed contracts.",
            "submittedOn": "Submitted",
            "coverLetter": "Cover Letter",
            "attachments": "Attachments",
            "proposalDetails": "Proposal Details",
            "freelancerBid": "Freelancer's bid",
            "delivery": "Delivery",
            "serviceFee": "Service fee (5%)",
            "total": "Total to pay",
            "escrowNote": "Payment is held in escrow until you approve the delivered work.",
            "confirmHire": "Hire this freelancer?",
            "confirmHireDesc": "A contract will be created and payment held in escrow.",
            "confirmYes": "Yes, Hire!",
            "archive": "Archive Proposal",
            "unarchive": "Unarchive Proposal",
            "accepted": "Accepted",
            "rejected": "Not Selected"
        }
    },
    "jobDetail": {
        "defaultCity": "Tunis",
        "removeFromSaves": "Remove from saves",
        "saveJob": "Save this job",
        "shareJob": "Share this job",
        "referenceLinks": "Reference links",
        "attachmentLabel": "Attachment {{index}}",
        "openFile": "Open file",
        "fileType": "FILE",
        "proposalAccepted": "Your proposal was accepted",
        "proposalDeclined": "Your proposal was declined",
        "proposalWithdrawnTitle": "Your proposal was withdrawn",
        "proposalAcceptedStatus": "Accepted",
        "proposalDeclinedStatus": "Declined",
        "proposalWithdrawnStatus": "Withdrawn",
        "proposalPendingStatus": "Pending",
        "clientCantApplyTitle": "Client accounts cannot apply",
        "loginRequiredTitle": "Sign in to apply",
        "completeOnboardingTitle": "Complete onboarding first",
        "completeProfileTitle": "Complete your profile",
        "cannotApplyTitle": "Cannot apply yet",
        "switchToFreelancer": "Switch to Freelancer",
        "signIn": "Sign in",
        "completeNow": "Complete now",
        "confirmWithdrawal": "Confirm Withdrawal",
        "withdrawConfirmDesc": "Are you sure you want to withdraw this proposal? This action cannot be undone.",
        "yesWithdraw": "Yes, Withdraw",
        "reportJobTitle": "Report Job",
        "reportJobDescription": "Tell us why this job violates our community guidelines.",
        "submitReport": "Submit Report",
        "reportReason": {
            "spam": "Spam",
            "misleading": "Misleading",
            "inappropriate": "Inappropriate",
            "fraud": "Fraud",
            "other": "Other"
        },
        "hireRate": "Hire Rate",
        "avgHourlyPaid": "Avg Hourly Paid",
        "paymentMethodVerified": "Payment method verified",
        "phoneNumberVerified": "Phone number verified",
        "emailAddressVerified": "Email address verified",
        "clientVerifications": "Verifications",
        "inlineRemainingHint": "{{remaining}} applications available",
        "inlineRechargingHint": "Recharging in",
        "clientRatingText": "{{rating}} of 5 reviews",
        "avgHourlyPaidFormat": "{{rate}} TND/hr",
        "defaultTotalSpent": "15k+ TND",
        "defaultMemberSince": "Mar 2026",
        "jobSaved": "Job saved",
        "jobRemoved": "Job removed from saved",
        "error": "An error occurred",
        "loginToSave": "Login to save job",
        "proposalSent": "Proposal sent successfully!",
        "proposalError": "Error submitting proposal",
        "proposalWithdrawn": "Proposal withdrawn successfully",
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
        "postedLabel": "Posted",
        "budget": "Budget",
        "perHour": "/hour",
        "approxHours": "(approx {{count}} hours)",
        "description": "Job Description",
        "requiredSkills": "Required Skills",
        "attachments": "Attachments",
        "file": "File {{index}}",
        "defaultClient": "Client",
        "jobNotFound": "Job not found",
        "submitProposal": "Submit Proposal",
        "withdrawProposal": "Withdraw Proposal",
        "browseJobs": "Browse Jobs",
        "submissionRequirements": "Submission Requirements",
        "readyToSubmit": "Ready to submit",
        "insufficientBalance": "Daily limit reached",
        "balance": "Used today",
        "required": "Daily limit",
        "remaining": "Remaining",
        "used": "Used",
        "limit": "Limit",
        "dailyApplyLimitTitle": "Daily application limit",
        "dailyApplyLimitDescription": "To reduce spam, you can submit up to {{limit}} proposals per day.",
        "dailyApplyLimitReached": "You reached your daily limit of {{limit}} applications. Try again tomorrow.",
        "dailyApplyAvailable": "Available today",
        "dailyApplyReached": "Limit reached",
        "dailyApplyRemainingHint": "{{remaining}} applications remaining today.",
        "dailyApplyResetHint": "Daily limit reached. You can apply again tomorrow.",
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
        "jobStats": "Job Stats",
        "similarJobs": "Similar jobs",
        "proposalSubmitted": "Your proposal was submitted",
        "yourBid": "Your bid:",
        "viewProposal": "View proposal",
        "yourJob": "This is your job",
        "manageJob": "Manage job"
    },
    "proposalModal": {
        "jobContext": "JOB CONTEXT",
        "platformFee": "Platform fee ({{percent}}%)",
        "youReceive": "You will receive",
        "deliveryTime": "Delivery time",
        "coverLetter": "Cover letter",
        "coverLetterPlaceholder": "Describe your approach, relevant experience, and why you're the best fit for this job...",
        "coverLetterMinHint": "Minimum {{count}} characters",
        "attachmentsOptional": "Attachments (optional)",
        "addFile": "Add File",
        "fileLimit": "Max {{size}}MB per file",
        "title": "Submit Proposal",
        "bidLabel": "Your bid:",
        "cancel": "Cancel",
        "submit": "Submit Proposal",
        "submitting": "Submitting...",
        "delivery": {
            "oneDay": "1 day",
            "twoDays": "2 days",
            "threeDays": "3 days",
            "fiveDays": "5 days",
            "oneWeek": "1 week",
            "twoWeeks": "2 weeks",
            "oneMonth": "1 month",
            "twoMonths": "2 months"
        },
        "validation": {
            "coverLetterMin": "Cover letter must be at least {{count}} characters",
            "coverLetterMax": "Cover letter must be less than {{count}} characters",
            "bidMin": "Minimum bid is {{amount}} {{currency}}",
            "bidMax": "Maximum bid is {{amount}} {{currency}}",
            "deliveryMin": "Minimum delivery is {{count}} day",
            "deliveryMax": "Maximum delivery is {{count}} days"
        }
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
        "auth": {
            "welcomeBack": "Welcome back, {{name}} 👋",
            "dashboard": "Go to Dashboard"
        },
        "typewriter": {
            "freelancer": {
                "workWithBest": "Work with the best.",
                "getPaidOnTime": "Get paid on time.",
                "buildYourCareer": "Build your career."
            },
            "client": {
                "trustedConnections": "Trusted connections.",
                "qualityCollaboration": "Quality collaboration.",
                "securePayments": "Secure payments."
            }
        },
        "freelancer": {
            "panelTitle": "How it works",
            "eyebrow": "Built in Tunisia. Built for Tunisia.",
            "titleTop": "Quality work.",
            "titleAccent": "Fair opportunities.",
            "subtitle": "Connect with quality projects or find skilled professionals. Transparent terms, secure payments in TND.",
            "cta": "Get Started",
            "secondary": "Explore Platform",
            "trust": {
                "payouts": "Protected payments",
                "matched": "Quality matching",
                "reputation": "Build reputation"
            },
            "stats": {
                "professionals": {
                    "default": "2,500",
                    "label": "Professionals"
                },
                "contracts": {
                    "default": "120",
                    "label": "Active projects"
                },
                "rating": {
                    "value": "4.9/5",
                    "label": "Avg. rating"
                }
            },
            "features": {
                "apply": {
                    "title": "Connect with the right people",
                    "subtitle": "Quality matches for clients and freelancers"
                },
                "verify": {
                    "title": "Verified local profiles",
                    "subtitle": "Build trust before the first message"
                },
                "track": {
                    "title": "Track milestones and payments",
                    "subtitle": "Everything secured and transparent"
                }
            },
            "promise": "Better presentation helps everyone build trust and successful collaborations."
        },
        "client": {
            "panelTitle": "Why WorkedIn",
            "eyebrow": "Built in Tunisia. Ready for serious work.",
            "titleTop": "Quality work.",
            "titleAccent": "Trusted connections.",
            "subtitle": "Connect with verified professionals or find quality projects. Built for serious collaboration.",
            "cta": "Get Started",
            "secondary": "Explore Platform",
            "trust": {
                "verified": "Verified profiles",
                "faster": "Quality matching",
                "escrow": "Protected payments"
            },
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
                    "value": "4.9/5",
                    "label": "Avg. trust score"
                }
            },
            "features": {
                "post": {
                    "title": "Connect with the right people",
                    "subtitle": "Quality matches for clients and freelancers"
                },
                "review": {
                    "title": "Verified local profiles",
                    "subtitle": "Trust signals appear before the first message"
                },
                "manage": {
                    "title": "Secure milestone payments",
                    "subtitle": "Payments stay protected until approval"
                }
            },
            "promise": "Better presentation helps everyone trust the platform and build successful collaborations."
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
        "secondary": "Post a project",
        "goToDashboard": "Go to Dashboard",
        "clientDashboard": "Client Dashboard",
        "browseJobs": "Browse Jobs",
        "findFreelancers": "Find Freelancers"
    },
    "clientProfile": {
        "notFound": "Client not found",
        "notFoundDesc": "This profile does not exist or has been removed.",
        "previewTitle": "Public Profile Preview",
        "previewDesc": "You are viewing your profile as other users see it.",
        "exitPreview": "Exit Preview",
        "client": "Client",
        "localTime": "{{time}} local time",
        "reviewsCount": {
            "one": "{{count}} review",
            "other": "{{count}} reviews"
        },
        "jobsPostedCount": {
            "one": "{{count}} job posted",
            "other": "{{count}} jobs posted"
        },
        "memberSinceLabel": "Member since",
        "copied": "Copied!",
        "share": "Share",
        "businessOwner": "Business Owner",
        "specializedIn": "Specialized in {{industry}}",
        "noBio": "No biography or about details provided yet.",
        "addDescription": "+ Add description",
        "companyInformation": "Company Information",
        "noCompanyDetails": "No company details added yet.",
        "hiringNeeds": "Hiring Needs",
        "hiringPreferences": "Hiring Preferences & Details",
        "activeJobs": "Active Job Postings",
        "postJob": "Post a Job",
        "proposalsCount": {
            "one": "{{count}} proposal",
            "other": "{{count}} proposals"
        },
        "upTo": "Up to",
        "apply": "Apply",
        "noActiveJobs": "No active job postings yet",
        "noActiveJobsDesc": "Post projects, launch milestone tasks, and collaborate with Top Freelancers.",
        "postFirstJob": "Post your first job",
        "workHistory": "Work History & Reviews",
        "by": "by",
        "noReviewsYet": "No reviews yet. Complete your first contract with a freelancer to receive feedback.",
        "hiringAndStats": "Hiring & Stats",
        "hiringStatus": "Hiring Status",
        "paymentVerified": "Payment Verified",
        "standardStatus": "Standard",
        "locationLabel": "Location",
        "jobsPostedLabel": "Jobs Posted",
        "completedContractsLabel": "Completed Contracts",
        "totalSpentLabel": "Total spent",
        "avgRatingLabel": "Average Rating",
        "linksTitle": "Links & Resources",
        "companyWebsite": "Company Website",
        "noLinks": "No links added yet.",
        "verificationsTitle": "Verifications",
        "verifications": {
            "identity": "Identity Verified",
            "phone": "Phone Number",
            "payment": "Payment Method"
        },
        "workspaceControls": "Workspace Controls",
        "myProjects": "My Projects",
        "settings": "Settings"
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
            "name": "Français",
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
            "hero": {
                "workSmarter": "Work smarter.",
                "earnFairly": "Earn fairly."
            },
            "form": {
                "welcomeBack": "Welcome back.",
                "subtitle": "Sign in to your WorkedIn workspace.",
                "google": "Continue with Google",
                "orEmail": "or sign in with email",
                "forgotPassword": "Forgot password?",
                "createOne": "Create one",
                "emailLabel": "Email",
                "passwordLabel": "Password",
                "signingIn": "Signing in…",
                "signInButton": "Sign in →",
                "noAccount": "Don't have an account?"
            },
            "platformTagline": "# Tunisia's Freelance Platform",
            "platformSubtitle": "Connect with verified talent, manage projects securely, and get paid in TND — every time.",
            "featureCards": {
                "verified": {
                    "title": "Verified profiles",
                    "sub": "Every identity confirmed"
                },
                "escrow": {
                    "title": "Escrow payments",
                    "sub": "Funds held until delivery"
                },
                "local": {
                    "title": "Local & global",
                    "sub": "Optimised for Tunisia"
                }
            },
            "createAccountAction": "Create account",
            "finishingSignIn": "Securing session...",
            "finishingSignInDescription": "Hang tight while we prepare your workspace.",
            "rateLimitError": "Too many attempts. Please try again later."
        },
        "signup": {
            "badge": "Join WorkedIn",
            "heroTitle": "Ready for your next big project?",
            "heroTitleTop": "Ready for your",
            "heroTitleAccent": "next big project?",
            "heroDescription": "Join thousands of professionals across Tunisia. Set up your workspace and start working in minutes.",
            "featureCards": {
                "verified": {
                    "title": "Verified profiles",
                    "sub": "Every identity confirmed"
                },
                "escrow": {
                    "title": "Escrow payments",
                    "sub": "Funds held until delivery"
                },
                "local": {
                    "title": "Local & global",
                    "sub": "Optimised for Tunisia"
                }
            },
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
            "rateLimitError15Min": "Too many attempts. Please try again in 15 minutes.",
            "formTitle": "Create your account",
            "formSubtitle": "Join 2,500+ professionals on WorkedIn",
            "continueWithGoogle": "Continue with Google",
            "orSignUpWithEmail": "or sign up with email",
            "emailLabel": "Email",
            "emailPlaceholder": "you@example.com",
            "passwordLabel": "Password",
            "confirmPasswordLabel": "Confirm Password",
            "creatingAccount": "Creating account…",
            "createAccountButton": "Create account →",
            "alreadyHaveAccount": "Already have an account?",
            "signInLink": "Sign in"
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
        "iban": "IBAN Number",
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
        "workedin": "WorkedIn •",
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
    "dynamic_key_229505028": "The other party is typing...",
    "dynamic_key_1393796300": "Uploading file...",
    "dynamic_key_1524267": "TND",
    "dynamic_key_218823582": "An unexpected error occurred",
    "dynamic_key_426109629": "Sorry, an error occurred while loading the page. Please try again.",
    "dynamic_key_131381918": "Retry",
    "dynamic_key_1999631066": "Home",
    "dynamic_key_1080932848": "Project Title",
    "dynamic_key_1805513405": "Example: E-commerce store design",
    "dynamic_key_1163187178": "Project Description",
    "dynamic_key_1785209048": "Describe the project details and what you accomplished...",
    "dynamic_key_1347768947": "Project Link (optional)",
    "dynamic_key_1972795761": "Completion Date",
    "dynamic_key_1333999920": "Skills Used",
    "dynamic_key_454607345": "Example: UI design, frontend dev, photo editing (comma separated)",
    "dynamic_key_392258297": "Thumbnail Image URL",
    "dynamic_key_1144928517": "File uploads coming soon. Please use a direct image URL for now.",
    "dynamic_key_1502065525": "Cancel",
    "dynamic_key_1115664379": "(500 characters max)",
    "dynamic_key_2009227315": "Your audio introduction has been recorded",
    "dynamic_key_2123673725": "Your wallet hasn't been created yet",
    "dynamic_key_1505988461": "Refresh",
    "dynamic_key_214509631": "My Wallet",
    "dynamic_key_208308034": "Available Balance",
    "dynamic_key_243096717": "Pending",
    "dynamic_key_1109099118": "Total Earnings",
    "dynamic_key_891367863": "Request Withdrawal",
    "dynamic_key_1607514557": "Recent Transactions",
    "dynamic_key_1954172192": "View All",
    "dynamic_key_481289425": "No transactions yet",
    "dynamic_key_300689867": "Withdrawal request submitted",
    "dynamic_key_71417736": "Your request will be reviewed and the amount transferred within 2-5 business days",
    "dynamic_key_812168715": "Amount Requested",
    "dynamic_key_939059608": "Withdrawal Method",
    "dynamic_key_1637895873": "Bank Name",
    "dynamic_key_76026069": "Example: National Agricultural Bank",
    "dynamic_key_475558032": "Account Holder Name",
    "dynamic_key_215587664": "Full name as it appears on bank account",
    "dynamic_key_223878144": "Phone Number",
    "dynamic_key_1004386723": "Your withdrawal request will be reviewed by admin and transferred within 2-5 business days.",
    "dynamic_key_1793704877": "Sending...",
    "dynamic_key_2071445136": "Submit Withdrawal Request",
    "dynamic_key_936673124": "Job Details",
    "dynamic_key_857615762": "Budget",
    "dynamic_key_236480406": "Expected Duration",
    "dynamic_key_2053478334": "Posted Date",
    "dynamic_key_220193727": "Share",
    "dynamic_key_1543783939": "View Job",
    "dynamic_key_197805234": "AI Recommendations",
    "dynamic_key_1253092729": "We analyzed your requirements and found 3 freelancers matching your project at 95%.",
    "dynamic_key_232051787": "View Recommendations",
    "dynamic_key_49410394": "Verified",
    "dynamic_key_1530855304": "Top Rated",
    "dynamic_key_1824767388": "Completed Job",
    "dynamic_key_49413132": "Success",
    "dynamic_key_1337275137": "Read more...",
    "dynamic_key_1593775": "ago",
    "dynamic_key_422731376": "Thoughtful Bid",
    "dynamic_key_451961555": "Delivery Time",
    "dynamic_key_1598663": "day",
    "dynamic_key_1102070523": "Total Cost",
    "dynamic_key_1506801489": "Hire",
    "dynamic_key_2137084368": "Rating",
    "dynamic_key_611934998": "Completed Projects",
    "dynamic_key_1659906949": "Success Rate",
    "dynamic_key_29050573": "Response Speed",
    "dynamic_key_1259492927": "approx. hours",
    "dynamic_key_1693322708": "Skills",
    "dynamic_key_1718339647": "Applied",
    "dynamic_key_365411007": "Cover Letter",
    "dynamic_key_1712849267": "Attachments",
    "dynamic_key_1039014200": "About Me",
    "dynamic_key_623032746": "Languages",
    "dynamic_key_2144569262": "Arabic",
    "dynamic_key_1262868023": "Native",
    "dynamic_key_1827230247": "French",
    "dynamic_key_1530851603": "Advanced",
    "dynamic_key_2133212330": "Work Sample 1 (image)",
    "dynamic_key_418944631": "Work Sample 2 (image)",
    "dynamic_key_1842506838": "Work history not available in this preview",
    "dynamic_key_41921266": "Reviews not available in this preview",
    "dynamic_key_617719072": "Proposal Details",
    "dynamic_key_549959251": "Proposal Value",
    "dynamic_key_1265703203": "Service Fee",
    "dynamic_key_614661587": "Total to Pay",
    "dynamic_key_1111663922": "💡 Payment is safely held in escrow until work is delivered and approved.",
    "dynamic_key_2071077264": "Hire Now",
    "dynamic_key_217425117": "Message",
    "dynamic_key_6717295": "Archive Proposal",
    "dynamic_key_872049934": "Filter Proposals",
    "dynamic_key_1581598": "proposal",
    "dynamic_key_1015995410": "Search proposals...",
    "dynamic_key_476684698": "Sort by",
    "dynamic_key_934974283": "Recommended (Best Match)",
    "dynamic_key_1716602825": "Lowest Price",
    "dynamic_key_432874841": "Highest Price",
    "dynamic_key_624028093": "Newest",
    "dynamic_key_596156750": "Freelancer Rating",
    "dynamic_key_1545985538": "Freelancer Level",
    "dynamic_key_1530768926": "Beginner",
    "dynamic_key_1475699192": "Intermediate",
    "dynamic_key_48695393": "Expert",
    "dynamic_key_525136044": "Other Features",
    "dynamic_key_1797922455": "Verified accounts only",
    "dynamic_key_1828865552": "4-star rating and above",
    "dynamic_key_257908957": "Has portfolio",
    "dynamic_key_928208723": "Proposal Value (TND)",
    "dynamic_key_1544269147": "Platform fee (",
    "dynamic_key_403517891": "You will receive",
    "dynamic_key_452524680": "Delivery Period",
    "dynamic_key_1113257013": "Proposal Message",
    "dynamic_key_1072185127": "Explain why you are the right person for this project...",
    "dynamic_key_1611325765": "Must write at least 100 characters",
    "dynamic_key_1608485352": "Attachments (optional)",
    "dynamic_key_1991592213": "Upload File",
    "dynamic_key_545901654": "You can upload PDF or image files up to 10MB",
    "dynamic_key_1655363803": "Submit Proposal",
    "dynamic_key_1506640045": "Rating",
    "dynamic_key_1789330939": "Reviews (",
    "dynamic_key_1503344713": "Highest Rated",
    "dynamic_key_496366041": "Lowest Rated",
    "dynamic_key_1761004867": "Most Helpful",
    "dynamic_key_238952578": "View Details",
    "dynamic_key_860054720": "Owner Reply",
    "dynamic_key_233190025": "Helpful (",
    "dynamic_key_1501241012": "Report",
    "dynamic_key_2134028980": "No reviews yet",
    "dynamic_key_220511911": "Project:",
    "dynamic_key_380610698": "Overall Rating",
    "dynamic_key_685712071": "Detailed Ratings",
    "dynamic_key_1594354": "Yes",
    "dynamic_key_51299": "No",
    "dynamic_key_1546829780": "Written Review (optional)",
    "dynamic_key_1591556203": "Share your experience with others",
    "dynamic_key_829255241": "What did you like? What could be improved? Would you recommend?",
    "dynamic_key_1529240342": "Privacy Settings",
    "dynamic_key_234965878": "Note",
    "dynamic_key_1087307158": "Reviews are permanent and cannot be edited. The other party can reply to your review.",
    "dynamic_key_1647529322": "Skip for now",
    "dynamic_key_1679990796": "Submit Review",
    "dynamic_key_1500402850": "There are no items to display at the moment.",
    "dynamic_key_571944939": "Get started by creating your first project.",
    "dynamic_key_854531310": "Try adjusting your search or filters to find what you're looking for.",
    "dynamic_key_1725907738": "We couldn't load your data. Please try again.",
    "dynamic_key_890920977": "Freelancer's Reply:",
    "dynamic_key_50718": "Reply",
    "dynamic_key_2001555607": "Reply to Review",
    "dynamic_key_18255446": "Write your reply to review",
    "dynamic_key_979253881": "Write your reply here...",
    "dynamic_key_639337527": "Send Reply",
    "dynamic_key_1016245850": "Your rating for",
    "dynamic_key_2132806281": "Task:",
    "dynamic_key_669258706": "Your comment (optional)",
    "dynamic_key_72742741": "Share your experience with this person...",
    "dynamic_key_48788556": "Back",
    "dynamic_key_1842976832": "Best Match",
    "dynamic_key_1225650541": "Running...",
    "dynamic_key_1739654371": "Work Sample",
    "dynamic_key_1501416850": "Hide",
    "dynamic_key_9853380": "Repeat Client",
    "dynamic_key_1573622": "Earned",
    "dynamic_key_193923978": "A contract will be created between you and this freelancer. Are you sure?",
    "dynamic_key_1053149402": "Payment Failed",
    "dynamic_key_1348454276": "Troubleshooting tips:",
    "dynamic_key_1707230249": "• Check your card details are correct",
    "dynamic_key_158612530": "• Make sure you have sufficient balance",
    "dynamic_key_201330750": "• Try a different card",
    "dynamic_key_1659410812": "• Check your internet connection",
    "dynamic_key_1933160140": "Back to Contract",
    "dynamic_key_128175915": "Home",
    "dynamic_key_331518742": "If the problem persists, contact technical support",
    "dynamic_key_374761519": "Verifying payment...",
    "dynamic_key_1821001923": "Please wait while we verify your payment",
    "dynamic_key_1798326885": "Payment Successful! 🎉",
    "dynamic_key_831489996": "Payment funded successfully. Funds are securely held.",
    "dynamic_key_480999927": "Redirecting you automatically...",
    "dynamic_key_730815621": "Go to Contract",
    "dynamic_key_1762109572": "Payment Verification Failed",
    "dynamic_key_764967864": "Return to Dashboard",
    "auto": {
        "escrow_not_funded_ye": "Escrow not funded yet"
    },
    "toast": {
        "close": "Close",
        "success": "Success",
        "error": "Error",
        "warning": "Warning",
        "info": "Info"
    },
    "contractWorkspace": {
        "clientView": "Client view",
        "freelancerView": "Freelancer view",
        "notFound": "Contract not found or you do not have access.",
        "notParticipant": "You are not a participant in this contract.",
        "loadError": "Failed to load contract details. Please try again.",
        "unableToLoad": "Unable to load workspace",
        "openToDeliver": "Open this contract in Messages to deliver work.",
        "openToRequestChanges": "Open this contract in Messages to request changes.",
        "openToReleasePay": "Open this contract in Messages to release payment.",
        "openToDispute": "Open this contract in Messages to open a dispute."
    }
};
