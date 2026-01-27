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
    },

    hero: {
        title: 'The Freelance Platform Built for Tunisia',
        subtitle: 'No bidding, no complications, just your skills and your money',
        ctaFreelancer: 'Start as Freelancer',
        ctaClient: 'Post a Job',
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
        dinar: 'dinars',
        tnd: 'TND',
    },

    footer: {
        about: 'About',
        faq: 'FAQ',
        terms: 'Terms',
        privacy: 'Privacy',
        contact: 'Contact',
        copyright: '© 2026 Khedma.tn - All rights reserved',
    },
};
