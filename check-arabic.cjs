const fs = require('fs');
const content = fs.readFileSync('src/pages/JobDetail.tsx', 'utf8');
const arabicMatches = content.match(/['\">][^'\"><]*[\u0600-\u06FF]+[^'\"><]*['\"<]/g);
console.log([...new Set(arabicMatches)].length, 'matches');
console.log([...new Set(arabicMatches)].slice(0, 15));
