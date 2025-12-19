import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, CircleDot, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const tabs = [
  { path: '/feed', icon: Menu, label: 'Feed' },
  { path: '/trip', icon: CircleDot, label: 'Trip' },
  { path: '/profile', icon: CreditCard, label: 'Profile' },
];

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Hide bottom nav on certain pages
  const hideBottomNav = ['/trip/active', '/trip/complete'].some(p => location.pathname.startsWith(p));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Content */}
      <main className="flex-1 pb-20 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Tab Navigation */}
      {!hideBottomNav && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card border-t border-border safe-bottom z-50">
          <div className="flex items-center justify-around h-16">
            {tabs.map((tab) => {
              const isActive = location.pathname.startsWith(tab.path);
              const Icon = tab.icon;
              
              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <div className="relative">
                    <Icon className="h-6 w-6" />
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </div>
                  <span className="text-xs font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};

export default MainLayout;
