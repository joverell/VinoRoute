'use client';

import { useState } from 'react';
import { PotentialLocation } from '@/app/api/search-area/route';

interface PotentialLocationsPanelProps {
  locations: PotentialLocation[];
  onAddLocations: (selectedLocations: PotentialLocation[]) => void;
  onClear: () => void;
  isAdding: boolean;
  onSelect: (location: PotentialLocation) => void;
  selectedPotentialLocation?: PotentialLocation | null;
}

export default function PotentialLocationsPanel({ locations, onAddLocations, onClear, isAdding, onSelect, selectedPotentialLocation }: PotentialLocationsPanelProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const handleToggle = (placeId: string) => {
    setSelected(prev =>
      prev.includes(placeId)
        ? prev.filter(id => id !== placeId)
        : [...prev, placeId]
    );
  };

  const handleAddSelected = () => {
    const selectedLocations = locations.filter(loc => selected.includes(loc.placeId));
    onAddLocations(selectedLocations);
  };

  if (locations.length === 0) {
    return null;
  }

  return (
    <div className="p-4 border-t border-gray-200">
      <h3 className="text-lg font-semibold mb-2">New Locations Found</h3>
      <p className="text-sm text-gray-600 mb-4">
        We found {locations.length} potential new locations in this map area. Select the ones you want to add.
      </p>
      <div className="max-h-60 overflow-y-auto pr-2">
        {locations.map((location, index) => (
          <div
            key={location.placeId}
            className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${selectedPotentialLocation?.placeId === location.placeId ? 'bg-rose-100' : 'hover:bg-gray-50'}`}
            onClick={() => onSelect(location)}
          >
            <div className="flex items-center">
              <span className="flex items-center justify-center w-6 h-6 text-sm font-bold text-white bg-blue-500 rounded-full mr-3">
                {index + 1}
              </span>
              <input
                type="checkbox"
                checked={selected.includes(location.placeId)}
                onChange={(e) => {
                  e.stopPropagation();
                  handleToggle(location.placeId);
                }}
                className="h-4 w-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
              />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">{location.name}</p>
                <p className="text-xs text-gray-500">{location.address}</p>
              </div>
            </div>
             <span className="text-xs font-semibold uppercase text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {location.searchType}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex space-x-2">
        <button
          onClick={handleAddSelected}
          disabled={selected.length === 0 || isAdding}
          className="w-full px-4 py-2 text-sm font-bold text-white bg-rose-500 rounded-lg hover:bg-rose-600 disabled:bg-rose-300"
        >
          {isAdding ? 'Adding...' : `Add ${selected.length} Selected`}
        </button>
        <button
          onClick={onClear}
          className="w-full px-4 py-2 text-sm font-bold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
