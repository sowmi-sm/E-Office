import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Target, Activity, Loader2, Mail, Briefcase } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getRoleLabel } from '@/contexts/AuthContext';

interface UserDetailDialogProps {
    user: {
        id: string;
        full_name: string | null;
        email: string;
        role?: string | null;
    } | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function UserDetailDialog({ user, open, onOpenChange }: UserDetailDialogProps) {
    const { data, isLoading } = useQuery({
        queryKey: ['user-details', user?.id],
        queryFn: async () => {
            if (!user?.id) return { tasks: [], kpis: [] };

            // Get assigned tasks
            const { data: tasks } = await supabase
                .from('tasks')
                .select('*')
                .eq('assigned_to', user.id);

            // Get user KPIs
            const { data: kpis } = await supabase
                .from('user_kpis')
                .select('*')
                .eq('user_id', user.id);

            return {
                tasks: tasks || [],
                kpis: kpis || [],
            };
        },
        enabled: !!user?.id && open,
    });

    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle className="text-xl">{user.full_name || 'Unnamed Employee'}</DialogTitle>
                    <DialogDescription className="flex items-center gap-2 mt-2">
                        <Mail className="h-4 w-4" /> {user.email}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center gap-2 mb-2">
                    {user.role && (
                        <Badge variant="secondary" className="gap-1">
                            <Briefcase className="h-3 w-3" />
                            {getRoleLabel(user.role as any)}
                        </Badge>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-6 mt-2">
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            <Card>
                                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                    <FileText className="h-6 w-6 text-primary mb-2" />
                                    <div className="text-2xl font-bold">{data?.tasks?.length || 0}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Total Tasks</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                    <Target className="h-6 w-6 text-accent mb-2" />
                                    <div className="text-2xl font-bold">{data?.tasks?.filter(t => t.status === 'completed').length || 0}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Tasks Completed</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                    <Activity className="h-6 w-6 text-warning mb-2" />
                                    <div className="text-2xl font-bold">{data?.kpis?.length || 0}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Active KPIs</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* In-progress tasks preview */}
                        {data?.tasks && data.tasks.filter(t => t.status !== 'completed').length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-foreground">Pending Tasks</h4>
                                <div className="flex flex-col gap-2">
                                    {data.tasks.filter(t => t.status !== 'completed').slice(0, 3).map((task) => (
                                        <div key={task.id} className="text-sm text-card-foreground border rounded-lg p-3 bg-card flex justify-between items-center">
                                            <span className="font-medium truncate mr-2">{task.title}</span>
                                            <Badge variant="outline" className="text-xs h-6">{task.status.replace('_', ' ')}</Badge>
                                        </div>
                                    ))}
                                    {data.tasks.filter(t => t.status !== 'completed').length > 3 && (
                                        <p className="text-xs text-muted-foreground ml-1">
                                            +{data.tasks.filter(t => t.status !== 'completed').length - 3} more pending tasks
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
