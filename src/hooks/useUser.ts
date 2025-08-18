'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/utils/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

interface AppUser extends User {
  role?: string;
}

export function useUser() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken();
          const response = await fetch('/api/users/me', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch user role');
          }

          const userData = await response.json();
          setUser({ ...firebaseUser, role: userData.role });
        } catch (err) {
          console.error("Error fetching user data: ", err);
          setError("Failed to load user data.");
          setUser(firebaseUser); // Set the firebase user even if role fetch fails
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, loading, error };
}
