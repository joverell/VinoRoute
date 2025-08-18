'use client';

import React, { useState } from 'react';
import withAdminAuth from '@/components/withAdminAuth';
import Banner from '@/components/Banner';
import { useUser } from '@/hooks/useUser';
import AdminSidebar from '@/components/AdminSidebar';
import LocationsManager from '@/components/LocationsManager';
import RegionsManager from '@/components/RegionsManager';

const AdminPage: React.FC = () => {
  const { user } = useUser();
  const [activeView, setActiveView] = useState('dashboard');

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <div>Dashboard Content</div>;
      case 'locations':
        return <LocationsManager />;
      case 'regions':
        return <RegionsManager />;
      default:
        return <div>Dashboard Content</div>;
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Banner user={user} showRegionOverlay={false} onToggleRegionOverlay={() => {}} includeDistilleries={false} onToggleDistilleries={() => {}} />
      <div className="flex flex-1">
        <AdminSidebar setActiveView={setActiveView} />
        <main className="flex-1 p-8 bg-gray-50">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default withAdminAuth(AdminPage);
