import type { Translations } from './ar';

export const fr: Translations = {
    "accountStatus": {
        "archived": {
            "body": "Ce compte est archive et ne peut plus acceder aux fonctionnalites protegees de la plateforme. Contactez le support pour obtenir de l'aide.",
            "title": "Compte archive"
        },
        "suspended": {
            "body": "L'acces a votre compte est temporairement suspendu. Contactez le support si vous avez besoin d'aide ou si vous pensez qu'il s'agit d'une erreur.",
            "title": "Compte suspendu"
        }
    },
    "admin": {
        "backToSite": "Back to site",
        "debug": {
            "accessTest": "Test d'accès administrateur",
            "bypassingClient": "Contournement complet du client Supabase JS - utilisation d'une récupération brute",
            "clientProblem": "Cela signifie que les politiques RLS sont correctes, mais le client JS a un problème.",
            "directQueries": "Requêtes Supabase directes (sans React Query)",
            "executionLog": "Journal d'exécution :",
            "queryHanging": "La requête est bloquée. Cela suggère un problème de politique RLS causant des boucles infinies ou un problème réseau.",
            "queryWorks": "La requête de base de données fonctionne. Le problème se trouve dans React Query ou le cycle de vie du composant.",
            "requestTimedOut": "La demande a dépassé 5 secondes. Problème réseau ou de base de données.",
            "restApiTest": "Test d'API REST direct",
            "rlsBlocking": "RLS bloque la requête. Votre compte n'est pas reconnu en tant qu'administrateur.",
            "successMsg": "L'API REST fonctionne directement. Le problème se trouve dans le client Supabase JS."
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
            "adminDashboard": "Tableau de bord admin",
            "clientDesc": "Publiez des projets, comparez les propositions et libérez les paiements escrow.",
            "clientFeatureEscrow": "Paiements protégés par escrow",
            "clientFeaturePostProjects": "Publier des projets gratuitement",
            "clientFeatureReviewProposals": "Examiner des propositions vérifiées",
            "clientHint": "Terminez les bases du client ici d'abord, puis gérez la facturation et les détails de l'entreprise dans les Paramètres.",
            "clientLabel": "Client",
            "completeSetup": "Terminer la configuration",
            "current": "Actuel",
            "darkTheme": "Thème sombre",
            "defaultUser": "Utilisateur WorkedIn",
            "enable": "Activer",
            "enableBothAction": "Enable both roles",
            "enableBothDesc": "Access client hiring dashboard and freelancer profile under a single credentials login.",
            "enableBothLabel": "Enable both workspace roles",
            "freelancerDesc": "Trouvez du travail, envoyez des propositions et soyez payé en TND.",
            "freelancerFeatureBrowseJobs": "Parcourir et postuler aux missions",
            "freelancerFeaturePortfolio": "Construire un portfolio public",
            "freelancerFeatureReceivePayments": "Recevoir les paiements en TND",
            "freelancerHint": "Complétez les détails essentiels ici, puis affinez le reste plus tard dans les Paramètres.",
            "freelancerLabel": "Freelance",
            "goToWorkspace": "Espace {{workspace}}",
            "language": "Langue",
            "logoutAction": "Déconnexion",
            "logoutDesc": "Terminez cette session en toute sécurité sur cet appareil.",
            "manageProfile": "Gérer le profil",
            "needsSetup": "Nécessite configuration",
            "onlineForMessages": "En ligne",
            "profileAction": "Profil",
            "progressLabel": "Profil complété",
            "ready": "Prêt",
            "sectionLabel": "Espace de travail",
            "settingsAction": "Paramètres",
            "setupInFiveMinutes": "Configuration en 5 min",
            "statusPending": "En attente",
            "statusPro": "Pro",
            "switchAction": "Basculer",
            "switchError": "Impossible de changer d'espace pour le moment.",
            "switchInstantly": "Basculer instantanément",
            "switchOver": "Basculer",
            "switchWorkspace": "Changer d'espace",
            "switchWorkspaceBoth": "Utilisez le même compte pour recruter et travailler en freelance sans connexion séparée.",
            "switchWorkspaceSingle": "Activez le second espace uniquement quand vous en avez réellement besoin.",
            "switchedClient": "L'espace client est désormais actif.",
            "switchedFreelancer": "L'espace freelance est désormais actif.",
            "switching": "Basculement...",
            "tools": "Outils du compte",
            "walletAndEarnings": "Portefeuille et gains",
            "workspaceActive": "Espace actif"
        },
        "both": "Les deux",
        "client": "Client",
        "completeProfile": "Compléter l'inscription",
        "confirmPassword": "Confirmer le mot de passe",
        "confirmPasswordPlaceholder": "Ressaisissez votre mot de passe",
        "createAccount": "Créer un compte",
        "email": "Email",
        "emailExists": "Cet email est déjà enregistré",
        "emailNotConfirmed": "Email non confirmé",
        "emailPlaceholder": "Entrez votre email",
        "forgotPassword": "Mot de passe oublié ?",
        "forgotPasswordForm": {
            "error": "Erreur lors de l'envoi du lien",
            "rateLimited": "Trop de tentatives. Réessayez plus tard.",
            "sendTitle": "Envoyer le lien de réinitialisation",
            "sent": "Lien de réinitialisation envoyé"
        },
        "freelancer": "Freelance",
        "googleLogin": "Continuer avec Google",
        "googleLoginError": "Échec de la connexion Google",
        "hasAccount": "Déjà un compte ?",
        "invalidCredentials": "Email ou mot de passe incorrect",
        "invalidEmail": "Entrez une adresse email valide",
        "loggingOut": "Déconnexion en cours...",
        "login": "Se connecter",
        "loginSubtitle": "Bon retour. Votre travail vous attend.",
        "loginTitle": "Se connecter à WorkedIn",
        "noAccount": "Pas encore de compte ?",
        "or": "ou",
        "password": {
            "hide": "Masquer le mot de passe",
            "label": "Mot de passe",
            "new": "New Password",
            "show": "Afficher le mot de passe"
        },
        "passwordMinLength": "Le mot de passe doit contenir au moins 6 caractères",
        "passwordMismatch": "Les mots de passe ne correspondent pas",
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
            "medium": "Moyen",
            "strong": "Fort",
            "weak": "Faible"
        },
        "passwordValidation": {
            "lowercase": "Doit contenir au moins une minuscule",
            "minLength": "Le mot de passe doit contenir au moins 8 caractères",
            "number": "Doit contenir au moins un chiffre",
            "uppercase": "Doit contenir au moins une majuscule"
        },
        "phone": "Numéro de téléphone",
        "phonePlaceholder": "Entrez votre numéro",
        "resendCode": "Renvoyer le code",
        "resendIn": "Renvoyer dans",
        "resetPassword": {
            "error": "Erreur lors du changement de mot de passe",
            "expiredLink": "Expired Link",
            "invalidLinkDesc": "Invalid reset link.",
            "linkExpired": "Lien de réinitialisation expiré",
            "redirecting": "Redirecting to login...",
            "requestNewLink": "Request New Link",
            "setNew": "Set New Password",
            "setNewDesc": "Enter your new password",
            "setNewTitle": "Définir un nouveau mot de passe",
            "success": "Mot de passe changé avec succès",
            "successDesc": "You can now log in with your new password."
        },
        "seconds": "secondes",
        "selectUserType": "Comment allez-vous utiliser WorkedIn ?",
        "selectUserTypeSubtitle": "Vous pouvez toujours ajouter l'autre rôle plus tard dans les paramètres.",
        "sendCode": "Envoyer le code",
        "sessionExpired": "Your session has expired. Please sign in again.",
        "signOut": "Déconnexion",
        "signup": "Créer un compte",
        "signupSubtitle": "Rejoignez 2 500+ professionnels qui construisent leur carrière sur WorkedIn.",
        "signupTitle": "Créer votre compte",
        "socialProof": "professionals already on WorkedIn",
        "userTypeBothDesc": "Je fais les deux — je travaille et je recrute",
        "userTypeClientDesc": "J'ai des projets et besoin de professionnels fiables",
        "userTypeFreelancerDesc": "J'offre des compétences et veux être payé pour mon travail",
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
        "verify": "Vérifier",
        "verifyCode": "Code de vérification"
    },
    "authPages": {
        "login": {
            "badge": "Plateforme de travail indépendant de confiance",
            "createAccountAction": "Créer un compte",
            "featureCards": {
                "escrow": {
                    "sub": "Fonds bloqués jusqu'à la livraison",
                    "title": "Paiements en séquestre"
                },
                "local": {
                    "sub": "Optimisé pour la Tunisie",
                    "title": "Local et mondial"
                },
                "verified": {
                    "sub": "Chaque identité confirmée",
                    "title": "Profils vérifiés"
                }
            },
            "finishingSignIn": "Sécurisation de la session...",
            "finishingSignInDescription": "Nous confirmons votre session sécurisée et vous envoyons au bon espace de travail.",
            "form": {
                "createOne": "En créer un",
                "emailLabel": "E-mail",
                "forgotPassword": "Mot de passe oublié ?",
                "google": "Continuer avec Google",
                "noAccount": "Vous n'avez pas de compte ?",
                "orEmail": "ou se connecter avec l'e-mail",
                "passwordLabel": "Mot de passe",
                "signInButton": "Se connecter →",
                "signingIn": "Connexion en cours…",
                "subtitle": "Connectez-vous à votre espace WorkedIn.",
                "welcomeBack": "Bon retour."
            },
            "hero": {
                "earnFairly": "Gagnez équitablement.",
                "workSmarter": "Travaillez plus intelligemment."
            },
            "heroDescription": "Un flux d'authentification plus calme pour les clients et les indépendants, avec des états plus clairs, des paiements de confiance et un changement d'espace de travail qui ne vous gêne pas.",
            "heroTitle": "Connectez-vous sans désordre et retournez au travail rapidement.",
            "highlightLocaleDescription": "Les flux en arabe, français et anglais adaptés au travail indépendant local.",
            "highlightLocaleTitle": "Local et Global",
            "highlightPaymentsDescription": "Les flux de séquestre en premier maintiennent les paiements des clients et la livraison des indépendants alignés.",
            "highlightPaymentsTitle": "Paiements Sécurisés",
            "highlightTrustDescription": "Les profils, les contrats et les signaux de vérification restent visibles dans votre espace de travail.",
            "highlightTrustTitle": "Profils Vérifiés",
            "platformSubtitle": "Connectez-vous avec des talents vérifiés, gérez vos projets en toute sécurité et soyez payé en TND — à chaque fois.",
            "platformTagline": "# La Plateforme Freelance Tunisienne",
            "rateLimitError": "Trop de tentatives. Veuillez réessayer plus tard."
        },
        "signup": {
            "alreadyHaveAccount": "Vous avez déjà un compte ?",
            "badge": "Rejoignez WorkedIn",
            "confirmPasswordLabel": "Confirmer le mot de passe",
            "continueWithGoogle": "Continuer avec Google",
            "createAccountButton": "Créer un compte →",
            "creatingAccount": "Création du compte…",
            "emailLabel": "E-mail",
            "emailPlaceholder": "vous@exemple.com",
            "featureCards": {
                "escrow": {
                    "sub": "Fonds bloqués jusqu'à la livraison",
                    "title": "Paiements en séquestre"
                },
                "local": {
                    "sub": "Optimisé pour la Tunisie",
                    "title": "Local et global"
                },
                "verified": {
                    "sub": "Chaque identité confirmée",
                    "title": "Profils vérifiés"
                }
            },
            "formSubtitle": "Rejoignez plus de 2 500 professionnels sur WorkedIn",
            "formTitle": "Créer votre compte",
            "heroDescription": "Choisissez votre rôle, configurez votre espace de travail et passez à l'intégration avec une expérience d'authentification plus propre et plus ciblée.",
            "heroTitle": "Créez une première impression plus nette pour chaque projet que vous démarrez.",
            "heroTitleAccent": "prochain grand projet ?",
            "heroTitleTop": "Prêt pour votre",
            "highlightRoleDescription": "Commencez en tant que client ou indépendant et atterrissez dans le bon espace de travail dès la première étape.",
            "highlightRoleTitle": "Intégration basée sur le rôle",
            "highlightTrustDescription": "La vérification, les vérifications d'identité et la structure du profil sont intégrées dans le parcours.",
            "highlightTrustTitle": "Vérifié et Sécurisé",
            "highlightWorkDescription": "Passez de l'inscription à la publication d'emplois, à la création d'un profil et à la conclusion de contrats plus rapidement.",
            "highlightWorkTitle": "Préparé pour le vrai travail",
            "orSignUpWithEmail": "ou s'inscrire avec l'e-mail",
            "passwordLabel": "Mot de passe",
            "rateLimitError15Min": "Trop de tentatives. Veuillez réessayer dans 15 minutes.",
            "rateLimitErrorMinutes": "Trop de tentatives. Veuillez réessayer dans {{minutes}} minutes.",
            "signInAction": "Se connecter",
            "signInLink": "Se connecter",
            "validation": {
                "passwordLowercase": "Doit contenir au moins une lettre minuscule",
                "passwordMinLength": "Le mot de passe doit contenir au moins 8 caractères",
                "passwordNumber": "Doit contenir au moins un chiffre",
                "passwordUppercase": "Doit contenir au moins une lettre majuscule"
            }
        }
    },
    "auto": {
        "escrow_not_funded_ye": "Garantie non encore financée"
    },
    "categories": {
        "availableJobs": "mission disponible",
        "contentWriting": "Rédaction de contenu",
        "dataEntry": "Saisie de données",
        "digitalMarketing": "Marketing digital",
        "graphicDesign": "Design graphique",
        "mobileApp": "Développement mobile",
        "photography": "Photographie",
        "title": "Catégories",
        "translation": "Traduction",
        "uiux": "Design UI/UX",
        "videoEditing": "Montage vidéo",
        "webDev": "Développement web"
    },
    "clientProfile": {
        "activeJobs": "Offres de projet actives",
        "addDescription": "+ Ajouter une description",
        "apply": "Postuler",
        "avgRatingLabel": "Note moyenne",
        "businessOwner": "Propriétaire de l'entreprise",
        "by": "par",
        "client": "Client",
        "companyInformation": "Informations sur l'entreprise",
        "companyWebsite": "Site web de l'entreprise",
        "completedContractsLabel": "Contrats terminés",
        "copied": "Copié !",
        "exitPreview": "Quitter l'aperçu",
        "hiringAndStats": "Embauche et Statistiques",
        "hiringNeeds": "Besoins d'embauche",
        "hiringPreferences": "Préférences et détails d'embauche",
        "hiringStatus": "Statut d'embauche",
        "jobsPostedCount": {
            "one": "{{count}} projet publié",
            "other": "{{count}} projets publiés"
        },
        "jobsPostedLabel": "Projets publiés",
        "linksTitle": "Liens et ressources",
        "localTime": "{{time}} heure locale",
        "locationLabel": "Emplacement",
        "memberSinceLabel": "Membre depuis",
        "myProjects": "Mes Projets",
        "noActiveJobs": "Aucun projet actif publié pour le moment",
        "noActiveJobsDesc": "Publiez des projets, lancez des jalons et collaborez avec les meilleurs freelances.",
        "noBio": "Aucune biographie ou description d'entreprise fournie pour le moment.",
        "noCompanyDetails": "Aucune information d'entreprise ajoutée pour le moment.",
        "noLinks": "Aucun lien ajouté pour le moment.",
        "noReviewsYet": "Aucun avis pour le moment. Terminez votre premier contrat avec un freelance pour recevoir des retours.",
        "notFound": "Client introuvable",
        "notFoundDesc": "Ce profil n'existe pas ou a été supprimé.",
        "paymentVerified": "Paiement vérifié",
        "postFirstJob": "Publier votre premier projet",
        "postJob": "Publier un projet",
        "previewDesc": "Vous visualisez votre profil tel que les autres utilisateurs le voient.",
        "previewTitle": "Aperçu du profil public",
        "proposalsCount": {
            "one": "{{count}} proposition",
            "other": "{{count}} propositions"
        },
        "reviewsCount": {
            "one": "{{count}} avis",
            "other": "{{count}} avis"
        },
        "settings": "Paramètres",
        "share": "Partager",
        "specializedIn": "Spécialisé en {{industry}}",
        "standardStatus": "Standard",
        "totalSpentLabel": "Dépenses totales",
        "upTo": "Jusqu'à",
        "verifications": {
            "identity": "Identité Vérifiée",
            "payment": "Moyen de paiement",
            "phone": "Téléphone"
        },
        "verificationsTitle": "Vérifications",
        "workHistory": "Historique de travail et avis",
        "workspaceControls": "Contrôles de l'espace"
    },
    "common": {
        "accountHolder": "Nom du titulaire",
        "accountHolderPlaceholder": "Nom tel qu'il apparaît sur le compte bancaire",
        "active": "Actif",
        "all": "Tous",
        "alreadyReportedSession": "Already reported in this session",
        "amountZero": "0.000 TND",
        "apply": "Apply Filters",
        "approved": "Approuvé",
        "attachments": "Pièces jointes",
        "available": "Disponible",
        "availableForWork": "Disponible",
        "back": "Retour",
        "bankName": "Nom de la banque",
        "bankNamePlaceholder": "Ex : Banque Nationale Agricole",
        "busy": "Occupé",
        "cancel": "Annuler",
        "cancelled": "Annulé",
        "client": "Client",
        "close": "Fermer",
        "closeMenu": "Fermer le menu",
        "completed": "Terminé",
        "completionDate": "Date de réalisation",
        "confirm": "Confirmer",
        "contactSupport": "Contacter le support",
        "currency": "TND",
        "currencyPerHour": "TND/h",
        "delete": "Supprimer",
        "dinar": "dinars",
        "download": "Download",
        "edit": "Modifier",
        "emailPlaceholder": "Votre adresse email",
        "error": "Erreur",
        "errors": {
            "unexpected": "Une erreur inattendue s'est produite"
        },
        "fileSize": {
            "bytes": "Bytes",
            "kilobytes": "Kilobytes",
            "megabytes": "Megabytes"
        },
        "fileTooLarge": "La taille de l'image doit être inférieure à 5 Mo",
        "fileUpload": {
            "chooseFiles": "Choisir des fichiers",
            "dropzoneHint": "Glissez les fichiers ici ou cliquez pour parcourir",
            "fileTooLarge": "{{name}} depasse {{size}}MB",
            "maxFilesExceeded": "Maximum {{count}} fichiers autorises",
            "removeFileAria": "Supprimer {{name}}",
            "unsupportedType": "{{name}} a un type de fichier non pris en charge"
        },
        "filter": "Filtrer",
        "fixedPrice": "Prix fixe",
        "freelancer": "Freelance",
        "from": "De",
        "general": "Général",
        "goBack": "Revenir",
        "hide": "Hide details",
        "hourly": "Horaire",
        "hourlyExample": "Ex : 20",
        "hoursExample": "Ex : 10-20",
        "identityVerified": "Identité vérifiée",
        "inactive": "Inactif",
        "invalidFileType": "Veuillez sélectionner une image JPG, PNG ou WebP",
        "loading": "Chargement...",
        "loadingContent": "Chargement du contenu",
        "messageContent": "Contenu du message",
        "messageContentPlaceholder": "Écrivez les détails de votre message ici...",
        "messageSubject": "Sujet du message",
        "messageSubjectPlaceholder": "Ex : Question concernant un projet de design...",
        "more": "More",
        "navigate": "Naviguer",
        "next": "Suivant",
        "no": "Non",
        "none": "Aucun",
        "notAuthenticated": "Not authenticated",
        "offline": "Hors ligne",
        "older": "Older",
        "open": "Ouvrir",
        "openMenu": "Ouvrir le menu",
        "optional": "Optionnel",
        "pending": "En attente",
        "posted1DayAgo": "Publié il y a 1 jour",
        "postedDaysAgo": "Publié il y a {{days}} jours",
        "postedRecently": "Publié récemment",
        "postedToday": "Publié aujourd'hui",
        "postedWeeksAgo": "Publié il y a {{weeks}} semaine{{weeks > 1 ? 's' : ''}}",
        "projectDescription": "Description du projet",
        "projectDescriptionPlaceholder": "Décrivez les détails du projet, les livrables attendus et les exigences particulières...",
        "projectTitle": "Titre du projet",
        "projectTitlePlaceholder": "Ex : Création de logo pour entreprise agroalimentaire",
        "projectUrl": "URL du projet",
        "proposalPlaceholder": "Expliquez pourquoi vous êtes la bonne personne pour ce projet...",
        "refresh": "Actualiser",
        "rejected": "Rejeté",
        "reload": "Recharger",
        "removeImage": "Supprimer l'image",
        "replyToReview": "Répondre à l'avis",
        "report": "Signaler",
        "reportContent": "Contenu du signalement",
        "reportContentTitle": "Report content",
        "reportDescribePlaceholder": "Veuillez décrire le problème...",
        "reportError": "Échec du signalement",
        "reportFailed": "Failed to submit report",
        "reportSubmitButton": "Soumettre le signalement",
        "reportSubmitted": "Signalement soumis. Notre équipe examinera bientôt.",
        "reportSubmittedSuccess": "Report submitted. Our team will review it shortly.",
        "reportTitle": "Signaler ce contenu",
        "reported": "Reported",
        "retry": "Réessayer",
        "returnHome": "Retour a l'accueil",
        "reviewPlaceholder": "Qu'avez-vous apprécié ? Que pourrait-on améliorer ? Le recommanderiez-vous ?",
        "save": "Enregistrer",
        "saveFreelancer": "Enregistrer le profil",
        "saving": "Saving...",
        "scrollToTop": "Revenir en haut",
        "search": "Rechercher",
        "searchPlaceholder": "Rechercher...",
        "searchProposals": "Rechercher dans les propositions...",
        "select": "Sélectionner",
        "selectReason": "Please select a reason",
        "shareExperience": "Partagez votre expérience avec cette personne...",
        "show": "Show details",
        "skill": "Compétence",
        "skillsUsed": "Compétences utilisées",
        "skillsUsedPlaceholder": "Ex : Photoshop, React, UI Design (séparés par des virgules)",
        "skipForNow": "Vous pouvez ignorer cette étape et télécharger plus tard",
        "sort": "Trier",
        "submit": "Soumettre",
        "success": "Succès",
        "thumbnailUrl": "URL de l'image miniature",
        "time": {
            "ago": "",
            "ago_prefix": "Il y a",
            "day": "j",
            "hour": "h",
            "minute": "min",
            "now": "À l'instant"
        },
        "tnd": "TND",
        "tndPerHour": "TND/h",
        "to": "À",
        "today": "Aujourd'hui",
        "toggleDarkMode": "Mode sombre",
        "toggleLightMode": "Mode clair",
        "tryAgain": "Try again",
        "tunisia": "Tunisie",
        "typeMessage": "Écrivez votre message ici...",
        "unknownUser": "Unknown User",
        "unsave": "Retirer",
        "unsaveFreelancer": "Retirer des favoris",
        "uploadFailed": "Échec du téléchargement, vous pouvez l'ajouter plus tard",
        "verified": "Vérifié",
        "view": "Voir",
        "viewJob": "Voir la mission",
        "visibilityNote": "Si vous avez besoin de compétences rares ou un projet sensible, \"Sur invitation\" vous donne plus de contrôle. Pour les projets publics, \"Public\" assure une meilleure compétitivité des prix.",
        "whyReport": "Why Report",
        "writeReply": "Écrivez votre réponse ici...",
        "yes": "Oui",
        "yesterday": "Yesterday",
        "you": "Vous"
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
        "acceptAndPay": "Accepter et payer",
        "acceptAndPayConfirm": "This will mark the contract as completed and release payment.",
        "acceptError": "Erreur lors de l'acceptation",
        "actions": {
            "reviewExperience": "Leave a review"
        },
        "addReview": "Ajouter votre avis",
        "amount": "Amount",
        "attachFile": "Joindre un fichier",
        "awaitingApproval": "En attente d'approbation",
        "awaitingDelivery": "En attente de livraison",
        "backToContracts": "Back to contracts",
        "blockedReasons": {
            "noAttachments": "Les pièces jointes sont désactivées pour cette conversation.",
            "noVoiceNotes": "Les notes vocales sont désactivées pour cette conversation.",
            "readOnly": "Cette conversation est en lecture seule pour le moment.",
            "safetyBlocked": "Ce message est bloqué par les règles de sécurité du contrat."
        },
        "chat": "Chat",
        "chatSafetyBlocked": "Chat Safety Blocked",
        "completed": "Terminé",
        "completionBanner": {
            "dismiss": "Ignorer",
            "leaveReview": "Aidez {{name}} à développer sa réputation — laissez un avis.",
            "readOnly": "Cette conversation est désormais en lecture seule.",
            "reviewAction": "Avis",
            "title": "Contrat terminé !"
        },
        "confirmDelivery": "Confirm Delivery",
        "contextBar": {
            "btnAcceptPay": "Accepter et payer",
            "btnDeliverWork": "Livrer le travail",
            "btnFullWorkspace": "Espace complet",
            "btnFundEscrow": "Financer la garantie",
            "btnLeaveReview": "Laisser un avis",
            "btnRequestRevision": "Demander une révision ({{remaining}} restantes)",
            "infoDeadline": "Date limite",
            "infoDeliveredOn": "Livré le",
            "infoEscrowNotFunded": "Garantie non financée",
            "infoEscrowSecured": "Garantie sécurisée",
            "infoEscrowStatus": "Statut de la garantie",
            "infoReviewBy": "Révision avant le {{date}}",
            "infoReviewPeriod": "Période de révision",
            "infoRevisionsUsed": "Révisions utilisées",
            "statusActive": "Actif",
            "statusAwaitingPayment": "En attente de paiement",
            "statusCancelled": "Annulé",
            "statusCompleted": "Terminé",
            "statusContract": "Contrat",
            "statusDisputed": "En litige",
            "statusInProgress": "En cours",
            "statusRevisionRequested": "Révision demandée",
            "statusUnderReview": "En révision"
        },
        "days": "jours",
        "daysLeft": "Reste",
        "daysRemaining": "{{days}} jours restants",
        "deliverBlocked": "Only the freelancer can deliver work for this contract.",
        "deliverError": "Erreur lors de la livraison",
        "deliverNoteAria": "Delivery notes",
        "deliverNoteLabel": "Add a note for the client",
        "deliverNotePlaceholder": "Deliver Note Placeholder",
        "deliverWork": "Livrer le travail",
        "details": "Détails",
        "disputeBlocked": "A dispute cannot be opened in the current contract state.",
        "disputeError": "Erreur lors de l'ouverture du litige",
        "disputeOpened": "Litige ouvert",
        "disputeReasonAria": "Dispute reason",
        "disputeReasonPlaceholder": "Explain reason for dispute...",
        "disputeReview": "Révision dans 48 heures",
        "disputeWarning": "Opening a dispute will suspend the contract while it is reviewed.",
        "employer": "Employeur",
        "error": "Une erreur s'est produite",
        "escrowBanner": {
            "clientFundDetail": "Financez {{amount}} TND dans la garantie pour commencer à travailler avec {{name}}.",
            "clientFundSafe": "Les fonds sont conservés en toute sécurité jusqu'à ce que vous approuviez la livraison.",
            "clientSecureTitle": "Sécurisez votre contrat",
            "dismiss": "Ignorer",
            "freelancerNotified": "Vous serez notifié une fois les fonds confirmés.",
            "freelancerWaiting": "En attente que le client sécurise la garantie avant le début du travail.",
            "fundAmount": "Financer {{amount}} TND",
            "topUpNeeded": "Rechargement nécessaire",
            "walletBalance": "Solde du portefeuille : {{balance}} TND"
        },
        "fileUploadError": "Erreur lors du téléchargement du fichier",
        "fileUploaded": "File uploaded:",
        "filesListEmpty": "Files List Empty",
        "finalDelivery": "Livraison finale",
        "firstMessageHint": "Share context, files, and next steps to keep the project moving.",
        "hideWorkspace": "Masquer l'espace",
        "inProgress": "En cours",
        "jobInfo": "Informations sur la mission",
        "lifecycle": {
            "noComment": "Aucun commentaire fourni",
            "provideBothError": "Veuillez fournir des livrables pour les phases de révision et de remise finale.",
            "uploadFailed": "Échec du téléchargement {{stage}} pour {{name}} : {{message}}",
            "workDeliveredMessage": "[[contract_completed]] Le travail a été accepté et le paiement libéré"
        },
        "loadFailedMessage": "Unable to load this contract right now.",
        "loadFailedTitle": "Contract unavailable",
        "milestones": "Étapes",
        "noDueDate": "Pas de date d'échéance",
        "noSharedFiles": "Aucun fichier partagé pour le moment",
        "notFoundDescription": "This contract may still be syncing. You can retry or return to your contracts list.",
        "notFoundTitle": "Contract not found",
        "onlineNow": "En ligne maintenant",
        "openDispute": "Ouvrir un litige",
        "openDisputeAction": "Open Dispute",
        "paymentInfo": "Informations de paiement",
        "pending": "En attente",
        "requestChanges": "Demander des modifications",
        "requestChangesBlocked": "Changes can only be requested after a delivery is submitted.",
        "requestRevision": "Demander des révisions",
        "requiredActions": "Actions requises",
        "resubmitDelivery": "Resubmit Delivery",
        "reviewExperience": "Review Experience",
        "reviewExpired": "Période de révision expirée",
        "reviewSent": "Avis envoyé avec succès",
        "revisionLimitReached": "Revision limit reached for this contract.",
        "revisionSent": "Demande de révision envoyée",
        "revisionSentCompatibilityNotice": "Revision request sent. Status update will apply once the latest contract enum migration is available.",
        "role": "Role",
        "send": "Envoyer",
        "sendMessage": "Envoyer un message...",
        "sendMessageError": "Erreur lors de l'envoi du message",
        "seoDescription": "Track conversation, files, and payment status for your contract from the workspace.",
        "sharedFiles": "Fichiers partagés",
        "startConversation": "Démarrez la conversation",
        "startedAt": "Started",
        "statusLabel": "Status:",
        "statusUnavailable": "Statut indisponible",
        "statusUnavailableHint": "Les données du statut sont temporairement indisponibles. Cette discussion reste disponible.",
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
        "typeMessage": "Écrivez votre message ici...",
        "untitledJob": "Untitled job",
        "workAccepted": "Travail accepté et paiement effectué!",
        "workDelivered": "Travail livré avec succès!",
        "workingOnProject": "Travaille sur ce projet",
        "workspaceTitle": "Espace de travail"
    },
    "contractWorkspace": {
        "clientView": "Vue client",
        "deliveryFailed": "Failed to submit delivery.",
        "deliverySubmitted": "Delivery submitted! The client will review your work.",
        "disputeFailed": "Failed to open dispute.",
        "disputeOpened": "Dispute opened. Our team will review the case.",
        "freelancerView": "Vue freelance",
        "loadError": "Échec du chargement des détails du contrat. Veuillez réessayer.",
        "notFound": "Contrat introuvable ou vous n'avez pas accès.",
        "notParticipant": "Vous n'êtes pas participant à ce contrat.",
        "openToDeliver": "Ouvrez ce contrat dans Messages pour livrer le travail.",
        "openToDispute": "Ouvrez ce contrat dans Messages pour ouvrir un litige.",
        "openToReleasePay": "Ouvrez ce contrat dans Messages pour libérer le paiement.",
        "openToRequestChanges": "Ouvrez ce contrat dans Messages pour demander des modifications.",
        "paymentReleased": "Payment released and contract completed.",
        "releaseFailed": "Failed to release payment.",
        "revisionFailed": "Failed to request revision.",
        "revisionRequested": "Revision requested. The freelancer has been notified.",
        "unableToLoad": "Impossible de charger l'espace de travail"
    },
    "contracts": {
        "activeCount": "{{count}} actifs",
        "empty": {
            "clientCta": "Publier un projet",
            "clientDescription": "Engagez un freelance pour créer votre premier contrat.",
            "freelancerCta": "Parcourir les missions",
            "freelancerDescription": "Envoyez des propositions pour obtenir votre premier contrat.",
            "title": "Aucun contrat pour le moment"
        },
        "emptyCancelledDescription": "Vous n'avez pas de contrats annulés.",
        "emptyCancelledTitle": "Aucun contrat annulé",
        "emptyDescription": "Essayez un autre onglet ou ajustez votre recherche pour trouver des contrats plus rapidement.",
        "emptyTitle": "Aucun contrat trouvé",
        "milestonesProgress": "1 étape sur 3 terminée",
        "openWorkspace": "Ouvrir l'espace de travail ->",
        "paymentProtectionDesc": "Communiquez et demandez toujours les paiements via WorkedIn. Les contrats payés en dehors de la plateforme ne sont pas protégés par notre système d'entiercement sécurisé.",
        "paymentProtectionTitle": "Protection des Paiements",
        "role": {
            "client": "Client",
            "freelancer": "Freelance"
        },
        "searchPlaceholder": "Rechercher des contrats ou des utilisateurs...",
        "startedOn": "Commencé {{date}}",
        "status": {
            "active": "Actif",
            "cancelled": "Annulé",
            "completed": "Terminé",
            "disputed": "En litige"
        },
        "subtitle": "Gerez vos contrats actifs, vos travaux passés et vos communications clients.",
        "tabs": {
            "active": "Actifs",
            "all": "Tous",
            "completed": "Terminés",
            "disputed": "Litiges"
        },
        "title": "Contrats",
        "unknownProject": "Projet inconnu",
        "unknownUser": "Utilisateur inconnu"
    },
    "counter": {
        "title": "dinars gagnés par les Tunisiens ce mois-ci"
    },
    "ctaSection": {
        "badge": "Prêt?",
        "browseJobs": "Parcourir les offres",
        "clientDashboard": "Tableau de bord Client",
        "findFreelancers": "Trouver des freelances",
        "goToDashboard": "Aller au Tableau de bord",
        "primary": "Commencez gratuitement",
        "secondary": "Publiez un projet",
        "subtitle": "Rejoignez des milliers de professionnels qui gagnent déjà équitablement sur WorkedIn.",
        "title": "L'économie des indépendants en Tunisie commence ici."
    },
    "dashboard": {
        "admin": {
            "activeContracts": "Contrats actifs",
            "activeJobs": "Missions actives",
            "adminDashboard": "Tableau de bord admin",
            "allStatuses": "Tous les statuts",
            "allTransactionsSuccess": "Toutes les transactions ont réussi",
            "allUsers": "Tous les utilisateurs",
            "allVerificationsProcessed": "Toutes les demandes de vérification ont été traitées",
            "backSide": "Verso",
            "backToSite": "Retour au site",
            "cancelled": "Annulé",
            "clients": "Clients",
            "completed": "Terminé",
            "controlCenter": "Centre de controle",
            "disputes": "Litiges",
            "failedToLoadUsers": "Impossible de charger les utilisateurs",
            "freelancers": "Freelances",
            "frontSide": "Recto",
            "identityVerificationRequests": "Demandes de vérification d'identité",
            "inProgress": "En cours",
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
            "loading": "Chargement...",
            "loadingUsers": "Chargement des utilisateurs...",
            "nightModeReady": "Mode nuit prêt",
            "noPendingRequests": "Aucune demande en attente",
            "noPendingVerifications": "Aucune demande de vérification en attente",
            "noStuckPayments": "Aucun paiement bloqué",
            "open": "Ouvert",
            "operationsCenter": "Centre de supervision",
            "overview": "Aperçu",
            "pageDescription": "Examinez et gérez les demandes de vérification d'identité soumises",
            "pageTitle": "Demandes de vérification d'identité - Tableau de bord admin",
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
            "pending": "en attente",
            "pendingRequests": "Demandes en attente",
            "refresh": "Actualiser",
            "reports": "Signalements",
            "revenue": "Revenus (TND)",
            "settings": "Paramètres",
            "stuckPayments": "Paiements bloqués (plus de 1 heure)",
            "todayActivity": "Activité d'aujourd'hui",
            "totalUsers": "Nombre total d'utilisateurs",
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
        "all": "Tout",
        "availableJobs": "Missions correspondant à vos compétences",
        "browseJobs": "Parcourir les missions",
        "client": {
            "acrossActiveContracts": "Sur {{count}} contrats actifs",
            "activeBadge": "Actif",
            "activeContracts": "Contrats actifs",
            "activeContractsDescription": "Contrats actuellement en cours avec des freelances assignés.",
            "activeJobs": "Missions actives",
            "activeJobsDetail": "Projets ouverts ou en cours nécessitant actuellement des décisions, des propositions ou un suivi de livraison.",
            "activeLabel": "Actif",
            "activeProjects": "Projets actifs",
            "allCaughtUp": "Tout est à jour",
            "allCaughtUpDescription": "Lorsque les mises à jour des propositions, les modifications de contrat ou les rappels arrivent, ils apparaîtront ici de manière plus claire.",
            "assigneeLabel": "Freelance assigné",
            "awaitingReview": "En attente de révision",
            "badgeUnverified": "Project Owner",
            "badgeVerified": "Verified Client",
            "clientFallback": "Client",
            "commandCenter": "Centre de commande client",
            "commandCenterSubtitle": "Track projects, proposals & spending",
            "completedContracts": "Contrats terminés",
            "completedContractsDetail": "Projets que vous avez menés à bien jusqu'à la livraison et clôturés avec succès.",
            "contractsBadge": "Livraison active",
            "defaultName": "Client",
            "defaultNotificationBody": "Un événement du projet nécessite votre attention.",
            "defaultNotificationTitle": "Mise à jour du projet",
            "focusDeliveryDescription": "Suivez les étapes, les messages et les approbations pour que les projets actifs continuent d'avancer sans friction.",
            "focusDeliveryTitle": "Restez proche des livraisons actives",
            "focusFirstJobDescription": "Une description claire de votre projet débloque des propositions, des sélections et des contrats. Commencez par là.",
            "focusFirstJobTitle": "Publiez votre premier projet",
            "focusLabel": "Priorité du jour",
            "focusReviewDescription": "Votre projet \"{{title}}\" a déjà des propositions en attente de votre examen.",
            "focusReviewTitle": "Examiner les propositions reçues",
            "focusScaleDescription": "Votre tableau de bord est calme en ce moment. Préparez votre prochaine mission et invitez des freelances mieux adaptés.",
            "focusScaleTitle": "Ouvrez un nouveau projet prometteur",
            "freelancerFallback": "Freelance",
            "heroDescription": "Gardez votre processus d'embauche propre : publiez des descriptions plus claires, examinez les propositions plus rapidement et faites avancer les projets actifs sans bruit supplémentaire.",
            "heroGreeting": "Bienvenue, {{name}}",
            "inProgressProjects": "En cours",
            "jobBudget": "Budget",
            "jobsWithProposals": "Missions avec propositions",
            "manageWorkspace": "Gérer l'espace de travail",
            "monitorDelivery": "Suivre la livraison",
            "needSomethingDone": "Besoin de quelque chose?",
            "nextActionLabel": "Action suivante",
            "nextMoves": "Meilleures prochaines étapes",
            "noActiveContracts": "Aucun contrat actif",
            "noActiveContractsDescription": "Une fois une proposition acceptée et l'escrow financé, les contrats actifs apparaîtront ici.",
            "noActiveProjects": "Aucun projet actif",
            "noJobsDescription": "Votre tableau de bord commencera à se remplir dès que vous publierez un brief de projet et inviterez des propositions dans le pipeline.",
            "noJobsYet": "Vous n'avez publié aucune mission pour le moment",
            "notifications": "Notifications",
            "openNotifications": "Ouvrir les notifications",
            "openProjects": "Projets ouverts",
            "pipeline": {
                "openJobs": "missions ouvertes",
                "totalProposals": "propositions totales",
                "unreadUpdates": "mises à jour non lues"
            },
            "pipelineBadge": "Aide à la décision",
            "pipelineSummary": "Résumé de recrutement",
            "playbookBadge": "Guide du client",
            "postAProject": "Publier un projet",
            "postFirstProject": "Publiez votre premier projet pour trouver des freelances talentueux",
            "postJob": "Publier une nouvelle mission",
            "postJobToReceiveProposals": "Publiez un projet pour commencer à recevoir des propositions",
            "postProjectFree": "Publiez un projet gratuitement. Recevez des propositions de talents tunisiens vérifiés.",
            "postProjectFreeCta": "Publier un projet — c'est gratuit",
            "profileUnavailable": "Profile unavailable",
            "profileUnavailableDesc": "We could not load your account profile yet. Please try again.",
            "projectsBadge": "Pipeline d'embauche",
            "projectsDescription": "Derniers briefs de projet, signaux de proposition et états de livraison actifs au même endroit.",
            "projectsLabel": "Projets",
            "proposalsCountText": "propositions",
            "proposalsLabel": "Propositions",
            "proposalsSubmitted": "{{count}} propositions reçues",
            "proposalsWaiting": "Projets en attente de révision",
            "proposalsWaitingDetail": "Projets ouverts qui ont déjà reçu des propositions et doivent être révisés avant qu'elles ne deviennent obsolètes.",
            "recentProposals": "Propositions récentes",
            "refineProfile": "Affiner le profil du client",
            "refineProfileDescription": "Un profil d'entreprise plus clair aide les pigistes à faire confiance au brief et à répondre plus rapidement.",
            "reviewBadge": "Examiner",
            "reviewPipeline": "Examiner le pipeline du projet",
            "reviewPipelineDescription": "Comparez les briefs ouverts, l'activité des propositions et la livraison active en un seul endroit.",
            "reviewProposals": "Examiner les propositions",
            "spentLabel": "Dépensé",
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
                "cancelled": "Annulé"
            },
            "thisMonth": "Ce mois",
            "totalSpent": "Dépenses totales",
            "totalSpentDetail": "Paiements effectués libérés via votre portefeuille client et les flux de garantie.",
            "untitledContract": "Contrat sans titre",
            "untitledJob": "Projet sans titre",
            "updatesBadge": "Pulse de la boîte de réception",
            "viewAll": "Voir tout",
            "viewAllContracts": "Voir tout",
            "viewProject": "Voir le projet",
            "viewWallet": "Voir le portefeuille",
            "welcomeBack": "Bon retour"
        },
        "clientSubtitle": "Tableau de bord client",
        "freelancer": {
            "activeContracts": "Contrats actifs",
            "addSkillsToMatch": "Ajoutez des compétences à votre profil pour obtenir des projets correspondants",
            "apply": "Postuler",
            "badgeUnverified": "Pro Freelancer",
            "badgeVerified": "Verified Pro",
            "browseAndSendProposal": "Parcourez les projets ouverts et envoyez votre première proposition",
            "browseJobs": "Parcourir les projets",
            "checklist": {
                "avatar": "Avatar téléchargé",
                "bio": "Biographie écrite",
                "identity": "Identité vérifiée",
                "preferences": "Préférences de projet",
                "skills": "Compétences ajoutées",
                "title": "Titre professionnel",
                "tools": "Outils ajoutés"
            },
            "clientFallback": "Client",
            "contractsLabel": "Contrats",
            "defaultName": "Freelance",
            "earningsLabel": "Revenus",
            "earningsThisMonth": "Earnings This Month",
            "matchedForYou": "Correspondances pour vous",
            "myProposals": "My Proposals",
            "noActiveContracts": "Aucun contrat actif",
            "noMatchesYet": "Pas encore de correspondances",
            "noProposalsYet": "Pas encore de propositions",
            "profileCompletion": "Profile Strength",
            "profileStrength": "Force du profil",
            "proposalsLabel": "Propositions",
            "quickActions": "Actions rapides",
            "ratingLabel": "Évaluation",
            "recentProposals": "Propositions récentes",
            "seeAllJobs": "Voir tous les projets",
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
            "submitProposalsToStart": "Soumettez des propositions pour commencer à obtenir des contrats",
            "thisMonth": "Ce mois",
            "untitledJob": "Projet sans titre",
            "updateProfile": "Mettre à jour le profil",
            "viewAll": "Voir tout",
            "viewWallet": "Voir le portefeuille",
            "vsLastMonth": "par rapport au mois dernier",
            "withdrawFunds": "Withdraw Funds"
        },
        "freelancerSubtitle": "Tableau de bord freelance",
        "greeting": {
            "afternoon": "Bon après-midi",
            "evening": "Bonsoir",
            "morning": "Bonjour"
        },
        "jobsCompleted": "missions terminées",
        "loading": "Loading...",
        "new": "Nouveau",
        "postNewJob": "Publier une nouvelle mission",
        "postNewJobDesc": "Décrivez votre mission et nous trouverons les 3 meilleurs freelances",
        "profileCompletion": "Profil complété",
        "quickActions": "Actions rapides",
        "rating": "Note",
        "recentActivity": "Activité récente",
        "responseTime": "heures",
        "totalEarnings": "dinars",
        "updateProfile": "Mettre à jour le profil",
        "urgent": "Urgent",
        "viewAll": "Voir tout",
        "viewDetails": "Voir les détails",
        "viewProfile": "Voir le profil",
        "welcome": "Bienvenue",
        "yourJobs": "Vos missions"
    },
    "dashboards": {
        "admin": {
            "headers": {
                "adminDashboard": "Tableau de bord administrateur",
                "backToSite": "Retour au site",
                "nightModeReady": "Mode nuit prêt",
                "operationsCenter": "Centre d'opérations"
            },
            "labels": {
                "action": "Action",
                "createdAt": "Créé à",
                "date": "Date",
                "email": "E-mail",
                "role": "Rôle",
                "status": "Statut",
                "updatedAt": "Mise à jour à",
                "user": "Utilisateur"
            },
            "messages": {
                "error": "Erreur lors du chargement des données",
                "loading": "Chargement...",
                "noData": "Aucune donnée trouvée"
            },
            "tabs": {
                "disputes": "Litiges",
                "jobs": "Emplois",
                "overview": "Aperçu",
                "payments": "Paiements",
                "reports": "Rapports",
                "settings": "Paramètres",
                "users": "Utilisateurs",
                "verifications": "Vérifications"
            },
            "users": {
                "suspend": "Suspendre",
                "suspendUser": "Suspendre l'utilisateur",
                "suspendUserConfirm": "Voulez-vous suspendre l'utilisateur",
                "suspensionKeepsHistory": "Les contrats, paiements, litiges et l'historique d'audit seront conservés.",
                "switch": "Basculer",
                "unableToUpdateStatus": "Impossible de mettre à jour le statut de l'utilisateur"
            },
            "verification": {
                "approve": "Approuver",
                "approved": "Approuvé",
                "pending": "En attente de vérification",
                "reject": "Rejeter",
                "rejected": "Rejeté",
                "resubmit": "Soumettre à nouveau",
                "title": "File d'attente de vérification",
                "viewDetails": "Voir les détails"
            }
        },
        "client": {
            "actions": {
                "postProject": "Publier un projet",
                "viewAll": "Voir tout",
                "viewWallet": "Afficher le portefeuille"
            },
            "cta": {
                "needSomethingDone": "Avez-vous besoin de quelque chose?",
                "needSomethingDoneDesc": "Publiez un projet gratuitement. Obtenez des propositions de talents tunisiens vérifiés.",
                "postProjectFree": "Publiez un projet — c'est gratuit"
            },
            "empty": {
                "noActiveProjects": "Aucun projet actif",
                "noActiveProjectsDesc": "Publiez votre premier projet pour trouver des indépendants talentueux",
                "noProposals": "Aucune proposition pour le moment",
                "noProposalsDesc": "Les propositions des indépendants apparaîtront ici"
            },
            "labels": {
                "freelancer": "Indépendant",
                "review": "Avis",
                "untitledJob": "Projet sans titre"
            },
            "stats": {
                "active": "Actif",
                "projects": "Projets",
                "proposals": "Propositions",
                "spent": "Dépensé"
            },
            "widgets": {
                "activeContracts": "Contrats actifs",
                "activeProjects": "Projets actifs",
                "recentProposals": "Propositions récentes",
                "thisMonth": "Ce mois"
            }
        },
        "freelancer": {
            "actions": {
                "browseJobs": "Parcourir les emplois",
                "updateProfile": "Mettre à jour le profil",
                "viewWallet": "Afficher le portefeuille"
            },
            "checklist": {
                "avatarUploaded": "Avatar téléchargé",
                "bioWritten": "Biographie rédigée",
                "identityVerified": "Identité vérifiée",
                "professionalTitle": "Titre professionnel",
                "skillsAdded": "Compétences ajoutées"
            },
            "empty": {
                "checkBackSoon": "Revenez bientôt pour de nouvelles opportunités",
                "noActiveContracts": "Aucun contrat actif",
                "noActiveContractsDesc": "Soumettez des propositions pour commencer à obtenir des contrats",
                "noMatches": "Aucune correspondance pour le moment"
            },
            "labels": {
                "client": "Client",
                "untitledJob": "Projet sans titre",
                "vsLastMonth": "par rapport au mois dernier"
            },
            "profileStrength": {
                "complete": "Complet"
            },
            "stats": {
                "contracts": "Contrats",
                "earnings": "Revenus",
                "proposals": "Propositions",
                "rating": "Évaluation"
            },
            "widgets": {
                "activeContracts": "Contrats actifs",
                "matchedForYou": "Adapté pour vous",
                "profileStrength": "Force du profil",
                "recentProposals": "Propositions récentes",
                "thisMonth": "Ce mois"
            }
        }
    },
    "dynamic_key_1004386723": "Votre demande de retrait sera examinée par l'administration et le montant transféré dans 2 à 5 jours ouvrables.",
    "dynamic_key_1015995410": "Rechercher des propositions...",
    "dynamic_key_1016245850": "Votre avis pour",
    "dynamic_key_1039014200": "À propos de moi",
    "dynamic_key_1053149402": "Paiement échoué",
    "dynamic_key_1072185127": "Expliquez pourquoi vous êtes la personne idéale pour ce projet...",
    "dynamic_key_1080932848": "Titre du projet",
    "dynamic_key_1087307158": "Les avis sont permanents et ne peuvent pas être modifiés. L'autre partie peut répondre à votre avis.",
    "dynamic_key_1102070523": "Coût total",
    "dynamic_key_1109099118": "Gains totaux",
    "dynamic_key_1111663922": "💡 Le paiement est sécurisé en séquestre jusqu'à la livraison et approbation du travail.",
    "dynamic_key_1113257013": "Message de proposition",
    "dynamic_key_1115664379": "(500 caractères max)",
    "dynamic_key_1144928517": "Le téléchargement de fichiers sera bientôt disponible. Veuillez utiliser une URL d'image directe pour le moment.",
    "dynamic_key_1163187178": "Description du projet",
    "dynamic_key_1225650541": "En cours...",
    "dynamic_key_1253092729": "Nous avons analysé vos besoins et trouvé 3 freelances correspondant à votre projet à 95%.",
    "dynamic_key_1259492927": "heures environ",
    "dynamic_key_1262868023": "Langue maternelle",
    "dynamic_key_1265703203": "Frais de service",
    "dynamic_key_128175915": "Accueil",
    "dynamic_key_131381918": "Réessayer",
    "dynamic_key_1333999920": "Compétences utilisées",
    "dynamic_key_1337275137": "Lire la suite...",
    "dynamic_key_1347768947": "Lien du projet (optionnel)",
    "dynamic_key_1348454276": "Conseils de dépannage :",
    "dynamic_key_1393796300": "Téléchargement du fichier...",
    "dynamic_key_1475699192": "Intermédiaire",
    "dynamic_key_1500402850": "Il n'y a aucun élément à afficher pour le moment.",
    "dynamic_key_1501241012": "Signaler",
    "dynamic_key_1501416850": "Masquer",
    "dynamic_key_1502065525": "Annuler",
    "dynamic_key_1503344713": "Mieux notés",
    "dynamic_key_1505988461": "Actualiser",
    "dynamic_key_1506640045": "Évaluation",
    "dynamic_key_1506801489": "Recruter",
    "dynamic_key_1524267": "TND",
    "dynamic_key_1529240342": "Paramètres de confidentialité",
    "dynamic_key_1530768926": "Débutant",
    "dynamic_key_1530851603": "Avancé",
    "dynamic_key_1530855304": "Top Freelance",
    "dynamic_key_1543783939": "Voir la mission",
    "dynamic_key_1544269147": "Frais de plateforme (",
    "dynamic_key_1545985538": "Niveau du freelance",
    "dynamic_key_1546829780": "Avis écrit (optionnel)",
    "dynamic_key_1573622": "Gagné",
    "dynamic_key_1581598": "proposition",
    "dynamic_key_158612530": "• Assurez-vous d'avoir un solde suffisant",
    "dynamic_key_1591556203": "Partagez votre expérience avec les autres",
    "dynamic_key_1593775": "il y a",
    "dynamic_key_1594354": "Oui",
    "dynamic_key_1598663": "jour",
    "dynamic_key_1607514557": "Transactions récentes",
    "dynamic_key_1608485352": "Pièces jointes (optionnel)",
    "dynamic_key_1611325765": "Minimum 100 caractères requis",
    "dynamic_key_1637895873": "Nom de la banque",
    "dynamic_key_1647529322": "Ignorer pour l'instant",
    "dynamic_key_1655363803": "Envoyer la proposition",
    "dynamic_key_1659410812": "• Vérifiez votre connexion Internet",
    "dynamic_key_1659906949": "Taux de réussite",
    "dynamic_key_1679990796": "Soumettre l'avis",
    "dynamic_key_1693322708": "Compétences",
    "dynamic_key_1707230249": "• Vérifiez que vos coordonnées bancaires sont correctes",
    "dynamic_key_1712849267": "Pièces jointes",
    "dynamic_key_1716602825": "Prix le plus bas",
    "dynamic_key_1718339647": "Candidature envoyée",
    "dynamic_key_1725907738": "Impossible de charger vos données. Veuillez réessayer.",
    "dynamic_key_1739654371": "Exemple de travail",
    "dynamic_key_1761004867": "Plus utiles",
    "dynamic_key_1762109572": "Échec de la vérification du paiement",
    "dynamic_key_1785209048": "Décrivez les détails du projet et ce que vous avez accompli...",
    "dynamic_key_1789330939": "Avis (",
    "dynamic_key_1793704877": "Envoi en cours...",
    "dynamic_key_1797922455": "Comptes vérifiés uniquement",
    "dynamic_key_1798326885": "Paiement réussi ! 🎉",
    "dynamic_key_1805513405": "Exemple : Conception d'un site e-commerce",
    "dynamic_key_1821001923": "Veuillez patienter pendant que nous vérifions le paiement",
    "dynamic_key_1824767388": "Mission terminée",
    "dynamic_key_18255446": "Rédigez votre réponse à l'avis",
    "dynamic_key_1827230247": "Français",
    "dynamic_key_1828865552": "Note 4 étoiles et plus",
    "dynamic_key_1842506838": "Historique de travail non disponible dans cet aperçu",
    "dynamic_key_1842976832": "Meilleure correspondance",
    "dynamic_key_1933160140": "Retour au contrat",
    "dynamic_key_193923978": "Un contrat sera créé entre vous et ce freelance. Êtes-vous sûr ?",
    "dynamic_key_1954172192": "Voir tout",
    "dynamic_key_1972795761": "Date de réalisation",
    "dynamic_key_197805234": "Recommandations IA",
    "dynamic_key_1991592213": "Télécharger un fichier",
    "dynamic_key_1999631066": "Accueil",
    "dynamic_key_2001555607": "Répondre à l'avis",
    "dynamic_key_2009227315": "Votre introduction audio a été enregistrée",
    "dynamic_key_201330750": "• Essayez avec une autre carte",
    "dynamic_key_2053478334": "Date de publication",
    "dynamic_key_2071077264": "Recruter maintenant",
    "dynamic_key_2071445136": "Envoyer la demande de retrait",
    "dynamic_key_208308034": "Solde disponible",
    "dynamic_key_2123673725": "Votre portefeuille n'a pas encore été créé",
    "dynamic_key_2132806281": "Tâche :",
    "dynamic_key_2133212330": "Exemple de travail 1 (image)",
    "dynamic_key_2134028980": "Aucun avis pour le moment",
    "dynamic_key_2137084368": "Évaluation",
    "dynamic_key_2144569262": "Arabe",
    "dynamic_key_214509631": "Mon Portefeuille",
    "dynamic_key_215587664": "Nom complet tel qu'il apparaît sur le compte bancaire",
    "dynamic_key_217425117": "Message",
    "dynamic_key_218823582": "Une erreur inattendue s'est produite",
    "dynamic_key_220193727": "Partager",
    "dynamic_key_220511911": "Projet :",
    "dynamic_key_223878144": "Numéro de téléphone",
    "dynamic_key_229505028": "L'autre partie est en train d'écrire...",
    "dynamic_key_232051787": "Voir les recommandations",
    "dynamic_key_233190025": "Utile (",
    "dynamic_key_234965878": "Remarque",
    "dynamic_key_236480406": "Durée estimée",
    "dynamic_key_238952578": "Voir les détails",
    "dynamic_key_243096717": "En attente",
    "dynamic_key_257908957": "A un portfolio",
    "dynamic_key_29050573": "Vitesse de réponse",
    "dynamic_key_300689867": "Demande de retrait envoyée",
    "dynamic_key_322511046": "professionals already on WorkedIn",
    "dynamic_key_331518742": "Si le problème persiste, contactez le support technique",
    "dynamic_key_365411007": "Lettre de motivation",
    "dynamic_key_374761519": "Vérification du paiement...",
    "dynamic_key_380610698": "Note globale",
    "dynamic_key_392258297": "URL de l'image miniature",
    "dynamic_key_403517891": "Vous recevrez",
    "dynamic_key_418944631": "Exemple de travail 2 (image)",
    "dynamic_key_41921266": "Avis non disponibles dans cet aperçu",
    "dynamic_key_422731376": "Offre réfléchie",
    "dynamic_key_426109629": "Désolé, une erreur est survenue lors du chargement de la page. Veuillez réessayer.",
    "dynamic_key_432874841": "Prix le plus élevé",
    "dynamic_key_451961555": "Délai de livraison",
    "dynamic_key_452524680": "Délai de livraison",
    "dynamic_key_454607345": "Exemple : design UI, développement frontend, retouche photo (séparés par des virgules)",
    "dynamic_key_475558032": "Nom du titulaire du compte",
    "dynamic_key_476684698": "Trier par",
    "dynamic_key_480999927": "Redirection automatique...",
    "dynamic_key_481289425": "Aucune transaction pour le moment",
    "dynamic_key_48695393": "Expert",
    "dynamic_key_48788556": "Retour",
    "dynamic_key_49410394": "Vérifié",
    "dynamic_key_49413132": "Succès",
    "dynamic_key_496366041": "Moins bien notés",
    "dynamic_key_50718": "Répondre",
    "dynamic_key_51299": "Non",
    "dynamic_key_525136044": "Autres caractéristiques",
    "dynamic_key_545901654": "Vous pouvez télécharger des fichiers PDF ou des images jusqu'à 10MB",
    "dynamic_key_549959251": "Valeur de la proposition",
    "dynamic_key_571944939": "Commencez par créer votre premier projet.",
    "dynamic_key_596156750": "Évaluation du freelance",
    "dynamic_key_611934998": "Projets réalisés",
    "dynamic_key_614661587": "Total à payer",
    "dynamic_key_617719072": "Détails de la proposition",
    "dynamic_key_623032746": "Langues",
    "dynamic_key_624028093": "Plus récent",
    "dynamic_key_639337527": "Envoyer la réponse",
    "dynamic_key_669258706": "Votre commentaire (optionnel)",
    "dynamic_key_6717295": "Archiver la proposition",
    "dynamic_key_685712071": "Évaluations détaillées",
    "dynamic_key_71417736": "Votre demande sera examinée et le montant transféré dans 2 à 5 jours ouvrables",
    "dynamic_key_72742741": "Partagez votre expérience avec cette personne...",
    "dynamic_key_730815621": "Aller au contrat",
    "dynamic_key_76026069": "Exemple : Banque Nationale Agricole",
    "dynamic_key_764967864": "Retour au tableau de bord",
    "dynamic_key_812168715": "Montant demandé",
    "dynamic_key_829255241": "Qu'avez-vous aimé ? Que peut-on améliorer ? Le recommanderiez-vous ?",
    "dynamic_key_831489996": "Paiement financé avec succès. Les fonds sont conservés en toute sécurité.",
    "dynamic_key_854531310": "Essayez d'ajuster votre recherche ou vos filtres pour trouver ce que vous cherchez.",
    "dynamic_key_857615762": "Budget",
    "dynamic_key_860054720": "Réponse du propriétaire",
    "dynamic_key_872049934": "Filtrer les propositions",
    "dynamic_key_890920977": "Réponse du freelance :",
    "dynamic_key_891367863": "Demander un retrait",
    "dynamic_key_928208723": "Valeur de la proposition (TND)",
    "dynamic_key_934974283": "Recommandé (Meilleure correspondance)",
    "dynamic_key_936673124": "Détails de la mission",
    "dynamic_key_939059608": "Méthode de retrait",
    "dynamic_key_979253881": "Écrivez votre réponse ici...",
    "dynamic_key_9853380": "Client récurrent",
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
        "jobCard": "Impossible de charger la carte d'emploi",
        "retry": "Réessayer",
        "title": "Quelque chose s'est mal passé",
        "unexpected": "Une erreur inattendue s'est produite lors du rendu de cette section."
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
                "items": [{"q":"Comment publier un projet?","a":"Cliquez sur \"Publier un projet\", décrivez votre travail, définissez votre budget et votre calendrier, puis publiez. Vous recevrez des propositions d'indépendants vérifiés."},{"q":"Que faire si je ne suis pas satisfait du travail?","a":"Si le travail ne répond pas aux conditions convenues, vous recevez un remboursement complet. Les fonds sont mis sous séquestre jusqu'à ce que vous approuviez la livraison."},{"q":"Comment mon argent est-il protégé?","a":"Les fonds sont conservés de manière sécurisée en séquestre. L'indépendant ne reçoit le paiement que lorsque vous approuvez le travail effectué."}],
                "title": "Pour les clients"
            },
            "freelancer": {
                "items": [{"q":"Comment commencer en tant qu'indépendant?","a":"Inscrivez-vous, complétez votre profil avec vos compétences et votre portefeuille, puis commencez à parcourir les projets disponibles qui correspondent à votre expertise."},{"q":"Combien puis-je gagner?","a":"Vos gains dépendent des projets que vous acceptez et des tarifs que vous fixez. De nombreux indépendants tunisiens gagnent entre 500-5000 dinars tunisiens par mois."},{"q":"Comment me fait-on payer?","a":"Les paiements s'effectuent via D17, virement bancaire ou autres méthodes de paiement locales. Vous définissez votre méthode de paiement préférée dans les paramètres du portefeuille."}],
                "title": "Pour les indépendants"
            },
            "general": {
                "items": [{"q":"Qu'est-ce que WorkedIn.tn?","a":"WorkedIn.tn est une plateforme tunisienne de travail indépendant reliant les entreprises aux professionnels talentueux. Nous croyons en un paiement équitable, des profils vérifiés et des transactions sécurisées protégées par séquestre."},{"q":"L'inscription est-elle gratuite?","a":"Oui, l'inscription est complètement gratuite pour les indépendants et les clients. Nous ne prélevons qu'une petite commission sur les projets réussis."},{"q":"Combien de temps prend la vérification?","a":"La vérification d'identité prend généralement 24-48 heures. Vous pouvez commencer la configuration de votre profil immédiatement, et la vérification se fait en arrière-plan."}],
                "title": "Général"
            },
            "payment": {
                "items": [{"q":"Quels modes de paiement acceptez-vous?","a":"Nous supportons toutes les méthodes locales tunisiennes: cartes, D17, virement bancaire et espèces pour petits montants."},{"q":"Quand me fait-on payer?","a":"Les indépendants sont payés dans les 48 heures suivant l'approbation du client et la libération du séquestre."},{"q":"Y a-t-il des frais cachés?","a":"Non. Nos frais sont transparents et clairement affichés. Nous prélevons uniquement une petite commission sur les projets réalisés."},{"q":"Quels modes de paiement sont disponibles?","a":"Nous supportons actuellement Dhmad escrow pour les transactions scurises. Flouci wallet et D17 (La Poste) arrivent bientt. Dhmad conserve vos fonds en scurit jusqu' l'approbation du travail  le mme systme utilis par Tunisie Freelance."},{"q":"Dhmad est-il fiable?","a":"Oui. Dhmad est une plateforme d'escrow tunisienne autorise  dtenir des fonds en tant que tiers de confiance. Votre argent est protg jusqu' ce que vous approuviez le travail."},{"q":"Quand Flouci et D17 seront-ils disponibles?","a":"Nous travaillons activement  l'ajout de Flouci et D17. Ils seront disponibles prochainement. Nous informerons tous les utilisateurs lors de leur lancement."},{"q":"Que se passe-t-il en cas de litige?","a":"En cas de dsaccord, Dhmad conserve les fonds pendant la rsolution du litige. Aucune partie ne peut accder  l'argent avant que le problme soit rgl."}],
                "title": "Paiement et revenus"
            },
            "security": {
                "items": [{"q":"Mes informations personnelles sont-elles sûres?","a":"Oui. Nous utilisons le chiffrement et les mesures de sécurité standard. Vos données ne sont jamais partagées sans votre permission."},{"q":"Pourquoi avez-vous besoin d'une vérification d'identité?","a":"La vérification d'identité garantit la confiance et la sécurité pour les indépendants et les clients. Chaque professionnel sur WorkedIn est vérifié par identité."},{"q":"Puis-je rester anonyme?","a":"Non. Les indépendants et les clients doivent être vérifiés. Cela protège tout le monde et assure la responsabilité."}],
                "title": "Sécurité et confidentialité"
            }
        },
        "page": {
            "contactButton": "Contactez-nous",
            "noAnswer": "Vous n'avez pas trouvé votre réponse?",
            "searchPlaceholder": "Rechercher des questions...",
            "subtitle": "Réponses aux questions les plus courantes sur l'utilisation de WorkedIn.tn",
            "supportReady": "Notre équipe d'assistance est prête à vous aider 24/7",
            "title": "Questions fréquemment posées"
        }
    },
    "findFreelancers": {
        "activeFilters": "Actif",
        "all": "All",
        "allLocations": "Tous les emplacements",
        "anyJobsAmount": "Tous les volumes de projets",
        "anyJobsAmountDesc": "Afficher tout le monde",
        "anySuccessRate": "Tous les taux de réussite",
        "anySuccessRateDesc": "Afficher tous les freelances",
        "availableNow": "Disponible maintenant",
        "availableNowDesc": "Disponible pour commencer immédiatement",
        "category": "Catégorie",
        "clearAll": "Tout effacer",
        "clearFilters": "Effacer tous les filtres",
        "filterTitle": "Filtrer la recherche",
        "filterToggle": "Filtrer les résultats",
        "hero": {
            "badge": "Professionnels tunisiens vérifiés",
            "subtitle": "Plus de 2 500 développeurs, designers, traducteurs et consultants tunisiens — vérifiés, évalués, prêts.",
            "subtitleDesktop": "",
            "title": "Trouvez la bonne personne,",
            "titleHighlight": "pas n’importe qui."
        },
        "heroStats": {
            "fastReplies": "Note moyenne",
            "talentPool": "Profils vérifiés",
            "verified": "Identité contrôlée"
        },
        "hourlyRate": "Taux horaire (TND)",
        "jobSuccessRate": "Taux de réussite des projets",
        "jobs10plus": "10+ projets terminés",
        "jobs10plusDesc": "Statut de freelance chevronné",
        "jobs1plus": "1+ projet terminé",
        "jobs1plusDesc": "A de l'expérience sur la plateforme",
        "jobs5plus": "5+ projets terminés",
        "jobs5plusDesc": "Historique de projets établi",
        "jobsCompleted": "Projets terminés",
        "location": "Emplacement",
        "max": "Max",
        "min": "Min",
        "nLocations": "{{count}} emplacements",
        "noMatchesFound": "Aucune correspondance trouvée",
        "noResults": {
            "action": "Effacer tous les filtres",
            "description": "Nous n’avons pas trouvé de freelances correspondant à vos critères. Essayez d’autres mots-clés ou effacez les filtres.",
            "title": "Aucun résultat correspondant"
        },
        "noSkillsFound": "Aucune compétence trouvée",
        "rate80up": "80% et plus",
        "rate80upDesc": "Excellente régularité",
        "rate90up": "90% et plus",
        "rate90upDesc": "Professionnels très bien notés",
        "rateAny": "Tous",
        "rating": "Min Rating",
        "resultStats": {
            "availableNow": "Disponibles maintenant",
            "averageRate": "Tarif moyen",
            "topRating": "Mieux notés"
        },
        "resultsCount": "Affichage de {{count}} résultats",
        "searchLocations": "Rechercher des emplacements...",
        "searchPlaceholder": "Rechercher des freelances...",
        "searchSkills": "Rechercher des compétences...",
        "skills": "Compétences",
        "sort": {
            "label": "Trier par :",
            "priceLow": "Prix le plus bas",
            "rating": "Mieux notés",
            "recommended": "Recommandé"
        },
        "status": "Status",
        "to": "à",
        "toasts": {
            "removedFromSaved": "Removed from saved freelancers",
            "savedFreelancer": "Saved freelancer",
            "updateSavedFailed": "Could not update saved freelancers"
        },
        "verifiedOnly": "Identité vérifiée uniquement",
        "verifiedOnlyDesc": "Mieux notés (4.5+)"
    },
    "footer": {
        "about": "À propos",
        "city": "Tunis, Tunisie",
        "contact": "Contact",
        "copyright": "(c) 2026 WorkedIn.tn - Tous droits réservés",
        "description": "Pensé pour les professionnels tunisiens, avec identité vérifiée, paiements protégés par escrow et projets payés en TND.",
        "faq": "FAQ",
        "legal": "Légal",
        "madeInTunisia": "Conçu en Tunisie.",
        "newsletterAction": "S’abonner",
        "newsletterDescription": "Recevez les notes produit, les nouveautés de lancement et les évolutions importantes sur la confiance et les paiements de WorkedIn.",
        "newsletterPlaceholder": "Votre adresse e-mail",
        "newsletterTitle": "Nouveautés produit",
        "privacy": "Confidentialité",
        "quickLinks": "Liens rapides",
        "socialFacebook": "Facebook",
        "socialInstagram": "Instagram",
        "socialLinkedin": "LinkedIn",
        "socialTwitter": "Twitter",
        "subscribed": "You're subscribed!",
        "terms": "Conditions"
    },
    "forClients": {
        "benefits": {
            "local": {
                "desc": "Travaillez avec des personnes qui comprennent le marché local.",
                "title": "Professionnels tunisiens"
            },
            "secure": {
                "desc": "Fonds en escrow. Libérés à votre validation.",
                "title": "Payez quand vous êtes satisfait"
            },
            "speed": {
                "desc": "Publiez et recevez des propositions vérifiées le jour même.",
                "title": "Recrutez en 24h"
            }
        },
        "categories": {
            "items": {
                "admin": "Vidéo et Animation",
                "data": "Éducation",
                "design": "Design et Création",
                "dev": "Développement",
                "finance": "Ingénierie",
                "marketing": "Vente et Marketing",
                "video": "Support",
                "writing": "Rédaction et Traduction"
            },
            "title": "Toutes les compétences. Une plateforme."
        },
        "cta": {
            "button": "Créer un compte client gratuit",
            "text": "2 500+ professionnels vérifiés prêts à travailler. Publiez gratuitement — sans abonnement, sans engagement.",
            "title": "Votre prochain projet commence ici."
        },
        "hero": {
            "badge": "Recrutez des talents tunisiens vérifiés",
            "cta": "Publier un projet — c'est gratuit",
            "secondary": "Voir comment ça marche",
            "subtitle": "Publiez gratuitement. Recevez des propositions de professionnels vérifiés. Payez uniquement à votre validation — chaque paiement protégé par escrow.",
            "title": "Votre projet, livré.",
            "titleHighlight": "Dans les délais. Dans le budget."
        },
        "talent": {
            "title": "Avec qui vous allez travailler"
        }
    },
    "globalSearch": {
        "clearSearch": "Effacer la recherche",
        "freelancers": "Freelances",
        "jobs": "Missions",
        "noResultsFor": "Aucun résultat pour \"{{query}}\"",
        "placeholder": "Rechercher des missions, freelances, compétences...",
        "recent": "Recherches récentes",
        "searching": "Recherche en cours...",
        "suggestions": "Suggestions",
        "toNavigate": "pour naviguer",
        "toSelect": "pour sélectionner"
    },
    "hero": {
        "activity": {
            "eyebrow": "Activité en temps réel",
            "metrics": {
                "activeProjects": "Projets actifs",
                "avgProjectValue": "Valeur moyenne des projets",
                "projectsCompleted": "Projets terminés",
                "verifiedFreelancers": "Freelances vérifiés"
            },
            "tag": "Désormais disponible en Tunisie",
            "title": "Vrai travail. Vrais paiements."
        },
        "badge": "Conçu en Tunisie. Pour la Tunisie.",
        "ctaClient": "Publiez un projet gratuitement",
        "ctaFreelancer": "Commencez à gagner",
        "headlineHighlight": "Est payé justement",
        "headlineStart": "Là où le talent tunisien",
        "rating": "4.9/5 — noté par des freelances et clients vérifiés",
        "socialProof": "2 500+ professionnels travaillent déjà sur WorkedIn",
        "stats": {
            "escrow": "TND en escrow",
            "professionals": "Professionnels actifs",
            "projects": "Projets complétés"
        },
        "subtitle": "Sans enchères. Sans intermédiaires. Publiez un projet, convenez des termes, soyez payé en TND — sécurisé par escrow.",
        "title": "Là où le talent tunisien est payé justement",
        "trust": {
            "secure": "Paiements protégés par escrow",
            "secureBody": "Les fonds sont sécurisés et libérés uniquement à la validation.",
            "users": "Utilisateurs",
            "verified": "Professionnels vérifiés",
            "verifiedBody": "Chaque freelance est vérifié avant d'accepter son premier projet."
        }
    },
    "heroSection": {
        "auth": {
            "dashboard": "Accéder au tableau de bord",
            "welcomeBack": "Bon retour, {{name}} 👋"
        },
        "client": {
            "cta": "Engager un Expert",
            "eyebrow": "Construit en Tunisie. Prêt pour l'embauche sérieuse.",
            "features": {
                "manage": {
                    "subtitle": "Les paiements restent protégés jusqu'à l'approbation",
                    "title": "Gérez les jalons avec séquestre"
                },
                "post": {
                    "subtitle": "Pas de guerres d'enchères bruyantes, juste des réponses de qualité",
                    "title": "Publiez une fois et recevez des propositions pertinentes"
                },
                "review": {
                    "subtitle": "Les signaux de confiance apparaissent avant le premier message",
                    "title": "Examinez les profils locaux vérifiés"
                }
            },
            "panelTitle": "Pourquoi WorkedIn",
            "promise": "Une meilleure présentation aide les clients sérieux à faire confiance à la plateforme avant de publier un projet.",
            "secondary": "Voir les Top Talents",
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
                    "label": "Score de confiance moyen",
                    "value": "4.9/5"
                }
            },
            "subtitle": "Publiez votre projet, évitez les risques et embauchez exclusivement des talents vérifiés.",
            "titleAccent": "Collaborez avec l'élite.",
            "titleTop": "Ignorez les amateurs.",
            "trust": {
                "escrow": "Séquestre protégé",
                "faster": "Embauche plus rapide",
                "verified": "Profils vérifiés"
            }
        },
        "freelancer": {
            "cta": "Commencez à gagner aujourd'hui",
            "eyebrow": "Construit en Tunisie. Construit pour la Tunisie.",
            "features": {
                "apply": {
                    "subtitle": "Des emplois qui correspondent à votre niveau de compétence et votre tarif",
                    "title": "Postulez pour des projets adaptés"
                },
                "track": {
                    "subtitle": "Tout au même endroit, sécurisé par séquestre",
                    "title": "Suivre les jalons et les paiements"
                },
                "verify": {
                    "subtitle": "Établir la confiance avant de dire un mot",
                    "title": "Afficher l'état de vérification"
                }
            },
            "panelTitle": "Comment ça marche",
            "promise": "Une meilleure présentation aide les excellents indépendants à paraître crédibles avant de dire un mot.",
            "secondary": "Parcourir les projets",
            "stats": {
                "contracts": {
                    "default": "120",
                    "label": "Contrats réalisés"
                },
                "professionals": {
                    "default": "2,500",
                    "label": "Professionnels"
                },
                "rating": {
                    "label": "Moyenne des évaluations",
                    "value": "4.9/5"
                }
            },
            "subtitle": "Sans enchères. Sans intermédiaires. Publiez un projet, entendez-vous sur les conditions, soyez payé en dinars tunisiens - sécurisé par séquestre.",
            "titleAccent": "sont rémunérés équitablement.",
            "titleTop": "Où les talents tunisiens",
            "trust": {
                "matched": "Travail adapté",
                "payouts": "Paiements protégés",
                "reputation": "Construire une réputation"
            }
        },
        "liveBadge": "En direct",
        "promise": {
            "label": "Promesse WorkedIn"
        },
        "typewriter": {
            "client": {
                "qualityCollaboration": "Collaboration de qualité.",
                "securePayments": "Paiements sécurisés.",
                "trustedConnections": "Connexions de confiance."
            },
            "freelancer": {
                "buildYourCareer": "Construisez votre carrière.",
                "getPaidOnTime": "Soyez payé à temps.",
                "workWithBest": "Travaillez avec les meilleurs."
            }
        }
    },
    "home": {
        "sections": {
            "categories": {
                "badge": "Catégories",
                "subtitle": "Découvrez les compétences les plus demandées sur le marché tunisien."
            },
            "cta": {
                "badge": "Commencer maintenant",
                "btnStart": "Créer un compte",
                "btnWatch": "Voir comment ça marche",
                "subtitle": "Freelance ou client, WorkedIn vous offre un parcours plus clair du premier brief au paiement final.",
                "title": "Commencez en Tunisie. Travaillez avec confiance."
            },
            "howItWorks": {
                "badge": "Comment ça marche",
                "clientDesc": "Trouvez le bon professionnel sans friction",
                "freelancerDesc": "Construisez votre présence et commencez à gagner",
                "subtitle": "Quatre étapes claires entre l’idée, l’exécution et le paiement."
            },
            "testimonials": {
                "badge": "Histoires de réussite",
                "earned": "Gagné"
            }
        },
        "stats": {
            "activeJobs": "Missions actives",
            "live": "Statistiques en direct",
            "rating": "Évaluation",
            "users": "Utilisateurs"
        }
    },
    "howItWorks": {
        "brandName": "WorkedIn",
        "clientSteps": {
            "step1": {
                "description": "Décrivez le travail, fixez votre budget, choisissez un tarif fixe ou horaire.",
                "title": "Publiez en 2 minutes"
            },
            "step2": {
                "description": "Chaque freelance est vérifié. Filtrez par note, compétence et prix.",
                "title": "Analyze des propositions vérifiées"
            },
            "step3": {
                "description": "Livrables clairs, délais précis et progression visible — dans un seul espace.",
                "title": "Suivez des étapes, pas des promesses"
            },
            "step4": {
                "description": "Validez le travail, libérez les fonds de l'escrow et notez l'expérience.",
                "title": "Libérez le paiement, laissez un avis"
            }
        },
        "cta": {
            "client": "Publier un projet gratuitement",
            "freelancer": "Commencez à gagner"
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
                    "a": "Oui, l'inscription est gratuite pour les freelances comme pour les clients. Une petite commission s'applique seulement aux projets réalisés.",
                    "q": "L'inscription est-elle gratuite ?"
                },
                "item2": {
                    "a": "WorkedIn agit comme tiers de confiance. Les fonds restent sécurisés jusqu'à la validation du travail.",
                    "q": "Comment mon argent est-il protégé ?"
                },
                "item3": {
                    "a": "Nous prenons en charge les cartes, D17, le virement bancaire et d'autres méthodes adaptées au marché tunisien.",
                    "q": "Quels moyens de paiement sont disponibles ?"
                },
                "item4": {
                    "a": "Oui, vous pouvez créer un compte entreprise pour recruter ou proposer vos services en équipe.",
                    "q": "Puis-je m'inscrire en tant qu'entreprise ?"
                }
            },
            "title": "Questions fréquentes"
        },
        "freelancerSteps": {
            "step1": {
                "description": "Ajoutez vos compétences, votre portfolio et votre tarif. Les clients vous trouvent — sans enchères.",
                "title": "Créez votre profil une seule fois"
            },
            "step2": {
                "description": "Notre système vous met en avant auprès des clients qui recherchent précisément vos compétences.",
                "title": "Recevez de vrais projets"
            },
            "step3": {
                "description": "Discutez, négociez et verrouillez le périmètre avant que l'argent ne bouge.",
                "title": "Validez les termes, puis commencez"
            },
            "step4": {
                "description": "Les fonds sont en escrow dès le premier jour. Validez l'étape — recevez vos TND.",
                "title": "Soyez payé à validation"
            }
        },
        "heroTitle": "Simple par conception.",
        "heroTitleHighlight": "Sécurisé par défaut.",
        "subtitle": "Quatre étapes de l'idée au paiement — chaque étape protégée, chaque dinar comptabilisé.",
        "tabs": {
            "client": "Pour les clients",
            "freelancer": "Pour les freelances"
        },
        "title": "Comment WorkedIn fonctionne",
        "trust": {
            "money": {
                "desc": "Si le travail ne respecte pas les termes convenus, vous récupérez vos TND.",
                "title": "Remboursement total si non satisfait"
            },
            "support": {
                "desc": "De vraies personnes, fuseau local, trois langues.",
                "title": "Support en arabe, français et anglais"
            },
            "verified": {
                "desc": "Nous vérifions l'identité nationale avant toute mise en ligne sur WorkedIn.",
                "title": "Chaque professionnel est vérifié"
            }
        }
    },
    "howItWorksSection": {
        "badge": "Comment ça marche",
        "heading": "De l'inscription au paiement en 4 étapes.",
        "steps": {
            "1": {
                "step": "01",
                "subtitle": "Définissez vos compétences, votre tarif et votre portefeuille en quelques minutes.",
                "title": "Créez votre profil"
            },
            "2": {
                "step": "02",
                "subtitle": "Parcourez les projets qui correspondent à votre expertise.",
                "title": "Postulez pour des emplois adaptés"
            },
            "3": {
                "step": "03",
                "subtitle": "Négociez directement. Aucun intermédiaire.",
                "title": "Entendez-vous sur les conditions"
            },
            "4": {
                "step": "04",
                "subtitle": "Fonds libérés via séquestre à l'approbation.",
                "title": "Soyez payé de manière sécurisée"
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
        "bankTransfer": "Virement bancaire",
        "budget": "Budget",
        "budgetHelp": "Entrez votre budget total",
        "cash": "Espèces à la livraison",
        "d17": "D17",
        "deadline": "Date de livraison",
        "description": "Description de la mission",
        "descriptionPlaceholder": "Décrivez la mission en détail...",
        "estimatedTime": "Dans 1 heure",
        "matchesFound": "3 freelances trouvés!",
        "matching": "Recherche de freelances...",
        "paymentMethod": "Méthode de paiement",
        "postJob": "Publier la mission",
        "preview": "Aperçu",
        "requiredSkills": "Compétences requises",
        "saveDraft": "Enregistrer le brouillon",
        "title": "Titre de la mission",
        "titlePlaceholder": "Ex: Créer un logo pour un restaurant",
        "within1Day": "Dans 1 jour",
        "within1Week": "Dans 1 semaine",
        "within3Days": "Dans 3 jours"
    },
    "jobDetail": {
        "aboutClient": "À propos du client",
        "approxHours": {
            "replace": "Replace"
        },
        "attachmentLabel": "Pièce jointe {{index}}",
        "attachments": "Pièces jointes",
        "avgHourlyPaid": "Taux horaire moyen payé",
        "avgHourlyPaidFormat": "{{rate}} TND/h",
        "balance": "Utilisées aujourd'hui",
        "browseJobs": "Parcourir les travaux",
        "budget": "Budget",
        "cannotApplyTitle": "Impossible de postuler pour le moment",
        "category": {
            "data": "Données",
            "design": "Design",
            "development": "Développement",
            "marketing": "Marketing",
            "other": "Autre",
            "translation": "Traduction",
            "video": "Vidéo",
            "writing": "Rédaction"
        },
        "clientCantApplyTitle": "Les comptes clients ne peuvent pas postuler",
        "clientRatingText": "{{rating}} sur 5 avis",
        "clientVerifications": "Vérifications",
        "completeNow": "Compléter maintenant",
        "completeOnboardingTitle": "Complétez d'abord votre inscription",
        "completeProfileTitle": "Complétez votre profil",
        "confirmWithdrawal": "Confirmer le retrait",
        "dailyApplyAvailable": "Disponible aujourd'hui",
        "dailyApplyLimitDescription": "Pour réduire le spam, vous pouvez envoyer jusqu'à {{limit}} propositions par jour.",
        "dailyApplyLimitReached": "Vous avez atteint la limite quotidienne de {{limit}} candidatures. Réessayez demain.",
        "dailyApplyLimitTitle": "Limite quotidienne de candidatures",
        "dailyApplyReached": "Limite atteinte",
        "dailyApplyRemainingHint": "Il vous reste {{remaining}} candidatures aujourd'hui.",
        "dailyApplyResetHint": "Limite quotidienne atteinte. Vous pourrez candidater à nouveau demain.",
        "deadline": "Deadline",
        "defaultCity": "Tunis",
        "defaultClient": "Client",
        "defaultMemberSince": "Mar 2026",
        "defaultTotalSpent": "15k+ TND",
        "description": "Description du travail",
        "emailAddressVerified": "Adresse e-mail vérifiée",
        "error": "Une erreur s'est produite",
        "experience": {
            "beginner": "Débutant",
            "expert": "Expert",
            "intermediate": "Intermédiaire"
        },
        "file": "Fichier {{index}}",
        "fileType": "FICHIER",
        "fixedPrice": "Prix fixe",
        "hireRate": "Taux d'embauche",
        "hourly": "Par heure",
        "inlineRechargingHint": "Recharge dans",
        "inlineRemainingHint": "{{remaining}} candidatures disponibles",
        "insufficientBalance": "Limite quotidienne atteinte",
        "jobNotFound": "Travail non trouvé",
        "jobRemoved": "Travail retiré des favoris",
        "jobSaved": "Travail enregistré",
        "jobStats": "Statistiques du travail",
        "limit": "Limite",
        "linkCopied": "Lien copié",
        "loginRequiredTitle": "Connectez-vous pour postuler",
        "loginToSave": "Connectez-vous pour enregistrer",
        "manageJob": "Gérer la mission",
        "memberSince": "Membre depuis",
        "openFile": "Ouvrir le fichier",
        "paymentMethodVerified": "Moyen de paiement vérifié",
        "perHour": "/heure",
        "phoneNumberVerified": "Numéro de téléphone vérifié",
        "postedJobs": "Travaux publiés",
        "postedLabel": "Publié",
        "proposalAccepted": "Votre proposition a été acceptée",
        "proposalAcceptedStatus": "Acceptée",
        "proposalDeclined": "Votre proposition a été déclinée",
        "proposalDeclinedStatus": "Déclinée",
        "proposalError": "Erreur lors de l'envoi de la proposition",
        "proposalPendingStatus": "En attente",
        "proposalSent": "Proposition envoyée avec succès!",
        "proposalSubmitted": "Votre proposition a été envoyée",
        "proposalWithdrawn": "Proposition retirée avec succès",
        "proposalWithdrawnStatus": "Retirée",
        "proposalWithdrawnTitle": "Votre proposition a été retirée",
        "proposals": "Propositions",
        "rating": "Note",
        "readyToSubmit": "Prêt à soumettre",
        "referenceLinks": "Liens de référence",
        "remaining": "Restant",
        "removeFromSaves": "Retirer des favoris",
        "reportJob": "Signaler ce travail",
        "reportJobDescription": "Dites-nous pourquoi ce projet enfreint nos règles communautaires.",
        "reportJobTitle": "Signaler le projet",
        "reportReason": {
            "fraud": "Fraude",
            "inappropriate": "Inapproprié",
            "misleading": "Trompeur",
            "other": "Autre",
            "spam": "Spam"
        },
        "required": "Limite quotidienne",
        "requiredSkills": "Compétences requises",
        "saveJob": "Enregistrer ce projet",
        "shareJob": "Partager ce projet",
        "signIn": "Se connecter",
        "similarJobs": "Missions similaires",
        "submissionRequirements": "Exigences de soumission",
        "submitProposal": "Envoyer une proposition",
        "submitReport": "Soumettre le signalement",
        "switchToFreelancer": "Passer en mode Freelance",
        "timeAgo": {
            "day": "Il y a {{count}} jour",
            "hour": "Il y a {{count}} heure",
            "minute": "Il y a {{count}} minute",
            "month": "Il y a {{count}} mois",
            "week": "Il y a {{count}} semaine"
        },
        "totalSpending": "Total dépensé",
        "used": "Utilisées",
        "viewProfile": "Voir le profil",
        "viewProposal": "Voir la proposition",
        "views": "Vues",
        "withdrawConfirmDesc": "Êtes-vous sûr de vouloir retirer cette proposition ? Cette action est irréversible.",
        "withdrawError": "Erreur lors du retrait",
        "withdrawProposal": "Retirer la proposition",
        "yesWithdraw": "Oui, retirer",
        "yourBid": "Votre offre:",
        "yourJob": "C'est votre mission"
    },
    "jobMatches": {
        "contractCreated": "Contrat créé avec succès!",
        "contractError": "Erreur lors de la création du contrat",
        "searchError": "Erreur lors de la recherche de correspondances"
    },
    "jobProposals": {
        "addedToShortlist": "Ajouté à la liste des favoris",
        "aiDesc": "Nous avons analysé vos exigences et trouvé 3 freelances correspondant à votre projet à 95%.",
        "aiTitle": "Recommandations IA",
        "allProposals": "Toutes les propositions",
        "archiveError": "Échec de l'archivage",
        "archived": "Archivé",
        "clearFilters": "Effacer les filtres",
        "days": "jours",
        "defaultCountry": "Tunisie",
        "defaultFreelancer": "Freelance",
        "defaultUser": "Utilisateur",
        "deliveryTbd": "Non défini",
        "durationOngoing": "Ongoing",
        "edit": "Modifier",
        "expectedDuration": "Durée prévue",
        "extraFilters": "Autres filtres",
        "filterAndShow": "Filtrer et afficher",
        "filterTitle": "Filtrer les propositions",
        "freelancerLevel": "Niveau du freelance",
        "hasPortfolio": "A un portfolio",
        "highRated": "4 étoiles et plus",
        "hire": "Recruter",
        "hireDisabled": "Cannot hire declined proposal",
        "hireError": "Échec de l'embauche. Veuillez réessayer",
        "hireFirst": "Vous devez d'abord embaucher le freelance pour démarrer la conversation",
        "hireSuccess": "Freelance embauché avec succès! 🎉",
        "interviews": "Entretiens",
        "jobDetails": "Détails de la mission",
        "jobsDone": "missions terminées",
        "loadJobError": "Échec du chargement des données du travail",
        "loadProposalsError": "Échec du chargement des propositions",
        "loading": "Chargement...",
        "message": "Chat",
        "modal": {
            "about": "À propos",
            "accepted": "Accepté",
            "archive": "Archiver l'offre",
            "attachments": "Pièces jointes",
            "available": "Disponible",
            "busy": "Occupé",
            "confirmHire": "Embaucher ce freelancer ?",
            "confirmHireDesc": "Un contrat sera créé et le paiement mis en séquestre.",
            "confirmYes": "Oui, Embaucher !",
            "coverLetter": "Lettre de motivation",
            "delivery": "Livraison",
            "escrowNote": "Le paiement est conservé en séquestre jusqu'à votre validation.",
            "freelancer": "Freelancer",
            "freelancerBid": "Offre du freelancer",
            "jobsDone": "Missions effectuées",
            "noPortfolio": "Aucun élément de portfolio",
            "noPortfolioHint": "Le freelancer n'a pas encore ajouté de portfolio.",
            "noProfile": "Aucune information de profil disponible.",
            "noReviews": "Aucun avis pour l'instant",
            "noReviewsHint": "Les avis apparaissent après des contrats terminés.",
            "proposalDetails": "Détails de l'offre",
            "rating": "Note",
            "reject": "Decline",
            "rejected": "Non sélectionné",
            "responseTime": "Temps de réponse",
            "responseTimeValue": "~1 heure",
            "reviews": "Avis",
            "serviceFee": "Frais de service (5%)",
            "submittedOn": "Envoyé le",
            "successRate": "Taux de succès",
            "tabPortfolio": "Portfolio",
            "tabProfile": "Profil",
            "tabProposal": "Offre",
            "tabReviews": "Avis",
            "total": "Total à payer",
            "unarchive": "Restaurer l'offre"
        },
        "new": "Nouveau",
        "noCoverLetter": "Aucune lettre de motivation fournie.",
        "noProposals": "Pas encore de propositions",
        "noProposalsDesc": "Vous n'avez pas encore reçu de propositions pour ce travail. Essayez de partager pour augmenter la visibilité.",
        "open": "Ouvert",
        "proposalAccepted": "Votre proposition a été acceptée!",
        "proposalArchived": "Proposition archivée",
        "proposalBid": "Montant de l'offre",
        "proposalUnarchived": "Proposition restaurée",
        "proposals": "Propositions",
        "readMore": "Lire la suite",
        "receivedOn": "Reçu le",
        "removedFromShortlist": "Retiré de la liste des favoris",
        "save": "Sauvegarder",
        "saved": "Sauvegardé",
        "searchPlaceholder": "Rechercher des propositions...",
        "share": "Partager",
        "shareProject": "Partager le travail",
        "shortlist": "Liste restreinte",
        "shortlistError": "Erreur lors de la mise à jour de la liste",
        "shortlisted": "Sélectionné",
        "showLess": "Réduire",
        "sort": {
            "highestBid": "Offre la plus haute",
            "label": "Sort proposals",
            "lowestBid": "Offre la plus basse",
            "newest": "Plus récent",
            "rating": "Mieux noté",
            "recommended": "Meilleure correspondance"
        },
        "sortBy": "Trier par",
        "successRate": "taux de succès",
        "topRated": "Top Noté",
        "unarchive": "Restaurer",
        "unarchiveError": "Échec de la restauration",
        "verified": "Vérifié",
        "verifiedOnly": "Compte vérifié uniquement",
        "viewJob": "Voir la mission",
        "viewSuggestions": "Voir les suggestions"
    },
    "jobs": {
        "apply": "Postuler",
        "budget": "Budget",
        "empty": {
            "action": "Effacer les filtres",
            "subtitle": "Essayez de changer vos critères de recherche",
            "title": "Aucune mission trouvée"
        },
        "filters": {
            "budget": {
                "all": "Tout",
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
                "business": "Affaires",
                "data": "Saisie de données",
                "design": "Design",
                "development": "Développement",
                "marketing": "Marketing",
                "other": "Autre",
                "title": "Catégorie",
                "translation": "Traduction",
                "video": "Vidéo & Animation",
                "writing": "Rédaction"
            },
            "clearAll": "Tout effacer",
            "clearAria": "Clear all filters",
            "closeAria": "Close filters",
            "experience": {
                "entry": "Débutant",
                "expert": "Expert",
                "intermediate": "Intermédiaire",
                "title": "Niveau d'expérience"
            },
            "jobType": {
                "fixed_price": "Prix fixe",
                "hourly": "Horaire",
                "title": "Type de contrat"
            },
            "postedDate": {
                "any": "Tout le temps",
                "d3": "3 derniers jours",
                "h24": "Dernières 24h",
                "m1": "Dernier mois",
                "title": "Date de publication",
                "w1": "Dernière semaine"
            },
            "title": "Filtres",
            "viewResults": "Voir les résultats"
        },
        "hourlyRate": "Taux horaire",
        "loadError": "Échec du chargement des missions",
        "loadMore": "Charger plus",
        "location": {
            "remote": "Télétravail"
        },
        "new": {
            "actions": {
                "next": "Suivant",
                "previous": "Précédent",
                "publishJob": "Publier la mission",
                "saveDraft": "Enregistrer en brouillon"
            },
            "autosave": {
                "lastSaved": "Dernière sauvegarde : {{time}}",
                "notSaved": "Pas encore enregistré",
                "ready": "Sauvegarde auto prête",
                "saved": "Enregistré",
                "savedAt": "Enregistré à {{time}}",
                "saving": "Enregistrement..."
            },
            "currentPhase": "Phase en cours",
            "errors": {
                "attachmentsPartial": "Attachments Partial",
                "attachmentsUnavailable": "Les pièces jointes ne peuvent pas être envoyées pour le moment. La mission sera publiée sans elles.",
                "attachmentsUploadFailed": "Attachments upload failed. Please retry with smaller or different files.",
                "dbError": "Db Error",
                "loginRequired": "Vous devez être connecté pour publier une mission",
                "saveFailed": "Une erreur est survenue lors de l'enregistrement de la mission",
                "stepIncomplete": "Veuillez compléter les champs requis avant de continuer.",
                "titleRequiredForDraft": "Veuillez saisir un titre de mission pour enregistrer le brouillon"
            },
            "expertTips": {
                "budgetModelLabel": "Modèle de budget :",
                "budgetModelText": "Choisissez le prix fixe pour des résultats bien définis, et le tarif horaire pour des briefs évolutifs.",
                "deadlineBufferLabel": "Marge de délai :",
                "deadlineBufferText": "Fixer une date réaliste encourage des candidatures de haute qualité.",
                "inviteOnlyLabel": "Sur invitation :",
                "inviteOnlyText": "Idéal pour les projets confidentiels ou quand vous sélectionnez personnellement les meilleurs freelances.",
                "lockStructureLabel": "Verrouiller la structure :",
                "lockStructureText": "Vérifiez toutes les spécifications. La structure de base est définitive à la publication pour assurer la cohérence des offres.",
                "publicBriefsLabel": "Briefs publics :",
                "publicBriefsText": "Idéal pour obtenir un maximum de propositions et une concurrence tarifaire.",
                "richContextLabel": "Contexte riche :",
                "richContextText": "Fournissez des paramètres clairs sur la portée, les livrables finaux et les critères de succès.",
                "specificTitleLabel": "Titre précis :",
                "specificTitleText": "Décrivez exactement ce dont vous avez besoin. Un titre clair attire immédiatement les bons spécialistes."
            },
            "expertTipsTitle": "Conseils d'experts",
            "fields": {
                "attachments": "Pièces jointes (optionnel)",
                "attachmentsDrop": "Glissez les fichiers ici ou cliquez pour parcourir",
                "attachmentsHint": "PDF, DOC, DOCX, TXT, PNG, JPG, WEBP - 10MB max par fichier",
                "attachmentsHint2": "Fournissez des assets, maquettes ou spécifications détaillées pour clarifier les livrables.",
                "categoryHint": "Choisissez la catégorie la plus appropriée pour activer des alertes automatiques de correspondance.",
                "charCount": "{{current}} / {{max}} caractères",
                "chooseFiles": "Choisir des fichiers",
                "description": "Description du projet",
                "descriptionHint": "Expliquez la portée, les paramètres attendus et à quoi ressemblent des livrables réussis.",
                "descriptionPlaceholder": "Fournissez un contexte détaillé, le public cible, les spécifications techniques et les livrables clés...",
                "mainCategory": "Catégorie principale",
                "requiredSkills": "Compétences requises (max 5)",
                "selectCategory": "Choisir la catégorie",
                "selectSubcategory": "Choisir la sous-catégorie",
                "skillsHint": "Identifiez les compétences précises pour cibler des freelances spécialisés et les inviter directement.",
                "skillsPlaceholder": "Essayez : Design graphique, React, Motion design...",
                "subcategory": "Sous-catégorie",
                "subcategoryHint": "Sélectionnez la spécialité exacte pour filtrer les offres et assurer une correspondance précise.",
                "suggested": "Suggestions :",
                "title": "Titre du projet",
                "titleHint": "Utilisez des termes techniques précis pour aider les bons freelances à vous trouver.",
                "titlePlaceholder": "Exemple : Système d'identité visuelle bilingue pour un café tunisien"
            },
            "heroDescription": "Avancez par phases ciblées : définissez le besoin, fixez budget et délai, choisissez la visibilité, puis relisez avant publication.",
            "heroTitle": "Publiez un projet avec clarté et attirez des freelances mieux adaptés.",
            "links": {
                "add": "Ajouter un lien",
                "description": "Ajoutez des liens Google Drive, de portfolio ou de réseaux sociaux pour que les freelances puissent rapidement consulter le contexte.",
                "duplicate": "Ce lien a déjà été ajouté.",
                "invalid": "Veuillez saisir une URL valide.",
                "maxLinksReached": "Vous pouvez ajouter jusqu'à {{count}} liens.",
                "placeholder": "Collez un lien (ex. drive.google.com/... ou linkedin.com/in/...)",
                "remove": "Supprimer le lien",
                "title": "Liens de référence (optionnel)"
            },
            "progress": "Progression",
            "quality": {
                "categorySelected": "Catégorie sélectionnée",
                "clearTitle": "Titre clair",
                "relevantSkills": "Compétences pertinentes",
                "strongDescription": "Description solide",
                "title": "Score de qualité"
            },
            "restoreDraft": {
                "description": "Nous avons trouvé un brouillon enregistré datant de {{time}}. Voulez-vous le restaurer et continuer ?",
                "jobTitle": "Titre",
                "restore": "Restaurer le brouillon",
                "startFresh": "Recommencer",
                "title": "Restaurer le brouillon",
                "untitled": "(Sans titre)"
            },
            "seo": {
                "description": "Créez un nouveau projet, définissez le budget et la durée, puis publiez-le pour recevoir des propositions de freelances.",
                "title": "Publier un projet"
            },
            "snippetDeliverables": "Livrables",
            "snippetDeliverablesText": "Livrables : Fichiers sources, build prêt pour le déploiement et documentation concise.",
            "snippetScope": "Portée",
            "snippetScopeText": "Portée : Créer une expérience responsive alignée avec nos directives de marque.",
            "snippetSuccess": "Succès",
            "snippetSuccessText": "Critères de succès : Interface parfaite, performances élevées et livraison propre.",
            "step1": {
                "subtitle": "Commencez par un titre clair et un contexte solide."
            },
            "stepBasics": {
                "attachmentLabel": "Attachment Label",
                "attachments": "Pièces jointes (optionnel)",
                "attachmentsDescription": "PDF, DOC, DOCX, TXT - 10MB max par fichier",
                "badge": "Brief du projet",
                "categoryDesign": "Design et créativité",
                "categoryDevelopment": "Développement",
                "categoryMarketing": "Marketing et ventes",
                "categoryWriting": "Rédaction et traduction",
                "characterCount": "{{current}} / {{max}} caractères",
                "currentAttachments": "Current attachments",
                "mainCategory": "Catégorie principale",
                "projectDescription": "Description du projet",
                "projectDescriptionPlaceholder": "Décrivez les détails du projet, les livrables attendus et toute exigence spécifique...",
                "projectTitle": "Titre du projet",
                "projectTitlePlaceholder": "Exemple : Conception de logo pour une entreprise agroalimentaire",
                "removeExistingAttachment": "Remove attachment",
                "requiredSkills": "Compétences requises (max 5)",
                "selectCategory": "Choisir la catégorie",
                "selectSubcategory": "Choisir la sous-catégorie",
                "subcategory": "Sous-catégorie",
                "subtitle": "Commencez par un titre clair et une description précise pour attirer les meilleurs freelances.",
                "tip1": "Soyez précis dans la description du besoin",
                "tip2": "Définissez clairement les livrables finaux",
                "tip3": "Ajoutez des liens vers des projets similaires si possible",
                "tip4": "Précisez ce qui doit être livré et à quel moment vous attendez la fin",
                "title": "Détails de la mission"
            },
            "stepBudget": {
                "badge": "Configuration du tarif",
                "beginner": "Niveau débutant",
                "beginnerSubtitle": "Tâches simples ou options économiques",
                "budgetAmount": "Montant du budget",
                "deadline": "Date limite",
                "duration": "Durée du projet",
                "duration1To3Months": "1 à 3 mois",
                "duration3To6Months": "3 à 6 mois",
                "durationLessThan1Month": "Moins d'un mois",
                "durationMoreThan6Months": "Plus de 6 mois",
                "estimatedBudget": "Budget estimé du projet",
                "experienceLevel": "Niveau d'expérience requis",
                "experienceLevelHint": "Sélectionnez le niveau d'expertise requis pour garantir des candidatures pertinentes.",
                "expert": "Niveau expert",
                "expertSubtitle": "Spécialistes de haut niveau pour des besoins complexes",
                "fixedExact": "Prix fixe (exact)",
                "fixedExactDescription": "Définissez un budget précis pour l'ensemble du périmètre. Idéal pour les tâches bien définies.",
                "fixedExactHint": "Indiquez le prix fixe exact de ce projet.",
                "fixedExactSubtitle": "Budget fixe unique",
                "fixedPrice": "Prix fixe",
                "fixedPriceDescription": "Payez un montant fixe pour tout le projet une fois terminé.",
                "fixedRange": "Prix fixe (fourchette)",
                "fixedRangeDescription": "Définissez une fenêtre budgétaire pour attirer des propositions correspondant à votre enveloppe.",
                "fixedRangeHint": "Spécifiez une fourchette pour attirer les offres dans votre budget cible.",
                "fixedRangeSubtitle": "Fourchette min-max",
                "fullTime30": "Temps plein (jusqu'à 30 h/semaine)",
                "fullTime40": "Temps plein (jusqu'à 40 h/semaine)",
                "hourly": "Tarif horaire",
                "hourlyDescription": "Payez à l'heure selon les logs. Idéal pour un travail continu ou évolutif.",
                "hourlyHint": "Déterminez le taux horaire et la limite hebdomadaire d'heures.",
                "hourlyRate": "Taux horaire",
                "hourlyRateExample": "Exemple : 20",
                "hourlySetup": "Détails de la tarification horaire",
                "hourlySubtitle": "Facturation au temps passé",
                "intermediate": "Niveau intermédiaire",
                "intermediateSubtitle": "Expérience solide pour des objectifs standards",
                "max": "Budget maximum",
                "min": "Budget minimum",
                "partTime10": "Temps partiel (jusqu'à 10 h/semaine)",
                "partTime20": "Temps partiel (jusqu'à 20 h/semaine)",
                "pricingMode": "Modèle de tarification",
                "selectDuration": "Sélectionner la durée",
                "subtitle": "Choisissez le mode de paiement et définissez votre budget",
                "title": "Budget et durée",
                "weeklyHours": "Limite d'heures hebdomadaires",
                "weeklyHoursExample": "Exemple : 10-20"
            },
            "stepCounter": "Étape {{current}} sur {{total}}",
            "stepReview": {
                "attachmentLabel": "Attachment Label",
                "attachments": "Pièces jointes",
                "badge": "Vérification finale",
                "beginner": "Débutant",
                "budget": "Budget",
                "budgetRange": "Budget Range",
                "currentAttachments": "Current attachments",
                "deadline": "Date limite",
                "duration1To3Months": "1 - 3 mois",
                "duration3To6Months": "3 - 6 mois",
                "durationLessThan1Month": "Moins d'un mois",
                "durationMoreThan6Months": "Plus de 6 mois",
                "estimatedHours": "Estimated Hours",
                "experienceLevel": "Niveau requis",
                "expert": "Expert",
                "fileSize": "File Size",
                "hourlyBudget": "{{rate}} TND / heure",
                "intermediate": "Intermédiaire",
                "inviteOnlyVisibility": "Privé (sur invitation)",
                "linkLabel": "Link Label",
                "links": "Reference links",
                "now": "Maintenant",
                "privacyLevel": "Niveau de confidentialité",
                "projectDescription": "Description du projet",
                "projectDuration": "Durée du projet",
                "publicVisibility": "Public (tout le monde)",
                "requiredSkills": "Compétences requises",
                "subtitle": "Relisez le brief une dernière fois avant sa mise en ligne pour les freelances.",
                "title": "Revue et publication",
                "visibility": "Visibilité",
                "warning": "Veuillez vérifier attentivement les détails de la mission avant publication. Après publication, seules certaines informations pourront être modifiées.",
                "weeklyHoursBadge": "Weekly Schedule"
            },
            "stepVisibility": {
                "badge": "Contrôle de l'audience",
                "inviteOnlyDescription": "La mission ne sera pas visible dans la recherche. Seuls les freelances invités pourront proposer.",
                "inviteOnlyTitle": "Sur invitation",
                "publicDescription": "Tous les freelances peuvent voir la mission et proposer. Idéal pour recevoir plus de propositions.",
                "publicTitle": "Public",
                "subtitle": "Choisissez le niveau de confidentialité adapté à votre projet.",
                "tipDescription": "Si votre projet est sensible ou demande des compétences rares, le mode invitation offre plus de contrôle. Pour les projets généraux, la visibilité publique augmente la concurrence et les options de prix.",
                "tipTitle": "Conseil :",
                "title": "Qui peut voir votre mission ?"
            },
            "steps": {
                "basics": "Détails de la mission",
                "basicsDescription": "Définissez clairement le brief, la catégorie et les compétences requises.",
                "budget": "Budget et durée",
                "budgetDescription": "Définissez le modèle de tarification, la durée prévue et le niveau d'expérience.",
                "review": "Revue et publication",
                "reviewDescription": "Vérifiez le brief avant de le publier.",
                "visibility": "Visibilité",
                "visibilityDescription": "Choisissez si le brief est public ou réservé aux invitations."
            },
            "time": {
                "hoursAgo": "Il y a {{count}} h",
                "minutesAgo": "Il y a {{count}} min",
                "now": "À l'instant"
            },
            "tips": {
                "handoff": "Précisez ce qui doit être livré à la remise.",
                "references": "Ajoutez des liens, références ou exemples si disponibles.",
                "scope": "Soyez précis sur la portée et la qualité attendue.",
                "success": "Définissez clairement ce à quoi ressemble le succès."
            },
            "titleTemplateDash": "Tableau de bord React avec widgets d'analyse",
            "titleTemplateLanding": "Refonte de page d'accueil pour un produit SaaS",
            "titleTemplateLogo": "Conception de logo pour une entreprise agroalimentaire",
            "titleTemplateVideo": "Montage de vidéos courtes pour des publicités sociales",
            "toasts": {
                "draftRestored": "Brouillon restauré avec succès",
                "draftSaved": "Brouillon enregistré avec succès",
                "jobPosted": "Mission publiée avec succès !",
                "repostPrefilled": "Previous project loaded. Review and publish when ready."
            },
            "validation": {
                "budgetMax": "Le budget maximum doit être au moins de 1",
                "budgetMin": "Le budget minimum doit être au moins de 1",
                "budgetRange": "Le budget maximum doit être supérieur ou égal au budget minimum",
                "budgetRequired": "Veuillez définir un budget",
                "categoryRequired": "Veuillez sélectionner une catégorie",
                "deadlineFuture": "La date limite doit être aujourd'hui ou plus tard",
                "deadlineRequired": "Veuillez sélectionner une date limite",
                "descriptionMin": "La description doit contenir au moins 80 caractères",
                "durationRequired": "Veuillez sélectionner une durée",
                "estimatedHours": "Veuillez saisir les heures hebdomadaires estimées",
                "hourlyRate": "Le tarif horaire doit être au moins de 1",
                "maxFiles": "Maximum 5 fichiers",
                "maxReferenceLinks": "Max Reference Links",
                "referenceLinksInvalid": "Please enter valid links only",
                "skillsRequired": "Veuillez sélectionner au moins une compétence",
                "subcategoryInvalid": "Veuillez sélectionner une sous-catégorie valide",
                "subcategoryRequired": "Veuillez sélectionner une sous-catégorie",
                "titleMin": "Le titre doit contenir au moins 8 caractères"
            },
            "warnings": {
                "linksTemporarilyUnavailable": "Links were saved in the form but could not be persisted yet. Please run latest migrations."
            },
            "wizard": {
                "badge": "Parcours de publication",
                "currentPhase": "Phase en cours",
                "metaDraft": "Flux sûr pour brouillon",
                "progress": "Progression",
                "stepsLeft": "étapes restantes"
            }
        },
        "newClient": "Nouveau client",
        "posted": {
            "description": "Your brief has been published successfully. Freelancers can now discover it, and proposals will start rolling in soon.",
            "goToDashboard": "Dashboard",
            "linkCopied": "Job link copied to clipboard!",
            "shareNetwork": "Share with your network",
            "title": "Your job is live and ready.",
            "viewJob": "View Job / Proposals"
        },
        "postedAgo": "Publié {{time}}",
        "proposals": "propositions",
        "save": "Sauvegarder",
        "saved": "Mission sauvegardée",
        "savedJobs": {
            "title": "Missions sauvegardées",
            "viewAll": "Voir tout"
        },
        "searchPlaceholder": "Rechercher des missions...",
        "sort": {
            "budgetHigh": "Budget: Élevé à Faible",
            "budgetLow": "Budget: Faible à Élevé",
            "newest": "Plus récents",
            "proposalsHigh": "Plus de propositions",
            "proposalsLow": "Moins de propositions"
        },
        "stats": {
            "availableJobs": "missions disponibles"
        },
        "time": {
            "ago": "",
            "ago_prefix": "Il y a",
            "day": "j",
            "hour": "h",
            "minute": "min",
            "now": "À l'instant"
        },
        "title": "Missions disponibles",
        "type": {
            "fixed": "Fixed",
            "hourly": "Hourly"
        },
        "unsave": "Retirer des favoris",
        "unverifiedPayment": "Paiement non vérifié",
        "verifiedPayment": "Paiement vérifié"
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
            "lastUpdated": "Dernière mise à jour : janvier 2026",
            "sections": {
                "contact": {
                    "emailLabel": "E-mail :",
                    "intro": "Pour toute question liée à la confidentialité :",
                    "title": "7. Contact"
                },
                "cookies": {
                    "text": "Nous utilisons des cookies pour améliorer votre expérience. Vous pouvez gérer ces paramètres dans votre navigateur.",
                    "title": "6. Cookies"
                },
                "dataCollection": {
                    "intro": "Nous collectons les informations suivantes lorsque vous utilisez la plateforme :",
                    "items": {
                        "account": "Informations du compte : nom, e-mail, numéro de téléphone",
                        "payment": "Informations de paiement : détails du compte bancaire (chiffrés)",
                        "profile": "Informations du profil : compétences, expérience, images",
                        "usage": "Données d’utilisation : pages visitées, temps passé"
                    },
                    "title": "1. Données collectées"
                },
                "protection": {
                    "intro": "Nous utilisons des mesures de sécurité avancées pour protéger vos données :",
                    "items": {
                        "audits": "Audits de sécurité réguliers",
                        "database": "Chiffrement des données sensibles en base de données",
                        "ssl": "Chiffrement SSL/TLS pour toutes les communications"
                    },
                    "title": "4. Protection des données"
                },
                "rights": {
                    "items": {
                        "access": "Accéder à vos données personnelles",
                        "correction": "Corriger les données inexactes",
                        "deletion": "Supprimer votre compte et vos données",
                        "export": "Exporter vos données"
                    },
                    "title": "5. Vos droits"
                },
                "sharing": {
                    "intro": "Nous ne vendons pas vos données personnelles. Nous pouvons les partager avec :",
                    "items": {
                        "legalAuthorities": "Autorités légales (sur demande officielle)",
                        "paymentProviders": "Fournisseurs de paiement (pour traiter les transactions)",
                        "publicProfile": "Autres utilisateurs (informations publiques du profil)"
                    },
                    "title": "3. Partage des données"
                },
                "usage": {
                    "items": {
                        "experience": "Améliorer l’expérience utilisateur",
                        "improve": "Fournir et améliorer nos services",
                        "notifications": "Envoyer des notifications importantes",
                        "security": "Prévenir la fraude et protéger la sécurité",
                        "transactions": "Traiter les transactions financières"
                    },
                    "title": "2. Utilisation de vos données"
                }
            },
            "title": "Politique de confidentialité"
        },
        "terms": {
            "lastUpdated": "Dernière mise à jour : janvier 2026",
            "sections": {
                "contact": {
                    "emailLabel": "E-mail :",
                    "intro": "Pour nous contacter au sujet de ces conditions :",
                    "title": "6. Contact"
                },
                "contractsPayments": {
                    "intro": "WorkedIn.tn agit comme intermédiaire entre freelances et clients. Nous ne sommes pas partie aux contrats conclus entre eux.",
                    "items": {
                        "fee": "Frais de plateforme : 5% de la valeur de chaque contrat",
                        "holdPeriod": "Période de retenue des paiements : 7 jours",
                        "secureMethods": "Les paiements sont traités via des moyens sécurisés et approuvés"
                    },
                    "title": "4. Contrats et paiements"
                },
                "disputes": {
                    "text": "En cas de litige, nous proposons un mécanisme d'arbitrage. Les décisions de l'équipe support sont finales et contraignantes.",
                    "title": "5. Résolution des litiges"
                },
                "intro": {
                    "text": "Bienvenue sur WorkedIn.tn, la plateforme freelance leader en Tunisie. En utilisant cette plateforme, vous acceptez de respecter ces conditions.",
                    "title": "1. Introduction"
                },
                "platformUse": {
                    "intro": "Les usages suivants sont interdits sur la plateforme :",
                    "items": {
                        "abusive": "Publication de contenu abusif ou nuisible",
                        "dataHarvesting": "Collecte non autorisée des données utilisateurs",
                        "illegal": "Toute activité illégale",
                        "impersonation": "Usurpation d’identité",
                        "paymentBypass": "Contournement des mécanismes de paiement"
                    },
                    "title": "3. Utilisation de la plateforme"
                },
                "registration": {
                    "items": {
                        "accuracy": "Les informations fournies doivent être exactes et à jour",
                        "age": "Vous devez avoir au moins 18 ans pour vous inscrire",
                        "report": "Vous devez nous informer immédiatement de toute utilisation non autorisée",
                        "security": "Vous êtes responsable de la sécurité de votre compte"
                    },
                    "title": "2. Inscription et comptes"
                }
            },
            "title": "Conditions d'utilisation"
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
        "adminDashboard": "Tableau de bord admin",
        "client": {
            "activeProjects": "Projets actifs",
            "activeProjectsDesc": "Gérer les projets en cours et les recrutements",
            "browseTalent": "Parcourir les talents",
            "browseTalentDesc": "Trouver des freelances tunisiens qualifiés",
            "drafts": "Brouillons",
            "draftsDesc": "Tous vos projets publiés",
            "finished": "Terminés",
            "finishedDesc": "Consulter l'historique des projets terminés",
            "freelancers": "Freelances",
            "savedProfiles": "Profils enregistrés",
            "savedProfilesDesc": "Revenir aux talents sélectionnés"
        },
        "contracts": "Contrats",
        "dashboard": "Tableau de bord",
        "findFreelancers": "Trouver des freelances",
        "findFreelancersTitle": "Trouver des freelances",
        "findWork": "Trouver du travail",
        "forClients": "Pour les clients",
        "forFreelancers": "Pour les freelances",
        "freelancer": {
            "bestMatches": "Meilleures correspondances",
            "bestMatchesDesc": "Opportunités adaptées à votre profil",
            "browseJobs": "Parcourir les missions",
            "browseJobsDesc": "Explorer les missions locales ouvertes",
            "overview": "Vue d'ensemble",
            "overviewDesc": "Solde et statut des paiements",
            "savedJobs": "Missions enregistrées",
            "savedJobsDesc": "Suivre les missions à revisiter",
            "transactions": "Transactions",
            "transactionsDesc": "Consulter l'historique des transactions",
            "withdraw": "Retirer",
            "withdrawDesc": "Transférer les gains vers votre compte"
        },
        "home": "Accueil",
        "howItWorks": "Comment ça marche",
        "jobs": "Missions disponibles",
        "login": "Se connecter",
        "logout": "Déconnexion",
        "messages": "Messages",
        "myJobs": "Mes Offres",
        "myProjects": "Mes Projets",
        "postProject": "Publier un projet",
        "pricing": "Tarifs",
        "profile": "Profil",
        "proposals": "Propositions",
        "saved": "Sauvegardés",
        "settings": "Paramètres",
        "signup": "Créer un compte",
        "wallet": "Portefeuille"
    },
    "notFound": {
        "description": "La page que vous cherchez n'existe pas ou a été déplacée.",
        "goBack": "Retour",
        "goHome": "Accueil",
        "title": "Page Introuvable"
    },
    "notificationSettings": {
        "contractUpdates": "Contracts"
    },
    "notifications": {
        "caughtUp": "Vous êtes à jour",
        "contract": {
            "active": {
                "body": "{{body}}",
                "title": "Contrat démarré"
            },
            "cancelled": {
                "body": "{{body}}",
                "title": "Contrat annulé"
            },
            "completed": {
                "body": "{{body}}",
                "title": "Contrat terminé"
            },
            "disputed": {
                "body": "{{body}}",
                "title": "Contrat en litige"
            },
            "update": {
                "body": "{{body}}",
                "title": "Mise à jour du contrat"
            }
        },
        "delete": "Supprimer la notification",
        "empty": "Aucune notification",
        "emptyDesc": "Nous vous informerons dès qu'il y a du nouveau sur vos projets ou paiements.",
        "errors": {
            "deleteFailed": "Failed to delete notification"
        },
        "identity": {
            "rejected": {
                "body": "Votre demande de verification d'identite a ete rejetee. Assurez-vous que les images sont claires puis renvoyez votre demande.",
                "title": "Demande de verification rejetee"
            },
            "submitted": {
                "body": "Votre demande de vérification d'identité a été reçue. Notre équipe examine vos documents.",
                "title": "Demande de vérification reçue"
            },
            "verified": {
                "body": "Votre compte est désormais vérifié. Vous avez reçu le badge de vérification.",
                "title": "Identité vérifiée avec succès"
            }
        },
        "message": {
            "deleted": "Ce message a été supprimé",
            "title": "Nouveau message de {{sender}}"
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
                "body": "Votre proposition sur '{{jobTitle}}' a été acceptée !",
                "title": "Proposition acceptée"
            },
            "new": {
                "body": "{{freelancer}} a soumis une proposition pour '{{jobTitle}}'",
                "title": "Nouvelle proposition reçue"
            }
        },
        "readAll": "Tout marquer comme lu",
        "time": {
            "daysAgo": "Il y a {{count}}j",
            "hoursAgo": "Il y a {{count}}h",
            "justNow": "À l'instant",
            "minutesAgo": "Il y a {{count}}m"
        },
        "title": "Notifications",
        "unreadCount": "Unread Count",
        "viewAll": "Voir toutes les notifications"
    },
    "onboarding": {
        "client": {
            "profileDesc": "Les informations de base que les freelances verront en premier.",
            "profileTitle": "Profil client",
            "timeoutError": "La demande a pris trop de temps. Veuillez réessayer.",
            "welcome": "Bienvenue",
            "welcomeDesc": "Finalisez votre profil client pour publier vos projets avec confiance."
        },
        "currentStep": "Étape actuelle",
        "freelancer": {
            "basicInfoSaved": "Informations de base enregistrées",
            "completeLaterHint": "Vous pouvez ajouter certificats, portfolio et autres informations plus tard depuis les paramètres.",
            "completionFailed": "Échec de finalisation de l'intégration. Veuillez réessayer.",
            "connectionFailed": "Échec de connexion. Vérifiez votre connexion Internet et réessayez.",
            "finishSetup": "Finish setup",
            "hourlyRateHint": "Shown to clients on your profile and used in search filters. You can update it later.",
            "hourlyRateLabel": "Hourly Rate Label",
            "hourlyRatePlaceholder": "e.g. 35",
            "maxSkills": "Maximum 5 compétences",
            "noAuthSession": "Aucune session active, veuillez vous reconnecter",
            "selectAtLeastOneSkill": "Veuillez sélectionner au moins une compétence",
            "serverConnectionFailed": "Échec de connexion au serveur. Vérifiez votre connexion Internet et réessayez.",
            "skillsClarification": "These skills appear on your profile and in client search filters. Pick only what you can deliver now.",
            "skillsRateAndAvailability": "Skills, rate, and availability",
            "skillsSaveFailed": "Échec de l'enregistrement des compétences",
            "step1Description": "Add the details clients will see first when deciding whether to trust your profile.",
            "step2Description": "Use Upwork-style profile signals: clear services, realistic hourly rate, and current availability.",
            "step2TitleUpdated": "Choose skills and set your hourly rate",
            "step3Description": "Upwork-style profile details: tools you actually use, industries you understand, portfolio links, and clear revision terms.",
            "step3Title": "Show proof and set delivery expectations",
            "stepBasicInfo": "Informations de base",
            "stepCounter": "Étape {{step}} sur {{total}}",
            "stepProof": "Profile details and proof",
            "stepSkillsExperience": "Compétences et expérience",
            "steps": {
                "bio": "Bio",
                "experience": "Expérience",
                "portfolio": "Portfolio",
                "skills": "Compétences"
            },
            "uploadAvatar": "Photo de profil",
            "uploadAvatarDesc": "Une photo professionnelle est recommandée",
            "welcome": "Bienvenue",
            "welcomeDesc": "Complétez votre profil freelance et commencez à recevoir de vraies opportunités.",
            "welcomeToast": "Bienvenue sur WorkedIn !"
        },
        "progressive": {
            "client": {
                "accountTypes": {
                    "company": "Entreprise",
                    "individual": "Particulier"
                },
                "completedMessage": "Les informations d'intégration client sont complètes.",
                "completedSubtitle": "Votre profil client est prêt. Vous pouvez continuer vers votre tableau de bord.",
                "completedTitle": "Intégration terminée",
                "errors": {
                    "accountTypeRequired": "Le type de compte est requis.",
                    "companyNameRequired": "Le nom de l'entreprise est requis pour un compte entreprise.",
                    "fullNameRequired": "Le nom complet est requis.",
                    "locationRequired": "La localisation est requise.",
                    "phoneRequired": "Le numéro de téléphone est requis.",
                    "primaryGoalRequired": "L'objectif principal est requis."
                },
                "fields": {
                    "accountType": "Type de compte",
                    "companyName": "Nom de l'entreprise",
                    "primaryGoal": "Objectif principal"
                },
                "placeholders": {
                    "companyName": "Nom de votre entreprise",
                    "phoneNumber": "+216 00 000 000"
                },
                "primaryGoals": {
                    "buildTeam": "Constituer une équipe",
                    "justBrowsing": "Je parcours seulement",
                    "specificProject": "Recruter pour un projet précis"
                },
                "stepSubtitles": {
                    "accountDetails": "L'essentiel pour rendre votre compte fiable et complet.",
                    "hiringIntent": "Dites-nous ce que vous souhaitez recruter pour personnaliser le matching."
                },
                "steps": {
                    "accountDetails": "Détails du compte",
                    "hiringIntent": "Intention d'embauche"
                },
                "tips": {
                    "accountDetails": "Un profil complet augmente le taux de réponse et réduit l'abandon au premier contact client-freelance.",
                    "hiringIntent": "Une intention d'embauche claire améliore les recommandations et la qualité des profils suggérés."
                }
            },
            "common": {
                "accountInactive": "Votre compte n'est pas actif. Veuillez contacter le support.",
                "back": "Retour",
                "completeProfile": "Terminer le profil",
                "completeRequiredFields": "Veuillez compléter les champs obligatoires avant de continuer.",
                "completing": "Finalisation...",
                "completionFailed": "Échec de finalisation de l'intégration. Veuillez réessayer.",
                "conflictRetry": "Un conflit de mise à jour a été détecté. Veuillez réessayer.",
                "exitOnboarding": "Quitter l'intégration",
                "fields": {
                    "fullName": "Nom complet",
                    "location": "Localisation",
                    "phoneNumber": "Numéro de téléphone"
                },
                "fixBeforeContinue": "Corrigez ceci avant de continuer : {{error}}",
                "invalidPhone": "Veuillez entrer un numéro de téléphone valide.",
                "nextStep": "Étape suivante",
                "onboardingRequired": "Veuillez terminer votre profil d'intégration avant d'accéder aux autres pages.",
                "phoneTaken": "Ce numéro de téléphone est déjà utilisé par un autre compte.",
                "placeholders": {
                    "fullName": "Votre nom complet",
                    "selectLocation": "Sélectionner une localisation"
                },
                "proTip": "Conseil pro",
                "removeTagAria": "Supprimer {{item}}",
                "saveExit": "Enregistrer et quitter",
                "stepCounter": "Étape {{step}} sur {{total}}",
                "unsavedConfirm": "Vous avez une progression non enregistrée. Quitter quand même ?"
            },
            "freelancer": {
                "availability": {
                    "asNeeded": "Selon besoin",
                    "fullTime": "Temps plein",
                    "partTime": "Temps partiel"
                },
                "categories": {
                    "business": "Business",
                    "data": "Data",
                    "design": "Design",
                    "development": "Développement",
                    "marketing": "Marketing",
                    "video": "Vidéo",
                    "writing": "Rédaction"
                },
                "completedMessage": "Merci. Vos informations d'intégration ont été enregistrées avec une structure progressive.",
                "completedSubtitle": "Vos informations d'intégration freelance sont prêtes. Vous pouvez continuer vers votre tableau de bord.",
                "completedTitle": "Configuration du profil terminée",
                "currency": "TND",
                "errors": {
                    "availabilityRequired": "Sélectionnez votre disponibilité.",
                    "avatarRequired": "L'avatar est requis.",
                    "coreSkillRequired": "Ajoutez au moins une compétence principale.",
                    "experienceRequired": "Sélectionnez vos années d'expérience.",
                    "fullNameRequired": "Le nom complet est requis.",
                    "hourlyRateInvalid": "Le tarif horaire doit être supérieur à 0.",
                    "locationRequired": "La localisation est requise.",
                    "mainCategoryRequired": "La catégorie principale est requise.",
                    "phoneRequired": "Le numéro de téléphone est requis.",
                    "portfolioRequired": "Le lien du portfolio est requis.",
                    "professionalTitleRequired": "Le titre professionnel est requis.",
                    "summaryRequired": "Le résumé est requis.",
                    "summaryTooLong": "Le résumé doit contenir 500 caractères maximum.",
                    "toolRequired": "Ajoutez au moins un outil."
                },
                "experience": {
                    "0to2": "0-2",
                    "3to5": "3-5",
                    "5plus": "5+"
                },
                "fields": {
                    "availability": "Disponibilité",
                    "avatarHint": "PNG, JPG, WEBP",
                    "avatarPreviewAlt": "Aperçu de l'avatar",
                    "avatarUpload": "Téléversement de l'avatar (obligatoire)",
                    "bioSummary": "Bio / Résumé",
                    "chooseAvatar": "Choisir un avatar",
                    "coreSkills": "Compétences principales",
                    "hourlyRate": "Tarif horaire",
                    "mainCategory": "Catégorie principale",
                    "portfolioLink": "Lien du portfolio",
                    "professionalTitle": "Titre professionnel",
                    "toolsUsed": "Outils utilisés",
                    "yearsOfExperience": "Années d'expérience"
                },
                "hints": {
                    "coreSkills": "Recherchez et ajoutez jusqu'à 30 compétences",
                    "phoneNumber": "Pour la sécurité et le badge vérifié.",
                    "toolsUsed": "Recherchez et ajoutez jusqu'à 15 outils"
                },
                "placeholders": {
                    "availability": "Sélectionner une disponibilité",
                    "bioSummary": "Quelles sont vos forces et quels types de projets vous motivent ?",
                    "coreSkills": "Saisissez une compétence puis appuyez sur Entrée",
                    "experienceRange": "Sélectionner une plage",
                    "hourlyRate": "80",
                    "phoneNumber": "Pour la sécurité et le badge vérifié",
                    "portfolioLink": "https://votre-portfolio.com",
                    "professionalTitle": "Développeur React senior",
                    "selectCategory": "Sélectionner une catégorie",
                    "toolsUsed": "Saisissez un outil puis appuyez sur Entrée"
                },
                "skillSuggestions": {
                    "contentWriting": "Rédaction de contenu",
                    "dataAnalysis": "Analyse de données",
                    "figma": "Figma",
                    "googleAds": "Google Ads",
                    "illustrator": "Illustrator",
                    "motionDesign": "Motion Design",
                    "nextjs": "Next.js",
                    "nodejs": "Node.js",
                    "projectManagement": "Gestion de projet",
                    "python": "Python",
                    "react": "React",
                    "seo": "SEO",
                    "tailwind": "Tailwind CSS",
                    "typescript": "TypeScript",
                    "uiux": "Design UI/UX"
                },
                "stepSubtitles": {
                    "businessRates": "Fixez des conditions claires pour aligner les attentes.",
                    "expertise": "Définissez vos points forts pour améliorer le matching.",
                    "identityPitch": "Présentez qui vous êtes et la valeur que vous apportez.",
                    "trustProof": "Ajoutez des signaux de confiance qui rassurent les clients."
                },
                "steps": {
                    "businessRates": "Tarifs et conditions",
                    "expertise": "Expertise",
                    "identityPitch": "Identité et positionnement",
                    "trustProof": "Preuves de confiance"
                },
                "tips": {
                    "businessRates": "Des tarifs transparents réduisent la friction et accélèrent la présélection.",
                    "expertise": "Les bons tags améliorent le matching. Ajoutez uniquement vos compétences et outils les plus pertinents.",
                    "identityPitch": "Les clients décident en quelques secondes. Un titre clair et un résumé solide renforcent immédiatement la confiance.",
                    "trustProof": "Les informations vérifiées et un portfolio augmentent fortement votre crédibilité."
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
            "backToLogin": "Retour à la connexion",
            "errorCode": "Code d'erreur : {{code}}",
            "loginIncomplete": "La connexion n'a pas abouti",
            "loginIncompleteDescription": "Nous n'avons pas encore pu confirmer votre session. Réessayez ou revenez à la connexion.",
            "signingIn": "Connexion en cours",
            "signingInDescription": "Nous finalisons votre connexion sécurisée. Cela ne prendra qu'un instant.",
            "tryAgain": "Réessayer"
        },
        "clientJobs": {
            "active": "Actifs",
            "all": "Tous",
            "budgetNotSet": "Budget not set",
            "completed": "Terminés",
            "daysAgo": "Il y a {{days}} jours",
            "delete": "Delete",
            "deleteBlocked": "Cannot delete a project that already has a contract.",
            "deleteConfirmText": "Are you sure you want to delete this project permanently? This action cannot be undone.",
            "deleteConfirmTitle": "Delete Project",
            "deleteError": "Failed to delete project",
            "deleteSuccess": "Project deleted",
            "deleting": "Deleting...",
            "edit": "Modifier",
            "emptyDescription": "Publiez votre premier projet et recevez des propositions de professionnels vérifiés.",
            "emptyFilteredDescription": "Try another tab or adjust search to see your other projects.",
            "emptyFilteredTitle": "No projects in this tab",
            "emptyTitle": "Aucun projet pour le moment",
            "finished": "Finished",
            "finishedBreakdown": "Finished Breakdown",
            "fixedPrice": "Prix fixe",
            "hourlyRate": "Taux horaire",
            "inProgress": "In progress",
            "inReview": "En revue",
            "loading": "Chargement des projets...",
            "needsAttention": "Needs attention",
            "oneDayAgo": "Il y a 1 jour",
            "open": "Open",
            "openContract": "Workspace",
            "postFree": "Publier un projet gratuitement",
            "postProject": "Publier un projet",
            "postedAgo": "Publié {{time}}",
            "proposalsCount": "{{count}} propositions",
            "proposalsReceived": "Total des propositions reçues",
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
                "completed": "Terminé",
                "disputed": "Disputed",
                "finished": "Finished",
                "inProgress": "En cours",
                "inReview": "En revue",
                "open": "Ouvert",
                "reviewNeeded": "Review Needed"
            },
            "subtitle": "Gérez vos projets publiés et vos propositions",
            "title": "Mes Projets",
            "today": "Aujourd'hui",
            "uncategorized": "Uncategorized",
            "viewProposals": "Voir les propositions",
            "viewResult": "View result",
            "withProposals": "With Proposals"
        },
        "errorBoundary": {
            "backHome": "Retour à l'accueil",
            "description": "Une erreur inattendue a interrompu cette page. Actualisez et réessayez, ou revenez à l'accueil.",
            "details": "Error Details",
            "refresh": "Actualiser la page",
            "title": "Une erreur est survenue"
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
                "availableNow": "Disponible",
                "availableNowTitle": "Disponible pour de nouveaux projets dès maintenant.",
                "fastResponder": "Réponse rapide",
                "fastResponderTitle": "Répond généralement vite aux nouveaux clients.",
                "newTalent": "Nouveau talent",
                "newTalentTitle": "Profil récent avec une bonne dynamique initiale.",
                "topRated": "Mieux noté",
                "topRatedTitle": "Excellent retour client de façon constante.",
                "verified": "Vérifié",
                "verifiedTitle": "Identité et détails de paiement vérifiés."
            },
            "completedJobs": "{{count}} terminés",
            "defaultTitle": "Freelance",
            "hourlyRate": "Taux horaire",
            "jobsLabel": "Missions",
            "repliesIn": "Répond en {{time}}",
            "reviewsCount": {
                "one": "1 avis",
                "other": "{{count}} avis",
                "zero": "aucun avis"
            },
            "snippet": "Professionnel, réactif, et bien plus soigné que la moyenne des marketplaces.",
            "success": "Réussite",
            "successRate": "{{rate}}% de réussite",
            "successScore": "Score de réussite",
            "tndPerHour": "TND/h",
            "verifiedProfile": "Profil vérifié",
            "viewProfile": "Voir le profil"
        },
        "freelancerDashboard": {
            "allCaughtUp": "Tout est à jour !",
            "browseJobs": "Parcourir les missions",
            "earnings": "Gains",
            "earningsDescription": "6 derniers mois de paiements escrow libérés.",
            "earningsTrajectory": "Évolution des gains",
            "greetingFallback": "vous",
            "noDueDate": "Aucune date limite",
            "noEarningsData": "Pas encore de données de gains",
            "noRecentActivity": "Aucune activité récente",
            "noUpcomingMilestones": "Aucune échéance à venir",
            "profileSettings": "Paramètres du profil",
            "quickActions": "Actions rapides",
            "recentActivity": "Activité récente",
            "recentActivityDescription": "Vos dernières notifications et mises à jour.",
            "sixMonthTrend": "Tendance sur 6 mois",
            "stat": {
                "activeContracts": "Contrats actifs",
                "pendingProposals": "Propositions en attente",
                "profileViews": "Vues du profil",
                "totalEarnings": "Gains totaux"
            },
            "upcomingMilestones": "Échéances à venir",
            "welcomeBack": "Bon retour",
            "welcomeDescription": "Votre activité freelance devient plus solide. Gardez le rythme et peaufinez votre profil."
        },
        "freelancerEarnings": {
            "availableBalance": "Solde disponible",
            "browseJobs": "Parcourir les missions",
            "clientId": "Client #{{id}}",
            "completedContracts": "Contrats terminés",
            "contractPayment": "Paiement du contrat",
            "earningsOverview": "Aperçu des gains",
            "noEarningsDescription": "Terminez votre premier projet pour voir vos gains ici.",
            "noEarningsTitle": "Aucun gain pour le moment",
            "notAvailable": "N/D",
            "paymentHistory": "Historique des paiements",
            "pendingClearance": "{{amount}} TND en attente de validation",
            "seoDescription": "Vos gains et votre historique de paiements sur WorkedIn.",
            "seoTitle": "Gains | WorkedIn",
            "thisMonth": "Ce mois-ci",
            "totalEarned": "Total gagné",
            "withdraw": "Retirer"
        },
        "freelancerProfile": {
            "actions": {
                "changeProfilePicture": "Changer la photo de profil",
                "editProfile": "Modifier le profil",
                "nextProject": "Projet suivant",
                "openLink": "Ouvrir le lien",
                "openProjectLink": "Ouvrir le lien du projet",
                "previousProject": "Projet précédent",
                "viewFullProject": "Voir le projet complet"
            },
            "addFirstWorkSample": "Add your first work sample",
            "addPortfolio": "Add Portfolio",
            "available": "Available",
            "busy": "Busy right now",
            "completedJobs": "Completed",
            "contactModal": {
                "body": "Une conversation directe avec {{name}} s'ouvrira dans votre espace messages.",
                "cannotMessageSelf": "Vous ne pouvez pas vous envoyer un message",
                "createFailed": "Impossible de créer la conversation",
                "loginPrompt": "Vous devez vous connecter avant de contacter des freelances.",
                "loginRequired": "Vous devez vous connecter pour envoyer un message",
                "opening": "Ouverture...",
                "sectionLabel": "Message direct",
                "startAction": "Démarrer la conversation",
                "startError": "Une erreur est survenue au démarrage de la conversation",
                "title": "Écrire à {{name}}",
                "trustNote": "Utilisez la messagerie WorkedIn pour garder la communication projet claire et organisée."
            },
            "cta": {
                "editProfile": "Edit Profile",
                "hireMe": "M'embaucher",
                "myProposals": "Mes propositions",
                "myProposalsDescription": "Suivez les statuts et relancez plus vite.",
                "portfolioDashboard": "Tableau de bord du portfolio",
                "portfolioDashboardDescription": "Ajoutez et organisez vos meilleurs exemples.",
                "sendMessage": "Envoyer un message",
                "viewPublicProfile": "Voir le profil public",
                "viewPublicProfileDescription": "Prévisualisez exactement comment les clients et visiteurs voient votre profil.",
                "workspaceSettings": "Paramètres de l'espace",
                "workspaceSettingsDescription": "Notifications, sécurité et contrôles du compte."
            },
            "education": {
                "add": "+ Ajouter des détails d'éducation",
                "empty": "Aucune éducation saisie pour le moment.",
                "studyField": "{{degree}} en {{field}}",
                "title": "Éducation"
            },
            "form": {
                "fullName": "Nom complet",
                "hourlyRateTnd": "Taux horaire (TND)",
                "professionalTitle": "Titre professionnel"
            },
            "hearVoice": "Voice intro",
            "hireNow": "Hire Now",
            "info": {
                "lastSeen": "Vu pour la dernière fois",
                "memberSince": "Membre depuis"
            },
            "jobFallback": "Projet",
            "labels": {
                "skillsUsed": "Compétences utilisées",
                "toolsUsed": "Outils utilisés"
            },
            "languages": {
                "empty": "Aucune langue répertoriée.",
                "title": "Langues"
            },
            "lastSeen": "Last seen",
            "lastSeenRecently": "Recently",
            "main": {
                "add": "Ajouter",
                "addDescription": "+ Ajouter une description",
                "addFirstWorkSample": "Ajoutez votre premier exemple de travail",
                "copied": "Copié !",
                "hourlyRateFormat": "{{rate}}/h",
                "independentSpecialist": "Spécialiste indépendant",
                "industries": "Secteurs",
                "jobsCompletedCount": {
                    "one": "{{count}} projet terminé",
                    "other": "{{count}} projets terminés"
                },
                "localTime": "{{time}} heure locale",
                "noBio": "Aucune biographie biographique fournie pour le moment.",
                "noDescription": "Aucune description fournie.",
                "openLink": "Ouvrir le lien",
                "photosCount": {
                    "one": "{{count}} photo",
                    "other": "{{count}} photos"
                },
                "portfolio": "Portfolio",
                "projectCollaboration": "Collaboration de projet",
                "responseTimeSuffix": "temps de réponse",
                "reviewBy": "par {{name}}",
                "reviewsCount": {
                    "one": "{{count}} avis",
                    "other": "{{count}} avis"
                },
                "services": "Services",
                "share": "Partager",
                "skills": "Compétences",
                "specializedFreelancer": "Freelance Spécialisé",
                "specializedIn": "Spécialisé en {{skills}}",
                "tools": "Outils",
                "untitledWork": "Projet sans titre",
                "viewProject": "Voir le projet",
                "workHistoryAndReviews": "Historique de travail et avis",
                "workSamplesEmptyDesc": "Présentez des études de cas, des designs, des produits ou des résultats mesurables pour attirer les clients."
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
                "skillsUsed": "Compétences utilisées",
                "visitProject": "Visiter le projet"
            },
            "portfolioLinks": {
                "add": "+ Ajouter des liens de portfolio",
                "empty": "Aucun lien ajouté pour le moment.",
                "title": "Liens de portfolio"
            },
            "portfolioTitle": "Portfolio",
            "profileStrength": "Profile strength",
            "projectPreferences": {
                "projectPreferences": "Préférences de projet",
                "projectPreferencesDefault": "Ouvert aux modifications du périmètre du projet, communication régulière par messages/appels, livrables basés sur des jalons.",
                "revisionPolicy": "Politique de révision",
                "revisionPolicyDefault": "2 révisions incluses, révisions supplémentaires facturées séparément.",
                "title": "Préférences et détails du projet"
            },
            "publicPreview": {
                "description": "Vous voyez votre profil tel que les autres utilisateurs le voient.",
                "exit": "Quitter l'aperçu",
                "title": "Aperçu du profil public"
            },
            "responseSpeed": "Response",
            "reviews": {
                "empty": "Pas encore d'avis. Terminez votre premier contrat pour recevoir des retours."
            },
            "sectionLabelIntro": "Introduction",
            "sectionLabelSkills": "Core strengths",
            "sectionLabelTrust": "Client trust",
            "sectionLabelWork": "Selected work",
            "sections": {
                "clientTrust": "Confiance client",
                "coreStrengths": "Forces clés",
                "selectedWork": "Travaux sélectionnés",
                "workInformation": "Informations de travail"
            },
            "stats": {
                "availabilityAndStats": "Disponibilité et Statistiques",
                "availableForWork": "Disponible pour travailler",
                "hourlyRate": "Taux horaire",
                "hoursPerWeek": "{{hours}} h/semaine",
                "hoursResponseTime": "< {{hours}} h",
                "jobSuccess": "Réussite des projets",
                "lessThanTwoHours": "< 2 h",
                "profileVisibility": "Visibilité du profil",
                "public": "Public",
                "responseTime": "Temps de réponse",
                "status": "Statut",
                "weeklyAvailability": "Disponibilité hebdomadaire",
                "yearsCount": {
                    "one": "{{count}} an",
                    "other": "{{count}} ans"
                },
                "yearsOfExperience": "Années d'expérience"
            },
            "status": "Status",
            "successRate": "success",
            "toasts": {
                "avatarUpdated": "Photo de profil mise à jour",
                "bioUpdateError": "Impossible de mettre à jour la bio",
                "bioUpdated": "Bio mise à jour",
                "contactDisabledOwnProfile": "Mode aperçu public : l'action de contact est désactivée sur votre propre profil.",
                "linkCopied": "Profile link copied to clipboard",
                "loginRequired": "Veuillez vous connecter pour continuer",
                "profileUpdateError": "Impossible de mettre à jour les détails du profil",
                "profileUpdated": "Détails du profil mis à jour",
                "skillsUpdateError": "Impossible de mettre à jour les compétences",
                "skillsUpdated": "Compétences mises à jour",
                "toolsUpdateError": "Impossible de mettre à jour les outils",
                "toolsUpdated": "Outils mis à jour",
                "workSampleDeleteError": "Impossible de supprimer l'exemple de travail",
                "workSampleDeleted": "Exemple de travail supprimé"
            },
            "totalEarnings": "Earned",
            "validation": {
                "avatarSize": "La taille de l'image doit être inférieure à 5 Mo.",
                "avatarType": "Veuillez importer une image JPG, PNG, WEBP ou GIF.",
                "fullNameRequired": "Le nom complet est requis",
                "validHourlyRate": "Veuillez saisir un taux horaire valide"
            },
            "verificationEmail": "Email",
            "verificationIdentity": "Identity",
            "verificationPayment": "Payment method",
            "verificationPhone": "Phone",
            "verifications": {
                "emailAddress": "Adresse e-mail",
                "identityVerified": "Identité Vérifiée",
                "paymentMethod": "Moyen de paiement",
                "phoneNumber": "Numéro de téléphone",
                "title": "Vérifications"
            },
            "viewer": {
                "close": "Fermer la visionneuse du portfolio",
                "nextImage": "Image suivante",
                "previousImage": "Image précédente"
            },
            "workInfo": "Work information",
            "workSamples": {
                "deleteConfirm": "Delete this work sample? This action cannot be undone.",
                "emptyTitle": "Aucun exemple de travail ajouté pour le moment"
            },
            "works": "works"
        },
        "jobBoard": {
            "actions": {
                "applied": "Candidature envoyée",
                "applyNow": "Postuler"
            },
            "budgetNotSpecified": "Budget non spécifié",
            "currency": "TND",
            "empty": {
                "filtered": "Aucune mission trouvée avec les filtres sélectionnés.",
                "saved": "Vous n'avez pas encore enregistré d'offres."
            },
            "errors": {
                "loadFailed": "Impossible de charger les missions. Veuillez réessayer."
            },
            "filters": {
                "clearAll": "Tout effacer",
                "jobType": "Type de mission",
                "searchPlaceholder": "Rechercher des missions...",
                "showing": "Affichage"
            },
            "header": {
                "jobsYouMightLike": "Offres qui pourraient vous plaire",
                "subtitle": "Parcourez et postulez à des opportunités freelance en Tunisie.",
                "title": "Trouver du travail"
            },
            "hourlyRateFormat": "TND/h",
            "infoBanner": {
                "addSkillsLink": "Ajouter des compétences",
                "clientModePrompt": "Vous visualisez les offres en mode client. Passez en mode freelance pour voir les offres correspondantes.",
                "loginPrompt": "Connectez-vous pour voir les offres adaptées à vos compétences.",
                "matchingSkills": "Offres correspondantes basées sur vos compétences : ___SKILLS___",
                "noSkillsPrompt": "Ajoutez des compétences à votre profil pour voir les offres correspondantes."
            },
            "jobCard": {
                "appliedLabel": "Candidature envoyée",
                "noDescription": "Aucune description fournie.",
                "untitledJob": "Projet sans titre"
            },
            "proposals": {
                "lessThan5": "Moins de 5 propositions",
                "range10_15": "10 à 15 propositions",
                "range15_20": "15 à 20 propositions",
                "range5_10": "5 à 10 propositions",
                "twentyPlus": "20+ propositions",
                "zero": "0 proposition"
            },
            "tabs": {
                "bestMatches": "Meilleures correspondances",
                "mostRecent": "Plus récents",
                "savedJobs": "Offres enregistrées"
            },
            "toasts": {
                "removedFromSaved": "Retiré des missions sauvegardées",
                "savedJob": "Mission sauvegardée",
                "savedJobsUpdateError": "Impossible de mettre à jour les missions sauvegardées"
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
            "error": "Échec de la soumission de l'avis. Réessayez.",
            "rating": {
                "excellent": "Excellent",
                "fair": "Passable",
                "good": "Bien",
                "poor": "Médiocre",
                "veryGood": "Très bien"
            },
            "submitted": "Avis soumis avec succès !"
        },
        "login": {
            "finishingSignIn": "Finalisation de la connexion",
            "finishingSignInDescription": "Nous confirmons votre session sécurisée et vous redirigeons vers le bon espace."
        },
        "messages": {
            "a11y": {
                "openAttachment": "Ouvrir la pièce jointe",
                "openImageAttachment": "Ouvrir la pièce jointe image"
            },
            "allConversationsLabel": "Toutes les conversations",
            "archive": "Archive",
            "archiveAriaArchive": "Archiver la conversation",
            "archiveAriaUnarchive": "Désarchiver la conversation",
            "archiveConversation": "Archiver la conversation",
            "archiveSuccess": "Conversation archivée",
            "archivedLabel": "ARCHIVÉES",
            "attachFile": "Joindre un fichier",
            "attachmentFallback": "Attachment",
            "attachmentLabel": "Pièce jointe",
            "attachmentsDisabled": "Attachments are disabled for this conversation.",
            "audioNote": "Audio note",
            "audioPreviewUnavailable": "Audio preview unavailable.",
            "backToInbox": "Retour à la boîte",
            "cancelReply": "Annuler la réponse",
            "clientInboxLabel": "Boîte client",
            "contract": {
                "nextStep": {
                    "clientReviewDelivery": "Révisez la livraison, puis acceptez, demandez des modifications ou ouvrez un litige.",
                    "clientWaitingDelivery": "Le freelance travaille. La livraison apparaîtra ici.",
                    "completedDefault": "Le contrat est terminé.",
                    "completedLeaveReview": "Laissez un avis pour boucler la boucle de confiance.",
                    "disputed": "Le litige est ouvert. Les preuves sont conservées.",
                    "freelancerSubmitReviewFiles": "Soumettez les fichiers de révision et les fichiers finaux verrouillés quand vous êtes prêt.",
                    "freelancerWaitingForReview": "En attente de révision par le client. Les fichiers finaux restent protégés.",
                    "paymentPending": "Le paiement doit être confirmé avant le début du travail.",
                    "syncing": "Gardez la conversation ouverte pendant la synchronisation du contrat."
                },
                "status": {
                    "cancelled": "Annulé",
                    "completed": "Terminé",
                    "disputed": "En litige",
                    "inProgress": "En cours",
                    "paymentPending": "Paiement en attente",
                    "revisionRequested": "Révision demandée",
                    "syncing": "Synchronisation",
                    "underReview": "En révision"
                }
            },
            "contractContext": "Discussion du contrat",
            "contractDetails": {
                "amount": "Montant",
                "amountReleased": "Amount Released",
                "contractMilestones": "Contract Milestones",
                "due": "Échéance",
                "fundEscrowBody": "Fund Escrow Body",
                "milestoneDefaultTitle": "Milestone Default Title",
                "requestRevisionLeft": "Request Revision Left",
                "revLeft": "Rev Left",
                "revUsed": "Rev Used",
                "review": "Révision",
                "reviewDue": "Review Due",
                "workspace": "Espace de travail"
            },
            "contractOpenFailed": "Impossible d'ouvrir ce fil de contrat pour le moment. Veuillez actualiser et réessayer.",
            "contractProjectWithTitle": "Projet du contrat • {{title}}",
            "contractReferenceFallback": "Contrat",
            "contractReferenceWithId": "Contrat #{{id}}",
            "contractSessionFallbackTitle": "Contrat",
            "contractSidebarUnavailable": "Les détails du contrat ne sont pas encore disponibles pour cette conversation.",
            "contractWithName": "Contrat avec {{name}}",
            "contractWorkspaceTitle": "Espace de travail du contrat",
            "contractsAction": "Contrats",
            "copyMessage": "Copier le message",
            "delete": "Supprimer",
            "deleteConversation": "Supprimer la conversation",
            "deleteForEveryone": "Supprimer pour tout le monde",
            "deleteForMe": "Supprimer pour moi",
            "deleteMessage": "Supprimer le message",
            "deleteMessagePrompt": "Voulez-vous vraiment supprimer ce message ?",
            "deletedMessage": "Ce message a été supprimé",
            "delivery": {
                "finalLockedFiles": "Final Locked Files",
                "finalLockedFilesDescription": "Files that stay locked until the client accepts and payment is released.",
                "provideBothError": "Veuillez fournir des livrables pour les phases de révision et de remise finale.",
                "resubmitLabel": "Soumettre à nouveau",
                "reviewFiles": "Review Files",
                "reviewFilesDescription": "Files the client can review immediately before accepting.",
                "submitLabel": "Soumettre la livraison",
                "submitting": "Soumission en cours...",
                "submittingLabel": "Submitting delivery...",
                "uploadFailed": "Échec du téléchargement {{stage}} pour {{file}} : {{message}}",
                "workDeliveredReview": "Travail livré et prêt pour révision"
            },
            "directChat": "Discussion directe",
            "directContext": "Discussion directe",
            "edited": "Modifié",
            "empty": {
                "noArchivedTitle": "Aucune conversation archivée",
                "noConversationsDescription": "Commencez par envoyer une proposition ou contacter un freelance.",
                "noConversationsTitle": "Aucune conversation pour le moment",
                "noMatchingDescription": "Essayez un autre nom ou effacez votre recherche.",
                "noMatchingTitle": "Aucune conversation correspondante"
            },
            "emptyThread": "Pas encore de messages. Commencez la conversation !",
            "errors": {
                "audioUpload": "Échec de l'envoi de l'audio",
                "fileInspectionFailed": "Impossible de vérifier ce fichier en toute sécurité. Veuillez choisir un autre fichier.",
                "fileTooLarge": "Le fichier doit faire moins de 10 Mo",
                "fileUnsupported": "Type de fichier non pris en charge",
                "fileUpload": "Échec de l'envoi du fichier",
                "invalidAttachment": "Le lien de la pièce jointe n'est pas disponible",
                "openAttachment": "Impossible d'ouvrir la pièce jointe pour le moment",
                "recordingLimit": "Limite d'enregistrement atteinte (5 minutes)",
                "sendFailed": "Échec de l'envoi du message"
            },
            "escrowNotFunded": "Garantie non financée",
            "filterAll": "Tout",
            "filterUnread": "Non lus",
            "filters": {
                "all": "Tout",
                "unread": "Non lus"
            },
            "freelancerInboxLabel": "Boîte freelance",
            "hideWorkspace": "Masquer l'espace",
            "imageLabel": "Image",
            "inboxLabel": "Boîte de réception",
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
                "closeAria": "Fermer l'aperçu de l'image",
                "closeTitle": "Fermer",
                "downloadAria": "Télécharger l'image",
                "downloadFilename": "image",
                "downloadTitle": "Télécharger",
                "imagePreviewAria": "Aperçu de l'image",
                "previewAlt": "Aperçu"
            },
            "loadMore": "Charger plus de messages",
            "loadingContractSidebar": "Chargement des détails du contrat...",
            "loadingConversations": "Chargement des conversations...",
            "loadingMessages": "Chargement des messages...",
            "markUnread": "Marquer comme non lu",
            "messagePlaceholder": "Écrivez votre message...",
            "noCommentPlaceholder": "No comment provided",
            "noConversationsFound": "Aucune conversation trouvée.",
            "noDueDate": "Pas de date d'échéance",
            "noMessagesYet": "Pas encore de messages",
            "offline": {
                "attachmentPending": "Pièce jointe en attente",
                "audioTooLarge": "Audio trop volumineux pour le stockage hors ligne",
                "encodingFailed": "Échec de la préparation du fichier pour le stockage hors ligne",
                "fileTooLarge": "Fichier trop volumineux pour le stockage hors ligne (max 5 Mo)",
                "queued": "Vous êtes hors ligne. Message mis en file d'attente et sera envoyé lors de la reconnexion.",
                "statusWaiting": "En attente",
                "storageFailed": "Échec de la sauvegarde du message hors ligne",
                "synced": "Messages hors ligne synchronisés avec succès"
            },
            "openContract": "Ouvrir le contrat",
            "pauseAudio": "Pause audio",
            "placeholder": "Tapez un message...",
            "playAudio": "Play audio",
            "profileAction": "Profil",
            "reacting": "Réaction...",
            "readOnlyFallback": "This conversation is read-only.",
            "readOnlyPlaceholder": "{{message}}",
            "readOnlyRightNow": "This conversation is read-only right now.",
            "readOnlyThread": "{{message}}",
            "recordVoice": "Enregistrer un message vocal",
            "recording": "Enregistrement...",
            "reply": "Répondre",
            "replyAction": "Reply to message",
            "replyTargetMissing": "Le message original n'est plus disponible.",
            "replyTo": "Répondre au message",
            "replyingTo": "Répondre à",
            "reportReason": {
                "fraud": "Tentative de fraude ou d'escroquerie",
                "harassment": "Harcèlement ou abus",
                "inappropriate": "Comportement ou contenu inapproprié",
                "other": "Autre",
                "spam": "Spam ou trompeur"
            },
            "reportSubmittedSuccess": "Signalement soumis avec succès. Notre équipe l'examinera.",
            "reportUser": "Signaler l'utilisateur",
            "reportUserDescription": "Dites-nous pourquoi vous signalez cet utilisateur. Notre équipe examinera son profil et son activité récente.",
            "reportUserTitle": "Signaler l'utilisateur",
            "reviewBanners": {
                "overdueClient": "Review is overdue. Please accept, request changes, or open a dispute now. If you stay inactive, the platform may escalate or auto-resolve this contract based on policy.",
                "overdueFreelancer": "Client review is overdue. The platform will follow the contract protection policy next if the client stays inactive.",
                "underReviewClient": "Under Review Client",
                "underReviewFreelancer": "Under Review Freelancer"
            },
            "searchPlaceholder": "Rechercher dans les conversations...",
            "searchResultsSummary": "{{count}} résultat",
            "seeLess": "Voir moins",
            "seeMore": "Voir plus",
            "selectConversationDescription": "Sélectionnez une conversation dans la barre latérale pour commencer à discuter, ou attendez qu'on vous contacte.",
            "selectConversationDetails": "Sélectionnez une conversation pour voir les détails",
            "selectConversationTitle": "Vos messages",
            "senderAlt": "Expéditeur",
            "sentAttachment": "A envoyé une pièce jointe",
            "startConversationDesc": "Commencez la conversation en envoyant un message ou un fichier ci-dessous.",
            "startConversationTitle": "No messages yet",
            "stopRecording": "Arrêter l'enregistrement",
            "summaryEmpty": "Summary Empty",
            "summaryUnread": "Summary Unread",
            "system": {
                "completedTitle": "Contrat terminé",
                "deliveryTitle": "Travail livré",
                "disputePrefix": "Dispute Prefix",
                "disputeTitle": "Litige ouvert",
                "eventTitle": "Mise à jour système",
                "reviewFormat": "Review Format",
                "reviewTitle": "Avis soumis",
                "revisionTitle": "Révision demandée"
            },
            "systemEventTitle": "Mise à jour système",
            "threadCountSummary": "{{count}} fils",
            "time": {
                "daysAgo": "Il y a {{count}} j",
                "hoursAgo": "Il y a {{count}} h",
                "minutesAgo": "Il y a {{count}} min",
                "now": "Maintenant"
            },
            "title": "Messages",
            "today": "Today",
            "typingIndicator": {
                "plural": "personnes sont en train d'écrire...",
                "singular": "est en train d'écrire..."
            },
            "unarchive": "Désarchiver",
            "unarchiveSuccess": "Conversation remise dans la boîte de réception",
            "unfundedLabel": "Non financé",
            "unknownFileType": "FILE",
            "unknownSender": "User",
            "userFallback": "Utilisateur",
            "viewArchived": "Conversations archivées",
            "viewWorkspace": "View workspace",
            "voiceMemo": "Note audio",
            "voiceNotesDisabled": "Voice notes are disabled for this conversation."
        },
        "mobileNav": {
            "brandName": "WorkedIn",
            "client": "Client",
            "freelancer": "Freelance",
            "help": "Aide",
            "more": "Plus",
            "searchPlaceholder": "Rechercher...",
            "userFallback": "Utilisateur",
            "workspaceClient": "Espace client",
            "workspaceFreelancer": "Espace freelance"
        },
        "myProposals": {
            "accepted": "Acceptées",
            "all": "Toutes",
            "browseJobs": "Parcourir les missions",
            "daysAgo": "Il y a {{days}} jours",
            "deliveryDays": "Livraison en {{days}} jours",
            "emptyDescription": "Parcourez les projets ouverts et envoyez votre première proposition pour commencer.",
            "emptyTabHint": "Vous avez des propositions, mais aucune en {{tab}} pour l'instant. Essayez l'onglet Toutes.",
            "emptyTabTitle": "Aucune proposition {{tab}}",
            "emptyTitle": "Vous n'avez encore postulé à aucune mission",
            "hoursAgo": "Il y a {{hours}}h",
            "justNow": "À l'instant",
            "loading": "Chargement des propositions...",
            "minsAgo": "Il y a {{mins}} min",
            "oneDayAgo": "Il y a 1 jour",
            "pending": "En attente",
            "proposalAccepted": "Votre proposition a été acceptée !",
            "rejected": "Refusées",
            "sent": "Envoyées",
            "submittedAgo": "Envoyé {{time}}",
            "subtitle": "Suivez toutes vos propositions envoyées",
            "title": "Mes Propositions",
            "today": "Aujourd'hui",
            "unknownProject": "Projet inconnu",
            "viewContract": "Voir le contrat",
            "viewJob": "Voir la mission",
            "yourBid": "Votre offre : {{amount}} TND"
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
                "applyNow": "Postuler",
                "inviteToJob": "Inviter au projet",
                "removeSavedFreelancer": "Retirer le freelance sauvegardé",
                "removeSavedJob": "Retirer la mission sauvegardée"
            },
            "browseFreelancers": "Parcourir les freelances",
            "browseJobs": "Parcourir les missions",
            "empty": {
                "title": "Rien n'est encore sauvegardé"
            },
            "labels": {
                "budget": "Budget :"
            },
            "savedTalent": "Talents sauvegardés",
            "subtitle": "Gardez une trace des missions auxquelles vous souhaitez postuler.",
            "subtitleTalent": "Gardez une trace des meilleurs freelances pour vos projets.",
            "title": "Missions sauvegardées"
        },
        "searchModal": {
            "allResults": "Tous les résultats",
            "closeHint": "fermer",
            "enterHint": "Appuyez sur Entrée pour voir tous les résultats de \"{{query}}\"",
            "filterAll": "Tout",
            "filterAllDesc": "Rechercher partout",
            "filterJobs": "Missions",
            "filterJobsDesc": "Missions ouvertes",
            "filterProjects": "Pages",
            "filterProjectsDesc": "Raccourcis & pages",
            "filterTalent": "Talents",
            "filterTalentDesc": "Freelances & agences",
            "globalTitle": "Recherche globale",
            "goTo": "Aller à",
            "headerHint": "Accédez rapidement aux pages, recherchez des missions en direct et ouvrez les actions courantes.",
            "navHint": "naviguer",
            "noResultsFor": "Aucun résultat pour \"{{query}}\"",
            "openAction": "Ouvrir",
            "placeholderAll": "Rechercher missions, freelances, pages...",
            "placeholderClient": "Rechercher freelances, compétences...",
            "placeholderFreelancer": "Rechercher missions, compétences...",
            "placeholderJobs": "Rechercher missions...",
            "placeholderProjects": "Rechercher pages...",
            "placeholderTalent": "Rechercher freelances...",
            "quickActions": "Actions rapides",
            "quickLinksRecent": "Raccourcis et récents",
            "recentSection": "Accès récents",
            "removeSearch": "Supprimer la recherche",
            "resultsCount": "{{count}} résultats",
            "resultsHeadline": "Résultats · {{category}}",
            "searchEverything": "Rechercher partout pour \"{{query}}\"",
            "searchEverythingMeta": "Ouvrir la page de recherche complète avec tous les résultats correspondants",
            "searchIn": "Rechercher dans",
            "searching": "Recherche en cours...",
            "sectionActions": "Actions",
            "sectionBestMatch": "Meilleure correspondance",
            "sectionGeneral": "Résultats",
            "sectionJobs": "Missions",
            "selectHint": "valider",
            "shortcuts": {
                "browseAllJobs": "Parcourir toutes les missions",
                "browseJobs": "Parcourir les missions",
                "contracts": "Contrats",
                "createAccount": "Créer un compte",
                "findFreelancers": "Trouver des freelances",
                "howItWorks": "Comment ça marche",
                "myEarnings": "Mes gains",
                "myProjects": "Mes projets",
                "myProposals": "Mes propositions",
                "postProject": "Publier un projet",
                "settings": "Paramètres"
            },
            "trendingNow": "Tendances du moment",
            "tryDifferent": "Essayez un autre terme de recherche",
            "workspaceClient": "Espace client",
            "workspaceFreelancer": "Espace freelance"
        },
        "settings": {
            "account": {
                "accountType": "Type de compte",
                "currentWorkspace": "Espace de travail actuel",
                "goToDashboard": "Aller au tableau de bord",
                "identity": "Identité",
                "identityVerified": "Identité vérifiée",
                "manageNotifications": "Gérer les notifications",
                "notVerified": "Non vérifié",
                "openPublicProfileEditor": "Ouvrir l'éditeur du profil public",
                "overviewDescription": "Gérez votre espace de travail et les détails généraux du compte.",
                "overviewTitle": "Vue du compte",
                "quickActions": "Actions rapides",
                "verificationUnderReview": "Vérification en cours"
            },
            "actions": {
                "signOut": "Se déconnecter"
            },
            "menu": {
                "account": "Compte",
                "billing": "Facturation",
                "clientMode": "Mode Client",
                "earnings": "Gains",
                "freelancerMode": "Mode Freelance",
                "notifications": "Notifications",
                "privacy": "Confidentialité",
                "profile": "Paramètres du profil"
            },
            "notifications": {
                "newJobMatches": "Nouvelles missions correspondantes",
                "newJobMatchesDesc": "Recevez une notification lorsque des missions correspondent à vos compétences",
                "newMessages": "Nouveaux messages",
                "newMessagesDesc": "Recevez une notification lorsque vous recevez de nouveaux messages",
                "offersAndUpdates": "Offres et mises à jour",
                "offersAndUpdatesDesc": "Conseils et mises à jour de WorkedIn",
                "payments": "Paiements",
                "paymentsDesc": "Recevez une notification lorsque vous envoyez ou recevez des paiements",
                "reviews": "Avis",
                "reviewsDesc": "Recevez une notification lorsque vous recevez un nouvel avis",
                "toasts": {
                    "loadError": "Échec du chargement des paramètres de notification",
                    "saveError": "Impossible d'enregistrer les paramètres de notification"
                }
            },
            "payment": {
                "accountHolderNamePlaceholder": "Account holder full name *",
                "active": "ACTIVE",
                "addAccount": "Add account",
                "addBankAccount": "Add bank account",
                "addBankAccountDesc": "Add a bank account to receive your earnings.",
                "addMethod": "Ajouter une méthode",
                "bankNamePlaceholder": "Bank Name Placeholder",
                "bankTransfer": "Virement bancaire",
                "cardDesc": "Pay securely with local Visa, Mastercard, or CIB cards",
                "cardName": "Credit / Debit Card",
                "clientDesc": "How you fund contracts for your projects.",
                "default": "DEFAULT",
                "deleteMethod": "Supprimer la méthode de paiement",
                "dhmadClientDesc": "Active billing gateway. Supports Visa, Mastercard, Flouci, and e-Dinar checkouts natively during contract funding.",
                "dhmadFreelancerDesc": "Active escrow clearinghouse. Contract funds are secured safely by Dhmad until delivery is approved, then credited to your wallet balance.",
                "dhmadName": "Dhmad Escrow",
                "directFunding": "Direct Funding Options",
                "directFundingDesc": "Fund contracts securely through Dhmad Escrow checkout.",
                "directFundingTip": "Contracts are funded directly during checkout when you hire a freelancer. No pre-funding or complex deposits are needed!",
                "edinarDesc": "Pay with La Poste e-Dinar card",
                "edinarName": "Edinar Name",
                "empty": {
                    "description": "Ajoutez maintenant une méthode de retrait afin que les contrats soient prêts quand vous en avez besoin.",
                    "title": "Aucune méthode de paiement ajoutée"
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
                "setDefault": "Définir par défaut",
                "soon": "SOON",
                "title": "Méthodes de paiement",
                "toasts": {
                    "addError": "Impossible d'ajouter la méthode de paiement",
                    "added": "Méthode de paiement ajoutée",
                    "defaultUpdateError": "Impossible de mettre à jour la méthode par défaut",
                    "defaultUpdated": "Méthode de paiement par défaut mise à jour",
                    "loadError": "Échec du chargement des méthodes de paiement",
                    "removeError": "Impossible de supprimer la méthode de paiement",
                    "removed": "Méthode de paiement supprimée"
                },
                "validIban": "Valid Tunisian IBAN",
                "walletDesc": "View your escrow balance and withdraw earnings.",
                "walletMetrics": "Balance, transactions, withdrawals",
                "yourWallet": "Your Wallet"
            },
            "privacy": {
                "activeSessions": "Sessions actives",
                "changePassword": "Changer le mot de passe",
                "currentSession": "Cet appareil est votre session actuelle.",
                "deleteAccount": "Supprimer le compte",
                "deleteAccountButton": "Delete my account",
                "deleteAccountWarning": "Votre compte et toutes vos données seront supprimés définitivement. Cette action est irréversible.",
                "signOutAllDevices": "Se déconnecter de tous les appareils",
                "submitting": "Submitting...",
                "title": "Sécurité et confidentialité",
                "toasts": {
                    "deleteRequestError": "Impossible d'envoyer la demande de suppression",
                    "deleteRequestInProgress": "Une demande de suppression est déjà en cours",
                    "deleteRequestSubmitted": "Demande de suppression de compte envoyée",
                    "signOutAllError": "Impossible de déconnecter tous les appareils"
                }
            },
            "title": "Paramètres"
        }
    },
    "payment": {
        "amount": "Montant",
        "cardHolder": "Nom du titulaire",
        "cardNumber": "Numéro de carte",
        "cardNumberPlaceholder": "0000 0000 0000 0000",
        "cardSchemes": "Visa / Mastercard / CIB",
        "chooseMethod": "Choisir un mode de paiement",
        "completeTitle": "Paiement",
        "creditCard": "Carte Bancaire",
        "cvc": "CVC",
        "cvcPlaceholder": "123",
        "d17Desc": "Le moyen le plus rapide en Tunisie",
        "d17PhoneLabel": "Numéro de téléphone D17",
        "d17PhonePlaceholder": "+216 00 000 000",
        "dhmadDescription": "Les paiements sont conservés en toute sécurité dans la garantie par Dhmad.tn",
        "escrowFunded": "Garantie financée avec succès",
        "expiryDate": "Date d'expiration",
        "expiryDatePlaceholder": "MM/YY",
        "flouciDesc": "Votre portefeuille numérique sécurisé",
        "flouciDescription": "Ã˜Â§Ã™â€žÃ˜Â¯Ã™ÂÃ˜Â¹ Ã˜Â¹Ã˜Â¨Ã˜Â± Flouci - Ã˜Â¨Ã˜Â·Ã˜Â§Ã™â€šÃ˜Â§Ã˜Âª Ã˜Â¨Ã™â€ Ã™Æ’Ã™Å Ã˜Â© Ã™Ë†Ã™â€¦Ã˜Â­Ã˜Â§Ã™ÂÃ˜Â¸ Ã˜Â¥Ã™â€žÃ™Æ’Ã˜ÂªÃ˜Â±Ã™Ë†Ã™â€ Ã™Å Ã˜Â©",
        "flouciRedirect": "Redirection vers Flouci pour le paiement sécurisé",
        "flouciTitle": "Flouci",
        "fundEscrowAction": "Financer la garantie maintenant",
        "fundEscrowHint": "Vous devez financer la garantie avant que le freelance ne commence. Les fonds restent protégés jusqu'à ce que vous approuviez la livraison.",
        "fundEscrowSubtitle": "Les fonds sont protégés jusqu'à la fin des travaux",
        "fundEscrowTitle": "Financer la garantie",
        "noPaymentLink": "Le lien de paiement n'a pas été généré",
        "noResponse": "Aucune réponse reçue du serveur de garantie",
        "openFlouci": "Ouvrir l'application Flouci",
        "orEnterPhone": "Ou entrez votre numéro",
        "payNow": "Payer maintenant",
        "payVia": "Payer via",
        "platformFee": "Frais de plateforme",
        "processing": "Traitement du paiement...",
        "processingDesc": "Veuillez patienter, ne fermez pas cette fenêtre",
        "projectBudget": "Budget du projet",
        "recipient": "Bénéficiaire",
        "redirectingToPayment": "Redirection vers le paiement sécurisé...",
        "refundFailed": "Échec du remboursement de la garantie. Veuillez réessayer.",
        "releaseFailed": "Échec de la libération de la garantie. Veuillez réessayer.",
        "scanD17": "Scanner avec l'application D17",
        "secureTransaction": "Transaction 100% sécurisée et cryptée",
        "sessionFailed": "Échec de la création de la session de paiement. Veuillez réessayer.",
        "startFailed": "Échec du lancement du paiement. Veuillez réessayer.",
        "statusFailed": "Échec de l'obtention du statut de la garantie. Veuillez réessayer.",
        "success": "Paiement réussi !",
        "successDetails": {
            "backToContract": "Retour au contrat",
            "backToWallet": "Retour au portefeuille",
            "goToWallet": "Aller au portefeuille",
            "missingInfo": "Identifiant de paiement manquant",
            "timeout": "Délai d'attente dépassé pour la vérification du paiement. Veuillez vérifier votre tableau de bord.",
            "verificationError": "La vérification du paiement a échoué. Veuillez contacter le support.",
            "walletFunded": "Le solde du portefeuille a été mis à jour avec succès."
        },
        "to": "Pour",
        "total": "Total",
        "totalToPay": "Total à payer",
        "transactionId": "ID Transaction",
        "transferred": "Montant transféré"
    },
    "portfolio": {
        "addFirst": "Ajouter votre premier travail",
        "addNew": "Ajouter un nouveau travail",
        "card": {
            "clientPrefix": "Client",
            "deleteItem": "Supprimer l'élément du portfolio",
            "editItem": "Modifier l'élément du portfolio"
        },
        "deleteConfirm": "Êtes-vous sûr de vouloir supprimer ce travail ?",
        "deleteError": "Erreur lors de la suppression",
        "empty": {
            "description": "Ajoutez des exemples de vos travaux précédents pour que les clients puissent voir vos compétences et votre qualité",
            "title": "Aucun travail à afficher"
        },
        "form": {
            "actions": {
                "add": "Ajouter le travail",
                "cancel": "Annuler",
                "save": "Enregistrer les modifications"
            },
            "addTitle": "Ajouter un nouveau travail",
            "editTitle": "Modifier le travail",
            "fields": {
                "clientName": {
                    "label": "Client / Marque (optionnel)",
                    "placeholder": "Exemple : Acme Corp"
                },
                "completionDate": {
                    "label": "Date d'achèvement"
                },
                "description": {
                    "label": "Description du projet",
                    "placeholder": "Décrivez les détails du projet et ce que vous avez livré..."
                },
                "imageUpload": {
                    "label": "Importer l'image d'aperçu"
                },
                "imageUrl": {
                    "label": "Ou coller l'URL de l'image",
                    "placeholder": "https://..."
                },
                "projectUrl": {
                    "label": "URL du projet (optionnel)",
                    "placeholder": "https://example.com"
                },
                "skills": {
                    "label": "Compétences utilisées",
                    "placeholder": "Exemple : design UI, développement frontend, retouche photo (séparées par des virgules)",
                    "searchPlaceholder": "Rechercher et sélectionner des compétences..."
                },
                "title": {
                    "label": "Titre du projet",
                    "placeholder": "Exemple : design d'une boutique e-commerce"
                },
                "tools": {
                    "label": "Outils utilisés (optionnel)",
                    "searchPlaceholder": "Rechercher et sélectionner des outils..."
                }
            },
            "imageHint": "Importez une image d'aperçu ou collez un lien direct vers l'image.",
            "skills": {
                "clearAll": "Tout supprimer",
                "edit": "Modifier",
                "noResults": "Aucune compétence correspondante trouvée.",
                "noneSelected": "Aucune compétence sélectionnée pour le moment.",
                "remove": "Retirer la compétence",
                "sections": {
                    "business": "Business",
                    "data": "Données",
                    "design": "Design",
                    "development": "Développement",
                    "marketing": "Marketing",
                    "other": "Autre",
                    "video": "Vidéo",
                    "writing": "Rédaction"
                }
            },
            "tools": {
                "clearAll": "Tout supprimer",
                "edit": "Modifier",
                "noResults": "Aucun outil correspondant trouvé.",
                "noneSelected": "Aucun outil sélectionné pour le moment.",
                "remove": "Retirer l'outil",
                "sections": {
                    "design": "Design",
                    "development": "Développement",
                    "marketing": "Marketing",
                    "other": "Autre",
                    "productivity": "Productivité",
                    "video": "Vidéo"
                }
            },
            "upload": {
                "action": "Importer une image",
                "addExtraUrl": "Ajouter",
                "addMore": "Ajouter une image",
                "addUrl": "Ajouter l'URL",
                "coverUrlPlaceholder": "https://example.com/cover-image.jpg",
                "delete": "Supprimer l'image",
                "deleteCover": "Supprimer la couverture",
                "dragDropHint": "Glissez-déposez ou cliquez pour parcourir. JPEG, PNG, WEBP (Max 5 Mo)",
                "edit": "Modifier l'image",
                "error": "Échec de l'import de l'image",
                "extraAdded": "Image ajoutée à la galerie",
                "extraImageUrlPlaceholder": "Ajouter une URL d'image supplémentaire...",
                "extraUrlPlaceholder": "https://image-url.com/preview.jpg",
                "galleryLabel": "Galerie du projet (Optionnel)",
                "loginRequired": "Veuillez vous connecter pour importer des images.",
                "networkError": "Le service d'import est indisponible pour le moment. Vous pouvez coller une URL d'image directe.",
                "pasteUrlHint": "Ou collez un lien d'image direct pour la couverture :",
                "permissionError": "Vous n'avez pas l'autorisation d'importer des fichiers dans le stockage.",
                "previewAlt": "Image d'aperçu du portfolio",
                "remove": "Supprimer",
                "replace": "Remplacer l'image",
                "replaceCover": "Remplacer la couverture",
                "success": "Image importée avec succès",
                "uploadCover": "Importer une image de couverture",
                "uploading": "Import en cours..."
            },
            "validation": {
                "descriptionMin": "La description doit contenir au moins 10 caractères",
                "imageRequired": "Veuillez importer une image ou fournir une URL d'image directe",
                "invalidImageUrl": "Veuillez utiliser une URL d'image directe en http/https",
                "invalidUrl": "Veuillez utiliser une URL http/https valide",
                "skillsLimit": "Vous pouvez sélectionner jusqu'à {{count}} compétences",
                "titleMin": "Le titre doit contenir au moins 3 caractères",
                "toolsLimit": "Vous pouvez sélectionner jusqu'à {{count}} outils"
            }
        },
        "loadError": "Erreur lors du chargement du portfolio",
        "modal": {
            "description": "Project Description",
            "skills": "Skills Used",
            "tools": "Tools Used"
        },
        "saveError": "Erreur lors de l'enregistrement du travail",
        "subtitle": "Ajoutez et modifiez vos travaux précédents pour augmenter vos chances d'être embauché",
        "title": "Gestion du Portfolio",
        "view": {
            "gridAria": "Vue grille",
            "listAria": "Vue liste"
        },
        "workAdded": "Travail ajouté avec succès",
        "workDeleted": "Travail supprimé avec succès",
        "workSaved": "Travail enregistré avec succès",
        "workUpdated": "Portfolio mis à jour avec succès"
    },
    "profile": {
        "addLanguage": "Add Language",
        "availability": "Availability",
        "bio": "Titre professionnel",
        "bioHint": "A short summary improves credibility and response quality.",
        "bioPlaceholder": "Presentez votre specialite",
        "browse": "Parcourir les fichiers",
        "budgetOptions": {
            "fixed": "Prix fixe",
            "flexible": "Flexible / Dépend du projet",
            "hourly": "Taux horaire"
        },
        "budgetPreference": "Préférence budgétaire par défaut",
        "communicationPlaceholder": "ex. Slack ou e-mail de préférence, mises à jour hebdomadaires...",
        "communicationPreferences": "Préférences de communication",
        "companyDetailsDesc": "Informations sur l'entreprise, préférences d'embauche et style de communication",
        "companyDetailsTitle": "Détails de l'entreprise",
        "companyIndustry": "Secteur d'activité",
        "companyName": "Nom de l'entreprise",
        "companyNamePlaceholder": "Entrez le nom de votre entreprise",
        "companyRole": "Votre rôle",
        "companyRolePlaceholder": "ex. Responsable du recrutement, PDG",
        "companySize": "Taille de l'entreprise",
        "companySizeOptions": {
            "elevenToFifty": "11 à 50 employés",
            "fiftyOneToTwoHundred": "51 à 200 employés",
            "justMe": "Seulement moi",
            "oneToTen": "1 à 10 employés",
            "twoHundredPlus": "Plus de 200 employés"
        },
        "companyWebsite": "Site web",
        "dragDrop": "Glissez des fichiers ici ou telechargez-les depuis votre appareil",
        "education": {
            "add": "Ajouter une formation",
            "degree": "Diplome",
            "degreePlaceholder": "Degree Placeholder",
            "endYear": "Annee de fin",
            "endYearPlaceholder": "e.g. 2023",
            "field": "Domaine d'etudes",
            "fieldPlaceholder": "e.g. Computer Science",
            "institution": "Etablissement",
            "institutionPlaceholder": "e.g. University of Tunis",
            "noEducation": "Aucune formation ajoutee",
            "noEducationList": "No education details listed. Click \"Add Education\" to add.",
            "startYear": "Annee de debut",
            "startYearPlaceholder": "e.g. 2020",
            "title": "Formation"
        },
        "fullName": "Nom complet",
        "fullNamePlaceholder": "Entrez votre nom complet",
        "generalInfo": "General Professional Info",
        "headline": "Professional title",
        "headlinePlaceholder": "UI/UX Designer, Full-stack Developer...",
        "hiringNeeds": "Besoins de recrutement (séparés par des virgules)",
        "hiringNeedsPlaceholder": "ex. Designers, Développeurs",
        "hourlyRate": "Hourly Rate",
        "hourlyRatePlaceholder": "e.g. 35",
        "industries": "Industries you understand",
        "industriesHint": "Select up to 4 industries where you can work confidently.",
        "industriesLimit": "Industries Limit",
        "industriesTitle": "Industries",
        "languages": {
            "add": "Ajouter une langue",
            "levels": {
                "basic": "Debutant",
                "conversational": "Conversationnel",
                "fluent": "Courant",
                "native": "Langue maternelle",
                "nativeBilingual": "Native or Bilingual"
            },
            "names": {
                "arabic": "Arabic",
                "english": "English",
                "french": "French"
            },
            "select": "Choisir une langue",
            "title": "Langues"
        },
        "legalPlaceholder": "ex. Accord de confidentialité requis avant de commencer...",
        "legalPreferences": "Préférences juridiques",
        "location": "Localisation",
        "noLanguages": "No languages listed. Click \"Add Language\" to add.",
        "noMatchingSkills": "No matching skills found.",
        "noSkills": "No skills selected yet. Search below to add skills.",
        "optional": "Optionnel",
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
        "recordVoice": "Enregistrer une presentation",
        "revisionPolicy": "Revision policy",
        "revisionPolicyPlaceholder": "Example: 2 revisions included, additional revisions billed separately.",
        "screeningPlaceholder": "ex. Portfolio requis, test technique prévu...",
        "screeningPreferences": "Préférences de sélection",
        "searchResults": "Search Results",
        "searchSkills": "Search skills...",
        "searchSkillsPlaceholder": "Type to search e.g. React, UI/UX...",
        "searchTools": "Search tools...",
        "secondarySkills": "more",
        "selectIndustry": "Sélectionner le secteur d'activité",
        "selectLanguagePlaceholder": "Select language...",
        "selectLocation": "Choisissez votre gouvernorat",
        "skills": "Competences",
        "skillsLimit": "Skills Limit",
        "skillsSpec": "Skills you specialize in",
        "skillsTitle": "Expertise & Skills",
        "stopRecording": "Arreter l'enregistrement",
        "suggestedSkills": "Suggested Skills",
        "timelineOptions": {
            "asap": "Dès que possible",
            "flexible": "Flexible",
            "oneToThreeMonths": "1 à 3 mois",
            "threeToSixMonths": "3 à 6 mois"
        },
        "timelinePreference": "Préférence de calendrier par défaut",
        "tools": "Tools",
        "toolsHint": "Select up to 6 tools. This is visible to clients.",
        "toolsLimit": "Tools Limit",
        "toolsOptional": "Tools Optional",
        "toolsTitle": "Tools you use",
        "voiceIntro": "Presentation vocale",
        "weeklyAvailability": "Weekly Availability",
        "weeklyAvailabilityHint": "Clients use this to decide if your timeline fits their project.",
        "weeklyAvailabilityHours": "Weekly Availability Hours",
        "weeklyAvailabilityPlaceholder": "e.g. 30",
        "workSamples": "Exemples de travaux",
        "workspaceModeTip": "You are currently in ___MODE___ mode. Switch your workspace in the header to edit the other profile\\'s settings.",
        "yearsExperience": "Years of experience",
        "yearsExperiencePlaceholder": "e.g. 3"
    },
    "proposalModal": {
        "addFile": "Ajouter un fichier",
        "attachmentsOptional": "Pièces jointes (optionnelles)",
        "bidLabel": "Votre offre :",
        "cancel": "Annuler",
        "coverLetter": "Lettre de motivation",
        "coverLetterMinHint": "Minimum {{count}} caractères",
        "coverLetterPlaceholder": "Décrivez votre approche, vos expériences pertinentes et pourquoi vous êtes le meilleur candidat...",
        "delivery": {
            "fiveDays": "5 jours",
            "oneDay": "1 jour",
            "oneMonth": "1 mois",
            "oneWeek": "1 semaine",
            "threeDays": "3 jours",
            "twoDays": "2 jours",
            "twoMonths": "2 mois",
            "twoWeeks": "2 semaines"
        },
        "deliveryTime": "Délai de livraison",
        "fileLimit": "Max {{size}} Mo par fichier",
        "jobContext": "CONTEXTE DE LA MISSION",
        "platformFee": "Frais plateforme ({{percent}}%)",
        "removeAttachmentAria": "Remove attachment: {{name}}",
        "submit": "Soumettre la proposition",
        "submitting": "Envoi en cours...",
        "title": "Soumettre une proposition",
        "validation": {
            "bidMax": "L'offre maximale est de {{amount}} {{currency}}",
            "bidMin": "L'offre minimale est de {{amount}} {{currency}}",
            "coverLetterMax": "La lettre de motivation ne doit pas dépasser {{count}} caractères",
            "coverLetterMin": "La lettre de motivation doit contenir au moins {{count}} caractères",
            "deliveryMax": "La livraison maximale est de {{count}} jours",
            "deliveryMin": "La livraison minimale est de {{count}} jour"
        },
        "youReceive": "Vous recevrez"
    },
    "publicProfile": {
        "about": "À propos",
        "available": "Disponible",
        "busy": "Occupé",
        "earned": "Gagné",
        "editProfile": "Modifier le profil",
        "memberSince": "Membre depuis",
        "months": "mois",
        "noBio": "Pas de biographie",
        "noReviews": "Pas d'avis",
        "noSamples": "Pas d'exemples",
        "offline": "Hors ligne",
        "reviews": "Avis",
        "sendMessage": "Envoyer un message",
        "showMore": "Voir plus",
        "skills": "Compétences",
        "voiceIntro": "Présentation vocale",
        "workSamples": "Exemples de travaux"
    },
    "reviews": {
        "client": "Client",
        "commentLabel": "Comment Label",
        "commentPlaceholder": "Share details of your experience...",
        "freelancer": "Freelance",
        "helpful": "Helpful",
        "jobLabel": "Mission",
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
        "budgetNegotiable": "Négociable",
        "budgets": {
            "0_50": "Moins de 50 TND",
            "100_250": "100 – 250 TND",
            "250_500": "250 – 500 TND",
            "500_plus": "500+ TND",
            "50_100": "50 – 100 TND",
            "range1": "Moins de 50 TND",
            "range2": "50 – 100 TND",
            "range3": "100 – 250 TND",
            "range4": "250 – 500 TND",
            "range5": "500+ TND"
        },
        "categories": {
            "design": "Design",
            "development": "Développement",
            "marketing": "Marketing",
            "writing": "Rédaction"
        },
        "clearAll": "Tout effacer",
        "empty": {
            "browseAllJobs": "Ou parcourir toutes les missions",
            "popularLabel": "Populaire",
            "proTipLabel": "Pro Tip",
            "subtitle": "Découvrez des freelances talentueux et des projets incroyables en quelques clics.",
            "tipFilters": "Utilisez les filtres pour affiner par budget et catégorie",
            "tipLabel": "Astuce",
            "tipPopular": "React et UI/UX design sont en tendance cette semaine",
            "tipSpecific": "Soyez précis avec vos mots-clés pour trouver le meilleur résultat",
            "titleHighlight": "Match Parfait",
            "titlePrefix": "Trouvez Votre",
            "trendingTitle": "Tendances du moment"
        },
        "error": {
            "description": "Nous avons des difficultés à effectuer la recherche.",
            "retry": "Réessayer",
            "title": "Une erreur est survenue"
        },
        "filterSections": {
            "budgetRange": "Fourchette de budget",
            "category": "Catégorie"
        },
        "filters": "Filtres",
        "filtersTitle": "Filtres",
        "freelancers": "Freelances",
        "jobs": "Missions",
        "labels": {
            "freelancer": "Freelance",
            "projects": "projets",
            "successRate": "réussite"
        },
        "negotiable": "Négociable",
        "noResults": "Aucun résultat trouvé",
        "noResultsDesc": "Nous n'avons rien trouvé correspondant à votre recherche",
        "noResultsView": {
            "didYouMeanPlaceholder": "Et si vous essayiez un mot-clé plus large ?",
            "subtitle": "Pas de panique ! Essayez ces suggestions :",
            "suggestionCategoriesBody": "Découvrez les compétences tendance",
            "suggestionCategoriesTitle": "Parcourir les catégories populaires",
            "suggestionFiltersBody": "Supprimez les filtres de budget ou de catégorie",
            "suggestionFiltersTitle": "Élargir vos filtres",
            "suggestionKeywordsBody": "Une formulation différente donne de meilleurs résultats",
            "suggestionKeywordsTitle": "Essayez d'autres mots-clés",
            "title": "Aucun résultat pour"
        },
        "pagination": {
            "next": "Suiv.",
            "pageOf": "Page {{page}} sur {{total}}",
            "prev": "Préc."
        },
        "placeholder": "Rechercher...",
        "recent": "Recherches récentes",
        "resetFilters": "Effacer tous les filtres",
        "resultsCount": "Affichage de {{count}} résultats pour \"{{query}}\"",
        "resultsFor": "Résultats pour",
        "resultsLabel": "résultats pour",
        "skills": "Compétences",
        "sort": {
            "budgetHigh": "Budget : Élevé à Bas",
            "budgetLow": "Budget : Bas à Élevé",
            "newest": "Plus récents",
            "proposalsHigh": "Plus de propositions"
        },
        "tabs": {
            "all": "Tout",
            "freelancers": "Freelances",
            "jobs": "Missions"
        },
        "trending": {
            "logoDesign": "Création de logo",
            "reactJs": "React JS",
            "translation": "Traduction",
            "uiux": "UI/UX"
        },
        "trendingMeta": {
            "logoDesign": "Populaire en ce moment",
            "reactJs": "Forte demande",
            "translation": "Évolue vite",
            "uiux": "Tendance cette semaine"
        },
        "trendingTags": {
            "logoDesign": "Création de logo",
            "reactJs": "React JS",
            "translation": "Traduction",
            "uiux": "UI/UX"
        }
    },
    "selection": {
        "cancel": "Annuler",
        "completionRate": "Taux de réussite",
        "confirmSelection": "Êtes-vous sûr?",
        "hours": "heures",
        "jobsCompleted": "missions",
        "matchScore": "Correspondance",
        "noSamples": "Pas d'exemples",
        "noVoice": "Pas de présentation vocale",
        "readMore": "Lire plus",
        "responseTimeLabel": "Répond en",
        "select": "Choisir",
        "startWork": "Oui, commencer",
        "topMatches": "Les 3 meilleurs freelances pour votre mission",
        "viewFullProfile": "Voir le profil complet",
        "voiceIntro": "Présentation vocale",
        "workSamples": "Exemples de travaux"
    },
    "seo": {
        "faq": {
            "description": "Retrouvez des réponses sur les paiements, l'escrow, la vérification d'identité et le fonctionnement de WorkedIn.",
            "title": "Questions fréquentes"
        },
        "findFreelancers": {
            "description": "Trouvez 2 500+ développeurs, designers, traducteurs et consultants tunisiens vérifiés, notés et disponibles.",
            "title": "Trouvez des professionnels tunisiens vérifiés"
        },
        "forClients": {
            "description": "Publiez gratuitement, recevez des propositions de professionnels vérifiés et payez uniquement à la validation.",
            "title": "Recrutez des talents tunisiens vérifiés"
        },
        "freelancerProfile": {
            "addSkillPlaceholder": "Ajouter une compétence...",
            "descriptionFallback": "Freelance sur la plateforme WorkedIn",
            "titleSuffix": "Freelance sur WorkedIn",
            "typeSkillPlaceholder": "Saisissez une compétence puis appuyez sur Entrée..."
        },
        "home": {
            "description": "Connectez-vous avec des professionnels tunisiens vérifiés pour vos projets. Paiements sécurisés en TND et protection escrow.",
            "title": "WorkedIn"
        },
        "howItWorks": {
            "description": "Découvrez comment WorkedIn vous fait passer de l'idée au paiement validé en quatre étapes protégées.",
            "title": "Comment fonctionne WorkedIn"
        },
        "jobBoard": {
            "description": "Parcourez les missions freelance en Tunisie et trouvez des projets adaptés à vos compétences, votre tarif et votre disponibilité.",
            "title": "Missions freelance"
        },
        "jobDetail": {
            "descriptionFallback": "Consultez les détails du projet, le budget et les exigences avant de postuler.",
            "titleSuffix": "Détails du projet"
        },
        "login": {
            "description": "Connectez-vous à votre compte WorkedIn pour gérer vos projets, messages et paiements.",
            "title": "Connectez-vous à WorkedIn"
        },
        "notifications": {
            "description": "Vos notifications",
            "title": "Notifications | WorkedIn"
        },
        "signup": {
            "description": "Créez votre compte et rejoignez 2 500+ professionnels qui développent leur carrière sur WorkedIn.",
            "title": "Créez votre compte WorkedIn"
        }
    },
    "settings": {
        "account": "Compte",
        "accountOverview": "Vue du compte",
        "accountOverviewDescription": "Cet onglet est le point de contrôle du fonctionnement de votre compte. Allez à Profil quand vous voulez modifier les détails ou changer la disponibilité de l'espace de travail.",
        "accountOverviewTitle": "Votre identité d'espace de travail et votre statut de configuration",
        "accountTabHint": "Mettez à jour vos informations et votre espace de travail",
        "accountType": "Type de compte",
        "accountTypeBoth": "Les deux",
        "accountTypeBothDesc": "Utiliser les deux modes",
        "accountTypeClient": "Client",
        "accountTypeClientDesc": "Recruter des freelances",
        "accountTypeFreelancer": "Freelance",
        "accountTypeFreelancerDesc": "Proposer mes services",
        "accountTypeUnknown": "Non défini",
        "accountVerificationTitle": "Account Verification & Trust",
        "activeContext": "Contexte actif",
        "activeSessionsMessage": "Cet appareil est votre seule session active",
        "activeSessionsTitle": "Sessions actives",
        "add": "Ajouter",
        "addMethod": "Ajouter une méthode",
        "addPassword": "Ajouter un mot de passe",
        "addPaymentMethod": "Ajouter une méthode",
        "addPaymentMethodModalTitle": "Ajouter une méthode de paiement",
        "bankAccountNumber": "Numéro de compte bancaire",
        "bankTransfer": "Virement bancaire",
        "bioLabel": "Biographie",
        "bioPlaceholder": "Écrivez une courte biographie...",
        "changePassword": "Changer le mot de passe",
        "changePasswordTitle": "Changer le mot de passe",
        "cinVerification": "Vérification CIN",
        "completeProfile": "Compléter votre profil",
        "completion": {
            "accountType": "Type de compte",
            "avatar": "Photo de profil",
            "bio": "Bio",
            "fullName": "Nom",
            "identityVerification": "Vérification d'identité",
            "location": "Localisation",
            "onboarding": "Intégration"
        },
        "confirmPassword": "Confirmer le mot de passe",
        "currentPassword": "Mot de passe actuel",
        "currentWorkspace": "Espace de travail actuel",
        "default": "Par défaut",
        "deleteAccount": "Supprimer le compte",
        "deleteAccountConfirmAction": "Oui, supprimer mon compte",
        "deleteAccountConfirmMessage": "Êtes-vous sûr de vouloir supprimer votre compte ? Toutes vos données seront supprimées définitivement.",
        "deleteAccountConfirmTitle": "Confirmer la suppression du compte",
        "deleteAccountDescription": "Votre compte et toutes vos données seront supprimés définitivement. Cette action est irréversible.",
        "deleteAccountTitle": "Supprimer le compte",
        "deleteMyAccount": "Supprimer mon compte",
        "deletePaymentMethod": "Supprimer {{label}}",
        "deleteWarning": "Cette action est irréversible",
        "deletingRequestSubmitting": "Submitting...",
        "deliveryMethod": {
            "email": "Email",
            "inApp": "Dans l'app uniquement",
            "sms": "SMS"
        },
        "discard": "Discard",
        "editProfile": "Edit Profile",
        "emailOptionalLabel": "Email (optionnel)",
        "emailPlaceholder": "email@example.com",
        "fullName": "Nom complet",
        "globalPermission": "Autorisation globale",
        "goToDashboard": "Aller au tableau de bord",
        "goToDashboardDescription": "Retournez à votre espace de travail",
        "goToProfile": "Modifier le profil",
        "heroDescription": "Gardez les détails du compte, la sécurité, les paiements et le comportement des notifications sur une surface de contrôle cohérente. Mettez à jour ce qui compte sans perdre votre place dans le produit.",
        "identityPending": "En cours de révision",
        "identityVerificationTitle": "Vérification d'identité",
        "identityVerified": "Identité vérifiée",
        "language": "Langue",
        "location": "Localisation",
        "logout": "Se déconnecter",
        "moreRequired": "+{{count}} autres",
        "newPassword": "Nouveau mot de passe",
        "noBio": "No bio added yet",
        "noPasswordMessage": "Aucun mot de passe défini - vous utilisez la connexion par téléphone",
        "noPasswordOAuth": "Connecté via {{provider}} — aucun mot de passe requis",
        "noPaymentMethods": "Aucune méthode de paiement n'a été ajoutée pour l'instant",
        "noPaymentMethodsDescription": "Ajoutez une méthode de retrait maintenant pour que les contrats, les revenus et les retraits soient prêts quand vous en avez besoin. Sécurisé et chiffré.",
        "notificationChannel": "Canaux",
        "notificationSettings": {
            "contractUpdates": "Mises à jour des contrats",
            "marketing": "Offres et mises à jour",
            "marketingDesc": "Conseils et mises à jour de WorkedIn",
            "newMatches": "Nouvelles missions",
            "newMatchesDesc": "Recevez une notification quand des missions correspondent à vos compétences",
            "newMessages": "Nouveaux messages",
            "newMessagesDesc": "Recevez une notification lorsque vous recevez de nouveaux messages",
            "payments": "Paiements",
            "paymentsDesc": "Recevez une notification lorsque vous envoyez ou recevez des paiements",
            "platformNews": "Actualités de la plateforme",
            "reviews": "Avis",
            "reviewsDesc": "Recevez une notification lorsque vous recevez un nouvel avis"
        },
        "notifications": "Notifications",
        "notificationsEnabled": "Règles actives",
        "notificationsSubtitle": "Choisissez les notifications que vous souhaitez recevoir",
        "notificationsTotal": "Vitesse de livraison",
        "oauthPasswordMessage": "Vous vous êtes connecté avec {{provider}}. La gestion du mot de passe est assurée par votre fournisseur d'identité.",
        "onboardingStatus": "Statut d'intégration",
        "pageTitle": "Paramètres",
        "passwordChanged": "Mot de passe mis à jour avec succès",
        "passwordSet": "Le mot de passe est défini",
        "passwordStatus": "État du mot de passe",
        "passwordTooShort": "Le mot de passe doit contenir au moins 8 caractères",
        "passwordUpdateFailed": "Échec de la mise à jour du mot de passe",
        "passwordsDoNotMatch": "Les mots de passe ne correspondent pas",
        "payment": "Paiement",
        "paymentDetails": "Détails du paiement",
        "paymentMethodType": "Type de méthode de paiement",
        "paymentMethods": "Méthodes de paiement",
        "paymentMethodsCount": "Méthodes enregistrées",
        "paymentSubtitle": "Méthodes de paiement et de retrait",
        "pending": "En attente",
        "phoneNumber": "Numéro de téléphone",
        "phoneNumberLabel": "Numéro de téléphone",
        "phoneUnverifiedBadge": "Add a number to show a phone-verified trust badge on job posts & profiles",
        "phoneVerifiedBadge": "Verified for project and transaction notifications",
        "preferredMethod": "Méthode préférée",
        "privacy": "Confidentialité",
        "privacySettings": {
            "activeContracts": "Contrats actifs uniquement",
            "anyone": "Tout le monde",
            "hidden": "Caché",
            "profileVisibility": "Visibilité du profil",
            "public": "Public",
            "showEarnings": "Afficher les gains à tous",
            "whoCanMessage": "Qui peut vous contacter"
        },
        "profile": "Profil",
        "profileComplete": "Profil complet",
        "profileCompletion": "Complétion du profil",
        "profileCompletionTitle": "Progression du profil",
        "profileDetailsTitle": "Profile Details",
        "profileReadiness": "Disponibilité du profil",
        "profileTabs": {
            "basic": "Basic Info",
            "client": "Client",
            "freelancer": "Freelancer",
            "workspace": "Workspace"
        },
        "quickActions": "Actions rapides",
        "readyForTransactions": "Prêt pour les transactions",
        "requiredLabel": "Requis :",
        "reviewNotifications": "Gérer les notifications",
        "reviewNotificationsDescription": "Contrôlez vos alertes",
        "save": "Enregistrer",
        "saveAll": "Save all changes",
        "saveChanges": "Enregistrer les modifications",
        "saved": "Enregistré",
        "saving": "Saving...",
        "securityPosture": "Position de sécurité",
        "securityPostureValue": "Protégé par les contrôles de session du compte",
        "setDefault": "Définir par défaut",
        "setupStatus": {
            "allDone": "Toutes les étapes de configuration requises sont terminées.",
            "complete": "Complet",
            "done": "Terminé",
            "identityVerification": "Vérification d'identité",
            "pending": "En attente",
            "profileBasics": "Bases du profil",
            "workspaceSetup": "Configuration de l'espace de travail"
        },
        "signOutAllDevices": "Se déconnecter de tous les appareils",
        "tabDescriptions": {
            "account": "Mode d'espace de travail, aperçu du compte et guide de configuration.",
            "notifications": "Choisissez ce qui vous parvient et à quelle fréquence.",
            "payment": "Méthodes de retrait, paramètres par défaut et détails prêts pour les transactions.",
            "profile": "Identité, biographie, avatar et disponibilité de l'espace de travail.",
            "security": "Contrôle de session, sécurité du compte et actions destructrices."
        },
        "toasts": {
            "avatarUpdateError": "Échec du téléversement de la photo de profil",
            "avatarUpdated": "Photo de profil mise à jour",
            "defaultPaymentUpdated": "Méthode de paiement par défaut mise à jour",
            "deleteRequestAlreadyOpen": "You already have an active account deletion request under review.",
            "deleteRequestSent": "Votre demande de suppression de compte a été envoyée. Elle sera traitée sous 48 heures.",
            "genericError": "Une erreur est survenue",
            "invalidPhone": "Please enter a valid phone number.",
            "paymentAddError": "Échec de l'ajout de la méthode de paiement",
            "paymentAdded": "Méthode de paiement ajoutée",
            "paymentDeleteError": "Échec de la suppression de la méthode de paiement",
            "paymentDeleted": "Méthode de paiement supprimée",
            "phoneTaken": "Phone number already in use.",
            "profileSaveError": "Échec de l'enregistrement des modifications du profil",
            "profileSaved": "Profil mis à jour avec succès",
            "workspaceBothEnabled": "Les deux espaces de travail sont maintenant activés sur votre compte.",
            "workspaceUpdated": "Espace de travail mis à jour avec succès."
        },
        "toggleNotification": "Basculer {{label}}",
        "unsavedChanges": "You have unsaved changes",
        "updatePassword": "Mettre à jour le mot de passe",
        "updatingPassword": "Mise à jour...",
        "uploadCin": "Télécharger la CIN",
        "userFallback": "Utilisateur",
        "verified": "Vérifié",
        "verifiedLoginEmail": "Verified Login Email",
        "verifyIdentity": "Vérifier votre identité",
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
        "items": [{"name":"Mohamed Ali","role":"Graphiste","quote":"Grâce à WorkedIn.tn, j'ai gagné plus de 5000 TND en seulement 2 mois. La plateforme est facile à utiliser et le paiement est rapide.","earned":"5,200","image":"https://i.pravatar.cc/150?img=11"},{"name":"Fatima Ben Said","role":"Traductrice","quote":"La meilleure plateforme de talents en Tunisie. Pas d'enchères, les clients me trouvent automatiquement.","earned":"3,800","image":"https://i.pravatar.cc/150?img=32"},{"name":"Ahmed El Hadi","role":"Développeur Web","quote":"Le paiement local a tout facilité. D17 ou virement bancaire, toutes les méthodes sont disponibles.","earned":"8,500","image":"https://i.pravatar.cc/150?img=53"}],
        "title": "Histoires de réussite"
    },
    "time": {
        "days": "Days",
        "hours": "Hours",
        "lessThanHour": "Just now"
    },
    "toast": {
        "close": "Fermer",
        "error": "Erreur",
        "info": "Info",
        "success": "Succès",
        "warning": "Avertissement"
    },
    "toasts": {
        "common": {
            "error": "Une erreur est survenue",
            "genericError": "Erreur",
            "success": "Opération réussie"
        },
        "contract": {
            "acceptError": "Échec de l'acceptation",
            "acceptSuccess": "Travail accepté et paiement libéré !",
            "deliverError": "Échec de la livraison",
            "deliverSuccess": "Travail livré avec succès !",
            "disputeError": "Échec de l'ouverture du litige",
            "disputeSuccess": "Litige ouvert. Sera examiné sous 48 heures.",
            "requestChanges": "Demander des modifications",
            "requestChangesSuccess": "Demande envoyée",
            "reviewSuccess": "Votre avis soumis avec succès"
        },
        "forgotPassword": {
            "linkSent": "Lien envoyé",
            "rateLimitError": "Trop de tentatives. Veuillez réessayer plus tard."
        },
        "job": {
            "linkCopied": "Lien copié",
            "loginRequired": "Connectez-vous pour sauvegarder",
            "saved": "Offre sauvegardée",
            "unsaved": "Offre retirée des sauvegardées"
        },
        "matches": {
            "contractError": "Échec de la création du contrat",
            "contractSuccess": "Contrat démarré avec succès !",
            "searchError": "Échec de la recherche"
        },
        "portfolio": {
            "addSuccess": "Travail ajouté avec succès",
            "deleteError": "Échec de la suppression",
            "deleteSuccess": "Travail supprimé avec succès",
            "loadError": "Échec du chargement du portfolio",
            "saveError": "Échec de la sauvegarde",
            "updateSuccess": "Portfolio mis à jour avec succès"
        },
        "proposals": {
            "archiveError": "Échec de l'archivage",
            "archiveSuccess": "Proposition archivée",
            "hireError": "Échec de l'embauche. Veuillez réessayer",
            "hireFirstMessage": "Vous devez d'abord embaucher le freelance pour démarrer une conversation",
            "hireSuccess": "Freelance embauché avec succès !",
            "loadError": "Échec du chargement des propositions",
            "loadJobError": "Échec du chargement des détails",
            "shortlistAdded": "Ajouté à la liste courte",
            "shortlistError": "Échec de la mise à jour de la liste",
            "shortlistRemoved": "Retiré de la liste courte",
            "submitSuccess": "Proposition soumise avec succès !",
            "withdrawError": "Échec du retrait",
            "withdrawSuccess": "Proposition retirée avec succès"
        },
        "resetPassword": {
            "linkExpired": "Lien expiré",
            "success": "Mot de passe changé avec succès"
        }
    },
    "ui": {
        "addNow": "Add now",
        "admin": "ADMIN",
        "avatar": "Avatar",
        "back": "back",
        "basic_empty_state": "Basic Empty State",
        "basic_progress": "Basic Progress",
        "cancel": "Annuler",
        "card_skeleton": "Card Skeleton",
        "change": "Change",
        "circular_skeleton": "Circular Skeleton",
        "coming_soon": "Bientôt",
        "complete": "complete",
        "contact_workedin_tn": "contact@workedin.tn",
        "ctrl_k": "Ctrl+K",
        "custom_label": "Custom Label",
        "default": "Default",
        "delivered": "Delivered",
        "e_g": "e.g. 50",
        "edit": "Modifier",
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
        "iban": "Numéro IBAN",
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
        "playing": "Lecture...",
        "popular": "Popular",
        "preview": "Preview",
        "privacy_workedin_tn": "privacy@workedin.tn",
        "progress": "Progress",
        "progress_bar": "Progress Bar",
        "read": "Read",
        "recommended": "Recommandé",
        "recording": "Recording:",
        "rectangular_skeleton": "Rectangular Skeleton",
        "s": "s",
        "save": "Enregistrer",
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
            "close": "Fermer"
        },
        "uploading_files": "Uploading files...",
        "variants": "Variants",
        "verified": "Vérifié",
        "warning": "Warning",
        "with_action": "With Action",
        "with_label": "With Label",
        "with_secondary_action": "With Secondary Action",
        "worked": "WORKED",
        "workedin": "WorkedIn •",
        "xx_xxx_xxx": "+216 XX XXX XXX"
    },
    "valuePropositions": {
        "badge": "Pourquoi WorkedIn",
        "heading": "Construit différemment. Pour la Tunisie.",
        "matched": {
            "description": "Postulez pour des projets qui correspondent exactement à votre niveau de compétence et votre tarif. Pas de concurrence sur le prix - juste sur la qualité.",
            "title": "Travail adapté"
        },
        "protected": {
            "description": "Les fonds sont mis sous séquestre avant le début du travail. Vous êtes payé au moment où le client approuve.",
            "title": "Paiements protégés"
        },
        "reputation": {
            "description": "Affichez votre statut vérifié, votre portefeuille et vos avis. Gagnez la confiance avant de dire un mot.",
            "title": "Construire une réputation"
        }
    },
    "values": {
        "localPayment": {
            "description": "TND, D17 et moyens adaptés au marché tunisien",
            "title": "Paiement local"
        },
        "microJobs": {
            "description": "Des missions rapides aux contrats plus ambitieux",
            "title": "Vrais projets"
        },
        "noBidding": {
            "description": "Un bon profil et un matching intelligent plutôt qu’une guerre des prix",
            "title": "Sans enchères"
        }
    },
    "verifyEmail": {
        "checkSpam": "Si vous ne voyez pas l'email, vérifiez votre dossier spam.",
        "noEmail": "L'adresse email est requise",
        "resend": "Renvoyer l'email de vérification",
        "resendCooldown": "Renvoyer dans {{seconds}} secondes",
        "resendSuccess": "Email de vérification envoyé avec succès",
        "subtitle": "Nous avons envoyé un lien de vérification à {{email}}. Cliquez dessus pour activer votre compte.",
        "title": "Vérifiez votre email",
        "wrongEmail": "Mauvais email? Retour à l'inscription"
    },
    "verifyIdentity": {
        "backToSettings": "Retour aux paramètres",
        "changeImage": "Changer",
        "dragDropHint": "ou glissez-déposez ici",
        "errors": {
            "alreadySubmitted": "Vous avez déjà une demande de vérification.",
            "alreadyUnderReview": "Your verification request is already under review.",
            "alreadyVerified": "Your identity is already verified.",
            "fileReadFailed": "Impossible de lire ce fichier. Veuillez essayer une autre image.",
            "fileTooLarge": "Le fichier est trop volumineux (maximum 5MB)",
            "insertTimeout": "L'insertion en base a expiré après 30 secondes. Supabase est peut-être en maintenance.",
            "invalidCin": "Le numéro de carte doit contenir 8 chiffres",
            "invalidImage": "Veuillez téléverser une image valide",
            "lowResolution": "La résolution de l'image est trop faible. Utilisez une photo plus claire.",
            "missingImages": "Veuillez téléverser toutes les images requises",
            "noSession": "Aucune session active - veuillez vous reconnecter",
            "permissions": "Permission refusée. Veuillez vous déconnecter puis vous reconnecter.",
            "resubmitBlocked": "Unable to reset your previous request. Please contact support.",
            "unexpected": "Une erreur inattendue est survenue",
            "withMessage": "Erreur : {{message}}"
        },
        "fileFormatHint": "JPG, PNG (Max 5MB)",
        "goToDashboard": "Aller au tableau de bord",
        "header": {
            "eta": "Prend environ 2-3 minutes à compléter",
            "kicker": "Mise à niveau sécurisée du compte",
            "subtitle": "Une seule étape pour renforcer la confiance de vos clients et protéger votre compte",
            "title": "Vérification d'identité"
        },
        "loginAgainError": "Veuillez vous reconnecter",
        "pending": {
            "badge": "En cours de révision",
            "description": "Votre demande de vérification d'identité a été reçue avec succès. Notre équipe examine vos documents.",
            "emailNotice": "Vous serez notifié dès la fin de la révision",
            "reviewTime": "Délai de révision : jusqu'à 24 heures",
            "seoDescription": "Votre demande de vérification d'identité est en cours de traitement",
            "seoTitle": "Demande de vérification en cours",
            "title": "Votre demande est en cours de révision"
        },
        "preview": "Aperçu",
        "processing": "Traitement...",
        "progress": {
            "back": "Verso",
            "front": "Recto",
            "review": "Vérification",
            "selfie": "Selfie"
        },
        "removeImage": "Supprimer",
        "review": {
            "backImage": "Verso",
            "checkBack": "Image verso ajoutée",
            "checkCin": "Numéro CIN valide",
            "checkConsent": "Consentement de confidentialité accepté",
            "checkFront": "Image recto ajoutée",
            "checkSelfie": "Selfie ajouté",
            "cinLabel": "Numéro de carte d'identité (8 chiffres)",
            "cinPlaceholder": "12345678",
            "consentPrefix": "J'accepte l'utilisation de mes informations personnelles pour vérifier mon identité conformément à la ",
            "editBack": "Modifier l'image verso",
            "editFront": "Modifier l'image recto",
            "editSelfie": "Modifier le selfie",
            "frontImage": "Recto",
            "privacyNotice": "Vos données sont stockées de manière sécurisée et chiffrée. Vos informations d'identité ne seront partagées avec aucun tiers et sont utilisées uniquement pour la vérification du compte.",
            "privacyPolicy": "Politique de confidentialité",
            "readiness": "Score de préparation",
            "selfieImage": "Selfie",
            "submit": "Confirmer et envoyer",
            "submitting": "Envoi en cours...",
            "title": "Vérifier les informations"
        },
        "security": {
            "desc": "Vos documents sont chiffrés et utilisés uniquement pour la vérification du compte.",
            "qualityDesc": "Nous validons le format, la taille et la qualité de base de l'image avant téléversement.",
            "qualityTitle": "Vérifications qualité intelligentes",
            "reviewDesc": "La plupart des demandes de vérification sont traitées sous 24 heures.",
            "reviewTitle": "Révision rapide",
            "title": "Stockage chiffré"
        },
        "seo": {
            "description": "Vérifiez votre identité pour renforcer la confiance des clients et débloquer toutes les fonctionnalités",
            "title": "Vérification d'identité"
        },
        "stepCounter": "Étape {{current}} sur {{total}}",
        "steps": {
            "back": {
                "description": "Veuillez téléverser une image claire du verso de votre carte d'identité nationale",
                "title": "Verso de la carte d'identité"
            },
            "front": {
                "description": "Veuillez téléverser une image claire du recto de votre carte d'identité nationale",
                "title": "Recto de la carte d'identité"
            },
            "selfie": {
                "description": "Veuillez prendre un selfie clair pour vérifier votre identité",
                "title": "Photo selfie"
            }
        },
        "submitted": {
            "description": "Notre équipe examinera vos documents et vous répondra dès que possible (généralement sous 24h). Nous vous notifierons par e-mail une fois la révision terminée.",
            "seoDescription": "Votre demande de vérification d'identité a été reçue",
            "seoTitle": "Demande envoyée",
            "title": "Votre demande a été reçue avec succès"
        },
        "success": {
            "submitted": "Demande de vérification envoyée avec succès"
        },
        "tipLabel": "Astuce :",
        "tips": {
            "back": "Assurez-vous que tous les bords et numéros soient visibles et nets.",
            "front": "Placez la carte sur un fond sombre et évitez les reflets du flash.",
            "selfie": "Regardez l'appareil photo dans un bon éclairage et évitez chapeaux ou lunettes de soleil."
        },
        "uploadHint": "Cliquez pour téléverser une image",
        "verified": {
            "description": "Votre compte est maintenant vérifié et vous avez obtenu le badge de vérification bleu. Vous pouvez désormais profiter de toutes les fonctionnalités.",
            "title": "Votre identité a été vérifiée avec succès"
        }
    },
    "wallet": {
        "accHolderName": "Nom du titulaire",
        "accountHolder": "Nom du titulaire du compte",
        "activeEscrow": "Active Escrow",
        "addedToWallet": "Added to wallet",
        "amount": "Montant",
        "available": "Disponible",
        "availableBalance": "Solde Disponible",
        "balance": "Solde Disponible",
        "bankName": "Nom de la banque",
        "bankTransfer": "Virement Bancaire",
        "bankTransferDesc": "Retirer directement vers votre compte bancaire local",
        "cancel": "Annuler",
        "clearingHold": "Clearing Hold",
        "comingSoonLabel": "Bientot",
        "continueToPayment": "Continuer vers le paiement",
        "d17": "D17",
        "d17Desc": "Retirer via D17. Bientôt disponible.",
        "date": "Date",
        "deposit": "Ajouter des fonds",
        "depositAmountError": "Le montant doit etre entre {{min}} et {{max}} TND",
        "depositAmountLabel": "Montant du depot (TND)",
        "depositLimits": "Min: 10 TND - Max: 5,000 TND",
        "depositPreview": "Deposit Preview",
        "description": "Description",
        "earningsGrowth": "Croissance des gains",
        "enterPhone": "Veuillez entrer le numéro de téléphone",
        "errors": {
            "accountHolderRequired": "Le nom du titulaire du compte est requis",
            "bankNameRequired": "Le nom de la banque est requis",
            "ibanInvalid": "L'IBAN doit commencer par TN",
            "ibanRequired": "L'IBAN est requis",
            "phoneInvalid": "Entrez un numero de telephone valide",
            "phoneRequired": "Le numero de telephone est requis"
        },
        "fillBankDetails": "Veuillez remplir toutes les coordonnées bancaires",
        "flouci": "Flouci",
        "flouciDesc": "Retirer via le portefeuille mobile Flouci. Bientôt disponible.",
        "free": "Free",
        "frozenDisputed": "Frozen Disputed",
        "fullPaymentHistory": "Historique complet des paiements",
        "genericError": "Une erreur est survenue. Veuillez reessayer.",
        "howItWorksTitle": "Comment ça marche",
        "iban": "IBAN",
        "inReview": "In Review",
        "invalidAmount": "Montant invalide",
        "locked": "Locked",
        "lockedFunds": "Calendrier des fonds bloqués",
        "lockedFundsTitle": "Calendrier des fonds bloqués",
        "method": "Méthode de Retrait",
        "minAmount": "Min {{min}} TND",
        "minWithdrawalNotice": "Le retrait minimum est de {{min}} TND. Les demandes sont examinées manuellement avant traitement.",
        "mockDepositFailed": "Échec du dépôt fictif sur le portefeuille",
        "monthlyBillingVolume": "Volume de facturation mensuel généré (6 derniers mois)",
        "monthlyFundingVolume": "Volume de financement mensuel dépensé (6 derniers mois)",
        "moreMethodsSoon": "D'autres moyens de paiement seront bientot disponibles.",
        "moveEarnings": "Transférer les gains vers la banque",
        "netAmount": "Montant Net",
        "next": "Suivant",
        "noLockedFunds": "Aucun fonds bloqué",
        "noPaymentLink": "Le lien de paiement n'a pas ete genere",
        "noTransactions": "Aucune transaction",
        "noTransactionsDesc": "Votre historique de transactions apparaîtra ici",
        "noWithdrawals": "Aucun retrait",
        "noWithdrawalsDesc": "Demandez un retrait pour le voir ici",
        "notAuthenticated": "Non authentifié",
        "pageOf": "Page {{page}} sur {{totalPages}}",
        "paymentMethod": "Methode de paiement",
        "pendingBalance": "En Attente dans l'Escrow",
        "phone": "Numéro de Téléphone",
        "platformFeeNotice": "Frais de plateforme (~1%)",
        "previous": "Précédent",
        "processingDeposit": "Traitement...",
        "processingFee": "Processing fee",
        "quickAmounts": "Quick Amounts",
        "recentTransactions": "Transactions récentes",
        "requestWithdrawal": "Demander un Retrait",
        "seo": {
            "description": "Suivez votre solde, vos transactions et vos demandes de retrait.",
            "title": "Portefeuille"
        },
        "spendingHistory": "Historique des dépenses",
        "status": {
            "approved": "Approuvé",
            "completed": "Terminé",
            "pending": "En Attente",
            "processing": "En Traitement",
            "rejected": "Rejeté"
        },
        "statusLabel": "Statut",
        "steps": {
            "review": "Examen (2 à 5 jours)",
            "reviewDesc": "Notre équipe vérifie votre demande",
            "submitRequest": "Soumettre la demande",
            "submitRequestDesc": "Remplissez et soumettez les détails de votre retrait",
            "transferSent": "Transfert envoyé",
            "transferSentDesc": "Les fonds arrivent sur votre compte"
        },
        "submit": "Soumettre",
        "submitWithdrawal": "Soumettre la Demande de Retrait",
        "submitting": "Envoi en cours...",
        "summary": "Résumé",
        "tabs": {
            "deposit": "Déposer",
            "overview": "Vue d'ensemble",
            "transactions": "Transactions",
            "withdraw": "Retirer"
        },
        "title": "Mon Portefeuille",
        "topUpWallet": "Recharger votre portefeuille",
        "topUpWalletDesc": "Top up your wallet securely via escrow",
        "totalEarned": "Total Gagné",
        "totalWithdrawn": "Total Retiré",
        "transactionHistory": "Historique des Transactions",
        "transactionLabel": "Transaction",
        "transferEarningsDesc": "Transférer les gains vers votre méthode de paiement",
        "type": "Type",
        "unknownUser": "Unknown User",
        "viewAllArrow": "Voir tout →",
        "whyEscrow": "Why Dhmad Escrow?",
        "whyEscrow1": "Funds held securely until work approved",
        "whyEscrow2": "Dispute resolution built in",
        "whyEscrow3": "Zero deposit fees — pay only what you deposit",
        "withdrawalAmount": "Montant du retrait",
        "withdrawalError": "Échec de la soumission de la demande de retrait",
        "withdrawalHistory": "Historique des Retraits",
        "withdrawalSubmittedDesc": "Votre demande sera examinée sous 2 à 5 jours ouvrables",
        "withdrawalSubmittedTitle": "Demande de Retrait Soumise",
        "withdrawalSuccess": "Demande de retrait soumise avec succès",
        "youPay": "You pay",
        "youReceive": "Vous recevez",
        "youWithdraw": "Vous retirez"
    }
};
