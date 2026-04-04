
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header, Footer } from '../components/layout';
import Button from '../components/ui/Button';
import {
    User, Briefcase, CheckCircle, Search, MessageSquare,
    CreditCard, Star, Shield, HelpCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { useTranslation } from '../i18n';
import SEO, { SEO_CONFIG } from '../components/common/SEO';

function HowItWorks() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'freelancer' | 'client'>('freelancer');
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const toggleFaq = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const freelancerIcons = [
        <User className="w-8 h-8 text-primary-600" />,
        <Search className="w-8 h-8 text-primary-600" />,
        <MessageSquare className="w-8 h-8 text-primary-600" />,
        <CreditCard className="w-8 h-8 text-primary-600" />
    ];

    const clientIcons = [
        <Briefcase className="w-8 h-8 text-secondary-600" />,
        <CheckCircle className="w-8 h-8 text-secondary-600" />,
        <MessageSquare className="w-8 h-8 text-secondary-600" />,
        <Star className="w-8 h-8 text-secondary-600" />
    ];

    const steps = {
        freelancer: t.howItWorks.freelancerSteps.map((step, i) => ({
            ...step,
            icon: freelancerIcons[i]
        })),
        client: t.howItWorks.clientSteps.map((step, i) => ({
            ...step,
            icon: clientIcons[i]
        }))
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:bg-[#0b0912] transition-colors duration-300">
            <SEO {...SEO_CONFIG.howItWorks} url="/how-it-works" />
            <Header />

            {/* Hero */}
            <section className="relative overflow-hidden bg-white dark:bg-gray-800 dark:bg-gray-900 py-20 transition-colors duration-500 dark:bg-[#0b0912]">
                <div className="container-custom relative z-10 text-center">
                    <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-bold leading-[1.08] tracking-[-0.03em] text-gray-900 dark:text-gray-100 dark:text-white">
                        {t.howItWorks.heroTitle}
                        <span className="block bg-gradient-to-br from-purple-400 to-amber-400 bg-clip-text text-transparent">
                            {t.howItWorks.heroTitleHighlight}
                        </span>
                    </h1>
                    <p className="mx-auto mb-12 mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                        {t.howItWorks.subtitle}
                    </p>

                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => setActiveTab('freelancer')}
                            className={`px-8 py-4 rounded-full text-lg font-bold transition-all ${activeTab === 'freelancer'
                                ? 'bg-primary-600 text-white shadow-lg scale-105'
                                : 'bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-dark-700'
                                }`}
                        >
                            {t.howItWorks.tabs.freelancer}
                        </button>
                        <button
                            onClick={() => setActiveTab('client')}
                            className={`px-8 py-4 rounded-full text-lg font-bold transition-all ${activeTab === 'client'
                                ? 'bg-secondary-600 text-white shadow-lg scale-105'
                                : 'bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-dark-700'
                                }`}
                        >
                            {t.howItWorks.tabs.client}
                        </button>
                    </div>
                </div>

                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-primary-50 rounded-full blur-3xl opacity-50 -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary-50 rounded-full blur-3xl opacity-50 translate-x-1/3 translate-y-1/3" />
            </section>

            {/* Steps Section */}
            <section className="py-20">
                <div className="container-custom">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {steps[activeTab].map((step, index) => (
                            <div key={index} className="relative rounded-[24px] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 dark:bg-gray-900 p-8 shadow-sm transition-transform duration-300 hover:-translate-y-2 dark:border-white/5 dark:bg-[#1a1825]">
                                {index !== steps[activeTab].length - 1 ? (
                                    <div className="absolute left-[calc(50%+1.5rem)] top-[2rem] hidden h-[2px] w-[calc(100%-2rem)] bg-gradient-to-r from-purple-200 to-amber-200 lg:block dark:from-purple-800/30 dark:to-amber-800/30" />
                                ) : null}
                                <div className="mb-6 flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-sm font-semibold text-white">
                                    {index + 1}
                                </div>
                                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-900/30">
                                    {step.icon}
                                </div>
                                <h3 className="mb-3 text-xl font-semibold dark:text-white">{step.title}</h3>
                                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                                    {step.description}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-16">
                        <Link to={activeTab === 'freelancer' ? '/signup?type=freelancer' : '/signup?type=client'}>
                            <Button
                                variant={activeTab === 'freelancer' ? 'primary' : 'secondary'}
                                size="lg"
                                className="px-12"
                            >
                                {activeTab === 'freelancer' ? t.howItWorks.cta.freelancer : t.howItWorks.cta.client}
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Trust Badges */}
            <section className="border-y border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 dark:bg-gray-900 py-16 dark:border-white/5 dark:bg-[#120f1c]">
                <div className="container-custom">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        <div className="flex flex-col items-center rounded-[24px] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 dark:bg-gray-900 px-6 py-8 dark:border-white/5 dark:bg-[#1a1825]">
                            <div className="mb-4 rounded-xl bg-purple-100 p-3 dark:bg-purple-900/30">
                                <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100 dark:text-white">{t.howItWorks.trust.money.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t.howItWorks.trust.money.desc}</p>
                        </div>
                        <div className="flex flex-col items-center rounded-[24px] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 dark:bg-gray-900 px-6 py-8 dark:border-white/5 dark:bg-[#1a1825]">
                            <div className="mb-4 rounded-xl bg-purple-100 p-3 dark:bg-purple-900/30">
                                <CheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100 dark:text-white">{t.howItWorks.trust.verified.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t.howItWorks.trust.verified.desc}</p>
                        </div>
                        <div className="flex flex-col items-center rounded-[24px] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 dark:bg-gray-900 px-6 py-8 dark:border-white/5 dark:bg-[#1a1825]">
                            <div className="mb-4 rounded-xl bg-purple-100 p-3 dark:bg-purple-900/30">
                                <HelpCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100 dark:text-white">{t.howItWorks.trust.support.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t.howItWorks.trust.support.desc}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-20">
                <div className="container-custom max-w-3xl">
                    <h2 className="text-3xl font-bold text-center mb-12">{t.howItWorks.faq.title}</h2>

                    <div className="space-y-4">
                        {t.howItWorks.faq.items.map((faq, index) => (
                            <div key={index} className="card overflow-hidden">
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="w-full flex items-center justify-between p-6 text-right font-bold hover:bg-gray-50 dark:bg-gray-900 dark:bg-gray-800 dark:hover:bg-dark-800 transition-colors"
                                >
                                    <span>{faq.q}</span>
                                    {openFaq === index ? (
                                        <ChevronUp className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                    )}
                                </button>
                                {openFaq === index && (
                                    <div className="px-6 pb-6 text-muted leading-relaxed border-t border-gray-100 dark:border-gray-800 dark:border-dark-700 pt-4 bg-gray-50 dark:bg-gray-900 dark:bg-gray-800/50 dark:bg-dark-800/50">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}

export default HowItWorks;
