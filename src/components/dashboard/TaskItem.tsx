import { cn } from '@/lib/utils';
import { Task } from '@/lib/sample-data';
import { Calendar, AlertCircle, Clock, CheckCircle2, Circle } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  index: number;
}

const statusConfig = {
  pending: {
    icon: Circle,
    label: 'Pending',
    className: 'bg-muted text-muted-foreground',
  },
  in_progress: {
    icon: Clock,
    label: 'In Progress',
    className: 'bg-info/10 text-info',
  },
  completed: {
    icon: CheckCircle2,
    label: 'Completed',
    className: 'bg-success/10 text-success',
  },
  overdue: {
    icon: AlertCircle,
    label: 'Overdue',
    className: 'bg-destructive/10 text-destructive',
  },
};

const priorityConfig = {
  low: 'border-l-muted-foreground',
  medium: 'border-l-info',
  high: 'border-l-warning',
  critical: 'border-l-destructive',
};

export function TaskItem({ task, index }: TaskItemProps) {
  const status = statusConfig[task.status];
  const StatusIcon = status.icon;

  return (
    <div
      className={cn(
        'bg-card rounded-lg p-4 shadow-sm border border-border hover:shadow-md transition-all duration-300 border-l-4 animate-slide-up',
        priorityConfig[task.priority]
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-card-foreground text-sm truncate">{task.title}</h4>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{task.description}</p>
        </div>
        <span
          className={cn(
            'flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium shrink-0',
            status.className
          )}
        >
          <StatusIcon className="h-3 w-3" />
          {status.label}
        </span>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>Due: {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
        </div>
        {task.project && (
          <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded truncate max-w-[120px]">
            {task.project}
          </span>
        )}
      </div>
    </div>
  );
}
