import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStaff } from '@/contexts/StaffContext'
import { useAuth } from '@/contexts/AuthContext'

export function useStaffRedirect() {
  const { user, loading: authLoading } = useAuth()
  const { staff, hasPermission, loading: staffLoading } = useStaff()
  const router = useRouter()

  useEffect(() => {
    // Don't redirect while loading
    if (authLoading || staffLoading) return
    
    // Don't redirect if no user
    if (!user) return

    // If not a staff member (owner), no need to redirect
    if (!staff) return

    // Get current path
    const currentPath = window.location.pathname

    // If already on a permitted page, don't redirect
    if (currentPath === '/dashboard/sales' && hasPermission('sales:read')) return
    if (currentPath === '/dashboard' && hasPermission('dashboard:read')) return

    // Smart redirect based on staff role and permissions
    const getRedirectPath = (): string => {
      // If staff member has dashboard permission, redirect to dashboard
      if (hasPermission('dashboard:read')) {
        return '/dashboard'
      }
      
      // If staff member only has sales permission, redirect to sales
      if (hasPermission('sales:read')) {
        return '/dashboard/sales'
      }
      
      // Fallback to sales (most restrictive)
      return '/dashboard/sales'
    }

    // Only redirect if on dashboard and no dashboard permission
    if (currentPath === '/dashboard' && !hasPermission('dashboard:read')) {
      const redirectPath = getRedirectPath()
      router.replace(redirectPath)
    }
  }, [user, staff, hasPermission, authLoading, staffLoading, router])
}
