'use client';

import React from 'react';

interface AdminSidebarProps {
  setActiveView: (view: string) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ setActiveView }) => {
  return (
    <aside className="w-64 bg-gray-100 p-4">
      <nav>
        <ul>
          <li className="mb-2">
            <button onClick={() => setActiveView('dashboard')} className="w-full text-left p-2 rounded hover:bg-gray-200">
              Dashboard
            </button>
          </li>
          <li className="mb-2">
            <button onClick={() => setActiveView('locations')} className="w-full text-left p-2 rounded hover:bg-gray-200">
              Locations
            </button>
          </li>
          <li className="mb-2">
            <button onClick={() => setActiveView('regions')} className="w-full text-left p-2 rounded hover:bg-gray-200">
              Regions
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default AdminSidebar;
