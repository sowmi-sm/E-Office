import { cn } from '@/lib/utils';
import { Calendar, DollarSign, TrendingUp, Loader2 } from 'lucide-react';
import { useProjects } from '@/hooks/useRoleBasedData';
import { useUsers } from '@/hooks/useAdminData';

export function ProjectProgress() {
  const { data: projects, isLoading: isLoadingProjects } = useProjects();
  const { data: users, isLoading: isLoadingUsers } = useUsers();

  const isLoading = isLoadingProjects || isLoadingUsers;

  return (
    <div className="bg-card rounded-xl p-5 shadow-md border border-border">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-card-foreground">Active Projects</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Progress and budget tracking</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : projects?.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">No active projects found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects?.slice(0, 3).map((project, index) => {
            const manager = users?.find(u => u.id === project.manager_id);
            const managerName = manager?.full_name || manager?.email || 'Unassigned';

            // Safe fallback if budget is null 
            const budgetUsed = project.budget && project.budget > 0
              ? ((project.progress || 0) / project.budget) * 100 // Approximation since we don't have spent yet
              : project.progress || 0;
            const isOverBudget = false; // Add actual spent column in future

            return (
              <div
                key={project.id}
                className="p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-card-foreground text-sm truncate">
                      {project.name}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Manager: {managerName}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'text-xs px-2 py-1 rounded-full font-medium',
                      project.status === 'active'
                        ? 'bg-success/10 text-success'
                        : project.status === 'on_hold'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {project.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Physical Progress
                    </span>
                    <span className="font-medium text-card-foreground">{project.progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-500"
                      style={{ width: `${project.progress || 0}%` }}
                    />
                  </div>
                </div>

                {/* Budget Bar - Simulated using progress until Spent column exists */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Budget Utilized
                    </span>
                    <span
                      className={cn(
                        'font-medium',
                        isOverBudget ? 'text-destructive' : 'text-card-foreground'
                      )}
                    >
                      {project.progress}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        isOverBudget ? 'bg-destructive' : 'bg-primary'
                      )}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                {/* Timeline */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {project.end_date ? new Date(project.end_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      }) : 'No deadline'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
