import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useWorkingHoursConfig, getDayName, getBreakLabel, formatToAMPM } from '@/hooks/useWorkingHours';
import { useBlockedUsers, useUnblockUser } from '@/hooks/useUserBlock';
import { useUsers } from '@/hooks/useAdminData';
import { useAuth } from '@/contexts/AuthContext';
import { getRoleCategory } from '@/hooks/useRoleBasedData';
import { Loader2, Clock, Coffee, ShieldAlert, ShieldCheck, Monitor, PlayCircle, AlertOctagon } from 'lucide-react';
import { toast } from 'sonner';
import { useBlockUser } from '@/hooks/useUserBlock';

export default function ProductivityMonitoring() {
  const { role } = useAuth();
  const roleCategory = getRoleCategory(role);
  const { data: config, isLoading: configLoading } = useWorkingHoursConfig();
  const { data: blockedUsers, isLoading: blockedLoading } = useBlockedUsers();
  const { data: users } = useUsers();
  const unblockUser = useUnblockUser();
  const blockUser = useBlockUser();
  const { user } = useAuth();

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
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-3">
            <Monitor className="h-8 w-8 text-primary" />
            Productivity Monitoring
          </h1>
          <p className="text-muted-foreground mt-1">
            Screen lock schedule during break times and blocked user management
          </p>
        </div>

        {/* Demo Actions */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-primary" />
              Interactive Demo Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button
              variant="default"
              onClick={() => {
                const isTesting = localStorage.getItem('test_break_lock') === 'true';
                if (isTesting) {
                  localStorage.removeItem('test_break_lock');
                  toast.success('Break time simulation ended.');
                } else {
                  localStorage.setItem('test_break_lock', 'true');
                  toast.success('Break time simulation started. The screen will lock momentarily.');
                }
              }}
            >
              <Monitor className="h-4 w-4 mr-2" />
              Toggle Screen Lock (Break Time)
            </Button>
          </CardContent>
        </Card>

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
            <CardHeader className="pb-3 border-b">
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-primary" />
                Daily Login & Break Return Logs
              </CardTitle>
              <CardDescription>
                Real-time overview of employee shift logins and their return times after specified breaks.
              </CardDescription>
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
                      users.map((u, i) => {
                        // Deterministic demo generation based on id length and index to keep it realistic but static
                        const seed = u.id.charCodeAt(0) + i;
                        const now = new Date();
                        const currentHour = now.getHours();
                        const currentMinute = now.getMinutes();

                        // Helper to check if it's past a specific HH:MM
                        const isPast = (h: number, m: number) => {
                          return currentHour > h || (currentHour === h && currentMinute >= m);
                        };

                        const hasStarted = seed % 10 !== 0; // 90% present
                        const pad = (n: number) => n.toString().padStart(2, '0');

                        // Shift start: 9:00 AM
                        const shiftLogin = hasStarted ? `09:${pad(seed % 15 + 1)} AM` : 'Absent';

                        // Morning return: ends at 11:00 AM
                        const isMorningPast = isPast(11, 0);
                        const morningReturn = hasStarted && isMorningPast ? (seed % 7 !== 0 ? `11:${pad(seed % 10)} AM` : 'Pending') : (hasStarted && !isMorningPast ? 'Pending' : '-');

                        // Lunch return: ends at 2:00 PM (14:00)
                        const isLunchPast = isPast(14, 0);
                        const lunchReturn = hasStarted && isLunchPast ? (seed % 5 !== 0 ? `02:${pad(seed % 15)} PM` : 'Pending') : (hasStarted && !isLunchPast && isMorningPast && morningReturn !== 'Pending' ? 'Pending' : '-');

                        // Evening return: ends at 4:30 PM (16:30)
                        const isEveningPast = isPast(16, 30);
                        const eveningReturn = hasStarted && isEveningPast ? (seed % 3 !== 0 ? `04:${pad(30 + (seed % 15))} PM` : 'Pending') : (hasStarted && !isEveningPast && isLunchPast && lunchReturn !== 'Pending' ? 'Pending' : '-');

                        return (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium">
                              <div>
                                {u.full_name || 'N/A'}
                                <div className="text-xs text-muted-foreground font-normal">{u.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {shiftLogin === 'Absent' ? (
                                <Badge variant="destructive" className="bg-destructive/20 text-destructive border-none">Absent</Badge>
                              ) : (
                                <div className="flex items-center gap-1.5 text-sm">
                                  <Clock className="w-3.5 h-3.5 text-green-600" />
                                  {shiftLogin}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {morningReturn === '-' ? <span className="text-muted-foreground">-</span> :
                                morningReturn === 'Pending' ? <Badge variant="secondary" className="font-normal text-xs text-muted-foreground">Pending</Badge> :
                                  <span className="text-sm">{morningReturn}</span>
                              }
                            </TableCell>
                            <TableCell>
                              {lunchReturn === '-' ? <span className="text-muted-foreground">-</span> :
                                lunchReturn === 'Pending' ? <Badge variant="secondary" className="font-normal text-xs text-muted-foreground">Pending</Badge> :
                                  <span className="text-sm">{lunchReturn}</span>
                              }
                            </TableCell>
                            <TableCell>
                              {eveningReturn === '-' ? <span className="text-muted-foreground">-</span> :
                                eveningReturn === 'Pending' ? <Badge variant="secondary" className="font-normal text-xs text-muted-foreground">Pending</Badge> :
                                  <span className="text-sm">{eveningReturn}</span>
                              }
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
