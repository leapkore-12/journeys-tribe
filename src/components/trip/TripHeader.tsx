import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, Phone } from 'lucide-react';
import logoWhite from '@/assets/logo-white.svg';

interface TripHeaderProps {
  showBack?: boolean;
  showBell?: boolean;
  showSOS?: boolean;
  onSOSClick?: () => void;
  backTo?: string;
  onBack?: () => void;
}

const TripHeader = ({ 
  showBack = true, 
  showBell = true, 
  showSOS = false,
  onSOSClick,
  backTo = '/feed',
  onBack,
}: TripHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between px-4 h-14 bg-background">
      <div className="w-11">
        {showBack && (
          <button 
            onClick={() => onBack ? onBack() : navigate(backTo)}
            className="min-h-11 min-w-11 flex items-center justify-center active:opacity-70"
          >
            <ChevronLeft className="h-6 w-6 text-foreground" />
          </button>
        )}
      </div>
      
      <img src={logoWhite} alt="RoadTribe" className="h-6" />
      
      <div className="w-11">
        {showBell && (
          <button 
            onClick={() => navigate('/notifications')}
            className="min-h-11 min-w-11 flex items-center justify-center active:opacity-70"
          >
            <Bell className="h-6 w-6 text-foreground" />
          </button>
        )}
        {showSOS && (
          <button 
            onClick={onSOSClick}
            className="min-h-11 min-w-11 flex items-center justify-center bg-primary rounded-full active:opacity-70"
          >
            <Phone className="h-5 w-5 text-primary-foreground" />
          </button>
        )}
      </div>
    </header>
  );
};

export default TripHeader;
