import { ReactNode } from 'react';
import { useDeviceInfo } from '@/hooks/useDeviceInfo';

interface SafeAreaViewProps {
  children: ReactNode;
  className?: string;
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
}

export const SafeAreaView = ({ 
  children, 
  className = '',
  top = true,
  bottom = true,
  left = true,
  right = true,
}: SafeAreaViewProps) => {
  const { isNative, spacing } = useDeviceInfo();
  
  const safeAreaStyles = isNative ? {
    paddingTop: top ? `env(safe-area-inset-top, ${spacing.safeAreaTop}px)` : undefined,
    paddingBottom: bottom ? `env(safe-area-inset-bottom, ${spacing.safeAreaBottom}px)` : undefined,
    paddingLeft: left ? 'env(safe-area-inset-left)' : undefined,
    paddingRight: right ? 'env(safe-area-inset-right)' : undefined,
  } : {};

  return (
    <div className={className} style={safeAreaStyles}>
      {children}
    </div>
  );
};

export default SafeAreaView;
