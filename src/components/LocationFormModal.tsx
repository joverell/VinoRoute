'use client';

import React, { useState, useEffect } from 'react';
import { Winery } from '@/types';

interface LocationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (location: Omit<Winery, 'id'> | Winery) => void;
  location: Omit<Winery, 'id'> | Winery | null;
}

const LocationFormModal: React.FC<LocationFormModalProps> = ({ isOpen, onClose, onSave, location }) => {
  const [formData, setFormData] = useState<Omit<Winery, 'id'> | Winery | null>(null);

  useEffect(() => {
    setFormData(location);
  }, [location]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (!formData) return;

    if (name === 'lat' || name === 'lng') {
      setFormData({
        ...formData,
        coords: { ...formData.coords, [name]: parseFloat(value) },
      });
    } else if (name === 'tags') {
      setFormData({ ...formData, tags: value.split(',').map(tag => tag.trim()) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onSave(formData);
    }
  };

  if (!isOpen || !formData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">{'id' in formData ? 'Edit' : 'Add'} Location</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '500px' }}>
            <input name="name" value={formData.name} onChange={handleChange} placeholder="Name" required />
            <input name="lat" type="number" value={formData.coords.lat} onChange={handleChange} placeholder="Latitude" required />
            <input name="lng" type="number" value={formData.coords.lng} onChange={handleChange} placeholder="Longitude" required />
            <input name="tags" value={formData.tags.join(', ')} onChange={handleChange} placeholder="Tags (comma-separated)" />
            <select name="type" value={formData.type} onChange={handleChange}>
              <option value="winery">Winery</option>
              <option value="distillery">Distillery</option>
            </select>
            <input name="region" value={formData.region} onChange={handleChange} placeholder="Region" required />
            <input name="visitDuration" type="number" value={formData.visitDuration} onChange={handleChange} placeholder="Visit Duration (minutes)" required />
            <input name="address" value={formData.address || ''} onChange={handleChange} placeholder="Address" />
            <input name="state" value={formData.state || ''} onChange={handleChange} placeholder="State" />
            <input name="url" value={formData.url || ''} onChange={handleChange} placeholder="Website URL" />
          <div className="flex justify-end gap-4 mt-4">
            <button type="button" onClick={onClose} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
            <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LocationFormModal;
