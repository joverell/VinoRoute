'use client';

import React, { useState, useEffect } from 'react';
import { Region } from '@/types';

interface RegionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (region: Region) => void;
  region: Region | null;
}

const RegionFormModal: React.FC<RegionFormModalProps> = ({ isOpen, onClose, onSave, region }) => {
  const [formData, setFormData] = useState<Region | null>(null);

  useEffect(() => {
    setFormData(region);
  }, [region]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (!formData) return;

    if (name === 'lat' || name === 'lng') {
      setFormData({
        ...formData,
        center: { ...formData.center, [name]: parseFloat(value) },
      });
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
        <h2 className="text-2xl font-bold mb-4">{formData.name ? 'Edit' : 'Add'} Region</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '500px' }}>
            <input name="name" value={formData.name} onChange={handleChange} placeholder="Name" required />
            <input name="state" value={formData.state} onChange={handleChange} placeholder="State" required />
            <input name="lat" type="number" value={formData.center.lat} onChange={handleChange} placeholder="Center Latitude" required />
            <input name="lng" type="number" value={formData.center.lng} onChange={handleChange} placeholder="Center Longitude" required />
          <div className="flex justify-end gap-4 mt-4">
            <button type="button" onClick={onClose} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
            <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegionFormModal;
