import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export interface LoginLog {
  id: string;
  user_id: string;
  event_type: 'shift_start' | 'morning_tea_return' | 'lunch_return' | 'evening_tea_return';
  logged_at: string;
  event_date: string;
}

export function useLoginLogs(date?: string) {
  const d = date || new Date().toISOString().split('T')[0];
  
  return useQuery({
    queryKey: ['login-logs', d],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('daily_login_logs')
        .select('*')
        .eq('event_date', d);

      if (error) throw error;
      return (data as unknown) as LoginLog[];
    }
  });
}

export function useTrackLogin() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (eventType: LoginLog['event_type']) => {
      if (!user) return;
      
      const { error } = await (supabase as any)
        .from('daily_login_logs')
        .insert({
          user_id: user.id,
          event_type: eventType,
          event_date: new Date().toISOString().split('T')[0]
        })
        .select();

      // We ignore unique constraint errors since that just means they already logged in today
      if (error && error.code !== '23505') throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['login-logs'] });
    }
  });
}
