const fs = require('fs');
let code = fs.readFileSync('src/components/settings/ProfileSettings.tsx', 'utf8');

const regex = /<span className="text-base font-black text-brand[\s\S]*?<p className="mt-3 text-sm font-medium\s*text-muted-foreground\/80">\{t\.auth\.accountPanel\.progressLabel\}<\/p>/m;

code = code.replace(regex, '</div>');
fs.writeFileSync('src/components/settings/ProfileSettings.tsx', code);
