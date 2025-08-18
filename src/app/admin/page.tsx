'use client';

import { useState, useEffect, useRef } from 'react';
import { Region, Winery } from '@/types';
import { db, auth } from '@/utils/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useJsApiLoader } from '@react-google-maps/api';

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

  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script-admin',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries: MAP_LIBRARIES,
  });

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

  const handleAddWinery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !geocoderRef.current) {
        alert('Google Maps API not loaded yet. Please try again in a moment.');
        return;
    }
    if (!user) {
        alert('You must be logged in to add a winery.');
        return;
    }
    setIsSubmitting(true);

    geocoderRef.current.geocode({ address: address }, async (results, status) => {
      if (status === 'OK' && results) {
        const coords = {
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng(),
        };

        const newWineryData: Omit<Winery, 'id'> = {
            name,
            address,
            coords,
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

        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/locations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newWineryData)
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to add winery');
            }

            alert(`Winery "${name}" added successfully!`);
            // Reset form
            setName('');
            setAddress('');
            setTags('');
            setVisitDuration(60);
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

      } else {
        alert('Geocode was not successful for the following reason: ' + status);
        setIsSubmitting(false);
      }
    });
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Admin Panel</h1>

      <p>
        <a href="/admin/wines" style={{ textDecoration: 'underline' }}>Manage Wines</a>
      </p>
      <p>
        This panel allows you to find new wineries in a region. Due to the difficulty of automatically finding accurate coordinates,
        this tool only identifies potential new wineries. It does not add them to the database.
      </p>


      {!user && <p>Please log in to use the admin tools.</p>}

      {user && (
        <>
            <h2>Add New Winery</h2>
            <form onSubmit={handleAddWinery} style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
                <input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
                <input type="text" placeholder="Address" value={address} onChange={e => setAddress(e.target.value)} required />
                <select value={region} onChange={e => setRegion(e.target.value)} required>
                    {regions.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                </select>
                <select value={type} onChange={e => setType(e.target.value as 'winery' | 'distillery')} required>
                    <option value="winery">Winery</option>
                    <option value="distillery">Distillery</option>
                </select>
                <input type="text" placeholder="Tags (comma-separated)" value={tags} onChange={e => setTags(e.target.value)} />
                <input type="number" placeholder="Visit Duration (mins)" value={visitDuration} onChange={e => setVisitDuration(parseInt(e.target.value))} required />
                <button type="submit" disabled={isSubmitting || !isLoaded}>
                    {isSubmitting ? 'Adding...' : (isLoaded ? 'Add Winery' : 'Loading Maps...')}
                </button>
            </form>
        </>
      )}

      <h2>Regions and Locations</h2>
      {regions.map(r => (
        <div key={r.name} style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '10px' }}>
          <h3>{r.name}</h3>
          <ul>
            {locations.filter(loc => loc.region === r.name).map(loc => (
              <li key={loc.id}>{loc.name}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
