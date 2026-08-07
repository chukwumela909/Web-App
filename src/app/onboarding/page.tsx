'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'
import PendingInviteNotice from '@/components/onboarding/PendingInviteNotice'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { listMyPendingBackendInvitations, type BackendPendingInvitation } from '@/lib/backend-business-api'

export default function OnboardingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  // null = still checking. Invited staff join an existing business, so the business
  // wizard doesn't apply to them — show their pending invitation instead.
  const [pendingInvites, setPendingInvites] = useState<BackendPendingInvitation[] | null>(null)
  const [startOwnBusiness, setStartOwnBusiness] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [loading, user, router])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    listMyPendingBackendInvitations()
      .then((invites) => {
        if (!cancelled) setPendingInvites(Array.isArray(invites) ? invites : [])
      })
      .catch(() => {
        // If the check fails, fall back to the normal wizard rather than blocking onboarding.
        if (!cancelled) setPendingInvites([])
      })
    return () => {
      cancelled = true
    }
  }, [user])

  // Show loading while auth state or the pending-invite check is being determined
  if (loading || (user && pendingInvites === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#004AAD] mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirecting to login via the effect above
  if (!user) {
    return null
  }

  if (pendingInvites && pendingInvites.length > 0 && !startOwnBusiness) {
    return (
      <ProtectedRoute>
        <PendingInviteNotice
          invitations={pendingInvites}
          onStartOwnBusiness={() => setStartOwnBusiness(true)}
        />
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <OnboardingWizard />
    </ProtectedRoute>
  )
}
