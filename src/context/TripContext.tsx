import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Vehicle } from '@/lib/mock-data';

export interface Stop {
  id: string;
  address: string;
  coordinates?: [number, number] | null;
}

export interface TripState {
  step: 1 | 2 | 3 | 4;
  startLocation: string;
  startCoordinates: [number, number] | null;
  destination: string;
  destinationAddress: string;
  destinationCoordinates: [number, number] | null;
  stops: Stop[];
  vehicle: Vehicle | null;
  convoy: User[];
  // Route info from Mapbox
  routeDistance: number | null; // in km
  routeDuration: number | null; // in minutes
  routeCoordinates: [number, number][] | null;
  // Active trip state
  isActive: boolean;
  isPaused: boolean;
  distanceCovered: number;
  distanceRemaining: number;
  timeElapsed: number; // in seconds
  eta: number; // in minutes
  // Trip photos (staged before upload)
  tripPhotos: File[];
  // Database trip ID for tracking active trip
  activeTripId: string | null;
}

interface TripContextType {
  tripState: TripState;
  setStep: (step: 1 | 2 | 3 | 4) => void;
  setStartLocation: (location: string, coordinates?: [number, number]) => void;
  setDestination: (destination: string, address?: string, coordinates?: [number, number]) => void;
  addStop: (address: string, coordinates?: [number, number]) => void;
  removeStop: (id: string) => void;
  setVehicle: (vehicle: Vehicle | null) => void;
  addConvoyMember: (user: User) => void;
  removeConvoyMember: (userId: string) => void;
  toggleConvoyMember: (user: User) => void;
  setRouteInfo: (distance: number, duration: number, coordinates: [number, number][]) => void;
  startTrip: () => void;
  pauseTrip: () => void;
  resumeTrip: () => void;
  finishTrip: () => void;
  updateProgress: (distance: number, time: number) => void;
  resetTrip: () => void;
  setTripPhotos: (photos: File[]) => void;
  addTripPhoto: (photo: File) => void;
  removeTripPhoto: (index: number) => void;
  setActiveTripId: (tripId: string | null) => void;
}

const initialState: TripState = {
  step: 1,
  startLocation: 'Your location',
  startCoordinates: null,
  destination: '',
  destinationAddress: '',
  destinationCoordinates: null,
  stops: [],
  vehicle: null,
  convoy: [],
  routeDistance: null,
  routeDuration: null,
  routeCoordinates: null,
  isActive: false,
  isPaused: false,
  distanceCovered: 0,
  distanceRemaining: 0,
  timeElapsed: 0,
  eta: 0,
  tripPhotos: [],
  activeTripId: null,
};

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider = ({ children }: { children: ReactNode }) => {
  const [tripState, setTripState] = useState<TripState>(initialState);

  const setStep = (step: 1 | 2 | 3 | 4) => {
    setTripState(prev => ({ ...prev, step }));
  };

  const setStartLocation = (location: string, coordinates?: [number, number]) => {
    setTripState(prev => ({ 
      ...prev, 
      startLocation: location,
      startCoordinates: coordinates || null,
    }));
  };

  const setDestination = (destination: string, address?: string, coordinates?: [number, number]) => {
    setTripState(prev => ({ 
      ...prev, 
      destination, 
      destinationAddress: address || destination,
      destinationCoordinates: coordinates || null,
    }));
  };

  const addStop = (address: string, coordinates?: [number, number]) => {
    const newStop: Stop = { id: Date.now().toString(), address, coordinates };
    setTripState(prev => ({ ...prev, stops: [...prev.stops, newStop] }));
  };

  const setRouteInfo = (distance: number, duration: number, coordinates: [number, number][]) => {
    setTripState(prev => ({
      ...prev,
      routeDistance: distance,
      routeDuration: duration,
      routeCoordinates: coordinates,
      distanceRemaining: distance,
      eta: duration,
    }));
  };

  const removeStop = (id: string) => {
    setTripState(prev => ({ 
      ...prev, 
      stops: prev.stops.filter(s => s.id !== id) 
    }));
  };

  const setVehicle = (vehicle: Vehicle | null) => {
    setTripState(prev => ({ ...prev, vehicle }));
  };

  const addConvoyMember = (user: User) => {
    setTripState(prev => {
      if (prev.convoy.find(u => u.id === user.id)) return prev;
      return { ...prev, convoy: [...prev.convoy, user] };
    });
  };

  const removeConvoyMember = (userId: string) => {
    setTripState(prev => ({
      ...prev,
      convoy: prev.convoy.filter(u => u.id !== userId),
    }));
  };

  const toggleConvoyMember = (user: User) => {
    setTripState(prev => {
      const exists = prev.convoy.find(u => u.id === user.id);
      if (exists) {
        return { ...prev, convoy: prev.convoy.filter(u => u.id !== user.id) };
      }
      return { ...prev, convoy: [...prev.convoy, user] };
    });
  };

  const startTrip = () => {
    setTripState(prev => ({ 
      ...prev, 
      isActive: true, 
      isPaused: false,
      distanceCovered: 0,
      timeElapsed: 0,
    }));
  };

  const pauseTrip = () => {
    setTripState(prev => ({ ...prev, isPaused: true }));
  };

  const resumeTrip = () => {
    setTripState(prev => ({ ...prev, isPaused: false }));
  };

  const finishTrip = () => {
    setTripState(prev => ({ ...prev, isActive: false, isPaused: false }));
  };

  const updateProgress = (distance: number, time: number) => {
    setTripState(prev => ({
      ...prev,
      distanceCovered: distance,
      distanceRemaining: Math.max(0, (prev.routeDistance || 0) - distance),
      timeElapsed: time,
      // Calculate ETA based on remaining distance and current progress
      eta: prev.routeDistance && prev.routeDuration && distance > 0
        ? Math.max(0, Math.round(((prev.routeDistance - distance) / prev.routeDistance) * prev.routeDuration))
        : prev.eta,
    }));
  };

  const resetTrip = () => {
    setTripState(initialState);
  };

  const setTripPhotos = (photos: File[]) => {
    setTripState(prev => ({ ...prev, tripPhotos: photos }));
  };

  const addTripPhoto = (photo: File) => {
    setTripState(prev => ({ ...prev, tripPhotos: [...prev.tripPhotos, photo] }));
  };

  const removeTripPhoto = (index: number) => {
    setTripState(prev => ({
      ...prev,
      tripPhotos: prev.tripPhotos.filter((_, i) => i !== index),
    }));
  };

  const setActiveTripId = (tripId: string | null) => {
    setTripState(prev => ({ ...prev, activeTripId: tripId }));
  };

  return (
    <TripContext.Provider
      value={{
        tripState,
        setStep,
        setStartLocation,
        setDestination,
        addStop,
        removeStop,
        setVehicle,
        addConvoyMember,
        removeConvoyMember,
        toggleConvoyMember,
        setRouteInfo,
        startTrip,
        pauseTrip,
        resumeTrip,
        finishTrip,
        updateProgress,
        resetTrip,
        setTripPhotos,
        addTripPhoto,
        removeTripPhoto,
        setActiveTripId,
      }}
    >
      {children}
    </TripContext.Provider>
  );
};

export const useTrip = () => {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrip must be used within a TripProvider');
  }
  return context;
};
