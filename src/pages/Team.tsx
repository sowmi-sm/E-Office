import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TeamPerformance } from '@/components/dashboard/TeamPerformance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, Loader2, Edit2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useTeams, useTeamMembers, getRoleCategory, Team as TeamType } from '@/hooks/useRoleBasedData';
import { useUsers } from '@/hooks/useAdminData';
import { useAuth, getRoleLabel } from '@/contexts/AuthContext';
import { UserDetailDialog } from '@/components/dashboard/UserDetailDialog';
import { TeamDialog } from '@/components/admin/TeamDialog';
import { TeamDetailDialog } from '@/components/dashboard/TeamDetailDialog';
import { useState } from 'react';

export default function Team() {
  const { role } = useAuth();
  const roleCategory = getRoleCategory(role);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamType | null>(null);
  const [selectedTeamForView, setSelectedTeamForView] = useState<TeamType | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data: teams, isLoading: teamsLoading } = useTeams();
  const { data: teamMembers, isLoading: membersLoading } = useTeamMembers();
  const { data: users, isLoading: usersLoading } = useUsers();

  const isLoading = teamsLoading || membersLoading || usersLoading;

  // Get user info by ID
  const getUserInfo = (userId: string) => {
    const user = users?.find(u => u.id === userId);
    return {
      name: user?.full_name || user?.email?.split('@')[0] || 'Unknown',
      email: user?.email || '',
      role: user?.role,
      employee_id: user?.employee_id,
    };
  };

  const handleAddTeam = () => {
    setEditingTeam(null);
    setIsDialogOpen(true);
  };

  const handleEditTeam = (e: React.MouseEvent, team: TeamType) => {
    e.stopPropagation();
    setEditingTeam(team);
    setIsDialogOpen(true);
  };

  const handleTeamClick = (team: TeamType) => {
    setSelectedTeamForView(team);
    setIsDetailOpen(true);
  };

  // Get team name by ID
  const getTeamName = (teamId: string) => {
    const team = teams?.find(t => t.id === teamId);
    return team?.name || 'Unknown Team';
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Team</h1>
            <p className="text-muted-foreground mt-1">
              {roleCategory === 'staff'
                ? 'View your team members'
                : 'Manage and monitor team performance'}
            </p>
          </div>
          {roleCategory === 'admin' && (
            <div className="flex items-center gap-3">
              <Button variant="accent" className="gap-2" onClick={handleAddTeam}>
                <Plus className="h-4 w-4" />
                Add Team
              </Button>
            </div>
          )}
        </div>

        <TeamPerformance />

        {/* Teams Section */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Teams</h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : teams?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No teams found</p>
                {roleCategory === 'admin' && (
                  <p className="text-sm text-muted-foreground mt-1">Create teams to organize your workforce</p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams?.map((team, index) => {
                const members = teamMembers?.filter(m => m.team_id === team.id) || [];

                return (
                  <Card
                    key={team.id}
                    className="group animate-slide-up cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-primary/10 hover:border-primary/30"
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => handleTeamClick(team)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2 group-hover:text-primary transition-colors">
                          <Users className="h-5 w-5 text-primary" />
                          {team.name}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          {roleCategory === 'admin' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              onClick={(e) => handleEditTeam(e, team)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Badge variant="secondary" className="group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            {members.length} members
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {team.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{team.description}</p>
                      )}

                      {/* Team Members Preview */}
                      <div className="space-y-2">
                        {(() => {
                          const validMembers = members
                            .map(m => ({ ...m, info: getUserInfo(m.user_id) }))
                            .filter(m => m.info.name !== 'Unknown');

                          return (
                            <>
                              {validMembers.slice(0, 3).map(member => (
                                <div
                                  key={member.id}
                                  className="flex items-center gap-2 cursor-pointer hover:bg-muted p-1 rounded-md transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedUser({
                                      id: member.user_id,
                                      full_name: member.info.name,
                                      email: member.info.email,
                                      role: member.info.role
                                    });
                                  }}
                                >
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                      {member.info.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm truncate">{member.info.name}</span>
                                </div>
                              ))}
                              {validMembers.length > 3 && (
                                <p className="text-xs text-muted-foreground pl-8">+{validMembers.length - 3} more</p>
                              )}
                              {validMembers.length === 0 && (
                                <p className="text-sm text-muted-foreground">No members yet</p>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* All Users Section (for officers/admins) */}
        {roleCategory !== 'staff' && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">All Staff</h2>
            {usersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users?.map((user, index) => (
                  <Card
                    key={user.id}
                    className="animate-slide-up cursor-pointer hover:shadow-md transition-shadow hover:bg-muted/50 border-primary/5 hover:border-primary/20"
                    style={{ animationDelay: `${index * 30}ms` }}
                    onClick={() => setSelectedUser(user)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {(user.full_name || user.email || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate flex items-center gap-2">
                            {user.full_name || user.email?.split('@')[0] || 'Unknown'}
                            {user.employee_id && (
                              <span className="text-[10px] font-mono bg-primary/5 text-primary px-1.5 py-0.5 rounded border border-primary/10">
                                {user.employee_id}
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                        </div>
                        {user.role && (
                          <Badge variant="secondary" className="shrink-0">
                            {getRoleLabel(user.role)}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <UserDetailDialog
        user={selectedUser}
        open={!!selectedUser}
        onOpenChange={(open) => {
          if (!open) setSelectedUser(null);
        }}
      />

      <TeamDialog
        team={editingTeam}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />

      <TeamDetailDialog
        team={selectedTeamForView}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </DashboardLayout>
  );
}


