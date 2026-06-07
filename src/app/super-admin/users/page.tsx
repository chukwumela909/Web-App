'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import AdminRoute from '@/components/auth/AdminRoute'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { motion } from 'framer-motion'
import { 
  Users, 
  UserCheck, 
  UserX,
  UserPlus,
  Activity,
  MoreHorizontal,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Shield,
  Trash2,
  Mail,
  Crown
} from 'lucide-react'
import { auth } from '@/lib/firebase'
import { userManagementActions } from '@/lib/firebase-admin'
import { useToast } from '@/hooks/use-toast'
import { handleError } from '@/lib/error-handler'
import {
  activateBackendSubscription,
  manuallyActivateBackendAdminSubscription,
  searchBackendAdminBusinesses,
  searchBackendAdminUsers,
  setBackendAdminBusinessStatus,
  setBackendPlatformUserDisabled,
  type BackendPlanType,
  type BackendSubscriptionRecord
} from '@/lib/backend-business-api'

interface User {
  id: string
  email: string
  displayName?: string
  createdAt: Date
  lastActiveAt: Date
  status: 'active' | 'disabled'
  isDisabled: boolean
  emailVerified?: boolean
  region?: string
  firestoreData?: any
  source?: string
  // Subscription fields
  isSubscribed?: boolean
  subscriptionId?: string | null
  subscriptionEndDate?: number | null
  planType?: 'monthly' | 'yearly' | null
  businessName?: string
}

function userEmailOf(user: User) {
  return user.email && user.email !== 'No email' ? user.email.trim().toLowerCase() : ''
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

function normalizeEmail(value: unknown) {
  if (typeof value !== 'string') return ''
  const candidate = value.trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate) ? candidate : ''
}

function findEmailInValue(value: unknown, depth = 0): string {
  if (!value || depth > 4) return ''

  const directEmail = normalizeEmail(value)
  if (directEmail) return directEmail

  if (Array.isArray(value)) {
    for (const item of value) {
      const email = findEmailInValue(item, depth + 1)
      if (email) return email
    }

    return ''
  }

  if (typeof value !== 'object') return ''

  const record = value as Record<string, unknown>
  const emailLikeEntries = Object.entries(record).filter(([key]) => key.toLowerCase().includes('email'))
  const otherEntries = Object.entries(record).filter(([key]) => !key.toLowerCase().includes('email'))

  for (const [, nestedValue] of [...emailLikeEntries, ...otherEntries]) {
    const email = findEmailInValue(nestedValue, depth + 1)
    if (email) return email
  }

  return ''
}

function getBusinessAccountId(business: Record<string, any>) {
  return String(business.id || business._id || business.businessAccountId || business.accountId || '')
}

function getUserBusinessAccountId(user: User) {
  const data = user.firestoreData || {}
  return stringValue(data.businessAccountId)
    || stringValue(data.backendBusinessAccountId)
    || stringValue(data.businessId)
    || stringValue(data.accountId)
    || stringValue(data.business?.id)
    || stringValue(data.business?._id)
    || stringValue(data.business?.businessAccountId)
}

function getBusinessEmailCandidates(business: Record<string, any>) {
  const explicitEmails = [
    business.createdByEmail,
    business.ownerEmail,
    business.contactEmail,
    business.businessEmail,
    business.primaryEmail,
    business.emailAddress,
    business.email,
    business.userEmail,
    business.createdBy?.email,
    business.owner?.email,
    business.contact?.email,
    business.profile?.email,
    business.user?.email,
    business.auth?.email
  ]
    .filter((value): value is string => typeof value === 'string')
    .map(normalizeEmail)
    .filter(Boolean)

  return Array.from(new Set([
    ...explicitEmails,
    findEmailInValue(business)
  ].filter(Boolean)))
}

function getBusinessUidCandidates(business: Record<string, any>) {
  return [
    business.firebaseUid,
    business.ownerFirebaseUid,
    business.createdByFirebaseUid,
    business.createdByUid,
    business.ownerUid,
    business.userId,
    business.createdBy,
    business.ownerId,
    business.createdById,
    business.createdByUserId,
    business.auth?.firebaseUid,
    business.createdBy?.firebaseUid,
    business.createdBy?.uid,
    business.createdBy?.id,
    business.owner?.firebaseUid,
    business.owner?.uid,
    business.owner?.id
  ]
    .map(stringValue)
    .filter(Boolean)
}

function businessMatchesUser(business: Record<string, any>, user: User) {
  const email = userEmailOf(user)
  const businessAccountId = getUserBusinessAccountId(user)
  const businessId = getBusinessAccountId(business)

  return (
    (email && getBusinessEmailCandidates(business).includes(email)) ||
    (businessAccountId && businessId === businessAccountId) ||
    getBusinessUidCandidates(business).includes(user.id)
  )
}

function getSubscriptionEndDate(subscription?: Record<string, any> | null, account?: Record<string, any>) {
  const value = subscription?.endDate
    || subscription?.endsAt
    || subscription?.subscriptionEndsAt
    || account?.subscriptionEndsAt
    || null

  if (!value) return null
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : null
}

function getPlanType(value: unknown): BackendPlanType | null {
  return value === 'yearly' || value === 'monthly' ? value : null
}

function getFirstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }

  return ''
}

function getBestEmail(...values: unknown[]) {
  for (const value of values) {
    const email = findEmailInValue(value)
    if (email) return email
  }

  return ''
}

function toDate(value: unknown, fallback = new Date()) {
  if (!value) return fallback

  if (value instanceof Date) return value

  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate?: unknown }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate()
  }

  const date = new Date(value as string | number)
  return Number.isFinite(date.getTime()) ? date : fallback
}

