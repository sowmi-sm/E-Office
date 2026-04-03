import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Users, FileText, FolderKanban, Loader2 } from 'lucide-react';
import { useDepartmentDetails } from '@/hooks/useAdminData';

interface DepartmentDetailDialogProps {
    department: { id: string; name: string; description: string | null } | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DepartmentDetailDialog({ department, open, onOpenChange }: DepartmentDetailDialogProps) {
    const { data, isLoading } = useDepartmentDetails(department?.id);

    if (!department) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>{department.name}</DialogTitle>
                    <DialogDescription>
                        {department.description || 'Department Overview'}
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-6 mt-4">
                        <div className="grid grid-cols-3 gap-4">
                            <Card>
                                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                    <Users className="h-6 w-6 text-primary mb-2" />
                                    <div className="text-2xl font-bold">{data?.employees?.length || 0}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Employees</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                    <FileText className="h-6 w-6 text-accent mb-2" />
                                    <div className="text-2xl font-bold">{data?.tasks?.length || 0}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Tasks</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                    <FolderKanban className="h-6 w-6 text-warning mb-2" />
                                    <div className="text-2xl font-bold">{data?.projects?.length || 0}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Projects</p>
                                </CardContent>
                            </Card>
                        </div>

                        {data?.employees && data.employees.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-foreground">Employees in Department</h4>
                                <div className="flex flex-wrap gap-2">
                                    {data.employees.slice(0, 15).map((emp: any) => (
                                        <Badge key={emp.id} variant="secondary">
                                            {emp.full_name || emp.email}
                                        </Badge>
                                    ))}
                                    {data.employees.length > 15 && (
                                        <Badge variant="outline">+{data.employees.length - 15} more</Badge>
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
