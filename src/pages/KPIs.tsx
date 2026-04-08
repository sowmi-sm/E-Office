import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Filter, Target, Loader2 } from 'lucide-react';
import { useAuth, getRoleLabel } from '@/contexts/AuthContext';
import { useUserKPIs, useMyKPIs, getRoleCategory } from '@/hooks/useRoleBasedData';
import { useKPITemplates } from '@/hooks/useAdminData';
import { KPIDetailDialog } from '@/components/dashboard/KPIDetailDialog';

export default function KPIs() {
  const { role } = useAuth();
  const roleCategory = getRoleCategory(role);
  const [selectedKPI, setSelectedKPI] = useState<any>(null);
  const [selectedTemplateName, setSelectedTemplateName] = useState('');
  
  const { data: allKPIs, isLoading: allKPIsLoading } = useUserKPIs();
  const { data: myKPIs, isLoading: myKPIsLoading } = useMyKPIs();
  const { data: templates } = useKPITemplates();
  
  const isAdmin = role === 'admin';
  const isLoading = isAdmin ? allKPIsLoading : myKPIsLoading;
  const kpis = isAdmin ? allKPIs : myKPIs;

  const getTemplateName = (templateId: string | null) => {
    if (!templateId) return 'Custom KPI';
    const template = templates?.find(t => t.id === templateId);
    return template?.name || 'KPI Metric';
  };

  const groupedKPIs = isAdmin ? kpis?.reduce((acc: any, kpi: any) => {
    const key = kpi.kpi_template_id || 'custom';
    if (!acc[key]) {
      acc[key] = { 
        ...kpi, 
        templateName: getTemplateName(kpi.kpi_template_id),
        individualCompletions: [] 
      };
    }
    acc[key].individualCompletions.push({
      id: kpi.id,
      userId: kpi.user_id,
      name: kpi.profiles?.full_name || 'Staff Member',
      current: kpi.current_value,
      target: kpi.target_value,
      progress: kpi.target_value > 0 ? Math.round((kpi.current_value / kpi.target_value) * 100) : 0,
      status: kpi.status
    });
    return acc;
  }, {}) : null;

  const displayKPIs = isAdmin ? Object.values(groupedKPIs || {}) : kpis;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              {isAdmin ? 'All KPIs' : 'My KPIs'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isAdmin 
                ? 'Monitor organizational targets across all team members'
                : `Track your key performance indicators as ${role ? getRoleLabel(role) : 'User'}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : displayKPIs?.length === 0 ? (
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No KPIs found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {isAdmin ? 'Assign KPIs to team members to start tracking' : 'KPIs will appear here once assigned'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(displayKPIs as any[])?.map((group: any, index: number) => {
              const name = isAdmin ? group.templateName : getTemplateName(group.kpi_template_id);
              
              const statusColors = {
                on_track: 'default',
                exceeded: 'default',
                at_risk: 'secondary',
                behind: 'destructive',
              } as const;

              return (
                <Card 
                  key={isAdmin ? group.kpi_template_id : group.id} 
                  className="animate-slide-up hover:shadow-sm transition-shadow border-l-4 border-l-primary" 
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardHeader className="pb-3 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Target className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{name}</CardTitle>
                          {isAdmin && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Assigned to {group.individualCompletions.length} staff members
                            </p>
                          )}
                        </div>
                      </div>
                      {!isAdmin && (
                        <Badge variant={statusColors[group.status as keyof typeof statusColors] || 'outline'}>
                          {group.status.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {isAdmin ? (
                      <div className="space-y-4">
                        {group.individualCompletions.map((ind: any) => (
                          <div key={ind.id} className="space-y-2 p-3 rounded-lg border border-border bg-card/50">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                                  {ind.name.split(' ').map((n:any)=>n[0]).join('')}
                                </div>
                                <span className="font-medium">{ind.name}</span>
                              </div>
                              <Badge variant="outline" className="text-[10px] scale-90">
                                {ind.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-[11px] text-muted-foreground">
                                <span>Progress</span>
                                <span>{ind.current} / {ind.target} ({ind.progress}%)</span>
                              </div>
                              <Progress value={Math.min(ind.progress, 100)} className="h-1.5" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Overall Progress</span>
                            <span className="font-semibold text-primary">{Math.min(group.current_value / group.target_value * 100, 100)}%</span>
                          </div>
                          <Progress value={Math.min(group.current_value / group.target_value * 100, 100)} className="h-2.5" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm bg-muted/50 p-4 rounded-xl">
                          <div>
                            <p className="text-muted-foreground mb-1">Current Value</p>
                            <p className="text-lg font-bold">{group.current_value}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Target Value</p>
                            <p className="text-lg font-bold">{group.target_value}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-4 border-t border-border flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Cycle: {new Date(group.period_start).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                      </p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs h-8 text-primary hover:text-primary hover:bg-primary/5"
                        onClick={() => { setSelectedKPI(isAdmin ? group.individualCompletions[0] : group); setSelectedTemplateName(name); }}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <KPIDetailDialog
        kpi={selectedKPI}
        templateName={selectedTemplateName}
        open={!!selectedKPI}
        onOpenChange={(open) => !open && setSelectedKPI(null)}
      />
    </DashboardLayout>
  );
}
