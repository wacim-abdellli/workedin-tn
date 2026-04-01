const fs = require('fs');
const file = 'src/lib/supabaseWithRetry.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /\s*let start = 0;\s*if \(import\.meta\.env\.DEV\) \{\s*console\.log\('\[ supabaseWithRetry \] Starting query\.\.\.'\);\s*start = Date\.now\(\);\s*\}/,
    ''
);

content = content.replace(
    /\s*if \(import\.meta\.env\.DEV\) \{\s*console\.log\('\[ supabaseWithRetry \] Query done in', \(Date\.now\(\) - start\), 'ms'\);\s*\}/,
    ''
);

fs.writeFileSync(file, content);
console.log('Removed logs');
