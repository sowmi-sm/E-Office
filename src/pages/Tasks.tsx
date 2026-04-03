import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Filter, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTasks, useMyTasks, getRoleCategory } from '@/hooks/useRoleBasedData';
import { TaskDetailDialog } from '@/components/dashboard/TaskDetailDialog';
import { CreateTaskDialog } from '@/components/dashboard/CreateTaskDialog';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';

export default function Tasks() {
  const { role } = useAuth();
  const roleCategory = getRoleCategory(role);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const { data: allTasks, isLoading: allTasksLoading } = useTasks();
  const { data: myTasks, isLoading: myTasksLoading } = useMyTasks();

  const isLoading = role !== 'admin' ? myTasksLoading : allTasksLoading;
  const rawTasks = role !== 'admin' ? myTasks : allTasks;

  const tasks = rawTasks?.filter(t => {
    if (priorityFilter === 'all') return true;
    return t.priority === priorityFilter;
  });

  const todoTasks = tasks?.filter(t => t.status === 'pending') || [];
  const inProgressTasks = tasks?.filter(t => t.status === 'in_progress' && !t.description?.includes('[REVIEW_REQUEST]')) || [];
  const inReviewTasks = tasks?.filter(t => t.status === 'in_review' || (t.status === 'in_progress' && t.description?.includes('[REVIEW_REQUEST]'))) || [];
  const overdueTasks = tasks?.filter(t => t.status === 'overdue') || [];
  const completedTasks = tasks?.filter(t => t.status === 'completed') || [];

  const TaskCard = ({ task }: { task: any }) => (
    <Card
      className="hover:bg-muted/50 transition-colors cursor-pointer hover:shadow-md"
      onClick={() => setSelectedTask(task)}
    >
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-sm line-clamp-2">{task.title}</h3>
            <Badge
              variant={task.priority === 'critical' ? 'destructive' :
                task.priority === 'high' ? 'default' : 'secondary'}
              className="shrink-0"
            >
              {task.priority}
            </Badge>
          </div>
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description.replace(/\[REVIEW_REQUEST\]/g, '')}
            </p>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const columns = [
    { label: 'To Do', color: 'bg-yellow-500', tasks: todoTasks },
    { label: 'In Progress', color: 'bg-blue-500', tasks: inProgressTasks },
    { label: 'In Review', color: 'bg-purple-500', tasks: inReviewTasks },
    { label: 'Overdue', color: 'bg-red-500', tasks: overdueTasks },
    { label: 'Completed', color: 'bg-green-500', tasks: completedTasks },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              {role !== 'admin' ? 'My Tasks' : 'All Tasks'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {role !== 'admin'
                ? 'View and manage your assigned work items'
                : 'Manage and track all team tasks'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  {priorityFilter === 'all' ? 'All Priorities' : priorityFilter.charAt(0).toUpperCase() + priorityFilter.slice(1)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setPriorityFilter('all')}>All Priorities</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPriorityFilter('critical')}>Critical Priority</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPriorityFilter('high')}>High Priority</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPriorityFilter('medium')}>Medium Priority</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPriorityFilter('low')}>Low Priority</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {role === 'admin' && (
              <Button variant="accent" className="gap-2" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                New Task
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : tasks?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No tasks found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
            {columns.map(col => (
              <div key={col.label} className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${col.color}`} />
                  <h2 className="font-semibold text-foreground">{col.label} ({col.tasks.length})</h2>
                </div>
                <div className="space-y-3">
                  {col.tasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                  {col.tasks.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No tasks</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TaskDetailDialog
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
      />

      <CreateTaskDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </DashboardLayout>
  );
}
