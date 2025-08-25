'use client';

import { useState, useEffect, useCallback } from 'react';
import { Wine, Winery } from '@/types';
import { User } from 'firebase/auth';
import { useToast } from '@/context/ToastContext';

interface WinesManagementProps {
  user: User | null;
}

interface WineWithLocation extends Wine {
  locationId: string;
  locationName: string;
}

export default function WinesManagement({ user }: WinesManagementProps) {
  const [wines, setWines] = useState<WineWithLocation[]>([]);
  const [locations, setLocations] = useState<Winery[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWine, setEditingWine] = useState<WineWithLocation | null>(null);
  const [newWineData, setNewWineData] = useState({ name: '', locationId: '', type: 'TBD', producer: 'TBD', region: '', country: 'Australia' });

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const [winesRes, locationsRes] = await Promise.all([
        fetch('/api/wines', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/locations', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!winesRes.ok) throw new Error('Failed to fetch wines');
      if (!locationsRes.ok) throw new Error('Failed to fetch locations');

      const winesData = await winesRes.json();
      const locationsData = await locationsRes.json();

      setWines(winesData);
      setLocations(locationsData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      showToast(message, 'error', { operation: 'fetchData' });
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <div>Loading...</div>;

  const openModal = (wine: WineWithLocation | null) => {
    if (wine) {
      setEditingWine(wine);
      setNewWineData({ ...wine, locationId: wine.locationId });
    } else {
      setEditingWine(null);
      setNewWineData({ name: '', locationId: String(locations[0]?.id || ''), type: 'TBD', producer: 'TBD', region: '', country: 'Australia' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingWine(null);
  };

  const handleSaveWine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { locationId, ...wineData } = newWineData;
    const selectedLocation = locations.find(l => l.id === locationId);
    if (!selectedLocation) {
        showToast('Invalid location selected', 'error');
        return;
    }
    wineData.region = selectedLocation.region;

    const operation = editingWine ? 'update' : 'add';
    const successMessage = `Wine ${operation === 'update' ? 'updated' : 'added'} successfully.`;

    try {
        const token = await user.getIdToken();
        const method = editingWine ? 'PUT' : 'POST';
        const url = editingWine
            ? `/api/locations/${editingWine.locationId}/wines/${editingWine.lwin}`
            : `/api/locations/${locationId}/wines`;

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(wineData)
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || `Failed to ${operation} wine`);
        }

        await fetchData();
        closeModal();
        showToast(successMessage, 'success', { operation: 'handleSaveWine', wineData });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred';
        showToast(message, 'error', { operation: 'handleSaveWine', wineData });
    }
  };

  const handleDeleteWine = async (wine: WineWithLocation) => {
    if (!user || !confirm(`Are you sure you want to delete "${wine.name}"?`)) return;

    try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/locations/${wine.locationId}/wines/${wine.lwin}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to delete wine');
        }

        setWines(wines.filter(w => w.lwin !== wine.lwin));
        showToast('Wine deleted successfully.', 'success', { operation: 'handleDeleteWine', wine });
    } catch (err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred';
        showToast(message, 'error', { operation: 'handleDeleteWine', wine });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Wines Management ({wines.length})</h2>
        <button onClick={() => openModal(null)} className="px-4 py-2 bg-green-500 text-white font-bold rounded-md hover:bg-green-600">
          Add Wine
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Winery</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Region</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {wines.map((wine) => (
              <tr key={wine.lwin}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{wine.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{wine.locationName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{wine.region}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => openModal(wine)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">Edit</button>
                  <button onClick={() => handleDeleteWine(wine)} className="ml-4 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-4">{editingWine ? 'Edit Wine' : 'Add Wine'}</h2>
            <form onSubmit={handleSaveWine} className="space-y-4">
              <input type="text" placeholder="Wine Name" value={newWineData.name} onChange={e => setNewWineData({...newWineData, name: e.target.value})} required className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border rounded-md" />
              <select value={newWineData.locationId} onChange={e => setNewWineData({...newWineData, locationId: e.target.value})} required className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border rounded-md">
                <option value="" disabled>Select Winery</option>
                {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
              </select>
              {/* Add other wine fields as necessary */}
              <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-coral-500 text-white font-bold rounded-md hover:bg-coral-600">
                  {editingWine ? 'Update Wine' : 'Add Wine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
