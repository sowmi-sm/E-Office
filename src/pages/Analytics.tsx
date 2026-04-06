import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { TeamPerformance } from '@/components/dashboard/TeamPerformance';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Calendar, TrendingUp, Users, Target, CheckSquare, Loader2, FileText } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useRoleBasedData';
import { useUsers } from '@/hooks/useAdminData';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { downloadCSV } from '@/utils/exportUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Analytics() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: employees, isLoading: employeesLoading } = useUsers();

  if (statsLoading || employeesLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  const handleExportCSV = () => {
    if (!stats || !employees) return;

    const data = [
      ['System Productivity', `${stats.performance.avgScore}%`, 'Overall Average'],
      ['Total Active Members', employees.length.toString(), 'Registered Personnel'],
      ['Tasks Completed', stats.tasks.completed.toString(), 'Processed Deliverables'],
      ['Total Tasks', stats.tasks.total.toString(), 'All Assignments'],
      ['Active KPIs', stats.kpis.total.toString(), 'On Target Monitoring'],
      ['KPIs On Track', stats.kpis.onTrack.toString(), 'Target Achievement'],
      ['Top Performer', 'Technical Division', 'Score: 92%'],
      ['Most Improved', 'Administration', '+15% this quarter'],
      ['Needs Attention', 'Field Operations', 'Below target by 8%']
    ];

    downloadCSV(data, ['Metric', 'Value', 'Status/Note'], 'E-Office_Analytics_Summary');
    toast.success('CSV Report downloaded successfully');
  };

  const handleExportReport = () => {
    toast.info('Generating PDF report...', { id: 'report-gen' });

    try {
      const doc = new jsPDF();
      // (PDF logic stays the same)
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text("E-Office PMS - Analytics Report", 14, 22);
      
      const productivityScore = stats?.performance?.avgScore ? `${stats.performance.avgScore}%` : "0%";
      const activeMembers = employees?.length || 0;
      const tasksCompleted = stats?.tasks?.completed || 0;
      const tasksTotal = stats?.tasks?.total || 0;
      const kpisActive = stats?.kpis?.total || 0;

      autoTable(doc, {
        startY: 55,
        head: [['Metric', 'Value', 'Status']],
        body: [
          ['System Productivity', productivityScore, 'Overall Average'],
          ['Total Active Members', activeMembers.toString(), 'Registered Personnel'],
          ['Task Completion Velocity', `${tasksCompleted} / ${tasksTotal}`, 'Processed Deliverables'],
          ['Active Tracked KPIs', kpisActive.toString(), 'On Target Monitoring']
        ],
        theme: 'grid',
        headStyles: { fillColor: [51, 122, 183] },
      });

      doc.save(`EOffice-Analytics-Report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF downloaded successfully!', { id: 'report-gen' });
    } catch (err) {
      toast.error('Failed to generate PDF.', { id: 'report-gen' });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Organization-wide performance insights and trends
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2" onClick={() => toast.info('Filtering analytics by FY 2024-25...')}>
              <Calendar className="h-4 w-4" />
              FY 2024-25
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="accent" className="gap-2 shadow-md hover:scale-[1.02] transition-transform">
                  <Download className="h-4 w-4" />
                  Export Data
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Export Formats</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportReport} className="cursor-pointer gap-2">
                   <FileText className="h-4 w-4 text-blue-500" />
                   Download PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCSV} className="cursor-pointer gap-2 font-bold">
                   <CheckSquare className="h-4 w-4 text-green-500" />
                   Download CSV (csc)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="System Productivity"
            value={stats?.performance?.avgScore ? `${stats.performance.avgScore}%` : "0%"}
            subtitle="Overall average"
            icon={TrendingUp}
            variant="primary"
          />
          <StatCard
            title="Total Members"
            value={employees?.length || 0}
            subtitle="Currently Active"
            icon={Users}
            variant="default"
          />
          <StatCard
            title="Active KPIs"
            value={stats?.kpis?.total || 0}
            subtitle={`${stats?.kpis?.onTrack || 0} on target`}
            icon={Target}
            variant="default"
          />
          <StatCard
            title="Tasks Completed"
            value={stats?.tasks?.completed || 0}
            subtitle={`Out of ${stats?.tasks?.total || 0} total tasks`}
            icon={CheckSquare}
            variant="accent"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <PerformanceChart />
          <TeamPerformance />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Department Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Top Performer</p>
                <p className="text-lg font-semibold text-foreground">Technical Division</p>
                <p className="text-sm text-primary">Score: 92%</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Most Improved</p>
                <p className="text-lg font-semibold text-foreground">Administration</p>
                <p className="text-sm text-accent">+15% this quarter</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Needs Attention</p>
                <p className="text-lg font-semibold text-foreground">Field Operations</p>
                <p className="text-sm text-destructive">Below target by 8%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
