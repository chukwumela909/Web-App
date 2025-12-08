/**
 * Plan Limits Configuration
 * Defines feature limits for Free and Pro plans
 */

export type PlanTier = 'free' | 'pro'

export interface PlanLimits {
  products: number | 'unlimited'
  dailySales: number | 'unlimited'
  branches: number | 'unlimited'
  staff: number | 'unlimited'
  suppliers: number | 'unlimited'
  debtors: number | 'unlimited'
  reports: boolean
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    products: 10,
    dailySales: 5,
    branches: 0, // No access
    staff: 0, // No access
    suppliers: 5,
    debtors: 5,
    reports: false,
  },
  pro: {
    products: 'unlimited',
    dailySales: 'unlimited',
    branches: 'unlimited',
    staff: 'unlimited',
    suppliers: 'unlimited',
    debtors: 'unlimited',
    reports: true,
  },
}

/**
 * Feature names for user-facing messages
 */
export const FEATURE_NAMES: Record<keyof PlanLimits, string> = {
  products: 'Products',
  dailySales: 'Daily Sales',
  branches: 'Branches',
  staff: 'Staff Members',
  suppliers: 'Suppliers',
  debtors: 'Debtors',
  reports: 'Reports',
}

/**
 * Check if a limit is unlimited
 */
export function isUnlimited(limit: number | 'unlimited' | boolean): boolean {
  return limit === 'unlimited' || limit === true
}

/**
 * Get the numeric limit value (returns Infinity for unlimited)
 */
export function getNumericLimit(limit: number | 'unlimited' | boolean): number {
  if (limit === 'unlimited' || limit === true) return Infinity
  if (typeof limit === 'boolean') return limit ? Infinity : 0
  return limit
}
