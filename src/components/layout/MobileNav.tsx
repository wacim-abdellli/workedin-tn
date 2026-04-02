import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Briefcase,
  DollarSign,
  HelpCircle,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Settings,
  User,
  X,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getWorkspaceDashboardPath, getWorkspaceProfilePath } from '@/lib/workspaceRoutes';
import { useWorkspaceStore } from '@/lib/workspaceState';
import { useTranslation } from '@/i18n';

export default function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, user, signOut } = useAuth();
  const { t, tx } = useTranslation();
    const navItems = [
      { id: 'home', path: '/', icon: Home, label: t.nav?.home || 'Home' },
      { id: 'jobs', path: '/jobs', icon: Briefcase, label: t.nav?.jobs || 'Jobs' },
      { id: 'messages', path: '/messages', icon: MessageSquare, label: t.nav?.messages || 'Messages', badgeKey: 'messages' },
      { id: 'notifications', path: '/notifications', icon: Bell, label: t.notifications?.title || 'Notifications', badgeKey: 'notifications' },
      { id: 'more', path: null, icon: Menu, label: tx('pages.mobileNav.more', undefined, 'More') },
    ];

  const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
  const [showMenu, setShowMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    // Fetch initial counts
    const fetchCounts = async () => {
      try {
        const [notificationsResult, messagesResult] = await Promise.all([
          supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_read', false), // Fixed: was 'read', should be 'is_read'
          
          // Fixed: Use conversation unread counts instead of individual messages
          supabase
            .from('conversations')
            .select('unread_count_1, unread_count_2, participant_1, participant_2')
            .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        ]);

        const notifCount = notificationsResult.count ?? 0;
        
        // Calculate total unread messages from conversations
        let totalUnread = 0;
        if (messagesResult.data) {
          for (const conv of messagesResult.data) {
            if (conv.participant_1 === user.id) {
              totalUnread += conv.unread_count_1 || 0;
            } else if (conv.participant_2 === user.id) {
              totalUnread += conv.unread_count_2 || 0;
            }
          }
        }

        setUnreadNotifications(notifCount);
        setUnreadMessages(totalUnread);
      } catch (error) {
        console.error('Failed to fetch unread counts:', error);
        setUnreadNotifications(0);
        setUnreadMessages(0);
      }
    };

    fetchCounts();

    const channel = supabase
      .channel(`mobile-nav:${user.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${user.id}` 
      }, () => {
        setUnreadNotifications((prev) => prev + 1);
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${user.id}` 
      }, () => {
        fetchCounts();
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'conversations',
        filter: `participant_1=eq.${user.id}` 
      }, () => {
        fetchCounts(); // Refetch when conversations update
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'conversations',
        filter: `participant_2=eq.${user.id}` 
      }, () => {
        fetchCounts(); // Refetch when conversations update
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const getBadge = (badgeKey?: string) => {
    if (badgeKey === 'notifications') return unreadNotifications;
    if (badgeKey === 'messages') return unreadMessages;
    return 0;
  };

  const isActive = (path: string | null) => {
    if (!path) return false;
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleNavClick = (item: (typeof navItems)[number]) => {
    if (item.id === 'more') {
      setShowMenu(true);
      return;
    }

    if (item.path) {
      navigate(item.path);
    }
  };

  const menuItems = [
    { icon: User, label: t.nav?.profile || 'Profile', path: getWorkspaceProfilePath(profile, activeWorkspace) },
    { icon: DollarSign, label: t.nav?.dashboard || 'Dashboard', path: getWorkspaceDashboardPath(activeWorkspace) },
    { icon: Settings, label: t.nav?.settings || 'Settings', path: '/settings' },
    { icon: HelpCircle, label: tx('pages.mobileNav.help', undefined, 'Help'), path: '/faq' },
  ];

  const workspaceLabel =
    profile?.user_type === 'both'
      ? activeWorkspace === 'freelancer'
        ? tx('pages.mobileNav.workspaceFreelancer', undefined, 'Freelancer workspace')
        : tx('pages.mobileNav.workspaceClient', undefined, 'Client workspace')
      : profile?.user_type === 'freelancer'
        ? tx('pages.mobileNav.freelancer', undefined, 'Freelancer')
        : tx('pages.mobileNav.client', undefined, 'Client');

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-gray-200 bg-white md:hidden dark:border-white/10 dark:bg-[#0f0e17]">
        <div className="flex h-full items-center justify-around">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={`relative flex h-full flex-1 flex-col items-center justify-center ${
                isActive(item.path) ? 'text-primary-600' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {getBadge(item.badgeKey) > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                    {getBadge(item.badgeKey) > 9 ? '9+' : getBadge(item.badgeKey)}
                  </span>
                ) : null}
              </div>
              <span className="mt-1 text-[11px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <header className="fixed left-0 right-0 top-0 z-40 h-14 border-b border-gray-200 bg-white md:hidden dark:border-white/10 dark:bg-[#0f0e17]">
        <div className="flex h-full items-center justify-between px-4">
          <button onClick={() => navigate('/')} className="text-lg font-bold text-primary-600">
            {tx('pages.mobileNav.brandName', undefined, 'Khedma')}
          </button>
          <button onClick={() => setShowSearch(true)} className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-white/5">
            <Search className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </header>

      {showSearch ? (
        <div className="fixed inset-0 z-50 bg-white md:hidden dark:bg-[#0f0e17]">
          <div className="flex items-center gap-3 border-b border-gray-200 p-4 dark:border-white/10">
            <button onClick={() => setShowSearch(false)}>
              <X className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            </button>
            <input
              type="text"
              autoFocus
              placeholder={tx('pages.mobileNav.searchPlaceholder', undefined, 'Search...')}
              className="flex-1 bg-transparent text-lg outline-none"
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return;
                navigate(`/search?q=${(event.target as HTMLInputElement).value}`);
                setShowSearch(false);
              }}
            />
          </div>
        </div>
      ) : null}

      {showMenu ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMenu(false)} />
          <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white p-2 dark:bg-[#171421]">
            <div className="mx-auto mt-3 h-1 w-12 rounded-full bg-gray-300 dark:bg-white/10" />

            <div className="border-b border-gray-100 p-4 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 text-white">
                  {profile?.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{profile?.full_name || tx('pages.mobileNav.userFallback', undefined, 'User')}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{workspaceLabel}</p>
                </div>
              </div>
            </div>

            <div className="p-2">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    navigate(item.path);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-4 rounded-xl p-4 text-left hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  <item.icon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white">{item.label}</span>
                </button>
              ))}
            </div>

            <div className="border-t border-gray-100 p-2 dark:border-white/10">
              <button
                onClick={async () => {
                  await signOut();
                  setShowMenu(false);
                  navigate('/login', { replace: true });
                }}
                className="flex w-full items-center gap-4 rounded-xl p-4 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">{t.nav?.logout || 'Sign out'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
