import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { useKPITemplates, useCreateKPITemplate, useUpdateKPITemplate, useDeleteKPITemplate, useDepartments } from '@/hooks/useAdminData';

interface KPIFormData {
  name: string;
  description: string;
  unit: string;
  target_value: string;
  department_id: string;
  is_active: boolean;
}

const defaultFormData: KPIFormData = {
  name: '',
  description: '',
  unit: 'number',
  target_value: '',
  department_id: '',
  is_active: true,
};

const unitOptions = [
  { value: 'number', label: 'Number' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'currency', label: 'Currency' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
];

export function KPITemplateManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<KPIFormData>(defaultFormData);

  const { data: templates, isLoading } = useKPITemplates();
  const { data: departments } = useDepartments();
  const createTemplate = useCreateKPITemplate();
  const updateTemplate = useUpdateKPITemplate();
  const deleteTemplate = useDeleteKPITemplate();

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingId(null);
  };

  const handleOpenDialog = (template?: {
    id: string;
    name: string;
    description: string | null;
    unit: string;
    target_value: number | null;
    department_id: string | null;
    is_active: boolean;
  }) => {
    if (template) {
      setEditingId(template.id);
      setFormData({
        name: template.name,
        description: template.description || '',
        unit: template.unit,
        target_value: template.target_value?.toString() || '',
        department_id: template.department_id || '',
        is_active: template.is_active,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      name: formData.name,
      description: formData.description || undefined,
      unit: formData.unit,
      target_value: formData.target_value ? parseFloat(formData.target_value) : undefined,
      department_id: formData.department_id || undefined,
      is_active: formData.is_active,
    };

    if (editingId) {
      await updateTemplate.mutateAsync({ id: editingId, ...payload });
    } else {
      await createTemplate.mutateAsync(payload);
    }
    
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    await deleteTemplate.mutateAsync(id);
  };

  const handleToggleActive = async (id: string, is_active: boolean) => {
    await updateTemplate.mutateAsync({ id, is_active });
  };

  const getDepartmentName = (id: string | null) => {
    if (!id) return '-';
    return departments?.find(d => d.id === id)?.name || '-';
  };

  const isPending = createTemplate.isPending || updateTemplate.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>KPI Template Management</span>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="gap-2">
                <Plus className="h-4 w-4" />
                Add KPI Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? 'Edit KPI Template' : 'Create KPI Template'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="KPI name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="KPI description"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Unit</label>
                    <Select
                      value={formData.unit}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {unitOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Target Value</label>
                    <Input
                      type="number"
                      value={formData.target_value}
                      onChange={(e) => setFormData(prev => ({ ...prev, target_value: e.target.value }))}
                      placeholder="Target"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Department</label>
                  <Select
                    value={formData.department_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, department_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments?.map(dept => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Active</label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : editingId ? (
                      'Update'
                    ) : (
                      'Create'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No KPI templates found. Create your first template.
                  </TableCell>
                </TableRow>
              ) : (
                templates?.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{template.name}</p>
                        {template.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {template.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{template.unit}</TableCell>
                    <TableCell>{template.target_value ?? '-'}</TableCell>
                    <TableCell>{getDepartmentName(template.department_id)}</TableCell>
                    <TableCell>
                      <Switch
                        checked={template.is_active}
                        onCheckedChange={(checked) => handleToggleActive(template.id, checked)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenDialog(template)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete KPI Template</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{template.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(template.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
