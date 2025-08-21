'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import Toast from '@/components/Toast';

const SiteSettings = () => {
  const [showJokeBanner, setShowJokeBanner] = useState(true);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const settingsDocRef = doc(db, 'settings', 'site');

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const docSnap = await getDoc(settingsDocRef);
      if (docSnap.exists()) {
        setShowJokeBanner(docSnap.data().showJokeBanner);
      }
    } catch (error) {
      console.error("Error fetching site settings:", error);
      setToast({ message: 'Failed to fetch site settings.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [settingsDocRef]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleToggleJokeBanner = async (enabled: boolean) => {
    setShowJokeBanner(enabled);
    try {
      await setDoc(settingsDocRef, { showJokeBanner: enabled }, { merge: true });
      setToast({ message: 'Setting updated successfully!', type: 'success' });
    } catch (error) {
      console.error("Error updating site settings:", error);
      setToast({ message: 'Failed to update setting.', type: 'error' });
      // Revert UI on failure
      setShowJokeBanner(!enabled);
    }
  };

  if (loading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <h2 className="text-2xl font-semibold mb-4">Site-wide Settings</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h3 className="text-lg font-medium">Joke Banner</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Show a wine-related joke at the bottom of the home page.
            </p>
          </div>
          <label className="flex items-center cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={showJokeBanner}
                onChange={(e) => handleToggleJokeBanner(e.target.checked)}
                className="sr-only"
              />
              <div className={`block w-10 h-6 rounded-full transition-colors ${showJokeBanner ? 'bg-teal-500' : 'bg-gray-200'}`}></div>
              <div className={`dot absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${showJokeBanner ? 'translate-x-4' : ''}`}></div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default SiteSettings;
