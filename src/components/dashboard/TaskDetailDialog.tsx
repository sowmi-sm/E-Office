import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, DollarSign, Users, UserCircle, Clock, FolderKanban, Loader2, Send, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUpdateTaskStatus, useDeleteTask, getRoleCategory } from '@/hooks/useRoleBasedData';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { toast } from 'sonner';

interface TaskDetailDialogProps {
  task: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    due_date: string | null;
    project_id: string | null;
    assigned_to: string;
    created_by: string;
    created_at: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-info/10 text-info',
  high: 'bg-warning/10 text-warning',
  critical: 'bg-destructive/10 text-destructive',
};

const statusColors: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground',
  in_progress: 'bg-info/10 text-info',
  in_review: 'bg-purple-500/10 text-purple-600',
  completed: 'bg-accent/10 text-accent',
  overdue: 'bg-destructive/10 text-destructive',
};

export function TaskDetailDialog({ task, open, onOpenChange }: TaskDetailDialogProps) {
  const { user, role } = useAuth();
  const roleCategory = getRoleCategory(role);
  const [taskNote, setTaskNote] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>(task?.status || 'pending');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTask();

  // Fetch project details if task has a project
  const { data: project } = useQuery({
    queryKey: ['task-project', task?.project_id],
    queryFn: async () => {
      if (!task?.project_id) return null;
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', task.project_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!task?.project_id && open,
  });

  // Fetch assigned user profile
  const { data: assignee } = useQuery({
    queryKey: ['task-assignee', task?.assigned_to],
    queryFn: async () => {
      if (!task?.assigned_to) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', task.assigned_to)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!task?.assigned_to && open,
  });

  // Fetch creator profile
  const { data: creator, isLoading: isLoadingCreator } = useQuery({
    queryKey: ['task-creator', task?.created_by],
    queryFn: async () => {
      if (!task?.created_by) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', task.created_by)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!task?.created_by && open,
  });

  // Fetch project team members via team
  const { data: teamMembers } = useQuery({
    queryKey: ['project-team-members', project?.department_id],
    queryFn: async () => {
      if (!project?.department_id) return [];
      const { data: teams } = await supabase
        .from('teams')
        .select('id, name, leader_id')
        .eq('department_id', project.department_id);
      if (!teams || teams.length === 0) return [];

      const teamIds = teams.map(t => t.id);
      const { data: members } = await supabase
        .from('team_members')
        .select('user_id')
        .in('team_id', teamIds);

      if (!members || members.length === 0) return [];

      const userIds = [...new Set(members.map(m => m.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const leaderIds = teams.map(t => t.leader_id).filter(Boolean);
      const { data: leaderProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', leaderIds as string[]);

      return {
        members: profiles || [],
        leaders: leaderProfiles || [],
        teams: teams,
      };
    },
    enabled: !!project?.department_id && open,
  });

  if (!task) return null;

  const isAssignee = user?.id === task.assigned_to;
  const isManagerOrAdmin = roleCategory === 'admin' || roleCategory === 'officer' || user?.id === task.created_by;
  const isInReview = task.status === 'in_review' || (task.status === 'in_progress' && task.description?.includes('[REVIEW_REQUEST]'));
  const actualStatus = isInReview ? 'in_review' : task.status;
  const displayDescription = task.description?.replace(/\[REVIEW_REQUEST\]/g, '')?.trim();

  const handleWorkSubmit = async () => {
    setIsSubmitting(true);
    try {
      let finalDescription = displayDescription || '';
      if (taskNote.trim()) {
        const noteStamp = `\n\n--- \n**Update (${new Date().toLocaleDateString()}):** ${taskNote.trim()}`;
        finalDescription = finalDescription + noteStamp;
      }

      // Automatically trigger the Review Request flow when a worker submits their form
      let finalStatus = 'in_progress';
      if (!finalDescription.includes('[REVIEW_REQUEST]')) {
        finalDescription = finalDescription + '\n\n[REVIEW_REQUEST]';
      }

      await updateStatus.mutateAsync({
        taskId: task.id,
        status: finalStatus,
        description: finalDescription
      });
      toast.success('Work submitted successfully');
      setTaskNote('');
      onOpenChange(false);
    } catch (e) {
      toast.error('Failed to submit work');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) setTaskNote('');
      onOpenChange(val);
    }}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="flex flex-row items-center justify-between mt-2">
          <div>
            <DialogTitle className="text-lg pr-4">{task.title}</DialogTitle>
            <DialogDescription className="sr-only">Task details</DialogDescription>
          </div>
          {roleCategory === 'admin' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Task</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to completely delete this task? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      try {
                        await deleteTask.mutateAsync(task.id);
                        onOpenChange(false);
                      } catch (e) {
                        // Toast handled via hook
                      }
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={deleteTask.isPending}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </DialogHeader>

        <div className="space-y-5">
          {/* Status & Priority */}
          <div className="flex items-center gap-2">
            {roleCategory === 'admin' ? (
              <Select
                value={actualStatus}
                onValueChange={async (newStatus) => {
                  try {
                    const payload: any = { taskId: task.id, status: newStatus };
                    if (newStatus === 'in_review') {
                      payload.status = 'in_progress';
                      payload.description = (displayDescription || '') + '\n\n[REVIEW_REQUEST]';
                    } else if (newStatus === 'completed' || newStatus === 'in_progress') {
                      payload.description = displayDescription || ''; // Clean tag
                    }
                    await updateStatus.mutateAsync(payload);
                    toast.success('Task status updated successfully');
                  } catch (e) {
                    toast.error('Failed to update status');
                  }
                }}
              >
                <SelectTrigger className={`w-[150px] h-8 text-xs font-medium border-0 focus:ring-0 ${statusColors[actualStatus] || ''}`}>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="completed">Completed (Verified)</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="outline" className={`h-8 font-medium ${statusColors[actualStatus] || ''} border-0`}>
                {actualStatus === 'in_review' ? 'In Review' : actualStatus.replace('_', ' ')}
              </Badge>
            )}

            <Badge className={priorityColors[task.priority] || ''}>
              {task.priority} priority
            </Badge>
          </div>

          {/* Description */}
          {displayDescription && (
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Description</p>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap rounded-md bg-muted/20 p-3 border border-border/50 max-h-40 overflow-y-auto">
                {displayDescription}
              </div>
            </div>
          )}

          {/* Due Date */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Due:</span>
            <span className="font-medium">
              {task.due_date ? new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'No due date'}
            </span>
          </div>

          {/* Assigned To */}
          <div className="flex items-center gap-2 text-sm">
            <UserCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Assigned to:</span>
            <span className="font-medium">{assignee?.full_name || assignee?.email || 'Unknown'}</span>
          </div>

          {/* Created By */}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Created by:</span>
            {isLoadingCreator ? (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            ) : (
              <span className="font-medium">{creator?.full_name || creator?.email || 'Administrator'}</span>
            )}
          </div>

          {/* Project Details */}
          {project && (
            <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">{project.name}</span>
                <Badge variant="outline" className="text-xs">{project.status}</Badge>
              </div>

              {project.description && (
                <p className="text-xs text-muted-foreground">{project.description}</p>
              )}

              <div className="grid grid-cols-2 gap-3">
                {project.budget && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-accent" />
                    <span className="text-muted-foreground">Budget:</span>
                    <span className="font-medium">₹{(project.budget / 100000).toFixed(1)}L</span>
                  </div>
                )}
                <div className="text-sm">
                  <span className="text-muted-foreground">Progress: </span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
              </div>

              <Progress value={project.progress} className="h-2" />

              {/* Team Leader & Members */}
              {teamMembers && typeof teamMembers === 'object' && 'leaders' in teamMembers && (
                <div className="space-y-2 pt-2 border-t border-border">
                  {teamMembers.leaders.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">Team Leader:</span>
                      <span className="font-medium">
                        {teamMembers.leaders.map(l => l.full_name || l.email).join(', ')}
                      </span>
                    </div>
                  )}
                  {teamMembers.members.length > 0 && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Team Members:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {teamMembers.members.map((m: any) => (
                          <Badge key={m.id} variant="secondary" className="text-xs">
                            {m.full_name || m.email}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Admin Verification Section (When In Review) */}
          {isInReview && isManagerOrAdmin && !isAssignee && (
            <div className="border border-purple-500/20 bg-purple-500/5 rounded-lg p-4 space-y-3 mt-4">
              <h4 className="font-semibold text-sm flex items-center gap-2 text-purple-600">
                <CheckCircle className="h-4 w-4" />
                Task Verification Required
              </h4>
              <p className="text-xs text-muted-foreground mb-3">
                The assignee has submitted this task for review. Please verify their work and approve or reject it.
              </p>

              <div className="flex gap-3">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={async () => {
                    try {
                      await updateStatus.mutateAsync({ taskId: task.id, status: 'completed', description: displayDescription || '' });
                      toast.success('Task approved and marked as completed!');
                    } catch (e) { toast.error('Error approving task'); }
                  }}
                  disabled={updateStatus.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve & Complete
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={async () => {
                    try {
                      await updateStatus.mutateAsync({ taskId: task.id, status: 'in_progress', description: (displayDescription || '') + `\n\n--- \n**Rejected by Verifier (${new Date().toLocaleDateString()}):** Work requires revisions.` });
                      toast.success('Task rejected and sent back to In Progress');
                    } catch (e) { toast.error('Error rejecting task'); }
                  }}
                  disabled={updateStatus.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject (Needs Work)
                </Button>
              </div>
            </div>
          )}

          {/* Submit Work Section (Only for Assignees) */}
          {isAssignee && actualStatus !== 'completed' && !isInReview && (
            <div className="border border-primary/20 bg-primary/5 rounded-lg p-4 space-y-3 mt-4">
              <h4 className="font-semibold text-sm flex items-center gap-2 text-primary">
                <Send className="h-4 w-4" />
                Submit Work for Review
              </h4>
              <p className="text-xs text-muted-foreground">
                Summarize your progress or drop links to your deliverables before submitting.
              </p>

              <div className="space-y-3">
                {actualStatus === 'pending' && (
                  <p className="text-xs text-yellow-600 mb-2">
                    Note: Submitting this will automatically start the task and mark it as 'In Review'.
                  </p>
                )}
                <Textarea
                  placeholder="Review notes..."
                  value={taskNote}
                  onChange={(e) => setTaskNote(e.target.value)}
                  className="min-h-[80px] text-sm resize-none bg-background focus-visible:ring-1"
                />

                <Button
                  className="w-full"
                  onClick={handleWorkSubmit}
                  disabled={isSubmitting || updateStatus.isPending || !taskNote.trim()}
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Submit Work for Review
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
