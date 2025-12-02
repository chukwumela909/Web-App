import AdminRoute from '@/components/auth/AdminRoute'
import AdminLayout from '@/components/super-admin/AdminLayout'

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminRoute>
      <AdminLayout>
        {children}
      </AdminLayout>
    </AdminRoute>
  )
}
