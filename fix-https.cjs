const fs = require('fs');

// Add HTTPS enforcement to App.tsx
let appContent = fs.readFileSync('src/App.tsx', 'utf8');
const httpsCheck = `// Enforce HTTPS in production
if (typeof window !== 'undefined' && window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
    window.location.protocol = 'https:';
}

`;

if (!appContent.includes('window.location.protocol')) {
    appContent = httpsCheck + appContent;
    fs.writeFileSync('src/App.tsx', appContent);
    console.log('Added HTTPS enforcement to App.tsx');
}
