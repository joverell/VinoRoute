'use client';

import React, { useState, useEffect } from 'react';
import Banner from '@/components/Banner';
import { auth } from '@/utils/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ToastProvider } from '@/context/ToastContext';

interface AdminLayoutProps {
  children: (user: User | null) => React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const tokenResult = await currentUser.getIdTokenResult();
        setIsAdmin(tokenResult.claims.admin === true);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ToastProvider user={user}>
      <div>
        <Banner user={user} showMapOptions={false} isAdmin={isAdmin} />
        <div className="p-4">
          {children(user)}
        </div>
      </div>
    </ToastProvider>
  );
};

export default AdminLayout;
