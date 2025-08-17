'use client';

import { useState, useRef, useEffect } from 'react';
import { Autocomplete } from '@react-google-maps/api';
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
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (prepopulatedData) {
      setName(prepopulatedData.name);
      setAddress(prepopulatedData.address);
      if (inputRef.current) {
        inputRef.current.value = prepopulatedData.address;
      }
    }
  }, [prepopulatedData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAddress = inputRef.current?.value || address;
    if (name && finalAddress) {
      onAdd(name, finalAddress, duration);
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
        <Autocomplete
          onLoad={(ref) => (autocompleteRef.current = ref)}
          options={{ types: ['establishment', 'geocode'], componentRestrictions: { country: 'AU' } }}
        >
          <input
            type="text"
            placeholder="Address"
            ref={inputRef}
            defaultValue={address}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
            required
          />
        </Autocomplete>
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