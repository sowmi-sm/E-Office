import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface Profile {
  id: string;
  email: string;
  employee_id: string | null;
  full_name: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signUp: (email: string, password: string, role: AppRole, fullName?: string, departmentId?: string) => Promise<{ error: Error | null }>;
  signIn: (identifier: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  supabase: typeof supabase;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string, userObj?: User) => {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileData) {
      setProfile(profileData);
    } else {
      // Fallback to user metadata when profile fetch fails (e.g. RLS)
      const meta = userObj?.user_metadata;
      setProfile({
        id: userId,
        email: userObj?.email || '',
        employee_id: meta?.employee_id || null,
        full_name: meta?.full_name || userObj?.email?.split('@')[0] || null,
      });
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (roleData) {
      setRole(roleData.role);
    } else {
      setRole(userObj?.user_metadata?.role || 'hq_employee');
    }
  };

  const generateEmployeeId = async (deptName: string) => {
    const prefixMap: Record<string, string> = {
      'Administration': 'AD',
      'Field Operations': 'FO',
      'Finance & Accounts': 'FA',
      'Planning & Design': 'PD',
      'Projects Division': 'PR',
      'Technical Division': 'TD'
    };

    const prefix = prefixMap[deptName] || 'US';

    // Fetch the highest current ID with this prefix to ensure sequence
    const { data } = await supabase
      .from('profiles')
      .select('employee_id')
      .ilike('employee_id', `${prefix}%`)
      .order('employee_id', { ascending: false })
      .limit(1);

    let nextNum = 1;
    if (data && data.length > 0 && data[0]?.employee_id) {
      // Extract the numeric part (everything after the potential prefix)
      const currentNumMatch = data[0].employee_id.match(/\d+/);
      if (currentNumMatch) {
        nextNum = parseInt(currentNumMatch[0]) + 1;
      }
    }

    const paddedNum = nextNum.toString().padStart(4, '0');
    return `${prefix}${paddedNum}`;
  };

  useEffect(() => {
    // Restore theme on load
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
    // Restore compact view
    if (localStorage.getItem('compactView') === 'true') {
      document.documentElement.classList.add('compact');
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id, session.user);
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserData(session.user.id, session.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, selectedRole: AppRole, fullName?: string, departmentId?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const displayName = fullName || email.split('@')[0];

    // Get department name for ID generation
    let employeeId = null;
    if (departmentId && departmentId !== 'none') {
      const { data: dept } = await supabase
        .from('departments')
        .select('name')
        .eq('id', departmentId)
        .maybeSingle();

      const deptName = dept?.name || (departmentId === '550e8400-e29b-41d4-a716-526655440001' ? 'Administration' : 'User');
      employeeId = await generateEmployeeId(deptName);
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: displayName,
          role: selectedRole,
          department_id: departmentId && departmentId !== 'none' ? departmentId : null,
          employee_id: employeeId
        }
      }
    });

    if (error) {
      return { error };
    }

    if (data.user) {
      setRole(selectedRole);
      setProfile({
        id: data.user.id,
        email,
        full_name: displayName,
        employee_id: employeeId
      });

      // Secondary attempt to update profile if trigger doesn't exist
      await supabase.from('profiles').update({
        employee_id: employeeId,
        full_name: displayName,
        department_id: departmentId && departmentId !== 'none' ? departmentId : null
      }).eq('id', data.user.id);

      await supabase.from('user_roles').insert([{
        user_id: data.user.id,
        role: selectedRole
      }]);
    }

    return { error: null };
  };

  const signIn = async (identifier: string, password: string) => {
    let emailToUse = identifier;

    // Check if identifier is an email (contains @). If skip check if it might be an Employee ID
    if (!identifier.includes('@')) {
      const { data: profileByEmpId } = await supabase
        .from('profiles')
        .select('email')
        .eq('employee_id', identifier.toUpperCase())
        .maybeSingle();

      if (profileByEmpId?.email) {
        emailToUse = profileByEmpId.email;
      }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password,
    });

    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    return { error };
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      role,
      loading,
      signUp,
      signIn,
      signOut,
      resetPassword,
      supabase
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Role-based route mapping
export const getRoleDefaultRoute = (role: AppRole | null): string => {
  return '/dashboard'; // Everyone defaults to the Dashboard upon login
};

export const getRoleLabel = (role: AppRole): string => {
  const labels: Record<AppRole, string> = {
    admin: 'Administrator',
    hq_employee: 'HQ Employee',
    field_employee: 'Field Employee',
    reporting_officer: 'Reporting Officer',
    project_manager: 'Project Manager',
    division_head: 'Division Head',
    top_management: 'Top Management',
    strategic_planner: 'Strategic Planner',
    designer: 'Designer',
  };
  return labels[role];
};
