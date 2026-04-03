import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Users, User, Building, Layout, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useTeamMembers, Team } from '@/hooks/useRoleBasedData';
import { useUsers, useDepartments } from '@/hooks/useAdminData';
import { getRoleLabel } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TeamDetailDialogProps {
    team: Team | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TeamDetailDialog({ team, open, onOpenChange }: TeamDetailDialogProps) {
    const { data: allMembers, isLoading: membersLoading } = useTeamMembers(team?.id);
    const { data: users } = useUsers();
    const { data: departments } = useDepartments();

    if (!team) return null;

    const department = departments?.find(d => d.id === team.department_id);
    const leader = users?.find(u => u.id === team.leader_id);

    const teamMembers = allMembers?.map(member => {
        const userInfo = users?.find(u => u.id === member.user_id);
        return {
            id: member.id,
            name: userInfo?.full_name || userInfo?.email?.split('@')[0] || 'Unknown User',
            email: userInfo?.email || '',
            role: userInfo?.role || '',
            employeeId: userInfo?.employee_id || '',
            joinedAt: member.joined_at
        };
    }).filter(m => m.name !== 'Unknown User') || [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
                <div className="p-6 pb-0">
                    <DialogHeader>
       W                 <div className="flex items-center gap-3 mb-2">
                            <div className="bg-primary/10 p-2 rounded-lg">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl">{team.name}</DialogTitle>
                                <DialogDescription>
                                    Team Overview & Composition
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <ScrollArea className="flex-1 px-6 py-4">
                    <div className="space-y-6">
                        {/* Team Info Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="bg-muted/30 border-none shadow-none">
                                <CardContent className="p-4 flex items-start gap-3">
                                    <div className="bg-background p-2 rounded-md shadow-sm">
                                        <Building className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-semibold">Department</p>
                                        <p className="font-medium">{department?.name || 'No department assigned'}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-muted/30 border-none shadow-none">
                                <CardContent className="p-4 flex items-start gap-3">
                                    <div className="bg-background p-2 rounded-md shadow-sm">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-semibold">Team Leader</p>
                                        <p className="font-medium">{leader?.full_name || 'No leader assigned'}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Description */}
                        {team.description && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                    <Layout className="h-4 w-4" />
                                    About Team
                                </h4>
                                <p className="text-sm text-balance leading-relaxed text-muted-foreground bg-muted/20 p-3 rounded-lg border border-dashed">
                                    {team.description}
                                </p>
                            </div>
                        )}

                        {/* Members List */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Team Members
                                </h4>
                                <Badge variant="outline">{teamMembers.length} active members</Badge>
                            </div>

                            {membersLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : teamMembers.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8 bg-muted/10 rounded-lg italic">
                                    No members have been added to this team yet.
                                </p>
                            ) : (
                                <div className="grid grid-cols-1 gap-2">
                                    {teamMembers.map((member) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                                                    <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                                                        {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-semibold flex items-center gap-2">
                                                        {member.name}
                                                        {member.employeeId && (
                                                            <span className="text-[10px] font-mono bg-primary/5 text-primary px-1.5 py-0.5 rounded border border-primary/10">
                                                                {member.employeeId}
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">{member.email}</p>
                                                </div>
                                            </div>
                                            {member.role && (
                                                <Badge variant="secondary" className="text-[10px] py-0 h-5">
                                                    {getRoleLabel(member.role as any)}
                                                </Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>

                <div className="p-4 border-t bg-muted/10 flex justify-end">
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        Created on {new Date(team.created_at).toLocaleDateString()}
                    </Badge>
                </div>
            </DialogContent>
        </Dialog>
    );
}
