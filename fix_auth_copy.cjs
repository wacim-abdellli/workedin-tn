const fs = require('fs');

['en.ts', 'fr.ts', 'ar.ts'].forEach(lang => {
    let content = fs.readFileSync('src/i18n/' + lang, 'utf8');

    if (lang === 'en.ts') {
        content = content.replace(/badge: 'Trusted freelance marketplace'/, "badge: 'Khedma TN'");
        content = content.replace(/heroTitle: 'Sign in without the clutter and get back to work fast.'/, "heroTitle: 'Welcome back. Let\\'s get to work.'");
        content = content.replace(/heroDescription: 'A calmer auth flow for clients and freelancers, with clearer states, trusted payments, and workspace switching that stays out of your way.'/, "heroDescription: 'Access your workspace, manage projects securely, and connect with top talent across Tunisia.'");
        
        content = content.replace(/highlightTrustTitle: 'Verified identities'/, "highlightTrustTitle: 'Verified Profiles'");
        content = content.replace(/highlightTrustDescription: 'Profiles, contracts, and verification signals stay visible across your workspace.'/, "highlightTrustDescription: 'Work with confidence. Every profile and skill is verified.'");
        
        content = content.replace(/highlightPaymentsTitle: 'Protected transactions'/, "highlightPaymentsTitle: 'Secure Payments'");
        content = content.replace(/highlightPaymentsDescription: 'Escrow-first flows keep client payments and freelancer delivery aligned.'/, "highlightPaymentsDescription: 'Funds are held safely until the milestone or project is delivered.'");
        
        content = content.replace(/highlightLocaleTitle: 'Built for Tunisia'/, "highlightLocaleTitle: 'Local & Global'");
        content = content.replace(/highlightLocaleDescription: 'Arabic, French, and English flows tuned for local freelance work.'/, "highlightLocaleDescription: 'Optimized for local talent with fast transactions.'");
    } else if (lang === 'fr.ts') {
        content = content.replace(/badge: 'Plateforme freelance de confiance'/, "badge: 'Khedma TN'");
        content = content.replace(/heroTitle: 'Connectez-vous sans désordre et remettez-vous vite au travail.'/, "heroTitle: 'Bon retour. Au travail.'");
        content = content.replace(/heroDescription: 'Un flux d\\'authentification plus serein pour les clients et les freelances, avec des statuts plus clairs, des paiements de confiance et des changements d\\'espace de travail qui ne vous gênent pas.'/, "heroDescription: 'Accédez à votre espace de travail, gérez vos projets et connectez-vous avec les meilleurs talents tunisiens.'");
        
        content = content.replace(/highlightTrustTitle: 'Identités vérifiées'/, "highlightTrustTitle: 'Profils Vérifiés'");
        content = content.replace(/highlightTrustDescription: 'Les profils, les contrats et les signaux de vérification restent visibles dans tout votre espace de travail.'/, "highlightTrustDescription: 'Travaillez en toute confiance. Chaque profil est vérifié pour plus de fiabilité.'");
        
        content = content.replace(/highlightPaymentsTitle: 'Transactions protégées'/, "highlightPaymentsTitle: 'Paiements Sécurisés'");
        content = content.replace(/highlightPaymentsDescription: 'Les flux basés sur l\\'entiercement maintiennent l\\'alignement entre les paiements des clients et la livraison des freelances.'/, "highlightPaymentsDescription: 'Les fonds sont conservés en toute sécurité jusqu\\'à la livraison du projet.'");
        
        content = content.replace(/highlightLocaleTitle: 'Construit pour la Tunisie'/, "highlightLocaleTitle: 'Local et Global'");
        content = content.replace(/highlightLocaleDescription: 'Flux en arabe, français et anglais adaptés au travail de freelance local.'/, "highlightLocaleDescription: 'Optimisé pour les talents locaux et internationaux.'");
    } else if (lang === 'ar.ts') {
        content = content.replace(/badge: 'منصة العمل الحر الموثوقة'/, "badge: 'Khedma TN'");
        content = content.replace(/heroTitle: 'سجل الدخول بدون فوضى وعد للعمل بسرعة.'/, "heroTitle: 'مرحباً بعودتك. لننطلق.'");
        content = content.replace(/heroDescription: 'مسار مصادقة أهدأ للعملاء والمستقلين، مع حالات أوضح، ومدفوعات موثوقة، وتبديل بين مساحات العمل لا يعيقك.'/, "heroDescription: 'قم بالوصول إلى مساحة عملك، وأدر مشاريعك، وتواصل مع أفضل المواهب في تونس.'");
        
        content = content.replace(/highlightTrustTitle: 'هويات تم التحقق منها'/, "highlightTrustTitle: 'ملفات تعريف موثقة'");
        content = content.replace(/highlightTrustDescription: 'الملفات الشخصية، والعقود، وعلامات التحقق تبقى مرئية عبر مساحة عملك.'/, "highlightTrustDescription: 'اعمل بثقة؛ يتم التحقق من كل ملف شخصي قبل قبوله.'");
        
        content = content.replace(/highlightPaymentsTitle: 'معاملات محمية'/, "highlightPaymentsTitle: 'مدفوعات آمنة'");
        content = content.replace(/highlightPaymentsDescription: 'مسارات تعتمد على الضمان أولاً تحافظ على توافق مدفوعات العملاء مع تسليم المستقل.'/, "highlightPaymentsDescription: 'يتم الاحتفاظ بالأموال بأمان حتى يتم إنجاز العمل المطلوب.'");
        
        content = content.replace(/highlightLocaleTitle: 'صُنع لتونس'/, "highlightLocaleTitle: 'إلى العالمية'");
        content = content.replace(/highlightLocaleDescription: 'مسارات باللغات العربية والفرنسية والإنجليزية مصممة للعمل الحر المحلي.'/, "highlightLocaleDescription: 'مصمم خصيصاً ليناسب الكفاءات المحلية مع دعم المعاملات السريعة.'");
    }

    fs.writeFileSync('src/i18n/' + lang, content, 'utf8');
});