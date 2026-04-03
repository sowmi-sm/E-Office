import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getRoleCategory } from '@/hooks/useRoleBasedData';
import { StaffDashboard } from '@/components/dashboard/StaffDashboard';
import { OfficerDashboard } from '@/components/dashboard/OfficerDashboard';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  const roleCategory = getRoleCategory(role);

  const renderDashboard = () => {
    switch (roleCategory) {
      case 'admin':
        return <AdminDashboard />;
      case 'officer':
        return <OfficerDashboard />;
      case 'staff':
      default:
        return <StaffDashboard />;
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {renderDashboard()}
      </div>
    </DashboardLayout>
  );
}
