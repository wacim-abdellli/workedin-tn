import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { useTranslation } from '../../i18n';

function Footer() {
    const { t } = useTranslation();

    const footerLinks = [
        { href: '/about', label: t.footer.about },
        { href: '/faq', label: t.footer.faq },
        { href: '/terms', label: t.footer.terms },
        { href: '/privacy', label: t.footer.privacy },
        { href: '/contact', label: t.footer.contact },
    ];

    const socialLinks = [
        { icon: Facebook, href: '#', label: 'Facebook' },
        { icon: Twitter, href: '#', label: 'Twitter' },
        { icon: Instagram, href: '#', label: 'Instagram' },
        { icon: Linkedin, href: '#', label: 'LinkedIn' },
    ];

    return (
        <footer className="bg-gray-900 text-white">
            <div className="container-custom py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                                <span className="text-white font-bold text-lg">خ</span>
                            </div>
                            <span className="text-xl font-bold">
                                <span className="text-primary-400">Khedma</span>
                                <span className="text-secondary-400">.tn</span>
                            </span>
                        </Link>
                        <p className="text-gray-400 max-w-md">
                            {t.hero.subtitle}
                        </p>

                        {/* Social Links */}
                        <div className="flex items-center gap-3 mt-6">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    aria-label={social.label}
                                    className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-primary-600 hover:text-white transition-all duration-200"
                                >
                                    <social.icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-semibold text-lg mb-4">روابط سريعة</h3>
                        <ul className="space-y-3">
                            {footerLinks.slice(0, 3).map((link) => (
                                <li key={link.href}>
                                    <Link
                                        to={link.href}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="font-semibold text-lg mb-4">قانوني</h3>
                        <ul className="space-y-3">
                            {footerLinks.slice(3).map((link) => (
                                <li key={link.href}>
                                    <Link
                                        to={link.href}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
                    {t.footer.copyright}
                </div>
            </div>
        </footer>
    );
}

export default Footer;
