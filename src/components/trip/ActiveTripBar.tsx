import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Car, ChevronRight, MapPin } from 'lucide-react';
import { useActiveConvoy } from '@/hooks/useActiveConvoy';

const ActiveTripBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: activeConvoy, isLoading } = useActiveConvoy();

  // Don't show on the active trip page itself
  if (location.pathname === '/active-trip' || location.pathname === '/trip/active') {
    return null;
  }

  // Don't show if no active convoy or still loading
  if (isLoading || !activeConvoy) {
    return null;
  }

  const destination = activeConvoy.trip.end_location || 'Destination';

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed bottom-20 left-4 right-4 z-50"
    >
      <button
        onClick={() => navigate('/active-trip')}
        className="w-full bg-primary text-primary-foreground px-4 py-3 rounded-full shadow-lg flex items-center gap-3 hover:bg-primary/90 transition-colors"
      >
        <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center flex-shrink-0">
          <Car className="h-5 w-5" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="font-semibold text-sm">Active Trip</p>
          <p className="text-xs text-primary-foreground/80 truncate flex items-center gap-1">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            {destination}
          </p>
        </div>
        <div className="flex items-center gap-1 text-sm font-medium">
          <span>View</span>
          <ChevronRight className="h-4 w-4" />
        </div>
      </button>
    </motion.div>
  );
};

export default ActiveTripBar;
