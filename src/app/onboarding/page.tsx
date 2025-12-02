'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function OnboardingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Show loading while auth state is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#004AAD] mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <ProtectedRoute>
      <OnboardingWizard />
    </ProtectedRoute>
  )
}
