'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { checkOnboardingStatus, OnboardingStatus, getOnboardingRedirectPath } from '@/lib/onboarding-utils'

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
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCompletingOnboarding, setIsCompletingOnboarding] = useState(false)

  const refreshOnboardingStatus = async () => {
    if (!user) {
      setOnboardingStatus(null)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const status = await checkOnboardingStatus(user.uid)
      setOnboardingStatus(status)
    } catch (error) {
      console.error('Error refreshing onboarding status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading) {
      refreshOnboardingStatus()
    }
  }, [user, authLoading])

  // Redirect logic based on onboarding status
  useEffect(() => {
    if (authLoading || isLoading || !user || !onboardingStatus || isCompletingOnboarding) return

    // Don't redirect if on auth pages (login, signup)
    if (pathname === '/login' || pathname === '/signup') return
    
    // Don't redirect if user is super admin
    // (Super admins might not need onboarding)
    if (pathname.startsWith('/super-admin')) return

    // Only redirect if onboarding is NOT completed and NOT skipped
    if (!onboardingStatus.completed && !onboardingStatus.skipped) {
      // User needs to complete onboarding
      if (!pathname.startsWith('/onboarding')) {
        router.push('/onboarding')
      }
    } else {
      // User has completed onboarding - let them navigate freely
      // Only redirect from onboarding page to dashboard if they're done
      if (pathname === '/onboarding') {
        router.push('/dashboard')
      }
    }
  }, [user, onboardingStatus, authLoading, isLoading, pathname, router, isCompletingOnboarding])

  const setCompletingOnboarding = (completing: boolean) => {
    setIsCompletingOnboarding(completing)
  }

  const value = {
    onboardingStatus,
    isLoading: authLoading || isLoading,
    refreshOnboardingStatus,
    setCompletingOnboarding
  }

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  )
}
