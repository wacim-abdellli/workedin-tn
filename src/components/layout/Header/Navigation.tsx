import { Link, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
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
    <>
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} icon={item.icon} accentClass={accentClass}>
          {item.label}
        </NavLink>
      ))}
    </>
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
        'group relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition-colors duration-150',
        isActive
          ? isFreelancer
            ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 font-medium'
            : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 font-medium'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="hidden lg:inline">{children}</span>
    </Link>
  );
}
