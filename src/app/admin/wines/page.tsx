'use client';
import dynamic from 'next/dynamic'

const WinesAdminPageClient = dynamic(() => import('./WinesAdminPageClient'), { ssr: false })

export default function WinesAdminPage() {
  return <WinesAdminPageClient />
}
