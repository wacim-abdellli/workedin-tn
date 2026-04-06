
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
        <User className="w-8 h-8" style={{ color: 'var(--color-brand-primary)' }} />,
        <Search className="w-8 h-8" style={{ color: 'var(--color-brand-primary)' }} />,
        <MessageSquare className="w-8 h-8" style={{ color: 'var(--color-brand-primary)' }} />,
        <CreditCard className="w-8 h-8" style={{ color: 'var(--color-brand-primary)' }} />
    ];

    const clientIcons = [
        <Briefcase className="w-8 h-8" style={{ color: 'var(--color-brand-secondary)' }} />,
        <CheckCircle className="w-8 h-8" style={{ color: 'var(--color-brand-secondary)' }} />,
        <MessageSquare className="w-8 h-8" style={{ color: 'var(--color-brand-secondary)' }} />,
        <Star className="w-8 h-8" style={{ color: 'var(--color-brand-secondary)' }} />
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
        <div className="min-h-screen" style={{ background: 'var(--color-bg-subtle)' }}>
            <SEO {...SEO_CONFIG.howItWorks} url="/how-it-works" />
            <Header />

            {/* Hero */}
            <section className="relative overflow-hidden py-20" style={{ background: 'var(--color-bg-base)' }}>
                <div className="container-custom relative z-10 text-center">
                    <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-bold leading-[1.08] tracking-[-0.03em]" style={{ color: 'var(--color-text-primary)' }}>
                        {t.howItWorks.heroTitle}
                        <span className="block bg-gradient-to-br from-purple-400 to-amber-400 bg-clip-text text-transparent">
                            {t.howItWorks.heroTitleHighlight}
                        </span>
                    </h1>
                    <p className="mx-auto mb-12 mt-6 max-w-2xl text-lg leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                        {t.howItWorks.subtitle}
                    </p>

                    <div className="flex justify-center gap-4">
                        <button
                            onClick={() => setActiveTab('freelancer')}
                            className={`px-8 py-4 rounded-full text-lg font-bold transition-all ${activeTab === 'freelancer'
                                ? 'text-white shadow-lg scale-105'
                                : 'hover:opacity-80'
                                }`}
                            style={activeTab === 'freelancer' 
                                ? { background: 'var(--color-brand-primary)' }
                                : { background: 'var(--color-bg-muted)', color: 'var(--color-text-secondary)' }
                            }
                        >
                            {t.howItWorks.tabs.freelancer}
                        </button>
                        <button
                            onClick={() => setActiveTab('client')}
                            className={`px-8 py-4 rounded-full text-lg font-bold transition-all ${activeTab === 'client'
                                ? 'text-white shadow-lg scale-105'
                                : 'hover:opacity-80'
                                }`}
                            style={activeTab === 'client' 
                                ? { background: 'var(--color-brand-secondary)' }
                                : { background: 'var(--color-bg-muted)', color: 'var(--color-text-secondary)' }
                            }
                        >
                            {t.howItWorks.tabs.client}
                        </button>
                    </div>
                </div>

                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-64 h-64 rounded-full blur-3xl opacity-50 -translate-x-1/2 -translate-y-1/2" style={{ background: 'var(--color-brand-primary-light)' }} />
                <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-50 translate-x-1/3 translate-y-1/3" style={{ background: 'var(--color-brand-secondary-light)' }} />
            </section>

            {/* Steps Section */}
            <section className="py-20">
                <div className="container-custom">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {steps[activeTab].map((step, index) => (
                            <div 
                                key={index} 
                                className="relative rounded-[24px] p-8 shadow-sm transition-transform duration-300 hover:-translate-y-2"
                                style={{
                                    background: 'var(--color-bg-elevated)',
                                    border: '1px solid var(--color-border-subtle)'
                                }}
                            >
                                {index !== steps[activeTab].length - 1 ? (
                                    <div 
                                        className="absolute left-[calc(50%+1.5rem)] top-[2rem] hidden h-[2px] w-[calc(100%-2rem)] bg-gradient-to-r from-purple-200 to-amber-200 lg:block"
                                        style={{ opacity: 0.3 }}
                                    />
                                ) : null}
                                <div 
                                    className="mb-6 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white"
                                    style={{ background: 'var(--color-brand-primary)' }}
                                >
                                    {index + 1}
                                </div>
                                <div 
                                    className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
                                    style={{ background: 'var(--color-brand-primary-light)' }}
                                >
                                    {step.icon}
                                </div>
                                <h3 className="mb-3 text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>{step.title}</h3>
                                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
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
            <section className="py-16" style={{ background: 'var(--color-bg-base)', borderTop: '1px solid var(--color-border-subtle)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                <div className="container-custom">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        <div 
                            className="flex flex-col items-center rounded-[24px] px-6 py-8"
                            style={{
                                background: 'var(--color-bg-elevated)',
                                border: '1px solid var(--color-border-subtle)'
                            }}
                        >
                            <div 
                                className="mb-4 rounded-xl p-3"
                                style={{ background: 'var(--color-brand-primary-light)' }}
                            >
                                <Shield className="h-6 w-6" style={{ color: 'var(--color-brand-primary)' }} />
                            </div>
                            <h3 className="mb-2 text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{t.howItWorks.trust.money.title}</h3>
                            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{t.howItWorks.trust.money.desc}</p>
                        </div>
                        <div 
                            className="flex flex-col items-center rounded-[24px] px-6 py-8"
                            style={{
                                background: 'var(--color-bg-elevated)',
                                border: '1px solid var(--color-border-subtle)'
                            }}
                        >
                            <div 
                                className="mb-4 rounded-xl p-3"
                                style={{ background: 'var(--color-brand-primary-light)' }}
                            >
                                <CheckCircle className="h-6 w-6" style={{ color: 'var(--color-brand-primary)' }} />
                            </div>
                            <h3 className="mb-2 text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{t.howItWorks.trust.verified.title}</h3>
                            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{t.howItWorks.trust.verified.desc}</p>
                        </div>
                        <div 
                            className="flex flex-col items-center rounded-[24px] px-6 py-8"
                            style={{
                                background: 'var(--color-bg-elevated)',
                                border: '1px solid var(--color-border-subtle)'
                            }}
                        >
                            <div 
                                className="mb-4 rounded-xl p-3"
                                style={{ background: 'var(--color-brand-primary-light)' }}
                            >
                                <HelpCircle className="h-6 w-6" style={{ color: 'var(--color-brand-primary)' }} />
                            </div>
                            <h3 className="mb-2 text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{t.howItWorks.trust.support.title}</h3>
                            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{t.howItWorks.trust.support.desc}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-20">
                <div className="container-custom max-w-3xl">
                    <h2 className="text-3xl font-bold text-center mb-12" style={{ color: 'var(--color-text-primary)' }}>{t.howItWorks.faq.title}</h2>

                    <div className="space-y-4">
                        {t.howItWorks.faq.items.map((faq, index) => (
                            <div 
                                key={index} 
                                className="overflow-hidden rounded-2xl"
                                style={{
                                    background: 'var(--color-bg-elevated)',
                                    border: '1px solid var(--color-border-subtle)',
                                    boxShadow: 'var(--shadow-sm)'
                                }}
                            >
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="w-full flex items-center justify-between p-6 text-right font-bold transition-colors"
                                    style={{ color: 'var(--color-text-primary)' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-muted)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <span>{faq.q}</span>
                                    {openFaq === index ? (
                                        <ChevronUp className="w-5 h-5" style={{ color: 'var(--color-text-tertiary)' }} />
                                    ) : (
                                        <ChevronDown className="w-5 h-5" style={{ color: 'var(--color-text-tertiary)' }} />
                                    )}
                                </button>
                                {openFaq === index && (
                                    <div 
                                        className="px-6 pb-6 leading-relaxed pt-4"
                                        style={{
                                            color: 'var(--color-text-secondary)',
                                            borderTop: '1px solid var(--color-border-subtle)',
                                            background: 'var(--color-bg-muted)'
                                        }}
                                    >
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
