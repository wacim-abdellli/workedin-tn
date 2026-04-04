
import { Link } from 'react-router-dom';
import { Header, Footer } from '../components/layout';
import Button from '../components/ui/Button';
import {
    Zap, Shield, Users, Star
} from 'lucide-react';
import { useTranslation } from '../i18n';
import SEO, { SEO_CONFIG } from '../components/common/SEO';

function ForClients() {
    const { t } = useTranslation();

    // Mock top freelancers (In real app, fetch from DB)
    const topFreelancers = [
        { name: "Amine B.", role: t.categories.webDev, rating: 5.0, image: "https://i.pravatar.cc/150?img=68" },
        { name: "Sarah M.", role: t.categories.graphicDesign, rating: 4.9, image: "https://i.pravatar.cc/150?img=49" },
        { name: "Yassine T.", role: t.categories.translation, rating: 4.8, image: "https://i.pravatar.cc/150?img=33" },
    ];

    return (
        <div className="min-h-screen bg-[#faf8ff] text-[#171420] dark:bg-[#0b0912] dark:text-white">
            <SEO {...SEO_CONFIG.forClients} url="/for-clients" />
            <Header />

            {/* Hero */}
            <section className="relative overflow-hidden border-b border-white/40 bg-white dark:bg-gray-900/80 py-20 text-[#171420] backdrop-blur-xl dark:border-white/5 dark:bg-[#0f0d16] dark:text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.18),transparent_35%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.14),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,247,255,0.78))] dark:bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.24),transparent_35%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.1),transparent_25%),linear-gradient(180deg,rgba(15,13,22,0.96),rgba(9,7,15,0.94))]" />
                <div className="container-custom relative z-10">
                    <div className="max-w-3xl">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-100 bg-accent-50 px-3 py-1 text-sm font-medium text-accent-700 dark:border-accent-800/30 dark:bg-accent-950/30 dark:text-accent-300">
                            <Star className="h-4 w-4 fill-current" />
                            {t.forClients.hero.badge}
                        </div>
                        <h1 className="text-[clamp(2.5rem,5vw,4rem)] font-bold leading-[1.08] tracking-[-0.03em]">
                            {t.forClients.hero.title}
                            <span className="mt-1 block bg-gradient-to-br from-primary-400 to-accent-400 bg-clip-text text-transparent">
                                {t.forClients.hero.titleHighlight}
                            </span>
                        </h1>
                        <p className="mb-10 mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                            {t.forClients.hero.subtitle}
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link to="/signup?type=client">
                                <Button variant="secondary" size="lg" className="rounded-xl border-none bg-primary-600 px-6 py-3 font-semibold text-white shadow-lg shadow-primary-500/20 transition-all duration-200 hover:bg-primary-500 hover:shadow-xl hover:shadow-primary-500/30">
                                    {t.forClients.hero.cta}
                                </Button>
                            </Link>
                            <Link to="/how-it-works">
                                <Button variant="outline" size="lg" className="rounded-xl border border-gray-300 px-6 py-3 text-gray-700 dark:text-gray-200 transition-all duration-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-white/20 dark:text-gray-200 dark:hover:bg-white dark:bg-gray-900/5">
                                    {t.forClients.hero.secondary}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Abstract Shapes */}
                <div className="absolute right-0 top-0 h-full w-1/2 translate-x-1/4 skew-x-12 bg-white dark:bg-gray-900/30 dark:bg-white dark:bg-gray-900/5" />
                <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-primary-600/20 blur-3xl" />
            </section>

            {/* Benefits Grid */}
            <section className="bg-gray-50 dark:bg-gray-800 py-20 transition-colors duration-500 dark:bg-[#0b0912]">
                <div className="container-custom">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="rounded-[24px] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-sm dark:border-white/5 dark:bg-[#1a1825]">
                            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
                                <Zap className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                            </div>
                            <h3 className="mb-3 text-xl font-bold dark:text-white">{t.forClients.benefits.speed.title}</h3>
                            <p className="text-muted">
                                {t.forClients.benefits.speed.desc}
                            </p>
                        </div>
                        <div className="rounded-[24px] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-sm dark:border-white/5 dark:bg-[#1a1825]">
                            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/30">
                                <Shield className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                            </div>
                            <h3 className="mb-3 text-xl font-bold dark:text-white">{t.forClients.benefits.secure.title}</h3>
                            <p className="text-muted">
                                {t.forClients.benefits.secure.desc}
                            </p>
                        </div>
                        <div className="rounded-[24px] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-sm dark:border-white/5 dark:bg-[#1a1825]">
                            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-accent-100 dark:bg-accent-900/30">
                                <Users className="h-8 w-8 text-accent-600 dark:text-accent-400" />
                            </div>
                            <h3 className="mb-3 text-xl font-bold dark:text-white">{t.forClients.benefits.local.title}</h3>
                            <p className="text-muted">
                                {t.forClients.benefits.local.desc}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories Showcase */}
            <section className="py-20">
                <div className="container-custom">
                    <h2 className="mb-12 text-center text-3xl font-bold dark:text-white">{t.forClients.categories.title}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {t.forClients.categories.items.map((cat, i) => (
                            <div key={i} className="cursor-pointer rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 text-center transition-all hover:border-primary-300 hover:shadow-md dark:border-white/5 dark:bg-[#1a1825]">
                                <h3 className="font-bold text-gray-700 dark:text-gray-200 transition-colors dark:text-gray-200">{cat}</h3>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Top Talent Teaser (Mock) */}
            <section className="py-20 bg-gray-50 dark:bg-dark-900 transition-colors duration-500">
                <div className="container-custom">
                    <div className="mb-12 flex items-center justify-between">
                        <h2 className="text-3xl font-bold dark:text-white">{t.forClients.talent.title}</h2>
                        <Link to="/search">
                            <Button variant="outline">{t.publicProfile.showMore}</Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {topFreelancers.map((freelancer, i) => (
                            <div key={i} className="card flex flex-col items-center p-6 text-center">
                                <img src={freelancer.image} alt={freelancer.name} className="w-24 h-24 rounded-full mb-4 object-cover" />
                                <h3 className="font-bold text-lg">{freelancer.name}</h3>
                                <p className="text-primary-600 text-sm mb-2">{freelancer.role}</p>
                                <div className="flex items-center gap-1 text-yellow-500 text-sm font-bold">
                                    <Star className="w-4 h-4 fill-current" />
                                    {freelancer.rating}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="bg-[#120f1c] py-20 text-center text-white">
                <div className="container-custom max-w-2xl">
                    <h2 className="text-3xl font-bold mb-6">{t.forClients.cta.title}</h2>
                    <p className="mb-8 text-xl text-secondary-100">
                        {t.forClients.cta.text}
                    </p>
                    <Link to="/signup?type=client">
                        <Button size="lg" className="rounded-xl bg-white dark:bg-gray-900 px-12 py-4 text-lg font-bold text-secondary-900 hover:bg-secondary-50">
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
