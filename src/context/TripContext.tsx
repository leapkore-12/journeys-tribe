import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Vehicle } from '@/lib/mock-data';

export interface Stop {
  id: string;
  address: string;
}

export interface TripState {
  step: 1 | 2 | 3 | 4;
  startLocation: string;
  destination: string;
  destinationAddress: string;
  stops: Stop[];
  vehicle: Vehicle | null;
  convoy: User[];
  // Active trip state
  isActive: boolean;
  isPaused: boolean;
  distanceCovered: number;
  distanceRemaining: number;
  timeElapsed: number; // in seconds
  eta: number; // in minutes
}

interface TripContextType {
  tripState: TripState;
  setStep: (step: 1 | 2 | 3 | 4) => void;
  setStartLocation: (location: string) => void;
  setDestination: (destination: string, address?: string) => void;
  addStop: (address: string) => void;
  removeStop: (id: string) => void;
  setVehicle: (vehicle: Vehicle | null) => void;
  addConvoyMember: (user: User) => void;
  removeConvoyMember: (userId: string) => void;
  toggleConvoyMember: (user: User) => void;
  startTrip: () => void;
  pauseTrip: () => void;
  resumeTrip: () => void;
  finishTrip: () => void;
  updateProgress: (distance: number, time: number) => void;
  resetTrip: () => void;
}

const initialState: TripState = {
  step: 1,
  startLocation: 'Your location',
  destination: '',
  destinationAddress: '',
  stops: [],
  vehicle: null,
  convoy: [],
  isActive: false,
  isPaused: false,
  distanceCovered: 0,
  distanceRemaining: 241,
  timeElapsed: 0,
  eta: 367,
};

const TripContext = createContext<TripContextType | undefined>(undefined);

export const TripProvider = ({ children }: { children: ReactNode }) => {
  const [tripState, setTripState] = useState<TripState>(initialState);

  const setStep = (step: 1 | 2 | 3 | 4) => {
    setTripState(prev => ({ ...prev, step }));
  };

  const setStartLocation = (location: string) => {
    setTripState(prev => ({ ...prev, startLocation: location }));
  };

  const setDestination = (destination: string, address?: string) => {
    setTripState(prev => ({ 
      ...prev, 
      destination, 
      destinationAddress: address || destination 
    }));
  };

  const addStop = (address: string) => {
    const newStop: Stop = { id: Date.now().toString(), address };
    setTripState(prev => ({ ...prev, stops: [...prev.stops, newStop] }));
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
      distanceRemaining: Math.max(0, 241 - distance),
      timeElapsed: time,
      eta: Math.max(0, 367 - Math.floor(time / 60)),
    }));
  };

  const resetTrip = () => {
    setTripState(initialState);
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
        startTrip,
        pauseTrip,
        resumeTrip,
        finishTrip,
        updateProgress,
        resetTrip,
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
