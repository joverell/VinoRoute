'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import MapComponent from '@/components/Map';
import Sidebar from '@/components/Sidebar';
import { Winery, Region, SavedTour } from '@/types';
import { calculateRoute, ItineraryStop } from '@/utils/itineraryLogic';
import PrintableItinerary from './PrintableItinerary';
import { db, auth } from '@/utils/firebase';
import { collection, getDocs, addDoc, query, where, onSnapshot, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useJsApiLoader } from '@react-google-maps/api';

export interface TripStop {
  winery: Winery;
  duration: number;
}
export interface PrepopulatedStop { name: string; address: string; }
export interface ClickedPoi { name: string; coords: google.maps.LatLngLiteral; }

const MAP_LIBRARIES: ('maps' | 'routes' | 'marker' | 'places')[] = ['maps', 'routes', 'marker', 'places'];
const LOCAL_STORAGE_KEY = 'wineryTourData';

export default function HomePage() {
  const [allLocations, setAllLocations] = useState<Winery[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [tripStops, setTripStops] = useState<TripStop[]>([]);
  const [itinerary, setItinerary] = useState<ItineraryStop[] | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [startTime, setStartTime] = useState<string>('');
  const [defaultDuration, setDefaultDuration] = useState<number>(60);
  const [selectedWinery, setSelectedWinery] = useState<Winery | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [includeDistilleries, setIncludeDistilleries] = useState(true);
  const [clickedPoi, setClickedPoi] = useState<ClickedPoi | null>(null);
  const [prepopulatedStop, setPrepopulatedStop] = useState<PrepopulatedStop | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [savedTours, setSavedTours] = useState<SavedTour[]>([]);
  const [showRegionOverlay, setShowRegionOverlay] = useState(false);
  const [filterMode, setFilterMode] = useState<'region' | 'state'>('region');
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBoundsLiteral | null>(null); // <-- NEW STATE FOR BOUNDS
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const searchParams = useSearchParams();

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries: MAP_LIBRARIES,
  });

  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  useEffect(() => {
    if (isLoaded) {
      directionsServiceRef.current = new window.google.maps.DirectionsService();
      geocoderRef.current = new window.google.maps.Geocoder();
    }
  }, [isLoaded]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => { setUser(currentUser); });
    return () => unsubscribe();
  }, []);

  const handleLoadTour = useCallback((tour: SavedTour, locations: Winery[], allRegions: Region[]) => {
    const loadedStops = tour.stops.map(stop => {
      const winery = stop.customData 
        ? stop.customData as Winery 
        : locations.find(loc => loc.id === stop.wineryId);
      return winery ? { winery, duration: stop.duration } : null;
    }).filter(Boolean) as TripStop[];

    const regionToSelect = allRegions.find(r => r.name === tour.regionName) || null;
    
    if (regionToSelect) {
      setSelectedRegion(regionToSelect);
      setFilterMode('region');
    }
    setTripStops(loadedStops);
    setStartTime(tour.startTime);
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "locations"));

        const stateMap: { [key: string]: string } = { VIC: "Victoria", SA: "South Australia", WA: "Western Australia", NSW: "New South Wales", TAS: "Tasmania", QLD: "Queensland", ACT: "ACT" };

        const locationsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          const regionParts = data.region.split(', ');
          const stateAbbr = regionParts[regionParts.length - 1];
          const state = stateMap[stateAbbr] || "Other";
          return { ...data, id: doc.id, state: state } as Winery;
        });

        setAllLocations(locationsData);

        const regionMap = new Map<string, Region>();
        locationsData.forEach(loc => {
          if (!regionMap.has(loc.region)) {
            const newRegion: Region = {
              name: loc.region,
              center: loc.coords,
              state: loc.state!,
            };
            regionMap.set(loc.region, newRegion);
          }
        });
        const dynamicRegions = Array.from(regionMap.values()).sort((a, b) => a.state.localeCompare(b.state) || a.name.localeCompare(b.name));
        setRegions(dynamicRegions);
        
        const sharedTourId = searchParams.get('tour');
        if (sharedTourId) {
          const tourDocRef = doc(db, 'tours', sharedTourId);
          const tourDocSnap = await getDoc(tourDocRef);
          if (tourDocSnap.exists()) {
            const tourData = { id: tourDocSnap.id, ...tourDocSnap.data() } as SavedTour;
            handleLoadTour(tourData, locationsData, dynamicRegions);
          } else {
            console.warn("Shared tour not found.");
            if (dynamicRegions.length > 0) setSelectedRegion(dynamicRegions[0]);
          }
        } else {
          const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (savedData) {
            try {
              const { tripStops: savedStops, startTime, selectedRegionName, includeDistilleries, filterMode, defaultDuration } = JSON.parse(savedData);

              const rehydratedStops = savedStops.map((stop: TripStop) => {
                if (stop.winery.type && stop.winery.type !== 'winery') {
                  return stop;
                }
                const freshWinery = locationsData.find(loc => loc.id === stop.winery.id);
                return freshWinery ? { ...stop, winery: freshWinery } : null;
              }).filter(Boolean);

              setTripStops(rehydratedStops);
              setStartTime(startTime);
              setDefaultDuration(defaultDuration || 60);
              setIncludeDistilleries(includeDistilleries === undefined ? true : includeDistilleries);
              setFilterMode(filterMode || 'region');

              const regionToSelect = dynamicRegions.find(r => r.name === selectedRegionName) || dynamicRegions[0] || null;
              setSelectedRegion(regionToSelect);
            } catch (e) {
              console.error("Failed to parse saved tour data, starting fresh.", e);
              if (dynamicRegions.length > 0) setSelectedRegion(dynamicRegions[0]);
            }
          } else {
            if (dynamicRegions.length > 0) setSelectedRegion(dynamicRegions[0]);
          }
        }
      } catch (error) {
        console.error("Error initializing app data: ", error);
      } finally {
        setIsInitialLoad(false);
      }
    };
    initializeApp();
  }, [searchParams, handleLoadTour]);

  useEffect(() => {
    if (isInitialLoad || allLocations.length === 0) {
      return;
    }
    const dataToSave = {
      tripStops,
      startTime,
      selectedRegionName: selectedRegion?.name,
      includeDistilleries,
      filterMode,
      defaultDuration,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
  }, [tripStops, startTime, selectedRegion, includeDistilleries, filterMode, defaultDuration, allLocations, isInitialLoad]);

  useEffect(() => {
    if (user && allLocations.length > 0) {
      const toursQuery = query(collection(db, "tours"), where("userId", "==", user.uid));
      const unsubscribe = onSnapshot(toursQuery, (querySnapshot) => {
        const toursData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SavedTour[];
        setSavedTours(toursData);
      });
      return () => unsubscribe();
    } else {
      setSavedTours([]);
    }
  }, [user, allLocations]);

  useEffect(() => {
    const recalculate = async () => {
      if (!isLoaded || !directionsServiceRef.current) return;
      if (tripStops.length < 2 || !startTime) {
        setDirections(null);
        if (tripStops.length === 1 && startTime) {
          const stop = tripStops[0];
          setItinerary([{ winery: stop.winery, arrivalTime: new Date(startTime), departureTime: new Date(new Date(startTime).getTime() + stop.duration * 60000) }]);
        } else {
          setItinerary(null);
        }
        return;
      }
      try {
        const { itinerary: calculatedItinerary, directions: calculatedDirections } = await calculateRoute(directionsServiceRef.current, tripStops, startTime, false);
        setItinerary(calculatedItinerary);
        setDirections(calculatedDirections);
      } catch (error) {
        console.error("Error calculating itinerary: ", error);
        setItinerary(null);
        setDirections(null);
      }
    };
    recalculate();
  }, [tripStops, startTime, isLoaded]);

  const handleAddToTrip = (winery: Winery) => {
    if (!tripStops.find(stop => stop.winery.id === winery.id)) {
      const newStop: TripStop = { winery, duration: defaultDuration };
      setTripStops([...tripStops, newStop]);
    }
  };
  
  const handleAddPoiToTrip = (poi: ClickedPoi) => {
    if (!selectedRegion) return;
    const customWinery: Winery = {
      id: Date.now(),
      name: poi.name,
      coords: poi.coords,
      tags: ['Point of Interest'],
      type: 'custom',
      region: selectedRegion.name,
      openingHours: {},
      visitDuration: defaultDuration,
    };
    const newStop: TripStop = { winery: customWinery, duration: defaultDuration };
    setTripStops(currentStops => [...currentStops, newStop]);
    setClickedPoi(null);
  };

  const handleAddCustomStop = (name: string, address: string, duration: number) => {
    if (!selectedRegion || !geocoderRef.current) return;
    geocoderRef.current.geocode({ address: address, componentRestrictions: { country: 'AU' } }, (results, status) => {
      if (status === 'OK' && results) {
        const customWinery: Winery = {
          id: Date.now(),
          name: name,
          coords: { lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng() },
          tags: ['Custom Stop'],
          type: 'custom',
          region: selectedRegion.name,
          openingHours: {},
          visitDuration: duration,
          address: address,
        };
        const newStop: TripStop = { winery: customWinery, duration: duration };
        setTripStops(currentStops => [...currentStops, newStop]);
      } else {
        alert('Geocode was not successful for the following reason: ' + status);
      }
    });
  };

  const handleRemoveFromTrip = (wineryId: number | string) => {
    setTripStops(tripStops.filter(stop => stop.winery.id !== wineryId));
  };

  const handleReorderWineries = (reorderedStops: TripStop[]) => {
    setTripStops(reorderedStops);
  };
  
  const handleDurationChange = (wineryId: number | string, newDuration: number) => {
    setTripStops(currentStops => 
      currentStops.map(stop => 
        stop.winery.id === wineryId ? { ...stop, duration: newDuration } : stop
      )
    );
  };

  const handleOptimizeRoute = async () => {
    if (tripStops.length < 2 || !startTime || !directionsServiceRef.current) return;
    try {
      const { itinerary: optimizedItinerary, directions: optimizedDirections } = await calculateRoute(directionsServiceRef.current, tripStops, startTime, true);
      setItinerary(optimizedItinerary);
      setDirections(optimizedDirections);
      
      if (optimizedDirections) {
        const start = tripStops[0];
        const waypoints = tripStops.slice(1);
        const orderedWaypoints = optimizedDirections.routes[0].waypoint_order.map(i => waypoints[i]);
        setTripStops([start, ...orderedWaypoints]);
      }
    } catch (error) {
      console.error("Error optimizing itinerary: ", error);
    }
  };

  const handleSaveTour = async () => {
    if (!user) {
      alert("Please login to save your tour.");
      return;
    }
    if (tripStops.length === 0) {
      alert("Please add some stops to your tour before saving.");
      return;
    }

    const tourName = prompt("Please enter a name for your tour:", `My ${selectedRegion?.name} Trip`);
    if (tourName) {
      try {
        await addDoc(collection(db, "tours"), {
          userId: user.uid,
          userName: user.displayName,
          tourName: tourName,
          regionName: selectedRegion?.name,
          startTime: startTime,
          stops: tripStops.map(stop => ({ 
            wineryId: stop.winery.id, 
            duration: stop.duration,
            ...(stop.winery.type === 'custom' && { customData: stop.winery })
          })),
          createdAt: new Date(),
        });
        alert("Tour saved successfully!");
      } catch (error) {
        console.error("Error saving tour: ", error);
        alert("There was an error saving your tour.");
      }
    }
  };

  const handleDeleteTour = async (tourId: string) => {
    if (window.confirm("Are you sure you want to delete this tour?")) {
      try {
        await deleteDoc(doc(db, "tours", tourId));
      } catch (error) {
        console.error("Error deleting tour: ", error);
        alert("Could not delete tour.");
      }
    }
  };

  const handleRegionSelection = (value: string) => {
    setMapBounds(null); // Clear any previous bounds
    if (value.startsWith('state-')) {
      const stateName = value.replace('state-', '');
      const firstRegionInState = regions.find(r => r.state === stateName);
      if (firstRegionInState) {
        setSelectedRegion(firstRegionInState);
        setFilterMode('state');

        // Calculate bounds for the entire state
        const stateWineries = allLocations.filter(loc => loc.region.endsWith(stateName.split(' ')[0]));
        if (stateWineries.length > 0 && window.google) {
          const bounds = new window.google.maps.LatLngBounds();
          stateWineries.forEach(w => bounds.extend(w.coords));
          setMapBounds(bounds.toJSON());
        }
      }
    } else {
      const region = regions.find(r => r.name === value);
      if (region) {
        setSelectedRegion(region);
        setFilterMode('region');
      }
    }
  };

  const availableWineries = allLocations.filter(w => {
    if (filterMode === 'state' && selectedRegion) {
      return w.state === selectedRegion.state && (includeDistilleries || w.type === 'winery');
    }
    return w.region === selectedRegion?.name && (includeDistilleries || w.type === 'winery');
  });

  if (!selectedRegion || !isLoaded) {
    return <div>Loading map data...</div>;
  }

  return (
    <>
      <main className="flex w-screen h-screen print:hidden">
        <Sidebar
          user={user}
          onSaveTour={handleSaveTour}
          savedTours={savedTours}
          onLoadTour={(tour) => handleLoadTour(tour, allLocations, regions)}
          onDeleteTour={handleDeleteTour}
          tripStops={tripStops}
          onAddToTrip={handleAddToTrip}
          onRemoveFromTrip={handleRemoveFromTrip}
          onReorderWineries={handleReorderWineries}
          itinerary={itinerary}
          startTime={startTime}
          onStartTimeChange={setStartTime}
          onOptimizeRoute={handleOptimizeRoute}
          defaultDuration={defaultDuration}
          onDefaultDurationChange={setDefaultDuration}
          onDurationChange={handleDurationChange}
          selectedWinery={selectedWinery}
          onSelectWinery={setSelectedWinery}
          onAddCustomStop={handleAddCustomStop}
          selectedRegion={selectedRegion}
          onRegionSelection={handleRegionSelection}
          includeDistilleries={includeDistilleries}
          onToggleDistilleries={() => setIncludeDistilleries(!includeDistilleries)}
          availableWineries={availableWineries}
          regions={regions}
          prepopulatedStop={prepopulatedStop}
          onClearPrepopulatedStop={() => setPrepopulatedStop(null)}
          showRegionOverlay={showRegionOverlay}
          onToggleRegionOverlay={() => setShowRegionOverlay(!showRegionOverlay)}
          filterMode={filterMode}
        />
        <div className="flex-grow h-full">
          <MapComponent
            isLoaded={isLoaded}
            itinerary={itinerary} 
            directions={directions} 
            onSelectWinery={setSelectedWinery}
            availableWineries={availableWineries}
            selectedRegion={selectedRegion}
            clickedPoi={clickedPoi}
            onMapClick={(poi) => setClickedPoi(poi)}
            onAddPoiToTrip={handleAddPoiToTrip}
            showRegionOverlay={showRegionOverlay}
            mapBounds={mapBounds}
          />
        </div>
      </main>
      <PrintableItinerary itinerary={itinerary} startTime={startTime} />
    </>
  );
}