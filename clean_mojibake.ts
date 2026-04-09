import * as fs from 'fs';

const files = [
    'src/components/common/SEO.tsx',
    'src/pages/FreelancerOnboarding.tsx',
    'src/pages/ForgotPassword.tsx',
    'src/pages/FindFreelancers.tsx',
    'src/lib/flouci.ts',
    'src/lib/currencyUtils.ts',
    'src/hooks/__tests__/useContractState.test.tsx',
    'src/hooks/useContractState.ts',
    'src/components/settings/NotificationSettings.tsx',
    'src/lib/__tests__/currency.authUtils.test.ts',
    'src/i18n/en.ts'
];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('Ø')) return;

    // We replace strings containing Ø, excluding multiline string boundary logic
    const regex = /(['"])([^'"]*Ø[^'"]*)(['"])/g;
    
    let changed = false;
    const newContent = content.replace(regex, (match, p1, p2, p3) => {
        const decoded = Buffer.from(p2, 'latin1').toString('utf8');
        // if decode yields replacement char, just keep the hardcoded replacements I did earlier
        // but wait, I already hardcode replaced most of it!
        changed = true;
        return p1 + decoded + p3;
    });

    if (changed) {
        fs.writeFileSync(file, newContent);
        console.log(`Cleaned mojibake in ${file}`);
    }
});
