'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface StaffMember {
  id: string
  name: string
  email: string
  role: string
  permissions: string[]
  status: 'active' | 'inactive'
}

interface AdminAccessContextType {
  staff: StaffMember | null
  loading: boolean
  authorized: boolean
  hasPermission: (permission: string) => boolean
  refreshAccess: () => Promise<void>
}

const AdminAccessContext = createContext<AdminAccessContextType | undefined>(undefined)

export function useAdminAccess() {
  const context = useContext(AdminAccessContext)
  if (context === undefined) {
    throw new Error('useAdminAccess must be used within an AdminAccessProvider')
  }
  return context
}

export function AdminAccessProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, isSuperAdmin } = useAuth()
  const [staff, setStaff] = useState<StaffMember | null>(null)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  const checkAccess = useCallback(async () => {
    if (authLoading) return

    if (!user) {
      setAuthorized(false)
      setStaff(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // If user is super admin, grant access immediately
      if (isSuperAdmin) {
        setAuthorized(true)
        setStaff(null) // Super admin doesn't need staff data
        return
      }

      // Check if user is a staff member with permissions
      const response = await fetch(`/api/admin/staff/${user.uid}`)
      const data = await response.json()
      
      if (!data.success) {
        setAuthorized(false)
        setStaff(null)
        return
      }

      const staffData = data.staff
      setStaff(staffData)

      // Check if staff is active
      if (staffData.status !== 'active') {
        setAuthorized(false)
        return
      }

      setAuthorized(true)
      
    } catch (error) {
      console.error('Error checking admin access:', error)
      setAuthorized(false)
      setStaff(null)
    } finally {
      setLoading(false)
    }
  }, [authLoading, user, isSuperAdmin])

  const refreshAccess = useCallback(async () => {
    await checkAccess()
  }, [checkAccess])

  const hasPermission = useCallback((permission: string): boolean => {
    // Super admin has all permissions
    if (isSuperAdmin) return true
    
    // Staff members need specific permissions
    return staff?.permissions?.includes(permission) || false
  }, [isSuperAdmin, staff])

  useEffect(() => {
    checkAccess()
  }, [checkAccess])

  const value = {
    staff,
    loading,
    authorized,
    hasPermission,
    refreshAccess
  }

  return (
    <AdminAccessContext.Provider value={value}>
      {children}
    </AdminAccessContext.Provider>
  )
}
