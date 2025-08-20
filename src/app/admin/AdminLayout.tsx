'use client';

import React, { useState, useEffect } from 'react';
import Banner from '@/components/Banner';
import { auth } from '@/utils/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import Link from 'next/link';

interface AdminLayoutProps {
  children: (user: User | null) => React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const dummyToggle = () => {};

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <Banner user={user} showMapOptions={false} />
      <div className="p-4">
        <Link href="/" className="text-blue-500 hover:underline mb-4 block">&larr; Back to Main Page</Link>
        {children(user)}
      </div>
    </div>
  );
};

export default AdminLayout;
