'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { checkOnboardingStatus, OnboardingStatus } from '@/lib/onboarding-utils'

interface OnboardingContextType {
  onboardingStatus: OnboardingStatus | null
  isLoading: boolean
  refreshOnboardingStatus: () => Promise<void>
  setCompletingOnboarding: (completing: boolean) => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, backendSession, backendSessionLoading, isSuperAdmin } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCompletingOnboarding, setIsCompletingOnboarding] = useState(false)
  const isStaffRoute = pathname.startsWith('/staff-dashboard')
  // Staff accepting an invitation have no business of their own yet (hasBusiness === false);
  // don't bounce them to /onboarding before they can accept.
  const isInviteRoute = pathname.startsWith('/staff/invite')
  const isAuthRoute = pathname === '/login' || pathname === '/signup'
  const isOnboardingRoute = pathname.startsWith('/onboarding')
  const isSuperAdminRoute = pathname.startsWith('/super-admin')

  const refreshOnboardingStatus = async () => {
    if (!user) {
      setOnboardingStatus(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const status = await checkOnboardingStatus(user)
      setOnboardingStatus(status)
    } catch (error) {
      console.error('Error refreshing onboarding status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && !backendSessionLoading) {
      if (backendSession?.onboardingStatus) {
        setOnboardingStatus(backendSession.onboardingStatus)
        setIsLoading(false)
        return
      }
      refreshOnboardingStatus()
    }
  }, [user, authLoading, backendSessionLoading, backendSession])

  // Redirect logic based on onboarding status
  useEffect(() => {
    if (authLoading || backendSessionLoading || isLoading || !user || !onboardingStatus || isCompletingOnboarding) return

    // Don't redirect if on auth pages (login, signup)
    if (isAuthRoute) return
    
    // Don't redirect if user is super admin
    // (Super admins might not need onboarding)
    if (isSuperAdmin || isSuperAdminRoute || isStaffRoute || isInviteRoute) return

    if (!onboardingStatus.hasBusiness) {
      if (!isOnboardingRoute) {
        router.push('/onboarding')
      }
    } else {
      if (pathname === '/onboarding') {
        router.push('/dashboard')
      }
    }
  }, [
    user,
    onboardingStatus,
    authLoading,
    backendSessionLoading,
    isLoading,
    pathname,
    router,
    isCompletingOnboarding,
    isSuperAdmin,
    isAuthRoute,
    isSuperAdminRoute,
    isStaffRoute,
    isOnboardingRoute
  ])

  const setCompletingOnboarding = (completing: boolean) => {
    setIsCompletingOnboarding(completing)
  }

  const value = {
    onboardingStatus,
    isLoading: authLoading || backendSessionLoading || isLoading,
    refreshOnboardingStatus,
    setCompletingOnboarding
  }

  return (
    <OnboardingContext.Provider value={value}>
      {user &&
      onboardingStatus &&
      !onboardingStatus.hasBusiness &&
      !isCompletingOnboarding &&
      !isAuthRoute &&
      !isOnboardingRoute &&
      !isSuperAdmin &&
      !isSuperAdminRoute &&
      !isStaffRoute ? null : children}
    </OnboardingContext.Provider>
  )
}
