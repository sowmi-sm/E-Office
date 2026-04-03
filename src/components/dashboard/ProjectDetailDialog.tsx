import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FolderKanban, Calendar, DollarSign, Users, UserCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ProjectDetailDialogProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    start_date: string | null;
    end_date: string | null;
    budget: number | null;
    progress: number;
    department_id: string | null;
    manager_id: string | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectDetailDialog({ project, open, onOpenChange }: ProjectDetailDialogProps) {
  const { data: manager } = useQuery({
    queryKey: ['project-manager', project?.manager_id],
    queryFn: async () => {
      if (!project?.manager_id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', project.manager_id)
        .maybeSingle();
      return data;
    },
    enabled: !!project?.manager_id && open,
  });

  const { data: department } = useQuery({
    queryKey: ['project-dept', project?.department_id],
    queryFn: async () => {
      if (!project?.department_id) return null;
      const { data } = await supabase
        .from('departments')
        .select('name')
        .eq('id', project.department_id)
        .maybeSingle();
      return data;
    },
    enabled: !!project?.department_id && open,
  });

  const { data: tasks } = useQuery({
    queryKey: ['project-tasks', project?.id],
    queryFn: async () => {
      if (!project?.id) return [];
      const { data } = await supabase
        .from('tasks')
        .select('id, title, status, priority, assigned_to')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!project?.id && open,
  });

  const { data: teamInfo } = useQuery({
    queryKey: ['project-team-info', project?.department_id],
    queryFn: async () => {
      if (!project?.department_id) return null;
      const { data: teams } = await supabase
        .from('teams')
        .select('id, name, leader_id')
        .eq('department_id', project.department_id);
      if (!teams?.length) return null;

      const teamIds = teams.map(t => t.id);
      const { data: members } = await supabase
        .from('team_members')
        .select('user_id')
        .in('team_id', teamIds);

      const userIds = [...new Set([
        ...teams.map(t => t.leader_id).filter(Boolean) as string[],
        ...(members || []).map(m => m.user_id),
      ])];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      return { teams, members: profiles || [], leaderIds: teams.map(t => t.leader_id).filter(Boolean) };
    },
    enabled: !!project?.department_id && open,
  });

  if (!project) return null;

  const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
  const totalTasks = tasks?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-primary" />
            {project.name}
          </DialogTitle>
          <DialogDescription className="sr-only">Project details</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <Badge variant={
            project.status === 'active' ? 'default' :
            project.status === 'completed' ? 'secondary' :
            project.status === 'on_hold' ? 'destructive' : 'outline'
          }>
            {project.status.replace('_', ' ')}
          </Badge>

          {project.description && (
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Description</p>
              <p className="text-sm text-muted-foreground">{project.description}</p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-3" />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Start</p>
                <p className="font-medium">{project.start_date ? new Date(project.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">End</p>
                <p className="font-medium">{project.end_date ? new Date(project.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set'}</p>
              </div>
            </div>
          </div>

          {project.budget && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-accent" />
              <span className="text-muted-foreground">Budget:</span>
              <span className="font-medium">₹{(project.budget / 10000000).toFixed(2)} Cr</span>
            </div>
          )}

          {department && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Department:</span>
              <span className="font-medium">{department.name}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <UserCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Manager:</span>
            <span className="font-medium">{manager?.full_name || manager?.email || 'Not assigned'}</span>
          </div>

          {/* Tasks summary */}
          {totalTasks > 0 && (
            <div className="border border-border rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium">Tasks ({completedTasks}/{totalTasks} completed)</p>
              <div className="space-y-1">
                {tasks?.slice(0, 5).map(task => (
                  <div key={task.id} className="flex items-center justify-between text-xs">
                    <span className="truncate">{task.title}</span>
                    <Badge variant="outline" className="text-xs shrink-0 ml-2">{task.status.replace('_', ' ')}</Badge>
                  </div>
                ))}
                {totalTasks > 5 && <p className="text-xs text-muted-foreground">+{totalTasks - 5} more tasks</p>}
              </div>
            </div>
          )}

          {/* Team */}
          {teamInfo && teamInfo.members.length > 0 && (
            <div className="border border-border rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Team Members</p>
              </div>
              {teamInfo.leaderIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Leader: {teamInfo.members.filter(m => teamInfo.leaderIds.includes(m.id)).map(m => m.full_name || m.email).join(', ')}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {teamInfo.members.map(m => (
                  <Badge key={m.id} variant="secondary" className="text-xs">
                    {m.full_name || m.email}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
