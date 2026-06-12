
import { Link } from 'react-router-dom';
import { Header, Footer } from '../components/layout';
import Button from '../components/ui/Button';
import {
    Zap, Shield, Users, Star
} from 'lucide-react';
import { useTranslation } from '../i18n';
import SEO, { SEO_CONFIG } from '../components/common/SEO';

function ForClients() {
    const { t, tx } = useTranslation();

    const categories = [
        tx('forClients.categories.items.dev', {}, 'Development & IT'),
        tx('forClients.categories.items.design', {}, 'Design & Creative'),
        tx('forClients.categories.items.writing', {}, 'Writing & Translation'),
        tx('forClients.categories.items.marketing', {}, 'Sales & Marketing'),
        tx('forClients.categories.items.admin', {}, 'Admin & Customer Support'),
        tx('forClients.categories.items.finance', {}, 'Finance & Accounting'),
        tx('forClients.categories.items.video', {}, 'Video & Animation'),
        tx('forClients.categories.items.data', {}, 'Data Science & Analytics'),
    ];

    // Mock top freelancers (In real app, fetch from DB)
    const topFreelancers = [
        { name: "Amine B.", role: t.categories.webDev, rating: 5.0, image: "https://i.pravatar.cc/150?img=68" },
        { name: "Sarah M.", role: t.categories.graphicDesign, rating: 4.9, image: "https://i.pravatar.cc/150?img=49" },
        { name: "Yassine T.", role: t.categories.translation, rating: 4.8, image: "https://i.pravatar.cc/150?img=33" },
    ];

    return (
        <div className="min-h-screen" style={{ background: 'var(--color-bg-subtle)', color: 'var(--color-text-primary)' }}>
            <SEO {...SEO_CONFIG.forClients} url="/for-clients" />
            <Header />

            {/* Hero */}
            <section className="relative overflow-hidden py-20" style={{ background: 'var(--color-bg-base)', borderBottom: '1px solid var(--color-border-subtle)' }}>
                <div className="absolute inset-0" style={{
                    background: 'radial-gradient(circle at top left, color-mix(in srgb, var(--color-brand-primary) 18%, transparent) 0%, transparent 35%), radial-gradient(circle at top right, color-mix(in srgb, var(--color-brand-secondary) 14%, transparent) 0%, transparent 28%)'
                }} />
                <div className="container-custom relative z-10">
                    <div className="max-w-3xl">
                        <div 
                            className="mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium"
                            style={{
                                border: '1px solid var(--color-brand-secondary)',
                                background: 'var(--color-brand-secondary-light)',
                                color: 'var(--color-brand-secondary)'
                            }}
                        >
                            <Star className="h-4 w-4 fill-current" />
                            {t.forClients.hero.badge}
                        </div>
                        <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-bold leading-[1.08] tracking-[-0.03em]">
                            {t.forClients.hero.title}
                            <span className="mt-1 block bg-gradient-to-br from-purple-400 to-amber-400 bg-clip-text text-transparent">
                                {t.forClients.hero.titleHighlight}
                            </span>
                        </h1>
                        <p className="mb-10 mt-6 max-w-2xl text-lg leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                            {t.forClients.hero.subtitle}
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link to="/signup?type=client">
                                <Button variant="primary" size="lg" className="px-6 py-3 font-semibold">
                                    {t.forClients.hero.cta}
                                </Button>
                            </Link>
                            <Link to="/how-it-works">
                                <Button variant="outline" size="lg" className="px-6 py-3">
                                    {t.forClients.hero.secondary}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Abstract Shapes */}
                <div className="absolute right-0 top-0 h-full w-1/2 translate-x-1/4 skew-x-12 opacity-5" style={{ background: 'var(--color-bg-elevated)' }} />
                <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full blur-3xl opacity-20" style={{ background: 'var(--color-brand-primary)' }} />
            </section>

            {/* Benefits Grid */}
            <section className="py-20" style={{ background: 'var(--color-bg-base)' }}>
                <div className="container-custom">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div 
                            className="rounded-[24px] p-8 shadow-sm"
                            style={{
                                background: 'var(--color-bg-elevated)',
                                border: '1px solid var(--color-border-subtle)'
                            }}
                        >
                            <div 
                                className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl"
                                style={{ background: 'var(--color-brand-primary-light)' }}
                            >
                                <Zap className="h-8 w-8" style={{ color: 'var(--color-brand-primary)' }} />
                            </div>
                            <h3 className="mb-3 text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{t.forClients.benefits.speed.title}</h3>
                            <p style={{ color: 'var(--color-text-secondary)' }}>
                                {t.forClients.benefits.speed.desc}
                            </p>
                        </div>
                        <div 
                            className="rounded-[24px] p-8 shadow-sm"
                            style={{
                                background: 'var(--color-bg-elevated)',
                                border: '1px solid var(--color-border-subtle)'
                            }}
                        >
                            <div 
                                className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl"
                                style={{ background: 'var(--color-brand-primary-light)' }}
                            >
                                <Shield className="h-8 w-8" style={{ color: 'var(--color-brand-primary)' }} />
                            </div>
                            <h3 className="mb-3 text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{t.forClients.benefits.secure.title}</h3>
                            <p style={{ color: 'var(--color-text-secondary)' }}>
                                {t.forClients.benefits.secure.desc}
                            </p>
                        </div>
                        <div 
                            className="rounded-[24px] p-8 shadow-sm"
                            style={{
                                background: 'var(--color-bg-elevated)',
                                border: '1px solid var(--color-border-subtle)'
                            }}
                        >
                            <div 
                                className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl"
                                style={{ background: 'var(--color-brand-secondary-light)' }}
                            >
                                <Users className="h-8 w-8" style={{ color: 'var(--color-brand-secondary)' }} />
                            </div>
                            <h3 className="mb-3 text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{t.forClients.benefits.local.title}</h3>
                            <p style={{ color: 'var(--color-text-secondary)' }}>
                                {t.forClients.benefits.local.desc}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories Showcase */}
            <section className="py-20">
                <div className="container-custom">
                    <h2 className="mb-12 text-center text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{t.forClients.categories.title}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {categories.map((cat, i) => (
                            <div 
                                key={i} 
                                className="cursor-pointer rounded-xl p-6 text-center transition-all hover:shadow-md"
                                style={{
                                    background: 'var(--color-bg-elevated)',
                                    border: '1px solid var(--color-border-subtle)'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-brand-primary)'}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border-subtle)'}
                            >
                                <h3 className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{cat}</h3>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Top Talent Teaser (Mock) */}
            <section className="py-20" style={{ background: 'var(--color-bg-subtle)' }}>
                <div className="container-custom">
                    <div className="mb-12 flex items-center justify-between">
                        <h2 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{t.forClients.talent.title}</h2>
                        <Link to="/search">
                            <Button variant="outline">{t.publicProfile.showMore}</Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {topFreelancers.map((freelancer, i) => (
                            <div 
                                key={i} 
                                className="flex flex-col items-center p-6 text-center rounded-2xl shadow-sm"
                                style={{
                                    background: 'var(--color-bg-elevated)',
                                    border: '1px solid var(--color-border-subtle)'
                                }}
                            >
                                <img src={freelancer.image} alt={freelancer.name} className="w-24 h-24 rounded-full mb-4 object-cover" />
                                <h3 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>{freelancer.name}</h3>
                                <p className="text-sm mb-2" style={{ color: 'var(--color-brand-primary)' }}>{freelancer.role}</p>
                                <div className="flex items-center gap-1 text-sm font-bold" style={{ color: 'var(--color-status-warning)' }}>
                                    <Star className="w-4 h-4 fill-current" />
                                    {freelancer.rating}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 text-center" style={{ background: 'var(--color-bg-muted)', color: 'var(--color-text-primary)' }}>
                <div className="container-custom max-w-2xl">
                    <h2 className="text-3xl font-bold mb-6">{t.forClients.cta.title}</h2>
                    <p className="mb-8 text-xl" style={{ color: 'var(--color-text-secondary)' }}>
                        {t.forClients.cta.text}
                    </p>
                    <Link to="/signup?type=client">
                        <Button size="lg" variant="primary" className="px-12 py-4 text-lg font-bold">
                            {t.forClients.cta.button}
                        </Button>
                    </Link>
                </div>
            </section>

            <Footer />
        </div>
    );
}

export default ForClients;
