import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useCallback } from 'react';
import { useBlockUser } from './useUserBlock';

export interface WorkingHoursConfig {
  id: string;
  day_of_week: number;
  work_start_time: string;
  work_end_time: string;
  break_start_time: string;
  break_end_time: string;
  break_type: string;
  is_working_day: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const BREAK_LABELS: Record<string, string> = {
  morning: 'Morning Tea Break',
  lunch: 'Lunch Break',
  evening: 'Evening Tea Break',
};

export function getDayName(day: number) {
  return DAY_NAMES[day] || '';
}

export function getBreakLabel(breakType: string) {
  return BREAK_LABELS[breakType] || breakType;
}

export function formatToAMPM(time24: string) {
  if (!time24) return '';
  const [hoursStr, minutes] = time24.slice(0, 5).split(':');
  let hours = parseInt(hoursStr, 10);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // Convert 0 (midnight) or 12 (noon) to 12, etc.
  return `${hours}:${minutes} ${ampm}`;
}

export function useWorkingHoursConfig() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['working-hours-config'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('working_hours_config')
          .select('*')
          .order('day_of_week')
          .order('break_start_time');

        if (!error && data && data.length > 0) return data as WorkingHoursConfig[];
      } catch (e) { }

      // Fallback for demo if db table is empty or missing
      const mockConfig: WorkingHoursConfig[] = [1, 2, 3, 4, 5, 6].flatMap(day => [
        {
          id: `mock-${day}-morning`,
          day_of_week: day,
          work_start_time: '09:00:00',
          work_end_time: '18:00:00',
          break_start_time: '10:30:00',
          break_end_time: '10:45:00',
          break_type: 'morning',
          is_working_day: true,
          created_by: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: `mock-${day}-lunch`,
          day_of_week: day,
          work_start_time: '09:00:00',
          work_end_time: '18:00:00',
          break_start_time: '13:00:00',
          break_end_time: '14:00:00',
          break_type: 'lunch',
          is_working_day: true,
          created_by: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: `mock-${day}-evening`,
          day_of_week: day,
          work_start_time: '09:00:00',
          work_end_time: '18:00:00',
          break_start_time: '16:00:00',
          break_end_time: '16:15:00',
          break_type: 'evening',
          is_working_day: true,
          created_by: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
      return mockConfig;
    },
    enabled: !!user,
  });
}

export function useUpdateWorkingHours() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Partial<WorkingHoursConfig> & { id: string }) => {
      const { id, ...updates } = config;
      const { error } = await supabase
        .from('working_hours_config')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['working-hours-config'] });
    },
  });
}

