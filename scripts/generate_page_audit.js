import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pagesDir = path.join(__dirname, '../src/pages');
const outputFile = path.join(__dirname, '../ALL_PAGES_STRICT_UI_UX_AUDIT.md');

let output = `# Strict UI/UX Audit for ALL APP PAGES\n\n`;
output += `This document contains a comprehensive, strict audit of **ALL APP PAGES**, detailing their current state regarding colors, design format, and components used. This is designed to be passed to an AI agent for a full-scale redesign to ensure premium UI/UX.\n\n`;

const getFilesRecursively = (directory) => {
    let results = [];
    const _files = fs.readdirSync(directory);
    
    for (const file of _files) {
        if (file === '__tests__') continue;
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFilesRecursively(fullPath));
        } else if (fullPath.endsWith('.tsx')) {
            results.push(fullPath);
        }
    }
    return results;
};

const allFiles = getFilesRecursively(pagesDir);

allFiles.forEach(file => {
    const relativePath = path.relative(path.join(__dirname, '../src'), file);
    const content = fs.readFileSync(file, 'utf-8');
    
    // Extract Colors
    const textColors = [...new Set(content.match(/text-([a-z]+-[0-9]+|\[var\([^\]]+\)\])/g))] || [];
    const bgColors = [...new Set(content.match(/bg-([a-z]+-[0-9]+|\[var\([^\]]+\)\])/g))] || [];
    const borderColors = [...new Set(content.match(/border-([a-z]+-[0-9]+|\[var\([^\]]+\)\])/g))] || [];
    const varColors = [...new Set(content.match(/var\(--([^)]+)\)/g))] || [];
    
    // Extract Layout/Format
    const layout = [];
    if (content.includes('grid')) layout.push('Grid Layout');
    if (content.includes('flex')) layout.push('Flexbox');
    if (content.includes('max-w-')) layout.push('Constrained Width (max-w)');
    if (content.includes('container')) layout.push('Container Wrapper');
    if (content.includes('absolute')) layout.push('Absolute Positioning');
    if (content.includes('sticky') || content.includes('fixed')) layout.push('Sticky/Fixed Elements');

    // Extract Imported UI Components
    const imports = [];
    const importRegex = /import\s+({[^}]+}|\S+)\s+from\s+['"](.+?)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        if (match[2].includes('components/')) {
            imports.push(match[1].replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ').trim());
        }
    }
    
    output += `## Page: \`${relativePath}\`\n\n`;
    output += `### 🎨 Colors Used\n`;
    output += `- **Text Colors:** ${textColors.length > 0 ? textColors.join(', ') : 'None specifically defined'}\n`;
    output += `- **Background Colors:** ${bgColors.length > 0 ? bgColors.join(', ') : 'None specifically defined'}\n`;
    output += `- **Border Colors:** ${borderColors.length > 0 ? borderColors.join(', ') : 'None specifically defined'}\n`;
    output += `- **CSS Variables Detected:** ${varColors.length > 0 ? varColors.join(', ') : 'None'}\n\n`;
    
    output += `### 📐 Design Format & Layout\n`;
    output += `- ${layout.length > 0 ? layout.join(', ') : 'Standard block flow'}\n\n`;
    
    output += `### 🧩 Components Integrated\n`;
    output += `${imports.length > 0 ? imports.map(i => '- `'+i+'`').join('\n') : '- No internal UI components imported'}\n\n`;
    output += `---\n\n`;
});

fs.writeFileSync(outputFile, output);
console.log(`Audit saved to ${outputFile}`);
