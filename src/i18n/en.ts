import type { Translations } from './ar';

export const en: Translations = {
    nav: {
        home: 'Home',
        howItWorks: 'How It Works',
        forFreelancers: 'For Freelancers',
        forClients: 'For Clients',
        pricing: 'Pricing',
        login: 'Login',
        signup: 'Sign Up',
        dashboard: 'Dashboard',
        jobs: 'Available Jobs',
        messages: 'Messages',
        profile: 'Profile',
        settings: 'Settings',
        logout: 'Logout',
        findWork: 'Find Work',
        findFreelancers: 'Find Freelancers',
        findFreelancersTitle: 'Find Freelancers',
        myJobs: 'My Jobs',
        saved: 'Saved',
    },
    jobs: {
        title: 'Available Jobs',
        searchPlaceholder: 'Search for jobs...',
        filters: {
            title: 'Filters',
            clearAll: 'Clear All',
            categories: {
                title: 'Category',
                design: 'Design',
                development: 'Development',
                writing: 'Writing',
                marketing: 'Marketing',
                translation: 'Translation',
                video: 'Video & Animation',
                business: 'Business',
                data: 'Data Entry',
                other: 'Other'
            },
            jobType: {
                title: 'Job Type',
                fixed_price: 'Fixed Price',
                hourly: 'Hourly'
            },
            budget: {
                title: 'Budget (TND)',
                all: 'All',
                min: 'Min',
                max: 'Max',
                ranges: {
                    r0_50: '0 - 50 TND',
                    r50_100: '50 - 100 TND',
                    r100_250: '100 - 250 TND',
                    r250_500: '250 - 500 TND',
                    r500_plus: '500+ TND'
                }
            },
            experience: {
                title: 'Experience Level',
                entry: 'Entry Level',
                intermediate: 'Intermediate',
                expert: 'Expert'
            },
            postedDate: {
                title: 'Posted Date',
                any: 'Any Time',
                h24: 'Last 24 Hours',
                d3: 'Last 3 Days',
                w1: 'Last Week',
                m1: 'Last Month'
            },
            viewResults: 'View Results'
        },
        sort: {
            newest: 'Newest First',
            budgetHigh: 'Budget: High to Low',
            budgetLow: 'Budget: Low to High',
            proposalsHigh: 'Most Proposals',
            proposalsLow: 'Fewest Proposals'
        },
        stats: {
            availableJobs: 'jobs available'
        },
        empty: {
            title: 'No jobs found',
            subtitle: 'Try changing your search criteria or filters',
            action: 'Clear Filters'
        },
        loadMore: 'Load More',
        save: 'Save Job',
        saved: 'Job Saved',
        unsave: 'Unsave Job',
        apply: 'Apply Now',
        postedAgo: 'Posted {{time}}',
        budget: 'Budget',
        hourlyRate: 'Hourly Rate',
        proposals: 'proposals',
        verifiedPayment: 'Payment Verified',
        unverifiedPayment: 'Payment Unverified',
        newClient: 'New Client',
        savedJobs: {
            title: 'Saved Jobs',
            viewAll: 'View All'
        },
        time: {
            now: 'Just now',
            minute: 'min',
            hour: 'h',
            day: 'd',
            ago_prefix: '',
            ago: 'ago'
        },
        location: {
            remote: 'Remote'
        }
    },

    hero: {
        title: 'The Freelance Platform Built for Tunisia',
        subtitle: 'No bidding, no complications, just your skills and your money',
        ctaFreelancer: 'Start as Freelancer',
        ctaClient: 'Post a Job',
        badge: '100% Tunisian Freelance Platform',
        trust: {
            verified: 'Verified Tunisians',
            secure: '100% Secure Payment',
            users: 'Users',
        },
    },
    home: {
        stats: {
            live: 'Live Stats',
            activeJobs: 'Active Jobs',
            users: 'Users',
            rating: 'Rating',
        },
        sections: {
            howItWorks: {
                badge: 'How It Works',
                subtitle: 'A simple and effective system connecting you with top talent or best opportunities',
                freelancerDesc: 'Find work easily',
                clientDesc: 'Hire top talent',
            },
            categories: {
                badge: 'Categories',
                subtitle: 'Discover skills in demand in the Tunisian market',
            },
            testimonials: {
                badge: 'Success Stories',
                earned: 'Earned',
            },
            cta: {
                badge: 'Start Your Journey',
                title: 'Ready to Start?',
                subtitle: 'Join thousands of Tunisians building their careers with us. Registration is free and easy.',
                btnStart: 'Start Now for Free',
                btnWatch: 'Watch How It Works',
            },
        },
    },

    values: {
        noBidding: {
            title: 'No Bidding',
            description: 'We select the 3 best freelancers for you',
        },
        localPayment: {
            title: 'Local Payment',
            description: 'D17, bank transfer, or cash',
        },
        microJobs: {
            title: 'Quick Jobs',
            description: 'Starting from 10 dinars',
        },
    },
    // How It Works
    howItWorks: {
        title: 'How It Works',
        heroTitle: 'How It Works',
        brandName: 'Khedma',
        subtitle: 'Your secure freelance platform in Tunisia. We connect Tunisian talent with ambitious project owners simply and securely.',
        tabs: {
            freelancer: 'For Freelancers',
            client: 'For Clients',
        },
        cta: {
            freelancer: 'Start Your Career',
            client: 'Post Your First Job',
        },
        freelancerSteps: [
            {
                title: "Create Professional Profile",
                description: "Register for free and complete your profile. Add your skills, portfolio, and a voice intro to introduce yourself."
            },
            {
                title: "Receive Job Offers",
                description: "No need to bid! Our algorithm matches you with jobs that fit your skills and connects you directly with clients."
            },
            {
                title: "Connect & Agree",
                description: "Discuss details via live chat, agree on price and deadline, and start working immediately after approval."
            },
            {
                title: "Secure Payment",
                description: "We guarantee payment upon delivery. Withdraw your earnings easily via D17, bank transfer, or cash."
            }
        ],
        clientSteps: [
            {
                title: "Post Your Project",
                description: "Describe what you need, set budget and deadline. Posting is free and very simple."
            },
            {
                title: "Choose the Best",
                description: "We'll shortlist the top 3 freelancers for you. Compare them, listen to their voice intros, and view portfolios."
            },
            {
                title: "Track Progress",
                description: "Communicate with your chosen freelancer, track work progress, and request revisions as needed."
            },
            {
                title: "Receive & Rate",
                description: "Only pay when you are satisfied with the result. Rate the freelancer to help others choose."
            }
        ],
        trust: {
            money: { title: '100% Money Back', desc: 'Funds held securely until work is approved' },
            verified: { title: 'Verified IDs', desc: 'We verify all users for a safe working environment' },
            support: { title: 'Local Support', desc: 'Tunisian support team ready to help anytime' },
        },
        faq: {
            title: 'Common Questions',
            items: [
                { q: "Is registration free?", a: "Yes, registration is completely free for both freelancers and clients. We only charge a small commission on successful projects." },
                { q: "How is my money secured?", a: "Khedma acts as a trusted intermediary. Clients pay us, we hold funds until delivery is approved, then release to the freelancer." },
                { q: "What payment methods?", a: "We support all local Tunisian methods: local/int'l cards, D17, bank transfer, and even cash for small amounts." },
                { q: "Can I register as a company?", a: "Yes, you can register a company account to hire staff or offer services as a team." }
            ]
        }
    },

    // For Clients Page
    forClients: {
        hero: {
            badge: "Top Tunisian Talent in One Place",
            title: "Get your projects done fast and with high quality with",
            subtitle: "Post your project for free and receive offers from verified Tunisian professionals. Pay only upon delivery and satisfaction.",
            cta: "Post Your Project Now",
            secondary: "How It Works?"
        },
        benefits: {
            speed: { title: "Fast Hiring", desc: "Get top candidates within minutes. Our smart algorithms match you instantly." },
            secure: { title: "Secure Payment", desc: "We don't release funds to the freelancer until you receive and approve the work." },
            local: { title: "Local Talent", desc: "Work with professionals who understand your culture, speak your language, and accept local payments." },
        },
        categories: {
            title: "Get Anything Done",
            items: ['Development', 'Design & Creative', 'Writing & Translation', 'Sales & Marketing', 'Video & Animation', 'Engineering', 'Support', 'Education']
        },
        talent: {
            title: "Top Talent Examples",
        },
        cta: {
            title: "Ready to take your project to the next level?",
            text: "Thousands of Tunisian professionals are waiting for your opportunity. Don't waste time, start now.",
            button: "Sign Up as Client Free",
        }
    },

    categories: {
        title: 'Categories',
        graphicDesign: 'Graphic Design',
        webDev: 'Web Development',
        translation: 'Translation',
        videoEditing: 'Video Editing',
        contentWriting: 'Content Writing',
        dataEntry: 'Data Entry',
        digitalMarketing: 'Digital Marketing',
        photography: 'Photography',
        uiux: 'UI/UX Design',
        mobileApp: 'Mobile Development',
        availableJobs: 'jobs available',
    },

    counter: {
        title: 'dinars earned by Tunisians this month',
    },

    testimonials: {
        title: 'Success Stories',
        items: [
            {
                name: 'Mohamed Ali',
                role: 'Graphic Designer',
                quote: 'Thanks to Khedma.tn, I earned over 5000 TND in just 2 months. The platform is easy to use and payment is fast.',
                earned: '5,200',
                image: 'https://i.pravatar.cc/150?img=11'
            },
            {
                name: 'Fatima Ben Said',
                role: 'Translator',
                quote: 'The best freelance platform in Tunisia. No bidding wars, clients find me automatically.',
                earned: '3,800',
                image: 'https://i.pravatar.cc/150?img=32'
            },
            {
                name: 'Ahmed El Hadi',
                role: 'Web Developer',
                quote: 'Local payment made everything easy. D17 or bank transfer, all methods are available.',
                earned: '8,500',
                image: 'https://i.pravatar.cc/150?img=53'
            }
        ]
    },

    auth: {
        phone: 'Phone Number',
        phonePlaceholder: 'Enter your phone number',
        email: 'Email',
        emailPlaceholder: 'Enter your email',
        password: 'Password',
        passwordPlaceholder: 'Enter your password',
        confirmPassword: 'Confirm Password',
        confirmPasswordPlaceholder: 'Re-enter your password',
        sendCode: 'Send Verification Code',
        verifyCode: 'Verification Code',
        verify: 'Verify',
        resendCode: 'Resend Code',
        resendIn: 'Resend in',
        seconds: 'seconds',
        selectUserType: 'Choose your account type',
        freelancer: 'Freelancer',
        client: 'Client',
        both: 'Both',
        completeProfile: 'Complete Registration',
        createAccount: 'Create Account',
        loginSubtitle: 'Enter your email and password',
        signupSubtitle: 'Create your account to get started',
        noAccount: "Don't have an account?",
        hasAccount: 'Already have an account?',
        invalidCredentials: 'Invalid email or password',
        emailExists: 'This email is already registered',
        passwordMismatch: 'Passwords do not match',
        passwordMinLength: 'Password must be at least 6 characters',
        invalidEmail: 'Enter a valid email address',
        emailNotConfirmed: 'Email not confirmed',
        login: 'Login',
        signup: 'Sign Up',
        signOut: 'Sign Out',
        googleLogin: 'Continue with Google',
        googleLoginError: 'Google login failed',
        forgotPassword: 'Forgot password?',
        or: 'or',
        loggingOut: 'Logging out...',
    },

    profile: {
        fullName: 'Full Name',
        fullNamePlaceholder: 'Enter your full name',
        location: 'Governorate',
        selectLocation: 'Select your governorate',
        skills: 'Skills',
        selectSkills: 'Choose your skills (max 3)',
        workSamples: 'Work Samples',
        uploadSample: 'Upload a sample',
        dragDrop: 'Drag and drop files here',
        or: 'or',
        browse: 'Browse files',
        voiceIntro: 'Voice Introduction',
        recordVoice: 'Voice recording (30 seconds)',
        recording: 'Recording...',
        stopRecording: 'Stop recording',
        playRecording: 'Play recording',
        deleteRecording: 'Delete recording',
        companyName: 'Company Name',
        companyNamePlaceholder: 'Company name (optional)',
        optional: 'Optional',
        bio: 'About You',
        bioPlaceholder: 'Write a short bio...',
        education: {
            title: 'Education (Optional)',
            add: 'Add Education',
            institution: 'Institution / University',
            degree: 'Degree',
            field: 'Field of Study',
            startYear: 'Start Year',
            endYear: 'Graduation Year',
            delete: 'Delete',
            noEducation: 'Adding education increases your profile credibility',
        },
        languages: {
            title: 'Languages',
            add: 'Add Language',
            proficiency: 'Proficiency',
            select: 'Select Language',
            levels: {
                native: 'Native',
                fluent: 'Fluent',
                conversational: 'Conversational',
                basic: 'Basic',
            },
        },
    },

    dashboard: {
        welcome: 'Welcome back',
        jobsCompleted: 'jobs completed',
        totalEarnings: 'dinars',
        responseTime: 'hours',
        rating: 'Rating',
        availableJobs: 'Jobs matching your skills',
        all: 'All',
        new: 'New',
        urgent: 'Urgent',
        viewDetails: 'View Details',
        recentActivity: 'Recent Activity',
        updateProfile: 'Update Profile',
        profileCompletion: 'Profile Completion',
    },

    job: {
        title: 'Job Title',
        titlePlaceholder: 'Ex: Design a logo for a restaurant',
        description: 'Job Description',
        descriptionPlaceholder: 'Describe the job in detail...',
        budget: 'Budget',
        budgetHelp: 'Enter your total budget',
        deadline: 'Deadline',
        within1Day: 'Within 1 day',
        within3Days: 'Within 3 days',
        within1Week: 'Within 1 week',
        requiredSkills: 'Required Skills',
        paymentMethod: 'Payment Method',
        bankTransfer: 'Bank Transfer',
        d17: 'D17',
        cash: 'Cash on Delivery',
        postJob: 'Post Job',
        saveDraft: 'Save Draft',
        preview: 'Preview',
        matching: 'Finding freelancers...',
        matchesFound: '3 freelancers found!',
        estimatedTime: 'Within 1 hour',
    },

    selection: {
        topMatches: 'Top 3 freelancers for your job',
        matchScore: 'Match',
        completionRate: 'Completion rate',
        responseTimeLabel: 'Responds in',
        hours: 'hours',
        jobsCompleted: 'jobs',
        voiceIntro: 'Voice Introduction',
        noVoice: 'No voice intro',
        workSamples: 'Work Samples',
        noSamples: 'No samples',
        readMore: 'Read more',
        select: 'Select',
        viewFullProfile: 'View Full Profile',
        confirmSelection: 'Are you sure?',
        startWork: 'Yes, start working',
        cancel: 'Cancel',
    },

    contract: {
        chat: 'Chat',
        details: 'Details',
        sendMessage: 'Send a message...',
        attachFile: 'Attach file',
        send: 'Send',
        jobInfo: 'Job Information',
        daysLeft: 'Remaining',
        days: 'days',
        inProgress: 'In Progress',
        paymentInfo: 'Payment Information',
        awaitingDelivery: 'Awaiting delivery',
        awaitingApproval: 'Awaiting approval',
        deliverWork: 'Deliver Work',
        acceptAndPay: 'Accept and Pay',
        requestChanges: 'Request Changes',
        openDispute: 'Open Dispute',
        disputeOpened: 'Dispute Opened',
        disputeReview: 'Review within 48 hours',
    },

    publicProfile: {
        available: 'Available',
        busy: 'Busy',
        offline: 'Offline',
        memberSince: 'Member since',
        months: 'months',
        earned: 'Earned',
        skills: 'Skills',
        showMore: 'Show more',
        about: 'About',
        noBio: 'No bio yet',
        voiceIntro: 'Voice Introduction',
        workSamples: 'Work Samples',
        noSamples: 'No samples yet',
        reviews: 'Reviews',
        noReviews: 'No reviews yet',
        sendMessage: 'Send Message',
        editProfile: 'Edit Profile',
    },

    settings: {
        profile: 'Profile',
        account: 'Account',
        notifications: 'Notifications',
        payment: 'Payment',
        privacy: 'Privacy',
        language: 'Language',
        save: 'Save',
        saved: 'Saved',
        changePassword: 'Change Password',
        currentPassword: 'Current Password',
        newPassword: 'New Password',
        confirmPassword: 'Confirm Password',
        cinVerification: 'ID Verification',
        uploadCin: 'Upload ID',
        pending: 'Pending',
        verified: 'Verified',
        deleteAccount: 'Delete Account',
        deleteWarning: 'This action cannot be undone',
        notificationSettings: {
            newMatches: 'New job matches',
            newMessages: 'New messages',
            payments: 'Payments',
            contractUpdates: 'Contract updates',
            platformNews: 'Platform news',
        },
        deliveryMethod: {
            email: 'Email',
            sms: 'SMS',
            inApp: 'In-app only',
        },
        paymentMethods: 'Payment Methods',
        addPaymentMethod: 'Add payment method',
        preferredMethod: 'Preferred method',
        privacySettings: {
            profileVisibility: 'Profile visibility',
            public: 'Public',
            hidden: 'Hidden',
            whoCanMessage: 'Who can message you',
            anyone: 'Anyone',
            activeContracts: 'Active contracts only',
            showEarnings: 'Show earnings publicly',
        },
    },

    common: {
        loading: 'Loading...',
        error: 'Error',
        retry: 'Retry',
        next: 'Next',
        back: 'Back',
        submit: 'Submit',
        confirm: 'Confirm',
        cancel: 'Cancel',
        close: 'Close',
        search: 'Search',
        filter: 'Filter',
        sort: 'Sort',
        navigate: 'Navigate',
        select: 'Select',
        dinar: 'dinars',
        tnd: 'TND',
        time: {
            now: 'Just now',
            minute: 'm',
            hour: 'h',
            day: 'd',
            ago: 'ago',
        },
        toggleDarkMode: 'Toggle dark mode',
        toggleLightMode: 'Toggle light mode',
        openMenu: 'Open menu',
        closeMenu: 'Close menu',
        refresh: 'Refresh',
        save: 'Save',
        unsave: 'Unsave',
        verified: 'Verified',
        availableForWork: 'Available for work',
        replyToReview: 'Reply to review',
        from: 'From',
        to: 'To',
        optional: 'Optional',
        attachments: 'Attachments',
        writeReply: 'Write your reply here...',
        shareExperience: 'Share your experience with this person...',
        projectTitle: 'Project Title',
        projectTitlePlaceholder: 'Ex: Logo design for food company',
        projectDescription: 'Project Description',
        projectDescriptionPlaceholder: 'Describe project details, expected deliverables, and any special requirements...',
        bankName: 'Bank Name',
        bankNamePlaceholder: 'Ex: National Agricultural Bank',
        accountHolder: 'Account Holder Name',
        accountHolderPlaceholder: 'Name as it appears on bank account',
        searchPlaceholder: 'Search...',
        emailPlaceholder: 'Your email address',
        identityVerified: 'Identity Verified',
        saveFreelancer: 'Save freelancer',
        unsaveFreelancer: 'Unsave',
        typeMessage: 'Type your message here...',
        messageSubject: 'Message Subject',
        messageSubjectPlaceholder: 'Ex: Inquiry about design project...',
        messageContent: 'Message Content',
        messageContentPlaceholder: 'Write your message details here...',
        proposalPlaceholder: 'Explain why you are the right person for this project...',
        reviewPlaceholder: 'What did you like? What could be improved? Would you recommend them?',
        visibilityNote: 'If you need rare skills or have a sensitive project, "Invite Only" gives you more control. For public projects, "Public" ensures better price competition.',
        skillsUsed: 'Skills Used',
        skillsUsedPlaceholder: 'Ex: Photoshop, React, UI Design (comma separated)',
        thumbnailUrl: 'Thumbnail Image URL',
        projectUrl: 'Project URL',
        completionDate: 'Completion Date',
        searchProposals: 'Search proposals...',
        hourlyExample: 'Ex: 20',
        hoursExample: 'Ex: 10-20',
    },

    // Payment Modal
    payment: {
        completeTitle: 'Complete Payment',
        payVia: 'Pay via',
        d17Desc: 'Fastest payment method in Tunisia',
        scanD17: 'Scan code with D17 app',
        amount: 'Amount',
        recipient: 'Beneficiary',
        to: 'To',
        orEnterPhone: 'Or enter phone number',
        d17PhoneLabel: 'D17 Phone Number',
        flouciDesc: 'Your secure digital wallet',
        flouciRedirect: 'Redirecting to Flouci app for secure payment',
        openFlouci: 'Open Flouci App',
        secureTransaction: '100% Secure & Encrypted Transaction',
        creditCard: 'Credit Card',
        cardNumber: 'Card Number',
        expiryDate: 'Expiry Date',
        cardHolder: 'Card Holder Name',
        processing: 'Processing Payment...',
        processingDesc: 'Please wait, do not close this window',
        success: 'Payment Successful!',
        transferred: 'Transferred amount',
        transactionId: 'Transaction ID',
        totalToPay: 'Total to Pay',
        payNow: 'Pay Now',
    },

    // Notifications
    notifications: {
        title: 'Notifications',
        readAll: 'Read All',
        empty: 'No notifications yet',
        emptyDesc: 'We will notify you when something arrives',
        viewAll: 'View All Notifications',
    },

    // Global Search
    search: {
        placeholder: 'Search...',
        trending: 'Trending',
        recent: 'Recent Searches',
        clearAll: 'Clear All',
        jobs: 'Jobs',
        freelancers: 'Freelancers',
        skills: 'Skills',
        resultsFor: 'Results for',
        noResults: 'No results found',
        noResultsDesc: 'We couldn\'t find anything matching your search',
        suggestions: {
            mobileApp: 'Mobile App',
            logo: 'Logo',
            seo: 'SEO',
            logoDesign: 'Logo Design',
            reactJs: 'React JS',
            translation: 'Translation',
            videoEditing: 'Video Editing',
            python: 'Python',
        }
    },

    // Onboarding
    onboarding: {
        client: {
            welcome: 'Welcome',
            welcomeDesc: 'Let\'s complete your profile to start hiring',
            profileTitle: 'Profile',
            profileDesc: 'Basic Information',
        },
        freelancer: {
            welcome: 'Welcome',
            welcomeDesc: 'Complete your profile to start working',
            steps: {
                skills: 'Skills',
                bio: 'Bio',
                experience: 'Experience',
                portfolio: 'Portfolio',
            },
            uploadAvatar: 'Profile Picture',
            uploadAvatarDesc: 'Professional photo recommended',
        }
    },

    footer: {
        about: 'About',
        faq: 'FAQ',
        terms: 'Terms',
        privacy: 'Privacy',
        contact: 'Contact',
        copyright: '© 2026 Khedma.tn - All rights reserved',
    },
    findFreelancers: {
        searchPlaceholder: 'Search for freelancers...',
        availableNow: 'Available for work',
        category: 'Category',
        skills: 'Skills',
        hourlyRate: 'Hourly Rate (TND)',
        clearFilters: 'Clear All Filters',
        hero: {
            badge: 'Top Tunisian Talent',
            title: 'Discover',
            titleHighlight: 'Top Talent',
            subtitle: 'Browse thousands of creatives ready to work on your next project.',
            subtitleDesktop: ' Search by skill, price, or rating.',
        },
        filterToggle: 'Filter Results',
        filterTitle: 'Filter Search',
        clearAll: 'Clear All',
        resultsCount: 'Show {{count}} results',
        sort: {
            label: 'Sort by:',
            recommended: 'Recommended',
            rating: 'Highest Rated',
            priceLow: 'Lowest Price',
        },
        noResults: {
            title: 'No matching results',
            description: 'We couldn\'t find any freelancers matching your criteria. Try changing search terms or filters.',
            action: 'Clear All Filters'
        }
    }
};
