import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useProjects } from '@/hooks/useRoleBasedData';

interface CreateTaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateTaskDialog({ open, onOpenChange }: CreateTaskDialogProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { data: projects } = useProjects();

    const [isLoading, setIsLoading] = useState(false);
    const [profiles, setProfiles] = useState<any[]>([]);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('medium');
    const [dueDate, setDueDate] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [projectId, setProjectId] = useState<string>('none');

    useEffect(() => {
        if (open) {
            const fetchProfiles = async () => {
                const { data } = await supabase.from('profiles').select('id, full_name, email');
                if (data) setProfiles(data);
            };
            fetchProfiles();
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !assignedTo || !user) {
            toast.error('Title and Assignee are required');
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.from('tasks').insert([
                {
                    title,
                    description: description || null,
                    priority,
                    status: 'pending',
                    due_date: dueDate || null,
                    assigned_to: assignedTo,
                    project_id: projectId === 'none' ? null : projectId,
                    created_by: user.id
                }
            ]);

            if (error) throw error;

            toast.success('Task created successfully');
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });

            onOpenChange(false);
            // Reset form
            setTitle('');
            setDescription('');
            setPriority('medium');
            setDueDate('');
            setAssignedTo('');
            setProjectId('none');
        } catch (error: any) {
            toast.error(error.message || 'Failed to create task');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>
                        Assign a new task to a team member.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Task Title <span className="text-red-500">*</span></Label>
                        <Input
                            id="title"
                            placeholder="Enter task title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Enter task details"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger id="priority">
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="critical">Critical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dueDate">Due Date</Label>
                            <Input
                                id="dueDate"
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="assignedTo">Assign To <span className="text-red-500">*</span></Label>
                        <Select value={assignedTo} onValueChange={setAssignedTo} required>
                            <SelectTrigger id="assignedTo">
                                <SelectValue placeholder="Select user" />
                            </SelectTrigger>
                            <SelectContent>
                                {profiles.map(profile => (
                                    <SelectItem key={profile.id} value={profile.id}>
                                        {profile.full_name || profile.email}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="project">Related Project (Optional)</Label>
                        <Select value={projectId} onValueChange={setProjectId}>
                            <SelectTrigger id="project">
                                <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No Project</SelectItem>
                                {projects?.map(project => (
                                    <SelectItem key={project.id} value={project.id}>
                                        {project.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Creating...' : 'Create Task'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
