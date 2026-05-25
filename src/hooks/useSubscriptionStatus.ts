import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface SubscriptionStatus {
  isSubscribed: boolean
  subscriptionId: string | null
  subscriptionEndDate: Date | null
  isLoading: boolean
  error: string | null
}

/**
 * Hook to check the current user's subscription status
 * Returns subscription info from user profile
 * For staff members, this checks the owner's subscription (inherited)
 */
export function useSubscriptionStatus(): SubscriptionStatus {
  const {
    user,
    backendSession,
    backendSessionError,
    backendSessionLoading,
    refreshBackendSession
  } = useAuth()
  const refreshAttemptedForUid = useRef<string | null>(null)
  
  const [status, setStatus] = useState<SubscriptionStatus>({
    isSubscribed: false,
    subscriptionId: null,
    subscriptionEndDate: null,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    async function checkSubscription() {
      if (!user) {
        refreshAttemptedForUid.current = null
        setStatus({
          isSubscribed: false,
          subscriptionId: null,
          subscriptionEndDate: null,
          isLoading: false,
          error: null,
        })
        return
      }

      try {
        let session = backendSession
        if (!session && refreshAttemptedForUid.current !== user.uid) {
          refreshAttemptedForUid.current = user.uid
          session = await refreshBackendSession()
        }

        const subscriptionEndDate = session?.subscriptionEndsAt
          ? new Date(session.subscriptionEndsAt)
          : null
        const statusValue = String(session?.subscriptionStatus || '').toLowerCase()
        const isActive = Boolean(
          statusValue === 'active' ||
          statusValue === 'trialing' ||
          (subscriptionEndDate && subscriptionEndDate > new Date())
        )

        setStatus({
          isSubscribed: isActive,
          subscriptionId: null,
          subscriptionEndDate,
          isLoading: backendSessionLoading,
          error: session ? null : backendSessionError,
        })
      } catch (error) {
        console.error('Error checking subscription status:', error)
        setStatus({
          isSubscribed: false,
          subscriptionId: null,
          subscriptionEndDate: null,
          isLoading: false,
          error: 'Failed to check subscription',
        })
      }
    }

    if (!backendSessionLoading) {
      checkSubscription()
    }
  }, [user, backendSession, backendSessionError, backendSessionLoading, refreshBackendSession])

  return status
}

/**
 * Check if a specific feature requires Pro subscription
 */
export function isProFeature(feature: string): boolean {
  const proFeatures = [
    'debtors',
    'advanced_reports',
    'profit_reports',
    'unlimited_branches',
    'staff_management',
    'multi_device_sync',
    'priority_support',
  ]
  return proFeatures.includes(feature)
}
