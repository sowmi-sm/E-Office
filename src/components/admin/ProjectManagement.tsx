import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FolderKanban, Loader2, Edit2, Trash2 } from 'lucide-react';
import { useProjects, useUpdateProject, useDeleteProject, getRoleCategory } from '@/hooks/useRoleBasedData';
import { useUsers, useDepartments } from '@/hooks/useAdminData';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export function ProjectManagement() {
    const { data: projects, isLoading: projectsLoading } = useProjects();
    const { data: users, isLoading: usersLoading } = useUsers();
    const { data: departments, isLoading: deptsLoading } = useDepartments();

    const updateProject = useUpdateProject();
    const deleteProject = useDeleteProject();

    const [selectedProject, setSelectedProject] = useState<any>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const [editForm, setEditForm] = useState({
        name: '',
        description: '',
        status: '',
        manager_id: '',
        department_id: ''
    });

    if (projectsLoading || usersLoading || deptsLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    const handleEditClick = (project: any) => {
        setSelectedProject(project);
        setEditForm({
            name: project.name || '',
            description: project.description || '',
            status: project.status || 'active',
            manager_id: project.manager_id || 'none',
            department_id: project.department_id || 'none'
        });
        setIsEditDialogOpen(true);
    };

    const handleSaveEdit = () => {
        if (!editForm.name) {
            toast.error('Project name is required');
            return;
        }

        updateProject.mutate({
            projectId: selectedProject.id,
            updates: {
                name: editForm.name,
                description: editForm.description,
                status: editForm.status,
                manager_id: editForm.manager_id === 'none' ? null : editForm.manager_id,
                department_id: editForm.department_id === 'none' ? null : editForm.department_id,
            }
        }, {
            onSuccess: () => {
                setIsEditDialogOpen(false);
            }
        });
    };

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(`Are you absolutely sure you want to delete the project '${name}'? This action cannot be undone.`)) {
            deleteProject.mutate(id);
        }
    };

    const getManagerName = (managerId: string | null) => {
        if (!managerId) return 'Unassigned';
        const user = users?.find(u => u.id === managerId);
        return user ? user.full_name || user.email : 'Unknown User';
    };

    const getDepartmentName = (deptId: string | null) => {
        if (!deptId) return 'None';
        const dept = departments?.find(d => d.id === deptId);
        return dept ? dept.name : 'Unknown Dept';
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FolderKanban className="h-5 w-5" />
                        Project Directory & Delegation
                    </CardTitle>
                    <CardDescription>
                        Manage active projects, assign project managers, and re-allocate resources globally.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {projects?.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No projects found in the system.
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm">
                                    <thead className="[&_tr]:border-b">
                                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Project Name</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Manager (Delegated To)</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Department</th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Progress</th>
                                            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="[&_tr:last-child]:border-0">
                                        {projects?.map((project) => (
                                            <tr key={project.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                <td className="p-4 align-middle font-medium">
                                                    {project.name}
                                                    {project.description && (
                                                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1 font-normal max-w-[250px]">
                                                            {project.description}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="p-4 align-middle">
                                                    <Badge variant={project.status === 'completed' ? 'secondary' : project.status === 'active' ? 'default' : 'outline'}>
                                                        {project.status.replace('_', ' ')}
                                                    </Badge>
                                                </td>
                                                <td className="p-4 align-middle text-muted-foreground">
                                                    {getManagerName(project.manager_id)}
                                                </td>
                                                <td className="p-4 align-middle text-muted-foreground">
                                                    {getDepartmentName(project.department_id)}
                                                </td>
                                                <td className="p-4 align-middle text-muted-foreground">
                                                    {project.progress || 0}%
                                                </td>
                                                <td className="p-4 align-middle text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(project)}>
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" onClick={() => handleDelete(project.id, project.name)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit & Delegate Project</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Project Name</Label>
                            <Input
                                id="name"
                                value={editForm.name}
                                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="desc">Description</Label>
                            <Input
                                id="desc"
                                value={editForm.description}
                                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Status</Label>
                                <Select value={editForm.status} onValueChange={(val) => setEditForm(prev => ({ ...prev, status: val }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="on_hold">On Hold</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label>Department</Label>
                                <Select value={editForm.department_id} onValueChange={(val) => setEditForm(prev => ({ ...prev, department_id: val }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No Department</SelectItem>
                                        {departments?.map(d => (
                                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Delegated Manager</Label>
                            <Select value={editForm.manager_id} onValueChange={(val) => setEditForm(prev => ({ ...prev, manager_id: val }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Assign a manager" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Unassigned</SelectItem>
                                    {users?.filter(u => getRoleCategory(u.role) !== 'staff').map(u => (
                                        <SelectItem key={u.id} value={u.id}>{u.full_name || u.email} ({u.role?.replace('_', ' ')})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={updateProject.isPending}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveEdit} disabled={updateProject.isPending}>
                            {updateProject.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
