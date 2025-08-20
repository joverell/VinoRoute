import React from 'react';
import { User } from 'firebase/auth';
import Auth from './Auth';
import Image from 'next/image';


interface BannerProps {
  user: User | null;
  showRegionOverlay: boolean;
  onToggleRegionOverlay: () => void;
}

const Banner = ({
  user,
  showRegionOverlay,
  onToggleRegionOverlay,
}: BannerProps) => {
  return (
    <div className="bg-gray-800 text-white p-4 flex flex-wrap items-center justify-between print:hidden">
      <div className="flex items-center">
        <Image src="/content/logo.png" alt="VinoRoute Logo" width={48} height={48} className="rounded-full mr-4" />
        <div>
          <h1 className="text-2xl font-bold">VinoRoute</h1>
          <p className="text-sm">Discover your next favourite drop.</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-medium text-gray-300">Map Options:</h3>
          <div className="flex items-center">
            <span className="text-sm text-gray-400 mr-2">Region Boundaries</span>
            <label className="flex items-center cursor-pointer">
              <div className="relative">
                <input type="checkbox" checked={showRegionOverlay} onChange={onToggleRegionOverlay} className="sr-only" />
                <div className={`block w-10 h-6 rounded-full transition-colors ${showRegionOverlay ? 'bg-teal-500' : 'bg-gray-200'}`}></div>
                <div className={`dot absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${showRegionOverlay ? 'translate-x-4' : ''}`}></div>
              </div>
            </label>
          </div>
        </div>
        <div className="border-l border-gray-600 h-10 mx-4"></div>
        <Auth user={user} />
      </div>
    </div>
  );
};

export default Banner;
