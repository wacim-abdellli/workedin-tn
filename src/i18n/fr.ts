import type { Translations } from './ar';

export const fr: Translations = {
    "nav": {
        "home": "Accueil",
        "howItWorks": "Comment ça marche",
        "forFreelancers": "Pour les freelances",
        "forClients": "Pour les clients",
        "pricing": "Tarifs",
        "login": "Se connecter",
        "signup": "Créer un compte",
        "dashboard": "Tableau de bord",
        "jobs": "Missions disponibles",
        "messages": "Messages",
        "profile": "Profil",
        "settings": "Paramètres",
        "logout": "Déconnexion",
        "findWork": "Trouver du travail",
        "findFreelancers": "Trouver des freelances",
        "findFreelancersTitle": "Trouver des freelances",
        "myJobs": "Mes Offres",
        "saved": "Sauvegardés",
        "contracts": "Contrats",
        "proposals": "Propositions",
        "postProject": "Publier un projet",
        "myProjects": "Mes Projets",
        "wallet": "Portefeuille",
        "adminDashboard": "Tableau de bord admin"
    },
    "notFound": {
        "title": "Page Introuvable",
        "description": "La page que vous cherchez n'existe pas ou a été déplacée.",
        "goBack": "Retour",
        "goHome": "Accueil"
    },
    "jobs": {
        "title": "Missions disponibles",
        "loadError": "Échec du chargement des missions",
        "searchPlaceholder": "Rechercher des missions...",
        "filters": {
            "title": "Filtres",
            "clearAll": "Tout effacer",
            "categories": {
                "title": "Catégorie",
                "design": "Design",
                "development": "Développement",
                "writing": "Rédaction",
                "marketing": "Marketing",
                "translation": "Traduction",
                "video": "Vidéo & Animation",
                "business": "Affaires",
                "data": "Saisie de données",
                "other": "Autre"
            },
            "jobType": {
                "title": "Type de contrat",
                "fixed_price": "Prix fixe",
                "hourly": "Horaire"
            },
            "budget": {
                "title": "Budget (TND)",
                "all": "Tout",
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
                "title": "Niveau d'expérience",
                "entry": "Débutant",
                "intermediate": "Intermédiaire",
                "expert": "Expert"
            },
            "postedDate": {
                "title": "Date de publication",
                "any": "Tout le temps",
                "h24": "Dernières 24h",
                "d3": "3 derniers jours",
                "w1": "Dernière semaine",
                "m1": "Dernier mois"
            },
            "viewResults": "Voir les résultats"
        },
        "sort": {
            "newest": "Plus récents",
            "budgetHigh": "Budget: Élevé à Faible",
            "budgetLow": "Budget: Faible à Élevé",
            "proposalsHigh": "Plus de propositions",
            "proposalsLow": "Moins de propositions"
        },
        "stats": {
            "availableJobs": "missions disponibles"
        },
        "empty": {
            "title": "Aucune mission trouvée",
            "subtitle": "Essayez de changer vos critères de recherche",
            "action": "Effacer les filtres"
        },
        "loadMore": "Charger plus",
        "save": "Sauvegarder",
        "saved": "Mission sauvegardée",
        "unsave": "Retirer des favoris",
        "apply": "Postuler",
        "postedAgo": "Publié {{time}}",
        "budget": "Budget",
        "hourlyRate": "Taux horaire",
        "proposals": "propositions",
        "verifiedPayment": "Paiement vérifié",
        "unverifiedPayment": "Paiement non vérifié",
        "newClient": "Nouveau client",
        "savedJobs": {
            "title": "Missions sauvegardées",
            "viewAll": "Voir tout"
        },
        "time": {
            "now": "À l'instant",
            "minute": "min",
            "hour": "h",
            "day": "j",
            "ago_prefix": "Il y a",
            "ago": ""
        },
        "location": {
            "remote": "Télétravail"
        },
        "new": {
            "seo": {
                "title": "Publier un projet",
                "description": "Créez un nouveau projet, définissez le budget et la durée, puis publiez-le pour recevoir des propositions de freelances."
            },
            "heroTitle": "Publiez un projet avec clarté et attirez des freelances mieux adaptés.",
            "heroDescription": "Avancez par phases ciblées : définissez le besoin, fixez budget et délai, choisissez la visibilité, puis relisez avant publication.",
            "steps": {
                "basics": "Détails de la mission",
                "basicsDescription": "Définissez clairement le brief, la catégorie et les compétences requises.",
                "budget": "Budget et durée",
                "budgetDescription": "Définissez le modèle de tarification, la durée prévue et le niveau d'expérience.",
                "visibility": "Visibilité",
                "visibilityDescription": "Choisissez si le brief est public ou réservé aux invitations.",
                "review": "Revue et publication",
                "reviewDescription": "Vérifiez le brief avant de le publier."
            },
            "stepCounter": "Étape {{current}} sur {{total}}",
            "currentPhase": "Phase en cours",
            "progress": "Progression",
            "step1": {
                "subtitle": "Commencez par un titre clair et un contexte solide."
            },
            "fields": {
                "title": "Titre du projet",
                "mainCategory": "Catégorie principale",
                "selectCategory": "Choisir la catégorie",
                "subcategory": "Sous-catégorie",
                "selectSubcategory": "Choisir la sous-catégorie",
                "description": "Description du projet",
                "requiredSkills": "Compétences requises (max 5)",
                "suggested": "Suggestions :",
                "attachments": "Pièces jointes (optionnel)",
                "attachmentsDrop": "Glissez les fichiers ici ou cliquez pour parcourir",
                "chooseFiles": "Choisir des fichiers"
            },
            "quality": {
                "title": "Score de qualité"
            },
            "autosave": {
                "saving": "Enregistrement...",
                "saved": "Enregistré",
                "lastSaved": "Dernière sauvegarde : {{time}}",
                "ready": "Sauvegarde auto prête",
                "savedAt": "Enregistré à {{time}}",
                "notSaved": "Pas encore enregistré"
            },
            "wizard": {
                "badge": "Parcours de publication",
                "currentPhase": "Phase en cours",
                "progress": "Progression",
                "stepsLeft": "étapes restantes",
                "metaDraft": "Flux sûr pour brouillon"
            },
            "actions": {
                "previous": "Précédent",
                "saveDraft": "Enregistrer en brouillon",
                "next": "Suivant",
                "publishJob": "Publier la mission"
            },
            "restoreDraft": {
                "title": "Restaurer le brouillon",
                "description": "Nous avons trouvé un brouillon enregistré datant de {{time}}. Voulez-vous le restaurer et continuer ?",
                "jobTitle": "Titre",
                "untitled": "(Sans titre)",
                "startFresh": "Recommencer",
                "restore": "Restaurer le brouillon"
            },
            "toasts": {
                "draftRestored": "Brouillon restauré avec succès",
                "draftSaved": "Brouillon enregistré avec succès",
                "jobPosted": "Mission publiée avec succès !"
            },
            "errors": {
                "titleRequiredForDraft": "Veuillez saisir un titre de mission pour enregistrer le brouillon",
                "loginRequired": "Vous devez être connecté pour publier une mission",
                "saveFailed": "Une erreur est survenue lors de l'enregistrement de la mission",
                "attachmentsUnavailable": "Les pièces jointes ne peuvent pas être envoyées pour le moment. La mission sera publiée sans elles.",
                "stepIncomplete": "Veuillez compléter les champs requis avant de continuer."
            },
            "time": {
                "now": "À l'instant",
                "minutesAgo": "Il y a {{count}} min",
                "hoursAgo": "Il y a {{count}} h"
            },
            "stepBasics": {
                "badge": "Brief du projet",
                "title": "Détails de la mission",
                "subtitle": "Commencez par un titre clair et une description précise pour attirer les meilleurs freelances.",
                "categoryDesign": "Design et créativité",
                "categoryDevelopment": "Développement",
                "categoryMarketing": "Marketing et ventes",
                "categoryWriting": "Rédaction et traduction",
                "projectTitle": "Titre du projet",
                "projectTitlePlaceholder": "Exemple : Conception de logo pour une entreprise agroalimentaire",
                "mainCategory": "Catégorie principale",
                "subcategory": "Sous-catégorie",
                "selectCategory": "Choisir la catégorie",
                "selectSubcategory": "Choisir la sous-catégorie",
                "projectDescription": "Description du projet",
                "projectDescriptionPlaceholder": "Décrivez les détails du projet, les livrables attendus et toute exigence spécifique...",
                "characterCount": "{{current}} / {{max}} caractères",
                "tip1": "Soyez précis dans la description du besoin",
                "tip2": "Définissez clairement les livrables finaux",
                "tip3": "Ajoutez des liens vers des projets similaires si possible",
                "tip4": "Précisez ce qui doit être livré et à quel moment vous attendez la fin",
                "requiredSkills": "Compétences requises (max 5)",
                "attachments": "Pièces jointes (optionnel)",
                "attachmentsDescription": "PDF, DOC, DOCX, TXT - 10MB max par fichier"
            },
            "stepBudget": {
                "badge": "Configuration du tarif",
                "title": "Budget et durée",
                "subtitle": "Choisissez le mode de paiement et définissez votre budget",
                "fixedPrice": "Prix fixe",
                "fixedPriceDescription": "Payez un montant fixe pour tout le projet une fois terminé.",
                "hourly": "Horaire",
                "hourlyDescription": "Payez le freelance selon le nombre d'heures travaillées.",
                "estimatedBudget": "Budget estimé du projet (TND)",
                "min": "Min",
                "max": "Max",
                "hourlyRate": "Taux horaire (TND)",
                "hourlyRateExample": "Exemple : 20",
                "weeklyHours": "Heures estimées par semaine",
                "weeklyHoursExample": "Exemple : 10-20",
                "duration": "Durée du projet",
                "selectDuration": "Sélectionner la durée",
                "durationLessThan1Month": "Moins d'un mois",
                "duration1To3Months": "1 à 3 mois",
                "duration3To6Months": "3 à 6 mois",
                "durationMoreThan6Months": "Plus de 6 mois",
                "experienceLevel": "Niveau d'expérience requis",
                "beginner": "Débutant",
                "intermediate": "Intermédiaire",
                "expert": "Expert",
                "deadline": "Date limite"
            },
            "stepVisibility": {
                "badge": "Contrôle de l'audience",
                "title": "Qui peut voir votre mission ?",
                "subtitle": "Choisissez le niveau de confidentialité adapté à votre projet.",
                "publicTitle": "Public",
                "publicDescription": "Tous les freelances peuvent voir la mission et proposer. Idéal pour recevoir plus de propositions.",
                "inviteOnlyTitle": "Sur invitation",
                "inviteOnlyDescription": "La mission ne sera pas visible dans la recherche. Seuls les freelances invités pourront proposer.",
                "tipTitle": "Conseil :",
                "tipDescription": "Si votre projet est sensible ou demande des compétences rares, le mode invitation offre plus de contrôle. Pour les projets généraux, la visibilité publique augmente la concurrence et les options de prix."
            },
            "stepReview": {
                "badge": "Vérification finale",
                "title": "Revue et publication",
                "subtitle": "Relisez le brief une dernière fois avant sa mise en ligne pour les freelances.",
                "warning": "Veuillez vérifier attentivement les détails de la mission avant publication. Après publication, seules certaines informations pourront être modifiées.",
                "now": "Maintenant",
                "projectDescription": "Description du projet",
                "budget": "Budget",
                "hourlyBudget": "{{rate}} TND / heure",
                "experienceLevel": "Niveau requis",
                "projectDuration": "Durée du projet",
                "visibility": "Visibilité",
                "inviteOnlyVisibility": "Privé (sur invitation)",
                "publicVisibility": "Public (tout le monde)",
                "privacyLevel": "Niveau de confidentialité",
                "attachments": "Pièces jointes",
                "requiredSkills": "Compétences requises",
                "durationLessThan1Month": "Moins d'un mois",
                "duration1To3Months": "1 - 3 mois",
                "duration3To6Months": "3 - 6 mois",
                "durationMoreThan6Months": "Plus de 6 mois",
                "beginner": "Débutant",
                "intermediate": "Intermédiaire",
                "expert": "Expert",
                "deadline": "Date limite"
            },
            "validation": {
                "deadlineRequired": "Veuillez sélectionner une date limite",
                "deadlineFuture": "La date limite doit être aujourd'hui ou plus tard",
                "titleMin": "Le titre doit contenir au moins 8 caractères",
                "categoryRequired": "Veuillez sélectionner une catégorie",
                "subcategoryRequired": "Veuillez sélectionner une sous-catégorie",
                "descriptionMin": "La description doit contenir au moins 80 caractères",
                "skillsRequired": "Veuillez sélectionner au moins une compétence",
                "maxFiles": "Maximum 5 fichiers",
                "budgetMin": "Le budget minimum doit être au moins de 1",
                "budgetMax": "Le budget maximum doit être au moins de 1",
                "hourlyRate": "Le tarif horaire doit être au moins de 1",
                "estimatedHours": "Veuillez saisir les heures hebdomadaires estimées",
                "durationRequired": "Veuillez sélectionner une durée",
                "budgetRequired": "Veuillez définir un budget",
                "budgetRange": "Le budget maximum doit être supérieur ou égal au budget minimum",
                "subcategoryInvalid": "Veuillez sélectionner une sous-catégorie valide"
            }
        }
    },
    "hero": {
        "title": "Là où le talent tunisien est payé justement",
        "headlineStart": "Là où le talent tunisien",
        "headlineHighlight": "Est payé justement",
        "subtitle": "Sans enchères. Sans intermédiaires. Publiez un projet, convenez des termes, soyez payé en TND — sécurisé par escrow.",
        "ctaFreelancer": "Commencez à gagner",
        "ctaClient": "Publiez un projet gratuitement",
        "badge": "Conçu en Tunisie. Pour la Tunisie.",
        "socialProof": "2 500+ professionnels travaillent déjà sur WorkedIn",
        "rating": "4.9/5 — noté par des freelances et clients vérifiés",
        "activity": {
            "eyebrow": "Activité en temps réel",
            "title": "Vrai travail. Vrais paiements.",
            "tag": "Désormais disponible en Tunisie",
            "metrics": {
                "activeProjects": "Projets actifs",
                "avgProjectValue": "Valeur moyenne des projets",
                "verifiedFreelancers": "Freelances vérifiés",
                "projectsCompleted": "Projets terminés"
            }
        },
        "stats": {
            "professionals": "Professionnels actifs",
            "projects": "Projets complétés",
            "escrow": "TND en escrow"
        },
        "trust": {
            "verified": "Professionnels vérifiés",
            "verifiedBody": "Chaque freelance est vérifié avant d'accepter son premier projet.",
            "secure": "Paiements protégés par escrow",
            "secureBody": "Les fonds sont sécurisés et libérés uniquement à la validation.",
            "users": "Utilisateurs"
        }
    },
    "home": {
        "stats": {
            "live": "Statistiques en direct",
            "activeJobs": "Missions actives",
            "users": "Utilisateurs",
            "rating": "Évaluation"
        },
        "sections": {
            "howItWorks": {
                "badge": "Comment ça marche",
                "subtitle": "Quatre étapes claires entre l’idée, l’exécution et le paiement.",
                "freelancerDesc": "Construisez votre présence et commencez à gagner",
                "clientDesc": "Trouvez le bon professionnel sans friction"
            },
            "categories": {
                "badge": "Catégories",
                "subtitle": "Découvrez les compétences les plus demandées sur le marché tunisien."
            },
            "testimonials": {
                "badge": "Histoires de réussite",
                "earned": "Gagné"
            },
            "cta": {
                "badge": "Commencer maintenant",
                "title": "Commencez en Tunisie. Travaillez avec confiance.",
                "subtitle": "Freelance ou client, WorkedIn vous offre un parcours plus clair du premier brief au paiement final.",
                "btnStart": "Créer un compte",
                "btnWatch": "Voir comment ça marche"
            }
        }
    },
    "values": {
        "noBidding": {
            "title": "Sans enchères",
            "description": "Un bon profil et un matching intelligent plutôt qu’une guerre des prix"
        },
        "localPayment": {
            "title": "Paiement local",
            "description": "TND, D17 et moyens adaptés au marché tunisien"
        },
        "microJobs": {
            "title": "Vrais projets",
            "description": "Des missions rapides aux contrats plus ambitieux"
        }
    },
    "howItWorks": {
        "title": "Comment WorkedIn fonctionne",
        "heroTitle": "Simple par conception.",
        "heroTitleHighlight": "Sécurisé par défaut.",
        "brandName": "WorkedIn",
        "subtitle": "Quatre étapes de l'idée au paiement — chaque étape protégée, chaque dinar comptabilisé.",
        "tabs": {
            "freelancer": "Pour les freelances",
            "client": "Pour les clients"
        },
        "cta": {
            "freelancer": "Commencez à gagner",
            "client": "Publier un projet gratuitement"
        },
        "freelancerSteps": [
            {
                "title": "Créez votre profil une seule fois",
                "description": "Ajoutez vos compétences, votre portfolio et votre tarif. Les clients vous trouvent — sans enchères."
            },
            {
                "title": "Recevez de vrais projets",
                "description": "Notre système vous met en avant auprès des clients qui recherchent précisément vos compétences."
            },
            {
                "title": "Validez les termes, puis commencez",
                "description": "Discutez, négociez et verrouillez le périmètre avant que l'argent ne bouge."
            },
            {
                "title": "Soyez payé à validation",
                "description": "Les fonds sont en escrow dès le premier jour. Validez l'étape — recevez vos TND."
            }
        ],
        "clientSteps": [
            {
                "title": "Publiez en 2 minutes",
                "description": "Décrivez le travail, fixez votre budget, choisissez un tarif fixe ou horaire."
            },
            {
                "title": "Analyze des propositions vérifiées",
                "description": "Chaque freelance est vérifié. Filtrez par note, compétence et prix."
            },
            {
                "title": "Suivez des étapes, pas des promesses",
                "description": "Livrables clairs, délais précis et progression visible — dans un seul espace."
            },
            {
                "title": "Libérez le paiement, laissez un avis",
                "description": "Validez le travail, libérez les fonds de l'escrow et notez l'expérience."
            }
        ],
        "trust": {
            "money": {
                "title": "Remboursement total si non satisfait",
                "desc": "Si le travail ne respecte pas les termes convenus, vous récupérez vos TND."
            },
            "verified": {
                "title": "Chaque professionnel est vérifié",
                "desc": "Nous vérifions l'identité nationale avant toute mise en ligne sur WorkedIn."
            },
            "support": {
                "title": "Support en arabe, français et anglais",
                "desc": "De vraies personnes, fuseau local, trois langues."
            }
        },
        "faq": {
            "title": "Questions fréquentes",
            "items": [
                {
                    "q": "L'inscription est-elle gratuite ?",
                    "a": "Oui, l'inscription est gratuite pour les freelances comme pour les clients. Une petite commission s'applique seulement aux projets réalisés."
                },
                {
                    "q": "Comment mon argent est-il protégé ?",
                    "a": "WorkedIn agit comme tiers de confiance. Les fonds restent sécurisés jusqu'à la validation du travail."
                },
                {
                    "q": "Quels moyens de paiement sont disponibles ?",
                    "a": "Nous prenons en charge les cartes, D17, le virement bancaire et d'autres méthodes adaptées au marché tunisien."
                },
                {
                    "q": "Puis-je m'inscrire en tant qu'entreprise ?",
                    "a": "Oui, vous pouvez créer un compte entreprise pour recruter ou proposer vos services en équipe."
                }
            ]
        }
    },
    "forClients": {
        "hero": {
            "badge": "Recrutez des talents tunisiens vérifiés",
            "title": "Votre projet, livré.",
            "titleHighlight": "Dans les délais. Dans le budget.",
            "subtitle": "Publiez gratuitement. Recevez des propositions de professionnels vérifiés. Payez uniquement à votre validation — chaque paiement protégé par escrow.",
            "cta": "Publier un projet — c'est gratuit",
            "secondary": "Voir comment ça marche"
        },
        "benefits": {
            "speed": {
                "title": "Recrutez en 24h",
                "desc": "Publiez et recevez des propositions vérifiées le jour même."
            },
            "secure": {
                "title": "Payez quand vous êtes satisfait",
                "desc": "Fonds en escrow. Libérés à votre validation."
            },
            "local": {
                "title": "Professionnels tunisiens",
                "desc": "Travaillez avec des personnes qui comprennent le marché local."
            }
        },
        "categories": {
            "title": "Toutes les compétences. Une plateforme.",
            "items": [
                "Développement",
                "Design et Création",
                "Rédaction et Traduction",
                "Vente et Marketing",
                "Vidéo et Animation",
                "Ingénierie",
                "Support",
                "Éducation"
            ]
        },
        "talent": {
            "title": "Avec qui vous allez travailler"
        },
        "cta": {
            "title": "Votre prochain projet commence ici.",
            "text": "2 500+ professionnels vérifiés prêts à travailler. Publiez gratuitement — sans abonnement, sans engagement.",
            "button": "Créer un compte client gratuit"
        }
    },
    "categories": {
        "title": "Catégories",
        "graphicDesign": "Design graphique",
        "webDev": "Développement web",
        "translation": "Traduction",
        "videoEditing": "Montage vidéo",
        "contentWriting": "Rédaction de contenu",
        "dataEntry": "Saisie de données",
        "digitalMarketing": "Marketing digital",
        "photography": "Photographie",
        "uiux": "Design UI/UX",
        "mobileApp": "Développement mobile",
        "availableJobs": "mission disponible"
    },
    "counter": {
        "title": "dinars gagnés par les Tunisiens ce mois-ci"
    },
    "testimonials": {
        "title": "Histoires de réussite",
        "items": [
            {
                "name": "Mohamed Ali",
                "role": "Graphiste",
                "quote": "Grâce à WorkedIn.tn, j'ai gagné plus de 5000 TND en seulement 2 mois. La plateforme est facile à utiliser et le paiement est rapide.",
                "earned": "5,200",
                "image": "https://i.pravatar.cc/150?img=11"
            },
            {
                "name": "Fatima Ben Said",
                "role": "Traductrice",
                "quote": "La meilleure plateforme de talents en Tunisie. Pas d'enchères, les clients me trouvent automatiquement.",
                "earned": "3,800",
                "image": "https://i.pravatar.cc/150?img=32"
            },
            {
                "name": "Ahmed El Hadi",
                "role": "Développeur Web",
                "quote": "Le paiement local a tout facilité. D17 ou virement bancaire, toutes les méthodes sont disponibles.",
                "earned": "8,500",
                "image": "https://i.pravatar.cc/150?img=53"
            }
        ]
    },
    "auth": {
        "phone": "Numéro de téléphone",
        "phonePlaceholder": "Entrez votre numéro",
        "email": "Email",
        "emailPlaceholder": "Entrez votre email",
        "password": {
            "label": "Mot de passe",
            "show": "Afficher le mot de passe",
            "hide": "Masquer le mot de passe"
        },
        "passwordPlaceholder": "Entrez votre mot de passe",
        "confirmPassword": "Confirmer le mot de passe",
        "confirmPasswordPlaceholder": "Ressaisissez votre mot de passe",
        "sendCode": "Envoyer le code",
        "verifyCode": "Code de vérification",
        "verify": "Vérifier",
        "resendCode": "Renvoyer le code",
        "resendIn": "Renvoyer dans",
        "seconds": "secondes",
        "selectUserType": "Comment allez-vous utiliser WorkedIn ?",
        "selectUserTypeSubtitle": "Vous pouvez toujours ajouter l'autre rôle plus tard dans les paramètres.",
        "freelancer": "Freelance",
        "client": "Client",
        "both": "Les deux",
        "completeProfile": "Compléter l'inscription",
        "createAccount": "Créer un compte",
        "loginTitle": "Se connecter à WorkedIn",
        "loginSubtitle": "Bon retour. Votre travail vous attend.",
        "signupTitle": "Créer votre compte",
        "signupSubtitle": "Rejoignez 2 500+ professionnels qui construisent leur carrière sur WorkedIn.",
        "noAccount": "Pas encore de compte ?",
        "hasAccount": "Déjà un compte ?",
        "invalidCredentials": "Email ou mot de passe incorrect",
        "emailExists": "Cet email est déjà enregistré",
        "passwordMismatch": "Les mots de passe ne correspondent pas",
        "passwordMinLength": "Le mot de passe doit contenir au moins 6 caractères",
        "passwordValidation": {
            "minLength": "Le mot de passe doit contenir au moins 8 caractères",
            "uppercase": "Doit contenir au moins une majuscule",
            "lowercase": "Doit contenir au moins une minuscule",
            "number": "Doit contenir au moins un chiffre"
        },
        "passwordStrength": {
            "weak": "Faible",
            "medium": "Moyen",
            "strong": "Fort"
        },
        "invalidEmail": "Entrez une adresse email valide",
        "emailNotConfirmed": "Email non confirmé",
        "resetPassword": {
            "linkExpired": "Lien de réinitialisation expiré",
            "success": "Mot de passe changé avec succès",
            "error": "Erreur lors du changement de mot de passe",
            "setNewTitle": "Définir un nouveau mot de passe"
        },
        "forgotPassword": "Mot de passe oublié ?",
        "forgotPasswordForm": {
            "rateLimited": "Trop de tentatives. Réessayez plus tard.",
            "sent": "Lien de réinitialisation envoyé",
            "error": "Erreur lors de l'envoi du lien",
            "sendTitle": "Envoyer le lien de réinitialisation"
        },
        "login": "Se connecter",
        "signup": "Créer un compte",
        "signOut": "Déconnexion",
        "googleLogin": "Continuer avec Google",
        "googleLoginError": "Échec de la connexion Google",
        "or": "ou",
        "loggingOut": "Déconnexion en cours...",
        "userTypeFreelancerDesc": "J'offre des compétences et veux être payé pour mon travail",
        "userTypeClientDesc": "J'ai des projets et besoin de professionnels fiables",
        "userTypeBothDesc": "Je fais les deux — je travaille et je recrute",
        "accountPanel": {
            "sectionLabel": "Espace de travail",
            "switchWorkspace": "Changer d'espace",
            "switchWorkspaceBoth": "Utilisez le même compte pour recruter et travailler en freelance sans connexion séparée.",
            "switchWorkspaceSingle": "Activez le second espace uniquement quand vous en avez réellement besoin.",
            "completeSetup": "Terminer la configuration",
            "freelancerLabel": "Freelance",
            "clientLabel": "Client",
            "ready": "Prêt",
            "needsSetup": "Nécessite configuration",
            "progressLabel": "Profil complété",
            "freelancerDesc": "Trouvez du travail, envoyez des propositions et soyez payé en TND.",
            "clientDesc": "Publiez des projets, comparez les propositions et libérez les paiements escrow.",
            "current": "Actuel",
            "switchAction": "Basculer",
            "enable": "Activer",
            "switching": "Basculement...",
            "switchedFreelancer": "L'espace freelance est désormais actif.",
            "switchedClient": "L'espace client est désormais actif.",
            "switchError": "Impossible de changer d'espace pour le moment.",
            "manageProfile": "Gérer le profil",
            "freelancerHint": "Complétez les détails essentiels ici, puis affinez le reste plus tard dans les Paramètres.",
            "clientHint": "Terminez les bases du client ici d'abord, puis gérez la facturation et les détails de l'entreprise dans les Paramètres.",
            "tools": "Outils du compte",
            "profileAction": "Profil",
            "settingsAction": "Paramètres",
            "logoutAction": "Déconnexion",
            "logoutDesc": "Terminez cette session en toute sécurité sur cet appareil.",
            "defaultUser": "Utilisateur WorkedIn",
            "statusPro": "Pro",
            "statusPending": "En attente",
            "workspaceActive": "Espace actif",
            "setupInFiveMinutes": "Configuration en 5 min",
            "switchOver": "Basculer",
            "switchInstantly": "Basculer instantanément",
            "adminDashboard": "Tableau de bord admin",
            "walletAndEarnings": "Portefeuille et gains",
            "freelancerFeatureBrowseJobs": "Parcourir et postuler aux missions",
            "freelancerFeatureReceivePayments": "Recevoir les paiements en TND",
            "freelancerFeaturePortfolio": "Construire un portfolio public",
            "clientFeaturePostProjects": "Publier des projets gratuitement",
            "clientFeatureReviewProposals": "Examiner des propositions vérifiées",
            "clientFeatureEscrow": "Paiements protégés par escrow"
        }
    },
    "dashboard": {
        "welcome": "Bienvenue",
        "jobsCompleted": "missions terminées",
        "totalEarnings": "dinars",
        "responseTime": "heures",
        "rating": "Note",
        "availableJobs": "Missions correspondant à vos compétences",
        "all": "Tout",
        "new": "Nouveau",
        "urgent": "Urgent",
        "viewDetails": "Voir les détails",
        "recentActivity": "Activité récente",
        "updateProfile": "Mettre à jour le profil",
        "profileCompletion": "Profil complété",
        "freelancerSubtitle": "Tableau de bord freelance",
        "clientSubtitle": "Tableau de bord client",
        "quickActions": "Actions rapides",
        "viewProfile": "Voir le profil",
        "browseJobs": "Parcourir les missions",
        "postNewJob": "Publier une nouvelle mission",
        "postNewJobDesc": "Décrivez votre mission et nous trouverons les 3 meilleurs freelances",
        "yourJobs": "Vos missions",
        "viewAll": "Voir tout",
        "client": {
            "defaultName": "Client",
            "activeJobs": "Missions actives",
            "activeJobsDetail": "Projets ouverts ou en cours nécessitant actuellement des décisions, des propositions ou un suivi de livraison.",
            "totalSpent": "Dépenses totales",
            "totalSpentDetail": "Paiements effectués libérés via votre portefeuille client et les flux de garantie.",
            "completedContracts": "Contrats terminés",
            "completedContractsDetail": "Projets que vous avez menés à bien jusqu'à la livraison et clôturés avec succès.",
            "proposalsWaiting": "Projets en attente de révision",
            "proposalsWaitingDetail": "Projets ouverts qui ont déjà reçu des propositions et doivent être révisés avant qu'elles ne deviennent obsolètes.",
            "commandCenter": "Centre de commande client",
            "welcomeBack": "Bon retour",
            "heroGreeting": "Bienvenue, {{name}}",
            "heroDescription": "Gardez votre processus d'embauche propre : publiez des descriptions plus claires, examinez les propositions plus rapidement et faites avancer les projets actifs sans bruit supplémentaire.",
            "focusLabel": "Priorité du jour",
            "focusFirstJobTitle": "Publiez votre premier projet",
            "focusFirstJobDescription": "Une description claire de votre projet débloque des propositions, des sélections et des contrats. Commencez par là.",
            "focusReviewTitle": "Examiner les propositions reçues",
            "focusReviewDescription": "Votre projet \"{{title}}\" a déjà des propositions en attente de votre examen.",
            "reviewProposals": "Examiner les propositions",
            "focusDeliveryTitle": "Restez proche des livraisons actives",
            "focusDeliveryDescription": "Suivez les étapes, les messages et les approbations pour que les projets actifs continuent d'avancer sans friction.",
            "openProjects": "Projets ouverts",
            "focusScaleTitle": "Ouvrez un nouveau projet prometteur",
            "focusScaleDescription": "Votre tableau de bord est calme en ce moment. Préparez votre prochaine mission et invitez des freelances mieux adaptés.",
            "pipeline": {
                "totalProposals": "propositions totales",
                "openJobs": "missions ouvertes",
                "unreadUpdates": "mises à jour non lues"
            },
            "manageWorkspace": "Gérer l'espace de travail",
            "postJob": "Publier une nouvelle mission",
            "projectsBadge": "Pipeline d'embauche",
            "projectsDescription": "Derniers briefs de projet, signaux de proposition et états de livraison actifs au même endroit.",
            "noJobsYet": "Vous n'avez publié aucune mission pour le moment",
            "noJobsDescription": "Votre tableau de bord commencera à se remplir dès que vous publierez un brief de projet et inviterez des propositions dans le pipeline.",
            "jobBudget": "Budget",
            "proposalsLabel": "Propositions",
            "proposalsSubmitted": "{{count}} propositions reçues",
            "assigneeLabel": "Freelance assigné",
            "freelancerFallback": "Freelance",
            "nextActionLabel": "Action suivante",
            "monitorDelivery": "Suivre la livraison",
            "viewProject": "Voir le projet",
            "contractsBadge": "Livraison active",
            "activeContracts": "Contrats actifs",
            "activeContractsDescription": "Contrats actuellement en cours avec des freelances assignés.",
            "viewAllContracts": "Voir tout",
            "noActiveContracts": "Aucun contrat actif",
            "noActiveContractsDescription": "Une fois une proposition acceptée et l'escrow financé, les contrats actifs apparaîtront ici.",
            "untitledContract": "Contrat sans titre",
            "activeBadge": "Actif",
            "pipelineBadge": "Aide à la décision",
            "pipelineSummary": "Résumé de recrutement",
            "awaitingReview": "En attente de révision",
            "inProgressProjects": "En cours",
            "jobsWithProposals": "Missions avec propositions",
            "updatesBadge": "Pulse de la boîte de réception",
            "notifications": "Notifications",
            "allCaughtUp": "Tout est à jour",
            "allCaughtUpDescription": "Lorsque les mises à jour des propositions, les modifications de contrat ou les rappels arrivent, ils apparaîtront ici de manière plus claire.",
            "defaultNotificationTitle": "Mise à jour du projet",
            "defaultNotificationBody": "Un événement du projet nécessite votre attention.",
            "openNotifications": "Ouvrir les notifications",
            "playbookBadge": "Guide du client",
            "nextMoves": "Meilleures prochaines étapes",
            "reviewPipeline": "Examiner le pipeline du projet",
            "reviewPipelineDescription": "Comparez les briefs ouverts, l'activité des propositions et la livraison active en un seul endroit.",
            "refineProfile": "Affiner le profil du client",
            "refineProfileDescription": "Un profil d'entreprise plus clair aide les pigistes à faire confiance au brief et à répondre plus rapidement.",
            "projectsLabel": "Projets",
            "activeLabel": "Actif",
            "spentLabel": "Dépensé",
            "activeProjects": "Projets actifs",
            "noActiveProjects": "Aucun projet actif",
            "viewAll": "Voir tout",
            "postFirstProject": "Publiez votre premier projet pour trouver des freelances talentueux",
            "postAProject": "Publier un projet",
            "recentProposals": "Propositions récentes",
            "postJobToReceiveProposals": "Publiez un projet pour commencer à recevoir des propositions",
            "reviewBadge": "Examiner",
            "untitledJob": "Projet sans titre",
            "acrossActiveContracts": "Sur {{count}} contrats actifs",
            "viewWallet": "Voir le portefeuille",
            "needSomethingDone": "Besoin de quelque chose?",
            "postProjectFree": "Publiez un projet gratuitement. Recevez des propositions de talents tunisiens vérifiés.",
            "postProjectFreeCta": "Publier un projet — c'est gratuit",
            "thisMonth": "Ce mois",
            "proposalsCountText": "propositions",
            "status": {
                "cancelled": "Annulé"
            }
        },
        "freelancer": {
            "defaultName": "Freelance",
            "contractsLabel": "Contrats",
            "proposalsLabel": "Propositions",
            "earningsLabel": "Revenus",
            "ratingLabel": "Évaluation",
            "activeContracts": "Contrats actifs",
            "viewAll": "Voir tout",
            "noActiveContracts": "Aucun contrat actif",
            "submitProposalsToStart": "Soumettez des propositions pour commencer à obtenir des contrats",
            "browseJobs": "Parcourir les projets",
            "recentProposals": "Propositions récentes",
            "noProposalsYet": "Pas encore de propositions",
            "browseAndSendProposal": "Parcourez les projets ouverts et envoyez votre première proposition",
            "untitledJob": "Projet sans titre",
            "matchedForYou": "Correspondances pour vous",
            "seeAllJobs": "Voir tous les projets",
            "noMatchesYet": "Pas encore de correspondances",
            "addSkillsToMatch": "Ajoutez des compétences à votre profil pour obtenir des projets correspondants",
            "updateProfile": "Mettre à jour le profil",
            "apply": "Postuler",
            "profileStrength": "Force du profil",
            "thisMonth": "Ce mois",
            "vsLastMonth": "par rapport au mois dernier",
            "viewWallet": "Voir le portefeuille",
            "quickActions": "Actions rapides",
            "checklist": {
                "avatar": "Avatar téléchargé",
                "bio": "Biographie écrite",
                "skills": "Compétences ajoutées",
                "title": "Titre professionnel",
                "identity": "Identité vérifiée",
                "tools": "Outils ajoutés",
                "preferences": "Préférences de projet"
            },
            "clientFallback": "Client"
        },
        "greeting": {
            "morning": "Bonjour",
            "afternoon": "Bon après-midi",
            "evening": "Bonsoir"
        },
        "admin": {
            "overview": "Aperçu",
            "users": "Utilisateurs",
            "jobs": "Missions",
            "payments": "Paiements",
            "verification": "Vérification",
            "disputes": "Litiges",
            "reports": "Signalements",
            "settings": "Paramètres",
            "totalUsers": "Nombre total d'utilisateurs",
            "activeJobs": "Missions actives",
            "activeContracts": "Contrats actifs",
            "revenue": "Revenus (TND)",
            "todayActivity": "Activité d'aujourd'hui",
            "loadingUsers": "Chargement des utilisateurs...",
            "failedToLoadUsers": "Impossible de charger les utilisateurs",
            "allUsers": "Tous les utilisateurs",
            "freelancers": "Freelances",
            "clients": "Clients",
            "allStatuses": "Tous les statuts",
            "open": "Ouvert",
            "inProgress": "En cours",
            "completed": "Terminé",
            "cancelled": "Annulé",
            "stuckPayments": "Paiements bloqués (plus de 1 heure)",
            "refresh": "Actualiser",
            "loading": "Chargement...",
            "noStuckPayments": "Aucun paiement bloqué",
            "allTransactionsSuccess": "Toutes les transactions ont réussi",
            "identityVerificationRequests": "Demandes de vérification d'identité",
            "pending": "en attente",
            "noPendingRequests": "Aucune demande en attente",
            "allVerificationsProcessed": "Toutes les demandes de vérification ont été traitées",
            "frontSide": "Recto",
            "backSide": "Verso",
            "pendingRequests": "Demandes en attente",
            "noPendingVerifications": "Aucune demande de vérification en attente",
            "pageTitle": "Demandes de vérification d'identité - Tableau de bord admin",
            "pageDescription": "Examinez et gérez les demandes de vérification d'identité soumises",
            "adminDashboard": "Tableau de bord admin",
            "operationsCenter": "Centre de supervision",
            "controlCenter": "Centre de controle",
            "nightModeReady": "Mode nuit prêt",
            "backToSite": "Retour au site"
        }
    },
    "job": {
        "title": "Titre de la mission",
        "titlePlaceholder": "Ex: Créer un logo pour un restaurant",
        "description": "Description de la mission",
        "descriptionPlaceholder": "Décrivez la mission en détail...",
        "budget": "Budget",
        "budgetHelp": "Entrez votre budget total",
        "deadline": "Date de livraison",
        "within1Day": "Dans 1 jour",
        "within3Days": "Dans 3 jours",
        "within1Week": "Dans 1 semaine",
        "requiredSkills": "Compétences requises",
        "paymentMethod": "Méthode de paiement",
        "bankTransfer": "Virement bancaire",
        "d17": "D17",
        "cash": "Espèces à la livraison",
        "postJob": "Publier la mission",
        "saveDraft": "Enregistrer le brouillon",
        "preview": "Aperçu",
        "matching": "Recherche de freelances...",
        "matchesFound": "3 freelances trouvés!",
        "estimatedTime": "Dans 1 heure"
    },
    "selection": {
        "topMatches": "Les 3 meilleurs freelances pour votre mission",
        "matchScore": "Correspondance",
        "completionRate": "Taux de réussite",
        "responseTimeLabel": "Répond en",
        "hours": "heures",
        "jobsCompleted": "missions",
        "voiceIntro": "Présentation vocale",
        "noVoice": "Pas de présentation vocale",
        "workSamples": "Exemples de travaux",
        "noSamples": "Pas d'exemples",
        "readMore": "Lire plus",
        "select": "Choisir",
        "viewFullProfile": "Voir le profil complet",
        "confirmSelection": "Êtes-vous sûr?",
        "startWork": "Oui, commencer",
        "cancel": "Annuler"
    },
    "contract": {
        "chat": "Chat",
        "details": "Détails",
        "sendMessage": "Envoyer un message...",
        "attachFile": "Joindre un fichier",
        "send": "Envoyer",
        "jobInfo": "Informations sur la mission",
        "daysLeft": "Reste",
        "days": "jours",
        "inProgress": "En cours",
        "paymentInfo": "Informations de paiement",
        "awaitingDelivery": "En attente de livraison",
        "awaitingApproval": "En attente d'approbation",
        "deliverWork": "Livrer le travail",
        "acceptAndPay": "Accepter et payer",
        "requestChanges": "Demander des modifications",
        "openDispute": "Ouvrir un litige",
        "disputeOpened": "Litige ouvert",
        "disputeReview": "Révision dans 48 heures",
        "startConversation": "Démarrez la conversation",
        "typeMessage": "Écrivez votre message ici...",
        "completed": "Terminé",
        "daysRemaining": "{{days}} jours restants",
        "requiredActions": "Actions requises",
        "addReview": "Ajouter votre avis",
        "milestones": "Étapes",
        "finalDelivery": "Livraison finale",
        "pending": "En attente",
        "sharedFiles": "Fichiers partagés",
        "noSharedFiles": "Aucun fichier partagé pour le moment",
        "workingOnProject": "Travaille sur ce projet",
        "employer": "Employeur",
        "onlineNow": "En ligne maintenant",
        "workspaceTitle": "Espace de travail",
        "sendMessageError": "Erreur lors de l'envoi du message",
        "fileUploadError": "Erreur lors du téléchargement du fichier",
        "workDelivered": "Travail livré avec succès!",
        "deliverError": "Erreur lors de la livraison",
        "workAccepted": "Travail accepté et paiement effectué!",
        "acceptError": "Erreur lors de l'acceptation",
        "requestRevision": "Demander des révisions",
        "revisionSent": "Demande de révision envoyée",
        "error": "Une erreur s'est produite",
        "disputeError": "Erreur lors de l'ouverture du litige",
        "reviewSent": "Avis envoyé avec succès"
    },
    "jobMatches": {
        "searchError": "Erreur lors de la recherche de correspondances",
        "contractCreated": "Contrat créé avec succès!",
        "contractError": "Erreur lors de la création du contrat"
    },
    "profile": {
        "fullName": "Nom complet",
        "fullNamePlaceholder": "Entrez votre nom complet",
        "companyName": "Nom de l'entreprise",
        "companyNamePlaceholder": "Entrez le nom de votre entreprise",
        "bio": "Titre professionnel",
        "bioPlaceholder": "Presentez votre specialite",
        "location": "Localisation",
        "selectLocation": "Choisissez votre gouvernorat",
        "skills": "Competences",
        "optional": "Optionnel",
        "voiceIntro": "Presentation vocale",
        "recordVoice": "Enregistrer une presentation",
        "stopRecording": "Arreter l'enregistrement",
        "workSamples": "Exemples de travaux",
        "dragDrop": "Glissez des fichiers ici ou telechargez-les depuis votre appareil",
        "browse": "Parcourir les fichiers",
        "languages": {
            "title": "Langues",
            "add": "Ajouter une langue",
            "select": "Choisir une langue",
            "levels": {
                "native": "Langue maternelle",
                "fluent": "Courant",
                "conversational": "Conversationnel",
                "basic": "Debutant"
            }
        },
        "education": {
            "title": "Formation",
            "add": "Ajouter une formation",
            "noEducation": "Aucune formation ajoutee",
            "institution": "Etablissement",
            "degree": "Diplome",
            "field": "Domaine d'etudes",
            "startYear": "Annee de debut",
            "endYear": "Annee de fin"
        }
    },
    "publicProfile": {
        "available": "Disponible",
        "busy": "Occupé",
        "offline": "Hors ligne",
        "memberSince": "Membre depuis",
        "months": "mois",
        "earned": "Gagné",
        "skills": "Compétences",
        "showMore": "Voir plus",
        "about": "À propos",
        "noBio": "Pas de biographie",
        "voiceIntro": "Présentation vocale",
        "workSamples": "Exemples de travaux",
        "noSamples": "Pas d'exemples",
        "reviews": "Avis",
        "noReviews": "Pas d'avis",
        "sendMessage": "Envoyer un message",
        "editProfile": "Modifier le profil"
    },
    "settings": {
        "profile": "Profil",
        "account": "Compte",
        "notifications": "Notifications",
        "payment": "Paiement",
        "privacy": "Confidentialité",
        "tabDescriptions": {
            "account": "Mode d'espace de travail, aperçu du compte et guide de configuration.",
            "profile": "Identité, biographie, avatar et disponibilité de l'espace de travail.",
            "notifications": "Choisissez ce qui vous parvient et à quelle fréquence.",
            "payment": "Méthodes de retrait, paramètres par défaut et détails prêts pour les transactions.",
            "security": "Contrôle de session, sécurité du compte et actions destructrices."
        },
        "pageTitle": "Paramètres",
        "heroDescription": "Gardez les détails du compte, la sécurité, les paiements et le comportement des notifications sur une surface de contrôle cohérente. Mettez à jour ce qui compte sans perdre votre place dans le produit.",
        "accountOverview": "Vue du compte",
        "profileCompletion": "Complétion du profil",
        "logout": "Se déconnecter",
        "notificationsSubtitle": "Choisissez les notifications que vous souhaitez recevoir",
        "paymentSubtitle": "Méthodes de paiement et de retrait",
        "paymentMethodsCount": "Méthodes enregistrées",
        "readyForTransactions": "Prêt pour les transactions",
        "noPaymentMethodsDescription": "Ajoutez une méthode de retrait maintenant pour que les contrats, les revenus et les retraits soient prêts quand vous en avez besoin. Sécurisé et chiffré.",
        "addMethod": "Ajouter une méthode",
        "default": "Par défaut",
        "setDefault": "Définir par défaut",
        "noPaymentMethods": "Aucune méthode de paiement n'a été ajoutée pour l'instant",
        "saveChanges": "Enregistrer les modifications",
        "bioLabel": "Biographie",
        "bioPlaceholder": "Écrivez une courte biographie...",
        "changePasswordTitle": "Changer le mot de passe",
        "passwordTooShort": "Le mot de passe doit contenir au moins 8 caractères",
        "passwordsDoNotMatch": "Les mots de passe ne correspondent pas",
        "passwordChanged": "Mot de passe mis à jour avec succès",
        "passwordUpdateFailed": "Échec de la mise à jour du mot de passe",
        "updatingPassword": "Mise à jour...",
        "updatePassword": "Mettre à jour le mot de passe",
        "oauthPasswordMessage": "Vous vous êtes connecté avec {{provider}}. La gestion du mot de passe est assurée par votre fournisseur d'identité.",
        "securityPosture": "Position de sécurité",
        "securityPostureValue": "Protégé par les contrôles de session du compte",
        "passwordStatus": "État du mot de passe",
        "passwordSet": "Le mot de passe est défini",
        "noPasswordOAuth": "Connecté via {{provider}} — aucun mot de passe requis",
        "noPasswordMessage": "Aucun mot de passe défini - vous utilisez la connexion par téléphone",
        "addPassword": "Ajouter un mot de passe",
        "activeSessionsTitle": "Sessions actives",
        "activeSessionsMessage": "Cet appareil est votre seule session active",
        "signOutAllDevices": "Se déconnecter de tous les appareils",
        "deleteAccountTitle": "Supprimer le compte",
        "deleteAccountDescription": "Votre compte et toutes vos données seront supprimés définitivement. Cette action est irréversible.",
        "deleteMyAccount": "Supprimer mon compte",
        "deleteAccountConfirmTitle": "Confirmer la suppression du compte",
        "deleteAccountConfirmMessage": "Êtes-vous sûr de vouloir supprimer votre compte ? Toutes vos données seront supprimées définitivement.",
        "deleteAccountConfirmAction": "Oui, supprimer mon compte",
        "addPaymentMethodModalTitle": "Ajouter une méthode de paiement",
        "paymentMethodType": "Type de méthode de paiement",
        "paymentDetails": "Détails du paiement",
        "bankTransfer": "Virement bancaire",
        "bankAccountNumber": "Numéro de compte bancaire",
        "phoneNumber": "Numéro de téléphone",
        "add": "Ajouter",
        "accountType": "Type de compte",
        "accountTypeFreelancer": "Freelance",
        "accountTypeFreelancerDesc": "Proposer mes services",
        "accountTypeClient": "Client",
        "accountTypeClientDesc": "Recruter des freelances",
        "accountTypeBoth": "Les deux",
        "accountTypeBothDesc": "Utiliser les deux modes",
        "accountTypeUnknown": "Non défini",
        "userFallback": "Utilisateur",
        "currentWorkspace": "Espace de travail actuel",
        "identityVerificationTitle": "Vérification d'identité",
        "quickActions": "Actions rapides",
        "goToProfile": "Modifier le profil",
        "accountTabHint": "Mettez à jour vos informations et votre espace de travail",
        "goToDashboard": "Aller au tableau de bord",
        "goToDashboardDescription": "Retournez à votre espace de travail",
        "reviewNotifications": "Gérer les notifications",
        "reviewNotificationsDescription": "Contrôlez vos alertes",
        "toggleNotification": "Basculer {{label}}",
        "onboardingStatus": "Statut d'intégration",
        "activeContext": "Contexte actif",
        "globalPermission": "Autorisation globale",
        "profileReadiness": "Disponibilité du profil",
        "accountOverviewTitle": "Votre identité d'espace de travail et votre statut de configuration",
        "accountOverviewDescription": "Cet onglet est le point de contrôle du fonctionnement de votre compte. Allez à Profil quand vous voulez modifier les détails ou changer la disponibilité de l'espace de travail.",
        "setupStatus": {
            "profileBasics": "Bases du profil",
            "identityVerification": "Vérification d'identité",
            "workspaceSetup": "Configuration de l'espace de travail",
            "complete": "Complet",
            "pending": "En attente",
            "done": "Terminé",
            "allDone": "Toutes les étapes de configuration requises sont terminées."
        },
        "identityVerified": "Identité vérifiée",
        "identityPending": "En cours de révision",
        "verifyIdentity": "Vérifier votre identité",
        "profileComplete": "Profil complet",
        "completeProfile": "Compléter votre profil",
        "profileCompletionTitle": "Progression du profil",
        "requiredLabel": "Requis :",
        "moreRequired": "+{{count}} autres",
        "completion": {
            "fullName": "Nom",
            "avatar": "Photo de profil",
            "location": "Localisation",
            "bio": "Bio",
            "accountType": "Type de compte",
            "identityVerification": "Vérification d'identité",
            "onboarding": "Intégration"
        },
        "fullName": "Nom complet",
        "phoneNumberLabel": "Numéro de téléphone",
        "emailOptionalLabel": "Email (optionnel)",
        "location": "Localisation",
        "notificationsEnabled": "Règles actives",
        "notificationsTotal": "Vitesse de livraison",
        "notificationChannel": "Canaux",
        "emailPlaceholder": "email@example.com",
        "toasts": {
            "profileSaved": "Profil mis à jour avec succès",
            "profileSaveError": "Échec de l'enregistrement des modifications du profil",
            "defaultPaymentUpdated": "Méthode de paiement par défaut mise à jour",
            "genericError": "Une erreur est survenue",
            "paymentDeleted": "Méthode de paiement supprimée",
            "paymentDeleteError": "Échec de la suppression de la méthode de paiement",
            "paymentAdded": "Méthode de paiement ajoutée",
            "paymentAddError": "Échec de l'ajout de la méthode de paiement",
            "deleteRequestSent": "Votre demande de suppression de compte a été envoyée. Elle sera traitée sous 48 heures.",
            "avatarUpdated": "Photo de profil mise à jour",
            "avatarUpdateError": "Échec du téléversement de la photo de profil",
            "workspaceBothEnabled": "Les deux espaces de travail sont maintenant activés sur votre compte.",
            "workspaceUpdated": "Espace de travail mis à jour avec succès."
        },
        "language": "Langue",
        "save": "Enregistrer",
        "saved": "Enregistré",
        "changePassword": "Changer le mot de passe",
        "currentPassword": "Mot de passe actuel",
        "newPassword": "Nouveau mot de passe",
        "confirmPassword": "Confirmer le mot de passe",
        "cinVerification": "Vérification CIN",
        "uploadCin": "Télécharger la CIN",
        "pending": "En attente",
        "verified": "Vérifié",
        "deleteAccount": "Supprimer le compte",
        "deleteWarning": "Cette action est irréversible",
        "notificationSettings": {
            "newMatches": "Nouvelles missions",
            "newMatchesDesc": "Recevez une notification quand des missions correspondent à vos compétences",
            "newMessages": "Nouveaux messages",
            "newMessagesDesc": "Recevez une notification lorsque vous recevez de nouveaux messages",
            "payments": "Paiements",
            "paymentsDesc": "Recevez une notification lorsque vous envoyez ou recevez des paiements",
            "reviews": "Avis",
            "reviewsDesc": "Recevez une notification lorsque vous recevez un nouvel avis",
            "marketing": "Offres et mises à jour",
            "marketingDesc": "Conseils et mises à jour de WorkedIn",
            "contractUpdates": "Mises à jour des contrats",
            "platformNews": "Actualités de la plateforme"
        },
        "deletePaymentMethod": "Supprimer {{label}}",
        "deliveryMethod": {
            "email": "Email",
            "sms": "SMS",
            "inApp": "Dans l'app uniquement"
        },
        "paymentMethods": "Méthodes de paiement",
        "addPaymentMethod": "Ajouter une méthode",
        "preferredMethod": "Méthode préférée",
        "privacySettings": {
            "profileVisibility": "Visibilité du profil",
            "public": "Public",
            "hidden": "Caché",
            "whoCanMessage": "Qui peut vous contacter",
            "anyone": "Tout le monde",
            "activeContracts": "Contrats actifs uniquement",
            "showEarnings": "Afficher les gains à tous"
        }
    },
    "contracts": {
        "title": "Contrats",
        "activeCount": "{{count}} actifs",
        "tabs": {
            "all": "Tous",
            "active": "Actifs",
            "completed": "Terminés",
            "disputed": "Litiges"
        },
        "status": {
            "active": "Actif",
            "completed": "Terminé",
            "disputed": "En litige"
        },
        "role": {
            "client": "Client",
            "freelancer": "Freelance"
        },
        "empty": {
            "title": "Aucun contrat pour le moment",
            "freelancerDescription": "Envoyez des propositions pour obtenir votre premier contrat.",
            "clientDescription": "Engagez un freelance pour créer votre premier contrat.",
            "freelancerCta": "Parcourir les missions",
            "clientCta": "Publier un projet"
        },
        "unknownProject": "Projet inconnu",
        "unknownUser": "Utilisateur inconnu",
        "startedOn": "Commencé {{date}}",
        "milestonesProgress": "1 étape sur 3 terminée",
        "openWorkspace": "Ouvrir l'espace de travail ->"
    },
    "common": {
        "loading": "Chargement...",
        "loadingContent": "Chargement du contenu",
        "error": "Erreur",
        "retry": "Réessayer",
        "next": "Suivant",
        "back": "Retour",
        "submit": "Soumettre",
        "confirm": "Confirmer",
        "cancel": "Annuler",
        "close": "Fermer",
        "search": "Rechercher",
        "filter": "Filtrer",
        "sort": "Trier",
        "report": "Signaler",
        "reportSubmitted": "Signalement soumis. Notre équipe examinera bientôt.",
        "reportError": "Échec du signalement",
        "reportTitle": "Signaler ce contenu",
        "reportContent": "Contenu du signalement",
        "reportDescribePlaceholder": "Veuillez décrire le problème...",
        "reportSubmitButton": "Soumettre le signalement",
        "reload": "Recharger",
        "errors": {
            "unexpected": "Une erreur inattendue s'est produite"
        },
        "navigate": "Naviguer",
        "select": "Sélectionner",
        "dinar": "dinars",
        "tnd": "TND",
        "time": {
            "now": "À l'instant",
            "minute": "min",
            "hour": "h",
            "day": "j",
            "ago_prefix": "Il y a",
            "ago": ""
        },
        "today": "Aujourd'hui",
        "toggleDarkMode": "Mode sombre",
        "toggleLightMode": "Mode clair",
        "openMenu": "Ouvrir le menu",
        "closeMenu": "Fermer le menu",
        "refresh": "Actualiser",
        "save": "Enregistrer",
        "unsave": "Retirer",
        "returnHome": "Retour a l'accueil",
        "contactSupport": "Contacter le support",
        "verified": "Vérifié",
        "availableForWork": "Disponible",
        "replyToReview": "Répondre à l'avis",
        "from": "De",
        "to": "À",
        "optional": "Optionnel",
        "attachments": "Pièces jointes",
        "removeImage": "Supprimer l'image",
        "invalidFileType": "Veuillez sélectionner une image JPG, PNG ou WebP",
        "fileTooLarge": "La taille de l'image doit être inférieure à 5 Mo",
        "uploadFailed": "Échec du téléchargement, vous pouvez l'ajouter plus tard",
        "skipForNow": "Vous pouvez ignorer cette étape et télécharger plus tard",
        "writeReply": "Écrivez votre réponse ici...",
        "shareExperience": "Partagez votre expérience avec cette personne...",
        "projectTitle": "Titre du projet",
        "projectTitlePlaceholder": "Ex : Création de logo pour entreprise agroalimentaire",
        "projectDescription": "Description du projet",
        "projectDescriptionPlaceholder": "Décrivez les détails du projet, les livrables attendus et les exigences particulières...",
        "bankName": "Nom de la banque",
        "bankNamePlaceholder": "Ex : Banque Nationale Agricole",
        "accountHolder": "Nom du titulaire",
        "accountHolderPlaceholder": "Nom tel qu'il apparaît sur le compte bancaire",
        "searchPlaceholder": "Rechercher...",
        "emailPlaceholder": "Votre adresse email",
        "identityVerified": "Identité vérifiée",
        "saveFreelancer": "Enregistrer le profil",
        "unsaveFreelancer": "Retirer des favoris",
        "typeMessage": "Écrivez votre message ici...",
        "messageSubject": "Sujet du message",
        "messageSubjectPlaceholder": "Ex : Question concernant un projet de design...",
        "messageContent": "Contenu du message",
        "messageContentPlaceholder": "Écrivez les détails de votre message ici...",
        "proposalPlaceholder": "Expliquez pourquoi vous êtes la bonne personne pour ce projet...",
        "reviewPlaceholder": "Qu'avez-vous apprécié ? Que pourrait-on améliorer ? Le recommanderiez-vous ?",
        "visibilityNote": "Si vous avez besoin de compétences rares ou un projet sensible, \"Sur invitation\" vous donne plus de contrôle. Pour les projets publics, \"Public\" assure une meilleure compétitivité des prix.",
        "skillsUsed": "Compétences utilisées",
        "skillsUsedPlaceholder": "Ex : Photoshop, React, UI Design (séparés par des virgules)",
        "thumbnailUrl": "URL de l'image miniature",
        "projectUrl": "URL du projet",
        "completionDate": "Date de réalisation",
        "searchProposals": "Rechercher dans les propositions...",
        "hourlyExample": "Ex : 20",
        "hoursExample": "Ex : 10-20",
        "scrollToTop": "Revenir en haut",
        "fileUpload": {
            "dropzoneHint": "Glissez les fichiers ici ou cliquez pour parcourir",
            "chooseFiles": "Choisir des fichiers",
            "fileTooLarge": "{{name}} depasse {{size}}MB",
            "unsupportedType": "{{name}} a un type de fichier non pris en charge",
            "maxFilesExceeded": "Maximum {{count}} fichiers autorises",
            "removeFileAria": "Supprimer {{name}}"
        }
    },
    "accountStatus": {
        "suspended": {
            "title": "Compte suspendu",
            "body": "L'acces a votre compte est temporairement suspendu. Contactez le support si vous avez besoin d'aide ou si vous pensez qu'il s'agit d'une erreur."
        },
        "archived": {
            "title": "Compte archive",
            "body": "Ce compte est archive et ne peut plus acceder aux fonctionnalites protegees de la plateforme. Contactez le support pour obtenir de l'aide."
        }
    },
    "payment": {
        "completeTitle": "Paiement",
        "payVia": "Payer via",
        "chooseMethod": "Choisir un mode de paiement",
        "d17Desc": "Le moyen le plus rapide en Tunisie",
        "scanD17": "Scanner avec l'application D17",
        "amount": "Montant",
        "recipient": "Bénéficiaire",
        "to": "Pour",
        "orEnterPhone": "Ou entrez votre numéro",
        "d17PhoneLabel": "Numéro de téléphone D17",
        "d17PhonePlaceholder": "+216 00 000 000",
        "flouciTitle": "Flouci",
        "flouciDesc": "Votre portefeuille numérique sécurisé",
        "flouciRedirect": "Redirection vers Flouci pour le paiement sécurisé",
        "openFlouci": "Ouvrir l'application Flouci",
        "secureTransaction": "Transaction 100% sécurisée et cryptée",
        "creditCard": "Carte Bancaire",
        "cardSchemes": "Visa / Mastercard / CIB",
        "cardNumber": "Numéro de carte",
        "cardNumberPlaceholder": "0000 0000 0000 0000",
        "expiryDate": "Date d'expiration",
        "expiryDatePlaceholder": "MM/YY",
        "cvc": "CVC",
        "cvcPlaceholder": "123",
        "cardHolder": "Nom du titulaire",
        "processing": "Traitement du paiement...",
        "processingDesc": "Veuillez patienter, ne fermez pas cette fenêtre",
        "success": "Paiement réussi !",
        "transferred": "Montant transféré",
        "transactionId": "ID Transaction",
        "totalToPay": "Total à payer",
        "payNow": "Payer maintenant",
        "flouciDescription": "Ã˜Â§Ã™â€žÃ˜Â¯Ã™ÂÃ˜Â¹ Ã˜Â¹Ã˜Â¨Ã˜Â± Flouci - Ã˜Â¨Ã˜Â·Ã˜Â§Ã™â€šÃ˜Â§Ã˜Âª Ã˜Â¨Ã™â€ Ã™Æ’Ã™Å Ã˜Â© Ã™Ë†Ã™â€¦Ã˜Â­Ã˜Â§Ã™ÂÃ˜Â¸ Ã˜Â¥Ã™â€žÃ™Æ’Ã˜ÂªÃ˜Â±Ã™Ë†Ã™â€ Ã™Å Ã˜Â©"
    },
    "notifications": {
        "title": "Notifications",
        "time": {
            "justNow": "À l'instant",
            "minutesAgo": "Il y a {{count}}m",
            "hoursAgo": "Il y a {{count}}h",
            "daysAgo": "Il y a {{count}}j"
        },
        "readAll": "Tout marquer comme lu",
        "empty": "Aucune notification",
        "caughtUp": "Vous êtes à jour",
        "emptyDesc": "Nous vous informerons dès qu'il y a du nouveau sur vos projets ou paiements.",
        "viewAll": "Voir toutes les notifications",
        "delete": "Supprimer la notification",
        "identity": {
            "rejected": {
                "title": "Demande de verification rejetee",
                "body": "Votre demande de verification d'identite a ete rejetee. Assurez-vous que les images sont claires puis renvoyez votre demande."
            }
        }
    },
    "globalSearch": {
        "placeholder": "Rechercher des missions, freelances, compétences...",
        "recent": "Recherches récentes",
        "suggestions": "Suggestions",
        "searching": "Recherche en cours...",
        "jobs": "Missions",
        "freelancers": "Freelances",
        "noResultsFor": "Aucun résultat pour \"{{query}}\"",
        "clearSearch": "Effacer la recherche",
        "toSelect": "pour sélectionner",
        "toNavigate": "pour naviguer"
    },
    "pages": {
        "clientJobs": {
            "title": "Mes Projets",
            "subtitle": "Gérez vos projets publiés et vos propositions",
            "postProject": "Publier un projet",
            "active": "Actifs",
            "proposalsReceived": "Total des propositions reçues",
            "completed": "Terminés",
            "all": "Tous",
            "inReview": "En revue",
            "loading": "Chargement des projets...",
            "emptyTitle": "Aucun projet pour le moment",
            "emptyDescription": "Publiez votre premier projet et recevez des propositions de professionnels vérifiés.",
            "postFree": "Publier un projet gratuitement",
            "viewProposals": "Voir les propositions",
            "edit": "Modifier",
            "fixedPrice": "Prix fixe",
            "hourlyRate": "Taux horaire",
            "proposalsCount": "{{count}} propositions",
            "postedAgo": "Publié {{time}}",
            "today": "Aujourd'hui",
            "oneDayAgo": "Il y a 1 jour",
            "daysAgo": "Il y a {{days}} jours",
            "status": {
                "open": "Ouvert",
                "inProgress": "En cours",
                "inReview": "En revue",
                "completed": "Terminé"
            }
        },
        "myProposals": {
            "title": "Mes Propositions",
            "subtitle": "Suivez toutes vos propositions envoyées",
            "sent": "Envoyées",
            "accepted": "Acceptées",
            "pending": "En attente",
            "rejected": "Refusées",
            "all": "Toutes",
            "loading": "Chargement des propositions...",
            "emptyTitle": "Aucune proposition pour le moment",
            "emptyDescription": "Parcourez les projets ouverts et envoyez votre première proposition.",
            "browseJobs": "Parcourir les missions",
            "unknownProject": "Projet inconnu",
            "yourBid": "Votre offre : {{amount}} TND",
            "deliveryDays": "Livraison en {{days}} jours",
            "submittedAgo": "Envoyé {{time}}",
            "today": "Aujourd'hui",
            "oneDayAgo": "Il y a 1 jour",
            "daysAgo": "Il y a {{days}} jours",
            "viewContract": "Voir le contrat"
        },
        "freelancerEarnings": {
            "seoTitle": "Gains | WorkedIn",
            "seoDescription": "Vos gains et votre historique de paiements sur WorkedIn.",
            "availableBalance": "Solde disponible",
            "pendingClearance": "{{amount}} TND en attente de validation",
            "withdraw": "Retirer",
            "totalEarned": "Total gagné",
            "thisMonth": "Ce mois-ci",
            "completedContracts": "Contrats terminés",
            "earningsOverview": "Aperçu des gains",
            "paymentHistory": "Historique des paiements",
            "noEarningsTitle": "Aucun gain pour le moment",
            "noEarningsDescription": "Terminez votre premier projet pour voir vos gains ici.",
            "browseJobs": "Parcourir les missions",
            "contractPayment": "Paiement du contrat",
            "clientId": "Client #{{id}}",
            "notAvailable": "N/D"
        },
        "authCallback": {
            "signingIn": "Connexion en cours",
            "signingInDescription": "Nous finalisons votre connexion sécurisée. Cela ne prendra qu'un instant.",
            "loginIncomplete": "La connexion n'a pas abouti",
            "loginIncompleteDescription": "Nous n'avons pas encore pu confirmer votre session. Réessayez ou revenez à la connexion.",
            "errorCode": "Code d'erreur : {{code}}",
            "tryAgain": "Réessayer",
            "backToLogin": "Retour à la connexion"
        },
        "freelancerCard": {
            "tndPerHour": "TND/h",
            "successRate": "{{rate}}% de réussite",
            "verifiedProfile": "Profil vérifié",
            "snippet": "Professionnel, réactif, et bien plus soigné que la moyenne des marketplaces.",
            "hourlyRate": "Taux horaire",
            "successScore": "Score de réussite",
            "completedJobs": "{{count}} terminés",
            "repliesIn": "Répond en {{time}}",
            "viewProfile": "Voir le profil",
            "badges": {
                "verified": "Vérifié",
                "verifiedTitle": "Identité et détails de paiement vérifiés.",
                "topRated": "Mieux noté",
                "topRatedTitle": "Excellent retour client de façon constante.",
                "fastResponder": "Réponse rapide",
                "fastResponderTitle": "Répond généralement vite aux nouveaux clients.",
                "newTalent": "Nouveau talent",
                "newTalentTitle": "Profil récent avec une bonne dynamique initiale."
            }
        },
        "errorBoundary": {
            "title": "Une erreur est survenue",
            "description": "Une erreur inattendue a interrompu cette page. Actualisez et réessayez, ou revenez à l'accueil.",
            "refresh": "Actualiser la page",
            "backHome": "Retour à l'accueil"
        },
        "freelancerDashboard": {
            "greetingFallback": "vous",
            "welcomeBack": "Bon retour",
            "welcomeDescription": "Votre activité freelance devient plus solide. Gardez le rythme et peaufinez votre profil.",
            "quickActions": "Actions rapides",
            "browseJobs": "Parcourir les missions",
            "profileSettings": "Paramètres du profil",
            "earningsTrajectory": "Évolution des gains",
            "earningsDescription": "6 derniers mois de paiements escrow libérés.",
            "sixMonthTrend": "Tendance sur 6 mois",
            "noEarningsData": "Pas encore de données de gains",
            "earnings": "Gains",
            "recentActivity": "Activité récente",
            "recentActivityDescription": "Vos dernières notifications et mises à jour.",
            "noRecentActivity": "Aucune activité récente",
            "upcomingMilestones": "Échéances à venir",
            "noUpcomingMilestones": "Aucune échéance à venir",
            "noDueDate": "Aucune date limite",
            "allCaughtUp": "Tout est à jour !",
            "stat": {
                "activeContracts": "Contrats actifs",
                "pendingProposals": "Propositions en attente",
                "totalEarnings": "Gains totaux",
                "profileViews": "Vues du profil"
            }
        },
        "messages": {
            "title": "Messages",
            "searchPlaceholder": "Rechercher dans les conversations...",
            "noMessagesYet": "Pas encore de messages",
            "emptyThread": "Pas encore de messages. Commencez la conversation !",
            "messagePlaceholder": "Écrivez votre message...",
            "selectConversationTitle": "Sélectionnez une conversation",
            "selectConversationDescription": "Choisissez une conversation dans la liste pour commencer à discuter",
            "selectConversationDetails": "Sélectionnez une conversation pour voir les détails",
            "profileAction": "Profil",
            "contractsAction": "Contrats",
            "archiveConversation": "Archiver la conversation",
            "deleteConversation": "Supprimer la conversation",
            "attachFile": "Joindre un fichier",
            "stopRecording": "Arrêter l'enregistrement",
            "recordVoice": "Enregistrer un message vocal",
            "recording": "Enregistrement...",
            "voiceMemo": "Note audio",
            "userFallback": "user",
            "loadingConversations": "Chargement des conversations...",
            "loadingMessages": "Chargement des messages...",
            "typingIndicator": {
                "singular": "est en train d'écrire...",
                "plural": "personnes sont en train d'écrire..."
            },
            "filters": {
                "all": "Tout",
                "unread": "Non lus"
            },
            "empty": {
                "noMatchingTitle": "Aucune conversation correspondante",
                "noMatchingDescription": "Essayez un autre nom ou effacez votre recherche.",
                "noConversationsTitle": "Aucune conversation pour le moment",
                "noConversationsDescription": "Commencez par envoyer une proposition ou contacter un freelance."
            },
            "errors": {
                "audioUpload": "Échec de l'envoi de l'audio",
                "fileUpload": "Échec de l'envoi du fichier",
                "fileTooLarge": "Le fichier doit faire moins de 10 Mo"
            },
            "time": {
                "now": "Maintenant",
                "minutesAgo": "Il y a {{count}} min",
                "hoursAgo": "Il y a {{count}} h",
                "daysAgo": "Il y a {{count}} j"
            }
        },
        "freelancerProfile": {
            "actions": {
                "changeProfilePicture": "Changer la photo de profil",
                "editProfile": "Modifier le profil",
                "openLink": "Ouvrir le lien",
                "viewFullProject": "Voir le projet complet",
                "openProjectLink": "Ouvrir le lien du projet",
                "previousProject": "Projet précédent",
                "nextProject": "Projet suivant"
            },
            "cta": {
                "viewPublicProfile": "Voir le profil public",
                "viewPublicProfileDescription": "Prévisualisez exactement comment les clients et visiteurs voient votre profil.",
                "portfolioDashboard": "Tableau de bord du portfolio",
                "portfolioDashboardDescription": "Ajoutez et organisez vos meilleurs exemples.",
                "myProposals": "Mes propositions",
                "myProposalsDescription": "Suivez les statuts et relancez plus vite.",
                "workspaceSettings": "Paramètres de l'espace",
                "workspaceSettingsDescription": "Notifications, sécurité et contrôles du compte.",
                "hireMe": "M'embaucher",
                "sendMessage": "Envoyer un message"
            },
            "form": {
                "fullName": "Nom complet",
                "professionalTitle": "Titre professionnel",
                "hourlyRateTnd": "Taux horaire (TND)"
            },
            "info": {
                "memberSince": "Membre depuis",
                "lastSeen": "Vu pour la dernière fois"
            },
            "labels": {
                "skillsUsed": "Compétences utilisées",
                "toolsUsed": "Outils utilisés"
            },
            "publicPreview": {
                "title": "Aperçu du profil public",
                "description": "Vous voyez votre profil tel que les autres utilisateurs le voient.",
                "exit": "Quitter l'aperçu"
            },
            "reviews": {
                "empty": "Pas encore d'avis. Terminez votre premier contrat pour recevoir des retours."
            },
            "sections": {
                "coreStrengths": "Forces clés",
                "selectedWork": "Travaux sélectionnés",
                "clientTrust": "Confiance client",
                "workInformation": "Informations de travail"
            },
            "stats": {
                "hourlyRate": "Taux horaire"
            },
            "toasts": {
                "workSampleDeleted": "Exemple de travail supprimé",
                "workSampleDeleteError": "Impossible de supprimer l'exemple de travail",
                "profileUpdated": "Détails du profil mis à jour",
                "profileUpdateError": "Impossible de mettre à jour les détails du profil",
                "bioUpdated": "Bio mise à jour",
                "bioUpdateError": "Impossible de mettre à jour la bio",
                "skillsUpdated": "Compétences mises à jour",
                "skillsUpdateError": "Impossible de mettre à jour les compétences",
                "toolsUpdated": "Outils mis à jour",
                "toolsUpdateError": "Impossible de mettre à jour les outils",
                "avatarUpdated": "Photo de profil mise à jour",
                "loginRequired": "Veuillez vous connecter pour continuer",
                "contactDisabledOwnProfile": "Mode aperçu public : l'action de contact est désactivée sur votre propre profil."
            },
            "validation": {
                "fullNameRequired": "Le nom complet est requis",
                "validHourlyRate": "Veuillez saisir un taux horaire valide",
                "avatarType": "Veuillez importer une image JPG, PNG, WEBP ou GIF.",
                "avatarSize": "La taille de l'image doit être inférieure à 5 Mo."
            },
            "verifications": {
                "paymentMethod": "Moyen de paiement"
            },
            "viewer": {
                "close": "Fermer la visionneuse du portfolio",
                "previousImage": "Image précédente",
                "nextImage": "Image suivante"
            },
            "workSamples": {
                "emptyTitle": "Aucun exemple de travail ajouté pour le moment"
            },
            "portfolio": {
                "skillsUsed": "Compétences utilisées",
                "visitProject": "Visiter le projet"
            },
            "contactModal": {
                "sectionLabel": "Message direct",
                "title": "Écrire à {{name}}",
                "body": "Une conversation directe avec {{name}} s'ouvrira dans votre espace messages.",
                "trustNote": "Utilisez la messagerie WorkedIn pour garder la communication projet claire et organisée.",
                "loginRequired": "Vous devez vous connecter pour envoyer un message",
                "loginPrompt": "Vous devez vous connecter avant de contacter des freelances.",
                "cannotMessageSelf": "Vous ne pouvez pas vous envoyer un message",
                "createFailed": "Impossible de créer la conversation",
                "startError": "Une erreur est survenue au démarrage de la conversation",
                "opening": "Ouverture...",
                "startAction": "Démarrer la conversation"
            }
        },
        "searchModal": {
            "placeholderFreelancer": "Rechercher missions, compétences...",
            "placeholderClient": "Rechercher freelances, compétences...",
            "trendingNow": "Tendances du moment",
            "resultsCount": "{{count}} résultats",
            "goTo": "Aller à",
            "tryDifferent": "Essayez un autre terme de recherche",
            "globalTitle": "Recherche globale",
            "workspaceFreelancer": "Espace freelance",
            "workspaceClient": "Espace client",
            "headerHint": "Accédez rapidement aux pages, recherchez des missions en direct et ouvrez les actions courantes.",
            "quickActions": "Actions rapides",
            "openAction": "Ouvrir",
            "recentSection": "Accès récents",
            "searchEverything": "Rechercher partout pour \"{{query}}\"",
            "searchEverythingMeta": "Ouvrir la page de recherche complète avec tous les résultats correspondants",
            "sectionBestMatch": "Meilleure correspondance",
            "sectionJobs": "Missions",
            "sectionActions": "Actions",
            "sectionGeneral": "Résultats",
            "enterHint": "Appuyez sur Entrée pour voir tous les résultats de \"{{query}}\"",
            "shortcuts": {
                "browseAllJobs": "Parcourir toutes les missions",
                "myProposals": "Mes propositions",
                "myEarnings": "Mes gains",
                "settings": "Paramètres",
                "postProject": "Publier un projet",
                "myProjects": "Mes projets",
                "findFreelancers": "Trouver des freelances",
                "contracts": "Contrats",
                "browseJobs": "Parcourir les missions",
                "howItWorks": "Comment ça marche",
                "createAccount": "Créer un compte"
            }
        },
        "mobileNav": {
            "more": "Plus",
            "help": "Aide",
            "workspaceFreelancer": "Espace freelance",
            "workspaceClient": "Espace client",
            "freelancer": "Freelance",
            "client": "Client",
            "userFallback": "Utilisateur",
            "searchPlaceholder": "Rechercher...",
            "brandName": "WorkedIn"
        },
        "login": {
            "finishingSignIn": "Finalisation de la connexion",
            "finishingSignInDescription": "Nous confirmons votre session sécurisée et vous redirigeons vers le bon espace."
        },
        "jobBoard": {
            "header": {
                "title": "Trouver du travail",
                "subtitle": "Parcourez et postulez à des opportunités freelance en Tunisie."
            },
            "filters": {
                "clearAll": "Tout effacer",
                "jobType": "Type de mission",
                "searchPlaceholder": "Rechercher des missions..."
            },
            "actions": {
                "applyNow": "Postuler"
            },
            "empty": {
                "filtered": "Aucune mission trouvée avec les filtres sélectionnés."
            },
            "errors": {
                "loadFailed": "Impossible de charger les missions. Veuillez réessayer."
            },
            "toasts": {
                "savedJobsUpdateError": "Impossible de mettre à jour les missions sauvegardées"
            }
        },
        "savedJobs": {
            "empty": {
                "title": "Rien n'est encore sauvegardé"
            },
            "labels": {
                "budget": "Budget :"
            },
            "actions": {
                "applyNow": "Postuler",
                "removeSavedJob": "Retirer la mission sauvegardée",
                "inviteToJob": "Inviter au projet",
                "removeSavedFreelancer": "Retirer le freelance sauvegardé"
            }
        },
        "settings": {
            "account": {
                "overviewTitle": "Vue du compte",
                "overviewDescription": "Gérez votre espace de travail et les détails généraux du compte.",
                "currentWorkspace": "Espace de travail actuel",
                "accountType": "Type de compte",
                "quickActions": "Actions rapides",
                "openPublicProfileEditor": "Ouvrir l'éditeur du profil public",
                "goToDashboard": "Aller au tableau de bord",
                "manageNotifications": "Gérer les notifications"
            },
            "actions": {
                "signOut": "Se déconnecter"
            },
            "notifications": {
                "toasts": {
                    "loadError": "Échec du chargement des paramètres de notification",
                    "saveError": "Impossible d'enregistrer les paramètres de notification"
                }
            },
            "payment": {
                "title": "Méthodes de paiement",
                "addMethod": "Ajouter une méthode",
                "bankTransfer": "Virement bancaire",
                "setDefault": "Définir par défaut",
                "deleteMethod": "Supprimer la méthode de paiement",
                "empty": {
                    "title": "Aucune méthode de paiement ajoutée",
                    "description": "Ajoutez maintenant une méthode de retrait afin que les contrats soient prêts quand vous en avez besoin."
                },
                "toasts": {
                    "loadError": "Échec du chargement des méthodes de paiement",
                    "added": "Méthode de paiement ajoutée",
                    "addError": "Impossible d'ajouter la méthode de paiement",
                    "defaultUpdated": "Méthode de paiement par défaut mise à jour",
                    "defaultUpdateError": "Impossible de mettre à jour la méthode par défaut",
                    "removed": "Méthode de paiement supprimée",
                    "removeError": "Impossible de supprimer la méthode de paiement"
                }
            },
            "privacy": {
                "title": "Sécurité et confidentialité",
                "changePassword": "Changer le mot de passe",
                "activeSessions": "Sessions actives",
                "currentSession": "Cet appareil est votre session actuelle.",
                "signOutAllDevices": "Se déconnecter de tous les appareils",
                "deleteAccount": "Supprimer le compte",
                "deleteAccountWarning": "Votre compte et toutes vos données seront supprimés définitivement. Cette action est irréversible.",
                "toasts": {
                    "deleteRequestInProgress": "Une demande de suppression est déjà en cours",
                    "deleteRequestSubmitted": "Demande de suppression de compte envoyée",
                    "deleteRequestError": "Impossible d'envoyer la demande de suppression",
                    "signOutAllError": "Impossible de déconnecter tous les appareils"
                }
            }
        }
    },
    "search": {
        "placeholder": "Rechercher...",
        "trending": "Tendances",
        "recent": "Recherches récentes",
        "clearAll": "Tout effacer",
        "jobs": "Missions",
        "freelancers": "Freelances",
        "skills": "Compétences",
        "resultsFor": "Résultats pour",
        "noResults": "Aucun résultat trouvé",
        "noResultsDesc": "Nous n'avons rien trouvé correspondant à votre recherche",
        "suggestions": {
            "mobileApp": "Application mobile",
            "logo": "Logo",
            "seo": "SEO",
            "logoDesign": "Création de logo",
            "reactJs": "React JS",
            "translation": "Traduction",
            "videoEditing": "Montage vidéo",
            "python": "Python"
        }
    },
    "onboarding": {
        "currentStep": "Étape actuelle",
        "client": {
            "welcome": "Bienvenue",
            "welcomeDesc": "Finalisez votre profil client pour publier vos projets avec confiance.",
            "profileTitle": "Profil client",
            "profileDesc": "Les informations de base que les freelances verront en premier.",
            "timeoutError": "La demande a pris trop de temps. Veuillez réessayer."
        },
        "freelancer": {
            "welcome": "Bienvenue",
            "welcomeDesc": "Complétez votre profil freelance et commencez à recevoir de vraies opportunités.",
            "maxSkills": "Maximum 5 compétences",
            "noAuthSession": "Aucune session active, veuillez vous reconnecter",
            "basicInfoSaved": "Informations de base enregistrées",
            "serverConnectionFailed": "Échec de connexion au serveur. Vérifiez votre connexion Internet et réessayez.",
            "selectAtLeastOneSkill": "Veuillez sélectionner au moins une compétence",
            "connectionFailed": "Échec de connexion. Vérifiez votre connexion Internet et réessayez.",
            "skillsSaveFailed": "Échec de l'enregistrement des compétences",
            "completionFailed": "Échec de finalisation de l'intégration. Veuillez réessayer.",
            "welcomeToast": "Bienvenue sur WorkedIn !",
            "stepCounter": "Étape {{step}} sur {{total}}",
            "stepBasicInfo": "Informations de base",
            "stepSkillsExperience": "Compétences et expérience",
            "completeLaterHint": "Vous pouvez ajouter certificats, portfolio et autres informations plus tard depuis les paramètres.",
            "steps": {
                "skills": "Compétences",
                "bio": "Bio",
                "experience": "Expérience",
                "portfolio": "Portfolio"
            },
            "uploadAvatar": "Photo de profil",
            "uploadAvatarDesc": "Une photo professionnelle est recommandée"
        },
        "progressive": {
            "common": {
                "removeTagAria": "Supprimer {{item}}",
                "stepCounter": "Étape {{step}} sur {{total}}",
                "saveExit": "Enregistrer et quitter",
                "back": "Retour",
                "proTip": "Conseil pro",
                "onboardingRequired": "Veuillez terminer votre profil d'intégration avant d'accéder aux autres pages.",
                "fixBeforeContinue": "Corrigez ceci avant de continuer : {{error}}",
                "completeRequiredFields": "Veuillez compléter les champs obligatoires avant de continuer.",
                "completionFailed": "Échec de finalisation de l'intégration. Veuillez réessayer.",
                "conflictRetry": "Un conflit de mise à jour a été détecté. Veuillez réessayer.",
                "phoneTaken": "Ce numéro de téléphone est déjà utilisé par un autre compte.",
                "invalidPhone": "Veuillez entrer un numéro de téléphone valide.",
                "accountInactive": "Votre compte n'est pas actif. Veuillez contacter le support.",
                "unsavedConfirm": "Vous avez une progression non enregistrée. Quitter quand même ?",
                "exitOnboarding": "Quitter l'intégration",
                "completing": "Finalisation...",
                "completeProfile": "Terminer le profil",
                "nextStep": "Étape suivante",
                "fields": {
                    "fullName": "Nom complet",
                    "location": "Localisation",
                    "phoneNumber": "Numéro de téléphone"
                },
                "placeholders": {
                    "fullName": "Votre nom complet",
                    "selectLocation": "Sélectionner une localisation"
                }
            },
            "freelancer": {
                "steps": {
                    "identityPitch": "Identité et positionnement",
                    "expertise": "Expertise",
                    "businessRates": "Tarifs et conditions",
                    "trustProof": "Preuves de confiance"
                },
                "stepSubtitles": {
                    "identityPitch": "Présentez qui vous êtes et la valeur que vous apportez.",
                    "expertise": "Définissez vos points forts pour améliorer le matching.",
                    "businessRates": "Fixez des conditions claires pour aligner les attentes.",
                    "trustProof": "Ajoutez des signaux de confiance qui rassurent les clients."
                },
                "tips": {
                    "identityPitch": "Les clients décident en quelques secondes. Un titre clair et un résumé solide renforcent immédiatement la confiance.",
                    "expertise": "Les bons tags améliorent le matching. Ajoutez uniquement vos compétences et outils les plus pertinents.",
                    "businessRates": "Des tarifs transparents réduisent la friction et accélèrent la présélection.",
                    "trustProof": "Les informations vérifiées et un portfolio augmentent fortement votre crédibilité."
                },
                "categories": {
                    "development": "Développement",
                    "design": "Design",
                    "marketing": "Marketing",
                    "writing": "Rédaction",
                    "video": "Vidéo",
                    "data": "Data",
                    "business": "Business"
                },
                "skillSuggestions": {
                    "react": "React",
                    "typescript": "TypeScript",
                    "nodejs": "Node.js",
                    "uiux": "Design UI/UX",
                    "figma": "Figma",
                    "contentWriting": "Rédaction de contenu",
                    "seo": "SEO",
                    "googleAds": "Google Ads",
                    "motionDesign": "Motion Design",
                    "dataAnalysis": "Analyse de données",
                    "python": "Python",
                    "nextjs": "Next.js",
                    "tailwind": "Tailwind CSS",
                    "illustrator": "Illustrator",
                    "projectManagement": "Gestion de projet"
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
                    "partTime": "Temps partiel",
                    "fullTime": "Temps plein",
                    "asNeeded": "Selon besoin"
                },
                "errors": {
                    "avatarRequired": "L'avatar est requis.",
                    "fullNameRequired": "Le nom complet est requis.",
                    "locationRequired": "La localisation est requise.",
                    "professionalTitleRequired": "Le titre professionnel est requis.",
                    "summaryRequired": "Le résumé est requis.",
                    "summaryTooLong": "Le résumé doit contenir 500 caractères maximum.",
                    "mainCategoryRequired": "La catégorie principale est requise.",
                    "coreSkillRequired": "Ajoutez au moins une compétence principale.",
                    "toolRequired": "Ajoutez au moins un outil.",
                    "hourlyRateInvalid": "Le tarif horaire doit être supérieur à 0.",
                    "experienceRequired": "Sélectionnez vos années d'expérience.",
                    "availabilityRequired": "Sélectionnez votre disponibilité.",
                    "portfolioRequired": "Le lien du portfolio est requis.",
                    "phoneRequired": "Le numéro de téléphone est requis."
                },
                "completedTitle": "Configuration du profil terminée",
                "completedSubtitle": "Vos informations d'intégration freelance sont prêtes. Vous pouvez continuer vers votre tableau de bord.",
                "completedMessage": "Merci. Vos informations d'intégration ont été enregistrées avec une structure progressive.",
                "currency": "TND",
                "fields": {
                    "avatarUpload": "Téléversement de l'avatar (obligatoire)",
                    "avatarPreviewAlt": "Aperçu de l'avatar",
                    "chooseAvatar": "Choisir un avatar",
                    "avatarHint": "PNG, JPG, WEBP",
                    "professionalTitle": "Titre professionnel",
                    "bioSummary": "Bio / Résumé",
                    "mainCategory": "Catégorie principale",
                    "coreSkills": "Compétences principales",
                    "toolsUsed": "Outils utilisés",
                    "hourlyRate": "Tarif horaire",
                    "yearsOfExperience": "Années d'expérience",
                    "availability": "Disponibilité",
                    "portfolioLink": "Lien du portfolio"
                },
                "placeholders": {
                    "professionalTitle": "Développeur React senior",
                    "bioSummary": "Quelles sont vos forces et quels types de projets vous motivent ?",
                    "selectCategory": "Sélectionner une catégorie",
                    "coreSkills": "Saisissez une compétence puis appuyez sur Entrée",
                    "toolsUsed": "Saisissez un outil puis appuyez sur Entrée",
                    "hourlyRate": "80",
                    "experienceRange": "Sélectionner une plage",
                    "availability": "Sélectionner une disponibilité",
                    "portfolioLink": "https://votre-portfolio.com",
                    "phoneNumber": "Pour la sécurité et le badge vérifié"
                },
                "hints": {
                    "coreSkills": "Recherchez et ajoutez jusqu'à 30 compétences",
                    "toolsUsed": "Recherchez et ajoutez jusqu'à 15 outils",
                    "phoneNumber": "Pour la sécurité et le badge vérifié."
                }
            },
            "client": {
                "steps": {
                    "accountDetails": "Détails du compte",
                    "hiringIntent": "Intention d'embauche"
                },
                "tips": {
                    "accountDetails": "Un profil complet augmente le taux de réponse et réduit l'abandon au premier contact client-freelance.",
                    "hiringIntent": "Une intention d'embauche claire améliore les recommandations et la qualité des profils suggérés."
                },
                "accountTypes": {
                    "individual": "Particulier",
                    "company": "Entreprise"
                },
                "primaryGoals": {
                    "specificProject": "Recruter pour un projet précis",
                    "buildTeam": "Constituer une équipe",
                    "justBrowsing": "Je parcours seulement"
                },
                "errors": {
                    "fullNameRequired": "Le nom complet est requis.",
                    "locationRequired": "La localisation est requise.",
                    "phoneRequired": "Le numéro de téléphone est requis.",
                    "accountTypeRequired": "Le type de compte est requis.",
                    "companyNameRequired": "Le nom de l'entreprise est requis pour un compte entreprise.",
                    "primaryGoalRequired": "L'objectif principal est requis."
                },
                "stepSubtitles": {
                    "accountDetails": "L'essentiel pour rendre votre compte fiable et complet.",
                    "hiringIntent": "Dites-nous ce que vous souhaitez recruter pour personnaliser le matching."
                },
                "completedTitle": "Intégration terminée",
                "completedSubtitle": "Votre profil client est prêt. Vous pouvez continuer vers votre tableau de bord.",
                "completedMessage": "Les informations d'intégration client sont complètes.",
                "fields": {
                    "accountType": "Type de compte",
                    "companyName": "Nom de l'entreprise",
                    "primaryGoal": "Objectif principal"
                },
                "placeholders": {
                    "phoneNumber": "+216 00 000 000",
                    "companyName": "Nom de votre entreprise"
                }
            }
        }
    },
    "verifyIdentity": {
        "preview": "Aperçu",
        "changeImage": "Changer",
        "removeImage": "Supprimer",
        "uploadHint": "Cliquez pour téléverser une image",
        "dragDropHint": "ou glissez-déposez ici",
        "fileFormatHint": "JPG, PNG (Max 5MB)",
        "processing": "Traitement...",
        "stepCounter": "Étape {{current}} sur {{total}}",
        "tipLabel": "Astuce :",
        "backToSettings": "Retour aux paramètres",
        "goToDashboard": "Aller au tableau de bord",
        "loginAgainError": "Veuillez vous reconnecter",
        "seo": {
            "title": "Vérification d'identité",
            "description": "Vérifiez votre identité pour renforcer la confiance des clients et débloquer toutes les fonctionnalités"
        },
        "header": {
            "kicker": "Mise à niveau sécurisée du compte",
            "title": "Vérification d'identité",
            "subtitle": "Une seule étape pour renforcer la confiance de vos clients et protéger votre compte",
            "eta": "Prend environ 2-3 minutes à compléter"
        },
        "security": {
            "title": "Stockage chiffré",
            "desc": "Vos documents sont chiffrés et utilisés uniquement pour la vérification du compte.",
            "qualityTitle": "Vérifications qualité intelligentes",
            "qualityDesc": "Nous validons le format, la taille et la qualité de base de l'image avant téléversement.",
            "reviewTitle": "Révision rapide",
            "reviewDesc": "La plupart des demandes de vérification sont traitées sous 24 heures."
        },
        "steps": {
            "front": {
                "title": "Recto de la carte d'identité",
                "description": "Veuillez téléverser une image claire du recto de votre carte d'identité nationale"
            },
            "back": {
                "title": "Verso de la carte d'identité",
                "description": "Veuillez téléverser une image claire du verso de votre carte d'identité nationale"
            },
            "selfie": {
                "title": "Photo selfie",
                "description": "Veuillez prendre un selfie clair pour vérifier votre identité"
            }
        },
        "tips": {
            "front": "Placez la carte sur un fond sombre et évitez les reflets du flash.",
            "back": "Assurez-vous que tous les bords et numéros soient visibles et nets.",
            "selfie": "Regardez l'appareil photo dans un bon éclairage et évitez chapeaux ou lunettes de soleil."
        },
        "verified": {
            "title": "Votre identité a été vérifiée avec succès",
            "description": "Votre compte est maintenant vérifié et vous avez obtenu le badge de vérification bleu. Vous pouvez désormais profiter de toutes les fonctionnalités."
        },
        "pending": {
            "seoTitle": "Demande de vérification en cours",
            "seoDescription": "Votre demande de vérification d'identité est en cours de traitement",
            "badge": "En cours de révision",
            "title": "Votre demande est en cours de révision",
            "description": "Votre demande de vérification d'identité a été reçue avec succès. Notre équipe examine vos documents.",
            "reviewTime": "Délai de révision : jusqu'à 24 heures",
            "emailNotice": "Vous serez notifié dès la fin de la révision"
        },
        "submitted": {
            "seoTitle": "Demande envoyée",
            "seoDescription": "Votre demande de vérification d'identité a été reçue",
            "title": "Votre demande a été reçue avec succès",
            "description": "Notre équipe examinera vos documents et vous répondra dès que possible (généralement sous 24h). Nous vous notifierons par e-mail une fois la révision terminée."
        },
        "review": {
            "title": "Vérifier les informations",
            "readiness": "Score de préparation",
            "cinLabel": "Numéro de carte d'identité (8 chiffres)",
            "cinPlaceholder": "12345678",
            "frontImage": "Recto",
            "backImage": "Verso",
            "selfieImage": "Selfie",
            "checkFront": "Image recto ajoutée",
            "checkBack": "Image verso ajoutée",
            "checkSelfie": "Selfie ajouté",
            "checkCin": "Numéro CIN valide",
            "checkConsent": "Consentement de confidentialité accepté",
            "editFront": "Modifier l'image recto",
            "editBack": "Modifier l'image verso",
            "editSelfie": "Modifier le selfie",
            "privacyNotice": "Vos données sont stockées de manière sécurisée et chiffrée. Vos informations d'identité ne seront partagées avec aucun tiers et sont utilisées uniquement pour la vérification du compte.",
            "consentPrefix": "J'accepte l'utilisation de mes informations personnelles pour vérifier mon identité conformément à la ",
            "privacyPolicy": "Politique de confidentialité",
            "submitting": "Envoi en cours...",
            "submit": "Confirmer et envoyer"
        },
        "success": {
            "submitted": "Demande de vérification envoyée avec succès"
        },
        "errors": {
            "fileTooLarge": "Le fichier est trop volumineux (maximum 5MB)",
            "invalidImage": "Veuillez téléverser une image valide",
            "lowResolution": "La résolution de l'image est trop faible. Utilisez une photo plus claire.",
            "fileReadFailed": "Impossible de lire ce fichier. Veuillez essayer une autre image.",
            "invalidCin": "Le numéro de carte doit contenir 8 chiffres",
            "missingImages": "Veuillez téléverser toutes les images requises",
            "noSession": "Aucune session active - veuillez vous reconnecter",
            "insertTimeout": "L'insertion en base a expiré après 30 secondes. Supabase est peut-être en maintenance.",
            "alreadySubmitted": "Vous avez déjà une demande de vérification.",
            "permissions": "Permission refusée. Veuillez vous déconnecter puis vous reconnecter.",
            "unexpected": "Une erreur inattendue est survenue",
            "withMessage": "Erreur : {{message}}"
        },
        "progress": {
            "front": "Recto",
            "back": "Verso",
            "selfie": "Selfie",
            "review": "Vérification"
        }
    },
    "legalPages": {
        "privacy": {
            "title": "Politique de confidentialité",
            "lastUpdated": "Dernière mise à jour : janvier 2026",
            "sections": {
                "dataCollection": {
                    "title": "1. Données collectées",
                    "intro": "Nous collectons les informations suivantes lorsque vous utilisez la plateforme :",
                    "items": {
                        "account": "Informations du compte : nom, e-mail, numéro de téléphone",
                        "profile": "Informations du profil : compétences, expérience, images",
                        "usage": "Données d’utilisation : pages visitées, temps passé",
                        "payment": "Informations de paiement : détails du compte bancaire (chiffrés)"
                    }
                },
                "usage": {
                    "title": "2. Utilisation de vos données",
                    "items": {
                        "improve": "Fournir et améliorer nos services",
                        "transactions": "Traiter les transactions financières",
                        "notifications": "Envoyer des notifications importantes",
                        "security": "Prévenir la fraude et protéger la sécurité",
                        "experience": "Améliorer l’expérience utilisateur"
                    }
                },
                "sharing": {
                    "title": "3. Partage des données",
                    "intro": "Nous ne vendons pas vos données personnelles. Nous pouvons les partager avec :",
                    "items": {
                        "paymentProviders": "Fournisseurs de paiement (pour traiter les transactions)",
                        "legalAuthorities": "Autorités légales (sur demande officielle)",
                        "publicProfile": "Autres utilisateurs (informations publiques du profil)"
                    }
                },
                "protection": {
                    "title": "4. Protection des données",
                    "intro": "Nous utilisons des mesures de sécurité avancées pour protéger vos données :",
                    "items": {
                        "ssl": "Chiffrement SSL/TLS pour toutes les communications",
                        "database": "Chiffrement des données sensibles en base de données",
                        "audits": "Audits de sécurité réguliers"
                    }
                },
                "rights": {
                    "title": "5. Vos droits",
                    "items": {
                        "access": "Accéder à vos données personnelles",
                        "correction": "Corriger les données inexactes",
                        "deletion": "Supprimer votre compte et vos données",
                        "export": "Exporter vos données"
                    }
                },
                "cookies": {
                    "title": "6. Cookies",
                    "text": "Nous utilisons des cookies pour améliorer votre expérience. Vous pouvez gérer ces paramètres dans votre navigateur."
                },
                "contact": {
                    "title": "7. Contact",
                    "intro": "Pour toute question liée à la confidentialité :",
                    "emailLabel": "E-mail :"
                }
            }
        },
        "terms": {
            "title": "Conditions d'utilisation",
            "lastUpdated": "Dernière mise à jour : janvier 2026",
            "sections": {
                "intro": {
                    "title": "1. Introduction",
                    "text": "Bienvenue sur WorkedIn.tn, la plateforme freelance leader en Tunisie. En utilisant cette plateforme, vous acceptez de respecter ces conditions."
                },
                "registration": {
                    "title": "2. Inscription et comptes",
                    "items": {
                        "age": "Vous devez avoir au moins 18 ans pour vous inscrire",
                        "accuracy": "Les informations fournies doivent être exactes et à jour",
                        "security": "Vous êtes responsable de la sécurité de votre compte",
                        "report": "Vous devez nous informer immédiatement de toute utilisation non autorisée"
                    }
                },
                "platformUse": {
                    "title": "3. Utilisation de la plateforme",
                    "intro": "Les usages suivants sont interdits sur la plateforme :",
                    "items": {
                        "illegal": "Toute activité illégale",
                        "impersonation": "Usurpation d’identité",
                        "abusive": "Publication de contenu abusif ou nuisible",
                        "paymentBypass": "Contournement des mécanismes de paiement",
                        "dataHarvesting": "Collecte non autorisée des données utilisateurs"
                    }
                },
                "contractsPayments": {
                    "title": "4. Contrats et paiements",
                    "intro": "WorkedIn.tn agit comme intermédiaire entre freelances et clients. Nous ne sommes pas partie aux contrats conclus entre eux.",
                    "items": {
                        "fee": "Frais de plateforme : 10% de la valeur de chaque contrat",
                        "secureMethods": "Les paiements sont traités via des moyens sécurisés et approuvés",
                        "holdPeriod": "Période de retenue des paiements : 7 jours"
                    }
                },
                "disputes": {
                    "title": "5. Résolution des litiges",
                    "text": "En cas de litige, nous proposons un mécanisme d'arbitrage. Les décisions de l'équipe support sont finales et contraignantes."
                },
                "contact": {
                    "title": "6. Contact",
                    "intro": "Pour nous contacter au sujet de ces conditions :",
                    "emailLabel": "E-mail :"
                }
            }
        }
    },
    "footer": {
        "about": "À propos",
        "faq": "FAQ",
        "terms": "Conditions",
        "privacy": "Confidentialité",
        "contact": "Contact",
        "quickLinks": "Liens rapides",
        "legal": "Légal",
        "description": "Pensé pour les professionnels tunisiens, avec identité vérifiée, paiements protégés par escrow et projets payés en TND.",
        "city": "Tunis, Tunisie",
        "newsletterTitle": "Nouveautés produit",
        "newsletterDescription": "Recevez les notes produit, les nouveautés de lancement et les évolutions importantes sur la confiance et les paiements de WorkedIn.",
        "newsletterPlaceholder": "Votre adresse e-mail",
        "newsletterAction": "S’abonner",
        "madeInTunisia": "Conçu en Tunisie.",
        "copyright": "(c) 2026 WorkedIn.tn - Tous droits réservés",
        "socialFacebook": "Facebook",
        "socialTwitter": "Twitter",
        "socialInstagram": "Instagram",
        "socialLinkedin": "LinkedIn"
    },
    "findFreelancers": {
        "searchPlaceholder": "Rechercher des freelances...",
        "availableNow": "Disponible maintenant",
        "availableNowDesc": "Disponible pour commencer immédiatement",
        "category": "Catégorie",
        "skills": "Compétences",
        "hourlyRate": "Taux horaire (TND)",
        "clearFilters": "Effacer tous les filtres",
        "verifiedOnly": "Identité vérifiée uniquement",
        "verifiedOnlyDesc": "Mieux notés (4.5+)",
        "hero": {
            "badge": "Professionnels tunisiens vérifiés",
            "title": "Trouvez la bonne personne,",
            "titleHighlight": "pas n’importe qui.",
            "subtitle": "Plus de 2 500 développeurs, designers, traducteurs et consultants tunisiens — vérifiés, évalués, prêts.",
            "subtitleDesktop": ""
        },
        "heroStats": {
            "talentPool": "Profils vérifiés",
            "verified": "Identité contrôlée",
            "fastReplies": "Note moyenne"
        },
        "filterToggle": "Filtrer les résultats",
        "filterTitle": "Filtrer la recherche",
        "clearAll": "Tout effacer",
        "resultsCount": "Affichage de {{count}} résultats",
        "activeFilters": "Actif",
        "sort": {
            "label": "Trier par :",
            "recommended": "Recommandé",
            "rating": "Mieux notés",
            "priceLow": "Prix le plus bas"
        },
        "resultStats": {
            "availableNow": "Disponibles maintenant",
            "averageRate": "Tarif moyen",
            "topRating": "Mieux notés"
        },
        "noResults": {
            "title": "Aucun résultat correspondant",
            "description": "Nous n’avons pas trouvé de freelances correspondant à vos critères. Essayez d’autres mots-clés ou effacez les filtres.",
            "action": "Effacer tous les filtres"
        }
    },
    "wallet": {
        "seo": {
            "title": "Portefeuille",
            "description": "Suivez votre solde, vos transactions et vos demandes de retrait."
        },
        "title": "Mon Portefeuille",
        "balance": "Solde Disponible",
        "pendingBalance": "En Attente dans l'Escrow",
        "totalEarned": "Total Gagné",
        "totalWithdrawn": "Total Retiré",
        "requestWithdrawal": "Demander un Retrait",
        "deposit": "Ajouter des fonds",
        "paymentMethod": "Methode de paiement",
        "depositAmountLabel": "Montant du depot (TND)",
        "depositLimits": "Min: 10 TND - Max: 5,000 TND",
        "continueToPayment": "Continuer vers le paiement",
        "processingDeposit": "Traitement...",
        "depositAmountError": "Le montant doit etre entre {{min}} et {{max}} TND",
        "noPaymentLink": "Le lien de paiement n'a pas ete genere",
        "genericError": "Une erreur est survenue. Veuillez reessayer.",
        "comingSoonLabel": "Bientot",
        "moreMethodsSoon": "D'autres moyens de paiement seront bientot disponibles.",
        "transactionHistory": "Historique des Transactions",
        "withdrawalHistory": "Historique des Retraits",
        "amount": "Montant",
        "method": "Méthode de Retrait",
        "bankTransfer": "Virement Bancaire",
        "d17": "D17",
        "flouci": "Flouci",
        "bankName": "Nom de la Banque",
        "iban": "IBAN",
        "phone": "Numéro de Téléphone",
        "submit": "Soumettre",
        "cancel": "Annuler",
        "noTransactions": "Aucune transaction",
        "noTransactionsDesc": "Votre historique de transactions apparaîtra ici",
        "date": "Date",
        "type": "Type",
        "description": "Description",
        "netAmount": "Montant Net",
        "statusLabel": "Statut",
        "transactionLabel": "Transaction",
        "previous": "Précédent",
        "next": "Suivant",
        "pageOf": "Page {{page}} sur {{totalPages}}",
        "noWithdrawals": "Aucun retrait",
        "noWithdrawalsDesc": "Demandez un retrait pour le voir ici",
        "invalidAmount": "Montant invalide",
        "fillBankDetails": "Veuillez remplir toutes les coordonnées bancaires",
        "enterPhone": "Veuillez entrer le numéro de téléphone",
        "notAuthenticated": "Non authentifié",
        "withdrawalSuccess": "Demande de retrait soumise avec succès",
        "withdrawalError": "Échec de la soumission de la demande de retrait",
        "withdrawalSubmittedTitle": "Demande de Retrait Soumise",
        "withdrawalSubmittedDesc": "Votre demande sera examinée sous 2 à 5 jours ouvrables",
        "availableBalance": "Solde Disponible",
        "accountHolder": "Nom du titulaire du compte",
        "submitting": "Envoi en cours...",
        "submitWithdrawal": "Soumettre la Demande de Retrait",
        "minAmount": "Min {{min}} TND",
        "errors": {
            "bankNameRequired": "Le nom de la banque est requis",
            "accountHolderRequired": "Le nom du titulaire du compte est requis",
            "ibanRequired": "L'IBAN est requis",
            "ibanInvalid": "L'IBAN doit commencer par TN",
            "phoneRequired": "Le numero de telephone est requis",
            "phoneInvalid": "Entrez un numero de telephone valide"
        },
        "status": {
            "pending": "En Attente",
            "approved": "Approuvé",
            "processing": "En Traitement",
            "completed": "Terminé",
            "rejected": "Rejeté"
        }
    },
    "verifyEmail": {
        "title": "Vérifiez votre email",
        "subtitle": "Nous avons envoyé un lien de vérification à {{email}}. Cliquez dessus pour activer votre compte.",
        "resend": "Renvoyer l'email de vérification",
        "resendSuccess": "Email de vérification envoyé avec succès",
        "resendCooldown": "Renvoyer dans {{seconds}} secondes",
        "wrongEmail": "Mauvais email? Retour à l'inscription",
        "checkSpam": "Si vous ne voyez pas l'email, vérifiez votre dossier spam.",
        "noEmail": "L'adresse email est requise"
    },
    "seo": {
        "home": {
            "title": "WorkedIn",
            "description": "Connectez-vous avec des professionnels tunisiens vérifiés pour vos projets. Paiements sécurisés en TND et protection escrow."
        },
        "howItWorks": {
            "title": "Comment fonctionne WorkedIn",
            "description": "Découvrez comment WorkedIn vous fait passer de l'idée au paiement validé en quatre étapes protégées."
        },
        "forClients": {
            "title": "Recrutez des talents tunisiens vérifiés",
            "description": "Publiez gratuitement, recevez des propositions de professionnels vérifiés et payez uniquement à la validation."
        },
        "faq": {
            "title": "Questions fréquentes",
            "description": "Retrouvez des réponses sur les paiements, l'escrow, la vérification d'identité et le fonctionnement de WorkedIn."
        },
        "jobBoard": {
            "title": "Missions freelance",
            "description": "Parcourez les missions freelance en Tunisie et trouvez des projets adaptés à vos compétences, votre tarif et votre disponibilité."
        },
        "jobDetail": {
            "titleSuffix": "Détails du projet",
            "descriptionFallback": "Consultez les détails du projet, le budget et les exigences avant de postuler."
        },
        "findFreelancers": {
            "title": "Trouvez des professionnels tunisiens vérifiés",
            "description": "Trouvez 2 500+ développeurs, designers, traducteurs et consultants tunisiens vérifiés, notés et disponibles."
        },
        "freelancerProfile": {
            "addSkillPlaceholder": "Ajouter une compétence...",
            "typeSkillPlaceholder": "Saisissez une compétence puis appuyez sur Entrée...",
            "titleSuffix": "Freelance sur WorkedIn",
            "descriptionFallback": "Freelance sur la plateforme WorkedIn"
        },
        "login": {
            "title": "Connectez-vous à WorkedIn",
            "description": "Connectez-vous à votre compte WorkedIn pour gérer vos projets, messages et paiements."
        },
        "signup": {
            "title": "Créez votre compte WorkedIn",
            "description": "Créez votre compte et rejoignez 2 500+ professionnels qui développent leur carrière sur WorkedIn."
        },
        "notifications": {
            "title": "Notifications | WorkedIn",
            "description": "Vos notifications"
        }
    },
    "toasts": {
        "portfolio": {
            "loadError": "Échec du chargement du portfolio",
            "updateSuccess": "Portfolio mis à jour avec succès",
            "addSuccess": "Travail ajouté avec succès",
            "saveError": "Échec de la sauvegarde",
            "deleteSuccess": "Travail supprimé avec succès",
            "deleteError": "Échec de la suppression"
        },
        "proposals": {
            "loadJobError": "Échec du chargement des détails",
            "loadError": "Échec du chargement des propositions",
            "hireFirstMessage": "Vous devez d'abord embaucher le freelance pour démarrer une conversation",
            "shortlistRemoved": "Retiré de la liste courte",
            "shortlistAdded": "Ajouté à la liste courte",
            "shortlistError": "Échec de la mise à jour de la liste",
            "hireSuccess": "Freelance embauché avec succès !",
            "hireError": "Échec de l'embauche. Veuillez réessayer",
            "archiveSuccess": "Proposition archivée",
            "archiveError": "Échec de l'archivage",
            "submitSuccess": "Proposition soumise avec succès !",
            "withdrawSuccess": "Proposition retirée avec succès",
            "withdrawError": "Échec du retrait"
        },
        "contract": {
            "deliverSuccess": "Travail livré avec succès !",
            "deliverError": "Échec de la livraison",
            "acceptSuccess": "Travail accepté et paiement libéré !",
            "acceptError": "Échec de l'acceptation",
            "requestChanges": "Demander des modifications",
            "requestChangesSuccess": "Demande envoyée",
            "disputeSuccess": "Litige ouvert. Sera examiné sous 48 heures.",
            "disputeError": "Échec de l'ouverture du litige",
            "reviewSuccess": "Votre avis soumis avec succès"
        },
        "job": {
            "saved": "Offre sauvegardée",
            "unsaved": "Offre retirée des sauvegardées",
            "loginRequired": "Connectez-vous pour sauvegarder",
            "linkCopied": "Lien copié"
        },
        "matches": {
            "searchError": "Échec de la recherche",
            "contractSuccess": "Contrat démarré avec succès !",
            "contractError": "Échec de la création du contrat"
        },
        "resetPassword": {
            "linkExpired": "Lien expiré",
            "success": "Mot de passe changé avec succès"
        },
        "forgotPassword": {
            "rateLimitError": "Trop de tentatives. Veuillez réessayer plus tard.",
            "linkSent": "Lien envoyé"
        },
        "common": {
            "error": "Une erreur est survenue",
            "success": "Opération réussie",
            "genericError": "Erreur"
        }
    },
    "portfolio": {
        "title": "Gestion du Portfolio",
        "subtitle": "Ajoutez et modifiez vos travaux précédents pour augmenter vos chances d'être embauché",
        "addNew": "Ajouter un nouveau travail",
        "addFirst": "Ajouter votre premier travail",
        "empty": {
            "title": "Aucun travail à afficher",
            "description": "Ajoutez des exemples de vos travaux précédents pour que les clients puissent voir vos compétences et votre qualité"
        },
        "loadError": "Erreur lors du chargement du portfolio",
        "workUpdated": "Portfolio mis à jour avec succès",
        "workAdded": "Travail ajouté avec succès",
        "workSaved": "Travail enregistré avec succès",
        "saveError": "Erreur lors de l'enregistrement du travail",
        "workDeleted": "Travail supprimé avec succès",
        "deleteError": "Erreur lors de la suppression",
        "deleteConfirm": "Êtes-vous sûr de vouloir supprimer ce travail ?",
        "view": {
            "gridAria": "Vue grille",
            "listAria": "Vue liste"
        },
        "form": {
            "addTitle": "Ajouter un nouveau travail",
            "editTitle": "Modifier le travail",
            "imageHint": "Importez une image d'aperçu ou collez un lien direct vers l'image.",
            "fields": {
                "title": {
                    "label": "Titre du projet",
                    "placeholder": "Exemple : design d'une boutique e-commerce"
                },
                "description": {
                    "label": "Description du projet",
                    "placeholder": "Décrivez les détails du projet et ce que vous avez livré..."
                },
                "projectUrl": {
                    "label": "URL du projet (optionnel)",
                    "placeholder": "https://example.com"
                },
                "clientName": {
                    "label": "Client / Marque (optionnel)",
                    "placeholder": "Exemple : Acme Corp"
                },
                "completionDate": {
                    "label": "Date d'achèvement"
                },
                "skills": {
                    "label": "Compétences utilisées",
                    "placeholder": "Exemple : design UI, développement frontend, retouche photo (séparées par des virgules)",
                    "searchPlaceholder": "Rechercher et sélectionner des compétences..."
                },
                "tools": {
                    "label": "Outils utilisés (optionnel)",
                    "searchPlaceholder": "Rechercher et sélectionner des outils..."
                },
                "imageUpload": {
                    "label": "Importer l'image d'aperçu"
                },
                "imageUrl": {
                    "label": "Ou coller l'URL de l'image",
                    "placeholder": "https://..."
                }
            },
            "actions": {
                "cancel": "Annuler",
                "add": "Ajouter le travail",
                "save": "Enregistrer les modifications"
            },
            "upload": {
                "action": "Importer une image",
                "replace": "Remplacer l'image",
                "remove": "Supprimer",
                "edit": "Modifier l'image",
                "delete": "Supprimer l'image",
                "addMore": "Ajouter une image",
                "addUrl": "Ajouter l'URL",
                "extraUrlPlaceholder": "https://image-url.com/preview.jpg",
                "galleryLabel": "Images supplémentaires",
                "extraAdded": "Image ajoutée à la galerie",
                "uploading": "Import en cours...",
                "success": "Image importée avec succès",
                "error": "Échec de l'import de l'image",
                "networkError": "Le service d'import est indisponible pour le moment. Vous pouvez coller une URL d'image directe.",
                "permissionError": "Vous n'avez pas l'autorisation d'importer des fichiers dans le stockage.",
                "loginRequired": "Veuillez vous connecter pour importer des images.",
                "previewAlt": "Image d'aperçu du portfolio"
            },
            "skills": {
                "remove": "Retirer la compétence",
                "edit": "Modifier",
                "clearAll": "Tout supprimer",
                "noneSelected": "Aucune compétence sélectionnée pour le moment.",
                "noResults": "Aucune compétence correspondante trouvée.",
                "sections": {
                    "design": "Design",
                    "development": "Développement",
                    "writing": "Rédaction",
                    "marketing": "Marketing",
                    "video": "Vidéo",
                    "business": "Business",
                    "data": "Données",
                    "other": "Autre"
                }
            },
            "tools": {
                "remove": "Retirer l'outil",
                "edit": "Modifier",
                "clearAll": "Tout supprimer",
                "noneSelected": "Aucun outil sélectionné pour le moment.",
                "noResults": "Aucun outil correspondant trouvé.",
                "sections": {
                    "design": "Design",
                    "development": "Développement",
                    "productivity": "Productivité",
                    "video": "Vidéo",
                    "marketing": "Marketing",
                    "other": "Autre"
                }
            },
            "validation": {
                "titleMin": "Le titre doit contenir au moins 3 caractères",
                "descriptionMin": "La description doit contenir au moins 10 caractères",
                "invalidUrl": "Veuillez utiliser une URL http/https valide",
                "invalidImageUrl": "Veuillez utiliser une URL d'image directe en http/https",
                "imageRequired": "Veuillez importer une image ou fournir une URL d'image directe",
                "skillsLimit": "Vous pouvez sélectionner jusqu'à {{count}} compétences",
                "toolsLimit": "Vous pouvez sélectionner jusqu'à {{count}} outils"
            }
        },
        "card": {
            "clientPrefix": "Client",
            "editItem": "Modifier l'élément du portfolio",
            "deleteItem": "Supprimer l'élément du portfolio"
        }
    },
    "jobProposals": {
        "loadJobError": "Échec du chargement des données du travail",
        "loadProposalsError": "Échec du chargement des propositions",
        "hireFirst": "Vous devez d'abord embaucher le freelance pour démarrer la conversation",
        "removedFromShortlist": "Retiré de la liste des favoris",
        "addedToShortlist": "Ajouté à la liste des favoris",
        "shortlistError": "Erreur lors de la mise à jour de la liste",
        "hireSuccess": "Freelance embauché avec succès! 🎉",
        "hireError": "Échec de l'embauche. Veuillez réessayer",
        "proposalArchived": "Proposition archivée",
        "archiveError": "Échec de l'archivage",
        "defaultUser": "Utilisateur",
        "defaultCountry": "Tunisie",
        "defaultFreelancer": "Freelance",
        "proposalAccepted": "Votre proposition a été acceptée!",
        "loading": "Chargement...",
        "open": "Ouvert",
        "proposals": "Propositions",
        "interviews": "Entretiens",
        "shortlist": "Liste restreinte",
        "share": "Partager",
        "edit": "Modifier",
        "filterAndShow": "Filtrer et afficher",
        "allProposals": "Toutes les propositions",
        "new": "Nouveau",
        "archived": "Archivé",
        "noProposals": "Pas encore de propositions",
        "noProposalsDesc": "Vous n'avez pas encore reçu de propositions pour ce travail. Essayez de partager pour augmenter la visibilité.",
        "shareProject": "Partager le travail"
    },
    "jobDetail": {
        "jobSaved": "Travail enregistré",
        "jobRemoved": "Travail retiré des favoris",
        "error": "Une erreur s'est produite",
        "loginToSave": "Connectez-vous pour enregistrer",
        "proposalSent": "Proposition envoyée avec succès!",
        "proposalError": "Erreur lors de l'envoi de la proposition",
        "proposalWithdrawn": "Proposition retirée avec succès",
        "withdrawError": "Erreur lors du retrait",
        "linkCopied": "Lien copié",
        "fixedPrice": "Prix fixe",
        "hourly": "Par heure",
        "experience": {
            "beginner": "Débutant",
            "intermediate": "Intermédiaire",
            "expert": "Expert"
        },
        "category": {
            "design": "Design",
            "development": "Développement",
            "writing": "Rédaction",
            "translation": "Traduction",
            "video": "Vidéo",
            "marketing": "Marketing",
            "data": "Données",
            "other": "Autre"
        },
        "timeAgo": {
            "minute": "Il y a {{count}} minute",
            "hour": "Il y a {{count}} heure",
            "day": "Il y a {{count}} jour",
            "week": "Il y a {{count}} semaine",
            "month": "Il y a {{count}} mois"
        },
        "postedLabel": "Publié",
        "budget": "Budget",
        "perHour": "/heure",
        "approxHours": "(environ {{count}} heures)",
        "description": "Description du travail",
        "requiredSkills": "Compétences requises",
        "attachments": "Pièces jointes",
        "file": "Fichier {{index}}",
        "defaultClient": "Client",
        "jobNotFound": "Travail non trouvé",
        "submitProposal": "Envoyer une proposition",
        "withdrawProposal": "Retirer la proposition",
        "browseJobs": "Parcourir les travaux",
        "submissionRequirements": "Exigences de soumission",
        "readyToSubmit": "Prêt à soumettre",
        "insufficientBalance": "Limite quotidienne atteinte",
        "balance": "Utilisées aujourd'hui",
        "required": "Limite quotidienne",
        "remaining": "Restant",
        "used": "Utilisées",
        "limit": "Limite",
        "dailyApplyLimitTitle": "Limite quotidienne de candidatures",
        "dailyApplyLimitDescription": "Pour réduire le spam, vous pouvez envoyer jusqu'à {{limit}} propositions par jour.",
        "dailyApplyLimitReached": "Vous avez atteint la limite quotidienne de {{limit}} candidatures. Réessayez demain.",
        "dailyApplyAvailable": "Disponible aujourd'hui",
        "dailyApplyReached": "Limite atteinte",
        "dailyApplyRemainingHint": "Il vous reste {{remaining}} candidatures aujourd'hui.",
        "dailyApplyResetHint": "Limite quotidienne atteinte. Vous pourrez candidater à nouveau demain.",
        "memberSince": "Membre depuis",
        "postedJobs": "Travaux publiés",
        "totalSpending": "Total dépensé",
        "rating": "Note",
        "viewProfile": "Voir le profil",
        "proposals": "Propositions",
        "views": "Vues",
        "deadline": "Deadline",
        "reportJob": "Signaler ce travail",
        "aboutClient": "À propos du client",
        "jobStats": "Statistiques du travail",
        "similarJobs": "Missions similaires",
        "proposalSubmitted": "Votre proposition a été envoyée",
        "yourBid": "Votre offre:",
        "viewProposal": "Voir la proposition",
        "yourJob": "C'est votre mission",
        "manageJob": "Gérer la mission"
    },
    "reviews": {
        "client": "Client",
        "freelancer": "Freelance",
        "jobLabel": "Mission"
    },
    "admin": {
        "debug": {
            "restApiTest": "Test d'API REST direct",
            "bypassingClient": "Contournement complet du client Supabase JS - utilisation d'une récupération brute",
            "successMsg": "L'API REST fonctionne directement. Le problème se trouve dans le client Supabase JS.",
            "clientProblem": "Cela signifie que les politiques RLS sont correctes, mais le client JS a un problème.",
            "rlsBlocking": "RLS bloque la requête. Votre compte n'est pas reconnu en tant qu'administrateur.",
            "requestTimedOut": "La demande a dépassé 5 secondes. Problème réseau ou de base de données.",
            "accessTest": "Test d'accès administrateur",
            "directQueries": "Requêtes Supabase directes (sans React Query)",
            "executionLog": "Journal d'exécution :",
            "queryWorks": "La requête de base de données fonctionne. Le problème se trouve dans React Query ou le cycle de vie du composant.",
            "queryHanging": "La requête est bloquée. Cela suggère un problème de politique RLS causant des boucles infinies ou un problème réseau."
        }
    },
    "heroSection": {
        "liveBadge": "En direct",
        "typewriter": {
            "freelancer": {
                "workWithBest": "Travaillez avec les meilleurs.",
                "getPaidOnTime": "Soyez payé à temps.",
                "buildYourCareer": "Construisez votre carrière."
            },
            "client": {
                "trustedConnections": "Connexions de confiance.",
                "qualityCollaboration": "Collaboration de qualité.",
                "securePayments": "Paiements sécurisés."
            }
        },
        "freelancer": {
            "panelTitle": "Comment ça marche",
            "eyebrow": "Construit en Tunisie. Construit pour la Tunisie.",
            "titleTop": "Où les talents tunisiens",
            "titleAccent": "sont rémunérés équitablement.",
            "subtitle": "Sans enchères. Sans intermédiaires. Publiez un projet, entendez-vous sur les conditions, soyez payé en dinars tunisiens - sécurisé par séquestre.",
            "cta": "Commencez à gagner aujourd'hui",
            "secondary": "Parcourir les projets",
            "trust": {
                "payouts": "Paiements protégés",
                "matched": "Travail adapté",
                "reputation": "Construire une réputation"
            },
            "stats": {
                "professionals": {
                    "default": "2,500",
                    "label": "Professionnels"
                },
                "contracts": {
                    "default": "120",
                    "label": "Contrats réalisés"
                },
                "rating": {
                    "value": "4.9/5",
                    "label": "Moyenne des évaluations"
                }
            },
            "features": {
                "apply": {
                    "title": "Postulez pour des projets adaptés",
                    "subtitle": "Des emplois qui correspondent à votre niveau de compétence et votre tarif"
                },
                "verify": {
                    "title": "Afficher l'état de vérification",
                    "subtitle": "Établir la confiance avant de dire un mot"
                },
                "track": {
                    "title": "Suivre les jalons et les paiements",
                    "subtitle": "Tout au même endroit, sécurisé par séquestre"
                }
            },
            "promise": "Une meilleure présentation aide les excellents indépendants à paraître crédibles avant de dire un mot."
        },
        "client": {
            "panelTitle": "Pourquoi WorkedIn",
            "eyebrow": "Construit en Tunisie. Prêt pour l'embauche sérieuse.",
            "titleTop": "Ignorez les amateurs.",
            "titleAccent": "Collaborez avec l'élite.",
            "subtitle": "Publiez votre projet, évitez les risques et embauchez exclusivement des talents vérifiés.",
            "cta": "Engager un Expert",
            "secondary": "Voir les Top Talents",
            "trust": {
                "verified": "Profils vérifiés",
                "faster": "Embauche plus rapide",
                "escrow": "Séquestre protégé"
            },
            "stats": {
                "professionals": {
                    "default": "2,500",
                    "label": "Professionnels"
                },
                "projects": {
                    "default": "120",
                    "label": "Projets ouverts"
                },
                "trust": {
                    "value": "4.9/5",
                    "label": "Score de confiance moyen"
                }
            },
            "features": {
                "post": {
                    "title": "Publiez une fois et recevez des propositions pertinentes",
                    "subtitle": "Pas de guerres d'enchères bruyantes, juste des réponses de qualité"
                },
                "review": {
                    "title": "Examinez les profils locaux vérifiés",
                    "subtitle": "Les signaux de confiance apparaissent avant le premier message"
                },
                "manage": {
                    "title": "Gérez les jalons avec séquestre",
                    "subtitle": "Les paiements restent protégés jusqu'à l'approbation"
                }
            },
            "promise": "Une meilleure présentation aide les clients sérieux à faire confiance à la plateforme avant de publier un projet."
        },
        "promise": {
            "label": "Promesse WorkedIn"
        }
    },
    "valuePropositions": {
        "matched": {
            "title": "Travail adapté",
            "description": "Postulez pour des projets qui correspondent exactement à votre niveau de compétence et votre tarif. Pas de concurrence sur le prix - juste sur la qualité."
        },
        "protected": {
            "title": "Paiements protégés",
            "description": "Les fonds sont mis sous séquestre avant le début du travail. Vous êtes payé au moment où le client approuve."
        },
        "reputation": {
            "title": "Construire une réputation",
            "description": "Affichez votre statut vérifié, votre portefeuille et vos avis. Gagnez la confiance avant de dire un mot."
        },
        "badge": "Pourquoi WorkedIn",
        "heading": "Construit différemment. Pour la Tunisie."
    },
    "howItWorksSection": {
        "steps": {
            "1": {
                "step": "01",
                "title": "Créez votre profil",
                "subtitle": "Définissez vos compétences, votre tarif et votre portefeuille en quelques minutes."
            },
            "2": {
                "step": "02",
                "title": "Postulez pour des emplois adaptés",
                "subtitle": "Parcourez les projets qui correspondent à votre expertise."
            },
            "3": {
                "step": "03",
                "title": "Entendez-vous sur les conditions",
                "subtitle": "Négociez directement. Aucun intermédiaire."
            },
            "4": {
                "step": "04",
                "title": "Soyez payé de manière sécurisée",
                "subtitle": "Fonds libérés via séquestre à l'approbation."
            }
        },
        "badge": "Comment ça marche",
        "heading": "De l'inscription au paiement en 4 étapes."
    },
    "ctaSection": {
        "badge": "Prêt?",
        "title": "L'économie des indépendants en Tunisie commence ici.",
        "subtitle": "Rejoignez des milliers de professionnels qui gagnent déjà équitablement sur WorkedIn.",
        "primary": "Commencez gratuitement",
        "secondary": "Publiez un projet"
    },
    "faqPage": {
        "page": {
            "title": "Questions fréquemment posées",
            "subtitle": "Réponses aux questions les plus courantes sur l'utilisation de WorkedIn.tn",
            "searchPlaceholder": "Rechercher des questions...",
            "noAnswer": "Vous n'avez pas trouvé votre réponse?",
            "supportReady": "Notre équipe d'assistance est prête à vous aider 24/7",
            "contactButton": "Contactez-nous"
        },
        "categories": {
            "general": {
                "title": "Général",
                "items": [
                    {
                        "q": "Qu'est-ce que WorkedIn.tn?",
                        "a": "WorkedIn.tn est une plateforme tunisienne de travail indépendant reliant les entreprises aux professionnels talentueux. Nous croyons en un paiement équitable, des profils vérifiés et des transactions sécurisées protégées par séquestre."
                    },
                    {
                        "q": "L'inscription est-elle gratuite?",
                        "a": "Oui, l'inscription est complètement gratuite pour les indépendants et les clients. Nous ne prélevons qu'une petite commission sur les projets réussis."
                    },
                    {
                        "q": "Combien de temps prend la vérification?",
                        "a": "La vérification d'identité prend généralement 24-48 heures. Vous pouvez commencer la configuration de votre profil immédiatement, et la vérification se fait en arrière-plan."
                    }
                ]
            },
            "freelancer": {
                "title": "Pour les indépendants",
                "items": [
                    {
                        "q": "Comment commencer en tant qu'indépendant?",
                        "a": "Inscrivez-vous, complétez votre profil avec vos compétences et votre portefeuille, puis commencez à parcourir les projets disponibles qui correspondent à votre expertise."
                    },
                    {
                        "q": "Combien puis-je gagner?",
                        "a": "Vos gains dépendent des projets que vous acceptez et des tarifs que vous fixez. De nombreux indépendants tunisiens gagnent entre 500-5000 dinars tunisiens par mois."
                    },
                    {
                        "q": "Comment me fait-on payer?",
                        "a": "Les paiements s'effectuent via D17, virement bancaire ou autres méthodes de paiement locales. Vous définissez votre méthode de paiement préférée dans les paramètres du portefeuille."
                    }
                ]
            },
            "client": {
                "title": "Pour les clients",
                "items": [
                    {
                        "q": "Comment publier un projet?",
                        "a": "Cliquez sur \"Publier un projet\", décrivez votre travail, définissez votre budget et votre calendrier, puis publiez. Vous recevrez des propositions d'indépendants vérifiés."
                    },
                    {
                        "q": "Que faire si je ne suis pas satisfait du travail?",
                        "a": "Si le travail ne répond pas aux conditions convenues, vous recevez un remboursement complet. Les fonds sont mis sous séquestre jusqu'à ce que vous approuviez la livraison."
                    },
                    {
                        "q": "Comment mon argent est-il protégé?",
                        "a": "Les fonds sont conservés de manière sécurisée en séquestre. L'indépendant ne reçoit le paiement que lorsque vous approuvez le travail effectué."
                    }
                ]
            },
            "payment": {
                "title": "Paiement et revenus",
                "items": [
                    {
                        "q": "Quels modes de paiement acceptez-vous?",
                        "a": "Nous supportons toutes les méthodes locales tunisiennes: cartes, D17, virement bancaire et espèces pour petits montants."
                    },
                    {
                        "q": "Quand me fait-on payer?",
                        "a": "Les indépendants sont payés dans les 48 heures suivant l'approbation du client et la libération du séquestre."
                    },
                    {
                        "q": "Y a-t-il des frais cachés?",
                        "a": "Non. Nos frais sont transparents et clairement affichés. Nous prélevons uniquement une petite commission sur les projets réalisés."
                    },
                    {
                        "q": "Quels modes de paiement sont disponibles?",
                        "a": "Nous supportons actuellement Dhmad escrow pour les transactions scurises. Flouci wallet et D17 (La Poste) arrivent bientt. Dhmad conserve vos fonds en scurit jusqu' l'approbation du travail  le mme systme utilis par Tunisie Freelance."
                    },
                    {
                        "q": "Dhmad est-il fiable?",
                        "a": "Oui. Dhmad est une plateforme d'escrow tunisienne autorise  dtenir des fonds en tant que tiers de confiance. Votre argent est protg jusqu' ce que vous approuviez le travail."
                    },
                    {
                        "q": "Quand Flouci et D17 seront-ils disponibles?",
                        "a": "Nous travaillons activement  l'ajout de Flouci et D17. Ils seront disponibles prochainement. Nous informerons tous les utilisateurs lors de leur lancement."
                    },
                    {
                        "q": "Que se passe-t-il en cas de litige?",
                        "a": "En cas de dsaccord, Dhmad conserve les fonds pendant la rsolution du litige. Aucune partie ne peut accder  l'argent avant que le problme soit rgl."
                    }
                ]
            },
            "security": {
                "title": "Sécurité et confidentialité",
                "items": [
                    {
                        "q": "Mes informations personnelles sont-elles sûres?",
                        "a": "Oui. Nous utilisons le chiffrement et les mesures de sécurité standard. Vos données ne sont jamais partagées sans votre permission."
                    },
                    {
                        "q": "Pourquoi avez-vous besoin d'une vérification d'identité?",
                        "a": "La vérification d'identité garantit la confiance et la sécurité pour les indépendants et les clients. Chaque professionnel sur WorkedIn est vérifié par identité."
                    },
                    {
                        "q": "Puis-je rester anonyme?",
                        "a": "Non. Les indépendants et les clients doivent être vérifiés. Cela protège tout le monde et assure la responsabilité."
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
        "unexpected": "Une erreur inattendue s'est produite lors du rendu de cette section.",
        "title": "Quelque chose s'est mal passé",
        "retry": "Réessayer",
        "jobCard": "Impossible de charger la carte d'emploi"
    },
    "authPages": {
        "login": {
            "badge": "Plateforme de travail indépendant de confiance",
            "heroTitle": "Connectez-vous sans désordre et retournez au travail rapidement.",
            "heroDescription": "Un flux d'authentification plus calme pour les clients et les indépendants, avec des états plus clairs, des paiements de confiance et un changement d'espace de travail qui ne vous gêne pas.",
            "highlightTrustTitle": "Profils Vérifiés",
            "highlightTrustDescription": "Les profils, les contrats et les signaux de vérification restent visibles dans votre espace de travail.",
            "highlightPaymentsTitle": "Paiements Sécurisés",
            "highlightPaymentsDescription": "Les flux de séquestre en premier maintiennent les paiements des clients et la livraison des indépendants alignés.",
            "highlightLocaleTitle": "Local et Global",
            "highlightLocaleDescription": "Les flux en arabe, français et anglais adaptés au travail indépendant local.",
            "hero": {
                "workSmarter": "Travaillez plus intelligemment.",
                "earnFairly": "Gagnez équitablement."
            },
            "form": {
                "welcomeBack": "Bon retour.",
                "subtitle": "Connectez-vous à votre espace WorkedIn.",
                "google": "Continuer avec Google",
                "orEmail": "ou se connecter avec l'e-mail",
                "forgotPassword": "Mot de passe oublié ?",
                "createOne": "En créer un"
            },
            "createAccountAction": "Créer un compte",
            "finishingSignIn": "Sécurisation de la session...",
            "finishingSignInDescription": "Nous confirmons votre session sécurisée et vous envoyons au bon espace de travail.",
            "rateLimitError": "Trop de tentatives. Veuillez réessayer plus tard."
        },
        "signup": {
            "badge": "Rejoignez WorkedIn",
            "heroTitle": "Créez une première impression plus nette pour chaque projet que vous démarrez.",
            "heroTitleTop": "Prêt pour votre",
            "heroTitleAccent": "prochain grand projet ?",
            "heroDescription": "Choisissez votre rôle, configurez votre espace de travail et passez à l'intégration avec une expérience d'authentification plus propre et plus ciblée.",
            "featureCards": {
                "verified": {
                    "title": "Profils vérifiés",
                    "sub": "Chaque identité confirmée"
                },
                "escrow": {
                    "title": "Paiements en séquestre",
                    "sub": "Fonds bloqués jusqu'à la livraison"
                },
                "local": {
                    "title": "Local et global",
                    "sub": "Optimisé pour la Tunisie"
                }
            },
            "highlightRoleTitle": "Intégration basée sur le rôle",
            "highlightRoleDescription": "Commencez en tant que client ou indépendant et atterrissez dans le bon espace de travail dès la première étape.",
            "highlightTrustTitle": "Vérifié et Sécurisé",
            "highlightTrustDescription": "La vérification, les vérifications d'identité et la structure du profil sont intégrées dans le parcours.",
            "highlightWorkTitle": "Préparé pour le vrai travail",
            "highlightWorkDescription": "Passez de l'inscription à la publication d'emplois, à la création d'un profil et à la conclusion de contrats plus rapidement.",
            "signInAction": "Se connecter",
            "validation": {
                "passwordMinLength": "Le mot de passe doit contenir au moins 8 caractères",
                "passwordUppercase": "Doit contenir au moins une lettre majuscule",
                "passwordLowercase": "Doit contenir au moins une lettre minuscule",
                "passwordNumber": "Doit contenir au moins un chiffre"
            },
            "rateLimitErrorMinutes": "Trop de tentatives. Veuillez réessayer dans {{minutes}} minutes.",
            "rateLimitError15Min": "Trop de tentatives. Veuillez réessayer dans 15 minutes."
        }
    },
    "dashboards": {
        "client": {
            "stats": {
                "projects": "Projets",
                "active": "Actif",
                "proposals": "Propositions",
                "spent": "Dépensé"
            },
            "widgets": {
                "activeProjects": "Projets actifs",
                "activeContracts": "Contrats actifs",
                "recentProposals": "Propositions récentes",
                "thisMonth": "Ce mois"
            },
            "empty": {
                "noActiveProjects": "Aucun projet actif",
                "noActiveProjectsDesc": "Publiez votre premier projet pour trouver des indépendants talentueux",
                "noProposals": "Aucune proposition pour le moment",
                "noProposalsDesc": "Les propositions des indépendants apparaîtront ici"
            },
            "cta": {
                "needSomethingDone": "Avez-vous besoin de quelque chose?",
                "needSomethingDoneDesc": "Publiez un projet gratuitement. Obtenez des propositions de talents tunisiens vérifiés.",
                "postProjectFree": "Publiez un projet — c'est gratuit"
            },
            "actions": {
                "viewAll": "Voir tout",
                "viewWallet": "Afficher le portefeuille",
                "postProject": "Publier un projet"
            },
            "labels": {
                "freelancer": "Indépendant",
                "untitledJob": "Projet sans titre",
                "review": "Avis"
            }
        },
        "freelancer": {
            "stats": {
                "contracts": "Contrats",
                "proposals": "Propositions",
                "earnings": "Revenus",
                "rating": "Évaluation"
            },
            "checklist": {
                "avatarUploaded": "Avatar téléchargé",
                "bioWritten": "Biographie rédigée",
                "skillsAdded": "Compétences ajoutées",
                "professionalTitle": "Titre professionnel",
                "identityVerified": "Identité vérifiée"
            },
            "widgets": {
                "activeContracts": "Contrats actifs",
                "recentProposals": "Propositions récentes",
                "matchedForYou": "Adapté pour vous",
                "profileStrength": "Force du profil",
                "thisMonth": "Ce mois"
            },
            "empty": {
                "noActiveContracts": "Aucun contrat actif",
                "noActiveContractsDesc": "Soumettez des propositions pour commencer à obtenir des contrats",
                "noMatches": "Aucune correspondance pour le moment",
                "checkBackSoon": "Revenez bientôt pour de nouvelles opportunités"
            },
            "actions": {
                "browseJobs": "Parcourir les emplois",
                "updateProfile": "Mettre à jour le profil",
                "viewWallet": "Afficher le portefeuille"
            },
            "labels": {
                "client": "Client",
                "untitledJob": "Projet sans titre",
                "vsLastMonth": "par rapport au mois dernier"
            },
            "profileStrength": {
                "complete": "Complet"
            }
        },
        "admin": {
            "tabs": {
                "overview": "Aperçu",
                "users": "Utilisateurs",
                "jobs": "Emplois",
                "payments": "Paiements",
                "verifications": "Vérifications",
                "disputes": "Litiges",
                "reports": "Rapports",
                "settings": "Paramètres"
            },
            "headers": {
                "adminDashboard": "Tableau de bord administrateur",
                "operationsCenter": "Centre d'opérations",
                "nightModeReady": "Mode nuit prêt",
                "backToSite": "Retour au site"
            },
            "verification": {
                "title": "File d'attente de vérification",
                "pending": "En attente de vérification",
                "approved": "Approuvé",
                "rejected": "Rejeté",
                "resubmit": "Soumettre à nouveau",
                "approve": "Approuver",
                "reject": "Rejeter",
                "viewDetails": "Voir les détails"
            },
            "labels": {
                "status": "Statut",
                "user": "Utilisateur",
                "date": "Date",
                "action": "Action",
                "email": "E-mail",
                "role": "Rôle",
                "createdAt": "Créé à",
                "updatedAt": "Mise à jour à"
            },
            "messages": {
                "loading": "Chargement...",
                "noData": "Aucune donnée trouvée",
                "error": "Erreur lors du chargement des données"
            },
            "users": {
                "switch": "Basculer",
                "suspend": "Suspendre",
                "suspendUser": "Suspendre l'utilisateur",
                "suspendUserConfirm": "Voulez-vous suspendre l'utilisateur",
                "suspensionKeepsHistory": "Les contrats, paiements, litiges et l'historique d'audit seront conservés.",
                "unableToUpdateStatus": "Impossible de mettre à jour le statut de l'utilisateur"
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
        "recommended": "Recommande",
        "coming_soon": "Bientot",
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
            "close": "Fermer"
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
    "dynamic_key_1502065525": "Annuler",
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
        "close": "Fermer",
        "success": "Succès",
        "error": "Erreur",
        "warning": "Avertissement",
        "info": "Info"
    }
};
