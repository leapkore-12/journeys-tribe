import { ReactNode } from 'react';

interface MobileContainerProps {
  children: ReactNode;
}

const MobileContainer = ({ children }: MobileContainerProps) => {
  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center">
      <div className="relative w-full max-w-[430px] h-screen max-h-[932px] bg-background overflow-y-auto scrollbar-hide shadow-2xl">
        {children}
      </div>
    </div>
  );
};

export default MobileContainer;
