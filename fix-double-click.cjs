const fs = require('fs');

const file1 = 'src/pages/ContractWorkspace.tsx';
let content1 = fs.readFileSync(file1, 'utf8');

// Add useRef import if missing
if (!content1.includes('useRef')) {
    content1 = content1.replace(/import \{ useState, useEffect \} from 'react';/, "import { useState, useEffect, useRef } from 'react';");
}


// Wrap handleAcceptAndPay with useRef
const handleAcceptAndPayReplacement = `
    const isActionPending = useRef(false);

    const handleAcceptAndPay = async () => {
        if (isActionPending.current) return;
        isActionPending.current = true;
        try {
            await acceptWork();
            showToast(t.contract.workAccepted, 'success');
            setIsPaymentModalOpen(false);
            navigate('/client/dashboard');
        } catch {
            showToast(t.contract.acceptError, 'error');
        } finally {
            isActionPending.current = false;
        }
    };
`;

content1 = content1.replace(
    /const handleAcceptAndPay = async \(\) => \{\s*try \{\s*await acceptWork\(\);\s*showToast\(t\.contract\.workAccepted, 'success'\);\s*setIsPaymentModalOpen\(false\);\s*navigate\('\/client\/dashboard'\);\s*\} catch \{\s*showToast\(t\.contract\.acceptError, 'error'\);\s*\}\s*\};/,
    handleAcceptAndPayReplacement.trim()
);

fs.writeFileSync(file1, content1);

const file2 = 'src/components/ui/PaymentModal.tsx';
let content2 = fs.readFileSync(file2, 'utf8');

if (!content2.includes('useRef')) {
    content2 = content2.replace(/import \{ useState, useEffect \} from 'react';/, "import { useState, useEffect, useRef } from 'react';");
}

const handlePaymentReplacement = `
    const isPaymentPending = useRef(false);

    const handlePayment = async () => {
        if (method === 'd17' && !phoneNumber) return;
        if (isPaymentPending.current) return;
        
        isPaymentPending.current = true;
        try {
            setIsLoading(true);
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            setStep('processing');
            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 2000));

            setStep('success');
            // Wait a bit before closing/calling success
            await new Promise(resolve => setTimeout(resolve, 1500));

            await onSuccess();
            onClose();
        } finally {
            isPaymentPending.current = false;
            setIsLoading(false);
        }
    };
`;

content2 = content2.replace(
    /const handlePayment = async \(\) => \{\s*if \(method === 'd17' && !phoneNumber\) return;\s*setIsLoading\(true\);\s*\/\/ Simulate API delay\s*await new Promise\(resolve => setTimeout\(resolve, 2000\)\);\s*setStep\('processing'\);\s*\/\/ Simulate processing time\s*await new Promise\(resolve => setTimeout\(resolve, 2000\)\);\s*setStep\('success'\);\s*\/\/ Wait a bit before closing\/calling success\s*await new Promise\(resolve => setTimeout\(resolve, 1500\)\);\s*await onSuccess\(\);\s*onClose\(\);\s*\};/,
    handlePaymentReplacement.trim()
);

fs.writeFileSync(file2, content2);
console.log('Fixed double click');
