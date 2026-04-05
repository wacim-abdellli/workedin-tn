const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    content = content.replace(/bg-white\s+dark:bg-gray-800\/(\d+|\[[^\]]+\])/g, 'bg-white/$1');
    content = content.replace(/bg-white\s+dark:bg-gray-800/g, 'bg-white');
    content = content.replace(/bg-gray-50\s+dark:bg-gray-900\/50/g, 'bg-gray-50/50');
    content = content.replace(/dark:white\/\[0\.02\]/g, 'dark:bg-white/[0.02]');
    content = content.replace(/dark:bg-white\s+dark:bg-gray-800\/\[0\.02\]/g, 'dark:bg-white/[0.02]');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed', filePath);
    }
}

['src/components/auth', 'src/pages'].forEach(dir => {
    if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));
        files.forEach(f => fixFile(path.join(dir, f)));
    }
});