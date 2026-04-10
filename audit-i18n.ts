import * as ts from 'typescript';
import * as fs from 'fs';
import { globSync } from 'fast-glob'; // wait, fast-glob gave issues earlier. I'll use a recursive walk.

function getAllFiles(dir: string): string[] {
    const results: string[] = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results.push(...getAllFiles(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = getAllFiles('src').filter(f => !f.includes('__tests__') && !f.includes('src/i18n'));

let count = 0;

function hasLetters(str: string) {
    return /[a-zA-Z\u0600-\u06FF]/.test(str);
}

const ignoreList = ['WorkedIn', 'Khedmetna', 'Khedma-TN', 'TND', 'D17', 'Flouci'];

for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);

    const issues: {line: number, text: string}[] = [];

    function visit(node: ts.Node) {
        if (ts.isJsxText(node)) {
            const text = node.getText().trim();
            if (text && hasLetters(text)) {
                let skip = false;
                for (const ignored of ignoreList) {
                    if (text === ignored) skip = true;
                }
                if (!skip) {
                    const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
                    issues.push({line, text});
                }
            }
        }
        
        // Also check attributes like title, placeholder, label
        if (ts.isJsxAttribute(node)) {
            const name = node.name.getText();
            if (['title', 'placeholder', 'label', 'description', 'alt'].includes(name) && node.initializer) {
                if (ts.isStringLiteral(node.initializer)) {
                    const text = node.initializer.text.trim();
                    if (text && hasLetters(text) && !ignoreList.includes(text)) {
                        const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
                        issues.push({line, text: `${name}="${text}"`});
                    }
                }
            }
        }
        
        ts.forEachChild(node, visit);
    }
    
    visit(sourceFile);
    
    if (issues.length > 0) {
        console.log(`\n📄 ${file}`);
        issues.forEach(i => console.log(`  Line ${i.line}: ${i.text}`));
        count += issues.length;
    }
}

console.log(`\nTotal hardcoded strings found: ${count}`);
