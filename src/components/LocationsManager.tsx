'use client';

import React, { useState, useEffect } from 'react';
import { Winery } from '@/types';
import LocationFormModal from './LocationFormModal';
import { useUser } from '@/hooks/useUser';

const LocationsManager: React.FC = () => {
  const { user } = useUser();
  const [locations, setLocations] = useState<Winery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Omit<Winery, 'id'> | Winery | null>(null);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/locations');
      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }
      const data = await response.json();
      setLocations(data);
    } catch (err) {
      if (err instanceof Error) {
          setError(err.message);
      } else {
          setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const handleOpenModal = (location: Omit<Winery, 'id'> | Winery | null = null) => {
    setEditingLocation(location || { name: '', coords: { lat: 0, lng: 0 }, tags: [], type: 'winery', region: '', openingHours: {}, visitDuration: 60, address: '', state: '', url: '' });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingLocation(null);
    setIsModalOpen(false);
  };

  const handleSaveLocation = async (locationData: Omit<Winery, 'id'> | Winery) => {
    if (!user) return;
    try {
        const token = await user.getIdToken();
        const method = 'id' in locationData ? 'PUT' : 'POST';
        const url = 'id' in locationData ? `/api/locations/${locationData.id}` : '/api/locations';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(locationData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to save location');
        }

        handleCloseModal();
        fetchLocations(); // Refresh the list
    } catch (error) {
        if(error instanceof Error) {
            alert(`Error saving location: ${error.message}`);
        } else {
            alert('An unknown error occurred');
        }
    }
  };

  const handleDeleteLocation = async (id: string | number) => {
    if (!user) return;
    if (confirm('Are you sure you want to delete this location?')) {
        try {
            const token = await user.getIdToken();
            const response = await fetch(`/api/locations/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete location');
            }
            fetchLocations(); // Refresh the list
        } catch (error) {
            if(error instanceof Error) {
                alert(`Error deleting location: ${error.message}`);
            } else {
                alert('An unknown error occurred');
            }
        }
    }
  };


  if (loading) return <div>Loading locations...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Manage Locations</h2>
      <button onClick={() => handleOpenModal()} className="bg-teal-600 text-white px-4 py-2 rounded mb-4">Add New Location</button>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2">Name</th>
            <th className="py-2">Region</th>
            <th className="py-2">Type</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((location) => (
            <tr key={location.id}>
              <td className="border px-4 py-2">{location.name}</td>
              <td className="border px-4 py-2">{location.region}</td>
              <td className="border px-4 py-2">{location.type}</td>
              <td className="border px-4 py-2">
                <button onClick={() => handleOpenModal(location)} className="bg-blue-500 text-white px-2 py-1 rounded mr-2">Edit</button>
                <button onClick={() => handleDeleteLocation(location.id)} className="bg-red-500 text-white px-2 py-1 rounded">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <LocationFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveLocation}
        location={editingLocation}
      />
    </div>
  );
};

export default LocationsManager;
