import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, Calendar, UserCircle, TrendingUp, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getRoleCategory, useDeleteUserKPI } from '@/hooks/useRoleBasedData';

interface KPIDetailDialogProps {
  kpi: {
    id: string;
    user_id: string;
    kpi_template_id: string | null;
    current_value: number;
    target_value: number;
    period_start: string;
    period_end: string;
    status: string;
  } | null;
  templateName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  on_track: 'default',
  exceeded: 'default',
  at_risk: 'secondary',
  behind: 'destructive',
};

export function KPIDetailDialog({ kpi, templateName, open, onOpenChange }: KPIDetailDialogProps) {
  const { role } = useAuth();
  const roleCategory = getRoleCategory(role);
  const deleteKPI = useDeleteUserKPI();

  const { data: assignee } = useQuery({
    queryKey: ['kpi-user', kpi?.user_id],
    queryFn: async () => {
      if (!kpi?.user_id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', kpi.user_id)
        .maybeSingle();
      return data;
    },
    enabled: !!kpi?.user_id && open,
  });

  const { data: template } = useQuery({
    queryKey: ['kpi-template-detail', kpi?.kpi_template_id],
    queryFn: async () => {
      if (!kpi?.kpi_template_id) return null;
      const { data } = await supabase
        .from('kpi_templates')
        .select('*')
        .eq('id', kpi.kpi_template_id)
        .maybeSingle();
      return data;
    },
    enabled: !!kpi?.kpi_template_id && open,
  });

  if (!kpi) return null;

  const progress = kpi.target_value > 0
    ? Math.round((kpi.current_value / kpi.target_value) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="flex flex-row gap-2 items-center justify-between mt-2">
          <div>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {templateName}
            </DialogTitle>
            <DialogDescription className="sr-only">KPI details</DialogDescription>
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
                  <AlertDialogTitle>Delete KPI Assignment</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to permanently delete this assigned KPI sequence? This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      try {
                        await deleteKPI.mutateAsync(kpi.id);
                        onOpenChange(false);
                      } catch (e) {
                        // Toast handled via hook
                      }
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={deleteKPI.isPending}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </DialogHeader>

        <div className="space-y-5">
          <Badge variant={statusColors[kpi.status] || 'outline'}>
            {kpi.status.replace('_', ' ')}
          </Badge>

          {template?.description && (
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Description</p>
              <p className="text-sm text-muted-foreground">{template.description}</p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.min(progress, 100)}%</span>
            </div>
            <Progress value={Math.min(progress, 100)} className="h-3" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="border border-border rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{kpi.current_value}</p>
              <p className="text-xs text-muted-foreground">Current Value</p>
            </div>
            <div className="border border-border rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{kpi.target_value}</p>
              <p className="text-xs text-muted-foreground">Target Value</p>
            </div>
          </div>

          {template && (
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Unit:</span>
              <span className="font-medium">{template.unit}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <UserCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Assigned to:</span>
            <span className="font-medium">{assignee?.full_name || assignee?.email || 'Staff Member'}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Period:</span>
            <span className="font-medium">
              {new Date(kpi.period_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              {' — '}
              {new Date(kpi.period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
