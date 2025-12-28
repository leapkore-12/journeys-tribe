import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Car, ChevronRight, MapPin, X } from 'lucide-react';
import { useActiveConvoy } from '@/hooks/useActiveConvoy';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ActiveTripBarProps {
  bottomOffset?: number;
}

const ActiveTripBar = ({ bottomOffset = 80 }: ActiveTripBarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: activeConvoy, isLoading } = useActiveConvoy();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  const cleanupMembership = async () => {
    if (!user?.id || !activeConvoy) return;
    
    try {
      await supabase
        .from('convoy_members')
        .update({ status: 'left' })
        .eq('trip_id', activeConvoy.trip_id)
        .eq('user_id', user.id);
      
      queryClient.invalidateQueries({ queryKey: ['active-convoy'] });
    } catch (error) {
      console.error('Failed to cleanup membership:', error);
    }
  };

  const handleDismiss = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeConvoy || isDismissing) return;
    
    setIsDismissing(true);
    
    try {
      const { data: trip } = await supabase
        .from('trips')
        .select('status')
        .eq('id', activeConvoy.trip_id)
        .single();
      
      if (!trip || trip.status !== 'active') {
        await cleanupMembership();
        toast({ title: "Trip ended", description: "This trip is no longer active" });
      } else {
        setShowLeaveConfirm(true);
      }
    } catch (error) {
      console.error('Failed to check trip status:', error);
      toast({ title: "Error", description: "Could not verify trip status", variant: "destructive" });
    } finally {
      setIsDismissing(false);
    }
  };

  const handleLeaveConvoy = async () => {
    await cleanupMembership();
    toast({ title: "Left convoy", description: "You have left the convoy" });
    setShowLeaveConfirm(false);
  };

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
    <>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed left-4 right-4 z-50"
        style={{ bottom: bottomOffset + 16 }}
      >
        <button
          onClick={() => navigate('/trip/active')}
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
          <button
            onClick={handleDismiss}
            disabled={isDismissing}
            className="p-2 hover:bg-primary-foreground/20 rounded-full transition-colors"
            aria-label="Dismiss active trip"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1 text-sm font-medium">
            <span>View</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </button>
      </motion.div>

      <AlertDialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Convoy?</AlertDialogTitle>
            <AlertDialogDescription>
              This trip is still active. Are you sure you want to leave the convoy?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveConvoy}>
              Leave Convoy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ActiveTripBar;
