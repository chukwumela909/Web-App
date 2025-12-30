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
import { doc, updateDoc, setDoc, serverTimestamp, query, collection, where, getDocs } from 'firebase/firestore'
import { auth, db, RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, linkWithCredential, ConfirmationResult } from '@/lib/firebase'
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
  setupRecaptcha: (containerId: string) => void
  sendOtp: (phoneNumber: string) => Promise<void>
  verifyOtp: (otp: string) => Promise<void>
  sendLoginOtp: (phoneNumber: string) => Promise<void>
  verifyLoginOtp: (otp: string) => Promise<void>
  confirmationResult: ConfirmationResult | null
  recaptchaVerifier: ApplicationVerifier | null
  setPendingRegistration: (data: { email: string; password: string; businessName: string; phoneNumber: string; country: string } | null) => void
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
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<ApplicationVerifier | null>(null)
  
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

  // Setup reCAPTCHA verifier for phone auth
  const setupRecaptcha = (containerId: string) => {
    if (typeof window === 'undefined') return
    
    // Clear any existing verifier
    const windowWithRecaptcha = window as unknown as { recaptchaVerifier?: RecaptchaVerifier; recaptchaWidgetId?: number }
    if (windowWithRecaptcha.recaptchaVerifier) {
      try {
        windowWithRecaptcha.recaptchaVerifier.clear()
      } catch {
        // Ignore errors when clearing
      }
    }
    
    try {
      const verifier = new RecaptchaVerifier(auth, containerId, {
        size: 'normal',
        callback: () => {
          console.log('reCAPTCHA solved - user verified')
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired, please solve again')
        }
      })
      
      windowWithRecaptcha.recaptchaVerifier = verifier
      setRecaptchaVerifier(verifier)
    } catch (error) {
      console.error('Error setting up reCAPTCHA:', error)
    }
  }

  // Helper to get or create reCAPTCHA verifier
  const getRecaptchaVerifier = async (containerId: string = 'recaptcha-container'): Promise<RecaptchaVerifier> => {
    const windowWithRecaptcha = window as unknown as { recaptchaVerifier?: RecaptchaVerifier; recaptchaRendered?: boolean }
    
    // If we already have a rendered verifier, return it
    if (windowWithRecaptcha.recaptchaVerifier && windowWithRecaptcha.recaptchaRendered) {
      return windowWithRecaptcha.recaptchaVerifier
    }
    
    // Clear existing verifier if it exists but wasn't fully rendered
    if (windowWithRecaptcha.recaptchaVerifier) {
      try {
        windowWithRecaptcha.recaptchaVerifier.clear()
        windowWithRecaptcha.recaptchaRendered = false
      } catch {
        // Ignore
      }
    }
    
    // Make sure container exists and clear its contents
    const container = document.getElementById(containerId)
    if (!container) {
      throw new Error('reCAPTCHA container not found. Please refresh the page.')
    }
    
    // Clear the container's innerHTML to remove any existing reCAPTCHA
    container.innerHTML = ''
    
    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: 'normal',
      callback: () => {
        console.log('reCAPTCHA verified - user solved challenge')
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired, please solve again')
        windowWithRecaptcha.recaptchaRendered = false
      }
    })
    
    // Render the reCAPTCHA widget - this is required before use
    await verifier.render()
    console.log('reCAPTCHA widget rendered successfully')
    
    windowWithRecaptcha.recaptchaVerifier = verifier
    windowWithRecaptcha.recaptchaRendered = true
    setRecaptchaVerifier(verifier)
    
    return verifier
  }
  
  // Reset reCAPTCHA after use (call after OTP is sent or on error)
  const resetRecaptcha = () => {
    const windowWithRecaptcha = window as unknown as { recaptchaVerifier?: RecaptchaVerifier; recaptchaRendered?: boolean }
    if (windowWithRecaptcha.recaptchaVerifier) {
      try {
        windowWithRecaptcha.recaptchaVerifier.clear()
      } catch {
        // Ignore
      }
    }
    windowWithRecaptcha.recaptchaVerifier = undefined
    windowWithRecaptcha.recaptchaRendered = false
    setRecaptchaVerifier(null)
    
    // Clear the container
    const container = document.getElementById('recaptcha-container')
    if (container) {
      container.innerHTML = ''
    }
  }

  // Send OTP for registration (stores pending data for after verification)
  const sendOtp = async (phoneNumber: string) => {
    try {
      const verifier = await getRecaptchaVerifier()
      console.log('Attempting to send OTP to:', phoneNumber)
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, verifier)
      console.log('OTP sent successfully')
      setConfirmationResult(confirmation)
      // Reset reCAPTCHA after successful send so it can be used again for resend
      resetRecaptcha()
    } catch (error: unknown) {
      console.error('Send OTP error:', error)
      // Reset reCAPTCHA on error
      resetRecaptcha()
      // Re-throw with more helpful message
      const firebaseError = error as { code?: string; message?: string }
      if (firebaseError.code === 'auth/internal-error') {
        throw new Error('Phone verification failed. Firebase Phone Auth does not work on localhost. Please add a test phone number in Firebase Console (Authentication → Sign-in method → Phone → Phone numbers for testing) or deploy to a real domain.')
      }
      throw error
    }
  }

  // Verify OTP and complete registration
  const verifyOtp = async (otp: string) => {
    if (!confirmationResult) {
      throw new Error('No OTP request pending. Please request a new code.')
    }
    
    if (!pendingRegistrationRef.current) {
      throw new Error('Registration data not found. Please start over.')
    }
    
    // Verify the OTP - this creates/signs in a phone-authenticated user
    const phoneCredential = PhoneAuthProvider.credential(
      confirmationResult.verificationId,
      otp
    )
    
    // Sign out from phone auth temporarily
    await signOut(auth)
    
    // Now create the email/password account
    const { email, password, businessName, phoneNumber, country } = pendingRegistrationRef.current
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    
    // Link phone credential to the account
    await linkWithCredential(user, phoneCredential)
    
    // Update profile and create Firestore documents
    await updateProfile(user, {
      displayName: businessName
    })
    
    await setDoc(doc(db, 'userProfiles', user.uid), {
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
    
    await setDoc(doc(db, 'userRoles', user.uid), {
      role: 'user',
      email: email,
      businessName: businessName,
      phoneNumber: phoneNumber,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    })
    
    // Clear pending registration data
    pendingRegistrationRef.current = null
    setConfirmationResult(null)
  }

  // Send OTP for login
  const sendLoginOtp = async (phoneNumber: string) => {
    // Check if phone number exists in any user profile
    const profilesQuery = query(
      collection(db, 'userProfiles'),
      where('phoneNumber', '==', phoneNumber)
    )
    const querySnapshot = await getDocs(profilesQuery)
    
    if (querySnapshot.empty) {
      throw new Error('No account found with this phone number. Please register first.')
    }
    
    try {
      const verifier = await getRecaptchaVerifier()
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, verifier)
      setConfirmationResult(confirmation)
      // Reset reCAPTCHA after successful send
      resetRecaptcha()
    } catch (error) {
      console.error('Send login OTP error:', error)
      // Reset reCAPTCHA on error
      resetRecaptcha()
      throw error
    }
  }

  // Verify login OTP
  const verifyLoginOtp = async (otp: string) => {
    if (!confirmationResult) {
      throw new Error('No OTP request pending. Please request a new code.')
    }
    
    // Confirm the OTP - this signs in with phone
    await confirmationResult.confirm(otp)
    setConfirmationResult(null)
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
    setupRecaptcha,
    sendOtp,
    verifyOtp,
    sendLoginOtp,
    verifyLoginOtp,
    confirmationResult,
    recaptchaVerifier,
    setPendingRegistration
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
