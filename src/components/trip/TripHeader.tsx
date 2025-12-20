import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, Phone } from 'lucide-react';
import logoWhite from '@/assets/logo-white.svg';

interface TripHeaderProps {
  showBack?: boolean;
  showBell?: boolean;
  showSOS?: boolean;
  onSOSClick?: () => void;
  backTo?: string;
}

const TripHeader = ({ 
  showBack = true, 
  showBell = true, 
  showSOS = false,
  onSOSClick,
  backTo = '/feed'
}: TripHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between px-4 h-14 bg-background">
      <div className="w-10">
        {showBack && (
          <button 
            onClick={() => navigate(backTo)}
            className="w-10 h-10 flex items-center justify-center"
          >
            <ChevronLeft className="h-6 w-6 text-foreground" />
          </button>
        )}
      </div>
      
      <img src={logoWhite} alt="RoadTribe" className="h-6" />
      
      <div className="w-10">
        {showBell && (
          <button 
            onClick={() => navigate('/notifications')}
            className="w-10 h-10 flex items-center justify-center"
          >
            <Bell className="h-5 w-5 text-foreground" />
          </button>
        )}
        {showSOS && (
          <button 
            onClick={onSOSClick}
            className="w-10 h-10 flex items-center justify-center bg-primary rounded-full"
          >
            <Phone className="h-4 w-4 text-primary-foreground" />
          </button>
        )}
      </div>
    </header>
  );
};

export default TripHeader;
