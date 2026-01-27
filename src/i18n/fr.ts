import type { Translations } from './ar';

export const fr: Translations = {
    nav: {
        home: 'Accueil',
        howItWorks: 'Comment ça marche',
        forFreelancers: 'Pour les freelances',
        forClients: 'Pour les clients',
        pricing: 'Tarifs',
        login: 'Connexion',
        signup: 'Inscription',
        dashboard: 'Tableau de bord',
        jobs: 'Missions disponibles',
        messages: 'Messages',
        profile: 'Profil',
        settings: 'Paramètres',
        logout: 'Déconnexion',
    },

    hero: {
        title: 'La plateforme freelance conçue pour la Tunisie',
        subtitle: 'Pas d\'enchères, pas de complications, juste vos compétences et votre argent',
        ctaFreelancer: 'Devenir freelance',
        ctaClient: 'Poster une mission',
    },

    values: {
        noBidding: {
            title: 'Sans enchères',
            description: 'Nous sélectionnons les 3 meilleurs pour vous',
        },
        localPayment: {
            title: 'Paiement local',
            description: 'D17, virement bancaire ou espèces',
        },
        microJobs: {
            title: 'Missions rapides',
            description: 'À partir de 10 dinars',
        },
    },

    howItWorks: {
        title: 'Comment ça marche',
        heroTitle: 'Comment ça marche',
        brandName: 'Khedma',
        subtitle: 'Votre plateforme de freelance sécurisée en Tunisie. Nous connectons les talents tunisiens aux porteurs de projets ambitieux, simplement et en toute sécurité.',
        tabs: {
            freelancer: 'Pour les freelances',
            client: 'Pour les clients',
        },
        cta: {
            freelancer: 'Commencez votre carrière',
            client: 'Publiez votre premier projet',
        },
        freelancerSteps: [
            {
                title: "Créez votre profil pro",
                description: "Inscrivez-vous gratuitement et complétez votre profil. Ajoutez vos compétences, votre portfolio et une intro vocale pour vous présenter."
            },
            {
                title: "Recevez des offres",
                description: "Pas besoin d'enchérir ! Notre algorithme vous propose des missions adaptées à vos compétences et vous connecte directement aux clients."
            },
            {
                title: "Discutez et validez",
                description: "Échangez via le chat, mettez-vous d'accord sur le prix et le délai, et commencez le travail immédiatement après validation."
            },
            {
                title: "Paiement sécurisé",
                description: "Nous garantissons votre paiement à la livraison. Retirez vos gains via D17, virement bancaire ou en espèces."
            }
        ],
        clientSteps: [
            {
                title: "Publiez votre projet",
                description: "Décrivez votre besoin, définissez le budget et le délai. C'est gratuit et très simple."
            },
            {
                title: "Choisissez le meilleur",
                description: "Nous sélectionnons les 3 meilleurs freelances pour vous. Comparez-les, écoutez leurs intros vocales et voyez leurs portfolios."
            },
            {
                title: "Suivez l'avancement",
                description: "Communiquez avec le freelance, suivez l'avancement du travail et demandez des modifications si nécessaire."
            },
            {
                title: "Recevez et notez",
                description: "Ne payez que lorsque vous êtes satisfait du résultat. Notez le freelance pour aider les autres à choisir."
            }
        ],
        trust: {
            money: { title: 'Garantie satisfait ou remboursé', desc: 'Fonds sécurisés jusqu\'à validation du travail' },
            verified: { title: 'Identités vérifiées', desc: 'Nous vérifions tous les utilisateurs pour un environnement sûr' },
            support: { title: 'Support local', desc: 'Équipe de support tunisienne prête à aider à tout moment' },
        },
        faq: {
            title: 'Questions fréquentes',
            items: [
                { q: "L'inscription est-elle gratuite ?", a: "Oui, l'inscription est 100% gratuite pour les freelances et les clients. Nous prenons une petite commission uniquement sur les projets réussis." },
                { q: "Mon argent est-il en sécurité ?", a: "Khedma agit comme tiers de confiance. Le client nous paie, nous gardons les fonds jusqu'à validation, puis nous payons le freelance." },
                { q: "Quels moyens de paiement ?", a: "Nous acceptons toutes les méthodes locales : cartes, D17, virement bancaire et même espèces pour les petits montants." },
                { q: "Puis-je m'inscrire en tant qu'entreprise ?", a: "Oui, vous pouvez créer un compte entreprise pour recruter ou offrir des services en équipe." }
            ]
        }
    },

    // For Clients Page
    forClients: {
        hero: {
            badge: "Les meilleurs talents tunisiens au même endroit",
            title: "Réalisez vos projets rapidement et avec qualité avec",
            subtitle: "Publiez votre projet gratuitement et recevez des offres de professionnels tunisiens vérifiés. Ne payez qu'à la livraison et la satisfaction.",
            cta: "Publiez votre projet maintenant",
            secondary: "Comment ça marche ?"
        },
        benefits: {
            speed: { title: "Recrutement rapide", desc: "Obtenez les meilleurs candidats en quelques minutes. Nos algorithmes intelligents vous trouvent les meilleurs profils immédiatement." },
            secure: { title: "Paiement sécurisé", desc: "Nous ne libérons les fonds au freelance qu'après réception et validation du travail." },
            local: { title: "Compétences locales", desc: "Travaillez avec des professionnels qui comprennent votre culture, parlent votre langue et acceptent les paiements locaux." },
        },
        categories: {
            title: "Réalisez tout, dans n'importe quel domaine",
            items: ['Développement', 'Design et Graphisme', 'Rédaction et Traduction', 'Marketing et Vente', 'Vidéo et Animation', 'Ingénierie', 'Support', 'Éducation']
        },
        talent: {
            title: "Exemples de nos talents",
        },
        cta: {
            title: "Prêt à passer au niveau supérieur ?",
            text: "Des milliers de professionnels tunisiens attendent votre opportunité. Ne perdez pas de temps, commencez maintenant.",
            button: "Inscrivez-vous gratuitement",
        }
    },

    categories: {
        title: 'Catégories',
        graphicDesign: 'Design graphique',
        webDev: 'Développement web',
        translation: 'Traduction',
        videoEditing: 'Montage vidéo',
        contentWriting: 'Rédaction de contenu',
        dataEntry: 'Saisie de données',
        digitalMarketing: 'Marketing digital',
        photography: 'Photographie',
        uiux: 'Design UI/UX',
        mobileApp: 'Développement mobile',
        availableJobs: 'mission disponible',
    },

    counter: {
        title: 'dinars gagnés par les Tunisiens ce mois-ci',
    },

    testimonials: {
        title: 'Histoires de réussite',
        items: [
            {
                name: 'Mohamed Ali',
                role: 'Graphiste',
                quote: 'Grâce à Khedma.tn, j\'ai gagné plus de 5000 TND en seulement 2 mois. La plateforme est facile à utiliser et le paiement est rapide.',
                earned: '5,200',
                image: 'https://i.pravatar.cc/150?img=11'
            },
            {
                name: 'Fatima Ben Said',
                role: 'Traductrice',
                quote: 'La meilleure plateforme freelance en Tunisie. Pas d\'enchères, les clients me trouvent automatiquement.',
                earned: '3,800',
                image: 'https://i.pravatar.cc/150?img=32'
            },
            {
                name: 'Ahmed El Hadi',
                role: 'Développeur Web',
                quote: 'Le paiement local a tout facilité. D17 ou virement bancaire, toutes les méthodes sont disponibles.',
                earned: '8,500',
                image: 'https://i.pravatar.cc/150?img=53'
            }
        ]
    },

    auth: {
        phone: 'Numéro de téléphone',
        phonePlaceholder: 'Entrez votre numéro',
        sendCode: 'Envoyer le code',
        verifyCode: 'Code de vérification',
        verify: 'Vérifier',
        resendCode: 'Renvoyer le code',
        resendIn: 'Renvoyer dans',
        seconds: 'secondes',
        selectUserType: 'Choisissez votre type de compte',
        freelancer: 'Freelance',
        client: 'Client',
        both: 'Les deux',
        completeProfile: 'Compléter l\'inscription',
    },

    profile: {
        fullName: 'Nom complet',
        fullNamePlaceholder: 'Entrez votre nom complet',
        location: 'Gouvernorat',
        selectLocation: 'Sélectionnez votre gouvernorat',
        skills: 'Compétences',
        selectSkills: 'Choisissez vos compétences (max 3)',
        workSamples: 'Exemples de travaux',
        uploadSample: 'Télécharger un exemple',
        dragDrop: 'Glissez et déposez les fichiers ici',
        or: 'ou',
        browse: 'Parcourir les fichiers',
        voiceIntro: 'Présentation vocale',
        recordVoice: 'Enregistrement vocal (30 secondes)',
        recording: 'Enregistrement en cours...',
        stopRecording: 'Arrêter l\'enregistrement',
        playRecording: 'Lire l\'enregistrement',
        deleteRecording: 'Supprimer l\'enregistrement',
        companyName: 'Nom de l\'entreprise',
        companyNamePlaceholder: 'Nom de l\'entreprise (optionnel)',
        optional: 'Optionnel',
        bio: 'À propos de vous',
        bioPlaceholder: 'Écrivez une courte biographie...',
    },

    dashboard: {
        welcome: 'Bienvenue',
        jobsCompleted: 'missions terminées',
        totalEarnings: 'dinars',
        responseTime: 'heures',
        rating: 'Note',
        availableJobs: 'Missions correspondant à vos compétences',
        all: 'Tout',
        new: 'Nouveau',
        urgent: 'Urgent',
        viewDetails: 'Voir les détails',
        recentActivity: 'Activité récente',
        updateProfile: 'Mettre à jour le profil',
        profileCompletion: 'Profil complété',
    },

    job: {
        title: 'Titre de la mission',
        titlePlaceholder: 'Ex: Créer un logo pour un restaurant',
        description: 'Description de la mission',
        descriptionPlaceholder: 'Décrivez la mission en détail...',
        budget: 'Budget',
        budgetHelp: 'Entrez votre budget total',
        deadline: 'Date de livraison',
        within1Day: 'Dans 1 jour',
        within3Days: 'Dans 3 jours',
        within1Week: 'Dans 1 semaine',
        requiredSkills: 'Compétences requises',
        paymentMethod: 'Méthode de paiement',
        bankTransfer: 'Virement bancaire',
        d17: 'D17',
        cash: 'Espèces à la livraison',
        postJob: 'Publier la mission',
        saveDraft: 'Enregistrer le brouillon',
        preview: 'Aperçu',
        matching: 'Recherche de freelances...',
        matchesFound: '3 freelances trouvés!',
        estimatedTime: 'Dans 1 heure',
    },

    selection: {
        topMatches: 'Les 3 meilleurs freelances pour votre mission',
        matchScore: 'Correspondance',
        completionRate: 'Taux de réussite',
        responseTimeLabel: 'Répond en',
        hours: 'heures',
        jobsCompleted: 'missions',
        voiceIntro: 'Présentation vocale',
        noVoice: 'Pas de présentation vocale',
        workSamples: 'Exemples de travaux',
        noSamples: 'Pas d\'exemples',
        readMore: 'Lire plus',
        select: 'Choisir',
        viewFullProfile: 'Voir le profil complet',
        confirmSelection: 'Êtes-vous sûr?',
        startWork: 'Oui, commencer',
        cancel: 'Annuler',
    },

    contract: {
        chat: 'Chat',
        details: 'Détails',
        sendMessage: 'Envoyer un message...',
        attachFile: 'Joindre un fichier',
        send: 'Envoyer',
        jobInfo: 'Informations sur la mission',
        daysLeft: 'Reste',
        days: 'jours',
        inProgress: 'En cours',
        paymentInfo: 'Informations de paiement',
        awaitingDelivery: 'En attente de livraison',
        awaitingApproval: 'En attente d\'approbation',
        deliverWork: 'Livrer le travail',
        acceptAndPay: 'Accepter et payer',
        requestChanges: 'Demander des modifications',
        openDispute: 'Ouvrir un litige',
        disputeOpened: 'Litige ouvert',
        disputeReview: 'Révision dans 48 heures',
    },

    publicProfile: {
        available: 'Disponible',
        busy: 'Occupé',
        memberSince: 'Membre depuis',
        months: 'mois',
        earned: 'Gagné',
        skills: 'Compétences',
        showMore: 'Voir plus',
        about: 'À propos',
        noBio: 'Pas de biographie',
        voiceIntro: 'Présentation vocale',
        workSamples: 'Exemples de travaux',
        noSamples: 'Pas d\'exemples',
        reviews: 'Avis',
        noReviews: 'Pas d\'avis',
        sendMessage: 'Envoyer un message',
        editProfile: 'Modifier le profil',
    },

    settings: {
        profile: 'Profil',
        account: 'Compte',
        notifications: 'Notifications',
        payment: 'Paiement',
        privacy: 'Confidentialité',
        language: 'Langue',
        save: 'Enregistrer',
        saved: 'Enregistré',
        changePassword: 'Changer le mot de passe',
        currentPassword: 'Mot de passe actuel',
        newPassword: 'Nouveau mot de passe',
        confirmPassword: 'Confirmer le mot de passe',
        cinVerification: 'Vérification CIN',
        uploadCin: 'Télécharger la CIN',
        pending: 'En attente',
        verified: 'Vérifié',
        deleteAccount: 'Supprimer le compte',
        deleteWarning: 'Cette action est irréversible',
        notificationSettings: {
            newMatches: 'Nouvelles missions',
            newMessages: 'Nouveaux messages',
            payments: 'Paiements',
            contractUpdates: 'Mises à jour des contrats',
            platformNews: 'Actualités de la plateforme',
        },
        deliveryMethod: {
            email: 'Email',
            sms: 'SMS',
            inApp: 'Dans l\'app uniquement',
        },
        paymentMethods: 'Méthodes de paiement',
        addPaymentMethod: 'Ajouter une méthode',
        preferredMethod: 'Méthode préférée',
        privacySettings: {
            profileVisibility: 'Visibilité du profil',
            public: 'Public',
            hidden: 'Caché',
            whoCanMessage: 'Qui peut vous contacter',
            anyone: 'Tout le monde',
            activeContracts: 'Contrats actifs uniquement',
            showEarnings: 'Afficher les gains',
        },
    },

    common: {
        loading: 'Chargement...',
        error: 'Erreur',
        retry: 'Réessayer',
        next: 'Suivant',
        back: 'Retour',
        submit: 'Soumettre',
        confirm: 'Confirmer',
        cancel: 'Annuler',
        close: 'Fermer',
        search: 'Rechercher',
        filter: 'Filtrer',
        sort: 'Trier',
        dinar: 'dinars',
        tnd: 'TND',
    },

    footer: {
        about: 'À propos',
        faq: 'FAQ',
        terms: 'Conditions',
        privacy: 'Confidentialité',
        contact: 'Contact',
        copyright: '© 2026 Khedma.tn - Tous droits réservés',
    },
};
