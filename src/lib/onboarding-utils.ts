// Onboarding utility functions for checking user onboarding status
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface OnboardingStatus {
  completed: boolean
  skipped: boolean
  currentStep: number
  hasOnboardingData: boolean
}

export async function checkOnboardingStatus(userId: string): Promise<OnboardingStatus> {
  try {
    // Check user profile for onboarding flags
    const userProfileRef = doc(db, 'userProfiles', userId)
    const userProfileSnap = await getDoc(userProfileRef)
    
    if (userProfileSnap.exists()) {
      const userData = userProfileSnap.data()
      
      // Check if onboarding is explicitly completed or skipped
      if (userData.onboardingCompleted === true) {
        return {
          completed: true,
          skipped: userData.onboardingSkipped === true,
          currentStep: 7, // Final step
          hasOnboardingData: true
        }
      }
    }

    // Check if there's partial onboarding data
    const onboardingRef = doc(db, 'onboardingData', userId)
    const onboardingSnap = await getDoc(onboardingRef)
    
    if (onboardingSnap.exists()) {
      const onboardingData = onboardingSnap.data()
      return {
        completed: false,
        skipped: false,
        currentStep: onboardingData.currentStep || 1,
        hasOnboardingData: true
      }
    }

    // No onboarding data found - new user
    return {
      completed: false,
      skipped: false,
      currentStep: 1,
      hasOnboardingData: false
    }
  } catch (error) {
    console.error('Error checking onboarding status:', error)
    // Default to incomplete onboarding on error
    return {
      completed: false,
      skipped: false,
      currentStep: 1,
      hasOnboardingData: false
    }
  }
}

export function shouldShowOnboarding(status: OnboardingStatus): boolean {
  return !status.completed && !status.skipped
}

export function getOnboardingRedirectPath(status: OnboardingStatus): string {
  if (status.completed || status.skipped) {
    return '/dashboard'
  }
  return '/onboarding'
}
