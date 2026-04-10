import * as ts from 'typescript';
import * as fs from 'fs';

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

function hasLetters(str: string) {
    return /[a-zA-Z\u0600-\u06FF]/.test(str);
}

const ignoreList = ['WorkedIn', 'Khedmetna', 'Khedma-TN', 'TND', 'D17', 'Flouci'];
const results = new Set<string>();

for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);

    function visit(node: ts.Node) {
        if (ts.isJsxText(node)) {
            const text = node.getText().trim();
            if (text && hasLetters(text) && !ignoreList.includes(text)) {
                results.add(text);
            }
        }
        
        if (ts.isJsxAttribute(node)) {
            const name = node.name.getText();
            if (['title', 'placeholder', 'label', 'description', 'alt'].includes(name) && node.initializer) {
                if (ts.isStringLiteral(node.initializer)) {
                    const text = node.initializer.text.trim();
                    if (text && hasLetters(text) && !ignoreList.includes(text)) {
                        results.add(text);
                    }
                }
            }
        }
        ts.forEachChild(node, visit);
    }
    visit(sourceFile);
}

fs.writeFileSync('unique_strings.json', JSON.stringify(Array.from(results), null, 2));
console.log(`Found ${results.size} unique strings.`);
