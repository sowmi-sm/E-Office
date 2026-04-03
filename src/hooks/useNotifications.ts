import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    link: string | null;
    is_read: boolean;
    created_at: string;
}

export function useNotifications() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['notifications', user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching notifications:', error);
                return [];
            }

            return data as Notification[];
        },
        enabled: !!user,
        refetchInterval: 10000, // Poll every 10 seconds for new notifications
    });
}

export function useMarkNotificationRead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });
}

export function useMarkAllNotificationsRead() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async () => {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user?.id)
                .eq('is_read', false);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('All notifications marked as read');
        },
    });
}

export function useCreateNotification() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (notification: {
            userId: string;
            title: string;
            message: string;
            type?: string;
            link?: string;
        }) => {
            const { error } = await supabase
                .from('notifications')
                .insert({
                    user_id: notification.userId,
                    title: notification.title,
                    message: notification.message,
                    type: notification.type || 'info',
                    link: notification.link
                });

            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['notifications', variables.userId] });
        },
    });
}
