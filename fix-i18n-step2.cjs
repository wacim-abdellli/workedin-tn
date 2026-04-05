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

// 1. UPDATE NotificationSettings.tsx
const notifPath = path.join(__dirname, 'src', 'components', 'settings', 'NotificationSettings.tsx');
replaceInFile(notifPath, [
    [
        /<p className="text-base font-bold text-foreground">Real-time<\/p>/g,
        `<p className="text-base font-bold text-foreground">{tx('settings.notificationSettings.realTime', undefined, 'Real-time')}</p>`
    ],
    [
        /<p className="text-sm font-medium text-muted-foreground\/80 mt-1">Instant push updates<\/p>/g,
        `<p className="text-sm font-medium text-muted-foreground/80 mt-1">{tx('settings.notificationSettings.instantPush', undefined, 'Instant push updates')}</p>`
    ],
    [
        /<p className="text-base font-bold text-foreground">In-App & Email<\/p>/g,
        `<p className="text-base font-bold text-foreground">{tx('settings.notificationSettings.inAppEmail', undefined, 'In-App & Email')}</p>`
    ],
    [
        /<p className="text-sm font-medium text-muted-foreground\/80 mt-1">Omnichannel delivery<\/p>/g,
        `<p className="text-sm font-medium text-muted-foreground/80 mt-1">{tx('settings.notificationSettings.omnichannel', undefined, 'Omnichannel delivery')}</p>`
    ],
    [
        /<h3 className="[a-zA-Z0-9\-\/ ]*">(\s*)Notification Preferences(\s*)<\/h3>/g,
        `<h3 className="text-base font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent">$1{tx('settings.notificationSettings.notificationPreferences', undefined, 'Notification Preferences')}$2</h3>`
    ],
    [
        /{enabledCount} <span(.*?)>\/ {notifications\.length}<\/span>/g,
        `{enabledCount} <span$1> {tx('settings.notificationSettings.of', undefined, 'of')} {notifications.length}</span>`
    ]
]);

// 2. Add keys to en, ar, fr
const addKeys = (langFile, keysToAdd) => {
    let content = fs.readFileSync(langFile, 'utf8');
    if (!content.includes('notificationPreferences:')) {
        // Find notificationSettings: {
        const regex = /notificationSettings:\s*\{/;
        if (regex.test(content)) {
            content = content.replace(regex, `notificationSettings: {\n${keysToAdd}`);
            fs.writeFileSync(langFile, content, 'utf8');
            console.log(`Added keys to ${langFile}`);
        } else {
            console.log(`Could not find notificationSettings in ${langFile}`);
        }
    }
};

const enKeys = `            realTime: 'Real-time',
            instantPush: 'Instant push updates',
            inAppEmail: 'In-App & Email',
            omnichannel: 'Omnichannel delivery',
            notificationPreferences: 'Notification Preferences',
            of: 'of',`;

const arKeys = `            realTime: 'في الوقت الفعلي',
            instantPush: 'تحديثات فورية',
            inAppEmail: 'داخل التطبيق والبريد',
            omnichannel: 'توصيل متعدد القنوات',
            notificationPreferences: 'تفضيلات الإشعارات',
            of: 'من',`;

const frKeys = `            realTime: 'Temps réel',
            instantPush: 'Mises à jour instantanées',
            inAppEmail: 'Dans l\\'application et par Email',
            omnichannel: 'Livraison omnicanale',
            notificationPreferences: 'Préférences de notification',
            of: 'sur',`;

addKeys(path.join(__dirname, 'src', 'i18n', 'en.ts'), enKeys);
addKeys(path.join(__dirname, 'src', 'i18n', 'ar.ts'), arKeys);
addKeys(path.join(__dirname, 'src', 'i18n', 'fr.ts'), frKeys);
