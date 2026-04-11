import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Linkedin, Mail, MapPin, Phone, ArrowRight, Zap } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "../../i18n";
import { Logo } from "../ui/Logo";
import { useAuth } from "@/contexts/AuthContext";

function Footer() {
  const { t, tx } = useTranslation();
  const { profile, activeMode } = useAuth();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const isFreelancer = activeMode === 'freelancer' || profile?.user_type === 'freelancer';
  const mode = isFreelancer ? 'freelancer' : 'client';
  // Use correct brand color per workspace
  const accent = isFreelancer ? '#a855f7' : '#E8820C';
  const accentHover = isFreelancer ? '#9333ea' : '#d4750a';
  const accentGlow = isFreelancer ? 'rgba(168,85,247,0.12)' : 'rgba(232,130,12,0.12)';

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) { setSubscribed(true); setEmail(''); }
  };

  return (
    <footer style={{ background: '#111', borderTop: '1px solid #1e1e1e', color: '#fff', position: 'relative', overflow: 'hidden' }}>
      {/* Ambient glows */}
      <div style={{ position: 'absolute', top: 0, left: '10%', width: 400, height: 400, borderRadius: '50%', background: accentGlow, filter: 'blur(100px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, right: '10%', width: 300, height: 300, borderRadius: '50%', background: 'rgba(99,102,241,0.08)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <div className="max-w-7xl mx-auto px-6 py-16" style={{ position: 'relative' }}>

        {/* Top grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

          {/* Brand */}
          <div>
            <Link to="/" className="inline-block mb-6">
              <Logo variant="full" size="md" titleStyle="default" mode={mode} />
            </Link>
            <p style={{ color: '#999', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
              {t.footer.description}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {[
                { icon: MapPin, text: t.footer.city },
                { icon: Mail, text: tx('ui.contact_workedin_tn') },
                { icon: Phone, text: tx('ui.xx_xxx_xxx') },
              ].map(({ icon: Icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: '#1a1a1a', border: `1px solid #2a2a2a`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon style={{ width: 15, height: 15, color: accent }} />
                  </div>
                  <span style={{ color: '#bbb', fontSize: 13 }}>{text}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: '#1a1a1a', border: '1px solid #2a2a2a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#666', transition: 'all 0.2s', textDecoration: 'none',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = accent;
                    (e.currentTarget as HTMLElement).style.color = accent;
                    (e.currentTarget as HTMLElement).style.background = accentGlow;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2a';
                    (e.currentTarget as HTMLElement).style.color = '#666';
                    (e.currentTarget as HTMLElement).style.background = '#1a1a1a';
                  }}
                >
                  <Icon style={{ width: 15, height: 15 }} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#555', marginBottom: 20 }}>
              {t.footer.quickLinks}
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 13 }}>
              {[
                { to: '/about', label: t.footer.about },
                { to: '/faq', label: t.footer.faq },
                { to: '/how-it-works', label: t.nav.howItWorks },
                { to: '/jobs', label: t.nav.jobs },
                { to: '/find-freelancers', label: tx('nav.findFreelancers', undefined, 'Find Freelancers') },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    style={{ color: '#999', fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 7, transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fff'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#999'}
                  >
                    <ArrowRight style={{ width: 11, height: 11, color: accent, flexShrink: 0 }} />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#555', marginBottom: 20 }}>
              {t.footer.legal}
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 13 }}>
              {[
                { to: '/terms', label: t.footer.terms },
                { to: '/privacy', label: t.footer.privacy },
                { to: '/contact', label: t.footer.contact },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    style={{ color: '#999', fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 7, transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fff'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#999'}
                  >
                    <ArrowRight style={{ width: 11, height: 11, color: accent, flexShrink: 0 }} />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: accentGlow, border: `1px solid ${accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap style={{ width: 14, height: 14, color: accent }} />
              </div>
              <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#555', margin: 0 }}>
                {t.footer.newsletterTitle}
              </h3>
            </div>
            <p style={{ color: '#999', fontSize: 13, lineHeight: 1.65, marginBottom: 16 }}>
              {t.footer.newsletterDescription}
            </p>
            {subscribed ? (
              <div style={{
                background: `${accentGlow}`, border: `1px solid ${accent}40`,
                borderRadius: 12, padding: '13px 16px', color: accent, fontSize: 13, fontWeight: 600,
              }}>
                ✓ {tx('footer.subscribed', undefined, "You're subscribed!")}
              </div>
            ) : (
              <form onSubmit={handleSubscribe} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t.footer.newsletterPlaceholder}
                  required
                  style={{
                    width: '100%', padding: '11px 14px', borderRadius: 12,
                    background: '#1a1a1a', border: '1px solid #2a2a2a',
                    color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = accent}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#2a2a2a'}
                />
                <button
                  type="submit"
                  style={{
                    width: '100%', padding: '11px', borderRadius: 12,
                    background: accent, border: 'none', color: '#fff',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = accentHover}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = accent}
                >
                  {t.footer.newsletterAction}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Divider with gradient */}
        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${accent}40, transparent)`, marginBottom: 24 }} />

        {/* Bottom bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span style={{ color: '#555', fontSize: 13 }}>{t.footer.madeInTunisia} 🇹🇳</span>
          <span style={{ color: '#555', fontSize: 13 }}>{t.footer.copyright}</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
