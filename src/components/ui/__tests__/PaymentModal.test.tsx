import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

vi.mock('@/i18n', () => ({
    useTranslation: () => ({
        t: {
            payment: {
                completeTitle: 'Complete Payment',
                payVia: 'Pay via',
                d17Desc: 'D17 payment details',
                scanD17: 'Scan QR code',
                amount: 'Amount',
                to: 'To',
                orEnterPhone: 'Or enter phone',
                d17PhoneLabel: 'D17 phone number',
                flouciDesc: 'Flouci details',
                flouciRedirect: 'You will be redirected',
                openFlouci: 'Open Flouci',
                secureTransaction: 'Secure transaction',
                creditCard: 'Credit card',
                cardNumber: 'Card number',
                expiryDate: 'Expiry date',
                cardHolder: 'Card holder',
                processing: 'Processing payment',
                processingDesc: 'Please wait while we process your payment',
                success: 'Payment successful',
                transferred: 'Transferred',
                transactionId: 'Transaction ID',
                totalToPay: 'Total to pay',
                payNow: 'Pay now',
            },
            common: {
                tnd: 'TND',
                cancel: 'Cancel',
            },
        },
    }),
}));

vi.mock('@/components/ui/Modal', () => ({
    default: ({ isOpen, title, children }: { isOpen: boolean; title: string; children: React.ReactNode }) => (
        isOpen ? <div role="dialog" aria-label={title}>{children}</div> : null
    ),
}));

vi.mock('@/components/ui/Button', () => ({
    default: ({
        children,
        onClick,
        disabled,
        type = 'button',
    }: {
        children: React.ReactNode;
        onClick?: () => void;
        disabled?: boolean;
        type?: 'button' | 'submit' | 'reset';
    }) => (
        <button type={type} onClick={onClick} disabled={disabled}>
            {children}
        </button>
    ),
}));

vi.mock('@/components/ui/Input', () => ({
    default: ({
        label,
        value,
        onChange,
        placeholder,
        type = 'text',
    }: {
        label: string;
        value?: string;
        onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
        placeholder?: string;
        type?: string;
    }) => (
        <label>
            <span>{label}</span>
            <input value={value} onChange={onChange} placeholder={placeholder} type={type} />
        </label>
    ),
}));

import PaymentModal from '@/components/ui/PaymentModal';

describe('PaymentModal accessibility', () => {
    it('wires payment method tabs to the active tabpanel', () => {
        render(
            <PaymentModal
                isOpen
                onClose={() => {}}
                amount={250}
                recipientName="Freelancer"
                onSuccess={async () => {}}
            />
        );

        const tablist = screen.getByRole('tablist', { name: 'اختر طريقة الدفع' });
        expect(tablist).toBeInTheDocument();

        const d17Tab = screen.getByRole('tab', { name: 'D17' });
        const flouciTab = screen.getByRole('tab', { name: 'Flouci' });
        const cardTab = screen.getByRole('tab', { name: 'Credit card' });

        expect(d17Tab).toHaveAttribute('aria-selected', 'true');
        expect(d17Tab).toHaveAttribute('aria-controls', 'payment-panel-d17');
        expect(flouciTab).toHaveAttribute('aria-selected', 'false');
        expect(cardTab).toHaveAttribute('aria-selected', 'false');

        fireEvent.click(flouciTab);
        expect(flouciTab).toHaveAttribute('aria-selected', 'true');

        const activePanel = screen.getByRole('tabpanel');
        expect(activePanel).toHaveAttribute('id', 'payment-panel-flouci');
        expect(activePanel).toHaveAttribute('aria-labelledby', 'payment-tab-flouci');
    });

});
