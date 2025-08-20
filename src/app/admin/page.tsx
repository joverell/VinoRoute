'use client';
import dynamic from 'next/dynamic';

const AdminLayout = dynamic(() => import('./AdminLayout'), { ssr: false });
const AdminPageClient = dynamic(() => import('./AdminPageClient'), { ssr: false });

export default function AdminPage() {
  return (
    <AdminLayout>
      {(user) => <AdminPageClient user={user} />}
    </AdminLayout>
  );
}
