
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
        <div className="min-h-screen bg-gray-50 dark:bg-dark-950 transition-colors duration-300">
            <SEO {...SEO_CONFIG.howItWorks} url="/how-it-works" />
            <Header />

            {/* Hero */}
            <section className="bg-white dark:bg-dark-950 py-20 relative overflow-hidden transition-colors duration-500">
                <div className="container-custom relative z-10 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold text-dark-900 dark:text-white mb-6">
                        {t.howItWorks.heroTitle} <span className="text-primary-600 dark:text-primary-500">{t.howItWorks.brandName}</span>
                    </h1>
                    <p className="text-xl text-muted dark:text-dark-300 max-w-2xl mx-auto mb-12">
                        {t.howItWorks.subtitle}
                    </p>

                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => setActiveTab('freelancer')}
                            className={`px-8 py-4 rounded-full text-lg font-bold transition-all ${activeTab === 'freelancer'
                                ? 'bg-primary-600 text-white shadow-lg scale-105'
                                : 'bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-700'
                                }`}
                        >
                            {t.howItWorks.tabs.freelancer}
                        </button>
                        <button
                            onClick={() => setActiveTab('client')}
                            className={`px-8 py-4 rounded-full text-lg font-bold transition-all ${activeTab === 'client'
                                ? 'bg-secondary-600 text-white shadow-lg scale-105'
                                : 'bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-700'
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
                            <div key={index} className="card p-8 relative group hover:-translate-y-2 transition-transform duration-300">
                                <div className="absolute -top-6 right-8 w-12 h-12 rounded-2xl bg-white dark:bg-dark-800 shadow-lg flex items-center justify-center text-xl font-bold text-gray-300 border border-gray-100 dark:border-dark-700 group-hover:text-primary-600 group-hover:border-primary-200 transition-colors">
                                    {index + 1}
                                </div>
                                <div className={`w-16 h-16 rounded-2xl mb-6 flex items-center justify-center ${activeTab === 'freelancer' ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-secondary-50 dark:bg-secondary-900/20'
                                    }`}>
                                    {step.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                                <p className="text-muted leading-relaxed">
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
            <section className="py-16 bg-white dark:bg-dark-900 border-y border-gray-100 dark:border-dark-800">
                <div className="container-custom">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        <div className="flex flex-col items-center">
                            <Shield className="w-12 h-12 text-green-500 mb-4" />
                            <h3 className="font-bold text-lg mb-2">{t.howItWorks.trust.money.title}</h3>
                            <p className="text-muted text-sm">{t.howItWorks.trust.money.desc}</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <CheckCircle className="w-12 h-12 text-primary-500 mb-4" />
                            <h3 className="font-bold text-lg mb-2">{t.howItWorks.trust.verified.title}</h3>
                            <p className="text-muted text-sm">{t.howItWorks.trust.verified.desc}</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <HelpCircle className="w-12 h-12 text-secondary-500 mb-4" />
                            <h3 className="font-bold text-lg mb-2">{t.howItWorks.trust.support.title}</h3>
                            <p className="text-muted text-sm">{t.howItWorks.trust.support.desc}</p>
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
                                    className="w-full flex items-center justify-between p-6 text-right font-bold hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors"
                                >
                                    <span>{faq.q}</span>
                                    {openFaq === index ? (
                                        <ChevronUp className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                    )}
                                </button>
                                {openFaq === index && (
                                    <div className="px-6 pb-6 text-muted leading-relaxed border-t border-gray-100 dark:border-dark-700 pt-4 bg-gray-50/50 dark:bg-dark-800/50">
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
