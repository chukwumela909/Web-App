import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useStaff } from '@/contexts/StaffContext'
import { collection, query, where, getDocs } from 'firebase/firestore'
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

function getTimestampMillis(value: unknown): number {
  if (typeof value === 'number') return value
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? 0 : parsed
  }
  if (value && typeof value === 'object') {
    const timestamp = value as { seconds?: number; toMillis?: () => number }
    if (typeof timestamp.toMillis === 'function') return timestamp.toMillis()
    if (typeof timestamp.seconds === 'number') return timestamp.seconds * 1000
  }
  return 0
}

/**
 * Hook to check plan limits and enforce billing restrictions
 * For staff members, this uses the owner's subscription instead of the staff's
 */
export function usePlanLimits(): UsePlanLimitsReturn {
  const { user, backendSession, backendSessionLoading, refreshBackendSession } = useAuth()
  const { staff } = useStaff()
  // Use owner's ID for staff members to inherit subscription
  const effectiveUserId = staff ? staff.userId : user?.uid
  const [planTier, setPlanTier] = useState<PlanTier>('free')
  const [isLoading, setIsLoading] = useState(true)

  // Determine user's plan tier from the backend business account session.
  useEffect(() => {
    async function checkPlanTier() {
      if (!effectiveUserId) {
        setPlanTier('free')
        setIsLoading(false)
        return
      }

      try {
        const session = backendSession ?? await refreshBackendSession()
        const subscriptionEndDate = session?.subscriptionEndsAt ? new Date(session.subscriptionEndsAt) : null
        const status = String(session?.subscriptionStatus || '').toLowerCase()
        const planTierValue = String(session?.planTier || '').toLowerCase()
        const isPro = Boolean(
          planTierValue === 'paid' &&
          status === 'active' &&
          subscriptionEndDate &&
          subscriptionEndDate > new Date()
        )

        setPlanTier(isPro ? 'pro' : 'free')
      } catch (error) {
        console.error('Error checking plan tier:', error)
        setPlanTier('free') // Default to free on error
      } finally {
        setIsLoading(false)
      }
    }

    if (!backendSessionLoading) {
      checkPlanTier()
    }
  }, [effectiveUserId, backendSession, backendSessionLoading, refreshBackendSession])

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
   * Uses effectiveUserId so staff members count against owner's limits
   */
  const checkLimit = useCallback(
    async (feature: keyof typeof PLAN_LIMITS.free): Promise<PlanLimitCheck> => {
      if (!effectiveUserId) {
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

      // Pro plan is unlimited for everything EXCEPT branches, which the backend
      // hard-caps at 6 (account.service.ts → branch_limit_reached). For branches we
      // always fall through and count the user's real branches against the limit.
      if (feature !== 'branches' && (planTier === 'pro' || numericLimit === Infinity)) {
        return {
          allowed: true,
          currentCount: 0,
          limit: 'unlimited',
          limitReached: false,
        }
      }

      // Branches: the limit is finite (6) on the pro plan. Only treat it as open
      // if the configured limit somehow resolved to unlimited.
      if (feature === 'branches' && numericLimit === Infinity) {
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
        if (feature === 'dailySales') {
          const { startOfDay, endOfDay } = getTodayRange()
          const startTime = startOfDay.getTime()
          const endTime = endOfDay.getTime()
          const saleCollections = ['sales', 'multi_item_sales']
          const snapshots = await Promise.all(
            saleCollections.map(name =>
              getDocs(query(collection(db, name), where('userId', '==', effectiveUserId)))
            )
          )

          currentCount = snapshots.reduce((count, snapshot) => {
            const todaysSales = snapshot.docs.filter(saleDoc => {
              const data = saleDoc.data() as { timestamp?: unknown; isDeleted?: boolean }
              const saleTime = getTimestampMillis(data.timestamp)
              return data.isDeleted !== true && saleTime >= startTime && saleTime <= endTime
            })
            return count + todaysSales.length
          }, 0)
        } else {
          const collectionRef = collection(db, collectionName)
          const q = query(collectionRef, where('userId', '==', effectiveUserId))
          const snapshot = await getDocs(q)
          currentCount = snapshot.size
        }

        const limitReached = currentCount >= numericLimit
        const allowed = !limitReached

        // Branches are a hard cap (same ceiling regardless of plan), so the
        // message must not promise "unlimited" on upgrade.
        const limitMessage = feature === 'branches'
          ? `You've reached the maximum of ${numericLimit} ${numericLimit === 1 ? 'branch' : 'branches'}.`
          : `You've reached the ${FEATURE_NAMES[feature]} limit (${numericLimit}) for the Free plan. Upgrade to Pro for unlimited access.`

        return {
          allowed,
          currentCount,
          limit: numericLimit,
          limitReached,
          message: limitReached ? limitMessage : undefined,
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
    [effectiveUserId, planTier, getTodayRange]
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
    if (!effectiveUserId) {
      setPlanTier('free')
      setIsLoading(false)
      return
    }

    try {
      const session = await refreshBackendSession()
      const subscriptionEndDate = session?.subscriptionEndsAt ? new Date(session.subscriptionEndsAt) : null
      const isPro = Boolean(
        session?.planTier === 'paid' &&
        session?.subscriptionStatus === 'active' &&
        subscriptionEndDate &&
        subscriptionEndDate > new Date()
      )
      setPlanTier(isPro ? 'pro' : 'free')
    } catch (error) {
      console.error('Error refreshing limits:', error)
      setPlanTier('free')
    } finally {
      setIsLoading(false)
    }
  }, [effectiveUserId, refreshBackendSession])

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
