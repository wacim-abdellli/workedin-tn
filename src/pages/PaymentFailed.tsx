import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { XCircle, ArrowRight, RefreshCw, Home } from 'lucide-react';
import { useTranslation } from '../i18n';

/**
 * PaymentFailed Page
 * Displayed when Flouci payment fails or is cancelled
 */
const PaymentFailed = () => {
    const { dir, tx } = useTranslation();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const contractId = searchParams.get('contract_id');
    const errorCode = searchParams.get('error');

    const getErrorMessage = (code: string | null): string => {
        switch (code) {
            case 'cancelled':
                return 'تم إلغاء عملية الدفع';
            case 'declined':
                return 'تم رفض البطاقة. يرجى التحقق من البيانات أو استخدام بطاقة أخرى.';
            case 'insufficient_funds':
                return 'رصيد غير كافي في البطاقة';
            case 'expired':
                return 'انتهت صلاحية جلسة الدفع. يرجى المحاولة مرة أخرى.';
            case 'network_error':
                return 'خطأ في الاتصال. يرجى التحقق من اتصال الإنترنت.';
            default:
                return 'فشلت عملية الدفع. يرجى المحاولة مرة أخرى.';
        }
    };

    const handleRetry = () => {
        if (contractId) {
            navigate(`/contracts/${contractId}`);
        } else {
            navigate(-1);
        }
    };

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-red-900/20 flex items-center justify-center p-4"
            dir={dir}
        >
            <div className="max-w-md w-full">
                <div className="bg-card rounded-2xl shadow-xl p-8 text-center">
                    {/* Error Icon */}
                    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <XCircle className="w-10 h-10 text-red-600" />
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-foreground dark:text-white mb-2">
                        {tx('dynamic_key_1053149402')}</h2>

                    {/* Error Message */}
                    <p className="text-muted-foreground mb-6">
                        {getErrorMessage(errorCode)}
                    </p>

                    {/* Tips */}
                    <div className="bg-surface rounded-xl p-4 mb-6 text-right">
                        <h4 className="font-semibold text-foreground dark:text-white mb-2">
                            {tx('dynamic_key_1348454276')}</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                            <li>{tx('dynamic_key_1707230249')}</li>
                            <li>{tx('dynamic_key_158612530')}</li>
                            <li>{tx('dynamic_key_201330750')}</li>
                            <li>{tx('dynamic_key_1659410812')}</li>
                        </ul>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <button
                            onClick={handleRetry}
                            className="btn-primary btn-lg justify-center w-full"
                        >
                            <RefreshCw className="w-5 h-5" />
                            <span>{tx('dynamic_key_131381918')}</span>
                        </button>

                        {contractId && (
                            <Link
                                to={`/contracts/${contractId}`}
                                className="btn-secondary btn-lg justify-center w-full"
                            >
                                <span>{tx('dynamic_key_1933160140')}</span>
                                <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                            </Link>
                        )}

                        <Link
                            to="/"
                            className="flex items-center justify-center gap-2 text-muted hover:text-muted-foreground mt-4"
                        >
                            <Home className="w-4 h-4" />
                            <span>{tx('dynamic_key_128175915')}</span>
                        </Link>
                    </div>

                    {/* Support */}
                    <p className="text-xs text-muted mt-6">
                        {tx('dynamic_key_331518742')}</p>
                </div>
            </div>
        </div>
    );
};

export default PaymentFailed;
