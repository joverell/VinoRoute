'use client';

import React, { useState, useEffect } from 'react';
import { Region } from '@/types';
import RegionFormModal from './RegionFormModal';
import { useUser } from '@/hooks/useUser';

const RegionsManager: React.FC = () => {
  const { user } = useUser();
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);

  const fetchRegions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/regions');
      if (!response.ok) {
        throw new Error('Failed to fetch regions');
      }
      const data = await response.json();
      setRegions(data);
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
    fetchRegions();
  }, []);

  const handleOpenModal = (region: Region | null = null) => {
    setEditingRegion(region || { name: '', center: { lat: 0, lng: 0 }, state: '' });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingRegion(null);
    setIsModalOpen(false);
  };

  const handleSaveRegion = async (regionData: Region) => {
    if (!user) return;
    try {
        const token = await user.getIdToken();
        const isEditing = regions.some(r => r.name === regionData.name);
        const method = isEditing ? 'PUT' : 'POST';
        const url = isEditing ? `/api/regions/${regionData.name.toLowerCase().replace(/, /g, '-').replace(/ /g, '-')}` : '/api/regions';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(regionData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to save region');
        }

        handleCloseModal();
        fetchRegions(); // Refresh the list
    } catch (error) {
        if(error instanceof Error) {
            alert(`Error saving region: ${error.message}`);
        } else {
            alert('An unknown error occurred');
        }
    }
  };

  const handleDeleteRegion = async (regionName: string) => {
    if (!user) return;
    if (confirm('Are you sure you want to delete this region?')) {
        try {
            const token = await user.getIdToken();
            const response = await fetch(`/api/regions/${regionName.toLowerCase().replace(/, /g, '-').replace(/ /g, '-')}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete region');
            }
            fetchRegions(); // Refresh the list
        } catch (error) {
            if(error instanceof Error) {
                alert(`Error deleting region: ${error.message}`);
            } else {
                alert('An unknown error occurred');
            }
        }
    }
  };


  if (loading) return <div>Loading regions...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Manage Regions</h2>
      <button onClick={() => handleOpenModal()} className="bg-teal-600 text-white px-4 py-2 rounded mb-4">Add New Region</button>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2">Name</th>
            <th className="py-2">State</th>
            <th className="py-2">Center Coordinates</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {regions.map((region) => (
            <tr key={region.name}>
              <td className="border px-4 py-2">{region.name}</td>
              <td className="border px-4 py-2">{region.state}</td>
              <td className="border px-4 py-2">{`Lat: ${region.center.lat}, Lng: ${region.center.lng}`}</td>
              <td className="border px-4 py-2">
                <button onClick={() => handleOpenModal(region)} className="bg-blue-500 text-white px-2 py-1 rounded mr-2">Edit</button>
                <button onClick={() => handleDeleteRegion(region.name)} className="bg-red-500 text-white px-2 py-1 rounded">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <RegionFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveRegion}
        region={editingRegion}
      />
    </div>
  );
};

export default RegionsManager;