function isBackendAccountDisabled(account: Record<string, any>) {
  const status = String(
    account.status
    || account.accountStatus
    || account.userStatus
    || account.businessStatus
    || ''
  ).toLowerCase()

  return Boolean(account.disabled)
    || ['disabled', 'paused', 'suspended', 'inactive', 'revoked'].includes(status)
}

function getBackendAccountId(account: Record<string, any>) {
  return getFirstString(
    account.businessAccountId,
    account.accountId,
    account.firestoreData?.businessAccountId,
    account.firestoreData?.backendBusinessAccountId,
    account.firestoreData?.businessId,
    account.firestoreData?.accountId,
    account.id,
    account._id
  )
}

function mapBackendUser(user: Record<string, any>): User {
  const firestoreData = user.firestoreData || {}
  const businessAccountId = getBackendAccountId(user)
  const email = getBestEmail(
    user.email,
    user.createdByEmail,
    user.ownerEmail,
    user.contactEmail,
    user.businessEmail,
    user.primaryEmail,
    user.emailAddress,
    user.userEmail,
    user.createdBy?.email,
    user.owner?.email,
    user.contact?.email,
    user.profile?.email,
    user.user?.email,
    user.auth?.email,
    user.account,
    user.createdBy,
    user.owner,
    user.contact,
    user.profile,
    user.user,
    user.auth,
    firestoreData,
    user
  )
  const firebaseUid = getFirstString(
    user.firebaseUid,
    user.uid,
    user.ownerFirebaseUid,
    user.createdByFirebaseUid,
    user.createdByUid,
    user.ownerUid,
    user.userId,
    user.createdBy,
    user.ownerId,
    user.owner,
    user.createdById,
    user.createdByUserId,
    user.user,
    user.auth?.firebaseUid,
    user.createdBy?.firebaseUid,
    user.createdBy?.uid,
    user.createdBy?.id,
    user.owner?.firebaseUid,
    user.owner?.uid,
    user.owner?.id,
    firestoreData.firebaseUid,
    firestoreData.uid
  )
  const subscriptionStatus = String(user.subscriptionStatus || user.currentSubscription?.status || user.subscription?.status || '').toLowerCase()
  const planType = getPlanType(user.planType)
    || getPlanType(user.currentSubscription?.planType)
    || getPlanType(user.subscription?.planType)
  const disabled = isBackendAccountDisabled(user)
  const subscriptionEndDate = typeof user.subscriptionEndDate === 'number'
    ? user.subscriptionEndDate
    : getSubscriptionEndDate(user.currentSubscription || user.subscription, user)

  return {
    id: firebaseUid || businessAccountId,
    email: email || 'No email',
    displayName: getFirstString(
      user.displayName,
      user.name,
      user.fullName,
      user.createdByName,
      user.ownerName,
      user.createdBy?.displayName,
      user.createdBy?.name,
      user.owner?.displayName,
      user.owner?.name,
      user.businessName
    ) || 'No name',
    createdAt: toDate(user.metadata?.creationTime || user.createdAt || user.created_at || user.createdOn || firestoreData.createdAt),
    lastActiveAt: toDate(user.lastActiveAt || user.metadata?.lastSignInTime || user.lastLoginAt || user.lastSeenAt || user.updatedAt || user.updated_at || firestoreData.lastActiveAt),
    status: disabled ? 'disabled' : 'active',
    isDisabled: disabled,
    emailVerified: Boolean(user.emailVerified || user.verified || user.auth?.emailVerified),
    region: getFirstString(user.region, user.country, user.billingRegion) || 'Unknown',
    firestoreData: {
      ...firestoreData,
      businessAccountId,
      firebaseUid
    },
    source: 'MongoDB backend',
    isSubscribed: Boolean(user.isSubscribed) || subscriptionStatus === 'active' || user.planTier === 'paid' || user.planTier === 'pro',
    subscriptionId: getFirstString(user.subscriptionId, user.currentSubscriptionId, user.currentSubscription?.id, user.subscription?.id) || null,
    subscriptionEndDate,
    planType,
    businessName: getFirstString(user.businessName, user.companyName, user.name) || undefined
  }
}

