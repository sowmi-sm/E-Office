import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { ProductivityScore } from '@/components/dashboard/ProductivityScore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Calendar, TrendingUp, Loader2 } from 'lucide-react';
import { useAuth, getRoleLabel } from '@/contexts/AuthContext';
import { usePerformanceRecords, useMyPerformanceRecords, useDashboardStats, getRoleCategory } from '@/hooks/useRoleBasedData';
import { toast } from 'sonner';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { downloadCSV } from '@/utils/exportUtils';
import { FileText, CheckCircle } from 'lucide-react';

export default function Performance() {
  const { role, profile } = useAuth();
  const roleCategory = getRoleCategory(role);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: allRecords, isLoading: allRecordsLoading } = usePerformanceRecords();
  const { data: myRecords, isLoading: myRecordsLoading } = useMyPerformanceRecords();
  const { data: stats } = useDashboardStats();

  const isLoading = roleCategory === 'staff' ? myRecordsLoading : allRecordsLoading;
  const rawRecords = roleCategory === 'staff' ? myRecords : allRecords;

  const records = rawRecords?.filter(r => {
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });

  const handleExportCSV = () => {
    if (!records || records.length === 0) {
      toast.error('No performance records to export');
      return;
    }

    const headers = ['Employee/Subject', 'Evaluation Period', 'KPI Score (70%)', 'Feedback (30%)', 'Overall Score', 'Status'];
    const data = records.map(r => [
      profile?.full_name || profile?.email || 'Unknown',
      `${new Date(r.period_start).toLocaleDateString('en-IN')} - ${new Date(r.period_end).toLocaleDateString('en-IN')}`,
      `${r.kpi_score}%`,
      `${r.supervisor_feedback_score}%`,
      `${Math.round(r.overall_score)}%`,
      r.status.toUpperCase()
    ]);

    downloadCSV(data, headers, `E-Office_Performance_Records_${statusFilter}`);
    toast.success('CSV Report downloaded successfully');
  };

  const handleExportReport = () => {
    if (!records || records.length === 0) {
      toast.error('No performance records to export');
      return;
    }

    toast.info('Generating PDF report...', { id: 'report-gen' });

    try {
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42); 
      doc.text("Performance Report", 14, 25);
      // (Rest of PDF logic stays the same)
      const tableData = records.map(r => [
        `${new Date(r.period_start).toLocaleDateString('en-IN')} - ${new Date(r.period_end).toLocaleDateString('en-IN')}`,
        `${r.kpi_score}%`,
        `${r.supervisor_feedback_score}%`,
        `${Math.round(r.overall_score)}%`,
        r.status.toUpperCase()
      ]);

      autoTable(doc, {
        startY: 55,
        head: [['Evaluation Period', 'KPI Score (70%)', 'Feedback (30%)', 'Overall', 'Status']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
      });

      doc.save(`Performance_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Report downloaded successfully!', { id: 'report-gen' });
    } catch (err) {
      toast.error('Failed to generate report', { id: 'report-gen' });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              {roleCategory === 'staff' ? 'My Performance' : 'Performance Overview'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {roleCategory === 'staff'
                ? 'Track your performance trends and achievements'
                : 'Monitor organizational performance metrics'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  {statusFilter === 'all' ? 'All Records' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>All Records</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('approved')}>Approved Only</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('pending')}>Pending Only</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('rejected')}>Rejected Only</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="accent" className="gap-2 shadow-md hover:scale-[1.02] transition-transform" disabled={!records?.length}>
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
                   <CheckCircle className="h-4 w-4 text-green-500" />
                   Download CSV (csc)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <PerformanceChart />
          </div>
          <div>
            <ProductivityScore />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {roleCategory === 'staff' ? 'My Score' : 'Org Average'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{stats?.performance.avgScore || 0}%</p>
              <p className="text-sm text-muted-foreground">Current period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tasks Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{stats?.tasks.completed || 0}</p>
              <p className="text-sm text-muted-foreground">Total completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">KPIs On Track</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{stats?.kpis.percentage || 0}%</p>
              <p className="text-sm text-muted-foreground">{stats?.kpis.onTrack} of {stats?.kpis.total}</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Records */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : records?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No performance records yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Performance evaluations will appear here once completed
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Period</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">KPI Score (70%)</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Feedback Score (30%)</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Overall</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records?.map(record => (
                      <tr key={record.id} className="border-b last:border-0">
                        <td className="py-3 px-2">
                          <p className="font-medium text-sm">
                            {new Date(record.period_start).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} - {new Date(record.period_end).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                          </p>
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-sm">{record.kpi_score}%</span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-sm">{record.supervisor_feedback_score}%</span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="font-medium text-sm">{Math.round(record.overall_score)}%</span>
                        </td>
                        <td className="py-3 px-2">
                          <Badge
                            variant={record.status === 'approved' ? 'default' :
                              record.status === 'rejected' ? 'destructive' : 'outline'}
                          >
                            {record.status}
                          </Badge>
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
    </DashboardLayout>
  );
}
