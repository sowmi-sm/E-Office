import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Types
export interface Task {
  id: string;
  title: string;
  description: string | null;
  project_id: string | null;
  assigned_to: string;
  created_by: string;
  status: string;
  priority: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  department_id: string | null;
  manager_id: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  department_id: string | null;
  leader_id: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  joined_at: string;
}

export interface UserKPI {
  id: string;
  user_id: string;
  kpi_template_id: string | null;
  current_value: number;
  target_value: number;
  period_start: string;
  period_end: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PerformanceRecord {
  id: string;
  user_id: string;
  evaluator_id: string;
  period_start: string;
  period_end: string;
  kpi_score: number;
  supervisor_feedback_score: number;
  overall_score: number;
  comments: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

// Role categorization helper
export function getRoleCategory(role: string | null): 'staff' | 'officer' | 'admin' {
  if (role === 'admin') return 'admin';
  if (['reporting_officer', 'project_manager', 'division_head', 'top_management'].includes(role || '')) {
    return 'officer';
  }
  return 'staff';
}

// Tasks hooks - role-based access
export function useTasks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) return data as Task[];

      return [] as Task[];
    },
    enabled: !!user,
  });
}

// My Tasks (for staff - only their assigned tasks)
export function useMyTasks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-tasks', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .or(`assigned_to.eq.${user!.id},created_by.eq.${user!.id}`)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data as Task[];
    },
    enabled: !!user,
  });
}

// Update Task Status
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, status, description }: { taskId: string; status: string; description?: string | null }) => {
      const payload: any = {
        status,
        completed_at: status === 'completed' ? new Date().toISOString() : null
      };

      if (description !== undefined) {
        payload.description = description;
      }

      const { error } = await supabase
        .from('tasks')
        .update(payload)
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] }); // Auto-update project progress bounds
    },
  });
}

// Delete Task
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] }); // Auto-update project progress bounds
      toast.success('Task deleted successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to delete task', { description: error.message });
    }
  });
}

// Projects hooks
export function useProjects() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['projects', user?.id],
    queryFn: async () => {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && projects && projects.length > 0) {
        // Fetch all tasks associated with projects to calculate real-time linked progress!
        const { data: tasks } = await supabase
          .from('tasks')
          .select('project_id, status')
          .not('project_id', 'is', null);

        // Dynamically compute progress map based on actual active tasks
        return projects.map((p: any) => {
          const projectTasks = tasks?.filter(t => t.project_id === p.id) || [];

          // If project is explicitly marked 'completed' in DB, always show 100% 
          if (p.status === 'completed') {
            p.progress = 100;
          } else if (projectTasks.length > 0) {
            const completed = projectTasks.filter(t => t.status === 'completed').length;
            p.progress = Math.round((completed / projectTasks.length) * 100);
          }

          // Auto-promote projects with 100% progress to 'completed' state in UI
          if (p.progress === 100 && p.status === 'active') {
            p.status = 'completed';
          }

          return p as Project;
        });
      }

      // Final fallback if DB is empty
      const demoProjects: Project[] = [];

      return demoProjects;
    },
    enabled: !!user,
  });
}

// Update Project (Delegate/Edit)
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, updates }: { projectId: string; updates: Partial<Project> }) => {
      // Exclude progress since it's computed or handled separately often, but if they want to update it manually we allow it
      const { id, created_at, updated_at, ...cleanUpdates } = updates as any;

      const { error } = await supabase
        .from('projects')
        .update({
          ...cleanUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Project updated successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to update project', { description: error.message });
    }
  });
}

// Delete Project
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Project deleted successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to delete project', { description: error.message });
    }
  });
}

// Teams hooks
export function useTeams() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['teams', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');

      if (!error && data && data.length > 0) return data as Team[];

      // Fallback
      return [] as Team[];
    },
    enabled: !!user,
  });
}

// Team members hooks
export function useTeamMembers(teamId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['team-members', teamId],
    queryFn: async () => {
      let query = supabase.from('team_members').select('*');
      if (teamId) {
        query = query.eq('team_id', teamId);
      }
      const { data, error } = await query;

      if (!error && data && data.length > 0) return data as TeamMember[];

      // Fallback
      return [] as TeamMember[];
    },
    enabled: !!user,
  });
}

// Create Team
export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (team: { name: string; description?: string | null; department_id?: string | null; leader_id?: string | null }) => {
      const { data, error } = await supabase
        .from('teams')
        .insert([team as any])
        .select()
        .single();

      if (error) throw error;
      return data as Team;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team created successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to create team', { description: error.message });
    }
  });
}

// Update Team
export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ teamId, ...updates }: { teamId: string; name?: string; description?: string | null; department_id?: string | null; leader_id?: string | null }) => {
      const { data, error } = await supabase
        .from('teams')
        .update(updates as any)
        .eq('id', teamId)
        .select()
        .single();

      if (error) throw error;
      return data as Team;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team updated successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to update team', { description: error.message });
    }
  });
}

// Delete Team
export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team deleted successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to delete team', { description: error.message });
    }
  });
}

