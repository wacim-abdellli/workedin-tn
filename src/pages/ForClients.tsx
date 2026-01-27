
import { Link } from 'react-router-dom';
import { Header, Footer } from '../components/layout';
import Button from '../components/ui/Button';
import {
    Zap, Shield, Users, Star
} from 'lucide-react';
import { useTranslation } from '../i18n';

function ForClients() {
    const { t } = useTranslation();

    // Mock top freelancers (In real app, fetch from DB)
    const topFreelancers = [
        { name: "Amine B.", role: t.categories.webDev, rating: 5.0, image: "https://i.pravatar.cc/150?img=68" },
        { name: "Sarah M.", role: t.categories.graphicDesign, rating: 4.9, image: "https://i.pravatar.cc/150?img=49" },
        { name: "Yassine T.", role: t.categories.translation, rating: 4.8, image: "https://i.pravatar.cc/150?img=33" },
    ];

    return (
        <div className="min-h-screen bg-white">
            <Header />

            {/* Hero */}
            <section className="relative py-20 bg-secondary-900 text-white overflow-hidden">
                <div className="container-custom relative z-10">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-800 text-secondary-200 text-sm font-medium mb-6">
                            <Star className="w-4 h-4 fill-secondary-200" />
                            {t.forClients.hero.badge}
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                            {t.forClients.hero.title} <span className="text-secondary-400">{t.howItWorks.brandName}</span>
                        </h1>
                        <p className="text-xl text-secondary-100 mb-10 max-w-2xl leading-relaxed">
                            {t.forClients.hero.subtitle}
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link to="/signup?type=client">
                                <Button variant="secondary" size="lg" className="bg-secondary-500 hover:bg-secondary-600 text-white border-none py-6 px-8 text-lg">
                                    {t.forClients.hero.cta}
                                </Button>
                            </Link>
                            <Link to="/how-it-works">
                                <Button variant="outline" size="lg" className="text-white border-white/20 hover:bg-white/10 py-6 px-8 text-lg">
                                    {t.forClients.hero.secondary}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Abstract Shapes */}
                <div className="absolute right-0 top-0 w-1/2 h-full bg-secondary-800/30 skew-x-12 translate-x-1/4" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary-600/20 rounded-full blur-3xl" />
            </section>

            {/* Benefits Grid */}
            <section className="py-20 bg-gray-50 dark:bg-dark-900 transition-colors duration-500">
                <div className="container-custom">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-white dark:bg-dark-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700">
                            <div className="w-14 h-14 bg-secondary-100 rounded-xl flex items-center justify-center mb-6">
                                <Zap className="w-8 h-8 text-secondary-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">{t.forClients.benefits.speed.title}</h3>
                            <p className="text-muted">
                                {t.forClients.benefits.speed.desc}
                            </p>
                        </div>
                        <div className="bg-white dark:bg-dark-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700">
                            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                                <Shield className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">{t.forClients.benefits.secure.title}</h3>
                            <p className="text-muted">
                                {t.forClients.benefits.secure.desc}
                            </p>
                        </div>
                        <div className="bg-white dark:bg-dark-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700">
                            <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mb-6">
                                <Users className="w-8 h-8 text-primary-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">{t.forClients.benefits.local.title}</h3>
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
                    <h2 className="text-3xl font-bold text-center mb-12">{t.forClients.categories.title}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {t.forClients.categories.items.map((cat, i) => (
                            <div key={i} className="p-6 border border-gray-200 dark:border-dark-700 rounded-xl hover:border-secondary-500 hover:shadow-md transition-all cursor-pointer text-center group bg-white dark:bg-dark-800">
                                <h3 className="font-bold text-gray-700 dark:text-gray-200 group-hover:text-secondary-600 transition-colors">{cat}</h3>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Top Talent Teaser (Mock) */}
            <section className="py-20 bg-gray-50 dark:bg-dark-900 transition-colors duration-500">
                <div className="container-custom">
                    <div className="flex items-center justify-between mb-12">
                        <h2 className="text-3xl font-bold">{t.forClients.talent.title}</h2>
                        <Link to="/search">
                            <Button variant="outline">{t.publicProfile.showMore}</Button>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {topFreelancers.map((freelancer, i) => (
                            <div key={i} className="card p-6 flex flex-col items-center text-center">
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
            <section className="py-20 bg-secondary-900 text-white text-center">
                <div className="container-custom max-w-2xl">
                    <h2 className="text-3xl font-bold mb-6">{t.forClients.cta.title}</h2>
                    <p className="text-xl text-secondary-100 mb-8">
                        {t.forClients.cta.text}
                    </p>
                    <Link to="/signup?type=client">
                        <Button size="lg" className="bg-white text-secondary-900 hover:bg-secondary-50 px-12 py-4 text-lg font-bold">
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
