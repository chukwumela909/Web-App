'use client'

import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  ApplicationVerifier
} from 'firebase/auth'
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, linkWithCredential, signInWithCredential, ConfirmationResult } from '@/lib/firebase'
import { getUserRole, UserRole } from '@/lib/adminUtils'

interface AuthContextType {
  user: User | null
  userRole: UserRole | null
  loading: boolean
  roleLoading: boolean
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
        // Fetch user role from Firestore
        const role = await getUserRole(user.uid)
        setUserRole(role)
        setRoleLoading(false)
        
        // Update last login time
        if (role) {
          try {
            await updateDoc(doc(db, 'userRoles', user.uid), {
              lastLogin: new Date()
            })
          } catch (error) {
            console.error('Error updating last login:', error)
          }
        }
      } else {
        setUserRole(null)
        setRoleLoading(false)
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
    
    // Update user profile with business name
    if (businessName && user) {
      await updateProfile(user, {
        displayName: businessName
      })
      
      // Create user profile document in Firestore
      await setDoc(doc(db, 'userProfiles', user.uid), {
        businessName: businessName,
        email: email,
        phoneNumber: phoneNumber || '',
        country: country || '',
        phoneVerified: !!phoneNumber,
        onboardingCompleted: false,
        onboardingSkipped: false,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      })
      
      // Set default role as 'user' (not admin)
      await setDoc(doc(db, 'userRoles', user.uid), {
        role: 'user',
        email: email,
        businessName: businessName,
        phoneNumber: phoneNumber || '',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      })
    }
  }

  const logout = async () => {
    await signOut(auth)
    setUserRole(null)
    setConfirmationResult(null)
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
    
    // Update profile and create Firestore documents
    await updateProfile(newUser, {
      displayName: businessName
    })
    
    await setDoc(doc(db, 'userProfiles', newUser.uid), {
      businessName: businessName,
      email: email,
      phoneNumber: phoneNumber,
      country: country,
      phoneVerified: true,
      onboardingCompleted: false,
      onboardingSkipped: false,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    })
    
    await setDoc(doc(db, 'userRoles', newUser.uid), {
      role: 'user',
      email: email,
      businessName: businessName,
      phoneNumber: phoneNumber,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    })
    
    // Clear pending registration data
    pendingRegistrationRef.current = null
    setVerificationId('')
    clearRecaptcha()
  }

  // Send OTP for login
  const sendLoginOtp = async (phoneNumber: string) => {
    // Check if phone number exists using server-side Admin SDK
    try {
      const response = await fetch(`/api/auth/phone-exists?phone=${encodeURIComponent(phoneNumber)}`)
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        const message = data?.error || 'Unable to verify phone number. Please try again.'
        throw new Error(message)
      }
      const data = await response.json()
      if (!data?.exists) {
        throw new Error('No account found with this phone number. Please register first.')
      }
    } catch (error) {
      throw error
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

  const isSuperAdmin = userRole?.role === 'super_admin'
  const isAdmin = userRole?.role === 'admin' || userRole?.role === 'super_admin'

  const value = {
    user,
    userRole,
    loading,
    roleLoading,
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
