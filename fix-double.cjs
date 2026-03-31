const fs = require('fs');

let c = fs.readFileSync('src/components/proposals/ProposalModal.tsx', 'utf8');

c = c.replace(
    /const onFormSubmit = \(data: ProposalFormData\) => \{\n\s*onSubmit\(data, attachments\);\n\s*\};/,
    `const onFormSubmit = async (data: ProposalFormData) => {
        if (isSubmitting) return; // Prevent double-trigger before button disables
        await onSubmit(data, attachments);
    };`
);

c = c.replace(
    /<form onSubmit=\{handleSubmit\(onFormSubmit\)\} className="space-y-6">/,
    `<form onSubmit={handleSubmit(onFormSubmit)}>
                <fieldset disabled={isSubmitting} className="space-y-6">`
);

c = c.replace(
    /<div className="flex gap-4 pt-6 mt-6 border-t border-gray-100 dark:border-dark-800">/,
    `</fieldset>

                    <div className="flex gap-4 pt-6 mt-6 border-t border-gray-100 dark:border-dark-800">`
);

fs.writeFileSync('src/components/proposals/ProposalModal.tsx', c);
console.log('Fixed double submission in modal');