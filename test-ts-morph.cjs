const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');

const project = new Project();
project.addSourceFilesAtPaths('src/**/*.{tsx,ts}');

const stringsToReplace = {
    // Example test case
    "الرئيسية": "nav.home",
    "د.ت": "common.tnd"
};

let modifiedFiles = 0;

for (const sourceFile of project.getSourceFiles()) {
    if (sourceFile.getFilePath().includes('node_modules') || sourceFile.getFilePath().includes('src/i18n') || sourceFile.getFilePath().includes('__tests__')) continue;
    
    let fileModified = false;
    let needsImport = false;

    // Traverse the AST
    sourceFile.forEachDescendant(node => {
        if (node.getKind() === SyntaxKind.JsxText) {
            const text = node.getText().trim();
            if (stringsToReplace[text]) {
                const key = stringsToReplace[text];
                // Replace with {tx('key')} or {t.key}
                node.replaceWithText(`{tx('${key}')}`);
                fileModified = true;
                needsImport = true;
            }
        }
        
        if (node.getKind() === SyntaxKind.JsxAttribute) {
            const initializer = node.getInitializer();
            if (initializer && initializer.getKind() === SyntaxKind.StringLiteral) {
                const text = initializer.getLiteralText().trim();
                if (stringsToReplace[text]) {
                    const key = stringsToReplace[text];
                    node.setInitializer(`{tx('${key}')}`);
                    fileModified = true;
                    needsImport = true;
                }
            }
        }
    });

    if (fileModified) {
        // check if useTranslation is imported
        const imports = sourceFile.getImportDeclarations();
        const hasI18nImport = imports.some(i => i.getModuleSpecifierValue().includes('i18n'));
        if (!hasI18nImport) {
            // we should import it
            // calculate relative path to src/i18n
            console.log(`Needs import in ${sourceFile.getFilePath()}`);
        }
        
        // check if tx is defined in the component
        // we'll skip complex injection for now, just previewing
        sourceFile.saveSync();
        modifiedFiles++;
    }
}

console.log(`Modified ${modifiedFiles} files.`);
