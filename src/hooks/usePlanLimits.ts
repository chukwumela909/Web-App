import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { PLAN_LIMITS, PlanTier, getNumericLimit, FEATURE_NAMES } from '@/lib/plan-limits'

interface PlanLimitCheck {
  allowed: boolean
  currentCount: number
  limit: number | 'unlimited'
  limitReached: boolean
  message?: string
}

interface UsePlanLimitsReturn {
  planTier: PlanTier
  isLoading: boolean
  checkLimit: (feature: keyof typeof PLAN_LIMITS.free) => Promise<PlanLimitCheck>
  canAddProduct: () => Promise<PlanLimitCheck>
  canRecordSale: () => Promise<PlanLimitCheck>
  canAddBranch: () => Promise<PlanLimitCheck>
  canAddStaff: () => Promise<PlanLimitCheck>
  canAddSupplier: () => Promise<PlanLimitCheck>
  canAddDebtor: () => Promise<PlanLimitCheck>
  canAccessReports: () => PlanLimitCheck
  refreshLimits: () => Promise<void>
}

/**
 * Hook to check plan limits and enforce billing restrictions
 */
export function usePlanLimits(): UsePlanLimitsReturn {
  const { user } = useAuth()
  const [planTier, setPlanTier] = useState<PlanTier>('free')
  const [isLoading, setIsLoading] = useState(true)

  // Determine user's plan tier
  useEffect(() => {
    async function checkPlanTier() {
      if (!user?.uid) {
        setPlanTier('free')
        setIsLoading(false)
        return
      }

      try {
        // Check subscription status from subscriptions collection
        const subscriptionsRef = collection(db, 'subscriptions')
        const q = query(
          subscriptionsRef,
          where('userId', '==', user.uid),
          where('status', '==', 'active')
        )
        const snapshot = await getDocs(q)

        if (!snapshot.empty) {
          // Has active subscription = Pro plan
          const subscription = snapshot.docs[0].data()
          const endDate = subscription.endDate
            ? new Date(
                subscription.endDate.seconds
                  ? subscription.endDate.seconds * 1000
                  : subscription.endDate
              )
            : null

          // Verify subscription hasn't expired
          if (endDate && endDate > new Date()) {
            setPlanTier('pro')
          } else {
            setPlanTier('free')
          }
        } else {
          setPlanTier('free')
        }
      } catch (error) {
        console.error('Error checking plan tier:', error)
        setPlanTier('free') // Default to free on error
      } finally {
        setIsLoading(false)
      }
    }

    checkPlanTier()
  }, [user?.uid])

  /**
   * Get today's date range in user's local timezone
   */
  const getTodayRange = useCallback(() => {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    return { startOfDay, endOfDay }
  }, [])

  /**
   * Generic limit checker
   */
  const checkLimit = useCallback(
    async (feature: keyof typeof PLAN_LIMITS.free): Promise<PlanLimitCheck> => {
      if (!user?.uid) {
        return {
          allowed: false,
          currentCount: 0,
          limit: 0,
          limitReached: true,
          message: 'Please sign in to continue',
        }
      }

      const limits = PLAN_LIMITS[planTier]
      const limit = limits[feature]
      const numericLimit = getNumericLimit(limit)

      // Pro plan has unlimited access
      if (planTier === 'pro' || numericLimit === Infinity) {
        return {
          allowed: true,
          currentCount: 0,
          limit: 'unlimited',
          limitReached: false,
        }
      }

      // Check current count based on feature
      let currentCount = 0
      let collectionName = ''

      switch (feature) {
        case 'products':
          collectionName = 'products'
          break
        case 'suppliers':
          collectionName = 'suppliers'
          break
        case 'debtors':
          collectionName = 'debtors'
          break
        case 'branches':
          collectionName = 'branches'
          break
        case 'staff':
          collectionName = 'staff'
          break
        case 'dailySales':
          collectionName = 'sales'
          break
        case 'reports':
          return {
            allowed: false,
            currentCount: 0,
            limit: 0,
            limitReached: true,
            message: `${FEATURE_NAMES[feature]} are only available on the Pro plan. Upgrade to access detailed business reports.`,
          }
      }

      try {
        const collectionRef = collection(db, collectionName)
        let q = query(collectionRef, where('userId', '==', user.uid))

        // For daily sales, filter by today's date
        if (feature === 'dailySales') {
          const { startOfDay, endOfDay } = getTodayRange()
          q = query(
            collectionRef,
            where('userId', '==', user.uid),
            where('timestamp', '>=', Timestamp.fromDate(startOfDay)),
            where('timestamp', '<=', Timestamp.fromDate(endOfDay))
          )
        }

        const snapshot = await getDocs(q)
        currentCount = snapshot.size

        const limitReached = currentCount >= numericLimit
        const allowed = !limitReached

        return {
          allowed,
          currentCount,
          limit: numericLimit,
          limitReached,
          message: limitReached
            ? `You've reached the ${FEATURE_NAMES[feature]} limit (${numericLimit}) for the Free plan. Upgrade to Pro for unlimited access.`
            : undefined,
        }
      } catch (error) {
        console.error(`Error checking ${feature} limit:`, error)
        return {
          allowed: false,
          currentCount: 0,
          limit: numericLimit,
          limitReached: true,
          message: `Error checking ${FEATURE_NAMES[feature]} limit`,
        }
      }
    },
    [user?.uid, planTier, getTodayRange]
  )

  // Feature-specific checkers
  const canAddProduct = useCallback(() => checkLimit('products'), [checkLimit])
  const canRecordSale = useCallback(() => checkLimit('dailySales'), [checkLimit])
  const canAddBranch = useCallback(() => checkLimit('branches'), [checkLimit])
  const canAddStaff = useCallback(() => checkLimit('staff'), [checkLimit])
  const canAddSupplier = useCallback(() => checkLimit('suppliers'), [checkLimit])
  const canAddDebtor = useCallback(() => checkLimit('debtors'), [checkLimit])

  const canAccessReports = useCallback((): PlanLimitCheck => {
    const hasAccess = planTier === 'pro'
    return {
      allowed: hasAccess,
      currentCount: 0,
      limit: hasAccess ? 'unlimited' : 0,
      limitReached: !hasAccess,
      message: hasAccess
        ? undefined
        : 'Reports are only available on the Pro plan. Upgrade to access detailed business analytics.',
    }
  }, [planTier])

  const refreshLimits = useCallback(async () => {
    setIsLoading(true)
    // Re-check plan tier
    if (!user?.uid) {
      setPlanTier('free')
      setIsLoading(false)
      return
    }

    try {
      const subscriptionsRef = collection(db, 'subscriptions')
      const q = query(
        subscriptionsRef,
        where('userId', '==', user.uid),
        where('status', '==', 'active')
      )
      const snapshot = await getDocs(q)

      if (!snapshot.empty) {
        const subscription = snapshot.docs[0].data()
        const endDate = subscription.endDate
          ? new Date(
              subscription.endDate.seconds
                ? subscription.endDate.seconds * 1000
                : subscription.endDate
            )
          : null

        if (endDate && endDate > new Date()) {
          setPlanTier('pro')
        } else {
          setPlanTier('free')
        }
      } else {
        setPlanTier('free')
      }
    } catch (error) {
      console.error('Error refreshing limits:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.uid])

  return {
    planTier,
    isLoading,
    checkLimit,
    canAddProduct,
    canRecordSale,
    canAddBranch,
    canAddStaff,
    canAddSupplier,
    canAddDebtor,
    canAccessReports,
    refreshLimits,
  }
}
