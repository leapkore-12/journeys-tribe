import { ReactNode } from 'react';
import { useDeviceInfo } from '@/hooks/useDeviceInfo';

interface MobileContainerProps {
  children: ReactNode;
}

const MobileContainer = ({ children }: MobileContainerProps) => {
  const { isNative, spacing } = useDeviceInfo();
  
  // On native: use full screen with dynamic safe area handling
  if (isNative) {
    return (
      <div 
        className="h-screen w-full bg-background overflow-hidden"
        style={{
          paddingTop: `env(safe-area-inset-top, ${spacing.safeAreaTop}px)`,
        }}
      >
        {children}
      </div>
    );
  }
  
  // On web: show phone simulation frame for preview
  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center">
      <div className="relative w-full max-w-[430px] h-screen max-h-[932px] bg-background overflow-y-auto scrollbar-hide shadow-2xl">
        {children}
      </div>
    </div>
  );
};

export default MobileContainer;
