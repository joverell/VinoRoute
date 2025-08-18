'use client';

import { useState, useEffect, useRef } from 'react';
import { Region, Winery } from '@/types';
import { db, auth } from '@/utils/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useJsApiLoader } from '@react-google-maps/api';
import WinerySearch from '@/components/WinerySearch';

const MAP_LIBRARIES: ('maps' | 'routes' | 'marker' | 'places')[] = ['places'];

export default function AdminPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [locations, setLocations] = useState<Winery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [region, setRegion] = useState('');
  const [type, setType] = useState<'winery' | 'distillery'>('winery');
  const [tags, setTags] = useState('');
  const [visitDuration, setVisitDuration] = useState(60);
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
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const fetchLocations = async () => {
    const querySnapshot = await getDocs(collection(db, "locations"));
    const locationsData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Winery);
    setLocations(locationsData);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const regionsResponse = await fetch('/api/regions');
        if (!regionsResponse.ok) {
          throw new Error('Failed to fetch regions');
        }
        const regionsData = await regionsResponse.json();
        const parsedRegions = Array.isArray(regionsData) ? regionsData : regionsData.regions || [];
        setRegions(parsedRegions);
        if (parsedRegions.length > 0) {
            setRegion(parsedRegions[0].name);
        }

        await fetchLocations();

        setError(null);
      } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

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
      setVisitDuration(60);
      setCoords(null);
      // Refresh locations
      await fetchLocations();
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
        visitDuration,
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

  const handleWinerySearchAdd = (winery: Partial<Winery>) => {
    if (winery.name) setName(winery.name);
    if (winery.address) setAddress(winery.address);
    if (winery.region) setRegion(winery.region);
    if (winery.coords) setCoords(winery.coords);
    // You might want to scroll to the form or highlight it
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Admin Panel</h1>

      {!user && <p>Please log in to use the admin tools.</p>}

      {user && (
        <>
            <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '20px' }}>
                <WinerySearch regions={regions} onAddWinery={handleWinerySearchAdd} user={user} />
            </div>
            <h2>Add New Winery</h2>
            <form onSubmit={handleAddWinery} style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
                <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
                <input type="text" placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} required />
                <select value={region} onChange={e => setRegion(e.target.value)} required>
                    {regions.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}

    <div className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
        </header>

        {!user && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <p className="text-center text-gray-600 dark:text-gray-400">Please log in to use the admin tools.</p>
          </div>
        )}

        {user && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Column 1: Add Winery Form */}
            <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 h-fit">
              <h2 className="text-2xl font-semibold mb-4">Add New Winery</h2>
              <form onSubmit={handleAddWinery} className="space-y-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500"
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500"
                />
                <select
                  value={region}
                  onChange={e => setRegion(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500"
                >
                  {regions.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}

                </select>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as 'winery' | 'distillery')}
                  required
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500"
                >
                  <option value="winery">Winery</option>
                  <option value="distillery">Distillery</option>
                </select>
                <input
                  type="text"
                  placeholder="Tags (comma-separated)"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500"
                />
                <input
                  type="number"
                  placeholder="Visit Duration (mins)"
                  value={visitDuration}
                  onChange={e => setVisitDuration(parseInt(e.target.value))}
                  required
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !isLoaded}
                  className="w-full bg-coral-500 text-white font-bold py-2 px-4 rounded-md hover:bg-coral-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-300"
                >
                  {isSubmitting ? 'Adding...' : (isLoaded ? 'Add Winery' : 'Loading Maps...')}
                </button>
              </form>
            </div>

            {/* Column 2: Regions and Locations */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold mb-4">Regions & Locations</h2>
              <div className="space-y-6">
                {regions.map(r => (
                  <div key={r.name} className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="text-xl font-semibold text-coral-500">{r.name}</h3>
                    <ul className="mt-2 space-y-2">
                      {locations.filter(loc => loc.region === r.name).map(loc => (
                        <li key={loc.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md flex justify-between items-center">
                          <span>{loc.name}</span>
                          {/* Future actions can go here e.g., edit/delete buttons */}
                        </li>
                      ))}
                      {locations.filter(loc => loc.region === r.name).length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No locations for this region yet.</p>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
