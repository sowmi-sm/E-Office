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
  
  const isLoading = roleCategory === 'staff' ? myKPIsLoading : allKPIsLoading;
  const kpis = roleCategory === 'staff' ? myKPIs : allKPIs;

  const getTemplateName = (templateId: string | null) => {
    if (!templateId) return 'Custom KPI';
    const template = templates?.find(t => t.id === templateId);
    return template?.name || 'KPI Metric';
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              {roleCategory === 'staff' ? 'My KPIs' : 'All KPIs'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {roleCategory === 'staff' 
                ? `Track your key performance indicators as ${role ? getRoleLabel(role) : 'User'}`
                : 'Monitor all team and organizational KPIs'}
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
        ) : kpis?.length === 0 ? (
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No KPIs found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {roleCategory === 'staff' 
                ? 'KPIs will appear here once assigned by your supervisor' 
                : 'Assign KPIs to team members to start tracking'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpis?.map((kpi, index) => {
              const progress = kpi.target_value > 0 
                ? Math.round((kpi.current_value / kpi.target_value) * 100) 
                : 0;
              const statusColors = {
                on_track: 'default',
                exceeded: 'default',
                at_risk: 'secondary',
                behind: 'destructive',
              } as const;
              const name = getTemplateName(kpi.kpi_template_id);

              return (
                <Card 
                  key={kpi.id} 
                  className="animate-slide-up hover:shadow-md transition-shadow cursor-pointer" 
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => { setSelectedKPI(kpi); setSelectedTemplateName(name); }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">{name}</CardTitle>
                      </div>
                      <Badge variant={statusColors[kpi.status as keyof typeof statusColors] || 'outline'}>
                        {kpi.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{Math.min(progress, 100)}%</span>
                      </div>
                      <Progress value={Math.min(progress, 100)} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Current</p>
                        <p className="font-medium">{kpi.current_value}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Target</p>
                        <p className="font-medium">{kpi.target_value}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Period: {new Date(kpi.period_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {new Date(kpi.period_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
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
