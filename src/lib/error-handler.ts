/**
 * Utility functions for handling errors and filtering out browser extension noise
 */

export function isBrowserExtensionError(error: Error | string): boolean {
  const message = typeof error === 'string' ? error : error.message
  
  const extensionErrorPatterns = [
    'message channel closed',
    'listener indicated an asynchronous response',
    'Extension context invalidated',
    'chrome-extension://',
    'moz-extension://',
    'safari-extension://',
    'The message port closed before a response was received',
    'Could not establish connection'
  ]
  
  return extensionErrorPatterns.some(pattern => 
    message.toLowerCase().includes(pattern.toLowerCase())
  )
}

export function handleError(error: unknown, context: string = 'Unknown'): {
  shouldShow: boolean
  message: string
  isExtensionError: boolean
} {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const isExtensionError = error instanceof Error && isBrowserExtensionError(error)
  
  if (isExtensionError) {
    console.warn(`Browser extension error in ${context}:`, errorMessage)
    return {
      shouldShow: false,
      message: errorMessage,
      isExtensionError: true
    }
  }
  
  console.error(`Error in ${context}:`, error)
  return {
    shouldShow: true,
    message: errorMessage,
    isExtensionError: false
  }
}

// Global error handler for unhandled promise rejections
export function setupGlobalErrorHandlers(): void {
  if (typeof window !== 'undefined') {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason
      if (error instanceof Error && isBrowserExtensionError(error)) {
        console.warn('Unhandled browser extension error:', error.message)
        event.preventDefault() // Prevent the error from being logged to console
      }
    })
    
    // Handle general errors
    window.addEventListener('error', (event) => {
      if (event.error instanceof Error && isBrowserExtensionError(event.error)) {
        console.warn('Browser extension error:', event.error.message)
        event.preventDefault()
      }
    })
  }
}
