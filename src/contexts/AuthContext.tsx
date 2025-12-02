'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth'
import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { getUserRole, UserRole } from '@/lib/adminUtils'

interface AuthContextType {
  user: User | null
  userRole: UserRole | null
  loading: boolean
  roleLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, businessName?: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  isSuperAdmin: boolean
  isAdmin: boolean
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

  const register = async (email: string, password: string, businessName?: string) => {
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
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      })
    }
  }

  const logout = async () => {
    await signOut(auth)
    setUserRole(null)
  }

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email)
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
    isAdmin
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
