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

interface KPICardProps {
  group: any;
  isAdmin: boolean;
  getTemplateName: (id: string | null) => string;
  onSelect: (kpi: any, name: string) => void;
  index: number;
}

function KPICard({ group, isAdmin, getTemplateName, onSelect, index }: KPICardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const name = isAdmin ? group.templateName : getTemplateName(group.kpi_template_id);

  const statusColors = {
    on_track: 'default',
    exceeded: 'default',
    at_risk: 'secondary',
    behind: 'destructive',
  } as const;

  // Calculate overall group progress for admin summary
  const totalTarget = group.individualCompletions?.reduce((sum: number, ind: any) => sum + ind.target, 0) || 1;
  const totalCurrent = group.individualCompletions?.reduce((sum: number, ind: any) => sum + ind.current, 0) || 0;
  const overallProgress = Math.round((totalCurrent / totalTarget) * 100);

  return (
    <Card 
      className="animate-slide-up hover:shadow-md transition-all duration-300 border-l-4 border-l-primary overflow-hidden" 
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <CardHeader 
        className="pb-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => isAdmin ? setIsExpanded(!isExpanded) : onSelect(group, name)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{name}</CardTitle>
              {isAdmin && (
                <p className="text-xs text-muted-foreground mt-0.5 font-medium flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Monitoring {group.individualCompletions.length} staff members
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isAdmin ? (
              <Badge variant={statusColors[group.status as keyof typeof statusColors] || 'outline'}>
                {group.status.replace('_', ' ')}
              </Badge>
            ) : (
              <div className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                {overallProgress}% Total
              </div>
            )}
            {isAdmin && (
              <div className={`p-1 rounded-full bg-background border transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                <Filter className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {isAdmin ? (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">Organizational Progress</span>
                <span className="font-bold text-primary">{totalCurrent} / {totalTarget} target achieved</span>
              </div>
              <Progress value={Math.min(overallProgress, 100)} className="h-2 rounded-full shadow-inner" />
              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="bg-muted/50 p-2 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Staff</p>
                  <p className="text-sm font-bold">{group.individualCompletions.length}</p>
                </div>
                <div className="bg-muted/50 p-2 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Cycle</p>
                  <p className="text-sm font-bold">April '26</p>
                </div>
                <div className="bg-muted/50 p-2 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Active</p>
                  <p className="text-sm font-bold text-green-600">Yes</p>
                </div>
              </div>
            </div>

            {isExpanded && (
              <div className="space-y-4 pt-4 border-t border-dashed border-border animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Individual Staff Breakdown</p>
                <div className="grid gap-3">
                  {group.individualCompletions.map((ind: any) => (
                    <div key={ind.id} className="group space-y-2 p-3 rounded-lg border border-border bg-card/50 hover:border-primary/30 hover:bg-primary/5 transition-all">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary group-hover:scale-110 transition-transform">
                            {ind.name.split(' ').map((n:any)=>n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-bold text-foreground leading-none">{ind.name}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">Last activity: Just now</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-[10px] font-bold ${ind.status === 'behind' ? 'text-destructive border-destructive/20 bg-destructive/5' : ''}`}>
                          {ind.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] text-muted-foreground">
                          <span className="font-medium">Performance Score</span>
                          <span className="font-bold">{ind.current} / {ind.target} ({ind.progress}%)</span>
                        </div>
                        <Progress value={Math.min(ind.progress, 100)} className="h-1.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {!isExpanded && (
              <Button 
                variant="ghost" 
                className="w-full text-xs text-primary h-9 gap-2 hover:bg-primary/5 border border-dashed border-primary/20"
                onClick={() => setIsExpanded(true)}
              >
                <Filter className="h-3 w-3" />
                Click card to view individual staff details
              </Button>
            )}
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
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
            Period: {new Date(group.period_start).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </p>
          <Button 
            variant="link" 
            size="sm" 
            className="text-xs h-8 text-primary font-bold p-0"
            onClick={() => onSelect(isAdmin ? group.individualCompletions[0] : group, name)}
          >
            Detailed Analytics
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

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
            {(displayKPIs as any[])?.map((group: any, index: number) => (
              <KPICard 
                key={isAdmin ? (group.kpi_template_id || index) : group.id}
                group={group}
                isAdmin={isAdmin}
                getTemplateName={getTemplateName}
                onSelect={(kpi, name) => {
                  setSelectedKPI(kpi);
                  setSelectedTemplateName(name);
                }}
                index={index}
              />
            ))}
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
