import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, UserPlus, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const AdminBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/admin', { replace: true });
  };

  const tabs = [
    { path: '/admin/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/admin/users', icon: Users, label: 'Users' },
    { path: '/admin/users/new', icon: UserPlus, label: 'Add User' },
  ];

  const isActive = (path: string) => {
    if (path === '/admin/users') {
      // Match /admin/users but not /admin/users/new or /admin/users/:id
      return location.pathname === '/admin/users';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
              isActive(tab.path) 
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center flex-1 h-full gap-1 text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-xs font-medium">Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default AdminBottomNav;
