import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Edit2, Loader2, Save, X } from 'lucide-react';
import { useUsers, useUpdateUser, useDepartments } from '@/hooks/useAdminData';
import { getRoleLabel } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';
import { Constants } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

export function UserManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  const { data: users, isLoading } = useUsers();
  const { data: departments } = useDepartments();
  const updateUser = useUpdateUser();

  const filteredUsers = users?.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveRole = async (userId: string) => {
    try {
      await updateUser.mutateAsync({
        userId,
        role: selectedRole,
        departmentId: selectedDepartment,
        employeeId: selectedEmployeeId === '' ? null : selectedEmployeeId
      });
      setEditingUserId(null);
      setSelectedRole(null);
      setSelectedDepartment(null);
      setSelectedEmployeeId('');
    } catch (e) {
      console.error('Update failed', e);
    }
  };

  const getDepartmentName = (deptId: string | null | undefined) => {
    if (!deptId) return 'No Department';
    const dept = departments?.find(d => d.id === deptId);
    return dept ? dept.name : 'Unknown Department';
  };

  const roleOptions = Constants.public.Enums.app_role;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>User Management</span>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
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
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      {editingUserId === user.id ? (
                        <Input
                          value={selectedEmployeeId}
                          onChange={(e) => setSelectedEmployeeId(e.target.value.toUpperCase())}
                          placeholder="e.g. AD1001"
                          className="w-[100px] h-8 text-xs font-mono"
                        />
                      ) : (
                        user.employee_id || '-'
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {user.full_name || 'No name'}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {editingUserId === user.id ? (
                        <Select
                          value={selectedRole || user.role || undefined}
                          onValueChange={(value) => setSelectedRole(value as AppRole)}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roleOptions.map((role) => (
                              <SelectItem key={role} value={role}>
                                {getRoleLabel(role)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="secondary">
                          {user.role ? getRoleLabel(user.role) : 'No role'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingUserId === user.id ? (
                        <Select
                          value={selectedDepartment || 'none'}
                          onValueChange={(value) => setSelectedDepartment(value)}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select dept" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Department</SelectItem>
                            {departments?.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-muted-foreground text-sm font-medium">
                          {getDepartmentName(user.department_id)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingUserId === user.id ? (
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="icon"
                            variant="default"
                            onClick={() => handleSaveRole(user.id)}
                            disabled={updateUser.isPending}
                          >
                            {updateUser.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => {
                              setEditingUserId(null);
                              setSelectedRole(null);
                              setSelectedDepartment(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingUserId(user.id);
                            setSelectedRole(user.role);
                            setSelectedDepartment(user.department_id ? user.department_id : 'none');
                            setSelectedEmployeeId(user.employee_id || '');
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
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
