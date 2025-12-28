import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, CircleDot, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRealtimeNotifications } from '@/hooks/useNotifications';
import ActiveTripBar from '@/components/trip/ActiveTripBar';
import { useDeviceSpacing } from '@/hooks/useDeviceInfo';

const tabs = [
  { path: '/feed', icon: Menu, label: 'Feed' },
  { path: '/trip', icon: CircleDot, label: 'Trip' },
  { path: '/profile', icon: CreditCard, label: 'Profile' },
];

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { bottomNavHeight, safeAreaBottom, sizeCategory } = useDeviceSpacing();
  
  // Enable real-time notification updates across the app
  useRealtimeNotifications();
  
  // Hide bottom nav on certain pages
  const hideBottomNav = ['/trip/active', '/trip/complete'].some(p => location.pathname.startsWith(p));

  // Dynamic bottom padding based on device
  const mainPaddingBottom = hideBottomNav ? 0 : bottomNavHeight;

  return (
    <div className="h-full bg-background flex flex-col overflow-hidden">
      {/* Main Content - dynamic padding based on device */}
      <main 
        className="flex-1 overflow-y-auto scrollbar-hide"
        style={{ paddingBottom: mainPaddingBottom }}
      >
        <Outlet />
      </main>

      {/* Active Trip Floating Bar */}
      <AnimatePresence>
        <ActiveTripBar bottomOffset={hideBottomNav ? safeAreaBottom : bottomNavHeight} />
      </AnimatePresence>

      {/* Bottom Tab Navigation - dynamic height */}
      {!hideBottomNav && (
        <nav 
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card border-t border-border z-50"
          style={{ 
            height: bottomNavHeight,
            paddingBottom: safeAreaBottom 
          }}
        >
          <div className={cn(
            "flex items-center justify-around",
            sizeCategory === 'small' ? 'h-14' : 'h-16'
          )}>
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
                    <Icon className={cn(
                      sizeCategory === 'small' ? 'h-5 w-5' : 'h-6 w-6'
                    )} />
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </div>
                  <span className={cn(
                    "font-medium",
                    sizeCategory === 'small' ? 'text-[10px]' : 'text-xs'
                  )}>{tab.label}</span>
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
