'use client'

import React from 'react'
import { useStaff } from '@/contexts/StaffContext'
import { useAuth } from '@/contexts/AuthContext'
import { StaffRole } from '@/lib/firestore'
import { Shield, AlertCircle } from 'lucide-react'

interface StaffProtectedRouteProps {
  children: React.ReactNode
  requiredPermission?: string
  requiredRole?: StaffRole | StaffRole[]
  requiredBranchAccess?: string
  fallback?: React.ReactNode
  showUnauthorized?: boolean
}

export default function StaffProtectedRoute({
  children,
  requiredPermission,
  requiredRole,
  requiredBranchAccess,
  fallback,
  showUnauthorized = true
}: StaffProtectedRouteProps) {
  const { user } = useAuth()
  const { staff, loading, hasPermission, canViewBranch } = useStaff()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#004AAD]"></div>
      </div>
    )
  }

  // If no staff data but user is logged in, they are the OWNER - allow full access
  if (!staff && user) {
    return <>{children}</>
  }

  // If no staff data and no user, show unauthorized 
  if (!staff && !user) {
    if (fallback) return <>{fallback}</>
    if (!showUnauthorized) return null
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Required</h2>
        <p className="text-gray-500 text-center">
          You need to be logged in to access this area.
        </p>
      </div>
    )
  }

  // Check if staff is active
  if (staff.status !== 'active') {
    if (fallback) return <>{fallback}</>
    if (!showUnauthorized) return null
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <Shield className="h-16 w-16 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Account Inactive</h2>
        <p className="text-gray-500 text-center">
          Your staff account is currently inactive. Please contact your administrator.
        </p>
      </div>
    )
  }

  // Check required permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    if (fallback) return <>{fallback}</>
    if (!showUnauthorized) return null
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <Shield className="h-16 w-16 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Insufficient Permissions</h2>
        <p className="text-gray-500 text-center">
          You don't have the required permission: {requiredPermission}
        </p>
      </div>
    )
  }

  // Check required role
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    if (!roles.includes(staff.role)) {
      if (fallback) return <>{fallback}</>
      if (!showUnauthorized) return null
      
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
          <Shield className="h-16 w-16 text-red-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Role Required</h2>
          <p className="text-gray-500 text-center">
            This area requires {Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole} role.
          </p>
        </div>
      )
    }
  }

  // Check branch access
  if (requiredBranchAccess && !canViewBranch(requiredBranchAccess)) {
    if (fallback) return <>{fallback}</>
    if (!showUnauthorized) return null
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <Shield className="h-16 w-16 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Branch Access Required</h2>
        <p className="text-gray-500 text-center">
          You don't have access to this branch.
        </p>
      </div>
    )
  }

  // All checks passed, render children
  return <>{children}</>
}

// Higher-order component for permission checking
export function withStaffPermission(
  Component: React.ComponentType<any>,
  requiredPermission: string
) {
  return function ProtectedComponent(props: any) {
    return (
      <StaffProtectedRoute requiredPermission={requiredPermission}>
        <Component {...props} />
      </StaffProtectedRoute>
    )
  }
}

// Higher-order component for role checking
export function withStaffRole(
  Component: React.ComponentType<any>,
  requiredRole: StaffRole | StaffRole[]
) {
  return function ProtectedComponent(props: any) {
    return (
      <StaffProtectedRoute requiredRole={requiredRole}>
        <Component {...props} />
      </StaffProtectedRoute>
    )
  }
}

// Hook for conditional rendering based on permissions
export function usePermissionCheck() {
  const { hasPermission, staff } = useStaff()
  
  return {
    canRender: (permission: string) => hasPermission(permission),
    canRenderRole: (role: StaffRole | StaffRole[]) => {
      if (!staff) return false
      const roles = Array.isArray(role) ? role : [role]
      return roles.includes(staff.role)
    },
    canRenderBranch: (branchId: string) => canViewBranch(branchId)
  }
}
