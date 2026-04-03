import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Target, Building2, Shield, Clock, FolderKanban } from 'lucide-react';
import { UserManagement } from '@/components/admin/UserManagement';
import { DepartmentManagement } from '@/components/admin/DepartmentManagement';
import { ProjectManagement } from '@/components/admin/ProjectManagement';
import { KPITemplateManagement } from '@/components/admin/KPITemplateManagement';
import { WorkingHoursConfig } from '@/components/admin/WorkingHoursConfig';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('users');
  const [isSaving, setIsSaving] = useState(false);
  const { role } = useAuth();

  // Fake settings state
  const [settings, setSettings] = useState({
    requireVerification: true,
    allowHierarchyView: false,
    autoArchive: true,
    emailDigest: true
  });

  // Check if user is admin
  if (role !== 'admin') {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-muted-foreground text-center">
                You don't have permission to access the admin panel.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground mt-1">
              System configuration and user management
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-flex">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4 hidden sm:inline" />
              Users
            </TabsTrigger>
            <TabsTrigger value="departments" className="gap-2">
              <Building2 className="h-4 w-4 hidden sm:inline" />
              Departments
            </TabsTrigger>
            <TabsTrigger value="projects" className="gap-2">
              <FolderKanban className="h-4 w-4 hidden sm:inline" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="kpis" className="gap-2">
              <Target className="h-4 w-4 hidden sm:inline" />
              KPIs
            </TabsTrigger>
            <TabsTrigger value="working-hours" className="gap-2">
              <Clock className="h-4 w-4 hidden sm:inline" />
              Hours
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Shield className="h-4 w-4 hidden sm:inline" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="departments" className="mt-6">
            <DepartmentManagement />
          </TabsContent>

          <TabsContent value="projects" className="mt-6">
            <ProjectManagement />
          </TabsContent>

          <TabsContent value="kpis" className="mt-6">
            <KPITemplateManagement />
          </TabsContent>

          <TabsContent value="working-hours" className="mt-6">
            <WorkingHoursConfig />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Global System Settings</CardTitle>
                <CardDescription>Configure platform-wide behaviors and automation policies.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <p className="font-medium">Require Task Verification</p>
                      <p className="text-sm text-muted-foreground">Force assignees to submit tasks for admin approval before they can be marked completed.</p>
                    </div>
                    <Switch
                      checked={settings.requireVerification}
                      onCheckedChange={(c) => setSettings({ ...settings, requireVerification: c })}
                    />
                  </div>

                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <p className="font-medium">Open Direct Reporting Hierarchy</p>
                      <p className="text-sm text-muted-foreground">Allow all employees to view the exact team hierarchy trees in the public directory.</p>
                    </div>
                    <Switch
                      checked={settings.allowHierarchyView}
                      onCheckedChange={(c) => setSettings({ ...settings, allowHierarchyView: c })}
                    />
                  </div>

                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <p className="font-medium">Auto-Archive Completed Goals</p>
                      <p className="text-sm text-muted-foreground">Automatically prune and archive completed tasks and KPIs after 30 days of inactivity.</p>
                    </div>
                    <Switch
                      checked={settings.autoArchive}
                      onCheckedChange={(c) => setSettings({ ...settings, autoArchive: c })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Weekly Executive Digest</p>
                      <p className="text-sm text-muted-foreground">Automatically email a performance summary digest to top management every Friday.</p>
                    </div>
                    <Switch
                      checked={settings.emailDigest}
                      onCheckedChange={(c) => setSettings({ ...settings, emailDigest: c })}
                    />
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t">
                  <Button
                    onClick={() => {
                      setIsSaving(true);
                      setTimeout(() => {
                        setIsSaving(false);
                        toast.success("System configurations updated securely.");
                      }, 800)
                    }}
                    disabled={isSaving}
                  >
                    {isSaving ? "Applying..." : "Apply Global Settings"}
                  </Button>
                </div>

              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
