'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

const MAP_LIBRARIES: ('maps' | 'routes' | 'marker' | 'places')[] = ['maps', 'routes', 'marker', 'places'];

interface GoogleMapsContextType {
  isLoaded: boolean;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
});

export const useGoogleMaps = () => useContext(GoogleMapsContext);

export function GoogleMapsProvider({ children }: { children: ReactNode }) {
  // If you are seeing an `ApiTargetBlockedMapError` in the console, it means that the
  // Google Maps API key is not authorized to use the services required by this application.
  // To fix this, you need to enable the following APIs in the Google Cloud Platform console
  // for the project associated with your API key:
  //
  // - Maps JavaScript API
  // - Places API
  // - Directions API
  // - Geocoding API
  //
  // For more information, see:
  // https://developers.google.com/maps/documentation/javascript/error-messages#api-target-blocked-map-error
  const { isLoaded } = useJsApiLoader({
    id: 'script-loader',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries: MAP_LIBRARIES,
  });

  return (
    <GoogleMapsContext.Provider value={{ isLoaded }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}
