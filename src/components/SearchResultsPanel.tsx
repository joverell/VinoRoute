import { useState } from 'react';
import { PotentialLocation } from '@/app/api/search-area/route';
import PotentialLocationsPanel from './admin/PotentialLocationsPanel';

interface SearchResultsPanelProps {
  potentialLocations: PotentialLocation[];
  onAddPotentialLocations: (locations: PotentialLocation[]) => void;
  onClearPotentialLocations: () => void;
  isAddingPotentialLocations: boolean;
  onSelectPotentialLocation: (location: PotentialLocation) => void;
  selectedPotentialLocation: PotentialLocation | null;
}

export default function SearchResultsPanel({
  potentialLocations,
  onAddPotentialLocations,
  onClearPotentialLocations,
  isAddingPotentialLocations,
  onSelectPotentialLocation,
  selectedPotentialLocation,
}: SearchResultsPanelProps) {
  const [nameFilter, setNameFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const searchTypes = [...new Set(potentialLocations.map(loc => loc.searchType))];

  const filteredLocations = potentialLocations.filter(loc => {
    const nameMatch = loc.name.toLowerCase().includes(nameFilter.toLowerCase());
    const typeMatch = typeFilter === '' || loc.searchType === typeFilter;
    return nameMatch && typeMatch;
  });

  return (
    <div className="w-full sm:w-96 bg-white shadow-lg p-4 overflow-y-auto z-20 flex-shrink-0 h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">New Locations Found</h2>
        <button
          onClick={onClearPotentialLocations}
          className="p-2 text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Filter by name..."
          value={nameFilter}
          onChange={e => setNameFilter(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Types</option>
          {searchTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>
      <PotentialLocationsPanel
        locations={filteredLocations}
        onAddLocations={onAddPotentialLocations}
        onClear={onClearPotentialLocations}
        isAdding={isAddingPotentialLocations}
        onSelect={onSelectPotentialLocation}
        selectedPotentialLocation={selectedPotentialLocation}
      />
    </div>
  );
}
