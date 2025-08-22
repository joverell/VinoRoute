'use client';

import { Map, AdvancedMarker, InfoWindow, useMap, useMapsLibrary, Pin } from '@vis.gl/react-google-maps';
import { Winery } from '@/types';
import { useEffect, useState } from 'react';
import { formatAddress } from '@/utils/formatAddress';
import { ItineraryStop } from '@/utils/itineraryLogic';
import { Region } from '@/types';
import { ClickedPoi } from './HomePage';
import { regionBoundaries } from '@/data/regionBoundaries';
import { PotentialLocation } from '@/app/api/search-area/route';
import Polygon from './Polygon';
import Directions from './Directions';
import NumberedPin from './NumberedPin';
import WineryPin from './WineryPin';

interface MapProps {
  itinerary: ItineraryStop[] | null;
  directions: google.maps.DirectionsResult | null;
  onSelectWinery: (winery: Winery | null) => void;
  availableWineries: Winery[];
  selectedRegion: Region;
  clickedPoi: ClickedPoi | null;
  onMapClick: (poi: ClickedPoi | null) => void;
  onAddPoiToTrip: (poi: ClickedPoi) => void;
  showRegionOverlay: boolean;
  mapBounds: google.maps.LatLngBoundsLiteral | null;
  onBoundsChanged: (bounds: google.maps.LatLngBounds | null) => void;
  onSearchThisArea: () => void;
  isSearching: boolean;
  potentialLocations?: PotentialLocation[];
  onSelectPotentialLocation: (location: PotentialLocation) => void;
  highlightedWinery: Winery | null;
  selectedWinery: Winery | null;
}

export default function MapComponent(props: MapProps) {
  const {
    itinerary, directions, onSelectWinery, availableWineries,
    selectedRegion, clickedPoi, onMapClick, onAddPoiToTrip, showRegionOverlay,
    mapBounds, onBoundsChanged, onSearchThisArea, isSearching, potentialLocations = [],
    onSelectPotentialLocation, highlightedWinery, selectedWinery
  } = props;

  const map = useMap();
  const mapsLibrary = useMapsLibrary('maps');
  const routesLibrary = useMapsLibrary('routes');
  const placesLibrary = useMapsLibrary('places');
  const geocodingLibrary = useMapsLibrary('geocoding');

  const [potentialLocationCoords, setPotentialLocationCoords] = useState<{[key: string]: google.maps.LatLngLiteral}>({});

  useEffect(() => {
    if (map) {
      if (directions) {
        const bounds = new window.google.maps.LatLngBounds();
        directions.routes[0].legs.forEach(leg => {
          bounds.extend(leg.start_location);
          bounds.extend(leg.end_location);
        });
        map.fitBounds(bounds);
      } else if (mapBounds) {
        map.fitBounds(mapBounds);
      } else {
        map.panTo(selectedRegion.center);
        map.setZoom(10);
      }
    }
  }, [directions, selectedRegion, mapBounds, map]);

  useEffect(() => {
    if (!geocodingLibrary || potentialLocations.length === 0) {
        setPotentialLocationCoords({});
        return;
    }

    const geocoder = new geocodingLibrary.Geocoder();
    const newCoords: { [key: string]: google.maps.LatLngLiteral } = {};
    let processedCount = 0;
    let isCancelled = false;

    potentialLocations.forEach(location => {
        geocoder.geocode({ 'placeId': location.placeId }, (results, status) => {
            if (isCancelled) return;

            if (status === 'OK' && results && results[0]) {
                newCoords[location.placeId] = {
                    lat: results[0].geometry.location.lat(),
                    lng: results[0].geometry.location.lng(),
                };
            }
            processedCount++;
            if (processedCount === potentialLocations.length) {
                if (!isCancelled) {
                    setPotentialLocationCoords(newCoords);
                }
            }
        });
    });

    return () => {
        isCancelled = true;
    };
}, [geocodingLibrary, potentialLocations]);


  const itineraryWineryIds = new Set(itinerary?.map(stop => stop.winery.id) || []);
  const otherAvailableWineries = availableWineries.filter(winery => !itineraryWineryIds.has(winery.id));

  return (
    <div className="relative w-full h-full">
      <Map
        mapId="DEMO_MAP_ID"
        defaultCenter={selectedRegion.center}
        defaultZoom={10}
        streetViewControl={false}
        mapTypeControl={false}
        fullscreenControl={false}
        onIdle={(e) => {
            if (e.map) {
                onBoundsChanged(e.map.getBounds() || null);
            }
        }}
        onClick={(e) => {
            if (e.detail.placeId && e.detail.latLng) {
                const latLng = { lat: e.detail.latLng.lat, lng: e.detail.latLng.lng };
                if (!placesLibrary || !map) return;
                const service = new placesLibrary.PlacesService(map);
                service.getDetails({ placeId: e.detail.placeId, fields: ['name'] }, (place, status) => {
                    if (status === 'OK' && place && place.name) {
                        onMapClick({ name: place.name, coords: latLng });
                    }
                });
            } else {
                onSelectWinery(null);
                onMapClick(null);
            }
        }}
        style={{ width: '100%', height: '100%' }}
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

      {directions && <Directions directions={directions} options={{ suppressMarkers: true, polylineOptions: { strokeColor: '#FF5757', strokeWeight: 5 } }} />}
      
      {otherAvailableWineries.map((winery) => (
        <AdvancedMarker
          key={winery.id}
          position={winery.coords}
          title={winery.name}
          onClick={() => {
            onSelectWinery(winery);
            onMapClick(null);
          }}
        >
          <WineryPin winery={winery} isSelected={selectedWinery?.id === winery.id} />
        </AdvancedMarker>
      ))}
      
      {itinerary && itinerary.map((stop, index) => (
        <AdvancedMarker
          key={stop.winery.id}
          position={stop.winery.coords}
          title={stop.winery.name}
          onClick={() => {
            onSelectWinery(stop.winery);
            onMapClick(null);
          }}
        >
          <NumberedPin number={index + 1} color={selectedWinery?.id === stop.winery.id ? '#000000' : '#FF5757'} />
        </AdvancedMarker>
      ))}

      {potentialLocations.map((location, index) => {
        const coords = potentialLocationCoords[location.placeId];
        if (!coords) return null;

        return (
          <AdvancedMarker
            key={location.placeId}
            position={coords}
            title={location.name}
            onClick={() => onSelectPotentialLocation(location)}
          >
            <NumberedPin number={index + 1} color="#4299E1" />
          </AdvancedMarker>
        );
      })}

      {highlightedWinery && (
        <InfoWindow
          position={highlightedWinery.coords}
          onCloseClick={() => onSelectWinery(null)}
        >
          <div className="p-2">
            <h4 className="font-bold text-gray-800">{highlightedWinery.name}</h4>
            <p className="text-sm text-gray-600">{formatAddress(highlightedWinery.address)}</p>
            <button
                onClick={() => onSelectWinery(highlightedWinery)}
                className="w-full px-3 py-1 mt-2 text-sm font-bold text-white bg-rose-500 rounded-lg hover:bg-rose-600"
            >
              View Details
            </button>
          </div>
        </InfoWindow>
      )}

      {clickedPoi && (
        <InfoWindow
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
        </InfoWindow>
      )}
    </Map>
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <button
          onClick={onSearchThisArea}
          disabled={isSearching}
          className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSearching ? 'Searching...' : 'Search This Area'}
        </button>
      </div>
    </div>
  );
}