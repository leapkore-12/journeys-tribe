import { ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';

interface MobileContainerProps {
  children: ReactNode;
}

const MobileContainer = ({ children }: MobileContainerProps) => {
  const isNative = Capacitor.isNativePlatform();
  
  // On native: use full screen to adapt to any iPhone display size
  // On web: show phone simulation frame for preview
  if (isNative) {
    return (
      <div className="h-screen w-full bg-background overflow-y-auto scrollbar-hide">
        {children}
      </div>
    );
  }
  
  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center">
      <div className="relative w-full max-w-[430px] h-screen max-h-[932px] bg-background overflow-y-auto scrollbar-hide shadow-2xl">
        {children}
      </div>
    </div>
  );
};

export default MobileContainer;
