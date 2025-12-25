import { useCurrentProfile } from './useProfile';

export type PlanType = 'free' | 'paid';

export interface FeatureAccess {
  canCreateConvoy: boolean;
  canUsePerTripVisibility: boolean;
  canUseTribe: boolean;
  canTrackLive: boolean;
  canAutoTag: boolean;
  maxTripsPerMonth: number;
  maxVehicles: number;
  maxPhotosPerVehicle: number;
}

export const useIsPaidUser = () => {
  const { data: profile, isLoading } = useCurrentProfile();
  return {
    isPaid: profile?.plan_type === 'paid',
    isLoading,
    planType: (profile?.plan_type || 'free') as PlanType,
  };
};

export const useFeatureAccess = (): FeatureAccess & { isLoading: boolean } => {
  const { isPaid, isLoading } = useIsPaidUser();

  return {
    isLoading,
    canCreateConvoy: isPaid,
    canUsePerTripVisibility: isPaid,
    canUseTribe: isPaid,
    canTrackLive: isPaid,
    canAutoTag: isPaid,
    maxTripsPerMonth: isPaid ? Infinity : 2,
    maxVehicles: isPaid ? Infinity : 1,
    maxPhotosPerVehicle: isPaid ? Infinity : 5,
  };
};

export const useMonthlyTripLimit = () => {
  const { data: profile } = useCurrentProfile();
  const { isPaid } = useIsPaidUser();

  if (isPaid) {
    return { canCreateTrip: true, tripsUsed: 0, tripsRemaining: Infinity };
  }

  const tripsUsed = profile?.monthly_trip_count || 0;
  const maxTrips = 2;
  
  return {
    canCreateTrip: tripsUsed < maxTrips,
    tripsUsed,
    tripsRemaining: Math.max(0, maxTrips - tripsUsed),
  };
};
