import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { TeamPerformance } from '@/components/dashboard/TeamPerformance';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Calendar, TrendingUp, Users, Target, CheckSquare, Loader2 } from 'lucide-react';
import { useDashboardStats } from '@/hooks/useRoleBasedData';
import { useUsers } from '@/hooks/useAdminData';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  const handleExportReport = () => {
    toast.info('Generating PDF report...', { id: 'report-gen' });

    try {
      const doc = new jsPDF();

      // Header Section
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text("E-Office PMS - Analytics Report", 14, 22);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 30);
      doc.text(`Fiscal Year: 2024-25`, 14, 35);

      // Divider
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 40, 196, 40);

      // High-Level Statistics Grid
      doc.setFontSize(14);
      doc.setTextColor(60, 60, 60);
      doc.text("Executive Summary", 14, 50);

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
        headStyles: { fillColor: [51, 122, 183] }, // Matches brand primary
      });

      // Departmental Performance Highlights
      const finalY = (doc as any).lastAutoTable.finalY || 100;

      doc.setFontSize(14);
      doc.text("Department Performance Highlights", 14, finalY + 15);

      autoTable(doc, {
        startY: finalY + 20,
        head: [['Category', 'Department', 'Metric Note']],
        body: [
          ['Top Performer', 'Technical Division', 'Score: 92%'],
          ['Most Improved', 'Administration', '+15% this quarter'],
          ['Needs Attention', 'Field Operations', 'Below target by 8%']
        ],
        theme: 'striped',
        headStyles: { fillColor: [100, 116, 139] }, // Matches brand secondary
      });

      // Footer
      const pageCount = (doc.internal as any).getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Internal E-Office Use Only. Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
      }

      // Download payload
      doc.save(`EOffice-Analytics-Report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Report successfully downloaded!', { id: 'report-gen' });

    } catch (err) {
      console.error(err);
      toast.error('Failed to generate the PDF file.', { id: 'report-gen' });
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
            <Button variant="accent" className="gap-2" onClick={handleExportReport}>
              <Download className="h-4 w-4" />
              Export Report
            </Button>
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
