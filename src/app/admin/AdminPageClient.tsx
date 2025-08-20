'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Region, Winery, Wine } from '@/types';
import { User } from 'firebase/auth';
import WinerySearch from '@/components/WinerySearch';
import { useGoogleMaps } from '@/app/GoogleMapsProvider';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import RatingsManagement from '@/components/admin/RatingsManagement';
import UserManagement from '@/components/admin/UserManagement';
import WinesManagement from '@/components/admin/WinesManagement';

interface AdminPageClientProps {
  user: User | null;
}

const PlacesAutocomplete = ({ onAddressSelect }: { onAddressSelect: (address: string, lat: number, lng: number) => void }) => {
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
  });

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleSelect = ({ description }: { description: string }) => () => {
    setValue(description, false);
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state for winery
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [region, setRegion] = useState('');
  const [type, setType] = useState<'winery' | 'distillery'>('winery');
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
    if (selectedLocationForWines) {
        const updatedLocation = locations.find(l => l.id === selectedLocationForWines.id);
        if (updatedLocation) {
            setSelectedLocationForWines(updatedLocation);
        }
    }
  }, [locations, selectedLocationForWines]);

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
      alert('You must be logged in to add a winery.');
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
      alert(`Winery "${wineryData.name}" added successfully!`);
      // Reset form
      setName('');
      setAddress('');
      setTags('');
      setCoords(null);
      // Refresh locations
      await fetchData();
    } catch (err) {
      if (err instanceof Error) {
        alert(`Error adding winery: ${err.message}`);
      } else {
        alert('An unknown error occurred while adding winery.');
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
        type,
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
        const response = await fetch(`/api/locations/${editingLocation.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(editingLocation)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to update location');
        alert(`Location "${editingLocation.name}" updated successfully!`);
        setEditingLocation(null);
        fetchData();
    } catch (err) {
        if (err instanceof Error) alert(`Error: ${err.message}`);
        else alert('An unknown error occurred.');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleWinerySearchAdd = (winery: Partial<Winery>) => {
    if (winery.name) setName(winery.name);
    if (winery.address) setAddress(winery.address);
    if (winery.region) setRegion(winery.region);
    if (winery.coords) setCoords(winery.coords);
    // You might want to scroll to the form or highlight it
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        alert(`Location "${location.name}" deleted.`);
        fetchData();
    } catch (err) {
        if (err instanceof Error) alert(`Error: ${err.message}`);
        else alert('An unknown error occurred.');
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
        alert(`Region "${regionName}" added.`);
        setRegionName(''); setRegionState(''); setRegionCenterLat(''); setRegionCenterLng('');
        fetchData();
    } catch (err) {
        if (err instanceof Error) alert(`Error: ${err.message}`);
        else alert('An unknown error occurred.');
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
        alert(`Region "${editingRegion.name}" updated.`);
        setEditingRegion(null);
        fetchData();
    } catch (err) {
        if (err instanceof Error) alert(`Error: ${err.message}`);
        else alert('An unknown error occurred.');
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
        alert(`Region "${region.name}" deleted.`);
        fetchData();
    } catch (err) {
        if (err instanceof Error) alert(`Error: ${err.message}`);
        else alert('An unknown error occurred.');
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
          fetchData();
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
                        onAddressSelect={(selectedAddress, lat, lng) => {
                          setAddress(selectedAddress);
                          setCoords({ lat, lng });
                        }}
                      />
                      <select value={region} onChange={e => setRegion(e.target.value)} required className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500">
                        {regions.map(r => <option key={getRegionDocId(r.name)} value={r.name}>{r.name}</option>)}
                      </select>
                      <select value={type} onChange={e => setType(e.target.value as 'winery' | 'distillery')} required className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500">
                        <option value="winery">Winery</option>
                        <option value="distillery">Distillery</option>
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
                  <div className="space-y-6">
                    {regions.map(r => (
                      <div key={getRegionDocId(r.name)} className="border-t pt-4">
                        <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleRegion(r.name)}>
                          <h3 className="text-xl font-semibold text-coral-500">{r.name}</h3>
                          <div className="space-x-2 flex items-center">
                            <button onClick={(e) => { e.stopPropagation(); setEditingRegion({ ...r }) }} className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600">Edit</button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteRegion(r) }} className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600">Delete</button>
                            <span>{expandedRegions[r.name] ? '▲' : '▼'}</span>
                          </div>
                        </div>
                        {expandedRegions[r.name] && (
                          <ul className="mt-2 space-y-2">
                            {locations.filter(loc => loc.region === r.name).map(loc => (
                              <li key={loc.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md flex justify-between items-center">
                                <span>{loc.name}</span>
                                <div className="space-x-4 flex items-center">
                                  <button onClick={() => setSelectedLocationForWines({ ...loc })} className="px-3 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600">Manage Wines</button>
                                  <button onClick={() => setEditingLocation({ ...loc })} className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600">Edit</button>
                                  <button onClick={() => handleDeleteLocation(loc)} className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600">Delete</button>
                                </div>
                              </li>
                            ))}
                            {locations.filter(loc => loc.region === r.name).length === 0 && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">No locations.</p>
                            )}
                          </ul>
                        )}
                      </div>
                    ))}
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
                    <input type="text" placeholder="Address" value={editingLocation.address} onChange={e => setEditingLocation({...editingLocation, address: e.target.value})} required className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border rounded-md" />
                    <select value={editingLocation.region} onChange={e => setEditingLocation({...editingLocation, region: e.target.value})} required className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border rounded-md">
                      {regions.map(r => <option key={getRegionDocId(r.name)} value={r.name}>{r.name}</option>)}
                    </select>
                    <select value={editingLocation.type} onChange={e => setEditingLocation({...editingLocation, type: e.target.value as 'winery' | 'distillery'})} required className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border rounded-md">
                      <option value="winery">Winery</option>
                      <option value="distillery">Distillery</option>
                    </select>
                    <input type="text" placeholder="Tags (comma-separated)" value={editingLocation.tags.join(', ')} onChange={e => setEditingLocation({...editingLocation, tags: e.target.value.split(',').map(t=>t.trim())})} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border rounded-md" />
                    <div className="flex justify-end space-x-4 pt-4">
                      <button type="button" onClick={() => setEditingLocation(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                      <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-coral-500 text-white font-bold rounded-md hover:bg-coral-600 disabled:bg-gray-400">
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
