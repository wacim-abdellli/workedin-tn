const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');

const project = new Project();
project.addSourceFilesAtPaths('src/**/*.{tsx,ts}');

// Mapping translations
const strings = JSON.parse(fs.readFileSync('unique_strings.json', 'utf8'));

// Generate keys from string text
function slugify(text) {
    if (text.includes('Ã˜Â')) return 'payment.flouciDescription';
    let enMatch = text.match(/[a-zA-Z]+/g);
    if (enMatch && text.length < 30) return 'ui.' + enMatch.join('_').toLowerCase().substring(0, 30);
    
    let hash = 0;
    for (let i = 0; i < text.length; i++) hash = ((hash << 5) - hash) + text.charCodeAt(i) | 0;
    return 'dynamic_key_' + Math.abs(hash);
}

const keyMap = {};
strings.forEach((str) => {
    keyMap[str] = slugify(str);
});
fs.writeFileSync('generated_mappings.json', JSON.stringify(keyMap, null, 2));

const ignoreList = ['WorkedIn', 'Khedmetna', 'Khedma-TN', 'TND', 'D17', 'Flouci'];
function hasLetters(str) {
    return /[a-zA-Z\u0600-\u06FF]/.test(str);
}

let filesModified = 0;

for (const sourceFile of project.getSourceFiles()) {
    if (sourceFile.getFilePath().includes('__tests__') || sourceFile.getFilePath().includes('src/i18n')) continue;
    
    let modified = false;

    const jsxTexts = sourceFile.getDescendantsOfKind(SyntaxKind.JsxText).reverse();
    const jsxAttrs = sourceFile.getDescendantsOfKind(SyntaxKind.JsxAttribute).reverse();

    for (const node of jsxTexts) {
        const text = node.getText().trim();
        if (text && hasLetters(text) && !ignoreList.includes(text) && keyMap[text]) {
            node.replaceWithText(`{tx('${keyMap[text]}')}`);
            modified = true;
        }
    }

    for (const attr of jsxAttrs) {
        if (!attr.compilerNode || !attr.compilerNode.name) continue;
        const name = attr.compilerNode.name.getText();
        if (['title', 'placeholder', 'label', 'description', 'alt'].includes(name)) {
            const init = attr.getInitializer();
            if (init && init.getKind() === SyntaxKind.StringLiteral) {
                const text = init.getLiteralText().trim();
                if (text && hasLetters(text) && !ignoreList.includes(text) && keyMap[text]) {
                    attr.setInitializer(`{tx('${keyMap[text]}')}`);
                    modified = true;
                }
            }
        }
    }

    if (modified) {
        const imports = sourceFile.getImportDeclarations();
        let hasImport = false;

        for (const imp of imports) {
            if (imp.getModuleSpecifierValue().includes('i18n')) {
                const named = imp.getNamedImports().map(i => i.getName());
                if (named.includes('useTranslation')) {
                    hasImport = true;
                } else {
                    imp.addNamedImport('useTranslation');
                    hasImport = true;
                }
            }
        }

        if (!hasImport) {
            const pathParts = sourceFile.getFilePath().split('src/')[1].split('/');
            const depth = pathParts.length - 1;
            const prefix = depth === 0 ? './' : '../'.repeat(depth);
            sourceFile.addImportDeclaration({
                namedImports: ['useTranslation'],
                moduleSpecifier: `${prefix}i18n`
            });
        }

        // Add hook call to React components
        const funcs = sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction)
            .concat(sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration));
            
        for (const fn of funcs) {
            // Very simple heuristic: if it returns JSX, it's a React component
            const hasJsx = fn.getDescendantsOfKind(SyntaxKind.JsxElement).length > 0 || fn.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement).length > 0;
            if (hasJsx) {
                const body = fn.getBody();
                if (body && body.getKind() === SyntaxKind.Block) {
                    const text = body.getText();
                    if (!text.includes('useTranslation')) {
                        body.insertStatements(0, 'const { tx } = useTranslation();');
                    } else if (text.includes('const { t } = useTranslation();')) {
                        const stmt = body.getStatements().find(s => s.getText().includes('const { t } = useTranslation();'));
                        if (stmt) stmt.replaceWithText('const { t, tx } = useTranslation();');
                    } else if (text.includes('const { language } = useTranslation();')) {
                        const stmt = body.getStatements().find(s => s.getText().includes('const { language } = useTranslation();'));
                        if (stmt) stmt.replaceWithText('const { language, tx } = useTranslation();');
                    } else if (!text.includes(' tx') && !text.includes('{tx') && !text.includes('tx,')) {
                        body.insertStatements(0, 'const { tx } = useTranslation();');
                    }
                }
            }
        }
        
        sourceFile.saveSync();
        filesModified++;
    }
}

console.log(`Modified ${filesModified} files.`);
