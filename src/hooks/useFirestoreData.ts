'use client';

import { useState, useEffect } from 'react';
import { db } from '@/utils/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Winery, Region } from '@/types';

export function useFirestoreData() {
  const [wineries, setWineries] = useState<Winery[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "locations"));
        const locationsData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Winery[];
        setWineries(locationsData);

        const regionMap = new Map<string, Region>();
        locationsData.forEach(loc => {
          if (!regionMap.has(loc.region)) {
            const stateMap: { [key: string]: string } = { VIC: "Victoria", SA: "South Australia", WA: "Western Australia", NSW: "New South Wales", TAS: "Tasmania", QLD: "Queensland", ACT: "ACT" };
            const regionParts = loc.region.split(', ');
            const stateAbbr = regionParts[regionParts.length - 1];
            const state = stateMap[stateAbbr] || "Other";
            
            regionMap.set(loc.region, { name: loc.region, center: loc.coords, state: state, country: "Australia" });
          }
        });
        const dynamicRegions = Array.from(regionMap.values()).sort((a, b) => a.state.localeCompare(b.state) || a.name.localeCompare(b.name));
        setRegions(dynamicRegions);

      } catch (err) {
        console.error("Error fetching Firestore data: ", err);
        setError("Failed to load winery data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { wineries, regions, loading, error };
}