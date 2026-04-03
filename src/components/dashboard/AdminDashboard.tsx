import { StatCard } from '@/components/dashboard/StatCard';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { TeamPerformance } from '@/components/dashboard/TeamPerformance';
import { ProjectProgress } from '@/components/dashboard/ProjectProgress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats, useProjects, useTeams, useTasks } from '@/hooks/useRoleBasedData';
import { useUsers, useDepartments } from '@/hooks/useAdminData';
import { Loader2, Users, Building2, FolderKanban, TrendingUp, ArrowRight, Shield, Target, Settings, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { TaskDetailDialog } from '@/components/dashboard/TaskDetailDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AdminDashboard() {
  const { profile } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: departments, isLoading: deptsLoading } = useDepartments();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: teams, isLoading: teamsLoading } = useTeams();
  const { data: allTasks, isLoading: tasksLoading } = useTasks();

  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [selectedUserCategory, setSelectedUserCategory] = useState<'admins' | 'officers' | 'staff' | null>(null);

  const displayName = profile?.full_name || profile?.email?.split('@')[0] || 'User';

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalUsers = users?.length || 0;
  const adminsCount = users?.filter(u => u.role === 'admin').length || 0;
  const officersCount = users?.filter(u => ['reporting_officer', 'project_manager', 'division_head', 'top_management'].includes(u.role || '')).length || 0;
  const staffCount = totalUsers - adminsCount - officersCount;

  const getFilteredUsers = (category: 'admins' | 'officers' | 'staff' | null) => {
    if (!users) return [];
    if (category === 'admins') return users.filter(u => u.role === 'admin');
    if (category === 'officers') return users.filter(u => ['reporting_officer', 'project_manager', 'division_head', 'top_management'].includes(u.role || ''));
    if (category === 'staff') return users.filter(u => !['admin', 'reporting_officer', 'project_manager', 'division_head', 'top_management'].includes(u.role || ''));
    return [];
  };

  const selectedUsersList = getFilteredUsers(selectedUserCategory);

  // Compute pending worker submissions
  const pendingSubmissions = allTasks?.filter(t => t.status === 'in_review' || (t.status === 'in_progress' && t.description?.includes('[REVIEW_REQUEST]'))) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="animate-slide-up">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {displayName} • Organization-wide overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin">
            <Button variant="outline" className="gap-2">
              <Shield className="h-4 w-4" />
              Admin Panel
            </Button>
          </Link>
          <Link to="/settings">
            <Button variant="accent" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Organization Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={totalUsers}
          subtitle={`${adminsCount} admins, ${officersCount} officers`}
          icon={Users}
          variant="primary"
        />
        <StatCard
          title="Departments"
          value={departments?.length || 0}
          subtitle="Active departments"
          icon={Building2}
          variant="default"
        />
        <StatCard
          title="Active Projects"
          value={stats?.projects.active || 0}
          subtitle={`${stats?.projects.total || 0} total projects`}
          icon={FolderKanban}
          variant="default"
        />
        <StatCard
          title="Org Performance"
          value={`${stats?.performance.avgScore || 0}%`}
          subtitle="Average across all users"
          icon={TrendingUp}
          variant="accent"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link to="/admin" className="block">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Manage Users</p>
                <p className="text-sm text-muted-foreground">Roles & permissions</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/admin" className="block">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-3 rounded-lg bg-accent/10">
                <Building2 className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-medium">Departments</p>
                <p className="text-sm text-muted-foreground">Organization structure</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/admin" className="block">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-3 rounded-lg bg-secondary/10">
                <Target className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="font-medium">KPI Templates</p>
                <p className="text-sm text-muted-foreground">Define metrics</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/analytics" className="block">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-3 rounded-lg bg-muted">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Analytics</p>
                <p className="text-sm text-muted-foreground">Reports & insights</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="xl:col-span-2 space-y-6">
          {/* Worker Submissions Verification Session */}
          <Card className="border-purple-500/20 shadow-sm">
            <CardHeader className="bg-purple-500/5 border-b border-purple-500/10">
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <CheckCircle className="h-5 w-5" />
                Pending Verification Session
              </CardTitle>
              <CardDescription>
                Worker submissions waiting for your admin review and approval.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {tasksLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : pendingSubmissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mb-2 opacity-20" />
                  <p>All clear! No worker submissions to review.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {pendingSubmissions.map(task => (
                    <div
                      key={task.id}
                      className="p-4 hover:bg-muted/50 cursor-pointer flex items-center justify-between transition-colors"
                      onClick={() => setSelectedTask(task)}
                    >
                      <div>
                        <p className="font-medium text-sm">{task.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {task.description?.replace(/\[REVIEW_REQUEST\]/g, '') || "No details provided"}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20 shrink-0">
                        In Review
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <PerformanceChart />
          <TeamPerformance />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <ProjectProgress />

          {/* User Distribution */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div
                  onClick={() => setSelectedUserCategory('admins')}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-sm">Administrators</span>
                  </div>
                  <span className="font-medium">{adminsCount}</span>
                </div>
                <div
                  onClick={() => setSelectedUserCategory('officers')}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-accent" />
                    <span className="text-sm">Officers</span>
                  </div>
                  <span className="font-medium">{officersCount}</span>
                </div>
                <div
                  onClick={() => setSelectedUserCategory('staff')}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                    <span className="text-sm">Staff</span>
                  </div>
                  <span className="font-medium">{staffCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Departments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Departments
              </CardTitle>
              <Link to="/admin">
                <Button variant="ghost" size="sm" className="gap-2 text-primary">
                  Manage <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {deptsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : departments?.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No departments yet</p>
              ) : (
                <div className="space-y-3">
                  {departments?.slice(0, 5).map(dept => (
                    <div key={dept.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">{dept.name}</p>
                        <p className="text-xs text-muted-foreground">{dept.description || 'No description'}</p>
                      </div>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <TaskDetailDialog
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
      />

      {/* User Category Modal */}
      <Dialog open={!!selectedUserCategory} onOpenChange={(open) => !open && setSelectedUserCategory(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="capitalize">
              {selectedUserCategory === 'admins' ? 'Administrators' : selectedUserCategory}
            </DialogTitle>
            <DialogDescription>
              Viewing all active {selectedUserCategory} registered in the system.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[300px] w-full mt-4 pr-4">
            <div className="space-y-4">
              {selectedUsersList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No users found in this category.
                </div>
              ) : (
                selectedUsersList.map((u) => {
                  const initials = u.full_name
                    ?.split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2) || u.email?.substring(0, 2).toUpperCase();

                  return (
                    <div key={u.id} className="flex items-center gap-3 bg-muted/30 p-2 rounded-lg border border-border/50">
                      <Avatar className="h-9 w-9 border">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium leading-none truncate">{u.full_name || 'Unnamed User'}</p>
                        <p className="text-xs text-muted-foreground truncate mt-1">{u.email}</p>
                      </div>
                      <div className="ml-auto">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize h-5">
                          {u.role?.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
