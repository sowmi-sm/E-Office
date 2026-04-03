import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, getRoleDefaultRoute } from '@/contexts/AuthContext';

const Index = () => {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    
    if (user && role) {
      navigate(getRoleDefaultRoute(role), { replace: true });
    } else {
      navigate('/auth', { replace: true });
    }
  }, [user, role, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
};

export default Index;
