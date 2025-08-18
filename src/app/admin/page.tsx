'use client';

import React, { useState } from 'react';
import withAdminAuth from '@/components/withAdminAuth';
import { Winery } from '@/types';
import { useUser } from '@/hooks/useUser';

const AdminPage: React.FC = () => {
  const { user } = useUser();
  const [formData, setFormData] = useState<Omit<Winery, 'id'>>({
    name: '',
    coords: { lat: 0, lng: 0 },
    tags: [],
    type: 'winery',
    region: '',
    openingHours: {},
    visitDuration: 60,
    address: '',
    state: '',
    url: '',
  });
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!user) {
      setMessage('You must be logged in to add a location.');
      return;
    }

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add location');
      }

      setMessage(`Successfully added location with ID: ${data.id}`);
      // Clear form
      setFormData({
        name: '',
        coords: { lat: 0, lng: 0 },
        tags: [],
        type: 'winery',
        region: '',
        openingHours: {},
        visitDuration: 60,
        address: '',
        state: '',
        url: '',
      });
    } catch (error) {
      if (error instanceof Error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage('An unknown error occurred.');
      }
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Admin Page</h1>
      <h2>Add New Location</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '500px' }}>
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
        <input name="address" value={formData.address} onChange={handleChange} placeholder="Address" />
        <input name="state" value={formData.state} onChange={handleChange} placeholder="State" />
        <input name="url" value={formData.url} onChange={handleChange} placeholder="Website URL" />
        <button type="submit">Add Location</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default withAdminAuth(AdminPage);
