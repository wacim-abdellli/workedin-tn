const fs = require('fs');
let c = fs.readFileSync('src/services/profiles.ts', 'utf8');

c = c.replace(
    /\.select\('job_id, jobs\(\*\)'\)\s*\n\s*\.eq\('user_id', userId\)\s*\n\s*\.not\('job_id', 'is', null\);/g,
    ".select('job_id, jobs(*)')\n        .eq('user_id', userId)\n        .order('created_at', { ascending: false })\n        .not('job_id', 'is', null);"
);

fs.writeFileSync('src/services/profiles.ts', c);
console.log('Fixed Saved Jobs Sorting');