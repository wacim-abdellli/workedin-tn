const fs = require('fs');

let c = fs.readFileSync('src/components/proposals/ProposalModal.tsx', 'utf8');

c = c.replace(
    /const onFormSubmit = \(data: ProposalFormData\) => \{\n\s*onSubmit\(data, attachments\);\n\s*\};/,
    `const onFormSubmit = async (data: ProposalFormData) => {
        if (isSubmitting) return; // Prevent double trigger
        await onSubmit(data, attachments);
    };`
);

fs.writeFileSync('src/components/proposals/ProposalModal.tsx', c);
console.log('Fixed double submission guard');