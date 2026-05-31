'use client'

import React, { createContext, useCallback, useContext, useEffect, useState, useRef } from 'react'
import {
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth'
import { auth, RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, linkWithCredential, signInWithCredential } from '@/lib/firebase'
import { BackendSession, getMe, isBackendApiError, phoneExists } from '@/lib/backend-api'

type PlatformRole = 'super_admin' | 'admin' | 'viewer' | 'user'

interface UserRole {
  id: string
  email: string
  displayName: string
  role: PlatformRole
  createdAt: Date
  lastLogin?: Date
  permissions: string[]
}

const PLATFORM_ROLE_PERMISSIONS: Record<PlatformRole, string[]> = {
  super_admin: [
    'dashboard:read',
    'users:read',
    'users:write',
    'users:delete',
    'behavior:read',
    'alerts:read',
    'alerts:write',
    'reports:read',
    'reports:write',
    'reports:export',
    'settings:read',
    'settings:write',
    'admin:manage'
  ],
  admin: [
    'dashboard:read',
    'users:read',
    'behavior:read',
    'alerts:read',
    'alerts:write',
    'reports:read',
    'reports:write',
    'reports:export'
  ],
  viewer: [
    'dashboard:read',
    'users:read',
    'behavior:read',
    'alerts:read',
    'reports:read'
  ],
  user: [
    'dashboard:read'
  ]
}

interface AuthContextType {
  user: User | null
  userRole: UserRole | null
  backendSession: BackendSession | null
  backendSessionLoading: boolean
  backendSessionError: string | null
  loading: boolean
  roleLoading: boolean
  refreshBackendSession: () => Promise<BackendSession | null>
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, businessName?: string, phoneNumber?: string, country?: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  isSuperAdmin: boolean
  isAdmin: boolean
  // Phone auth methods
  sendOtp: (phoneNumber: string) => Promise<void>
  verifyOtp: (otp: string) => Promise<void>
  sendLoginOtp: (phoneNumber: string) => Promise<void>
  verifyLoginOtp: (otp: string) => Promise<void>
  verificationId: string
  setPendingRegistration: (data: { email: string; password: string; businessName: string; phoneNumber: string; country: string } | null) => void
  clearRecaptcha: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function getPlatformRole(session: BackendSession | null): PlatformRole | null {
  const platformRole = String(session?.auth?.platformRole || '').toLowerCase()
  if (platformRole === 'super_admin' || platformRole === 'superadmin' || platformRole === 'platform_admin' || platformRole === 'admin') {
    return 'super_admin'
  }
  if (platformRole === 'viewer') {
    return platformRole
  }
  return null
}

function getUserRoleFromBackendSession(session: BackendSession | null): UserRole | null {
  const role = getPlatformRole(session)
  if (!role || !session) return null

  return {
    id: session.auth.firebaseUid || session.userId,
    email: session.auth.email || '',
    displayName: session.auth.name || session.auth.email || role,
    role,
    createdAt: new Date(),
    permissions: PLATFORM_ROLE_PERMISSIONS[role]
  }
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [backendSession, setBackendSession] = useState<BackendSession | null>(null)
  const [backendSessionLoading, setBackendSessionLoading] = useState(false)
  const [backendSessionError, setBackendSessionError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [roleLoading, setRoleLoading] = useState(false)
  const [verificationId, setVerificationId] = useState<string>('')
  
  // Store pending registration data for phone auth flow
  const pendingRegistrationRef = useRef<{
    email: string
    password: string
    businessName: string
    phoneNumber: string
    country: string
  } | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      
      if (user) {
        setRoleLoading(true)
        setBackendSessionLoading(true)
        setBackendSessionError(null)

        const session = await getMe(user).catch(async (error) => {
          if (isBackendApiError(error) && (error.code === 'missing_auth_token' || error.code === 'invalid_auth_token')) {
            await signOut(auth)
            return null
          }

          console.error('Error bootstrapping backend session:', error)
          setBackendSessionError(error instanceof Error ? error.message : 'Unable to load account session.')
          return null
        })
        const role = getUserRoleFromBackendSession(session)

        setUserRole(role)
        setBackendSession(session)
        setRoleLoading(false)
        setBackendSessionLoading(false)
      } else {
        setUserRole(null)
        setBackendSession(null)
        setBackendSessionError(null)
        setRoleLoading(false)
        setBackendSessionLoading(false)
      }
      
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const register = async (email: string, password: string, businessName?: string, phoneNumber?: string, country?: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    
    if (businessName && user) {
      await updateProfile(user, {
        displayName: businessName
      })
    }

    if (typeof window !== 'undefined') {
      if (businessName) window.localStorage.setItem('fahampesa:onboardingBusinessName', businessName)
      if (phoneNumber) window.localStorage.setItem('fahampesa:onboardingPhoneNumber', phoneNumber)
      if (country) window.localStorage.setItem('fahampesa:onboardingCountry', country)
    }
  }

  const logout = async () => {
    await signOut(auth)
    setUserRole(null)
    setBackendSession(null)
    setBackendSessionError(null)
  }

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email)
  }

  // Clear reCAPTCHA on unmount or error
  const clearRecaptcha = () => {
    const windowWithRecaptcha = window as unknown as { recaptchaVerifier?: RecaptchaVerifier }
    if (windowWithRecaptcha.recaptchaVerifier) {
      try {
        windowWithRecaptcha.recaptchaVerifier.clear()
      } catch {
        // Ignore errors when clearing
      }
      windowWithRecaptcha.recaptchaVerifier = undefined
    }
  }

  // Send OTP for registration
  const sendOtp = async (phoneNumber: string) => {
    const windowWithRecaptcha = window as unknown as { recaptchaVerifier?: RecaptchaVerifier }
    
    try {
      // Initialize reCAPTCHA if not already done
      if (!windowWithRecaptcha.recaptchaVerifier) {
        windowWithRecaptcha.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'normal',
          callback: () => {
            console.log('reCAPTCHA verified')
          }
        })
      }
      
      const appVerifier = windowWithRecaptcha.recaptchaVerifier
      console.log('Sending OTP to:', phoneNumber)
      
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier)
      setVerificationId(confirmationResult.verificationId)
      console.log('OTP sent successfully!')
    } catch (error) {
      console.error('Send OTP error:', error)
      // Reset reCAPTCHA on error
      clearRecaptcha()
      throw error
    }
  }

  // Verify OTP and complete registration
  const verifyOtp = async (otp: string) => {
    if (!verificationId) {
      throw new Error('No OTP request pending. Please request a new code.')
    }
    
    if (!pendingRegistrationRef.current) {
      throw new Error('Registration data not found. Please start over.')
    }
    
    const { email, password, businessName, phoneNumber, country } = pendingRegistrationRef.current
    
    // Create phone credential
    const phoneCredential = PhoneAuthProvider.credential(verificationId, otp)
    
    // Sign out from any phone auth session
    if (auth.currentUser) {
      await signOut(auth)
    }
    
    // Create the email/password account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const newUser = userCredential.user
    
    // Link phone credential to the account
    try {
      await linkWithCredential(newUser, phoneCredential)
    } catch (linkError) {
      console.log('Phone credential linking skipped or failed:', linkError)
      // Continue anyway - the user is created with email/password
    }
    
    await updateProfile(newUser, {
      displayName: businessName
    })

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('fahampesa:onboardingBusinessName', businessName)
      window.localStorage.setItem('fahampesa:onboardingPhoneNumber', phoneNumber)
      window.localStorage.setItem('fahampesa:onboardingCountry', country)
    }
    
    // Clear pending registration data
    pendingRegistrationRef.current = null
    setVerificationId('')
    clearRecaptcha()
  }

  // Send OTP for login
  const sendLoginOtp = async (phoneNumber: string) => {
    const exists = await phoneExists(phoneNumber)
    if (!exists) {
      throw new Error('No account found with this phone number. Please register first.')
    }
    
    const windowWithRecaptcha = window as unknown as { recaptchaVerifier?: RecaptchaVerifier }
    
    try {
      // Initialize reCAPTCHA if not already done
      if (!windowWithRecaptcha.recaptchaVerifier) {
        windowWithRecaptcha.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'normal',
          callback: () => {
            console.log('reCAPTCHA verified')
          }
        })
      }
      
      const appVerifier = windowWithRecaptcha.recaptchaVerifier
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier)
      setVerificationId(confirmationResult.verificationId)
      console.log('Login OTP sent successfully!')
    } catch (error) {
      console.error('Send login OTP error:', error)
      // Reset reCAPTCHA on error
      clearRecaptcha()
      throw error
    }
  }

  // Verify login OTP
  const verifyLoginOtp = async (otp: string) => {
    if (!verificationId) {
      throw new Error('No OTP request pending. Please request a new code.')
    }
    
    const credential = PhoneAuthProvider.credential(verificationId, otp)
    await signInWithCredential(auth, credential)
    setVerificationId('')
    clearRecaptcha()
  }

  // Helper to set pending registration data (called from login page)
  const setPendingRegistration = (data: typeof pendingRegistrationRef.current) => {
    pendingRegistrationRef.current = data
  }

  const refreshBackendSession = useCallback(async () => {
    const currentUser = auth.currentUser
    if (!currentUser) {
      setBackendSession(null)
      return null
    }

    setBackendSessionLoading(true)
    setBackendSessionError(null)
    try {
      const session = await getMe(currentUser)
      setBackendSession(session)
      setUserRole(getUserRoleFromBackendSession(session))
      return session
    } catch (error) {
      if (isBackendApiError(error) && (error.code === 'missing_auth_token' || error.code === 'invalid_auth_token')) {
        await signOut(auth)
      }
      setBackendSession(null)
      setUserRole(null)
      setBackendSessionError(error instanceof Error ? error.message : 'Unable to load account session.')
      throw error
    } finally {
      setBackendSessionLoading(false)
    }
  }, [])

  const platformRole = getPlatformRole(backendSession)
  const isSuperAdmin = platformRole === 'super_admin'
  const isAdmin = platformRole === 'admin' || platformRole === 'super_admin'

  const value = {
    user,
    userRole,
    backendSession,
    backendSessionLoading,
    backendSessionError,
    loading,
    roleLoading,
    refreshBackendSession,
    login,
    register,
    logout,
    resetPassword,
    isSuperAdmin,
    isAdmin,
    // Phone auth
    sendOtp,
    verifyOtp,
    sendLoginOtp,
    verifyLoginOtp,
    verificationId,
    setPendingRegistration,
    clearRecaptcha
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
