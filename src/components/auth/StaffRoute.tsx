'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Loader2, Shield } from 'lucide-react'

interface StaffRouteProps {
  children: React.ReactNode
  requiredPermission?: string
}

interface StaffMember {
  id: string
  name: string
  email: string
  role: string
  permissions: string[]
  status: 'active' | 'inactive'
}

export default function StaffRoute({ children, requiredPermission }: StaffRouteProps) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [staff, setStaff] = useState<StaffMember | null>(null)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    checkStaffAccess()
  }, [user, requiredPermission])

  const checkStaffAccess = async () => {
    if (authLoading) return

    if (!user) {
      router.push('/login')
      return
    }

    try {
      setLoading(true)
      
      // Check if user is a staff member
      const response = await fetch(`/api/admin/staff/${user.uid}`)
      const data = await response.json()
      
      if (!data.success) {
        // Not a staff member, redirect to regular dashboard
        router.push('/dashboard')
        return
      }

      const staffData = data.staff
      setStaff(staffData)

      // Check if staff is active
      if (staffData.status !== 'active') {
        router.push('/unauthorized')
        return
      }

      // Check specific permission if required
      if (requiredPermission && !staffData.permissions.includes(requiredPermission)) {
        router.push('/unauthorized')
        return
      }

      setAuthorized(true)
      
    } catch (error) {
      console.error('Error checking staff access:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Verifying access...</p>
        </div>
      </div>
    )
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access this area.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
