import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useWorkingHoursConfig, getDayName, getBreakLabel, formatToAMPM } from '@/hooks/useWorkingHours';
import { useBlockedUsers, useUnblockUser, useBlockUser } from '@/hooks/useUserBlock';
import { useUsers } from '@/hooks/useAdminData';
import { useAuth } from '@/contexts/AuthContext';
import { getRoleCategory } from '@/hooks/useRoleBasedData';
import { useNotifications, useApproveAccessRequest, useMarkNotificationRead } from '@/hooks/useNotifications';
import { useLoginLogs } from '@/hooks/useLoginLogs';
import { Loader2, Clock, Coffee, ShieldAlert, ShieldCheck, Monitor, PlayCircle, AlertOctagon, CheckCircle, MessageSquare, AlertTriangle, Send, Download, FileText, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

export default function ProductivityMonitoring() {
  const { role } = useAuth();
  const roleCategory = getRoleCategory(role);
  
  const [reportRange, setReportRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const { data: config, isLoading: configLoading } = useWorkingHoursConfig();
  const { data: blockedUsers, isLoading: blockedLoading, refetch: refetchBlocks } = useBlockedUsers();
  const { data: users, refetch: refetchUsers } = useUsers();
  const { data: notifications, refetch: refetchNotifies } = useNotifications();
  const { data: loginLogs, refetch: refetchLogs } = useLoginLogs(reportRange.start, reportRange.end);
  const approveAccess = useApproveAccessRequest();
  
  const unblockUser = useUnblockUser();
  const blockUser = useBlockUser();
  const { user, supabase } = useAuth();
  
  // Real-time synchronization for attendance logs
  useEffect(() => {
    if (!supabase) return;
    
    // Subscribe to all new login log entries
    const channel = supabase
      .channel('attendance_live_sync')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'daily_login_logs' },
        () => {
          // Immediately update the table
          refetchLogs();
          refetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, refetchLogs, refetchUsers]);

  const handleRefreshAll = () => {
    refetchBlocks();
    refetchUsers();
    refetchNotifies();
    refetchLogs();
    toast.success("Refreshing monitoring data...");
  };

  const handleExportCSV = () => {
    if (!users || !loginLogs) return;

    const headers = ["Date", "Employee Name", "Employee ID", "Shift Start", "Morning Tea Return", "Lunch Return", "Evening Tea Return"];
    const rows = [];

    // Get unique dates in the logs
    const dates = [...new Set(loginLogs.map(l => l.event_date))].sort();

    dates.forEach(date => {
      users.forEach(u => {
        const userLogs = loginLogs.filter(l => l.user_id === u.id && l.event_date === date);
        if (userLogs.length === 0) return;

        const getEvent = (type: string) => {
          const log = userLogs.find(l => l.event_type === type);
          return log ? new Date(log.logged_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Pending';
        };

        rows.push([
          date,
          u.full_name || u.email,
          u.employee_id || 'N/A',
          getEvent('shift_start'),
          getEvent('morning_tea_return'),
          getEvent('lunch_return'),
          getEvent('evening_tea_return')
        ]);
      });
    });

    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `E-Office_Attendance_${reportRange.start}_to_${reportRange.end}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Audit log exported successfully");
  };

  const accessRequests = notifications?.filter(n => {
    const isRequest = n.title === 'System Access Request' || n.title === 'Account Unblock Request';
    const isToday = new Date(n.created_at).toDateString() === new Date().toDateString();
    return isRequest && isToday && !n.is_read;
  }) || [];

  const getUserName = (userId: string) => {
    const user = users?.find(u => u.id === userId);
    return user?.full_name || user?.email || 'Unknown User';
  };

  const handleUnblock = async (userId: string) => {
    try {
      await unblockUser.mutateAsync(userId);
      toast.success('User unblocked successfully');
    } catch {
      toast.error('Failed to unblock user');
    }
  };

  // Group config by day
  const dayGroups = config?.reduce((acc, item) => {
    if (!acc[item.day_of_week]) acc[item.day_of_week] = [];
    acc[item.day_of_week].push(item);
    return acc;
  }, {} as Record<number, typeof config>) || {};

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-8 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Productivity Monitoring</h1>
          <p className="text-muted-foreground mt-1">Review active schedules, break time, and attendance records.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefreshAll}
            className="flex items-center gap-2 border-primary/20 hover:bg-primary/5 text-primary"
          >
            <PlayCircle className="h-4 w-4" />
            Refresh Monitoring
          </Button>
          <div className="hidden sm:flex items-center gap-2 rounded-full px-3 py-1 bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
            <Clock className="h-3 w-3" />
            Live Sync: Active
          </div>
        </div>
      </div>

        {/* Access Requests (Admin only) */}
        {roleCategory === 'admin' && (
          <Card className={accessRequests.length > 0 ? 'border-primary shadow-md' : 'border-border'}>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                System Access Requests
                {accessRequests.length > 0 && (
                  <Badge variant="destructive" className="ml-2 animate-pulse">
                    {accessRequests.length} Pending
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Employees requesting temporary system overrides during non-working hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              {accessRequests.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed rounded-lg bg-muted/20">
                  <ShieldCheck className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground font-medium">No pending requests</p>
                  <p className="text-xs text-muted-foreground">All access requests have been processed.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {accessRequests.map((request) => (
                    <div key={request.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border bg-primary/5 transition-colors hover:bg-primary/10">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-warning" />
                          <p className="font-bold text-foreground">Urgent Work Request</p>
                        </div>
                        <p className="text-sm text-foreground/80 font-medium">
                          {request.message}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(request.created_at).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white shadow-sm flex-shrink-0 gap-2 h-10 px-5"
                        onClick={async () => {
                          if (request.sender_id) {
                            try {
                              await approveAccess.mutateAsync({
                                senderId: request.sender_id,
                                notificationId: request.id
                              });
                              await refetchUsers();
                            } catch (e: any) {
                              toast.error(e.message || "Failed to approve access");
                            }
                          }
                        }}
                        disabled={approveAccess.isPending}
                      >
                        {approveAccess.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        Approve & Unlock
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Break Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coffee className="h-5 w-5 text-primary" />
              Break Time Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            {configLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 0].map(day => {
                  const dayConfig = dayGroups[day] || [];
                  const isWorkingDay = dayConfig.length > 0 && dayConfig[0].is_working_day;

                  return (
                    <Card key={day} className={`border ${isWorkingDay ? 'border-border' : 'border-muted bg-muted/30'}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{getDayName(day)}</CardTitle>
                          <Badge variant={isWorkingDay ? 'default' : 'secondary'}>
                            {isWorkingDay ? 'Working' : 'Off'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {isWorkingDay && dayConfig.length > 0 && (
                          <>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{formatToAMPM(dayConfig[0].work_start_time)} - {formatToAMPM(dayConfig[0].work_end_time)}</span>
                            </div>
                            <div className="space-y-1">
                              {dayConfig.map((breakItem, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs bg-accent/10 rounded p-1.5">
                                  <span className="font-medium">{getBreakLabel(breakItem.break_type)}</span>
                                  <span className="text-muted-foreground">
                                    {formatToAMPM(breakItem.break_start_time)} - {formatToAMPM(breakItem.break_end_time)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                        {!isWorkingDay && (
                          <p className="text-xs text-muted-foreground">No working hours</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* How it works */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Late Login Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border bg-muted/30">
                <p className="font-medium text-sm mb-1">Screen Lock</p>
                <p className="text-xs text-muted-foreground">
                  The system automatically locks the screen during all 3 break periods (Morning Tea, Lunch, Evening Tea) and on non-working days.
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-destructive/5">
                <p className="font-medium text-sm mb-1 text-destructive">10-Minute Grace Period</p>
                <p className="text-xs text-muted-foreground">
                  If a user logs in more than 10 minutes after their break ends, their account is automatically blocked.
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-accent/10">
                <p className="font-medium text-sm mb-1">Admin Unblock</p>
                <p className="text-xs text-muted-foreground">
                  Only administrators can unblock a blocked user account. Users must contact their admin for access restoration.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Blocked Users (Admin only) */}
        {roleCategory === 'admin' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Blocked Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              {blockedLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !blockedUsers || blockedUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No blocked users</p>
              ) : (
                <div className="space-y-3">
                  {blockedUsers.map(block => (
                    <div key={block.id} className="flex items-center justify-between p-4 rounded-lg border bg-destructive/5">
                      <div>
                        <p className="font-medium">{getUserName(block.user_id)}</p>
                        <p className="text-sm text-muted-foreground">{block.blocked_reason}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Blocked: {new Date(block.blocked_at).toLocaleString('en-IN')}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnblock(block.user_id)}
                        disabled={unblockUser.isPending}
                      >
                        {unblockUser.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Unblock'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* User Login Details */}
        {roleCategory === 'admin' && (
          <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b bg-muted/30 pb-6">
              <div className="space-y-1">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-primary" />
                  Daily Login & Break Return Logs
                </CardTitle>
                <CardDescription>
                  Monitor employee shift logins and returns across the organization.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-background border rounded-md px-2 py-1 shadow-sm">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                  <Input 
                    type="date" 
                    className="h-7 border-none bg-transparent focus-visible:ring-0 w-[130px] text-xs p-0 px-1"
                    value={reportRange.start}
                    onChange={(e) => setReportRange(prev => ({ ...prev, start: e.target.value }))}
                  />
                  <span className="text-muted-foreground text-xs font-medium">to</span>
                  <Input 
                    type="date" 
                    className="h-7 border-none bg-transparent focus-visible:ring-0 w-[130px] text-xs p-0 px-1"
                    value={reportRange.end}
                    onChange={(e) => setReportRange(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>
                <Button 
                  onClick={handleExportCSV} 
                  variant="default" 
                  size="sm" 
                  className="flex items-center gap-2 shadow-md bg-green-600 hover:bg-green-700"
                  disabled={!loginLogs || loginLogs.length === 0}
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="font-semibold text-foreground">Employee</TableHead>
                      <TableHead className="font-semibold text-foreground">Initial Login (Shift Start)</TableHead>
                      <TableHead className="font-semibold text-foreground">Post-Morning Tea</TableHead>
                      <TableHead className="font-semibold text-foreground">Post-Lunch Break</TableHead>
                      <TableHead className="font-semibold text-foreground">Post-Evening Tea</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!users || users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No active login logs found today.
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((u) => {
                        const getEventLog = (type: string) => 
                          loginLogs?.find(l => l.user_id === u.id && l.event_type === type);

                        const shiftLog = getEventLog('shift_start');
                        const morningLog = getEventLog('morning_tea_return');
                        const lunchLog = getEventLog('lunch_return');
                        const eveningLog = getEventLog('evening_tea_return');

                        const formatLog = (log: any) => 
                          log ? new Date(log.logged_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Pending';

                        const isAbsent = !shiftLog;
                        
                        return (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium">
                              <div>
                                {u.full_name || 'N/A'}
                                <div className="text-xs text-muted-foreground font-normal">{u.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {isAbsent ? (
                                <Badge variant="secondary" className="font-normal text-xs text-muted-foreground">Pending</Badge>
                              ) : (
                                <div className="flex items-center gap-1.5 text-sm">
                                  <Clock className="w-3.5 h-3.5 text-green-600" />
                                  {formatLog(shiftLog)}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {morningLog ? <span className="text-sm">{formatLog(morningLog)}</span> : 
                                <Badge variant="secondary" className="font-normal text-xs text-muted-foreground">Pending</Badge>}
                            </TableCell>
                            <TableCell>
                              {lunchLog ? <span className="text-sm">{formatLog(lunchLog)}</span> : 
                                <Badge variant="secondary" className="font-normal text-xs text-muted-foreground">Pending</Badge>}
                            </TableCell>
                            <TableCell>
                              {eveningLog ? <span className="text-sm">{formatLog(eveningLog)}</span> : 
                                <Badge variant="secondary" className="font-normal text-xs text-muted-foreground">Pending</Badge>}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
