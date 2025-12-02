'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface SuperAdminRouteProps {
  children: React.ReactNode
}

export default function SuperAdminRoute({ children }: SuperAdminRouteProps) {
  const { user, userRole, loading, isSuperAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Redirect to login if not authenticated
        router.push('/login')
        return
      }

      if (!isSuperAdmin) {
        // Redirect to unauthorized page if not super admin
        router.push('/unauthorized')
        return
      }
    }
  }, [user, userRole, loading, isSuperAdmin, router])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Show nothing while redirecting
  if (!user || !isSuperAdmin) {
    return null
  }

  // Render children for super admin users
  return <>{children}</>
}
