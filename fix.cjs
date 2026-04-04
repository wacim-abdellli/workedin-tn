const fs = require('fs');
const path = require('path');

let fixedCount = 0;
let filesChecked = 0;

function processFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
        const files = fs.readdirSync(filePath);
        for (const file of files) {
            processFile(path.join(filePath, file));
        }
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        filesChecked++;
        let p = path.resolve(filePath);
        let content = fs.readFileSync(p, 'utf8');
        let original = content;
        
        let changed = false;
        
        content = content.replace(/className={?(["'`])([\s\S]*?)\1}?/g, (match, quote, classes) => {
            let classList = classes.split(/\s+/).filter(Boolean);
            let localChanged = false;
            
            if (classList.includes('bg-white') && !classList.some(c => c.startsWith('dark:bg-'))) {
                classList.push('dark:bg-gray-800');
                localChanged = true;
            }
            if (classList.includes('text-gray-900') && !classList.some(c => c.startsWith('dark:text-'))) {
                classList.push('dark:text-white');
                localChanged = true;
            }
            
            if (localChanged) {
                let quoteChar = quote === '`' ? '`' : quote;
                return `className=${match.startsWith('className={') ? '{' : ''}${quoteChar}${classList.join(' ')}${quoteChar}${match.endsWith('}') ? '}' : ''}`;
            }
            return match;
        });

        if (content !== original) {
            fs.writeFileSync(p, content, 'utf8');
            console.log('Fixed:', filePath);
            fixedCount++;
        }
    }
}

try { processFile('src/components/common/'); } catch(e){}
try { processFile('src/pages/Messages.tsx'); } catch(e){}
try { processFile('src/components/verify/'); } catch(e){}

console.log(`\nSummary: Checked ${filesChecked} files. Fixed ${fixedCount} files.`);
