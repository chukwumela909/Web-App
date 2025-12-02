import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

export interface UserRole {
  id: string
  email: string
  displayName: string
  role: 'super_admin' | 'admin' | 'viewer' | 'user'
  createdAt: Date
  lastLogin?: Date
  permissions: string[]
}

export const ROLE_PERMISSIONS = {
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

export async function createSuperAdmin(email: string, password: string, displayName: string = 'Super Admin') {
  try {
    // Create the user with email and password
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Update the user's display name
    await updateProfile(user, {
      displayName: displayName
    })

    // Create user role document in Firestore
    const userRole: UserRole = {
      id: user.uid,
      email: email,
      displayName: displayName,
      role: 'super_admin',
      createdAt: new Date(),
      permissions: ROLE_PERMISSIONS.super_admin
    }

    // Save to Firestore
    await setDoc(doc(db, 'userRoles', user.uid), userRole)

    console.log('Super admin created successfully:', {
      uid: user.uid,
      email: email,
      displayName: displayName
    })

    return user
  } catch (error: unknown) {
    console.error('Error creating super admin:', error)
    throw error
  }
}

export async function getUserRole(userId: string): Promise<UserRole | null> {
  try {
    const userRoleDoc = await getDoc(doc(db, 'userRoles', userId))
    if (userRoleDoc.exists()) {
      const data = userRoleDoc.data()
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastLogin: data.lastLogin?.toDate()
      } as UserRole
    }
    return null
  } catch (error) {
    console.error('Error fetching user role:', error)
    return null
  }
}

export async function updateUserRole(userId: string, role: UserRole['role']) {
  try {
    const userRoleRef = doc(db, 'userRoles', userId)
    await setDoc(userRoleRef, {
      role: role,
      permissions: ROLE_PERMISSIONS[role],
      updatedAt: new Date()
    }, { merge: true })
  } catch (error) {
    console.error('Error updating user role:', error)
    throw error
  }
}

export function hasPermission(userRole: UserRole | null, permission: string): boolean {
  if (!userRole) return false
  return userRole.permissions.includes(permission)
}

export function isSuperAdmin(userRole: UserRole | null): boolean {
  return userRole?.role === 'super_admin'
}

export function isAdmin(userRole: UserRole | null): boolean {
  return userRole?.role === 'admin' || userRole?.role === 'super_admin'
}
