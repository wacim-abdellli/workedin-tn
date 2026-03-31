const fs = require('fs');

const paymentPath = 'src/services/payments.ts';
let pContent = fs.readFileSync(paymentPath, 'utf8');
if (!pContent.includes('verifyPaymentProcessorStatus')) {
pContent += `

export async function verifyPaymentProcessorStatus(contractId: string): Promise<boolean> {
    try {
        const { data, error } = await supabase.functions.invoke('flouci-verify-payment', {
            body: { contract_id: contractId },
        });
        
        if (error) {
            console.error('Payment verification edge function error:', error);
            return false;
        }
        
        // Ensure successful response from Flouci (or handle mock gracefully in dev)
        return data?.status === 'SUCCESS' || data?.success === true;
    } catch (err) {
        console.error('Payment verification failed:', err);
        return false;
    }
}
`;
fs.writeFileSync(paymentPath, pContent);
}

const contractStatePath = 'src/hooks/useContractState.ts';
let cContent = fs.readFileSync(contractStatePath, 'utf8');

if (!cContent.includes('verifyPaymentProcessorStatus')) {
    cContent = cContent.replace(
        "import { sendContractMessage } from '../services/messages';",
        "import { sendContractMessage } from '../services/messages';\nimport { verifyPaymentProcessorStatus } from '../services/payments';"
    );
    
    // In acceptWork
    cContent = cContent.replace(
        /const receiverId = getCounterpartyId\(contract, userRole\);\s*if \(!receiverId\) throw new Error\('Unable to determine message recipient'\);[\s\S]*?await updateStatus\('completed', \{/,
        `const receiverId = getCounterpartyId(contract, userRole);
            if (!receiverId) throw new Error('Unable to determine message recipient');

            // CRITICAL PHASE 5 FIX: Verify with payment processor before releasing
            const isVerified = await verifyPaymentProcessorStatus(contractId);
            if (!isVerified && process.env.NODE_ENV === 'production') {
                throw new Error('لم نستطع التحقق من حالة الدفع من البنك. يرجى المحاولة لاحقاً أو مراسلة الدعم.');
            }

            await updateStatus('completed', {`
    );
    
    fs.writeFileSync(contractStatePath, cContent);
}
console.log('Done verifying');
