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
  expenses: boolean
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    products: 10,
    dailySales: 5,
    branches: 1, // One included main branch; additional branches require Pro
    staff: 0, // No access
    suppliers: 0, // No access — Pro only (backend also 403s supplier routes for free accounts)
    debtors: 0, // No access — Pro only (backend also 403s debtor routes for free accounts)
    reports: false,
    expenses: false, // No access — Pro only (backend also 403s expense routes for free accounts)
  },
  pro: {
    products: 'unlimited',
    dailySales: 'unlimited',
    branches: 6, // Backend caps paid-tier accounts at 6 branches (account.service.ts)
    staff: 'unlimited',
    suppliers: 'unlimited',
    debtors: 'unlimited',
    reports: true,
    expenses: true,
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
  expenses: 'Expenses',
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
