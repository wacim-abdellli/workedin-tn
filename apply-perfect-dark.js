const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    const replacements = [
        { regex: /\bbg-white\b(?![\s'"]*dark:bg-gray)/g, replacement: 'bg-white dark:bg-gray-800' },
        { regex: /\bbg-gray-50\b(?![\s'"]*dark:bg-gray)/g, replacement: 'bg-gray-50 dark:bg-gray-900' },
        { regex: /\bbg-gray-100\b(?![\s'"]*dark:bg-gray)/g, replacement: 'bg-gray-100 dark:bg-gray-800' },
        { regex: /\bborder-gray-200\b(?![\s'"]*dark:border-gray)/g, replacement: 'border-gray-200 dark:border-gray-700' },
        { regex: /\bborder-gray-100\b(?![\s'"]*dark:border-gray)/g, replacement: 'border-gray-100 dark:border-gray-800' },
        { regex: /\bborder-gray-300\b(?![\s'"]*dark:border-gray)/g, replacement: 'border-gray-300 dark:border-gray-600' },
        { regex: /\btext-gray-800\b(?![\s'"]*dark:text-)/g, replacement: 'text-gray-800 dark:text-gray-100' },
        { regex: /\btext-gray-900\b(?![\s'"]*dark:text-)/g, replacement: 'text-gray-900 dark:text-white' },
        { regex: /\btext-gray-600\b(?![\s'"]*dark:text-)/g, replacement: 'text-gray-600 dark:text-gray-300' },
        { regex: /\btext-gray-700\b(?![\s'"]*dark:text-)/g, replacement: 'text-gray-700 dark:text-gray-200' },
        { regex: /\btext-gray-500\b(?![\s'"]*dark:text-)/g, replacement: 'text-gray-500 dark:text-gray-400' },
        { regex: /\bhover:bg-gray-50\b(?![\s'"]*dark:hover:bg-)/g, replacement: 'hover:bg-gray-50 dark:hover:bg-gray-700' },
        { regex: /\bhover:bg-gray-100\b(?![\s'"]*dark:hover:bg-)/g, replacement: 'hover:bg-gray-100 dark:hover:bg-gray-700' }
    ];

    let newContent = content;
    replacements.forEach(({ regex, replacement }) => {
        newContent = newContent.replace(regex, replacement);
    });

    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent);
        console.log('Fixed: ' + filePath);
    }
}

function walkArgs(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkArgs(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            processFile(fullPath);
        }
    }
}

walkArgs(path.join(__dirname, 'src'));
