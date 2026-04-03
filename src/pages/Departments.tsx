import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as UIDialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Building2, Users, Loader2 } from 'lucide-react';
import { useDepartments, useUsers } from '@/hooks/useAdminData';
import { getRoleLabel } from '@/contexts/AuthContext';

export default function Departments() { 
  const { data: departments, isLoading: deptLoading } = useDepartments();
  const { data: users, isLoading: usersLoading } = useUsers();

  const [selectedDept, setSelectedDept] = useState<any | null>(null);

  if (deptLoading || usersLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Departments</h1>
            <p className="text-muted-foreground mt-1">
              Manage and view department-wise performance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="accent" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Department
            </Button>
          </div>
        </div>

        {departments?.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No departments found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments?.map((dept, index) => {
              const deptUsers = users?.filter(u => u.department_id === dept.id) || [];

              return (
                <Card
                  key={dept.id}
                  className="animate-slide-up cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => setSelectedDept(dept)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        <CardTitle className="text-base">{dept.name}</CardTitle>
                      </div>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {deptUsers.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {dept.description && (
                      <p className="text-sm text-muted-foreground">{dept.description}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Department Details Dialog */}
        <Dialog open={!!selectedDept} onOpenChange={(open) => !open && setSelectedDept(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Building2 className="h-5 w-5 text-primary" />
                {selectedDept?.name}
              </DialogTitle>
              <UIDialogDescription>
                {selectedDept?.description || 'Department Details & Staff List'}
              </UIDialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto mt-4 pr-1">
              <div className="mb-4 flex items-center justify-between bg-muted/30 p-4 border rounded-lg">
                <span className="text-sm font-medium text-muted-foreground">Total Employees:</span>
                <Badge variant="default" className="text-sm">
                  {users?.filter(u => u.department_id === selectedDept?.id).length || 0}
                </Badge>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.filter(u => u.department_id === selectedDept?.id).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                          No employees assigned to this department.
                        </TableCell>
                      </TableRow>
                    ) : (
                      users?.filter(u => u.department_id === selectedDept?.id).map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">{member.full_name || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {member.role ? getRoleLabel(member.role) : 'Unassigned'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{member.email}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
