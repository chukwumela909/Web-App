'use client'

import type { ReactNode } from 'react'
import { AdminAccessProvider } from '@/contexts/AdminAccessContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { BranchProvider } from '@/contexts/BranchContext'
import { NotificationsProvider } from '@/contexts/NotificationsContext'
import { StaffProvider } from '@/contexts/StaffContext'
import { OnboardingProvider } from '@/components/onboarding/OnboardingProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <StaffProvider>
          <AdminAccessProvider>
            <NotificationsProvider>
              <OnboardingProvider>
                <BranchProvider>
                  {children}
                </BranchProvider>
              </OnboardingProvider>
            </NotificationsProvider>
          </AdminAccessProvider>
        </StaffProvider>
      </AuthProvider>
    </QueryProvider>
  )
}
