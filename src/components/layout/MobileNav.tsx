import { useLocation, useNavigate } from 'react-router-dom';
import {
    Home,
    Briefcase,
    MessageSquare,
    Bell,
    Menu,
    Search,
    X,
    User,
    Settings,
    LogOut,
    DollarSign,
    HelpCircle,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getDashboardPath, getProfilePath } from '@/lib/accountMode';

const NAV_ITEMS = [
    { id: 'home', path: '/', icon: Home, label: 'الرئيسية' },
    { id: 'jobs', path: '/jobs', icon: Briefcase, label: 'وظائف' },
    { id: 'messages', path: '/messages', icon: MessageSquare, label: 'رسائل', badge: 3 },
    { id: 'notifications', path: '/notifications', icon: Bell, label: 'إشعارات', badge: 5 },
    { id: 'more', path: null, icon: Menu, label: 'المزيد' },
];

export default function MobileNav() {
    const location = useLocation();
    const navigate = useNavigate();
    const { profile, activeMode, signOut } = useAuth();
    const [showMenu, setShowMenu] = useState(false);
    const [showSearch, setShowSearch] = useState(false);

    const isActive = (path: string | null) => {
        if (!path) return false;
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    const handleNavClick = (item: typeof NAV_ITEMS[0]) => {
        if (item.id === 'more') {
            setShowMenu(true);
        } else if (item.path) {
            navigate(item.path);
        }
    };

    const menuItems = [
        { icon: User, label: 'الملف الشخصي', path: getProfilePath(profile, activeMode) },
        { icon: DollarSign, label: 'لوحة التحكم', path: getDashboardPath(activeMode) },
        { icon: Settings, label: 'الإعدادات', path: '/settings' },
        { icon: HelpCircle, label: 'المساعدة', path: '/help' },
    ];

    const workspaceLabel = profile?.user_type === 'both'
        ? activeMode === 'freelancer'
            ? 'وضع المستقل'
            : 'وضع العميل'
        : profile?.user_type === 'freelancer'
            ? 'مستقل'
            : 'عميل';

    return (
        <>
            {/* Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-bottom">
                <div className="flex items-center justify-around h-16">
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleNavClick(item)}
                            className={`flex flex-col items-center justify-center flex-1 h-full relative ${isActive(item.path) ? 'text-primary-600' : 'text-gray-500'
                                }`}
                        >
                            <div className="relative">
                                <item.icon className="w-6 h-6" />
                                {item.badge && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                        {item.badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-xs mt-1">{item.label}</span>
                        </button>
                    ))}
                </div>
            </nav>

            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 safe-area-top">
                <div className="flex items-center justify-between h-14 px-4">
                    <button onClick={() => navigate('/')} className="font-bold text-xl text-primary-600">
                        خدمة.تن
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowSearch(true)}
                            className="p-2 hover:bg-gray-100 rounded-full"
                        >
                            <Search className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Search Overlay */}
            {showSearch && (
                <div className="md:hidden fixed inset-0 bg-white z-50">
                    <div className="flex items-center gap-3 p-4 border-b border-gray-200">
                        <button onClick={() => setShowSearch(false)}>
                            <X className="w-6 h-6 text-gray-600" />
                        </button>
                        <input
                            type="text"
                            autoFocus
                            placeholder="ابحث..."
                            className="flex-1 bg-transparent outline-none text-lg"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    navigate(`/search?q=${(e.target as HTMLInputElement).value}`);
                                    setShowSearch(false);
                                }
                            }}
                        />
                    </div>
                    <div className="p-4">
                        <p className="text-sm text-muted mb-3">عمليات بحث رائجة</p>
                        <div className="flex flex-wrap gap-2">
                            {['تصميم', 'برمجة', 'ترجمة', 'تسويق'].map(term => (
                                <button
                                    key={term}
                                    onClick={() => {
                                        navigate(`/search?q=${term}`);
                                        setShowSearch(false);
                                    }}
                                    className="px-3 py-1.5 bg-gray-100 rounded-full text-sm"
                                >
                                    {term}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* More Menu Overlay */}
            {showMenu && (
                <div className="md:hidden fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowMenu(false)} />
                    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl safe-area-bottom">
                        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3" />

                        {/* Profile */}
                        <div className="p-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white font-bold">
                                    {profile?.full_name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <p className="font-bold text-foreground">{profile?.full_name || 'المستخدم'}</p>
                                    <p className="text-sm text-muted">{workspaceLabel}</p>
                                </div>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="p-2">
                            {menuItems.map((item, i) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        navigate(item.path);
                                        setShowMenu(false);
                                    }}
                                    className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl text-right"
                                >
                                    <item.icon className="w-5 h-5 text-gray-500" />
                                    <span className="font-medium">{item.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Logout */}
                        <div className="p-2 border-t border-gray-100">
                            <button
                                onClick={async () => {
                                    await signOut();
                                    setShowMenu(false);
                                    navigate('/');
                                }}
                                className="w-full flex items-center gap-4 p-4 hover:bg-red-50 rounded-xl text-right text-red-600"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="font-medium">تسجيل الخروج</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
