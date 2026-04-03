import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Plus, Filter, FolderKanban, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects, getRoleCategory } from '@/hooks/useRoleBasedData';
import { ProjectDetailDialog } from '@/components/dashboard/ProjectDetailDialog';
import { CreateProjectDialog } from '@/components/dashboard/CreateProjectDialog';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';

export default function Projects() {
  const { role } = useAuth();
  const roleCategory = getRoleCategory(role);
  const { data: rawProjects, isLoading } = useProjects();
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const projects = rawProjects?.filter(p => {
    if (statusFilter === 'all') return true;
    return p.status === statusFilter;
  });

  const activeProjects = projects?.filter(p => p.status !== 'completed' && (p.progress ?? 0) < 100) || [];
  const completedProjects = projects?.filter(p => p.status === 'completed' || (p.progress ?? 0) === 100) || [];

  const renderProjectCard = (project: any, index: number, isCompleted: boolean = false) => (
    <Card
      key={project.id}
      className={`animate-slide-up hover:shadow-md transition-shadow cursor-pointer ${isCompleted ? 'opacity-80 bg-muted/30' : ''}`}
      style={{ animationDelay: `${index * 50}ms` }}
      onClick={() => setSelectedProject(project)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FolderKanban className={`h-5 w-5 ${isCompleted ? 'text-muted-foreground' : 'text-primary'}`} />
            <CardTitle className="text-base">{project.name}</CardTitle>
          </div>
          <Badge variant={
            project.status === 'active' && !isCompleted ? 'default' :
              isCompleted || project.status === 'completed' ? 'secondary' :
                project.status === 'on_hold' ? 'destructive' : 'outline'
          }>
            {isCompleted ? 'completed' : project.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {project.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
        )}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{project.progress || 0}%</span>
          </div>
          <Progress value={project.progress || 0} className={`h-2 ${isCompleted ? 'opacity-70' : ''}`} />
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Start Date</p>
            <p className="font-medium">
              {project.start_date
                ? new Date(project.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                : 'Not set'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">End Date</p>
            <p className="font-medium">
              {project.end_date
                ? new Date(project.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                : 'Not set'}
            </p>
          </div>
        </div>
        {project.budget && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Budget: ₹{(project.budget / 10000000).toFixed(2)} Cr
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Projects</h1>
            <p className="text-muted-foreground mt-1">
              {roleCategory === 'staff'
                ? 'View projects you are assigned to'
                : 'Track and manage all project milestones'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  {statusFilter === 'all' ? 'All Projects' : statusFilter.replace('_', ' ').charAt(0).toUpperCase() + statusFilter.replace('_', ' ').slice(1)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>All Projects</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('active')}>Active Only</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('on_hold')}>On Hold Only</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('completed')}>Completed Only</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('upcoming')}>Upcoming Only</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {(role === 'admin' || role === 'project_manager') && (
              <Button variant="accent" className="gap-2" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : projects?.length === 0 ? (
          <div className="text-center py-12">
            <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No projects found</p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Active Projects */}
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                Active Projects
              </h2>
              {activeProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeProjects.map((project, index) => renderProjectCard(project, index, false))}
                </div>
              ) : (
                <div className="text-center py-8 bg-muted/20 border border-dashed rounded-lg text-muted-foreground">
                  No active projects.
                </div>
              )}
            </div>

            {/* Completed Projects */}
            {completedProjects.length > 0 && (
              <div className="animate-fade-in">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                  Completed Projects
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedProjects.map((project, index) => renderProjectCard(project, index, true))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ProjectDetailDialog
        project={selectedProject}
        open={!!selectedProject}
        onOpenChange={(open) => !open && setSelectedProject(null)}
      />

      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </DashboardLayout>
  );
}
