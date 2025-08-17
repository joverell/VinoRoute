'use client';

import { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { Winery, Region } from '@/types';

interface AppProviderProps {
  children: ReactNode;
  allWineries: Winery[];
  regions: Region[];
}

interface AppContextType {
  tripStops: TripStop[];
  setTripStops: React.Dispatch<React.SetStateAction<TripStop[]>>;
  selectedRegion: Region | null;
  setSelectedRegion: React.Dispatch<React.SetStateAction<Region | null>>;
  filterMode: 'region' | 'state';
  setFilterMode: React.Dispatch<React.SetStateAction<'region' | 'state'>>;
  availableWineries: Winery[];
  allWineries: Winery[];
  regions: Region[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export interface TripStop {
  winery: Winery;
  duration: number;
}

export function AppProvider({ children, allWineries, regions }: AppProviderProps) {
  const [tripStops, setTripStops] = useState<TripStop[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(regions[0] || null);
  const [filterMode, setFilterMode] = useState<'region' | 'state'>('region');

  const availableWineries = useMemo(() => {
    if (!selectedRegion) return [];
    return allWineries.filter(w => {
      if (filterMode === 'state') {
        return w.state === selectedRegion.state;
      }
      return w.region === selectedRegion.name;
    });
  }, [allWineries, filterMode, selectedRegion]);

  const value = {
    tripStops,
    setTripStops,
    selectedRegion,
    setSelectedRegion,
    filterMode,
    setFilterMode,
    availableWineries,
    allWineries,
    regions,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}