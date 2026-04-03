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
import { useDepartments } from '@/hooks/useAdminData';

interface CreateProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { data: departments } = useDepartments();

    const [isLoading, setIsLoading] = useState(false);
    const [profiles, setProfiles] = useState<any[]>([]);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [departmentId, setDepartmentId] = useState('none');
    const [managerId, setManagerId] = useState('none');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [budget, setBudget] = useState('');

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
        if (!name || !user) {
            toast.error('Project Name is required');
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.from('projects').insert([
                {
                    name,
                    description: description || null,
                    status: 'active',
                    start_date: startDate || null,
                    end_date: endDate || null,
                    department_id: departmentId === 'none' ? null : departmentId,
                    manager_id: managerId === 'none' ? null : managerId,
                    budget: budget ? parseFloat(budget) : null,
                    progress: 0
                }
            ]);

            if (error) throw error;

            toast.success('Project created successfully');
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });

            onOpenChange(false);
            // Reset form
            setName('');
            setDescription('');
            setDepartmentId('none');
            setManagerId('none');
            setStartDate('');
            setEndDate('');
            setBudget('');
        } catch (error: any) {
            toast.error(error.message || 'Failed to create project');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                        Define a new organizational project and assign a manager.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Project Name <span className="text-red-500">*</span></Label>
                        <Input
                            id="name"
                            placeholder="Enter project name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Objective details"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endDate">End Date</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="budget">Budget (₹)</Label>
                        <Input
                            id="budget"
                            type="number"
                            placeholder="E.g. 500000"
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="managerId">Project Manager</Label>
                        <Select value={managerId} onValueChange={setManagerId}>
                            <SelectTrigger id="managerId">
                                <SelectValue placeholder="Select manager" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Unassigned</SelectItem>
                                {profiles.map(profile => (
                                    <SelectItem key={profile.id} value={profile.id}>
                                        {profile.full_name || profile.email}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Select value={departmentId} onValueChange={setDepartmentId}>
                            <SelectTrigger id="department">
                                <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {departments?.map(dept => (
                                    <SelectItem key={dept.id} value={dept.id}>
                                        {dept.name}
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
                            {isLoading ? 'Creating...' : 'Create Project'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
