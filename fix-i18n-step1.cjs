const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    for (const [regex, replacement] of replacements) {
        if (regex.test(content)) {
            content = content.replace(regex, replacement);
            hasChanges = true;
        }
    }
    if (hasChanges) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

// 1. UPDATE Settings.tsx
const settingsPath = path.join(__dirname, 'src', 'pages', 'Settings.tsx');
replaceInFile(settingsPath, [
    [
        /<p className="text-sm font-medium text-muted-foreground\/80 mt-1">Active context<\/p>/g,
        `<p className="text-sm font-medium text-muted-foreground/80 mt-1">{tx('settings.activeContext', undefined, 'Active context')}</p>`
    ],
    [
        /<p className="text-sm font-medium text-muted-foreground\/80 mt-1">Global permission<\/p>/g,
        `<p className="text-sm font-medium text-muted-foreground/80 mt-1">{tx('settings.globalPermission', undefined, 'Global permission')}</p>`
    ],
    [
        /<p className="text-sm font-medium text-muted-foreground\/80 mt-1">Profile readiness<\/p>/g,
        `<p className="text-sm font-medium text-muted-foreground/80 mt-1">{tx('settings.profileReadiness', undefined, 'Profile readiness')}</p>`
    ]
]);

// 2. Add keys to en, ar, fr
const addKeys = (langFile, keysToAdd) => {
    let content = fs.readFileSync(langFile, 'utf8');
    // We add them under settings.
    const regex = /settings:\s*\{/;
    if (regex.test(content)) {
        if (!content.includes('activeContext:')) {
            content = content.replace(regex, `settings: {\n${keysToAdd}`);
            fs.writeFileSync(langFile, content, 'utf8');
            console.log(`Added keys to ${langFile}`);
        }
    }
};

const enKeys = `        activeContext: 'Active context',
        globalPermission: 'Global permission',
        profileReadiness: 'Profile readiness',`;

const arKeys = `        activeContext: 'السياق النشط',
        globalPermission: 'الصلاحية العامة',
        profileReadiness: 'جاهزية الملف الشخصي',`;

const frKeys = `        activeContext: 'Contexte actif',
        globalPermission: 'Permission globale',
        profileReadiness: 'Préparation du profil',`;

addKeys(path.join(__dirname, 'src', 'i18n', 'en.ts'), enKeys);
addKeys(path.join(__dirname, 'src', 'i18n', 'ar.ts'), arKeys);
addKeys(path.join(__dirname, 'src', 'i18n', 'fr.ts'), frKeys);
