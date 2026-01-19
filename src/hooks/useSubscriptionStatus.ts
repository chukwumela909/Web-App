import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useStaff } from '@/contexts/StaffContext'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

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
  const { user } = useAuth()
  const { staff } = useStaff()
  // Use owner's ID for staff members to inherit subscription
  const effectiveUserId = staff ? staff.userId : user?.uid
  
  const [status, setStatus] = useState<SubscriptionStatus>({
    isSubscribed: false,
    subscriptionId: null,
    subscriptionEndDate: null,
    isLoading: true,
    error: null,
  })

  useEffect(() => {
    async function checkSubscription() {
      if (!effectiveUserId) {
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
        // Check user profile for subscription status
        // Uses effectiveUserId so staff inherits owner's subscription
        const userProfileRef = doc(db, 'userProfiles', effectiveUserId)
        const userProfileSnap = await getDoc(userProfileRef)

        if (userProfileSnap.exists()) {
          const data = userProfileSnap.data()
          const isSubscribed = data.isSubscribed === true
          const subscriptionEndDate = data.subscriptionEndDate 
            ? new Date(data.subscriptionEndDate.seconds ? data.subscriptionEndDate.seconds * 1000 : data.subscriptionEndDate)
            : null

          // Check if subscription is still valid (not expired)
          const isActive = Boolean(isSubscribed && subscriptionEndDate !== null && subscriptionEndDate > new Date())

          setStatus({
            isSubscribed: isActive,
            subscriptionId: data.subscriptionId || null,
            subscriptionEndDate,
            isLoading: false,
            error: null,
          })
        } else {
          // No profile found, not subscribed
          setStatus({
            isSubscribed: false,
            subscriptionId: null,
            subscriptionEndDate: null,
            isLoading: false,
            error: null,
          })
        }
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

    checkSubscription()
  }, [effectiveUserId])

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
