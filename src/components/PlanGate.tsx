'use client'

import React, { useEffect, useState } from 'react'
import { usePlanLimits } from '@/hooks/usePlanLimits'
import { UpgradeModal } from '@/components/UpgradeModal'
import { FEATURE_NAMES } from '@/lib/plan-limits'
import { Loader2 } from 'lucide-react'

interface PlanGateProps {
  feature: 'branches' | 'staff' | 'reports'
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Component that gates access to Pro-only features
 * Shows upgrade modal for free users, renders children for pro users
 */
export function PlanGate({ feature, children, fallback }: PlanGateProps) {
  const { planTier, isLoading, canAddBranch, canAddStaff, canAccessReports } = usePlanLimits()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [hasAccess, setHasAccess] = useState(false)

  useEffect(() => {
    async function checkAccess() {
      if (isLoading) return

      let result
      switch (feature) {
        case 'branches':
          result = await canAddBranch()
          break
        case 'staff':
          result = await canAddStaff()
          break
        case 'reports':
          result = canAccessReports()
          break
      }

      setHasAccess(result.allowed)
      
      // Show upgrade modal immediately if user doesn't have access
      if (!result.allowed) {
        setShowUpgradeModal(true)
      }
    }

    checkAccess()
  }, [feature, isLoading, planTier, canAddBranch, canAddStaff, canAccessReports])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <>
        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          feature={feature}
          message={`${FEATURE_NAMES[feature]} ${feature === 'reports' ? 'are' : 'is'} only available on the Pro plan. Upgrade now to unlock this powerful feature.`}
        />
        {fallback || (
          <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
            <div className="max-w-md space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {FEATURE_NAMES[feature]} - Pro Feature
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                This feature is available exclusively on the Pro plan. Upgrade to unlock unlimited access.
              </p>
            </div>
          </div>
        )}
      </>
    )
  }

  return <>{children}</>
}
