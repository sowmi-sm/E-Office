import { StatCard } from '@/components/dashboard/StatCard';
import { ProductivityScore } from '@/components/dashboard/ProductivityScore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useDashboardStats, useMyTasks, useMyKPIs } from '@/hooks/useRoleBasedData';
import { Loader2, Target, CheckSquare, Clock, TrendingUp, ArrowRight } from 'lucide-react';

export function StaffDashboard() {
  const { profile } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: myTasks, isLoading: tasksLoading } = useMyTasks();
  const { data: myKPIs, isLoading: kpisLoading } = useMyKPIs();

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
      <div className="animate-slide-up">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          Welcome back, {displayName.split(' ')[0]}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's your personal productivity overview for{' '}
          {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats Grid - Personal Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="My Performance"
          value={`${stats?.performance.avgScore || 0}%`}
          subtitle="Overall score"
          icon={TrendingUp}
          variant="primary"
        />
        <StatCard
          title="My KPIs"
          value={stats?.kpis.total || 0}
          subtitle={`${stats?.kpis.onTrack || 0} on track`}
          icon={Target}
          variant="default"
        />
        <StatCard
          title="My Tasks"
          value={stats?.tasks.total || 0}
          subtitle={`${stats?.tasks.overdue || 0} overdue`}
          icon={CheckSquare}
          variant="default"
        />
        <StatCard
          title="Pending Tasks"
          value={stats?.tasks.pending || 0}
          subtitle={`${stats?.tasks.inProgress || 0} in progress`}
          icon={Clock}
          variant="accent"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* My KPIs Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>My KPIs</CardTitle>
                <p className="text-sm text-muted-foreground">Track your key performance indicators</p>
              </div>
              <Button variant="ghost" className="gap-2 text-primary">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {kpisLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : myKPIs?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No KPIs assigned yet</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myKPIs?.slice(0, 6).map((kpi) => {
                    const progress = kpi.target_value > 0 ? Math.round((kpi.current_value / kpi.target_value) * 100) : 0;
                    return (
                      <div key={kpi.id} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">KPI Metric</span>
                          <Badge variant={kpi.status === 'on_track' ? 'default' : kpi.status === 'exceeded' ? 'default' : 'destructive'}>
                            {kpi.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                          <span>{kpi.current_value} / {kpi.target_value}</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={Math.min(progress, 100)} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Tasks Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>My Tasks</CardTitle>
                <p className="text-sm text-muted-foreground">Your assigned work items</p>
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
              ) : myTasks?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No tasks assigned yet</p>
              ) : (
                <div className="space-y-3">
                  {myTasks?.slice(0, 6).map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{task.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={task.priority === 'critical' ? 'destructive' : 
                                   task.priority === 'high' ? 'default' : 'secondary'}
                        >
                          {task.priority}
                        </Badge>
                        <Badge 
                          variant={task.status === 'completed' ? 'default' : 
                                   task.status === 'overdue' ? 'destructive' : 'outline'}
                        >
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <ProductivityScore />
        </div>
      </div>
    </div>
  );
}
