const fs = require('fs');
let code = fs.readFileSync('src/pages/JobProposals.tsx', 'utf8');

const target = `            // Non-critical follow-up effects stay outside the transaction.
            await supabase
                .from('notifications')
                .insert({
                    user_id: proposal.freelancer_id,
                    type: 'proposal_accepted',
                    title: t.jobProposals.proposalAccepted,
                    message: \`تم قبول عرضك على المشروع: \${job.title}\`,
                    data: { contract_id: contractId, job_id: jobId }
                });`;

// Map to proper rpc call with correct DB fields for notifications schema
const replacement = `            // Non-critical follow-up effects stay outside the transaction.
            await supabase.rpc('create_notification', {
                p_user_id: proposal.freelancer_id,
                p_type: 'proposal',
                p_title: t.jobProposals.proposalAccepted,
                p_body: \`تم قبول عرضك على المشروع: \${job.title}\`,
                p_link: \`/contracts/\${contractId}\`,
                p_related_id: contractId
            });`;

let updated = code.replace(target, replacement);
if (code === updated) {
    updated = code.replace(target.replace(/\n/g, '\r\n'), replacement);
}

fs.writeFileSync('src/pages/JobProposals.tsx', updated);
console.log(code === updated ? 'failed to replace' : 'replaced successfully');
