import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserBlock {
  id: string;
  user_id: string;
  blocked_at: string;
  blocked_reason: string;
  unblocked_at: string | null;
  unblocked_by: string | null;
  is_active: boolean;
  created_at: string;
}

export function useCheckUserBlock() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-block', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // PRIORITY 0: Check if admin has granted a global system override in profiles
      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('unlock_until')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.unlock_until && new Date(profile.unlock_until) > new Date()) {
          // Permanently clear any stuck local fallback blocks while we are here being unblocked by an admin
          localStorage.removeItem(`local_user_block_${user.id}`);
          return null;
      }

      let activeBlock: UserBlock | null = null;

      const { data, error } = await supabase
        .rpc('get_user_block' as never, { _user_id: user.id } as never) as unknown as { data: UserBlock | null; error: any };

      if (!error && data && data.is_active) {
        activeBlock = data;
      } else {
        // Fallback: direct query
        const { data: rawData } = await (supabase as any)
          .from('user_blocks')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (rawData) {
          activeBlock = rawData as UserBlock;
        } else {
          // Provide a cross-browser fallback using 'tasks' table
          const { data: taskData } = await (supabase as any)
            .from('tasks')
            .select('*')
            .eq('title', '___USER_BLOCK_RECORD___')
            .eq('assigned_to', user.id)
            .eq('status', 'blocked')
            .maybeSingle();

          if (taskData) {
            activeBlock = { id: taskData.id, user_id: taskData.assigned_to, is_active: true, blocked_reason: taskData.description || 'Blocked by system', blocked_at: taskData.created_at, created_at: taskData.created_at, unblocked_at: null, unblocked_by: null };
          } else {
            // Absolute fallback: LocalStorage
            const localBlock = localStorage.getItem(`local_user_block_${user.id}`);
            if (localBlock) {
              const parsed = JSON.parse(localBlock);
              activeBlock = { id: 'local-block', user_id: user.id, is_active: true, blocked_reason: parsed.reason, blocked_at: parsed.blocked_at, created_at: parsed.blocked_at, unblocked_at: null, unblocked_by: null };
            }
          }
        }
      }

      // AUTO-UNBLOCK LOGIC: If a block exists but it's from yesterday or earlier, ignore it.
      if (activeBlock && activeBlock.is_active) {
        const blockDate = new Date(activeBlock.blocked_at).toDateString();
        const todayDate = new Date().toDateString();

        if (blockDate !== todayDate) {
          return null; // Treat as not blocked
        }
      }

      return activeBlock;
    },
    enabled: !!user,
    refetchInterval: 3000, // Check frequently so block screen shows up quickly
  });
}

export function useBlockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      // First check if already blocked
      const { data: existing } = await (supabase as any)
        .from('user_blocks')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (existing) return; // Prevent duplicate active blocks

      // Start by attempting a direct database insertion for global visibility
      const { data, error } = await (supabase as any)
        .from('user_blocks')
        .insert({ user_id: userId, blocked_reason: reason })
        .select();

      if (error) {
        // Fallback 1: Tasks table if user_blocks is missing or RLS error
        await (supabase as any)
          .from('tasks')
          .insert({
            title: '___USER_BLOCK_RECORD___',
            assigned_to: userId,
            created_by: userId,
            status: 'blocked',
            description: reason,
            priority: 'critical'
          });

        // Fallback 2: Local Session as absolute backup
        localStorage.setItem(`local_user_block_${userId}`, JSON.stringify({ reason, blocked_at: new Date().toISOString() }));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-block'] });
      queryClient.invalidateQueries({ queryKey: ['admin-blocked-users'] });
    },
  });
}

export function useUnblockUser() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await (supabase as any)
        .from('user_blocks')
        .update({ is_active: false, unblocked_at: new Date().toISOString(), unblocked_by: user?.id })
        .eq('user_id', userId)
        .eq('is_active', true);

      // Ensure cross-browser task fallback is cleared
      await (supabase as any)
        .from('tasks')
        .update({ status: 'unblocked' })
        .eq('title', '___USER_BLOCK_RECORD___')
        .eq('assigned_to', userId)
        .eq('status', 'blocked');

      // Ensure local storage is cleared if unblocked via fallback
      localStorage.removeItem(`local_user_block_${userId}`);

      if (error) {
        console.warn('Unblock via primary db structure failed. Assuming cross-browser or local fallback was success.');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-block'] });
      queryClient.invalidateQueries({ queryKey: ['admin-blocked-users'] });
    },
  });
}

export function useBlockedUsers() {
  return useQuery({
    queryKey: ['admin-blocked-users'],
    queryFn: async () => {
      let blocks: UserBlock[] = [];
      const { data, error } = await (supabase as any)
        .from('user_blocks')
        .select('*')
        .eq('is_active', true);

      if (error) {
        // Render the active blocked users from the cross-browser fallback map
        const { data: taskData, error: taskError } = await (supabase as any)
          .from('tasks')
          .select('*')
          .eq('title', '___USER_BLOCK_RECORD___')
          .eq('status', 'blocked')
          .order('created_at', { ascending: false });

        if (taskError) throw taskError;

        blocks = (taskData || []).map((t: any) => ({
          id: t.id,
          user_id: t.assigned_to,
          is_active: true,
          blocked_reason: t.description || 'Blocked by system',
          blocked_at: t.created_at,
          created_at: t.created_at,
          unblocked_at: null,
          unblocked_by: null
        })) as UserBlock[];
      } else {
        blocks = data as UserBlock[];
      }

      // AUTO-UNBLOCK LOGIC: Admin should only see blocks from today as "actively blocked"
      const todayDate = new Date().toDateString();
      return blocks.filter(b => {
        const blockDate = new Date(b.blocked_at).toDateString();
        return blockDate === todayDate;
      });
    },
    refetchInterval: 3000, // Poll so admin sees new blocked users live
  });
}
