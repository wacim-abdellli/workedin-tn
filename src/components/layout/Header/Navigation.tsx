import { Link, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface NavigationProps {
  items: Array<{
    to: string;
    icon: LucideIcon;
    label: string;
  }>;
  accentClass: string;
}

export function Navigation({ items, accentClass }: NavigationProps) {
  return (
    <div className="flex items-center gap-1.5 p-1 rounded-2xl">
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} icon={item.icon} accentClass={accentClass}>
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}

interface NavLinkProps {
  to: string;
  icon: LucideIcon;
  children: React.ReactNode;
  accentClass: string;
}

function NavLink({ to, icon: Icon, children, accentClass }: NavLinkProps) {
  const location = useLocation();
  const isActive = location.pathname === to;
  const isFreelancer = accentClass === 'purple';

  return (
    <Link
      to={to}
      title={typeof children === 'string' ? children : undefined}
      className={cn(
        'group relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm whitespace-nowrap outline-none transition-colors duration-200',
        isActive
          ? isFreelancer
            ? 'text-purple-900 dark:text-purple-100 font-semibold tracking-tight'
            : 'text-amber-900 dark:text-amber-100 font-semibold tracking-tight'
          : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 font-medium'
      )}
    >
      {isActive && (
        <motion.div
            layoutId="active-nav-pill"
            className={cn(
                "absolute inset-0 rounded-xl",
                isFreelancer 
                  ? "bg-purple-100 dark:bg-purple-500/20" 
                  : "bg-amber-100 dark:bg-amber-500/20"
            )}
            style={{ originY: "0px" }}
            initial={false}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      
      <div className="relative z-10 flex items-center gap-2">
        <Icon className={cn("h-[18px] w-[18px] shrink-0 transition-transform duration-200", isActive ? "scale-105" : "group-hover:scale-105 opacity-80 group-hover:opacity-100")} />
        <span className="hidden lg:inline">{children}</span>
      </div>
    </Link>
  );
}
