'use client';

import { useState, useEffect } from 'react';
import { Region, Winery } from '@/types';
import { db, auth } from '@/utils/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function AdminPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [locations, setLocations] = useState<Winery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState<string | null>(null);
  const [newWineries, setNewWineries] = useState<{ [key: string]: string[] }>({});
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const regionsResponse = await fetch('/api/regions');
        if (!regionsResponse.ok) {
          throw new Error('Failed to fetch regions');
        }
        const regionsData = await regionsResponse.json();
        setRegions(Array.isArray(regionsData) ? regionsData : regionsData.regions || []);

        const querySnapshot = await getDocs(collection(db, "locations"));
        const locationsData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Winery);
        setLocations(locationsData);

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

  const handleFindNewLocations = async (regionName: string) => {
    if (!user) {
        alert('You must be logged in to perform this action.');
        return;
    }

    setIsSearching(regionName);
    setNewWineries(prev => ({ ...prev, [regionName]: [] }));

    try {
        const token = await user.getIdToken();
        const response = await fetch('/api/admin/find-and-add-locations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ regionName })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to find new locations');
        }

        setNewWineries(prev => ({ ...prev, [regionName]: data.newWineries || [] }));

    } catch (err) {
        if (err instanceof Error) {
            alert(`Error: ${err.message}`);
        } else {
            alert('An unknown error occurred');
        }
    } finally {
        setIsSearching(null);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Admin Panel</h1>
      <p>
        This panel allows you to find new wineries in a region. Due to the difficulty of automatically finding accurate coordinates,
        this tool only identifies potential new wineries. It does not add them to the database.
      </p>

      {!user && <p>Please log in to use the admin tools.</p>}

      <h2>Regions and Locations</h2>
      {regions.map(region => (
        <div key={region.name} style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>{region.name}</h3>
            <button
              onClick={() => handleFindNewLocations(region.name)}
              disabled={isSearching === region.name || !user}
            >
              {isSearching === region.name ? 'Searching...' : 'Find New Locations'}
            </button>
          </div>
          <h4>Existing Locations:</h4>
          <ul>
            {locations.filter(loc => loc.region === region.name).map(loc => (
              <li key={loc.id}>{loc.name}</li>
            ))}
          </ul>
          {newWineries[region.name] && (
            <div>
              <h4>New Potential Locations Found:</h4>
              {newWineries[region.name].length > 0 ? (
                <ul>
                  {newWineries[region.name].map(name => <li key={name}>{name}</li>)}
                </ul>
              ) : (
                <p>No new locations found.</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

