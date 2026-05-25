import type { User } from 'firebase/auth'
import { BackendOnboardingStatus, getOnboardingStatus } from '@/lib/backend-api'

export type OnboardingStatus = BackendOnboardingStatus

export async function checkOnboardingStatus(user: User): Promise<OnboardingStatus> {
  return getOnboardingStatus(user)
}

export function shouldShowOnboarding(status: OnboardingStatus): boolean {
  return !status.hasBusiness
}

export function getOnboardingRedirectPath(status: OnboardingStatus): string {
  return status.hasBusiness ? '/dashboard' : '/onboarding'
}
