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
      const response = await fetch(`/api/search-wineries?region=${encodeURIComponent(selectedRegion.name)}&lat=${selectedRegion.center.lat}&lng=${selectedRegion.center.lng}`, {
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
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <select
          value={selectedRegion?.name}
          onChange={(e) => setSelectedRegion(regions.find(r => r.name === e.target.value))}
          className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500"
        >
          {regions.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
        </select>
        <button
          onClick={handleSearch}
          disabled={isSearching || !selectedRegion}
          className="flex px-4 py-2 bg-coral-500 text-white font-bold rounded-md hover:bg-coral-600 disabled:bg-gray-400"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && <p className="text-red-500">Error: {error}</p>}

      {searchResults.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Found {searchResults.length} new potential wineries:</h3>
          <ul className="space-y-2">
            {searchResults.map((winery, index) => (
              <li key={index} className="border dark:border-gray-700 p-3 rounded-md flex justify-between items-center">
                <div>
                  <strong className="font-semibold">{winery.name}</strong>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{typeof winery.address === 'string' ? winery.address : ''}</p>
                </div>
                <button
                  onClick={() => onAddWinery(winery)}
                  className="px-3 py-1 bg-green-500 text-white font-bold rounded-md hover:bg-green-600"
                >
                  Add
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {searchResults.length === 0 && !isSearching && (
        <p className="text-gray-500 dark:text-gray-400">No new wineries found in the selected region.</p>
      )}
    </div>
  );
}