// Returns current break status and checks for late login (10 min grace period)
export function useBreakTimeStatus() {
  const { data: config } = useWorkingHoursConfig();
  const { user, role, profile } = useAuth();
  const blockUser = useBlockUser();

  const [isBreakTime, setIsBreakTime] = useState(false);
  const [isNonWorkingDay, setIsNonWorkingDay] = useState(false);
  const [breakEndTime, setBreakEndTime] = useState<string | null>(null);
  const [breakLabel, setBreakLabel] = useState<string | null>(null);
  const [nextWorkStart, setNextWorkStart] = useState<string | null>(null);

  const checkStatus = useCallback(() => {
    const now = new Date();

    // Check if admin has granted temporary system access override
    const unlockUntil = (profile as any)?.unlock_until;
    if (unlockUntil && new Date(unlockUntil) > now) {
      setIsBreakTime(false);
      setIsNonWorkingDay(false);
      setBreakEndTime(null);
      setBreakLabel(null);
      setNextWorkStart(null);
      return;
    }
    // Admins bypass non-working day and break restrictions
    if (role === 'admin') {
      setIsBreakTime(false);
      setIsNonWorkingDay(false);
      setBreakEndTime(null);
      setBreakLabel(null);
      setNextWorkStart(null);
      return;
    }

    // Allows testing logic by overriding state with localStorage overrides
    const testBreak = localStorage.getItem('test_break_lock');
    if (testBreak === 'true') {
      setIsBreakTime(true);
      setBreakLabel('Test Break Time (Demo)');
      setBreakEndTime('15 mins');
      return;
    }

    if (!config || config.length === 0) return;
    
    const currentDay = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM

    const todayConfigs = config.filter(c => c.day_of_week === currentDay);
    if (todayConfigs.length === 0 || !todayConfigs[0].is_working_day) {
      setIsNonWorkingDay(true);
      
      const firstConfig = todayConfigs[0] || config[0];
      const safeWorkStart = firstConfig?.work_start_time?.slice(0, 5) || '09:00';
      const isBeforeWork = currentTime < safeWorkStart;
      
      if (firstConfig?.is_working_day && isBeforeWork) {
        setNextWorkStart(`Today ${formatToAMPM(safeWorkStart)}`);
      } else {
        for (let i = 1; i <= 7; i++) {
          const nextDay = (currentDay + i) % 7;
          const nextConfig = config.find(c => c.day_of_week === nextDay && c.is_working_day);
          if (nextConfig) {
            setNextWorkStart(`${getDayName(nextDay)} ${formatToAMPM(nextConfig.work_start_time?.slice(0, 5) || '09:00')}`);
            break;
          }
        }
      }
      return;
    }

    setIsNonWorkingDay(false);
    
    const firstConfig = todayConfigs[0];
    const workStart = firstConfig.work_start_time.slice(0, 5);
    const workEnd = firstConfig.work_end_time.slice(0, 5);

    if (currentTime < workStart || currentTime >= workEnd) {
      setIsNonWorkingDay(true);
      if (currentTime < workStart) {
        setNextWorkStart(`Today ${formatToAMPM(workStart)}`);
      } else {
        for (let i = 1; i <= 7; i++) {
          const nextDay = (currentDay + i) % 7;
          const nextConfig = config.find(c => c.day_of_week === nextDay && c.is_working_day);
          if (nextConfig) {
            setNextWorkStart(`${getDayName(nextDay)} ${formatToAMPM(nextConfig.work_start_time?.slice(0, 5) || '09:00')}`);
            break;
          }
        }
      }
      return;
    }
    let foundBreak = false;
    for (const dayConfig of todayConfigs) {
      const bStart = dayConfig.break_start_time.slice(0, 5);
      const bEnd = dayConfig.break_end_time.slice(0, 5);
      
      if (currentTime >= bStart && currentTime < bEnd) {
        setIsBreakTime(true);
        setBreakEndTime(formatToAMPM(dayConfig.break_end_time));
        setBreakLabel(getBreakLabel(dayConfig.break_type));
        foundBreak = true;
        break;
      }
    }

    if (!foundBreak) {
      setIsBreakTime(false);
      setBreakEndTime(null);
      setBreakLabel(null);
    }
  }, [config, role, profile]);

  // Check late login
  useEffect(() => {
    if (!config || !user || config.length === 0) return;

    // Admins bypass late login checks
    // if (role === 'admin') return;

    // Ignore if testing
    if (localStorage.getItem('test_break_lock') === 'true') return;

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5);

    const todayConfigs = config.filter(c => c.day_of_week === currentDay && c.is_working_day);

    // Sort in REVERSE chronological order so we find the MOST RECENT break failure first
    todayConfigs.sort((a, b) => b.break_end_time.slice(0, 5).localeCompare(a.break_end_time.slice(0, 5)));

    for (const dayConfig of todayConfigs) {
      const breakEnd = dayConfig.break_end_time.slice(0, 5);
      const [bh, bm] = breakEnd.split(':').map(Number);

      const graceTime = new Date();
      graceTime.setHours(bh, bm + 10, 0, 0);

      // CRITICAL: Skip check if the user account was created AFTER this break's deadline.
      // This prevents new users from being blocked for breaks they weren't around for.
      if (user.created_at && new Date(user.created_at) > graceTime) {
        continue;
      }

      const graceHour = graceTime.getHours();
      const graceMin = graceTime.getMinutes();
      const graceTimeString = `${String(graceHour).padStart(2, '0')}:${String(graceMin).padStart(2, '0')}`;

      if (currentTime >= breakEnd) {
        const storageKey = `logged_in_after_${new Date().toDateString()}_${dayConfig.id || dayConfig.break_type}_${user.id}`;

        // If current time is past break_end but BEFORE graceTime (within the 10-minute window)
        if (currentTime < graceTimeString) {
          localStorage.setItem(storageKey, 'true');
        }

        // If we're past the 10-minute grace period after a break
        if (currentTime >= graceTimeString) {
          const alreadyChecked = localStorage.getItem(storageKey);

          if (alreadyChecked !== 'true' && alreadyChecked !== 'blocked') {
            localStorage.setItem(storageKey, 'blocked');
            // Block user!
            blockUser.mutate({
              userId: user.id,
              reason: `Failed to login within 10 minutes after ${getBreakLabel(dayConfig.break_type)} ended. (Deadline was ${graceTimeString})`
            });
            break; // Stop checking further breaks once blocked for the most recent one
          }
        }
      }
    }
  }, [config, user, blockUser, role]);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  return { isBreakTime, isNonWorkingDay, breakEndTime, breakLabel, nextWorkStart };
}
