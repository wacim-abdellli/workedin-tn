const fs = require('fs');
let text = fs.readFileSync('src/pages/Settings.tsx', 'utf8');
const oldCl = "className=\"relative overflow-hidden rounded-xl border border-white/5 bg-card/40 p-5 shadow-2xl backdrop-blur-3xl sm:flex-row sm:items-start sm:justify-between sm:p-4 transition-all hover:bg-card/50\"";
const newCl = "className=\"relative overflow-hidden rounded-xl border border-white/5 bg-card/40 p-5 shadow-2xl backdrop-blur-3xl sm:p-6 transform-gpu\"";
text = text.replace(oldCl, newCl);
text = text.replace(/<div className="absolute inset-0\\s*\n*\\s*bg-gradient-to-r from-red-500\\/0 via-red-500\\/10 to-red-500\\/0 opacity-0\\s*\n*\\s*group-hover:opacity-100 transition-opacity" \\/>/, '');
fs.writeFileSync('src/pages/Settings.tsx', text);
