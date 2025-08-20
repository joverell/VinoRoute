'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { LocationType } from '@/types';
import { User } from 'firebase/auth';
import Image from 'next/image';

interface LocationTypeManagementProps {
  user: User | null;
}

const LocationTypeManagement = ({ user }: LocationTypeManagementProps) => {
  const [locationTypes, setLocationTypes] = useState<LocationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState<LocationType | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const [singular, setSingular] = useState('');
  const [plural, setPlural] = useState('');
  const [icon, setIcon] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchLocationTypes = useCallback(async () => {
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
  }, [user]);

  useEffect(() => {
    fetchLocationTypes();
  }, [fetchLocationTypes]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData();
    formData.append('singular', singular);
    formData.append('plural', plural);
    if (icon) {
      formData.append('icon', icon);
    }

    try {
      const token = await user.getIdToken();
      const url = isEditing ? `/api/location-types/${isEditing.id}` : '/api/location-types';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'add'} location type`);
      }

      await fetchLocationTypes();
      cancelForm();
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
    setSingular(locationType.singular);
    setPlural(locationType.plural);
    setIsAdding(false);
    setIcon(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const startAdding = () => {
    setIsAdding(true);
    setIsEditing(null);
    setSingular('');
    setPlural('');
    setIcon(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

  const cancelForm = () => {
    setIsAdding(false);
    setIsEditing(null);
    setSingular('');
    setPlural('');
    setIcon(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  }

  if (loading) return <div>Loading location types...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Location Types ({locationTypes.length})</h2>

      {isAdding || isEditing ? (
        <form onSubmit={handleFormSubmit} className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2">{isEditing ? 'Edit' : 'Add'} Location Type</h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Singular Name (e.g., Winery)"
              value={singular}
              onChange={(e) => setSingular(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border rounded-md"
            />
            <input
              type="text"
              placeholder="Plural Name (e.g., Wineries)"
              value={plural}
              onChange={(e) => setPlural(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border rounded-md"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Icon</label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => setIcon(e.target.files ? e.target.files[0] : null)}
                className="w-full px-4 py-2 mt-1 bg-gray-50 dark:bg-gray-700 border rounded-md"
              />
              {isEditing && isEditing.icon && (
                <div className="mt-2">
                  <p className="text-sm">Current icon:</p>
                  <Image src={isEditing.icon} alt="icon" width="32" height="32" className="w-8 h-8"/>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 space-x-2">
            <button type="submit" className="px-4 py-2 bg-[#FF5757] text-white font-bold rounded-md hover:bg-[#E04A4A]">
              {isEditing ? 'Update' : 'Add'}
            </button>
            <button type="button" onClick={cancelForm} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-4">
          <button onClick={startAdding} className="px-6 py-3 bg-green-500 text-white font-bold rounded-lg shadow-md hover:bg-green-600 text-lg">
            + Add New Location Type
          </button>
        </div>
      )}

      <div className="space-y-4">
        {locationTypes.map(lt => (
          <div key={lt.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow flex justify-between items-center">
            <div className="flex items-center">
              {lt.icon && <Image src={lt.icon} alt="icon" width="32" height="32" className="w-8 h-8 mr-4"/>}
              <div>
                <p className="font-bold">{lt.singular}</p>
                <p className="text-sm text-gray-500">{lt.plural}</p>
              </div>
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
