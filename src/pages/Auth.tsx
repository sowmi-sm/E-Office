import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Lock, Mail, Eye, EyeOff, ArrowRight, UserPlus, LogIn, UserCircle } from 'lucide-react';
import { useAuth, getRoleDefaultRoute, getRoleLabel } from '@/contexts/AuthContext';
import { useDepartments } from '@/hooks/useAdminData';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

const roles: AppRole[] = [
  'admin',
  'hq_employee',
  'field_employee',
  'reporting_officer',
  'project_manager',
  'division_head',
  'top_management',
  'strategic_planner',
  'designer',
];

export default function Auth() {
  const navigate = useNavigate();
  const { user, role, signUp, signIn, resetPassword, loading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('hq_employee');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('none');
  const { data: departments } = useDepartments();

  useEffect(() => {
    if (!authLoading && user && role) {
      navigate(getRoleDefaultRoute(role));
    }
  }, [user, role, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    if (isSignUp && !fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, selectedRole, fullName.trim(), selectedDepartment);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('This email is already registered. Please sign in instead.');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Account created successfully!');
          navigate(getRoleDefaultRoute(selectedRole));
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error('Invalid credentials. Please check your email/ID and password.');
        } else {
          toast.success('Signed in successfully!');
        }
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address above first to reset your password');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await resetPassword(email);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(`Password reset instructions have been securely sent to ${email}`);
      }
    } catch (err) {
      toast.error('An unexpected error occurred while resetting password');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Hero */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary-foreground rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-xl">E-Office PMS</h1>
              <p className="text-sm text-primary-foreground/70">Project Management System</p>
            </div>
          </div>

          <div className="max-w-md">
            <h2 className="text-4xl font-bold leading-tight mb-6 animate-slide-up">
              Productivity Measurement & Performance Management
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
              A transparent, scientific, and data-driven performance management module enabling
              continuous productivity measurement and actionable insights.
            </p>


          </div>

          <p className="text-sm text-primary-foreground/50">
            © 2024 E-Office PMS. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-foreground">E-Office PMS</h1>
              <p className="text-sm text-muted-foreground">Project Management System</p>
            </div>
          </div>

          <div className="text-center lg:text-left mb-8 animate-slide-up">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
              {isSignUp ? 'Create an account' : 'Welcome back'}
            </h2>
            <p className="text-muted-foreground mt-2">
              {isSignUp
                ? 'Sign up to access the productivity dashboard'
                : 'Sign in to access your productivity dashboard'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="space-y-2 animate-slide-up" style={{ animationDelay: '25ms' }}>
                <Label htmlFor="fullName" className="text-foreground font-medium">
                  Full Name
                </Label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    className="pl-10 h-12 bg-background border-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2 animate-slide-up" style={{ animationDelay: isSignUp ? '50ms' : '50ms' }}>
              <Label htmlFor="email" className="text-foreground font-medium">
                {isSignUp ? 'Email Address' : 'Email or Employee ID'}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type={isSignUp ? "email" : "text"}
                  placeholder={isSignUp ? "name@brahmaputra.gov.in" : "Email or ID (e.g. AD1001)"}
                  className="pl-10 h-12 bg-background border-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2 animate-slide-up" style={{ animationDelay: isSignUp ? '100ms' : '100ms' }}>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground font-medium">
                  Password
                </Label>
                {!isSignUp && (
                  <a href="#" onClick={handlePasswordReset} className="text-sm text-primary hover:underline">
                    Forgot password?
                  </a>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-12 bg-background border-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div className="space-y-2 animate-slide-up" style={{ animationDelay: '150ms' }}>
                <Label className="text-foreground font-medium">Select Your Role</Label>
                <div className="grid grid-cols-2 gap-2">
                  {roles.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRole(r)}
                      className={`p-3 rounded-lg border text-sm font-medium transition-all ${selectedRole === r
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                        }`}
                    >
                      {getRoleLabel(r)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isSignUp && (
              <div className="space-y-2 animate-slide-up" style={{ animationDelay: '175ms' }}>
                <Label className="text-foreground font-medium">Department</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="w-full h-12 bg-background border-input">
                    <SelectValue placeholder="Select your department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Department</SelectItem>
                    {departments?.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full h-12 animate-slide-up"
              style={{ animationDelay: isSignUp ? '200ms' : '150ms' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  {isSignUp ? 'Creating account...' : 'Signing in...'}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {isSignUp ? (
                    <>
                      <UserPlus className="h-5 w-5" />
                      Create Account
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </div>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center animate-slide-up" style={{ animationDelay: isSignUp ? '250ms' : '200ms' }}>
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isSignUp ? (
                <>
                  Already have an account?{' '}
                  <span className="text-primary font-medium">Sign in</span>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <span className="text-primary font-medium">Sign up</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-border animate-slide-up" style={{ animationDelay: isSignUp ? '300ms' : '250ms' }}>
            <p className="text-center text-sm text-muted-foreground">
              Having trouble?{' '}
              <a href="/support" onClick={(e) => { e.preventDefault(); navigate('/support'); }} className="text-primary hover:underline font-medium">
                Contact IT Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
