'use client';
import dynamic from 'next/dynamic';
import AdminLayout from './AdminLayout';

const AdminPageClient = dynamic(() => import('./AdminPageClient'), { ssr: false });

export default function AdminPage() {
  return (
    <AdminLayout>
      {(user) => <AdminPageClient user={user} />}
    </AdminLayout>
  );
}
