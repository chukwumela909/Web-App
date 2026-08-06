'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useBusinessRole, BusinessRole } from '@/hooks/useBusinessRole'
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

// Backend roles carry no granular permission list, so gate legacy `resource:action` permissions
// by role. Owners/managers/admins get everything; cashiers get only the sales/POS surface —
// NOT the dashboard home (client requirement: cashiers see just the sales page). This
// mirrors the backend's own enforcement (manager_required etc.) so the UI never dead-ends a cashier
// on a screen whose writes the server would 403 anyway — and, critically, no longer fails OPEN for
// invited staff (who are absent from the legacy Firestore staff collection).
const CASHIER_ALLOWED_PERMISSIONS = new Set([
  'sales:read',
  'sales:create',
  'pos:read',
  'pos:use'
])

function isElevated(role: BusinessRole): boolean {
  return role === 'owner' || role === 'manager' || role === 'admin'
}

function permissionAllowedForRole(permission: string, role: BusinessRole): boolean {
  if (isElevated(role)) return true
  return CASHIER_ALLOWED_PERMISSIONS.has(permission)
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
  const { role, assignedBranchIds, loading } = useBusinessRole()

  const deny = (title: string, message: string) => {
    if (fallback) return <>{fallback}</>
    if (!showUnauthorized) return null
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <Shield className="h-16 w-16 text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">{title}</h2>
        <p className="text-gray-500 text-center">{message}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#004AAD]"></div>
      </div>
    )
  }

  if (!user) {
    if (fallback) return <>{fallback}</>
    if (!showUnauthorized) return null
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Required</h2>
        <p className="text-gray-500 text-center">You need to be logged in to access this area.</p>
      </div>
    )
  }

  // No resolved business role (no active membership) → deny. The backend would 403 every action
  // here anyway; failing closed is correct for invited staff whose role IS known.
  if (!role) {
    return deny('Access Required', 'Your account is not linked to a business yet.')
  }

  if (requiredPermission && !permissionAllowedForRole(requiredPermission, role)) {
    return deny('Insufficient Permissions', "You don't have access to this area.")
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    // 'admin' is elevated and passes any staff-role gate.
    const roleMatches = role === 'admin' || roles.includes(role as StaffRole)
    if (!roleMatches) {
      return deny(
        'Role Required',
        `This area requires ${Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole} role.`
      )
    }
  }

  if (requiredBranchAccess && !isElevated(role) && !assignedBranchIds.includes(requiredBranchAccess)) {
    return deny('Branch Access Required', "You don't have access to this branch.")
  }

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

// Hook for conditional rendering based on permissions (backend-role backed).
export function usePermissionCheck() {
  const { role, assignedBranchIds } = useBusinessRole()

  return {
    canRender: (permission: string) => (role ? permissionAllowedForRole(permission, role) : false),
    canRenderRole: (requiredRole: StaffRole | StaffRole[]) => {
      if (!role) return false
      if (role === 'admin') return true
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
      return roles.includes(role as StaffRole)
    },
    canRenderBranch: (branchId: string) =>
      role ? role === 'owner' || role === 'admin' || assignedBranchIds.includes(branchId) : false
  }
}
