'use client'

import { useAuth } from '@/contexts/AuthContext'

export type BusinessRole = 'owner' | 'manager' | 'cashier' | 'admin'

export interface BusinessRoleInfo {
  /** Authoritative business role from the backend session (`/me`), or null when unknown. */
  role: BusinessRole | null
  isOwner: boolean
  isManager: boolean
  /** True only when the role is exactly `cashier` (NOT cumulative — unlike StaffContext). */
  isCashier: boolean
  /**
   * Whether cost price / profit / margin / stock value may be shown to this user.
   * Per the spec's "Clean System Rules", cost is hidden from cashiers. Fails closed:
   * when the role is unknown we hide cost rather than risk leaking it.
   */
  canSeeCost: boolean
  /** Branch ids this user is scoped to (empty for owners, who see all branches). */
  assignedBranchIds: string[]
  loading: boolean
}

/**
 * Authoritative business-role hook backed by the backend session.
 *
 * Use this — not StaffContext — for cost visibility and branch-scoping decisions.
 * StaffContext derives roles from a separate Firestore collection and its booleans are
 * cumulative (isCashier is true for managers/owners), which is wrong for cost gating.
 */
export function useBusinessRole(): BusinessRoleInfo {
  const { backendSession, backendSessionLoading } = useAuth()
  const raw = String(backendSession?.role ?? '').toLowerCase()
  const role: BusinessRole | null =
    raw === 'owner' || raw === 'manager' || raw === 'cashier' || raw === 'admin' ? (raw as BusinessRole) : null

  return {
    role,
    isOwner: role === 'owner',
    isManager: role === 'manager',
    isCashier: role === 'cashier',
    canSeeCost: role !== null && role !== 'cashier',
    assignedBranchIds: backendSession?.assignedBranchIds ?? [],
    loading: backendSessionLoading
  }
}
