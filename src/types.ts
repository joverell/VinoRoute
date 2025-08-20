// src/types.ts

export interface Wine {
  lwin: string;
  name: string;
  type: string;
  producer:string;
  region: string;
  country: string;
  locationId?: string;
  locationName?: string;
}

export interface Rating {
  id: string;
  wineryId: string | number;
  userId: string;
  rating: number;
  comment?: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
}

export interface LocationType {
  id: string;
  name: string;
  mapImageUrl: string;
}

// The Winery and Region interfaces remain the same
export interface Winery {
  id:string | number;
  name: string;
  coords: { lat: number; lng: number };
  tags: string[];
  type: 'winery' | 'distillery' | 'custom'; // This will be deprecated
  locationTypeId?: string;
  locationType?: LocationType;
  region: string;
  openingHours: { [key: number]: { open: number; close: number } | null };
  address?: string;
  state?: string;
  url?: string;
  averageRating?: number;
  ratingCount?: number;
  wines?: Wine[];
}

export interface Region {
  name:string;
  center: { lat: number; lng: number };
  state: string;
}

export interface RegionBoundary {
  name: string;
  paths: { lat: number; lng: number }[];
}

// This interface is now more specific to handle the Firestore Timestamp
export interface SavedTour {
  id: string;
  userId: string;
  tourName: string;
  regionName: string;
  startTime: string;
  stops: { 
    wineryId: string | number; 
    duration: number;
    customData?: Winery; 
  }[];
  createdAt: { // This is how Firestore Timestamps are structured
    seconds: number;
    nanoseconds: number;
  };
}