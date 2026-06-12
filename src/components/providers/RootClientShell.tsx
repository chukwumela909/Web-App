'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

const AppProviders = dynamic(() => import('@/components/providers/AppProviders'))
const ChatwootWidget = dynamic(() => import('@/components/ChatwootWidget'), {
  ssr: false
})

const APP_PROVIDER_PREFIXES = [
  '/admin',
  '/dashboard',
  '/login',
  '/onboarding',
  '/sales',
  '/staff',
  '/staff-dashboard',
  '/super-admin',
  '/unauthorized'
]

function shouldUseAppProviders(pathname: string) {
  return APP_PROVIDER_PREFIXES.some((prefix) => (
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  ))
}

export default function RootClientShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '/'
  const content = shouldUseAppProviders(pathname)
    ? <AppProviders>{children}</AppProviders>
    : children

  return (
    <>
      {content}
      <ChatwootWidget />
    </>
  )
}
