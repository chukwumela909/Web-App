'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import AdminRoute from '@/components/auth/AdminRoute'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Clock,
  Calendar,
  Activity,
  MoreHorizontal,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Shield,
  Trash2,
  Mail,
  Crown
} from 'lucide-react'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { userManagementActions, isUserDisabled, getCleanDisplayName } from '@/lib/firebase-admin'
import { useToast } from '@/hooks/use-toast'
import UserMetricsService from '@/lib/user-metrics-service'
import { handleError } from '@/lib/error-handler'

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
  const [actionType, setActionType] = useState<'reset' | 'disable' | 'delete' | null>(null)
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  
  // Bulk selection states
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [showBulkActionDialog, setShowBulkActionDialog] = useState(false)
  const [bulkActionType, setBulkActionType] = useState<'reset' | 'disable' | 'delete' | null>(null)
  
  const { toast } = useToast()
  const searchInputRef = useRef<HTMLInputElement>(null)

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
      
      // Fetch users from Firebase Auth using the new API endpoint
      const response = await fetch('/api/admin/firebase-auth-users?includeFirestore=true')
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch users')
      }
      
      const usersData: User[] = data.users.map((user: any) => ({
        id: user.uid,
        email: user.email || 'No email',
        displayName: user.displayName || 'No name',
        createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime) : new Date(),
        lastActiveAt: user.lastActiveAt ? new Date(user.lastActiveAt) : user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : new Date(),
        status: user.disabled ? 'disabled' : 'active',
        isDisabled: user.disabled,
        emailVerified: user.emailVerified || false,
        region: user.region || 'Unknown',
        firestoreData: user.firestoreData,
        source: user.source || data.source,
        // Subscription fields
        isSubscribed: user.isSubscribed || false,
        subscriptionId: user.subscriptionId || null,
        subscriptionEndDate: user.subscriptionEndDate || null,
        planType: user.planType || null,
        businessName: user.businessName || null
      }))
      
      setUsers(usersData)
      
      // Show info about data source
      if (data.warning) {
        toast({
          title: 'Info',
          description: data.warning,
          variant: 'default'
        })
      }
      
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
  }, [toast])

  // Separate function for resetting to all users (to avoid circular dependency)
  const resetToAllUsers = useCallback(async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/admin/firebase-auth-users?includeFirestore=true')
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch users')
      }
      
      const usersData: User[] = data.users.map((user: any) => ({
        id: user.uid,
        email: user.email || 'No email',
        displayName: user.displayName || 'No name',
        createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime) : new Date(),
        lastActiveAt: user.lastActiveAt ? new Date(user.lastActiveAt) : user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : new Date(),
        status: user.disabled ? 'disabled' : 'active',
        isDisabled: user.disabled,
        emailVerified: user.emailVerified || false,
        region: user.region || 'Unknown',
        firestoreData: user.firestoreData,
        source: user.source || data.source,
        // Subscription fields
        isSubscribed: user.isSubscribed || false,
        subscriptionId: user.subscriptionId || null,
        subscriptionEndDate: user.subscriptionEndDate || null,
        planType: user.planType || null,
        businessName: user.businessName || null
      }))
      
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
  }, [toast])

  // User action handlers
  const handleUserAction = async (user: User, action: 'reset' | 'disable' | 'delete') => {
    setSelectedUser(user)
    setActionType(action)
    setShowActionDialog(true)
  }

  const confirmAction = async () => {
    if (!selectedUser || !actionType) return

    try {
      setActionLoading(true)
      
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
          const response = await fetch(`/api/admin/users/${selectedUser.id}/disable`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ disabled: selectedUser.status === 'active' })
          })
          
          if (response.ok) {
            const result = await response.json()
            toast({
              title: 'Success',
              description: result.message || `User ${selectedUser.status === 'active' ? 'disabled' : 'enabled'} successfully`,
              variant: 'success'
            })
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
            throw new Error(errorData.error || `Failed to update user status (${response.status})`)
          }
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
      await fetchUsers()
      
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
  const handleBulkAction = (action: 'reset' | 'disable' | 'delete') => {
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
      
      for (const user of selectedUserList) {
        switch (bulkActionType) {
          case 'reset':
            await userManagementActions.resetPassword(user.email)
            break
          case 'disable':
            const disableResponse = await fetch(`/api/admin/users/${user.id}/disable`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ disabled: user.status === 'active' })
            })
            if (!disableResponse.ok) {
              const errorData = await disableResponse.json().catch(() => ({ error: 'Unknown error' }))
              throw new Error(`Failed to ${user.status === 'active' ? 'disable' : 'enable'} user ${user.email}: ${errorData.error}`)
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
      await fetchUsers()
      
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
      
      // Search using the API endpoint
      const response = await fetch(`/api/admin/firebase-auth-users?email=${encodeURIComponent(term.trim())}&includeFirestore=true`)
      const data = await response.json()
      
      if (data.success) {
        const usersData: User[] = data.users.map((user: any) => ({
          id: user.uid,
          email: user.email || 'No email',
          displayName: user.displayName || 'No name',
          createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime) : new Date(),
          lastActiveAt: user.lastActiveAt ? new Date(user.lastActiveAt) : user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : new Date(),
          status: user.disabled ? 'disabled' : 'active',
          isDisabled: user.disabled,
          emailVerified: user.emailVerified || false,
          region: user.region || 'Unknown',
          firestoreData: user.firestoreData,
          source: user.source || data.source,
          // Subscription fields
          isSubscribed: user.isSubscribed || false,
          subscriptionId: user.subscriptionId || null,
          subscriptionEndDate: user.subscriptionEndDate || null,
          planType: user.planType || null,
          businessName: user.businessName || null
        }))
        
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
      } else {
        throw new Error(data.error || 'Search failed')
      }
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
  }, [toast, resetToAllUsers])

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
              </AlertDialogTitle>
              <AlertDialogDescription>
                {actionType === 'reset' && `A password reset email will be sent to ${selectedUser?.email}.`}
                {actionType === 'disable' && selectedUser?.status === 'active' && 
                  `This will disable ${selectedUser?.email}'s account. They will not be able to log in.`}
                {actionType === 'disable' && selectedUser?.status === 'disabled' && 
                  `This will enable ${selectedUser?.email}'s account. They will be able to log in again.`}
                {actionType === 'delete' && 
                  `This will permanently delete ${selectedUser?.email}'s account. This action cannot be undone.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmAction}
                disabled={actionLoading}
                className={actionType === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                {actionLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {actionType === 'reset' && 'Send Reset Email'}
                {actionType === 'disable' && (selectedUser?.status === 'active' ? 'Disable Account' : 'Enable Account')}
                {actionType === 'delete' && 'Delete Account'}
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
              </AlertDialogTitle>
              <AlertDialogDescription>
                {bulkActionType === 'reset' && 
                  `Password reset emails will be sent to ${selectedUsers.size} selected users.`}
                {bulkActionType === 'disable' && 
                  `This will disable ${selectedUsers.size} user accounts. They will not be able to log in.`}
                {bulkActionType === 'delete' && 
                  `This will permanently delete ${selectedUsers.size} user accounts. This action cannot be undone.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmBulkAction}
                disabled={actionLoading}
                className={bulkActionType === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                {actionLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                {bulkActionType === 'reset' && `Send Reset Emails (${selectedUsers.size})`}
                {bulkActionType === 'disable' && `Disable Accounts (${selectedUsers.size})`}
                {bulkActionType === 'delete' && `Delete Accounts (${selectedUsers.size})`}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminRoute>
  )
}
