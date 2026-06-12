import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspaceStore } from '@/lib/workspaceState';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import type { AppNotification } from '@/hooks/useRealtimeNotifications';

interface NotificationsContextType {
    notifications: AppNotification[];
    unreadCount: number;
    isLoading: boolean;
    markAsRead: (id: string) => Promise<void>;
    markAllRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType>({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    markAsRead: async () => {},
    markAllRead: async () => {},
    deleteNotification: async () => {},
});

export function NotificationsProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const activeWorkspace = useWorkspaceStore((state) => state.activeWorkspace);
    const { notifications, unreadCount: _unreadCount, ...rest } = useRealtimeNotifications(user?.id);

    const filteredNotifications = useMemo(() => {
        return notifications.filter(n => {
            const haystack = `${n.title} ${n.body}`.toLowerCase();
            
            // Client exclusive notifications
            const isClientNotif = n.link?.includes('role=client') || ((n.type === 'proposal' || n.type === 'new_proposal') && 
                (haystack.includes('عرض جديد') || haystack.includes('new proposal') || haystack.includes('submitted a proposal')));
                
            // Freelancer exclusive notifications
            const isFreelancerNotif = n.link?.includes('role=freelancer') || (n.type === 'proposal' && 
                (haystack.includes('تم قبول العرض') || haystack.includes('proposal accepted') || haystack.includes('your proposal')));

            if (activeWorkspace === 'client' && isFreelancerNotif) return false;
            if (activeWorkspace === 'freelancer' && isClientNotif) return false;
            
            return true;
        });
    }, [notifications, activeWorkspace]);

    const filteredUnreadCount = filteredNotifications.filter(n => !n.is_read).length;

    const value = {
        ...rest,
        notifications: filteredNotifications,
        unreadCount: filteredUnreadCount,
    };

    return (
        <NotificationsContext.Provider value={value}>
            {children}
        </NotificationsContext.Provider>
    );
}

export function useNotifications() {
    return useContext(NotificationsContext);
}
