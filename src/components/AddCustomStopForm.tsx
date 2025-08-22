'use client';

import { useState, useEffect } from 'react';
import { useAutocomplete } from '../hooks/useAutocomplete';
import { PrepopulatedStop } from './HomePage';

interface AddCustomStopFormProps {
  onAdd: (name: string, address: string, duration: number) => void;
  onCancel: () => void;
  defaultDuration: number;
  prepopulatedData: PrepopulatedStop | null;
}

export default function AddCustomStopForm({ onAdd, onCancel, defaultDuration, prepopulatedData }: AddCustomStopFormProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [duration, setDuration] = useState(defaultDuration);
  const { suggestions, loading, error, fetchSuggestions, setSuggestions } = useAutocomplete();

  useEffect(() => {
    if (prepopulatedData) {
      setName(prepopulatedData.name);
      setAddress(prepopulatedData.address);
    }
  }, [prepopulatedData]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddress(value);
    fetchSuggestions(value, { includedRegionCodes: ['au'] });
  };

  const handleSuggestionClick = (suggestion: google.maps.places.AutocompleteSuggestion) => {
    const mainText = suggestion.placePrediction?.mainText?.text ?? '';
    const secondaryText = suggestion.placePrediction?.secondaryText?.text ?? '';
    const fullAddress = [mainText, secondaryText].filter(Boolean).join(', ');
    setAddress(fullAddress);
    setSuggestions([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && address) {
      onAdd(name, address, duration);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 my-2 bg-gray-50 border rounded-lg">
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Location Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
          required
        />
        <div className="relative">
          <input
            type="text"
            placeholder="Address"
            value={address}
            onChange={handleAddressChange}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
            required
          />
          {loading && <div className="p-2">Loading...</div>}
          {error && <div className="p-2 text-red-500">{error}</div>}
          {suggestions.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1">
              {suggestions.map((suggestion) => (
                <li
                  key={suggestion.placePrediction?.placeId}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="p-2 cursor-pointer hover:bg-gray-100"
                >
                  {`${suggestion.placePrediction?.mainText?.text ?? ''}, ${suggestion.placePrediction?.secondaryText?.text ?? ''}`}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <label className="text-xs text-gray-500">Duration (mins)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value, 10))}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
            min="15"
            step="15"
            required
          />
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4">
        <button type="button" onClick={onCancel} className="w-full px-4 py-2 text-sm font-bold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">
          Cancel
        </button>
        <button type="submit" className="w-full px-4 py-2 text-sm font-bold text-white bg-teal-500 rounded-lg hover:bg-teal-600">
          Add Stop
        </button>
      </div>
    </form>
  );
}