async function fillMissingEmailsFromAuth(users: User[]) {
  if (!users.some((user) => !userEmailOf(user))) return users

  try {
    const response = await fetch('/api/admin/firebase-auth-users?includeFirestore=true')
    const data = await response.json()

    if (!data.success || !Array.isArray(data.users)) return users

    const authUsersById = new Map<string, any>(
      data.users
        .filter((authUser: any) => authUser?.uid)
        .map((authUser: any) => [String(authUser.uid), authUser])
    )
    const authUsersByBusinessId = new Map<string, any>()

    data.users.forEach((authUser: any) => {
      const firestoreData = authUser?.firestoreData || {}
      const businessIds = [
        firestoreData.businessAccountId,
        firestoreData.backendBusinessAccountId,
        firestoreData.businessId,
        firestoreData.accountId,
        firestoreData.business?.id,
        firestoreData.business?._id,
        firestoreData.business?.businessAccountId
      ]
        .map(stringValue)
        .filter(Boolean)

      businessIds.forEach((businessId) => authUsersByBusinessId.set(businessId, authUser))
    })

    return users.map((user) => {
      if (userEmailOf(user)) return user

      const businessAccountId = getUserBusinessAccountId(user)
      const firebaseUid = stringValue(user.firestoreData?.firebaseUid)
        || stringValue(user.firestoreData?.uid)
        || stringValue(user.firestoreData?.userId)
        || stringValue(user.firestoreData?.createdBy)
        || stringValue(user.firestoreData?.ownerId)
        || user.id
      const authUser = authUsersById.get(firebaseUid)
        || (businessAccountId ? authUsersByBusinessId.get(businessAccountId) : null)
      const email = normalizeEmail(authUser?.email)

      if (!email) return user

      return {
        ...user,
        id: authUser.uid || user.id,
        email,
        displayName: user.displayName && user.displayName !== 'No name'
          ? user.displayName
          : authUser.displayName || user.displayName,
        emailVerified: authUser.emailVerified || user.emailVerified
      }
    })
  } catch (error) {
    console.warn('Unable to fill missing emails from Firebase Auth:', error)
    return users
  }
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all-users')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [usersPerPage] = useState(10)
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all')
  const [subscriptionFilter, setSubscriptionFilter] = useState<'all' | 'pro' | 'free'>('all')
  const [searchMode, setSearchMode] = useState<'local' | 'api'>('local') // Track if we're in API search mode or local filtering
  const [searchResults, setSearchResults] = useState<number | null>(null) // Track search results count
  
  // Action states
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [actionType, setActionType] = useState<'reset' | 'disable' | 'delete' | 'activate-subscription' | 'revoke-subscription' | null>(null)
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  
  // Bulk selection states
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [showBulkActionDialog, setShowBulkActionDialog] = useState(false)
  const [bulkActionType, setBulkActionType] = useState<'reset' | 'disable' | 'delete' | 'activate-subscription' | 'revoke-subscription' | null>(null)
  
  const { toast } = useToast()
  const searchInputRef = useRef<HTMLInputElement>(null)

  const loadMongoUsers = useCallback(async (term?: string) => {
    const trimmedTerm = term?.trim()
    const accounts = await searchBackendAdminUsers(trimmedTerm ? { q: trimmedTerm } : undefined)
    const mappedUsers = accounts
      .map(mapBackendUser)
      .filter((user) => user.id || user.email !== 'No email')

    const usersWithEmails = await fillMissingEmailsFromAuth(mappedUsers)

    return usersWithEmails.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }, [])

  const activateCurrentOwnerSubscription = async (targetUser: User) => {
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error('No authenticated user is available for backend activation.')
    }

    const result = await activateBackendSubscription('monthly')
    const subscription = (result.subscription || result) as BackendSubscriptionRecord | null

    markUserSubscriptionActive(targetUser.id, subscription, 'monthly')
    return {
      id: String(result.account?.id || result.account?._id || subscription?.businessAccountId || ''),
      name: result.account?.businessName || result.account?.name || targetUser.businessName || targetUser.email
    }
  }

  const findBusinessAccountForUser = async (targetUser: User) => {
    const email = userEmailOf(targetUser)
    if (!email) {
      throw new Error('This user does not have an email address to match with a backend business account.')
    }

    const knownBusinessAccountId = getUserBusinessAccountId(targetUser)
    if (knownBusinessAccountId) {
      return {
        id: knownBusinessAccountId,
        name: targetUser.businessName || targetUser.email
      }
    }

    const exactBusinesses = await searchBackendAdminBusinesses({ q: email })
    const matchingExactBusiness = exactBusinesses.find((business) =>
      businessMatchesUser(business, targetUser)
    ) || (exactBusinesses.length === 1 ? exactBusinesses[0] : null)

    const exactBusinessAccountId = matchingExactBusiness ? getBusinessAccountId(matchingExactBusiness) : ''
    if (matchingExactBusiness && exactBusinessAccountId) {
      return {
        id: exactBusinessAccountId,
        name: matchingExactBusiness.businessName || matchingExactBusiness.name || targetUser.businessName || targetUser.email
      }
    }

    const businesses = await searchBackendAdminBusinesses()
    const matchingBusiness = businesses.find((business) => businessMatchesUser(business, targetUser))

    const businessAccountId = matchingBusiness ? getBusinessAccountId(matchingBusiness) : ''
    if (!businessAccountId) {
      throw new Error(`No backend business account was found for ${targetUser.email}.`)
    }

    return {
      id: businessAccountId,
      name: matchingBusiness?.businessName || matchingBusiness?.name || targetUser.businessName || targetUser.email
    }
  }

  const markUserSubscriptionActive = (
    userId: string,
    subscription: BackendSubscriptionRecord | null,
    planType: BackendPlanType = 'monthly'
  ) => {
    const subscriptionEndDate = subscription?.endDate
      ? new Date(subscription.endDate).getTime()
      : null

    setUsers((currentUsers) => currentUsers.map((user) => (
      user.id === userId
        ? {
            ...user,
            isSubscribed: true,
            subscriptionId: subscription?.id || user.subscriptionId || null,
            subscriptionEndDate: Number.isFinite(subscriptionEndDate) ? subscriptionEndDate : user.subscriptionEndDate || null,
            planType
          }
        : user
    )))
  }

  const activateUserSubscription = async (targetUser: User) => {
    const currentUser = auth.currentUser
    const isCurrentOwner = currentUser && (
      currentUser.uid === targetUser.id ||
      currentUser.email?.trim().toLowerCase() === userEmailOf(targetUser)
    )

    let activatedWithOwnerEndpoint = false
    const businessAccount = await findBusinessAccountForUser(targetUser)
      .catch((error) => {
        if (isCurrentOwner) {
          activatedWithOwnerEndpoint = true
          return activateCurrentOwnerSubscription(targetUser)
        }

        throw error
      })

    if (activatedWithOwnerEndpoint) {
      return businessAccount
    }

    const result = await manuallyActivateBackendAdminSubscription(
      businessAccount.id,
      'monthly',
      30,
      `Manually activated by super admin for ${targetUser.email}`
    )

    markUserSubscriptionActive(targetUser.id, result.subscription, 'monthly')
    return businessAccount
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      setSearchTimeout((prevTimeout) => {
        if (prevTimeout) {
          clearTimeout(prevTimeout)
        }
        return null
      })
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      
      const usersData = await loadMongoUsers()
      setUsers(usersData)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive'
      })
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [toast, loadMongoUsers])

  // Separate function for resetting to all users (to avoid circular dependency)
  const resetToAllUsers = useCallback(async () => {
    try {
      setLoading(true)
      
      const usersData = await loadMongoUsers()
      setUsers(usersData)
      
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [toast, loadMongoUsers])

  // User action handlers
  const handleUserAction = async (user: User, action: 'reset' | 'disable' | 'delete' | 'activate-subscription' | 'revoke-subscription') => {
    setSelectedUser(user)
    setActionType(action)
    setShowActionDialog(true)
  }

  const confirmAction = async () => {
    if (!selectedUser || !actionType) return

    try {
      setActionLoading(true)
      let shouldRefreshUsers = true
      
      switch (actionType) {
        case 'reset':
          await userManagementActions.resetPassword(selectedUser.email)
          toast({
            title: 'Success',
            description: `Password reset email sent to ${selectedUser.email}`,
            variant: 'success'
          })
          break
          
        case 'disable':
          const businessAccountId = getUserBusinessAccountId(selectedUser)

          if (businessAccountId) {
            await setBackendAdminBusinessStatus(
              businessAccountId,
              selectedUser.status === 'active' ? 'pause' : 'resume'
            )
            toast({
              title: 'Success',
              description: `User ${selectedUser.status === 'active' ? 'disabled' : 'enabled'} successfully`,
              variant: 'success'
            })
          } else {
            const result = await setBackendPlatformUserDisabled(
              selectedUser.id,
              selectedUser.status === 'active'
            )
            toast({
              title: 'Success',
              description: result.message || `User ${selectedUser.status === 'active' ? 'disabled' : 'enabled'} successfully`,
              variant: 'success'
            })
          }
          break
          
        case 'activate-subscription':
          const businessAccount = await activateUserSubscription(selectedUser)
          shouldRefreshUsers = false
          toast({
            title: 'Success',
            description: `Subscription activated for ${selectedUser.email} (${businessAccount.name})`,
            variant: 'success'
          })
          break
          
        case 'revoke-subscription':
          const revokeBusinessAccountId = getUserBusinessAccountId(selectedUser)
          if (!revokeBusinessAccountId) {
            throw new Error(`No backend business account was found for ${selectedUser.email}.`)
          }
          await setBackendAdminBusinessStatus(revokeBusinessAccountId, 'revoke')
          toast({
            title: 'Success',
            description: `Backend access revoked for ${selectedUser.email}`,
            variant: 'success'
          })
          break
          
        case 'delete':
          console.log('Attempting to delete user:', selectedUser.id, selectedUser.email)
          
          // Import Firebase functions dynamically
          const { doc, deleteDoc, collection, query, where, getDocs, writeBatch } = await import('firebase/firestore')
          const { db } = await import('@/lib/firebase')
          
          // Delete user document
          const userRef = doc(db, 'users', selectedUser.id)
          
          // Create a batch to delete user and related data
          const batch = writeBatch(db)
          batch.delete(userRef)
          
          // Delete related user data (sales, inventory, etc.)
          const collections = ['sales', 'inventory', 'expenses', 'staff', 'branches']
          
          for (const collectionName of collections) {
            try {
              // Check for userId references
              const relatedQuery = query(
                collection(db, collectionName),
                where('userId', '==', selectedUser.id)
              )
              const relatedDocs = await getDocs(relatedQuery)
              
              relatedDocs.forEach((doc) => {
                batch.delete(doc.ref)
              })

              // Check for email references
              if (selectedUser.email) {
                const emailQuery = query(
                  collection(db, collectionName),
                  where('userEmail', '==', selectedUser.email)
                )
                const emailDocs = await getDocs(emailQuery)
                
                emailDocs.forEach((doc) => {
                  batch.delete(doc.ref)
                })
              }
            } catch (collectionError) {
              console.warn(`Error processing collection ${collectionName}:`, collectionError)
              // Continue with other collections
            }
          }
          
          // Execute the batch delete
          await batch.commit()
          
          toast({
            title: 'Success',
            description: 'User and all related data deleted successfully',
            variant: 'success'
          })
          break
      }
      
      // Refresh users list
      if (shouldRefreshUsers) {
        await fetchUsers()
      }
      
    } catch (error) {
      const errorResult = handleError(error, 'User action')
      
      if (errorResult.shouldShow) {
        toast({
          title: 'Error',
          description: errorResult.message,
          variant: 'destructive'
        })
      }
    } finally {
      setActionLoading(false)
      setShowActionDialog(false)
      setSelectedUser(null)
      setActionType(null)
    }
  }

  // Bulk action handlers
  const handleBulkAction = (action: 'reset' | 'disable' | 'delete' | 'activate-subscription' | 'revoke-subscription') => {
    if (selectedUsers.size === 0) {
      toast({
        title: 'No users selected',
        description: 'Please select at least one user to perform bulk actions',
        variant: 'destructive'
      })
      return
    }
    setBulkActionType(action)
    setShowBulkActionDialog(true)
  }

  const confirmBulkAction = async () => {
    if (!bulkActionType || selectedUsers.size === 0) return

    try {
      setActionLoading(true)
      const selectedUserList = users.filter(user => selectedUsers.has(user.id))
      let shouldRefreshUsers = true
      
      for (const user of selectedUserList) {
        switch (bulkActionType) {
          case 'reset':
            await userManagementActions.resetPassword(user.email)
            break
          case 'activate-subscription':
            await activateUserSubscription(user)
            shouldRefreshUsers = false
            break
          case 'revoke-subscription':
            const revokeBusinessAccountId = getUserBusinessAccountId(user)
            if (!revokeBusinessAccountId) {
              throw new Error(`No backend business account was found for ${user.email}.`)
            }
            await setBackendAdminBusinessStatus(revokeBusinessAccountId, 'revoke')
            shouldRefreshUsers = true
            break
          case 'disable':
            const businessAccountId = getUserBusinessAccountId(user)

            if (businessAccountId) {
              await setBackendAdminBusinessStatus(
                businessAccountId,
                user.status === 'active' ? 'pause' : 'resume'
              )
            } else {
              await setBackendPlatformUserDisabled(user.id, user.status === 'active')
            }
            break
          case 'delete':
            // Import Firebase functions dynamically
            const { doc, collection, query, where, getDocs, writeBatch } = await import('firebase/firestore')
            const { db } = await import('@/lib/firebase')
            
            // Delete user document
            const userRef = doc(db, 'users', user.id)
            
            // Create a batch to delete user and related data
            const batch = writeBatch(db)
            batch.delete(userRef)
            
            // Delete related user data
            const collections = ['sales', 'inventory', 'expenses', 'staff', 'branches']
            
            for (const collectionName of collections) {
              try {
                // Check for userId references
                const relatedQuery = query(
                  collection(db, collectionName),
                  where('userId', '==', user.id)
                )
                const relatedDocs = await getDocs(relatedQuery)
                
                relatedDocs.forEach((doc) => {
                  batch.delete(doc.ref)
                })

                // Check for email references
                if (user.email) {
                  const emailQuery = query(
                    collection(db, collectionName),
                    where('userEmail', '==', user.email)
                  )
                  const emailDocs = await getDocs(emailQuery)
                  
                  emailDocs.forEach((doc) => {
                    batch.delete(doc.ref)
                  })
                }
              } catch (collectionError) {
                console.warn(`Error processing collection ${collectionName} for user ${user.email}:`, collectionError)
              }
            }
            
            // Execute the batch delete
            await batch.commit()
            break
        }
      }
      
      toast({
        title: 'Success',
        description: `${bulkActionType} action completed for ${selectedUsers.size} users`,
        variant: 'success'
      })
      
      setSelectedUsers(new Set())
      if (shouldRefreshUsers) {
        await fetchUsers()
      }
      
    } catch (error) {
      const errorResult = handleError(error, 'Bulk user action')
      
      if (errorResult.shouldShow) {
        toast({
          title: 'Error',
          description: errorResult.message,
          variant: 'destructive'
        })
      }
    } finally {
      setActionLoading(false)
      setShowBulkActionDialog(false)
      setBulkActionType(null)
    }
  }

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers)
    if (newSelection.has(userId)) {
      newSelection.delete(userId)
    } else {
      newSelection.add(userId)
    }
    setSelectedUsers(newSelection)
  }

  const toggleSelectAll = () => {
    const currentPageUserIds = (paginatedUsers || []).map(user => user.id)
    const allCurrentSelected = currentPageUserIds.every(id => selectedUsers.has(id))
    
    const newSelection = new Set(selectedUsers)
    if (allCurrentSelected) {
      // Unselect all on current page
      currentPageUserIds.forEach(id => newSelection.delete(id))
    } else {
      // Select all on current page
      currentPageUserIds.forEach(id => newSelection.add(id))
    }
    setSelectedUsers(newSelection)
  }

  // Enhanced search function with debouncing
  const performApiSearch = useCallback(async (term: string) => {
    if (!term.trim()) {
      setSearchMode('local')
      setSearchResults(null)
      await resetToAllUsers()
      return
    }

    try {
      setLoading(true)
      setSearchMode('api')
      
      const usersData = await loadMongoUsers(term)
      
      setUsers(usersData)
      setSearchResults(usersData.length)
      setCurrentPage(1) // Reset to first page when searching
      
      // Show search feedback (with slight delay to avoid disrupting typing)
      setTimeout(() => {
        if (usersData.length === 0) {
          toast({
            title: 'No Users Found',
            description: `No users found matching "${term}". Try a different search term.`,
            variant: 'default'
          })
        } else {
          toast({
            title: 'Search Results',
            description: `Found ${usersData.length} user(s) matching "${term}"`,
            variant: 'default'
          })
        }
      }, 100)
    } catch (error) {
      console.error('Error searching users:', error)
      toast({
        title: 'Search Error',
        description: `Failed to search for "${term}". Please try again.`,
        variant: 'destructive'
      })
      // Don't reset users on error, keep current state
    } finally {
      setLoading(false)
    }
  }, [toast, resetToAllUsers, loadMongoUsers])

  // Debounced search function
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  
  const debouncedSearch = useCallback((term: string) => {
    // Clear any existing timeout and set new one
    setSearchTimeout((prevTimeout) => {
      if (prevTimeout) {
        clearTimeout(prevTimeout)
      }
      
      // Only set timeout if we have input
      if (term.trim().length === 0) {
        // Immediately reset to local mode when search is cleared
        setSearchMode('local')
        setSearchResults(null)
        setCurrentPage(1)
        resetToAllUsers()
        return null
      }
      
      // Set new timeout for search
      if (term.trim().length >= 2) {
        return setTimeout(() => {
          performApiSearch(term)
        }, 500) // 500ms delay
      }
      
      return null
    })
  }, [performApiSearch, resetToAllUsers])

  // Manual search function (for search button)
  const searchUsers = (term: string) => {
    setSearchTimeout((prevTimeout) => {
      if (prevTimeout) {
        clearTimeout(prevTimeout)
      }
      return null
    })
    performApiSearch(term)
  }

  // Filter and search logic
  const filteredUsers = users.filter(user => {
    // In API search mode, all users are already filtered by the API
    // Just apply status filter
    if (searchMode === 'api') {
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter
      const matchesSubscription = subscriptionFilter === 'all' || 
        (subscriptionFilter === 'pro' && user.isSubscribed) ||
        (subscriptionFilter === 'free' && !user.isSubscribed)
      return matchesStatus && matchesSubscription
    }
    
    // In local mode, apply search, status, and subscription filters
    const matchesSearch = searchTerm === '' || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter
    const matchesSubscription = subscriptionFilter === 'all' || 
      (subscriptionFilter === 'pro' && user.isSubscribed) ||
      (subscriptionFilter === 'free' && !user.isSubscribed)
    return matchesSearch && matchesStatus && matchesSubscription
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)
  const startIndex = (currentPage - 1) * usersPerPage
  const endIndex = startIndex + usersPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  const allUsers = users
  const activeUsers = users.filter(user => user.status === 'active')
  const disabledUsers = users.filter(user => user.status === 'disabled')
  const subscribedUsers = users.filter(user => user.isSubscribed)
  const freeUsers = users.filter(user => !user.isSubscribed)
  
  // Helper function to safely calculate days difference
  const getDaysDifference = (date: Date): number => {
    try {
      return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
    } catch {
      return 0
    }
  }

  // Daily and churn analysis
  const dailyActiveUsers = users.filter(user => {
    const daysSinceActive = getDaysDifference(user.lastActiveAt)
    return daysSinceActive <= 1 && user.status === 'active'
  })
  
  const newUsers = users.filter(user => {
    const daysSinceCreated = getDaysDifference(user.createdAt)
    return daysSinceCreated <= 7
  })
  
  const retentionUsers = users.filter(user => {
    const daysSinceCreated = getDaysDifference(user.createdAt)
    const daysSinceActive = getDaysDifference(user.lastActiveAt)
    return daysSinceCreated > 7 && daysSinceActive <= 7
  })
  
  const inactiveWeekUsers = users.filter(user => {
    const daysSinceActive = getDaysDifference(user.lastActiveAt)
    return daysSinceActive > 7
  })

  const UserTable = ({ userList, title, showSearch = true }: { userList: User[], title: string, showSearch?: boolean }) => {
    const displayUsers = showSearch ? paginatedUsers : userList
    const allCurrentSelected = displayUsers.every(user => selectedUsers.has(user.id))
    const someCurrentSelected = displayUsers.some(user => selectedUsers.has(user.id))

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex flex-col">
              <span>{title}</span>
              {searchResults !== null && searchMode === 'api' && (
                <span className="text-sm font-normal text-muted-foreground mt-1">
                  Found {searchResults} user(s) matching "{searchTerm}"
                </span>
              )}
            </div>
            {showSearch && (
              <div className="flex gap-2 items-center">
                <div className="relative flex items-center">
                  <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    key="user-search-input" // Stable key to prevent recreation
                    type="text"
                    placeholder="Search users by email or name..."
                    value={searchTerm}
                    onChange={(e) => {
                      const value = e.target.value
                      setSearchTerm(value)
                      // Use setTimeout to avoid blocking the input
                      setTimeout(() => debouncedSearch(value), 0)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        searchUsers(searchTerm)
                      } else if (e.key === 'Escape') {
                        e.preventDefault()
                        setSearchTimeout((prevTimeout) => {
                          if (prevTimeout) {
                            clearTimeout(prevTimeout)
                          }
                          return null
                        })
                        setSearchTerm('')
                        setSearchMode('local')
                        setSearchResults(null)
                        setCurrentPage(1)
                        resetToAllUsers()
                        // Keep focus on the input after clearing
                        setTimeout(() => {
                          searchInputRef.current?.focus()
                        }, 0)
                      }
                    }}
                    onBlur={(e) => {
                      // Prevent losing focus unless clicking outside search area
                      const relatedTarget = e.relatedTarget as HTMLElement
                      if (relatedTarget && (
                        relatedTarget.textContent === 'Search' || 
                        relatedTarget.textContent === 'Clear'
                      )) {
                        // If clicking search or clear button, maintain focus
                        setTimeout(() => {
                          searchInputRef.current?.focus()
                        }, 100)
                      }
                    }}
                    className="h-10 w-64 pl-10 pr-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    autoComplete="off"
                  />
                  {loading && (
                    <div className="absolute right-3 h-4 w-4">
                      <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    searchUsers(searchTerm)
                    // Return focus to search input
                    setTimeout(() => {
                      searchInputRef.current?.focus()
                    }, 100)
                  }}
                  disabled={loading}
                >
                  Search
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setSearchTimeout((prevTimeout) => {
                      if (prevTimeout) {
                        clearTimeout(prevTimeout)
                      }
                      return null
                    })
                    setSearchTerm('')
                    setSearchMode('local')
                    setSearchResults(null)
                    setCurrentPage(1)
                    resetToAllUsers()
                    // Return focus to search input
                    setTimeout(() => {
                      searchInputRef.current?.focus()
                    }, 100)
                  }}
                  disabled={loading}
                >
                  Clear
                </Button>
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={subscriptionFilter} onValueChange={(value: any) => setSubscriptionFilter(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Subscription" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={fetchUsers}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            )}
          </CardTitle>
          <CardDescription className="flex items-center justify-between">
            <span>
              {showSearch ? filteredUsers.length : userList.length} users
              {showSearch && filteredUsers.length !== users.length && ` (filtered from ${users.length})`}
            </span>
            {showSearch && selectedUsers.size > 0 && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleBulkAction('reset')}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Reset Password ({selectedUsers.size})
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleBulkAction('activate-subscription')}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Activate ({selectedUsers.size})
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleBulkAction('disable')}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Disable ({selectedUsers.size})
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => handleBulkAction('delete')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete ({selectedUsers.size})
                </Button>
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  {showSearch && (
                    <th className="pb-2 text-sm font-medium text-muted-foreground w-12">
                      <Checkbox
                        checked={allCurrentSelected}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all users"
                        className={someCurrentSelected && !allCurrentSelected ? "data-[state=checked]:bg-muted" : ""}
                      />
                    </th>
                  )}
                  <th className="pb-2 text-sm font-medium text-muted-foreground">Email</th>
                  <th className="pb-2 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="pb-2 text-sm font-medium text-muted-foreground">Subscription</th>
                  <th className="pb-2 text-sm font-medium text-muted-foreground">Date Joined</th>
                  <th className="pb-2 text-sm font-medium text-muted-foreground">Last Active</th>
                  <th className="pb-2 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-border last:border-0"
                  >
                    {showSearch && (
                      <td className="py-3">
                        <Checkbox
                          checked={selectedUsers.has(user.id)}
                          onCheckedChange={() => toggleUserSelection(user.id)}
                          aria-label={`Select ${user.email}`}
                        />
                      </td>
                    )}
                    <td className="py-3">
                      <p className="font-medium text-foreground">{user.email}</p>
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {user.status === 'active' ? (
                          <UserCheck className="h-3 w-3 mr-1" />
                        ) : (
                          <UserX className="h-3 w-3 mr-1" />
                        )}
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.isSubscribed
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {user.isSubscribed ? (
                            <>
                              <Crown className="h-3 w-3 mr-1" />
                              Pro {user.planType ? `(${user.planType})` : ''}
                            </>
                          ) : (
                            'Free'
                          )}
                        </span>
                        {user.isSubscribed && user.subscriptionEndDate && (
                          <span className="text-xs text-muted-foreground">
                            Expires: {new Date(user.subscriptionEndDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {(() => {
                        try {
                          return user.createdAt.toLocaleDateString()
                        } catch {
                          return 'Unknown'
                        }
                      })()}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {(() => {
                        try {
                          return user.lastActiveAt.toLocaleDateString()
                        } catch {
                          return 'Unknown'
                        }
                      })()}
                    </td>
                    <td className="py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleUserAction(user, 'reset')}>
                            <Mail className="h-4 w-4 mr-2" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUserAction(user, 'disable')}>
                            <Shield className="h-4 w-4 mr-2" />
                            {user.status === 'active' ? 'Disable Account' : 'Enable Account'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.isSubscribed ? (
                            <DropdownMenuItem 
                              onClick={() => handleUserAction(user, 'revoke-subscription')}
                              className="text-orange-600 dark:text-orange-400"
                            >
                              <Crown className="h-4 w-4 mr-2" />
                              Revoke Subscription
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => handleUserAction(user, 'activate-subscription')}
                              className="text-purple-600 dark:text-purple-400"
                            >
                              <Crown className="h-4 w-4 mr-2" />
                              Activate Subscription
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleUserAction(user, 'delete')}
                            className="text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        
        {showSearch && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="text-muted-foreground">...</span>
                      )}
                      <Button
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    </React.Fragment>
                  ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    )
  }

  const StatsCard = ({ title, value, description, icon: Icon, trend }: {
    title: string
    value: string
    description: string
    icon: React.ElementType
    trend?: string
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">{trend}</p>
        )}
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <AdminRoute requiredPermission="user_management">
        <div className="space-y-6 p-6">
          <div className="h-8 w-48 bg-muted animate-pulse rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-muted animate-pulse rounded-lg"></div>
        </div>
      </AdminRoute>
    )
  }

  return (
    <AdminRoute requiredPermission="user_management">
      <div className="space-y-6 p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and manage FahamPesa users across all regions
          </p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <StatsCard
            title="Daily active users"
            value="13"
            description=""
            icon={Activity}
          />
          <StatsCard
            title="Total Users"
            value={allUsers.length.toString()}
            description="All registered users"
            icon={Users}
            trend="+12% from last month"
          />
          <StatsCard
            title="Active Users"
            value={activeUsers.length.toString()}
            description="Currently active users"
            icon={UserCheck}
            trend="+5% from last week"
          />
          <StatsCard
            title="New This Week"
            value={newUsers.length.toString()}
            description="Users joined in last 7 days"
            icon={UserPlus}
            trend="+23% from last week"
          />
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all-users">All Registered Users</TabsTrigger>
              <TabsTrigger value="activity-status">Active / Inactive Users</TabsTrigger>
              <TabsTrigger value="churn-retention">Churn & Retention</TabsTrigger>
            </TabsList>

            <TabsContent value="all-users" className="space-y-6">
              <UserTable userList={allUsers} title="All Registered Users" />
            </TabsContent>

            <TabsContent value="activity-status" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <UserTable userList={activeUsers} title="Active Users" showSearch={false} />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <UserTable userList={disabledUsers} title="Disabled Users" showSearch={false} />
                </motion.div>
              </div>
            </TabsContent>

            <TabsContent value="churn-retention" className="space-y-6">
              <Tabs defaultValue="new-users" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="new-users">New Users</TabsTrigger>
                  <TabsTrigger value="retention-weeks">Retention Weeks</TabsTrigger>
                  <TabsTrigger value="inactive-7days">Inactive 7+ Days</TabsTrigger>
                </TabsList>

                <TabsContent value="new-users">
                  <UserTable userList={newUsers} title="New Users (Last 7 Days)" showSearch={false} />
                </TabsContent>

                <TabsContent value="retention-weeks">
                  <UserTable userList={retentionUsers} title="Retained Users (Active in Last Week)" showSearch={false} />
                </TabsContent>

                <TabsContent value="inactive-7days">
                  <UserTable userList={inactiveWeekUsers} title="Users Inactive for 7+ Days" showSearch={false} />
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Action Confirmation Dialog */}
        <AlertDialog open={showActionDialog} onOpenChange={setShowActionDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {actionType === 'reset' && 'Reset Password'}
                {actionType === 'disable' && `${selectedUser?.status === 'active' ? 'Disable' : 'Enable'} Account`}
                {actionType === 'delete' && 'Delete Account'}
                {actionType === 'activate-subscription' && 'Activate Subscription'}
                {actionType === 'revoke-subscription' && 'Revoke Subscription'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {actionType === 'reset' && `A password reset email will be sent to ${selectedUser?.email}.`}
                {actionType === 'disable' && selectedUser?.status === 'active' && 
                  `This will disable ${selectedUser?.email}'s account. They will not be able to log in.`}
                {actionType === 'disable' && selectedUser?.status === 'disabled' && 
                  `This will enable ${selectedUser?.email}'s account. They will be able to log in again.`}
                {actionType === 'delete' && 
                  `This will permanently delete ${selectedUser?.email}'s account. This action cannot be undone.`}
                {actionType === 'activate-subscription' && 
                  `This will activate Pro subscription for ${selectedUser?.email}. They will have access to all Pro features until you revoke it.`}
                {actionType === 'revoke-subscription' && 
                  `This will revoke the Pro subscription for ${selectedUser?.email}. They will lose access to Pro features immediately.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmAction}
                disabled={actionLoading}
                className={actionType === 'delete' ? 'bg-red-600 hover:bg-red-700' : actionType === 'revoke-subscription' ? 'bg-orange-600 hover:bg-orange-700' : actionType === 'activate-subscription' ? 'bg-purple-600 hover:bg-purple-700' : ''}
              >
                {actionLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {actionType === 'reset' && 'Send Reset Email'}
                {actionType === 'disable' && (selectedUser?.status === 'active' ? 'Disable Account' : 'Enable Account')}
                {actionType === 'delete' && 'Delete Account'}
                {actionType === 'activate-subscription' && 'Activate Subscription'}
                {actionType === 'revoke-subscription' && 'Revoke Subscription'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Action Confirmation Dialog */}
        <AlertDialog open={showBulkActionDialog} onOpenChange={setShowBulkActionDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {bulkActionType === 'reset' && `Reset Password for ${selectedUsers.size} Users`}
                {bulkActionType === 'disable' && `Disable ${selectedUsers.size} User Accounts`}
                {bulkActionType === 'delete' && `Delete ${selectedUsers.size} User Accounts`}
                {bulkActionType === 'activate-subscription' && `Activate Subscription for ${selectedUsers.size} Users`}
                {bulkActionType === 'revoke-subscription' && `Revoke Subscription for ${selectedUsers.size} Users`}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {bulkActionType === 'reset' && 
                  `Password reset emails will be sent to ${selectedUsers.size} selected users.`}
                {bulkActionType === 'disable' && 
                  `This will disable ${selectedUsers.size} user accounts. They will not be able to log in.`}
                {bulkActionType === 'delete' && 
                  `This will permanently delete ${selectedUsers.size} user accounts. This action cannot be undone.`}
                {bulkActionType === 'activate-subscription' && 
                  `This will activate Pro subscription for ${selectedUsers.size} users. They will have access to all Pro features until you revoke it.`}
                {bulkActionType === 'revoke-subscription' && 
                  `This will revoke the Pro subscription for ${selectedUsers.size} users. They will lose access to Pro features immediately.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmBulkAction}
                disabled={actionLoading}
                className={bulkActionType === 'delete' ? 'bg-red-600 hover:bg-red-700' : bulkActionType === 'revoke-subscription' ? 'bg-orange-600 hover:bg-orange-700' : bulkActionType === 'activate-subscription' ? 'bg-purple-600 hover:bg-purple-700' : ''}
              >
                {actionLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {bulkActionType === 'reset' && `Send Reset Emails (${selectedUsers.size})`}
                {bulkActionType === 'disable' && `Disable Accounts (${selectedUsers.size})`}
                {bulkActionType === 'delete' && `Delete Accounts (${selectedUsers.size})`}
                {bulkActionType === 'activate-subscription' && `Activate Subscriptions (${selectedUsers.size})`}
                {bulkActionType === 'revoke-subscription' && `Revoke Subscriptions (${selectedUsers.size})`}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminRoute>
  )
}
