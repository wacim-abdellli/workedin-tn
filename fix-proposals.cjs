const fs = require('fs');

let c = fs.readFileSync('src/services/proposals.ts', 'utf8');

c = c.replace(
    /const attachmentUrls: string\[\] = \[\];[\s\S]*?\.single\(\);\n\n\s*if \(error\) throw error;\n\n\s*return \{ data: proposal\.id, error: null \};/,
    `const { data: proposal, error } = await supabase
            .from('proposals')
            .insert({
                job_id: data.job_id,
                freelancer_id: data.freelancer_id,
                cover_letter: data.cover_letter,
                bid_amount: data.bid_amount,
                delivery_time_days: data.delivery_time_days,
                attachments: [],
            })
            .select('id')
            .single();

        if (error) throw error;

        const attachmentUrls: string[] = [];

        if (files && files.length > 0) {
            try {
                const uploadPromise = async () => {
                    for (const file of files) {
                        const path = \`\${data.freelancer_id}/\${data.job_id}/\${proposal.id}-\${Date.now()}-\${file.name}\`;
                        const uploadedUrl = await uploadFile('attachments', path, file);
                        attachmentUrls.push(uploadedUrl);
                    }
                    return attachmentUrls;
                };

                const timeout = new Promise<never>((_, reject) => 
                    setTimeout(() => reject(new Error('File upload timed out after 30 seconds')), 30000)
                );

                // Run upload with 30s timeout
                await Promise.race([uploadPromise(), timeout]);

                // Update proposal with attachments
                await supabase
                    .from('proposals')
                    .update({ attachments: attachmentUrls })
                    .eq('id', proposal.id);

            } catch (uploadError) {
                console.error('[createProposal] Upload phase failed or timed out:', uploadError);
                // Return success but note the failure to the client or let it ride without attachments
                // The prompt says "create proposal FIRST ... then upload asynchronously. It eliminates upload hangs."
                throw new Error('Proposal created, but file upload failed or timed out. Please try editing later.');
            }
        }

        return { data: proposal.id, error: null };`
);

fs.writeFileSync('src/services/proposals.ts', c);
console.log('Fixed proposal upload racing conditions');