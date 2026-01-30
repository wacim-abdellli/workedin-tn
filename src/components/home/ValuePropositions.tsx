import { Zap, Wallet, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/i18n';

export default function ValuePropositions() {
    const { t } = useTranslation();

    return (
        <section className="section relative overflow-hidden">
            <div className="absolute inset-0 gradient-mesh" />
            <div className="container-custom relative">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* No Bidding */}
                    <div className="card-hover text-center group p-8 animate-slide-up opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '100ms' }}>
                        <div className="relative">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-lg shadow-primary-600/30 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-primary-600/40 transition-all duration-300">
                                <Zap className="w-10 h-10" />
                            </div>
                            <div className="absolute -top-2 -end-2 w-6 h-6 rounded-full bg-gradient-to-r from-accent-400 to-accent-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                                ✓
                            </div>
                        </div>
                        <h3 className="text-xl font-bold mb-3">
                            {t.values.noBidding.title}
                        </h3>
                        <p className="text-muted leading-relaxed">
                            {t.values.noBidding.description}
                        </p>
                    </div>

                    {/* Local Payment */}
                    <div className="card-hover text-center group p-8 animate-slide-up opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '200ms' }}>
                        <div className="relative">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center text-white shadow-lg shadow-success-500/30 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-success-500/40 transition-all duration-300">
                                <Wallet className="w-10 h-10" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold mb-3">
                            {t.values.localPayment.title}
                        </h3>
                        <p className="text-muted leading-relaxed">
                            {t.values.localPayment.description}
                        </p>
                    </div>

                    {/* Micro Jobs */}
                    <div className="card-hover text-center group p-8 animate-slide-up opacity-0 [animation-fill-mode:forwards]" style={{ animationDelay: '300ms' }}>
                        <div className="relative">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center text-white shadow-lg shadow-accent-500/30 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-accent-500/40 transition-all duration-300">
                                <TrendingUp className="w-10 h-10" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold mb-3">
                            {t.values.microJobs.title}
                        </h3>
                        <p className="text-muted leading-relaxed">
                            {t.values.microJobs.description}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
