'use client'

import { auth } from '@/lib/firebase'
import { 
  sendPasswordResetEmail, 
  updateProfile,
  deleteUser as firebaseDeleteUser,
  User as FirebaseUser
} from 'firebase/auth'

export interface UserManagementActions {
  resetPassword: (email: string) => Promise<void>
  disableAccount: (user: FirebaseUser) => Promise<void>
  deleteAccount: (user: FirebaseUser) => Promise<void>
}

export const userManagementActions: UserManagementActions = {
  resetPassword: async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      console.error('Error sending password reset email:', error)
      throw new Error('Failed to send password reset email')
    }
  },

  disableAccount: async (user: FirebaseUser) => {
    try {
      // Since we can't directly disable a user account from client-side Firebase,
      // we'll update their profile to mark them as disabled
      await updateProfile(user, {
        displayName: user.displayName ? `[DISABLED] ${user.displayName}` : '[DISABLED] User'
      })
    } catch (error) {
      console.error('Error disabling user account:', error)
      throw new Error('Failed to disable user account')
    }
  },

  deleteAccount: async (user: FirebaseUser) => {
    try {
      await firebaseDeleteUser(user)
    } catch (error) {
      console.error('Error deleting user account:', error)
      throw new Error('Failed to delete user account')
    }
  }
}

// Helper function to check if user is disabled
export const isUserDisabled = (displayName: string | null): boolean => {
  return displayName?.startsWith('[DISABLED]') || false
}

// Helper function to get clean display name (without disabled prefix)
export const getCleanDisplayName = (displayName: string | null): string => {
  if (!displayName) return 'Unknown User'
  return displayName.replace('[DISABLED] ', '')
}
