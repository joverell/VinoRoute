'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Region, Winery, Wine, LocationType } from '@/types';
import { User } from 'firebase/auth';
import WinerySearch from '@/components/WinerySearch';
import { useGoogleMaps } from '@/app/GoogleMapsProvider';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import RatingsManagement from '@/components/admin/RatingsManagement';
import UserManagement from '@/components/admin/UserManagement';
import WinesManagement from '@/components/admin/WinesManagement';
import LocationTypeManagement from '@/components/admin/LocationTypeManagement';
import Toast from '@/components/Toast';

interface AdminPageClientProps {
  user: User | null;
}

interface PlacesAutocompleteProps {
  onAddressSelect: (address: string, lat: number, lng: number) => void;
  onAddressChange: (address: string) => void;
  initialValue?: string;
}

const PlacesAutocomplete = ({ onAddressSelect, onAddressChange, initialValue }: PlacesAutocompleteProps) => {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: 'au' },
    },
    debounce: 300,
    defaultValue: initialValue || '',
  });

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    onAddressChange(e.target.value);
  };

  const handleSelect = ({ description }: { description: string }) => () => {
    setValue(description, false);
    onAddressChange(description);
    clearSuggestions();

    getGeocode({ address: description })
      .then((results) => getLatLng(results[0]))
      .then(({ lat, lng }) => {
        onAddressSelect(description, lat, lng);
      })
      .catch((error) => {
        console.log('😱 Error: ', error);
      });
  };

  const renderSuggestions = () =>
    data.map((suggestion) => {
      const {
        place_id,
        structured_formatting: { main_text, secondary_text },
      } = suggestion;

      return (
        <li
          key={place_id}
          onClick={handleSelect(suggestion)}
          className="p-2 cursor-pointer hover:bg-gray-100"
        >
          <strong>{main_text}</strong> <small>{secondary_text}</small>
        </li>
      );
    });

  return (
    <div className="relative">
      <input
        value={value}
        onChange={handleInput}
        disabled={!ready}
        placeholder="Address"
        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500"
      />
      {status === 'OK' && <ul className="absolute z-10 w-full bg-white border rounded-md mt-1">{renderSuggestions()}</ul>}
    </div>
  );
};

