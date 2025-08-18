'use client';

import { useState } from 'react';
import { Region, Winery } from '@/types';
import { User } from 'firebase/auth';

interface WinerySearchProps {
  regions: Region[];
  onAddWinery: (winery: Partial<Winery>) => void;
  user: User | null;
}

export default function WinerySearch({ regions, onAddWinery, user }: WinerySearchProps) {
  const [selectedRegion, setSelectedRegion] = useState<Region | undefined>(regions[0]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Partial<Winery>[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!selectedRegion) {
      setError('Please select a region.');
      return;
    }
    if (!user) {
      setError('You must be logged in to search for wineries.');
      return;
    }

    setIsSearching(true);
    setError(null);
    setSearchResults([]);

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/search-wineries?region=${encodeURIComponent(selectedRegion.name)}&lat=${selectedRegion.lat}&lng=${selectedRegion.lng}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to search for wineries');
      }
      const data = await response.json();
      setSearchResults(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div>
      <h2>Search for New Wineries</h2>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
        <select
          value={selectedRegion?.name}
          onChange={(e) => setSelectedRegion(regions.find(r => r.name === e.target.value))}
        >
          {regions.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
        </select>
        <button onClick={handleSearch} disabled={isSearching || !selectedRegion}>
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {searchResults.length > 0 && (
        <div>
          <h3>Found {searchResults.length} new potential wineries:</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {searchResults.map((winery, index) => (
              <li key={index} style={{ border: '1px solid #eee', padding: '10px', marginBottom: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{winery.name}</strong>
                  <p style={{ margin: '5px 0 0', color: '#555' }}>{winery.address}</p>
                </div>
                <button onClick={() => onAddWinery(winery)}>
                  Add
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {searchResults.length === 0 && !isSearching && (
        <p>No new wineries found in the selected region.</p>
      )}
    </div>
  );
}
