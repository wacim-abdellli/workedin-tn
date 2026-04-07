const fs = require('fs');

// ContractWorkspace.tsx
let cwCode = fs.readFileSync('src/pages/ContractWorkspace.tsx', 'utf8');

const target1 = `            // Notify both parties by email — fire-and-forget
            if (contractData) {
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, email, full_name')
                    .in('id', [contractData.client.id, contractData.freelancer.id]);

                if (profiles) {
                    const client = profiles.find(p => p.id === contractData.client.id);
                    const freelancer = profiles.find(p => p.id === contractData.freelancer.id);
                    const contractId = contractData.id;

                    if (client?.email) {
                        sendDisputeOpenedEmail(
                            client.email, client.full_name,
                            contractId, userRole === 'client' ? 'client' : 'freelancer',
                            reason,
                        );
                    }
                    if (freelancer?.email) {
                        sendDisputeOpenedEmail(
                            freelancer.email, freelancer.full_name,
                            contractId, userRole === 'client' ? 'client' : 'freelancer',
                            reason,
                        );
                    }
                }
            }`;

const replacement1 = `            // Notify both parties by email — fire-and-forget
            if (contractData) {
                const contractId = contractData.id;
                const role = userRole === 'client' ? 'client' : 'freelancer';

                sendDisputeOpenedEmail(contractData.client.id, contractId, role, reason);
                sendDisputeOpenedEmail(contractData.freelancer.id, contractId, role, reason);
            }`;

let cwUpdated = cwCode.replace(target1, replacement1);
if (cwCode === cwUpdated) {
    cwUpdated = cwCode.replace(target1.replace(/\n/g, '\r\n'), replacement1);
}
fs.writeFileSync('src/pages/ContractWorkspace.tsx', cwUpdated);


// PaymentSuccess.tsx
let psCode = fs.readFileSync('src/pages/PaymentSuccess.tsx', 'utf8');
const target2 = `        // Notify freelancer
        supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", contract.freelancer_id)
          .single()
          .then(({ data: freelancer }) => {
            if (freelancer?.email) {
              import("../lib/email").then(({ sendPaymentReceivedEmail }) => {
                sendPaymentReceivedEmail(
                  freelancer.email,
                  freelancer.full_name || t.paymentSuccess.defaultFreelancerName,
                  contract.amount,
                  contract_id,
                );
              });
            }
          });`;

const replacement2 = `        // Notify freelancer via edge function securely
        import("../lib/email").then(({ sendPaymentReceivedEmail }) => {
          sendPaymentReceivedEmail(
            contract.freelancer_id,
            contract.amount,
            contract_id,
          );
        });`;

let psUpdated = psCode.replace(target2, replacement2);
if (psCode === psUpdated) {
    psUpdated = psCode.replace(target2.replace(/\n/g, '\r\n'), replacement2);
}
fs.writeFileSync('src/pages/PaymentSuccess.tsx', psUpdated);

console.log("Done");
