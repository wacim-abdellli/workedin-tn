const fs = require('fs');
let code = fs.readFileSync('src/services/proposals.ts', 'utf8');

const oldCode = `        for (const file of files) {
            const path = \`\${data.freelancer_id}/\${data.job_id}/\${Date.now()}-\${file.name}\`;
            const uploadedUrl = await uploadFile('attachments', path, file);
            attachmentUrls.push(uploadedUrl);
        }`;

const newCode = `        const attachmentUrls: string[] = await Promise.all(
            files.map(async (file) => {
                const path = \`\${data.freelancer_id}/\${data.job_id}/\${Date.now()}-\${file.name}\`;
                return await uploadFile('attachments', path, file);
            })
        );`;

// Since attachmentUrls is already declared, we should replace its declaration too.
const oldCodeBlock = `        const attachmentUrls: string[] = [];

        for (const file of files) {
            const path = \`\${data.freelancer_id}/\${data.job_id}/\${Date.now()}-\${file.name}\`;
            const uploadedUrl = await uploadFile('attachments', path, file);
            attachmentUrls.push(uploadedUrl);
        }`;

code = code.replace(oldCodeBlock, newCode);
fs.writeFileSync('src/services/proposals.ts', code);
