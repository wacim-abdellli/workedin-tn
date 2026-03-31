const fs = require('fs');

let c = fs.readFileSync('src/components/proposals/ProposalModal.tsx', 'utf8');

if (!c.includes('</fieldset>')) {
    c = c.replace(
        /<div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-dark-700">/,
        `</fieldset>

                    <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-dark-700">`
    );
    fs.writeFileSync('src/components/proposals/ProposalModal.tsx', c);
    console.log('Fixed fieldset tag');
} else {
    console.log('Already fixed!');
}
