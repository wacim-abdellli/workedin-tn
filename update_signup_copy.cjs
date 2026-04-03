const fs = require('fs');

['en.ts', 'fr.ts', 'ar.ts'].forEach(lang => {
    let content = fs.readFileSync('src/i18n/' + lang, 'utf8');

    if (lang === 'en.ts') {
        content = content.replace(/badge: 'Launch your workspace'/, "badge: 'Join Khedma TN'");
        content = content.replace(/heroTitle: 'Create a sharper first impression for every project you start.'/, "heroTitle: 'Ready for your next big project?'");
        content = content.replace(/heroDescription: 'Choose your role, set up your workspace, and move into onboarding with a cleaner, more focused auth experience.'/, "heroDescription: 'Join thousands of professionals across Tunisia. Set up your workspace and start working in minutes.'");
        
        content = content.replace(/highlightRoleTitle: 'Role-first onboarding'/, "highlightRoleTitle: 'Choose Your Path'");
        content = content.replace(/highlightRoleDescription: 'Start as client or freelancer and land in the right workspace from the first step.'/, "highlightRoleDescription: 'Sign up as a freelancer to find work, or a client to hire top talent.'");
        
        content = content.replace(/highlightTrustTitle: 'Trust signals ready'/, "highlightTrustTitle: 'Verified & Secure'");
        content = content.replace(/highlightTrustDescription: 'Verification, identity checks, and profile structure are built into the journey.'/, "highlightTrustDescription: 'Stand out instantly with identity and skill verification built right in.'");
        
        content = content.replace(/highlightWorkTitle: 'Prepared for real work'/, "highlightWorkTitle: 'Built for Speed'");
        content = content.replace(/highlightWorkDescription: 'Move from sign-up to posting jobs, building a profile, and closing contracts faster.'/, "highlightWorkDescription: 'Go from creating an account to landing your first contract fast.'");
        
        content = content.replace(/finishingSignIn: 'Finishing your sign in'/, "finishingSignIn: 'Securing session...'");
        content = content.replace(/finishingSignInDescription: 'We are confirming your secure session and sending you to the right workspace.'/g, "finishingSignInDescription: 'Hang tight while we prepare your workspace.'");
    } else if (lang === 'fr.ts') {
        content = content.replace(/badge: 'Lancez votre espace de travail'/, "badge: 'Rejoignez Khedma TN'");
        content = content.replace(/heroTitle: 'Créez une première impression plus nette pour chaque projet que vous commencez.'/, "heroTitle: 'Prêt pour votre prochain grand projet?'");
        content = content.replace(/heroDescription: 'Choisissez votre rôle, configurez votre espace de travail et passez à l\\'intégration avec une expérience d\\'authentification plus propre et plus concentrée.'/, "heroDescription: 'Rejoignez des milliers de professionnels en Tunisie. Configurez votre espace et commencez en quelques minutes.'");
        
        content = content.replace(/highlightRoleTitle: 'Intégration axée sur le rôle'/, "highlightRoleTitle: 'Choisissez votre voie'");
        content = content.replace(/highlightRoleDescription: 'Commencez en tant que client ou freelance et atterrissez dans le bon espace de travail dès la première étape.'/, "highlightRoleDescription: 'Inscrivez-vous en tant que freelance pour trouver du travail, ou en client pour recruter.'");
        
        content = content.replace(/highlightTrustTitle: 'Signaux de confiance prêts'/, "highlightTrustTitle: 'Vérifié et Sécurisé'");
        content = content.replace(/highlightTrustDescription: 'La vérification, les contrôles d\\'identité et la structure du profil sont intégrés au parcours.'/, "highlightTrustDescription: 'Démarquez-vous instantanément grâce à la vérification d\\'identité et de compétences.'");
        
        content = content.replace(/highlightWorkTitle: 'Préparé pour du vrai travail'/, "highlightWorkTitle: 'Conçu pour la rapidité'");
        content = content.replace(/highlightWorkDescription: 'Passez de l\\'inscription à la publication d\\'offres, à la création d\\'un profil et à la conclusion de contrats plus rapidement.'/, "highlightWorkDescription: 'Passez de la création de compte à votre premier contrat rapidement.'");
        
        content = content.replace(/finishingSignIn: 'Finalisation de votre connexion'/, "finishingSignIn: 'Sécurisation de la session...'");
        content = content.replace(/finishingSignInDescription: 'Nous confirmons votre session sécurisée et vous dirigeons vers le bon espace de travail.'/g, "finishingSignInDescription: 'Patientez un instant pendant que nous préparons votre espace.'");
    } else if (lang === 'ar.ts') {
        content = content.replace(/badge: 'إطلاق مساحة عملك'/, "badge: 'انضم إلى Khedma TN'");
        content = content.replace(/heroTitle: 'اِصنع انطباعاً أولاً أكثر حدة لكل مشروع تبدأه.'/, "heroTitle: 'مستعد لمشروعك الكبير القادم؟'");
        content = content.replace(/heroDescription: 'اختر دورك، وجهز مساحة عملك، وانتقل للإعداد بتجربة مصادقة أنظف وأكثر تركيزاً.'/, "heroDescription: 'انضم لآلاف المحترفين في تونس. قم بإعداد مساحتك وابدأ العمل في دقائق.'");
        
        content = content.replace(/highlightRoleTitle: 'إعداد يعتمد على الدور'/, "highlightRoleTitle: 'اختر مسارك'");
        content = content.replace(/highlightRoleDescription: 'ابدأ كعميل أو مستقل وانتقل لمساحة العمل المناسبة من أول خطوة.'/, "highlightRoleDescription: 'سجل كمستقل لإيجاد عمل، أو كعميل لتوظيف أصحاب الكفاءات.'");
        
        content = content.replace(/highlightTrustTitle: 'إشارات ثقة جاهزة'/, "highlightTrustTitle: 'موثّق وآمن'");
        content = content.replace(/highlightTrustDescription: 'التحقق ومراجعة الهوية وهيكلة الملف الشخصي مدمجة في رحلتك.'/, "highlightTrustDescription: 'تميز فوراً من خلال توثيق هويتك ومهاراتك مباشرة.'");
        
        content = content.replace(/highlightWorkTitle: 'مُعد للعمل الحقيقي'/, "highlightWorkTitle: 'مصمم للسرعة'");
        content = content.replace(/highlightWorkDescription: 'انتقل من التسجيل لنشر الوظائف وبناء الملف الشخصي وإغلاق العقود بشكل أسرع.'/, "highlightWorkDescription: 'انتقل من إنشاء الحساب إلى عقدك الأول في وقت قياسي.'");
        
        content = content.replace(/finishingSignIn: 'إنهاء تسجيل الدخول الخاص بك'/, "finishingSignIn: 'تأمين الجلسة...'");
        content = content.replace(/finishingSignInDescription: 'نحن نؤكد جلستك الآمنة ونوجهك إلى مساحة العمل الصحيحة.'/g, "finishingSignInDescription: 'يرجى الانتظار قليلاً ريثما نجهز مساحة عملك.'");
    }

    fs.writeFileSync('src/i18n/' + lang, content, 'utf8');
});