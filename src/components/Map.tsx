'use client';

import { GoogleMap, MarkerF, DirectionsRenderer, InfoWindowF, Polygon } from '@react-google-maps/api';
import { Winery } from '@/types';
import { useEffect, useRef, useMemo } from 'react';
import { ItineraryStop } from '@/utils/itineraryLogic';
import { Region } from '@/types';
import { ClickedPoi } from './HomePage';
import { regionBoundaries } from '@/data/regionBoundaries';

interface MapProps {
  isLoaded: boolean;
  itinerary: ItineraryStop[] | null;
  directions: google.maps.DirectionsResult | null;
  onSelectWinery: (winery: Winery | null) => void;
  availableWineries: Winery[];
  selectedRegion: Region;
  clickedPoi: ClickedPoi | null;
  onMapClick: (poi: ClickedPoi | null) => void;
  onAddPoiToTrip: (poi: ClickedPoi) => void;
  showRegionOverlay: boolean;
  mapBounds: google.maps.LatLngBoundsLiteral | null; // New prop
}

const createNumberedIcon = (number: number, isLoaded: boolean) => {
  if (!isLoaded) return undefined;
  const svg = `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="14" fill="#FF5757" stroke="white" stroke-width="2"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white">${number}</text></svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(32, 32),
    anchor: new google.maps.Point(16, 16),
  };
};

export default function MapComponent(props: MapProps) {
  const { isLoaded, itinerary, directions, onSelectWinery, availableWineries, selectedRegion, clickedPoi, onMapClick, onAddPoiToTrip, showRegionOverlay, mapBounds } = props;

  const mapRef = useRef<google.maps.Map | null>(null);

  const wineryIcon = useMemo(() => {
    if (!isLoaded) return undefined;
    return {
      path: 'M8.5,1.5 C8.5,1.5 8.5,4.5 9.5,4.5 C10.5,4.5 10.5,1.5 10.5,1.5 M8,5 L11,5 L11,6 C11,6 12,6.5 12,8 L12,18 C12,19 11,20 9.5,20 C8,20 7,19 7,18 L7,8 C7,6.5 8,6 8,6 L8,5 M9.5,7 C9.5,7 9,7.5 9,8 L10,8 C10,7.5 9.5,7 9.5,7',
      fillColor: '#FF5757',
      fillOpacity: 1.0,
      strokeWeight: 1,
      strokeColor: '#FFFFFF',
      rotation: 0,
      scale: 1.5,
      anchor: new google.maps.Point(9.5, 20),
    };
  }, [isLoaded]);

  const distilleryIcon = useMemo(() => {
    if (!isLoaded) return undefined;
    return {
      path: 'M53.037,22.997c45.328,0,90.655,0,135.983,0 c0.462,32.558,1.689,62.144,7.999,90.989c6.033,27.583,16.253,53.933,19.997,78.99c5.57,37.27-10.411,63.548-32.996,78.99 c-5.856,4.005-22.15,10.517-22.997,15.998c-0.606,3.93,11.369,21.283,13.999,26.997c9.577,20.81,16.729,36.086-6,46.994 c-32.329,0-64.658,0-96.987,0c-22.155-10.187-15.856-25.577-6-46.994c1.861-4.043,14.256-22.396,13.999-25.997 c-0.469-6.562-16.75-12.727-22.998-16.998c-21.745-14.868-38.533-39.579-32.996-77.99c3.591-24.906,13.543-50.564,19.998-77.99 c6.645-28.237,6.786-58.19,7.999-89.989C51.952,24.578,51.872,23.165,53.037,22.997z',
      fillColor: '#333333',
      fillOpacity: 1.0,
      strokeWeight: 1,
      strokeColor: '#FFFFFF',
      rotation: 0,
      scale: 0.05,
      anchor: new google.maps.Point(120, 200),
    };
  }, [isLoaded]);

  useEffect(() => {
    if (mapRef.current) {
      if (directions) {
        const bounds = new window.google.maps.LatLngBounds();
        directions.routes[0].legs.forEach(leg => {
          bounds.extend(leg.start_location);
          bounds.extend(leg.end_location);
        });
        mapRef.current.fitBounds(bounds);
      } else if (mapBounds) {
        mapRef.current.fitBounds(mapBounds);
      } else {
        mapRef.current.panTo(selectedRegion.center);
        mapRef.current.setZoom(10);
      }
    }
  }, [directions, selectedRegion, mapBounds]);

  const itineraryWineryIds = new Set(itinerary?.map(stop => stop.winery.id) || []);
  const otherAvailableWineries = availableWineries.filter(winery => !itineraryWineryIds.has(winery.id));

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '100%' }}
      center={selectedRegion.center}
      zoom={10}
      options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
      onLoad={(map) => { mapRef.current = map; }}
      onClick={(e) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const event = e as any;
        if (event.placeId) {
          event.stop();
          const latLng = event.latLng!.toJSON();
          const service = new window.google.maps.places.PlacesService(mapRef.current!);
          service.getDetails({ placeId: event.placeId, fields: ['name'] }, (place, status) => {
            if (status === 'OK' && place && place.name) {
              onMapClick({ name: place.name, coords: latLng });
            }
          });
        } else {
          onSelectWinery(null);
          onMapClick(null);
        }
      }}
    >
      {showRegionOverlay && regionBoundaries.map(region => (
        <Polygon
          key={region.name}
          paths={region.paths}
          options={{
            fillColor: '#4FD1C5',
            fillOpacity: 0.2,
            strokeColor: '#4FD1C5',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            clickable: false,
          }}
        />
      ))}

      {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true, polylineOptions: { strokeColor: '#FF5757', strokeWeight: 5 } }} />}
      
      {otherAvailableWineries.map((winery) => (
        <MarkerF 
          key={winery.id} 
          position={winery.coords} 
          title={winery.name} 
          icon={winery.type === 'distillery' ? distilleryIcon : wineryIcon} 
          onClick={(e) => {
            e.stop();
            onSelectWinery(winery);
            onMapClick(null);
          }}
        />
      ))}
      
      {itinerary && itinerary.map((stop, index) => (
        <MarkerF
          key={stop.winery.id}
          position={stop.winery.coords}
          title={stop.winery.name}
          icon={createNumberedIcon(index + 1, isLoaded)}
          onClick={(e) => {
            e.stop();
            onSelectWinery(stop.winery);
            onMapClick(null);
          }}
        />
      ))}

      {clickedPoi && (
        <InfoWindowF
          position={clickedPoi.coords}
          onCloseClick={() => onMapClick(null)}
        >
          <div className="p-2">
            <h4 className="font-bold text-gray-800">{clickedPoi.name}</h4>
            <button
              onClick={() => onAddPoiToTrip(clickedPoi)}
              className="w-full px-3 py-1 mt-2 text-sm font-bold text-white bg-rose-500 rounded-lg hover:bg-rose-600"
            >
              Add to My Tour
            </button>
          </div>
        </InfoWindowF>
      )}
    </GoogleMap>
  );
}