import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  CheckSquare,
  FolderKanban,
  Users,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Building2,
  UserCircle,
  TrendingUp,
  Shield,
  Monitor,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth, getRoleLabel } from '@/contexts/AuthContext';
import { getRoleCategory } from '@/hooks/useRoleBasedData';
import { useNotifications } from '@/hooks/useNotifications';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  roles?: ('staff' | 'officer' | 'admin')[];
}

const getNavItems = (roleCategory: 'staff' | 'officer' | 'admin') => {
  const allNavItems: NavItem[] = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { title: 'My KPIs', href: '/kpis', icon: Target },
    { title: 'Tasks', href: '/tasks', icon: CheckSquare },
    { title: 'Projects', href: '/projects', icon: FolderKanban },
    { title: 'Performance', href: '/performance', icon: TrendingUp },
    { title: 'Productivity Monitoring', href: '/productivity', icon: Monitor },
  ];

  const managementItems: NavItem[] = [
    { title: 'Team', href: '/team', icon: Users, roles: ['officer', 'admin'] },
    { title: 'Analytics', href: '/analytics', icon: BarChart3, roles: ['officer', 'admin'] },
    { title: 'Departments', href: '/departments', icon: Building2, roles: ['officer', 'admin'] },
  ];

  const adminItems: NavItem[] = [
    { title: 'Admin Panel', href: '/admin', icon: Shield, roles: ['admin'] },
  ];

  const systemItems: (badgeCount: number) => NavItem[] = (badgeCount) => [
    { title: 'Notifications', href: '/notifications', icon: Bell, badge: badgeCount > 0 ? badgeCount : undefined },
    { title: 'Settings', href: '/settings', icon: Settings },
  ];

  return {
    main: allNavItems,
    management: managementItems.filter(item => !item.roles || item.roles.includes(roleCategory)),
    admin: adminItems.filter(item => !item.roles || item.roles.includes(roleCategory)),
    system: systemItems,
  };
};

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { profile, role, signOut } = useAuth();
  const { data: notifications } = useNotifications();

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  const roleCategory = getRoleCategory(role);
  const navItems = getNavItems(roleCategory);

  const showManagement = navItems.management.length > 0;
  const showAdmin = navItems.admin.length > 0;
  const systemItems = navItems.system(unreadCount);

  const renderNavItem = (item: NavItem) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;

    return (
      <NavLink
        key={item.href}
        to={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
          isActive
            ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
            : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
        )}
      >
        <Icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-sidebar-primary-foreground')} />
        {!collapsed && (
          <>
            <span className="font-medium text-sm">{item.title}</span>
            {item.badge && (
              <span className="ml-auto bg-sidebar-primary text-sidebar-primary-foreground text-xs px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </>
        )}
        {collapsed && item.badge && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs w-5 h-5 flex items-center justify-center rounded-full">
            {item.badge}
          </span>
        )}
      </NavLink>
    );
  };

  const displayName = profile?.full_name || profile?.email?.split('@')[0] || 'User';

  return (
    <aside
      className={cn(
        'sticky top-0 h-screen bg-sidebar flex flex-col transition-all duration-300 border-r border-sidebar-border z-10 shrink-0',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center shadow-lg flex-shrink-0">
            <Building2 className="h-5 w-5 text-accent-foreground" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="font-bold text-sidebar-foreground text-sm">E-Office PMS</h1>
              <p className="text-xs text-sidebar-foreground/60">Project Management</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-6 overflow-y-auto">
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider mb-2">
              Main
            </p>
          )}
          {navItems.main.map(renderNavItem)}
        </div>

        {showManagement && (
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider mb-2">
                Management
              </p>
            )}
            {navItems.management.map(renderNavItem)}
          </div>
        )}

        {showAdmin && (
          <div className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider mb-2">
                Administration
              </p>
            )}
            {navItems.admin.map(renderNavItem)}
          </div>
        )}

        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider mb-2">
              System
            </p>
          )}
          {systemItems.map(renderNavItem)}
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-sidebar-border">
        <div
          className={cn(
            'flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent/50',
            collapsed && 'justify-center'
          )}
        >
          <div className="w-9 h-9 rounded-full bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <UserCircle className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {displayName}
              </p>
              <div className="flex items-center gap-1">
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  {role ? getRoleLabel(role) : 'Loading...'}
                </p>
                {profile?.employee_id && (
                  <>
                    <span className="text-[10px] text-sidebar-foreground/30">•</span>
                    <span className="text-[10px] font-mono font-bold text-sidebar-highlight/80 text-primary">
                      {profile.employee_id}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
