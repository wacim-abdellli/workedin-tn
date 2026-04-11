import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Briefcase, CheckCircle, DollarSign, Search, Shield, Star, Users, Zap } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { Logo } from '@/components/ui/Logo';

export default function SplitLanding() {
  const navigate = useNavigate();
  const { tx } = useTranslation();
  const [hovered, setHovered] = useState<'freelancer' | 'client' | null>(null);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0c0c0c' }}>
      {/* Minimal header */}
      <header className="flex items-center justify-between px-8 py-5 relative z-10">
        <Logo variant="full" size="md" mode="client" />
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors"
          >
            {tx('nav.login', undefined, 'Sign in')}
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="px-4 py-2 text-sm font-semibold rounded-xl text-white transition-all hover:opacity-90"
            style={{ background: '#E8820C' }}
          >
            {tx('nav.signup', undefined, 'Get started')}
          </button>
        </div>
      </header>

      {/* Split hero */}
      <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden">

        {/* Freelancer side — purple */}
        <motion.div
          className="relative flex-1 flex flex-col items-center justify-center px-8 py-16 lg:py-24 cursor-pointer overflow-hidden"
          animate={{ flex: hovered === 'freelancer' ? 1.15 : hovered === 'client' ? 0.85 : 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          onMouseEnter={() => setHovered('freelancer')}
          onMouseLeave={() => setHovered(null)}
          onClick={() => navigate('/signup')}
        >
          {/* Background glow */}
          <div className="absolute inset-0" style={{
            background: hovered === 'freelancer'
              ? 'radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.18) 0%, transparent 70%)'
              : 'radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.08) 0%, transparent 70%)',
            transition: 'background 0.4s ease',
          }} />

          {/* Divider line (right side) */}
          <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-px" style={{
            background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.08) 70%, transparent)',
          }} />

          <div className="relative z-10 max-w-sm text-center">
            {/* Icon */}
            <motion.div
              className="mx-auto mb-6 w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}
              animate={{ scale: hovered === 'freelancer' ? 1.1 : 1 }}
              transition={{ duration: 0.3 }}
            >
              <Zap className="w-8 h-8" style={{ color: '#a78bfa' }} />
            </motion.div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-xs font-semibold uppercase tracking-wider"
              style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }}>
              {tx('splitLanding.freelancer.badge', undefined, 'For Freelancers')}
            </div>

            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              {tx('splitLanding.freelancer.title', undefined, 'Get paid for your skills')}
            </h2>
            <p className="text-white/50 text-base leading-relaxed mb-8">
              {tx('splitLanding.freelancer.subtitle', undefined, 'Build your profile, find quality projects, and get paid securely with escrow.')}
            </p>

            {/* Features */}
            <div className="space-y-3 mb-10 text-left">
              {[
                { icon: Shield, text: tx('splitLanding.freelancer.f1', undefined, 'Verified identity badge') },
                { icon: DollarSign, text: tx('splitLanding.freelancer.f2', undefined, 'Escrow-protected payments') },
                { icon: Star, text: tx('splitLanding.freelancer.f3', undefined, 'Build your reputation') },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(139,92,246,0.2)' }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: '#a78bfa' }} />
                  </div>
                  <span className="text-sm text-white/70">{text}</span>
                </div>
              ))}
            </div>

            <motion.button
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm transition-all"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={(e) => { e.stopPropagation(); navigate('/signup'); }}
            >
              {tx('splitLanding.freelancer.cta', undefined, 'Start as Freelancer')}
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>

        {/* Client side — amber */}
        <motion.div
          className="relative flex-1 flex flex-col items-center justify-center px-8 py-16 lg:py-24 cursor-pointer overflow-hidden"
          animate={{ flex: hovered === 'client' ? 1.15 : hovered === 'freelancer' ? 0.85 : 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          onMouseEnter={() => setHovered('client')}
          onMouseLeave={() => setHovered(null)}
          onClick={() => navigate('/signup')}
        >
          {/* Background glow */}
          <div className="absolute inset-0" style={{
            background: hovered === 'client'
              ? 'radial-gradient(ellipse at 50% 50%, rgba(232,130,12,0.18) 0%, transparent 70%)'
              : 'radial-gradient(ellipse at 50% 50%, rgba(232,130,12,0.08) 0%, transparent 70%)',
            transition: 'background 0.4s ease',
          }} />

          <div className="relative z-10 max-w-sm text-center">
            {/* Icon */}
            <motion.div
              className="mx-auto mb-6 w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(232,130,12,0.2)', border: '1px solid rgba(232,130,12,0.3)' }}
              animate={{ scale: hovered === 'client' ? 1.1 : 1 }}
              transition={{ duration: 0.3 }}
            >
              <Briefcase className="w-8 h-8" style={{ color: '#E8820C' }} />
            </motion.div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5 text-xs font-semibold uppercase tracking-wider"
              style={{ background: 'rgba(232,130,12,0.15)', color: '#E8820C', border: '1px solid rgba(232,130,12,0.2)' }}>
              {tx('splitLanding.client.badge', undefined, 'For Clients')}
            </div>

            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
              {tx('splitLanding.client.title', undefined, 'Hire verified talent')}
            </h2>
            <p className="text-white/50 text-base leading-relaxed mb-8">
              {tx('splitLanding.client.subtitle', undefined, 'Post your project, review verified profiles, and pay only when satisfied.')}
            </p>

            {/* Features */}
            <div className="space-y-3 mb-10 text-left">
              {[
                { icon: Users, text: tx('splitLanding.client.f1', undefined, 'Verified professional profiles') },
                { icon: Search, text: tx('splitLanding.client.f2', undefined, 'Smart talent matching') },
                { icon: CheckCircle, text: tx('splitLanding.client.f3', undefined, 'Pay only when satisfied') },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(232,130,12,0.2)' }}>
                    <Icon className="w-3.5 h-3.5" style={{ color: '#E8820C' }} />
                  </div>
                  <span className="text-sm text-white/70">{text}</span>
                </div>
              ))}
            </div>

            <motion.button
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm transition-all"
              style={{ background: 'linear-gradient(135deg, #E8820C, #d4750a)' }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={(e) => { e.stopPropagation(); navigate('/signup'); }}
            >
              {tx('splitLanding.client.cta', undefined, 'Hire an Expert')}
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Bottom bar */}
      <div className="text-center py-4 text-xs text-white/20">
        {tx('splitLanding.alreadyHaveAccount', undefined, 'Already have an account?')}{' '}
        <button onClick={() => navigate('/login')} className="text-white/40 hover:text-white/70 transition-colors underline">
          {tx('nav.login', undefined, 'Sign in')}
        </button>
      </div>
    </div>
  );
}
