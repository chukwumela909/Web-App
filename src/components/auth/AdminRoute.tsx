'use client'

import React from 'react'
import { useAdminAccess } from '@/contexts/AdminAccessContext'
import { useRouter } from 'next/navigation'
import { Loader2, Shield } from 'lucide-react'

interface AdminRouteProps {
  children: React.ReactNode
  requiredPermission?: string
}

export default function AdminRoute({ children, requiredPermission }: AdminRouteProps) {
  const { loading, authorized, hasPermission } = useAdminAccess()
  const router = useRouter()

  // Check specific permission if required
  const hasRequiredPermission = !requiredPermission || hasPermission(requiredPermission)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!authorized || !hasRequiredPermission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            {!authorized 
              ? "You don't have permission to access this area." 
              : `You need the '${requiredPermission}' permission to access this area.`
            }
          </p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