export default function AdminPageClient({ user }: AdminPageClientProps) {
  const [regions, setRegions] = useState<Region[]>([]);
  const [locations, setLocations] = useState<Winery[]>([]);
  const [locationTypes, setLocationTypes] = useState<LocationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state for winery
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [region, setRegion] = useState('');
  const [locationTypeId, setLocationTypeId] = useState('');
  const [tags, setTags] = useState('');

  // Form state for region
  const [regionName, setRegionName] = useState('');
  const [regionState, setRegionState] = useState('');
  const [regionCenterLat, setRegionCenterLat] = useState('');
  const [regionCenterLng, setRegionCenterLng] = useState('');

  // Editing/Modal state
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [editingLocation, setEditingLocation] = useState<Winery | null>(null);
  const [selectedLocationForWines, setSelectedLocationForWines] = useState<Winery | null>(null);
  const [newWineName, setNewWineName] = useState('');
  const [expandedRegions, setExpandedRegions] = useState<{[key:string]: boolean}>({});
  const [activeTab, setActiveTab] = useState('regions');
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [locationFilter, setLocationFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);

  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const { isLoaded } = useGoogleMaps();

  useEffect(() => {
    if (isLoaded) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }
  }, [isLoaded]);

  useEffect(() => {
    const savedTab = localStorage.getItem('adminActiveTab');
    if (savedTab) {
      setActiveTab(savedTab);
    }
    const savedExpandedRegions = localStorage.getItem('adminExpandedRegions');
    if (savedExpandedRegions) {
      setExpandedRegions(JSON.parse(savedExpandedRegions));
    }
  }, []);

  useEffect(() => {
    if (selectedLocationForWines) {
        const updatedLocation = locations.find(l => l.id === selectedLocationForWines.id);
        if (updatedLocation) {
            setSelectedLocationForWines(updatedLocation);
        }
    }
  }, [locations, selectedLocationForWines]);

  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('adminExpandedRegions', JSON.stringify(expandedRegions));
  }, [expandedRegions]);

  const getRegionDocId = (name: string) => {
    return name.toLowerCase().replace(/, /g, '-').replace(/ /g, '-');
  }

  const toggleRegion = (regionName: string) => {
    setExpandedRegions(prev => ({ ...prev, [regionName]: !prev[regionName] }));
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const regionsResponse = await fetch('/api/regions');
      if (!regionsResponse.ok) throw new Error('Failed to fetch regions');
      const regionsData = await regionsResponse.json();
      const parsedRegions = Array.isArray(regionsData) ? regionsData : regionsData.regions || [];
      setRegions(parsedRegions);
      if (parsedRegions.length > 0 && region === '') {
          setRegion(parsedRegions[0].name);
      }

      const locationsResponse = await fetch('/api/locations');
      if (!locationsResponse.ok) throw new Error('Failed to fetch locations');
      const locationsData = await locationsResponse.json();
      setLocations(locationsData);

      const locationTypesResponse = await fetch('/api/location-types');
      if (!locationTypesResponse.ok) throw new Error('Failed to fetch location types');
      const locationTypesData = await locationTypesResponse.json();
      setLocationTypes(locationTypesData);

      setError(null);
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [region]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, fetchData]);

  const addWineryToDatabase = async (wineryData: Omit<Winery, 'id'>) => {
    if (!user) {
      setToast({ message: 'You must be logged in to add a winery.', type: 'error' });
      return;
    }
    setIsSubmitting(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(wineryData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add winery');
      }
      setToast({ message: `Winery "${wineryData.name}" added successfully!`, type: 'success' });
      // Reset form
      setName('');
      setAddress('');
      setTags('');
      setCoords(null);
      // Refresh locations
      await fetchData();
    } catch (err) {
      if (err instanceof Error) {
        setToast({ message: `Error adding winery: ${err.message}`, type: 'error' });
      } else {
        setToast({ message: 'An unknown error occurred while adding winery.', type: 'error' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddWinery = async (e: React.FormEvent) => {
    e.preventDefault();
    const newWineryData: Omit<Winery, 'id'> = {
        name,
        address,
        coords: { lat: 0, lng: 0 }, // Placeholder
        region,
        type: 'winery', // for backwards compatibility
        locationTypeId,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        openingHours: { // Default opening hours
            "0": { open: 10, close: 17 }, "1": { open: 10, close: 17 }, "2": { open: 10, close: 17 },
            "3": { open: 10, close: 17 }, "4": { open: 10, close: 17 }, "5": { open: 10, close: 17 },
            "6": { open: 10, close: 17 },
        }
    };

    if (coords) {
      newWineryData.coords = coords;
      await addWineryToDatabase(newWineryData);
    } else {
      if (!isLoaded || !geocoderRef.current) {
        alert('Google Maps API not loaded yet. Please try again in a moment.');
        return;
      }
      geocoderRef.current.geocode({ address: address }, async (results, status) => {
        if (status === 'OK' && results) {
          newWineryData.coords = {
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng(),
          };
          await addWineryToDatabase(newWineryData);
        } else {
          alert('Geocode was not successful for the following reason: ' + status);
        }
      });
    }
  }

  const handleUpdateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingLocation) return;
    setIsSubmitting(true);

    try {
        const token = await user.getIdToken();
        const { id, ...locationData } = editingLocation;
        const response = await fetch(`/api/locations/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(locationData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to update location');
        setToast({ message: `Location "${editingLocation.name}" updated successfully!`, type: 'success' });
        setLocations(prevLocations =>
            prevLocations.map(loc =>
                loc.id === editingLocation.id ? editingLocation : loc
            )
        );
        setEditingLocation(null);
    } catch (err) {
        if (err instanceof Error) setToast({ message: `Error: ${err.message}`, type: 'error' });
        else setToast({ message: 'An unknown error occurred.', type: 'error' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleWinerySearchAdd = (winery: Partial<Winery>) => {
    const newWineryData: Omit<Winery, 'id'> = {
        name: winery.name || '',
        address: winery.address || '',
        coords: winery.coords || { lat: 0, lng: 0 },
        region: winery.region || '',
        type: 'winery',
        tags: winery.tags || [],
        openingHours: { // Default opening hours
            "0": { open: 10, close: 17 }, "1": { open: 10, close: 17 }, "2": { open: 10, close: 17 },
            "3": { open: 10, close: 17 }, "4": { open: 10, close: 17 }, "5": { open: 10, close: 17 },
            "6": { open: 10, close: 17 },
        }
    };
    addWineryToDatabase(newWineryData);
  };

  const handleDeleteLocation = async (location: Winery) => {
    if (!user || !confirm(`Delete "${location.name}"?`)) return;
    try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/locations/${location.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to delete location');
        setToast({ message: `Location "${location.name}" deleted.`, type: 'success' });
        setLocations(locations.filter(l => l.id !== location.id));
    } catch (err) {
        if (err instanceof Error) setToast({ message: `Error: ${err.message}`, type: 'error' });
        else setToast({ message: 'An unknown error occurred.', type: 'error' });
    }
  };

  const handleAddRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    const newRegionData = {
        name: regionName, state: regionState,
        center: { lat: parseFloat(regionCenterLat), lng: parseFloat(regionCenterLng) },
    };
    try {
        const token = await user.getIdToken();
        const response = await fetch('/api/regions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(newRegionData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to add region');
        setToast({ message: `Region "${regionName}" added.`, type: 'success' });
        setRegionName(''); setRegionState(''); setRegionCenterLat(''); setRegionCenterLng('');
        fetchData();
    } catch (err) {
        if (err instanceof Error) setToast({ message: `Error: ${err.message}`, type: 'error' });
        else setToast({ message: 'An unknown error occurred.', type: 'error' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleUpdateRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editingRegion) return;
    setIsSubmitting(true);
    try {
        const token = await user.getIdToken();
        const docId = getRegionDocId(editingRegion.name);
        const response = await fetch(`/api/regions/${docId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(editingRegion)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to update region');
        setToast({ message: `Region "${editingRegion.name}" updated.`, type: 'success' });
        setEditingRegion(null);
        fetchData();
    } catch (err) {
        if (err instanceof Error) setToast({ message: `Error: ${err.message}`, type: 'error' });
        else setToast({ message: 'An unknown error occurred.', type: 'error' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeleteRegion = async (region: Region) => {
    if (!user || !confirm(`Delete "${region.name}"? Orphaned locations will remain.`)) return;
    try {
        const token = await user.getIdToken();
        const docId = getRegionDocId(region.name);
        const response = await fetch(`/api/regions/${docId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to delete region');
        setToast({ message: `Region "${region.name}" deleted.`, type: 'success' });
        setRegions(regions.filter(r => getRegionDocId(r.name) !== getRegionDocId(region.name)));
    } catch (err) {
        if (err instanceof Error) setToast({ message: `Error: ${err.message}`, type: 'error' });
        else setToast({ message: 'An unknown error occurred.', type: 'error' });
    }
  };

  const handleAddWineSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || !selectedLocationForWines) return;

      const newWineData = {
          name: newWineName,
          type: 'TBD',
          producer: 'TBD',
          region: selectedLocationForWines.region,
          country: 'Australia',
      };

      try {
          const token = await user.getIdToken();
          const response = await fetch(`/api/locations/${selectedLocationForWines.id}/wines`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify(newWineData),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Failed to add wine');

          setNewWineName('');
          fetchData();
      } catch (err) {
          if (err instanceof Error) alert(`Error: ${err.message}`);
          else alert('An unknown error occurred.');
      }
  };

  const handleDeleteWine = async (wine: Wine) => {
      if (!user || !selectedLocationForWines || !confirm(`Delete "${wine.name}"?`)) return;

      try {
          const token = await user.getIdToken();
          await fetch(`/api/locations/${selectedLocationForWines.id}/wines/${wine.lwin}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` },
          });

          const updatedLocations = locations.map(l => {
            if (l.id === selectedLocationForWines.id) {
              return {
                ...l,
                wines: l.wines?.filter(w => w.lwin !== wine.lwin)
              };
            }
            return l;
          });
          setLocations(updatedLocations);

      } catch (err) {
          if (err instanceof Error) alert(`Error: ${err.message}`);
          else alert('An unknown error occurred.');
      }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        {!user ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <p className="text-center text-gray-600 dark:text-gray-400">Please log in.</p>
          </div>
        ) : (
          <>
            <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button onClick={() => setActiveTab('regions')} className={`${activeTab === 'regions' ? 'border-coral-500 text-coral-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                  Regions & Locations
                </button>
                <button onClick={() => setActiveTab('ratings')} className={`${activeTab === 'ratings' ? 'border-coral-500 text-coral-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                  Ratings & Comments
                </button>
                <button onClick={() => setActiveTab('users')} className={`${activeTab === 'users' ? 'border-coral-500 text-coral-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                  User Management
                </button>
                <button onClick={() => setActiveTab('wines')} className={`${activeTab === 'wines' ? 'border-coral-500 text-coral-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                  Wines
                </button>
                <button onClick={() => setActiveTab('locationTypes')} className={`${activeTab === 'locationTypes' ? 'border-coral-500 text-coral-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                  Location Types
                </button>
              </nav>
            </div>

            {activeTab === 'regions' && (
              <div className={`grid grid-cols-1 ${selectedLocationForWines ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-8`}>
                <div className="lg:col-span-1 space-y-8 self-start sticky top-8">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 h-fit">
                      <h2 className="text-2xl font-semibold mb-4">Search for Winery</h2>
                      <WinerySearch regions={regions} onAddWinery={handleWinerySearchAdd} user={user} />
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 h-fit">
                    <h2 className="text-2xl font-semibold mb-4">Add Winery</h2>
                    <form onSubmit={handleAddWinery} className="space-y-4">
                      <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} required className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500" />
                      <PlacesAutocomplete
                        onAddressChange={setAddress}
                        onAddressSelect={(selectedAddress, lat, lng) => {
                          setAddress(selectedAddress);
                          setCoords({ lat, lng });
                        }}
                      />
                      <select value={region} onChange={e => setRegion(e.target.value)} required className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500">
                        {regions.map(r => <option key={getRegionDocId(r.name)} value={r.name}>{r.name}</option>)}
                      </select>
                      <select value={locationTypeId} onChange={e => setLocationTypeId(e.target.value)} required className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500">
                        <option value="" disabled>Select Location Type</option>
                        {locationTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.singular}</option>)}
                      </select>
                      <input type="text" placeholder="Tags (comma-separated)" value={tags} onChange={e => setTags(e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500" />
                      <button type="submit" disabled={isSubmitting || !isLoaded} className="w-full bg-coral-500 text-white font-bold py-2 px-4 rounded-md hover:bg-coral-600 disabled:bg-gray-400">
                        {isSubmitting ? 'Adding...' : 'Add Winery'}
                      </button>
                    </form>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 h-fit">
                    <h2 className="text-2xl font-semibold mb-4">Add Region</h2>
                    <form onSubmit={handleAddRegion} className="space-y-4">
                      <input type="text" placeholder="Region Name" value={regionName} onChange={e => setRegionName(e.target.value)} required className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500" />
                      <input type="text" placeholder="State" value={regionState} onChange={e => setRegionState(e.target.value)} required className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500" />
                      <div className="flex space-x-2">
                        <input type="number" step="any" placeholder="Center Latitude" value={regionCenterLat} onChange={e => setRegionCenterLat(e.target.value)} required className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500" />
                        <input type="number" step="any" placeholder="Center Longitude" value={regionCenterLng} onChange={e => setRegionCenterLng(e.target.value)} required className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500" />
                      </div>
                      <button type="submit" disabled={isSubmitting} className="w-full bg-coral-500 text-white font-bold py-2 px-4 rounded-md hover:bg-coral-600 disabled:bg-gray-400">
                        {isSubmitting ? 'Adding...' : 'Add Region'}
                      </button>
                    </form>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-semibold mb-4">Regions & Locations</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Filter locations by name..."
                      value={locationFilter}
                      onChange={e => setLocationFilter(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500"
                    />
                    <select
                      value={regionFilter}
                      onChange={e => setRegionFilter(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500"
                    >
                      <option value="">All Regions</option>
                      {regions.map(r => <option key={getRegionDocId(r.name)} value={r.name}>{r.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-6">
                    {regions.map(r => {
                      const filteredLocations = locations
                        .filter(loc => loc.region === r.name)
                        .filter(loc => loc.name.toLowerCase().includes(locationFilter.toLowerCase()))
                        .sort((a, b) => a.name.localeCompare(b.name));

                      if (regionFilter && r.name !== regionFilter) return null;

                      return (
                        <div key={getRegionDocId(r.name)} className="border-t pt-4">
                          <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleRegion(r.name)}>
                            <h3 className="text-xl font-semibold text-coral-500">{r.name} ({filteredLocations.length})</h3>
                            <div className="space-x-2 flex items-center">
                              <button onClick={(e) => { e.stopPropagation(); setEditingRegion({ ...r }) }} className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600">Edit</button>
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteRegion(r) }} className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600">Delete</button>
                              <span>{expandedRegions[r.name] || (regionFilter === r.name) ? '▲' : '▼'}</span>
                            </div>
                          </div>
                          {(expandedRegions[r.name] || (regionFilter === r.name)) && (
                            <ul className="mt-2 space-y-2">
                              {filteredLocations.map(loc => (
                                <li key={loc.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md flex justify-between items-center">
                                  <span>{loc.name}</span>
                                  <div className="space-x-4 flex items-center">
                                    <button onClick={() => setSelectedLocationForWines({ ...loc })} className="px-3 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600">Manage Wines</button>
                                    <button onClick={() => setEditingLocation({ ...loc, tags: loc.tags || [] })} className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600">Edit</button>
                                    <button onClick={() => handleDeleteLocation(loc)} className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600">Delete</button>
                                  </div>
                                </li>
                              ))}
                              {filteredLocations.length === 0 && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">No locations found for this region and filter.</p>
                              )}
                            </ul>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
                {selectedLocationForWines && (
                  <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 self-start sticky top-8">
                    <h2 className="text-2xl font-semibold mb-4">Manage Wines for {selectedLocationForWines.name}</h2>
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-2">Add New Wine</h3>
                      <form onSubmit={handleAddWineSubmit} className="flex items-center space-x-2">
                        <input type="text" placeholder="New Wine Name" value={newWineName} onChange={e => setNewWineName(e.target.value)} required className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border rounded-md" />
                        <button type="submit" className="px-4 py-2 bg-green-500 text-white font-bold rounded-md hover:bg-green-600">Add</button>
                      </form>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Existing Wines</h3>
                    <ul className="space-y-2 max-h-96 overflow-y-auto">
                      {(selectedLocationForWines.wines && selectedLocationForWines.wines.length > 0) ? (
                        selectedLocationForWines.wines.map(wine => (
                          <li key={wine.lwin} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md flex justify-between items-center">
                            <span>{wine.name}</span>
                            <button onClick={() => handleDeleteWine(wine)} className="text-sm text-red-500 hover:underline">Delete</button>
                          </li>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No wines found for this location.</p>
                      )}
                    </ul>
                    <div className="flex justify-end pt-6">
                      <button type="button" onClick={() => setSelectedLocationForWines(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Close</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'ratings' && (
              <RatingsManagement user={user} />
            )}

            {activeTab === 'users' && (
              <UserManagement user={user} />
            )}

            {activeTab === 'wines' && (
              <WinesManagement user={user} />
            )}

            {activeTab === 'locationTypes' && (
              <LocationTypeManagement user={user} />
            )}

            {editingRegion && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
                  <h2 className="text-2xl font-semibold mb-4">Edit Region</h2>
                  <form onSubmit={handleUpdateRegion} className="space-y-4">
                    <input type="text" value={editingRegion.name} disabled className="mt-1 w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 border rounded-md" />
                    <input type="text" value={editingRegion.state} onChange={e => setEditingRegion({ ...editingRegion, state: e.target.value })} required className="mt-1 w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border rounded-md" />
                    <div className="flex space-x-2">
                      <input type="number" step="any" value={editingRegion.center.lat} onChange={e => setEditingRegion({ ...editingRegion, center: { ...editingRegion.center, lat: parseFloat(e.target.value) } })} required className="mt-1 w-full px-4 py-2 bg-gray-50" />
                      <input type="number" step="any" value={editingRegion.center.lng} onChange={e => setEditingRegion({ ...editingRegion, center: { ...editingRegion.center, lng: parseFloat(e.target.value) } })} required className="mt-1 w-full px-4 py-2 bg-gray-50" />
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                      <button type="button" onClick={() => setEditingRegion(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                      <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-coral-500 text-white font-bold rounded-md hover:bg-coral-600 disabled:bg-gray-400">
                        {isSubmitting ? 'Updating...' : 'Update Region'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {editingLocation && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-lg">
                  <h2 className="text-2xl font-semibold mb-4">Edit Location</h2>
                  <form onSubmit={handleUpdateLocation} className="space-y-4">
                    <input type="text" placeholder="Name" value={editingLocation.name} onChange={e => setEditingLocation({...editingLocation, name: e.target.value})} required className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border rounded-md" />
                    <PlacesAutocomplete
                      initialValue={typeof editingLocation.address === 'string' ? editingLocation.address : ''}
                      onAddressChange={(newAddress) => {
                        if (editingLocation) {
                            setEditingLocation({ ...editingLocation, address: newAddress });
                        }
                      }}
                      onAddressSelect={(selectedAddress, lat, lng) => {
                        if (editingLocation) {
                            setEditingLocation({
                                ...editingLocation,
                                address: selectedAddress,
                                coords: { lat, lng }
                            });
                        }
                      }}
                    />
                    <select value={editingLocation.region} onChange={e => setEditingLocation({...editingLocation, region: e.target.value})} required className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border rounded-md">
                      {regions.map(r => <option key={getRegionDocId(r.name)} value={r.name}>{r.name}</option>)}
                    </select>
                    <select value={editingLocation.locationTypeId} onChange={e => setEditingLocation({...editingLocation, locationTypeId: e.target.value})} required className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border rounded-md">
                      <option value="" disabled>Select Location Type</option>
                      {locationTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.singular}</option>)}
                    </select>
                    <input type="text" placeholder="Tags (comma-separated)" value={editingLocation.tags.join(', ')} onChange={e => setEditingLocation({...editingLocation, tags: e.target.value.split(',').map(t=>t.trim())})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border rounded-md" />
                    <div className="flex justify-end space-x-4 pt-4">
                      <button type="button" onClick={() => setEditingLocation(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                      <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-500 text-white font-bold rounded-md hover:bg-blue-600 disabled:bg-gray-400 shadow-md">
                        {isSubmitting ? 'Updating...' : 'Update Location'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
