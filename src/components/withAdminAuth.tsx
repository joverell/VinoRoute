'use client';

import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import React, { ComponentType, useEffect } from 'react';

const withAdminAuth = <P extends object>(WrappedComponent: ComponentType<P>) => {
  const WithAdminAuth: React.FC<P> = (props) => {
    const { user, loading } = useUser();
    const router = useRouter();

    useEffect(() => {
      if (!loading && (!user || user.role !== 'admin')) {
        router.push('/'); // Redirect to home page if not an admin
      }
    }, [user, loading, router]);

    if (loading) {
      return <div>Loading...</div>; // Or a spinner component
    }

    if (!user || user.role !== 'admin') {
      return null; // Or a message, or redirecting will handle it.
    }

    return <WrappedComponent {...props} />;
  };

  return WithAdminAuth;
};

export default withAdminAuth;
