import { StatCard } from '@/components/dashboard/StatCard';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { TeamPerformance } from '@/components/dashboard/TeamPerformance';
import { ProjectProgress } from '@/components/dashboard/ProjectProgress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, getRoleLabel } from '@/contexts/AuthContext';
import { useDashboardStats, useTasks, useProjects, useTeams } from '@/hooks/useRoleBasedData';
import { Loader2, Target, CheckSquare, Users, FolderKanban, TrendingUp, ArrowRight, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

export function OfficerDashboard() {
  const navigate = useNavigate();
  const { profile, role } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: teams, isLoading: teamsLoading } = useTeams();

  const displayName = profile?.full_name || profile?.email?.split('@')[0] || 'User';

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="animate-slide-up">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Welcome back, {displayName.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">
            {role && getRoleLabel(role)} Dashboard •{' '}
            {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="accent" className="gap-2" onClick={() => navigate('/performance')}>
            <TrendingUp className="h-4 w-4" />
            Review Performance
          </Button>
        </div>
      </div>

      {/* Stats Grid - Team Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Team Performance"
          value={`${stats?.performance.avgScore || 0}%`}
          subtitle="Average score"
          icon={TrendingUp}
          variant="primary"
        />
        <StatCard
          title="Active Projects"
          value={stats?.projects.active || 0}
          subtitle={`${stats?.projects.avgProgress || 0}% avg progress`}
          icon={FolderKanban}
          variant="default"
        />
        <StatCard
          title="Team Tasks"
          value={stats?.tasks.total || 0}
          subtitle={`${stats?.tasks.completed || 0} completed`}
          icon={CheckSquare}
          variant="default"
        />
        <StatCard
          title="Team KPIs"
          value={stats?.kpis.total || 0}
          subtitle={`${stats?.kpis.percentage || 0}% on track`}
          icon={Target}
          variant="accent"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="xl:col-span-2 space-y-6">
          <PerformanceChart />
          <TeamPerformance />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <ProjectProgress />

          {/* Teams Overview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Teams
              </CardTitle>
              <Button variant="ghost" size="sm" className="gap-2 text-primary">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {teamsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : teams?.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No teams yet</p>
              ) : (
                <div className="space-y-3">
                  {teams?.slice(0, 5).map(team => (
                    <div key={team.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">{team.name}</p>
                        <p className="text-xs text-muted-foreground">{team.description || 'No description'}</p>
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

      {/* Recent Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Tasks</CardTitle>
            <p className="text-sm text-muted-foreground">All team tasks across projects</p>
          </div>
          <Button variant="ghost" className="gap-2 text-primary">
            View All <ArrowRight className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {tasksLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : tasks?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No tasks yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Task</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Priority</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks?.slice(0, 8).map(task => (
                    <tr key={task.id} className="border-b last:border-0">
                      <td className="py-3 px-2">
                        <p className="font-medium text-sm">{task.title}</p>
                      </td>
                      <td className="py-3 px-2">
                        <Badge
                          variant={task.priority === 'critical' ? 'destructive' :
                            task.priority === 'high' ? 'default' : 'secondary'}
                        >
                          {task.priority}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Badge
                          variant={task.status === 'completed' ? 'default' :
                            task.status === 'overdue' ? 'destructive' : 'outline'}
                        >
                          {task.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-sm text-muted-foreground">
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
