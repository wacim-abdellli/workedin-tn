import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, BriefcaseBusiness, Compass, SearchCheck, Sparkles, UserRoundSearch } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';

export interface NavigationProps {
  isScrolled: boolean;
  theme: string;
  items: Array<{
    to: string;
    icon: LucideIcon;
    label: string;
  }>;
}

export function Navigation({ isScrolled, theme, items }: NavigationProps) {
  return (
    <nav className="hidden xl:flex items-center gap-1">
      {items.map((item) => (
        item.to === '/jobs' ? (
          <MegaMenuLink key={item.to} item={item} isScrolled={isScrolled} theme={theme} />
        ) : (
          <NavLink key={item.to} to={item.to} icon={item.icon} isScrolled={isScrolled} theme={theme}>
            {item.label}
          </NavLink>
        )
      ))}
    </nav>
  );
}

interface NavLinkProps {
  to: string;
  icon: LucideIcon;
  children: React.ReactNode;
  isScrolled: boolean;
  theme: string;
}

function NavLink({ to, icon: Icon, children, isScrolled, theme }: NavLinkProps) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        'nav-link-premium relative flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-sm whitespace-nowrap group transition-colors duration-150',
        isActive
          ? 'bg-violet-600/10 font-semibold tracking-[-0.01em] text-purple-600 dark:text-purple-400'
          : isScrolled || theme === 'dark'
            ? 'font-medium text-gray-400 hover:bg-white/5 hover:text-white'
            : 'font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      )}
    >
      {isActive && (
        <motion.div
          layoutId="activeNav"
          className="absolute inset-0 rounded-2xl border border-violet-500/20 bg-violet-600/10"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
        />
      )}
      <span className="relative flex items-center gap-2">
        <Icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
        <span>{children}</span>
      </span>
    </Link>
  );
}

function MegaMenuLink({
  item,
  isScrolled,
  theme,
}: {
  item: NavigationProps['items'][number];
  isScrolled: boolean;
  theme: string;
}) {
  const location = useLocation();
  const isActive = location.pathname === item.to;
  const [open, setOpen] = useState(false);
  const categories = [
    { label: 'Design & Brand', to: '/jobs', icon: Sparkles, description: 'UI, visual identity, product polish' },
    { label: 'Development', to: '/jobs', icon: Compass, description: 'Web apps, MVPs, integrations' },
    { label: 'Marketing', to: '/jobs', icon: SearchCheck, description: 'Growth, content, paid acquisition' },
    { label: 'Browse talent', to: '/find-freelancers', icon: UserRoundSearch, description: 'Discover vetted Tunisian experts' },
  ];

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <Link
        to={item.to}
        className={cn(
          'nav-link-premium relative flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-sm whitespace-nowrap group transition-colors duration-150',
          isActive
            ? 'bg-violet-600/10 font-semibold tracking-[-0.01em] text-purple-600 dark:text-purple-400'
            : isScrolled || theme === 'dark'
              ? 'font-medium text-gray-400 hover:bg-white/5 hover:text-white'
              : 'font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        )}
      >
        <item.icon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
        <span>{item.label}</span>
      </Link>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute left-0 top-full z-50 mt-4 w-[620px]"
          >
            <div className="glass-card overflow-hidden p-2">
              <div className="grid gap-2 md:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-[22px] border border-gray-100 bg-white p-3 shadow-sm dark:border-white/8 dark:bg-[#14121f]">
                  {categories.map((category) => (
                    <Link
                      key={category.label}
                      to={category.to}
                      className="group flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-300">
                        <category.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-[#1a1825] dark:text-white">{category.label}</div>
                        <div className="text-sm text-[#6b6880] dark:text-[#8b8aa0]">{category.description}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-[#8b8aa0] transition-transform group-hover:translate-x-1" />
                    </Link>
                  ))}
                </div>
                <div className="rounded-[22px] border border-primary-100/70 bg-gradient-to-br from-primary-600 to-[#140c2d] p-5 text-white">
                  <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                    Featured
                  </div>
                  <h3 className="mt-4 text-xl font-bold">Post a serious project</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/75">
                    Reach Tunisian freelancers with polished profiles, verified trust signals, and cleaner proposals.
                  </p>
                  <Link
                    to="/jobs/new"
                    className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-[#1a1825]"
                  >
                    <BriefcaseBusiness className="h-4 w-4" />
                    Post a job
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
