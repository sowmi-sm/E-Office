import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateTeam, useUpdateTeam, Team, useTeamMembers, useAddTeamMember, useRemoveTeamMember } from '@/hooks/useRoleBasedData';
import { useDepartments, useUsers } from '@/hooks/useAdminData';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

interface TeamDialogProps {
    team: Team | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TeamDialog({ team, open, onOpenChange }: TeamDialogProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [departmentId, setDepartmentId] = useState<string>('none');
    const [leaderId, setLeaderId] = useState<string>('none');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

    const { data: departments } = useDepartments();
    const { data: users } = useUsers();
    const { data: currentMembers } = useTeamMembers(team?.id);

    const createTeam = useCreateTeam();
    const updateTeam = useUpdateTeam();
    const addMember = useAddTeamMember();
    const removeMember = useRemoveTeamMember();

    const isEditing = !!team;

    useEffect(() => {
        if (open) {
            if (team) {
                setName(team.name || '');
                setDescription(team.description || '');
                setDepartmentId(team.department_id || 'none');
                setLeaderId(team.leader_id || 'none');
            } else {
                setName('');
                setDescription('');
                setDepartmentId('none');
                setLeaderId('none');
                setSelectedMembers([]);
            }
        }
    }, [open, team]);

    useEffect(() => {
        if (currentMembers && isEditing) {
            setSelectedMembers(currentMembers.map(m => m.user_id));
        }
    }, [currentMembers, isEditing]);

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('Team name is required');
            return;
        }

        try {
            const teamData = {
                name,
                description: description || null,
                department_id: departmentId === 'none' ? null : departmentId,
                leader_id: leaderId === 'none' ? null : leaderId,
            };

            let savedTeamId = team?.id;

            if (isEditing) {
                await updateTeam.mutateAsync({ teamId: team!.id, ...teamData });
            } else {
                const newTeam = await createTeam.mutateAsync(teamData);
                savedTeamId = newTeam.id;
            }

            // Handle member additions and removals
            if (savedTeamId) {
                const membersToInvite = selectedMembers.filter(id => !currentMembers?.some(m => m.user_id === id));
                const membersToRemove = currentMembers?.filter(m => !selectedMembers.includes(m.user_id)) || [];

                for (const userId of membersToInvite) {
                    await addMember.mutateAsync({ team_id: savedTeamId, user_id: userId });
                }

                for (const member of membersToRemove) {
                    await removeMember.mutateAsync(member.id);
                }
            }

            onOpenChange(false);
        } catch (e) {
            // Error handled by mutation
        }
    };

    const toggleMember = (userId: string) => {
        setSelectedMembers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Team' : 'Create New Team'}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2 space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Team Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. Northeast Region Response Team"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Brief overview of team responsibilities..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="resize-none"
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Department</Label>
                            <Select value={departmentId} onValueChange={setDepartmentId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Department</SelectItem>
                                    {departments?.map(dept => (
                                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label>Team Leader</Label>
                            <Select value={leaderId} onValueChange={setLeaderId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select leader" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Leader</SelectItem>
                                    {users?.map(user => (
                                        <SelectItem key={user.id} value={user.id}>
                                            {user.full_name || user.email}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label>Team Members</Label>
                        <div className="border rounded-md p-4 bg-muted/20">
                            <ScrollArea className="h-48">
                                <div className="space-y-2">
                                    {users?.map(user => (
                                        <div key={user.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`user-${user.id}`}
                                                checked={selectedMembers.includes(user.id)}
                                                onCheckedChange={() => toggleMember(user.id)}
                                            />
                                            <Label
                                                htmlFor={`user-${user.id}`}
                                                className="text-sm font-normal cursor-pointer flex-1"
                                            >
                                                {user.full_name || user.email}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                </div>

                <DialogFooter className="pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        onClick={handleSave}
                        disabled={createTeam.isPending || updateTeam.isPending}
                        className="min-w-[100px]"
                    >
                        {(createTeam.isPending || updateTeam.isPending) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isEditing ? 'Update Team' : 'Create Team'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
