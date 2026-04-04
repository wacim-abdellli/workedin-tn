const fs = require('fs');
let text = fs.readFileSync('src/pages/Settings.tsx', 'utf8');
const oldCl = "relative overflow-hidden rounded-xl border border-white/5 bg-card/40 p-5 shadow-2xl backdrop-blur-3xl sm:flex-row sm:items-start sm:justify-between sm:p-4 transition-all hover:bg-card/50";
const newCl = "relative overflow-hidden rounded-xl border border-white/5 bg-card/40 p-6 shadow-2xl backdrop-blur-md transform-gpu";
text = text.replace(oldCl, newCl);
fs.writeFileSync('src/pages/Settings.tsx', text);
