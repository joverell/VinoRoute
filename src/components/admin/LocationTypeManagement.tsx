'use client';

import { useState, useEffect } from 'react';
import { LocationType } from '@/types';
import { User } from 'firebase/auth';

interface LocationTypeManagementProps {
  user: User | null;
}

const LocationTypeManagement = ({ user }: LocationTypeManagementProps) => {
  const [locationTypes, setLocationTypes] = useState<LocationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState<LocationType | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [name, setName] = useState('');
  const [mapImageUrl, setMapImageUrl] = useState('');

  useEffect(() => {
    const fetchLocationTypes = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const token = await user.getIdToken();
        const response = await fetch('/api/location-types', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch location types');
        }
        const data = await response.json();
        setLocationTypes(data);
        setError(null);
      } catch (err) {
        if (err instanceof Error) setError(err.message);
        else setError('An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchLocationTypes();
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/location-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, mapImageUrl })
      });

      if (!response.ok) {
        throw new Error('Failed to add location type');
      }

      const newLocationType = await response.json();
      setLocationTypes([...locationTypes, { name, mapImageUrl, id: newLocationType.id }]);
      setIsAdding(false);
      setName('');
      setMapImageUrl('');
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('An unknown error occurred');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isEditing) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/location-types/${isEditing.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, mapImageUrl })
      });

      if (!response.ok) {
        throw new Error('Failed to update location type');
      }

      setLocationTypes(locationTypes.map(lt => lt.id === isEditing.id ? { ...lt, name, mapImageUrl } : lt));
      setIsEditing(null);
      setName('');
      setMapImageUrl('');
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('An unknown error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Are you sure you want to delete this location type?')) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/location-types/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete location type');
      }

      setLocationTypes(locationTypes.filter(lt => lt.id !== id));
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('An unknown error occurred');
    }
  };

  const startEditing = (locationType: LocationType) => {
    setIsEditing(locationType);
    setName(locationType.name);
    setMapImageUrl(locationType.mapImageUrl);
    setIsAdding(false);
  };

  const startAdding = () => {
    setIsAdding(true);
    setIsEditing(null);
    setName('');
    setMapImageUrl('');
  }

  const cancelForm = () => {
    setIsAdding(false);
    setIsEditing(null);
    setName('');
    setMapImageUrl('');
  }

  if (loading) return <div>Loading location types...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Location Types</h2>

      {isAdding || isEditing ? (
        <form onSubmit={isEditing ? handleUpdate : handleAdd} className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2">{isEditing ? 'Edit' : 'Add'} Location Type</h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border rounded-md"
            />
            <input
              type="text"
              placeholder="Map Image URL"
              value={mapImageUrl}
              onChange={(e) => setMapImageUrl(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border rounded-md"
            />
          </div>
          <div className="mt-4 space-x-2">
            <button type="submit" className="px-4 py-2 bg-coral-500 text-white font-bold rounded-md hover:bg-coral-600">
              {isEditing ? 'Update' : 'Add'}
            </button>
            <button type="button" onClick={cancelForm} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-4">
          <button onClick={startAdding} className="px-4 py-2 bg-coral-500 text-white font-bold rounded-md hover:bg-coral-600">
            + Add Location Type
          </button>
        </div>
      )}

      <div className="space-y-4">
        {locationTypes.map(lt => (
          <div key={lt.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex justify-between items-center">
            <div>
              <p className="font-bold">{lt.name}</p>
              <p className="text-sm text-gray-500">{lt.mapImageUrl}</p>
            </div>
            <div className="space-x-2">
              <button onClick={() => startEditing(lt)} className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600">Edit</button>
              <button onClick={() => handleDelete(lt.id)} className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LocationTypeManagement;
