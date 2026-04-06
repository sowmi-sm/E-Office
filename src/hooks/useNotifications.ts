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
    sender_id: string | null;
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

            return (data as unknown) as Notification[];
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

export function useApproveAccessRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ senderId, notificationId }: { senderId: string; notificationId: string }) => {
            // 1. Grant 4 hours access override in profile
            const unlockUntil = new Date();
            unlockUntil.setHours(unlockUntil.getHours() + 4);
            
            const { error: profileError } = await (supabase as any)
                .from('profiles')
                .update({ 
                    unlock_until: unlockUntil.toISOString(),
                    unlock_issued_at: new Date().toISOString()
                } as any)
                .eq('id', senderId);

            if (profileError) throw profileError;

            // 2. Mark notification as read
            const { error: notifyError } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);

            if (notifyError) throw notifyError;
            
            // 3. ALSO deactivate any active blocks in user_blocks & tasks
            await (supabase as any)
                .from('user_blocks')
                .update({ is_active: false, unblocked_at: new Date().toISOString(), unblocked_by: (supabase as any).auth?.user?.id })
                .eq('user_id', senderId)
                .eq('is_active', true);

            await (supabase as any)
                .from('tasks')
                .update({ status: 'unblocked' })
                .eq('title', '___USER_BLOCK_RECORD___')
                .eq('assigned_to', senderId)
                .eq('status', 'blocked');

            // 4. Send a success notification back to the requester
            await (supabase as any).from('notifications').insert({
                user_id: senderId,
                title: 'Access Approved',
                message: 'Your system access request has been approved. Your account is now unlocked.',
                type: 'success',
                link: '/dashboard'
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['user-block'] });
            queryClient.invalidateQueries({ queryKey: ['admin-blocked-users'] });
            toast.success('Access request approved');
        },
    });
}
