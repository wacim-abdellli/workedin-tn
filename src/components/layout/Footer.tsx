import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin, Mail, MapPin, Phone, Heart } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { useTheme } from '../../contexts/ThemeContext';

function Footer() {
    const { t } = useTranslation();
    const { theme } = useTheme();

    const footerLinks = [
        { href: '/about', label: t.footer.about },
        { href: '/faq', label: t.footer.faq },
        { href: '/terms', label: t.footer.terms },
        { href: '/privacy', label: t.footer.privacy },
        { href: '/contact', label: t.footer.contact },
    ];

    const socialLinks = [
        { icon: Facebook, href: '#', label: 'Facebook', color: 'hover:bg-blue-600' },
        { icon: Twitter, href: '#', label: 'Twitter', color: 'hover:bg-sky-500' },
        { icon: Instagram, href: '#', label: 'Instagram', color: 'hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-500' },
        { icon: Linkedin, href: '#', label: 'LinkedIn', color: 'hover:bg-blue-700' },
    ];

    return (
        <footer className="relative overflow-hidden">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-dark-900 to-dark-950" />
            <div className="absolute top-0 start-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 end-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-[120px]" />

            <div className="container-custom py-16 md:py-20 relative">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <Link to="/" className="inline-flex items-center group mb-10">
                            <img
                                src={theme === 'dark' ? '/logos/logo-stacked-dark.svg' : '/logos/logo-stacked.svg'}
                                alt="Khedma TN"
                                width="100"
                                height="90"
                                style={{ height: '72px', width: 'auto' }}
                                className="object-contain"
                            />
                        </Link>
                        <p className="text-dark-400 max-w-md mb-8 leading-relaxed">
                            {t.hero.subtitle}
                        </p>

                        {/* Contact Info */}
                        <div className="space-y-3 mb-8">
                            <div className="flex items-center gap-3 text-dark-400">
                                <div className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center">
                                    <MapPin className="w-5 h-5 text-primary-400" />
                                </div>
                                <span>تونس العاصمة، تونس</span>
                            </div>
                            <div className="flex items-center gap-3 text-dark-400">
                                <div className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center">
                                    <Mail className="w-5 h-5 text-primary-400" />
                                </div>
                                <span>contact@khedma.tn</span>
                            </div>
                            <div className="flex items-center gap-3 text-dark-400">
                                <div className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center">
                                    <Phone className="w-5 h-5 text-primary-400" />
                                </div>
                                <span dir="ltr">+216 XX XXX XXX</span>
                            </div>
                        </div>

                        {/* Social Links */}
                        <div className="flex items-center gap-3">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    aria-label={social.label}
                                    className={`w-11 h-11 rounded-xl bg-dark-800 flex items-center justify-center text-dark-400 hover:text-white ${social.color} transition-all duration-300 hover:scale-110 hover:shadow-lg`}
                                >
                                    <social.icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-bold text-lg text-white mb-6">روابط سريعة</h3>
                        <ul className="space-y-4">
                            {footerLinks.slice(0, 3).map((link) => (
                                <li key={link.href}>
                                    <Link
                                        to={link.href}
                                        className="text-dark-400 hover:text-white transition-colors flex items-center gap-2 group"
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                            <li>
                                <Link
                                    to="/how-it-works"
                                    className="text-dark-400 hover:text-white transition-colors flex items-center gap-2 group"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    كيف يعمل
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/jobs"
                                    className="text-dark-400 hover:text-white transition-colors flex items-center gap-2 group"
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    تصفح المهام
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="font-bold text-lg text-white mb-6">قانوني</h3>
                        <ul className="space-y-4">
                            {footerLinks.slice(3).map((link) => (
                                <li key={link.href}>
                                    <Link
                                        to={link.href}
                                        className="text-dark-400 hover:text-white transition-colors flex items-center gap-2 group"
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-accent-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        {/* Newsletter */}
                        <div className="mt-8">
                            <h4 className="font-semibold text-white mb-3">النشرة البريدية</h4>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="بريدك الإلكتروني"
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-dark-800 border border-dark-700 text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors"
                                />
                                <button className="px-4 py-2.5 rounded-xl gradient-primary text-white font-medium hover:shadow-lg hover:shadow-primary-600/30 transition-shadow">
                                    اشترك
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-16 pt-8 border-t border-dark-800">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-dark-400 text-sm flex items-center gap-1">
                            صنع بـ <Heart className="w-4 h-4 text-accent-500 fill-current" /> في تونس 🇹🇳
                        </div>
                        <div className="text-dark-400 text-sm">
                            {t.footer.copyright}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
