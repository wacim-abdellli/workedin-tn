const fs = require('fs');
const path = require('path');

const filesToProcess = [
    'src/i18n/en.ts',
    'src/i18n/fr.ts',
    'src/components/common/SEO.tsx',
    
    // Medium priority list
    'src/components/auth/SignupForm.tsx',
    'src/components/common/ComingSoonBanner.tsx',
    'src/services/dhmad.ts',
    'src/hooks/useAuthRateLimit.ts',
    'src/pages/JobPost.tsx',
    'src/pages/FreelancerEarnings.tsx',
    'src/types/payment.ts',
    'src/pages/Terms.tsx',
    'src/pages/Privacy.tsx',
    'src/main.tsx',
    'src/pages/FindFreelancers.tsx',
    'src/pages/ForgotPassword.tsx',
    'src/pages/FreelancerOnboarding.tsx',
    'src/pages/Notifications.tsx',
    'src/pages/Login.tsx',
    'src/pages/JobBoard.tsx',
    'src/pages/Signup.tsx',
    'src/pages/FAQ.tsx',
    'src/components/layout/MobileNav.tsx',
    'src/components/routing/AccountStatusGate.tsx',
    'src/components/settings/NotificationSettings.tsx',
    'src/components/layout/Footer.tsx',
    'src/components/freelancer/ContactModal.tsx',
    'src/components/jobs/JobCard.tsx',
    'src/components/layout/Header/SearchModal.tsx',
    'src/lib/workspaceRoutes.ts',
    'src/pages/AdminDashboard.tsx',
    'src/pages/ClientOnboarding.tsx',
    'src/lib/logger.ts',
    'src/contexts/AuthContext.tsx',
    'src/lib/currencyUtils.ts',
    'src/lib/flouci.ts',
    'src/lib/supabase.ts'
];

// Rules ordered by length descending to properly grab "Khedma TN" before "Khedma"
const rules = [
    { from: /Khedma TN/g, to: 'WorkedIn' },
    { from: /khedma tn/g, to: 'workedin' },
    { from: /Khedmetna/g, to: 'WorkedIn' },
    { from: /khedmetna/g, to: 'workedin' },
    { from: /khedma-tn(?!\.vercel)/g, to: 'workedin' }, // exclude khedma-tn.vercel temporarily if needed, wait, prompt says replace it too
    { from: /Khedma/g, to: 'WorkedIn' },
    { from: /khedma/g, to: 'workedin' }
];

for (const p of filesToProcess) {
    const fullPath = path.join(process.cwd(), p);
    if (!fs.existsSync(fullPath)) {
        console.warn('File not found:', fullPath);
        continue;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    let original = content;

    for (const rule of rules) {
        content = content.replace(rule.from, (match, offset, string) => {
            // Guard against replacing words in specific variable names
            // Let's ensure it's not a function name like useKhedma (already matched by Khedma)
            // But the prompt says "Keep variable names that are part of logic"
            
            // Look backward and forward
            const prevChar = offset > 0 ? string[offset - 1] : '';
            const nextChar = offset + match.length < string.length ? string[offset + match.length] : '';
            
            // Check if it's inside a URL that we shouldn't touch? Wait, prompt says "khedma-tn.vercel.app -> workedin.com"
            // So URL replacements are fine!
            
            // Exclude camelCase variable names like myKhedmaService
            if (/[a-zA-Z]/.test(prevChar) && prevChar === prevChar.toLowerCase() && match === "Khedma") {
                // e.g., somethingKhedma -> keep it
                return match;
            }
            if (/[a-zA-Z]/.test(prevChar) && prevChar === prevChar.toLowerCase() && match === "Khedmetna") {
                // e.g., somethingKhedmetna -> keep it
                return match;
            }
            
            // Supabase exclusion
            if (string.substring(Math.max(0, offset - 20), offset + 30).includes('supabase')) {
                // Ignore if closely surrounded by 'supabase' (for keys/urls)
                return match; 
            }
            
            // VITE_ environment var exclusion
            if (string.substring(Math.max(0, offset - 20), offset + 30).includes('VITE_')) {
                return match;
            }

            return rule.to;
        });
    }

    // Specific SEO domain replace
    content = content.replace(/khedma-tn\.vercel\.app/g, 'workedin.com');

    if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${p}`);
    }
}

console.log('Rebrand pass 1 complete.');
