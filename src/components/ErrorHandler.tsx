'use client'

import { useEffect } from 'react'
import { setupGlobalErrorHandlers } from '@/lib/error-handler'

export default function ErrorHandler() {
  useEffect(() => {
    setupGlobalErrorHandlers()
  }, [])

  return null // This component doesn't render anything
}
