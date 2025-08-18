'use client';
import dynamic from 'next/dynamic'

const AdminPageClient = dynamic(() => import('./AdminPageClient'), { ssr: false })

export default function AdminPage() {
  return <AdminPageClient />
}
