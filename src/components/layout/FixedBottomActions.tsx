import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useDeviceSpacing } from '@/hooks/useDeviceInfo';

interface FixedBottomActionsProps {
  children: ReactNode;
  className?: string;
  showBorder?: boolean;
  // When true, positions above bottom nav; when false, positions at screen bottom with safe area
  aboveNav?: boolean;
}

const FixedBottomActions = ({ 
  children, 
  className,
  showBorder = false,
  aboveNav = true 
}: FixedBottomActionsProps) => {
  const { bottomNavHeight, safeAreaBottom } = useDeviceSpacing();
  
  // Calculate bottom position based on context
  const bottomPosition = aboveNav ? bottomNavHeight : safeAreaBottom;
  
  return (
    <div 
      className={cn(
        "fixed left-0 right-0 p-4 bg-background max-w-[430px] mx-auto",
        showBorder && "border-t border-border",
        className
      )}
      style={{ bottom: bottomPosition }}
    >
      {children}
    </div>
  );
};

export default FixedBottomActions;