// Add Team Member
export function useAddTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (member: { team_id: string; user_id: string }) => {
      const { data, error } = await supabase
        .from('team_members' as any)
        .insert([member])
        .select()
        .single();

      if (error) throw error;
      return data as unknown as TeamMember;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      queryClient.invalidateQueries({ queryKey: ['team-members', variables.team_id] });
      toast.success('Member added to team');
    },
    onError: (error: any) => {
      toast.error('Failed to add member', { description: error.message });
    }
  });
}

// Remove Team Member
export function useRemoveTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast.success('Member removed from team');
    },
    onError: (error: any) => {
      toast.error('Failed to remove member', { description: error.message });
    }
  });
}

// User KPIs hooks
export function useUserKPIs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-kpis', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_kpis')
        .select('*')
        .order('period_start', { ascending: false });

      if (!error && data && data.length > 0) return data as UserKPI[];

      return [] as UserKPI[];
    },
    enabled: !!user,
  });
}

// My KPIs (for staff)
export function useMyKPIs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-kpis', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_kpis')
        .select('*')
        .eq('user_id', user!.id)
        .order('period_start', { ascending: false });

      if (error) throw error;
      return data as UserKPI[];
    },
    enabled: !!user,
  });
}

// Delete User KPI
export function useDeleteUserKPI() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (kpiId: string) => {
      const { error } = await supabase
        .from('user_kpis')
        .delete()
        .eq('id', kpiId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['my-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('KPI deleted successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to delete KPI', { description: error.message });
    }
  });
}

// Performance records hooks
export function usePerformanceRecords() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['performance-records', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('performance_records')
        .select('*')
        .order('period_start', { ascending: false });

      if (error) throw error;
      return data as PerformanceRecord[];
    },
    enabled: !!user,
  });
}

// My Performance Records (for staff)
export function useMyPerformanceRecords() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['my-performance-records', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('performance_records')
        .select('*')
        .eq('user_id', user!.id)
        .order('period_start', { ascending: false });

      if (error) throw error;
      return data as PerformanceRecord[];
    },
    enabled: !!user,
  });
}

// Dashboard stats hooks
export function useDashboardStats() {
  const { user, role } = useAuth();
  const roleCategory = getRoleCategory(role);

  return useQuery({
    queryKey: ['dashboard-stats', user?.id, roleCategory],
    queryFn: async () => {
      // Get tasks count
      const tasksQuery = role !== 'admin'
        ? supabase.from('tasks').select('id, status').or(`assigned_to.eq.${user!.id},created_by.eq.${user!.id}`)
        : supabase.from('tasks').select('id, status');

      const { data: tasks } = await tasksQuery;

      // Get projects count
      const { data: projects } = await supabase
        .from('projects')
        .select('id, status, progress');

      // Get KPIs
      const kpisQuery = role !== 'admin'
        ? supabase.from('user_kpis').select('id, status, current_value, target_value').eq('user_id', user!.id)
        : supabase.from('user_kpis').select('id, status, current_value, target_value');

      const { data: kpis } = await kpisQuery;

      // Get performance records
      const perfQuery = role !== 'admin'
        ? supabase.from('performance_records').select('overall_score').eq('user_id', user!.id)
        : supabase.from('performance_records').select('overall_score');

      const { data: perfRecords } = await perfQuery;

      // Calculate stats
      const pendingTasks = tasks?.filter(t => t.status === 'pending').length || 0;
      const inProgressTasks = tasks?.filter(t => t.status === 'in_progress').length || 0;
      const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
      const overdueTasks = tasks?.filter(t => t.status === 'overdue').length || 0;

      const activeProjects = projects?.filter(p => p.status === 'active').length || 0;
      const avgProjectProgress = projects?.length
        ? projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length
        : 0;

      const activeKPIs = kpis?.length || 0;
      const kpisOnTrack = kpis?.filter(k => k.status === 'on_track' || k.status === 'exceeded').length || 0;

      // Calculate dynamic system productivity score 
      const taskCompletionRate = tasks && tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
      let avgPerformanceScore = 0;

      if (perfRecords && perfRecords.length > 0) {
        const dbScore = perfRecords.reduce((sum, p) => sum + (p.overall_score || 0), 0) / perfRecords.length;
        // Blend historical DB score with live task completion impact (70/30 weight)
        avgPerformanceScore = (dbScore * 0.7) + (taskCompletionRate * 0.3);
      } else {
        // Fallback to pure active task completion metrics if no formal performance reviews exist
        avgPerformanceScore = taskCompletionRate || 83; // Base 83 fallback to avoid 0 if brand new
      }

      return {
        tasks: {
          total: tasks?.length || 0,
          pending: pendingTasks,
          inProgress: inProgressTasks,
          completed: completedTasks,
          overdue: overdueTasks,
        },
        projects: {
          total: projects?.length || 0,
          active: activeProjects,
          avgProgress: Math.round(avgProjectProgress),
        },
        kpis: {
          total: activeKPIs,
          onTrack: kpisOnTrack,
          percentage: activeKPIs ? Math.round((kpisOnTrack / activeKPIs) * 100) : 0,
        },
        performance: {
          avgScore: Math.round(avgPerformanceScore),
          recordsCount: perfRecords?.length || 0,
        },
      };
    },
    enabled: !!user,
  });
}
