'use client';

import { useState, useEffect } from 'react';
import { Winery, Wine } from '@/types';
import { db } from '@/utils/firebase';
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

export default function WinesAdminPage() {
  const [wineries, setWineries] = useState<Winery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWineries() {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, "locations"));
        const wineriesData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Winery);
        setWineries(wineriesData);
        setError(null);
      } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchWineries();
  }, []);

  const handleAddWine = async (wineryId: string) => {
    const wineName = prompt('Enter the name of the new wine:');
    if (wineName) {
      const newWine: Omit<Wine, 'lwin'> = {
        name: wineName,
        type: 'TBD',
        producer: 'TBD',
        region: 'TBD',
        country: 'TBD',
      };
      // In a real app, you'd have a more comprehensive form and validation
      const wineWithLwin = { ...newWine, lwin: `new-${Date.now()}` };

      try {
        const wineryRef = doc(db, 'locations', wineryId);
        await updateDoc(wineryRef, {
          wines: arrayUnion(wineWithLwin)
        });
        // Refresh the data
        const querySnapshot = await getDocs(collection(db, "locations"));
        const wineriesData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Winery);
        setWineries(wineriesData);
      } catch (error) {
        console.error("Error adding wine: ", error);
        alert('Failed to add wine.');
      }
    }
  };

  const handleDeleteWine = async (wineryId: string, wine: Wine) => {
    if (confirm(`Are you sure you want to delete the wine "${wine.name}"?`)) {
      try {
        const wineryRef = doc(db, 'locations', wineryId);
        await updateDoc(wineryRef, {
          wines: arrayRemove(wine)
        });
        // Refresh the data
        const querySnapshot = await getDocs(collection(db, "locations"));
        const wineriesData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Winery);
        setWineries(wineriesData);
      } catch (error) {
        console.error("Error deleting wine: ", error);
        alert('Failed to delete wine.');
      }
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Wines Admin</h1>
      {wineries.map(winery => (
        <div key={winery.id} style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>{winery.name}</h3>
            <button onClick={() => handleAddWine(winery.id.toString())}>Add Wine</button>
          </div>
          {winery.wines && winery.wines.length > 0 ? (
            <ul>
              {winery.wines.map(wine => (
                <li key={wine.lwin}>
                  {wine.name} ({wine.type})
                  <button onClick={() => handleDeleteWine(winery.id.toString(), wine)} style={{ marginLeft: '10px' }}>Delete</button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No wines found for this winery.</p>
          )}
        </div>
      ))}
    </div>
  );
}
