const fs = require('fs');
let c = fs.readFileSync('src/services/jobs.ts', 'utf8');

c = c.replace(
    /if \(filters\.search\) query = query\.or\(`title\.ilike\.%\$\{filters\.search\}%,description\.ilike\.%\$\{filters\.search\}%`\);/,
    `if (filters.search) {
            // Strip out characters that could break PostgREST .or() parsing (like commas and quotes)
            const safeSearch = filters.search.replace(/[,\\"\\_\\%]/g, ' ').trim();
            if (safeSearch) {
                query = query.or(\`title.ilike.%\${safeSearch}%,description.ilike.%\${safeSearch}%\`);
            }
        }`
);

fs.writeFileSync('src/services/jobs.ts', c);
console.log('Fixed search string parsing issue');
