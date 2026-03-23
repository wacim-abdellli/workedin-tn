import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Briefcase, Search, TrendingUp, User, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect } from 'react';

export interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSearchOpen: () => void;
  t: {
    nav: {
      findWork: string;
      findFreelancers: string;
      howItWorks: string;
    };
    search: {
      placeholder: string;
    };
    hero: {
      ctaClient: string;
    };
    common?: {
      close?: string;
    };
  };
}

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 + index * 0.06, duration: 0.28, ease: 'easeOut' as const },
  }),
};

export function MobileMenu({ isOpen, onClose, onSearchOpen, t }: MobileMenuProps) {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] xl:hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(167,139,250,0.2),transparent_32%),linear-gradient(180deg,rgba(249,247,255,0.97),rgba(241,237,255,0.94))] backdrop-blur-2xl dark:bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.18),transparent_28%),linear-gradient(180deg,rgba(11,10,18,0.98),rgba(15,14,23,0.96))]" />
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 pb-8 pt-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-500">Khedma TN</div>
                <div className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[#1a1825] dark:text-white">Navigate the platform</div>
              </div>
              <button
                onClick={onClose}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-primary-100/70 bg-white/90 text-[#1a1825] shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-white"
                aria-label={t.common?.close || 'Close menu'}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-10 rounded-[32px] border border-white/60 bg-white/72 p-4 shadow-[0_24px_60px_-36px_rgba(124,58,237,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_28px_70px_-40px_rgba(0,0,0,0.78)]">
              <motion.button
                custom={0}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                onClick={() => {
                  onClose();
                  onSearchOpen();
                }}
                className="flex min-h-14 w-full items-center gap-3 rounded-[24px] border border-primary-100/70 bg-[#f9f7ff] px-5 py-4 text-left shadow-sm transition-colors hover:border-primary-200 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
              >
                <Search className="h-5 w-5 text-primary-500" />
                <span className="font-medium text-[#4e4a63] dark:text-[#aba9bc]">{t.search.placeholder}</span>
              </motion.button>

              <div className="mt-8 flex flex-1 flex-col justify-center gap-3">
                <MobileNavLink to="/jobs" icon={Briefcase} onClick={onClose} index={1}>
                  {t.nav.findWork}
                </MobileNavLink>
                <MobileNavLink to="/find-freelancers" icon={User} onClick={onClose} index={2}>
                  {t.nav.findFreelancers}
                </MobileNavLink>
                <MobileNavLink to="/how-it-works" icon={TrendingUp} onClick={onClose} index={3}>
                  {t.nav.howItWorks}
                </MobileNavLink>
                <MobileNavLink to="/jobs/new" icon={Briefcase} onClick={onClose} index={4} accent>
                  {t.hero.ctaClient}
                </MobileNavLink>
              </div>

              <motion.div
                custom={5}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="premium-panel mt-8 rounded-[28px] border border-white/60 px-5 py-4 dark:border-white/10"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-500">Preferences</div>
                <p className="mt-2 text-sm text-[#4e4a63] dark:text-[#aba9bc]">
                  Theme and language controls stay available in the header while this overlay is open.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MobileNavLink({
  to,
  icon: Icon,
  children,
  onClick,
  index,
  accent = false,
}: {
  to: string;
  icon: LucideIcon;
  children: React.ReactNode;
  onClick?: () => void;
  index: number;
  accent?: boolean;
}) {
  return (
    <motion.div custom={index} variants={itemVariants} initial="hidden" animate="visible">
      <Link
        to={to}
        onClick={onClick}
        className={`flex min-h-12 items-center gap-4 rounded-[28px] px-5 py-4 text-lg font-semibold transition-all ${
          accent
            ? 'bg-gradient-to-r from-primary-600 to-[#140c2d] text-white shadow-xl shadow-primary-600/20'
            : 'border border-primary-100/70 bg-[#f9f7ff] text-[#1a1825] shadow-sm hover:border-primary-200 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.06]'
        }`}
      >
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accent ? 'bg-white/15' : 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-300'}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span>{children}</span>
      </Link>
    </motion.div>
  );
}
