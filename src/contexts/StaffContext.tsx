'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  Staff,
  StaffRole,
  getStaffByAuthId,
  updateStaffLastLogin,
  createStaffActivityLog,
  hasStaffPermission,
  canAccessBranch,
  getStaffAccessibleBranches
} from '@/lib/firestore'

interface StaffContextType {
  staff: Staff | null
  loading: boolean
  hasPermission: (permission: string) => boolean
  canViewBranch: (branchId: string) => boolean
  getAccessibleBranches: () => string[]
  logActivity: (action: string, description: string, metadata?: any, severity?: 'info' | 'warning' | 'error' | 'critical') => Promise<void>
  isOwner: boolean
  isManager: boolean
  isCashier: boolean
}

const StaffContext = createContext<StaffContextType | undefined>(undefined)

export function useStaff() {
  const context = useContext(StaffContext)
  if (context === undefined) {
    throw new Error('useStaff must be used within a StaffProvider')
  }
  return context
}

export function StaffProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [staff, setStaff] = useState<Staff | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStaffData = async () => {
      if (!user) {
        setStaff(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        // First try to get staff data from the old business staff system
        let staffData = await getStaffByAuthId(user.uid)
        
        // If not found in old system, try the new super-admin staff system
        if (!staffData) {
          try {
            const response = await fetch(`/api/admin/staff/${user.uid}`)
            const data = await response.json()
            
            if (data.success) {
              // Convert super-admin staff structure to old staff structure for compatibility
              staffData = {
                id: data.staff.id,
                authId: user.uid,
                userId: user.uid,
                fullName: data.staff.name,
                email: data.staff.email,
                role: data.staff.role.toLowerCase().replace(/\s+/g, '_'), // Convert to old role format
                permissions: data.staff.permissions || [],
                status: data.staff.status,
                branchIds: [], // Super-admin staff don't have branch restrictions
                createdAt: data.staff.createdAt,
                lastLogin: data.staff.lastLogin
              }
            }
          } catch (fetchError) {
            console.error('Error fetching super-admin staff data:', fetchError)
          }
        }
        
        if (staffData) {
          setStaff(staffData)
          
          // Update last login time (only for old system staff)
          if (staffData.userId && staffData.userId !== user.uid) {
            try {
              await updateStaffLastLogin(staffData.id)
            } catch (updateError) {
              console.error('Error updating last login:', updateError)
            }
          }
          
          // Log login activity with safe metadata (no undefined values)
          try {
            const metadata: any = {
              role: staffData.role || 'unknown'
            }
            
            // Only add branchIds if they exist and are not empty
            if (staffData.branchIds && staffData.branchIds.length > 0) {
              metadata.branchIds = staffData.branchIds
            }
            
            // Add IP address if available
            if (typeof window !== 'undefined') {
              try {
                const ipAddress = await getUserIP()
                if (ipAddress) {
                  metadata.ipAddress = ipAddress
                }
              } catch (ipError) {
                console.error('Error getting IP:', ipError)
              }
            }
            
            await createStaffActivityLog(staffData.userId || user.uid, {
              staffId: staffData.authId || user.uid,
              staffName: staffData.fullName || staffData.email || 'Unknown',
              action: 'staff_login',
              description: `${staffData.fullName || staffData.email || 'Staff member'} logged in`,
              metadata,
              severity: 'info'
            })
          } catch (logError) {
            console.error('Error logging staff activity:', logError)
            // Don't fail the login process if logging fails
          }
        } else {
          setStaff(null)
        }
      } catch (error) {
        console.error('Error loading staff data:', error)
        setStaff(null)
      } finally {
        setLoading(false)
      }
    }

    loadStaffData()
  }, [user])

  const hasPermission = (permission: string): boolean => {
    return hasStaffPermission(staff, permission)
  }

  const canViewBranch = (branchId: string): boolean => {
    return canAccessBranch(staff, branchId)
  }

  const getAccessibleBranches = (): string[] => {
    return getStaffAccessibleBranches(staff)
  }

  const logActivity = async (
    action: string, 
    description: string, 
    metadata: any = {}, 
    severity: 'info' | 'warning' | 'error' | 'critical' = 'info'
  ) => {
    if (!staff) return

    try {
      // Create safe metadata object without undefined values
      const safeMetadata: any = {}
      
      // Add provided metadata, filtering out undefined values
      Object.keys(metadata).forEach(key => {
        if (metadata[key] !== undefined) {
          safeMetadata[key] = metadata[key]
        }
      })
      
      // Add IP address if available
      if (typeof window !== 'undefined') {
        try {
          const ipAddress = await getUserIP()
          if (ipAddress) {
            safeMetadata.ipAddress = ipAddress
          }
        } catch (ipError) {
          console.error('Error getting IP for activity log:', ipError)
        }
      }
      
      // Add user agent if available
      if (typeof window !== 'undefined' && window.navigator.userAgent) {
        safeMetadata.userAgent = window.navigator.userAgent
      }

      await createStaffActivityLog(staff.userId || staff.authId, {
        staffId: staff.authId || staff.userId,
        staffName: staff.fullName || staff.email || 'Unknown',
        action,
        description,
        metadata: safeMetadata,
        severity
      })
    } catch (error) {
      console.error('Error logging activity:', error)
    }
  }

  const isOwner = staff?.role === 'owner'
  const isManager = staff?.role === 'manager' || isOwner
  const isCashier = staff?.role === 'cashier' || isManager

  const value = {
    staff,
    loading,
    hasPermission,
    canViewBranch,
    getAccessibleBranches,
    logActivity,
    isOwner,
    isManager,
    isCashier
  }

  return (
    <StaffContext.Provider value={value}>
      {children}
    </StaffContext.Provider>
  )
}

// Helper function to get user IP (simplified)
async function getUserIP(): Promise<string | undefined> {
  try {
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip
  } catch (error) {
    console.error('Error getting IP:', error)
    return undefined
  }
}
