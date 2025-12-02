import { NextRequest, NextResponse } from 'next/server'
import { listAllUsers, getUserByEmail, FirebaseAuthUser } from '@/lib/firebase-admin-server'
import { db } from '@/lib/firebase'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'

export interface EnhancedUser extends FirebaseAuthUser {
  lastActiveAt?: string
  region?: string
  businessType?: string
  firestoreData?: any
  // Subscription fields from userProfiles
  isSubscribed?: boolean
  subscriptionId?: string | null
  subscriptionEndDate?: number | null
  planType?: 'monthly' | 'yearly' | null
  businessName?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const includeFirestoreData = searchParams.get('includeFirestore') === 'true'
    
    let authUsers: FirebaseAuthUser[]
    
    if (email) {
      // Search for specific user by email
      const user = await getUserByEmail(email)
      authUsers = user ? [user] : []
    } else {
      // Fetch all users
      authUsers = await listAllUsers()
    }
    
    // Enhance with Firestore data if requested
    let enhancedUsers: EnhancedUser[] = authUsers
    
    if (includeFirestoreData) {
      // Get all Firestore user documents for matching
      const usersRef = collection(db, 'users')
      const firestoreSnapshot = await getDocs(usersRef)
      const firestoreUsers = new Map()
      
      firestoreSnapshot.forEach((doc) => {
        firestoreUsers.set(doc.id, doc.data())
      })
      
      // Get all userProfiles for subscription data
      const userProfilesRef = collection(db, 'userProfiles')
      const userProfilesSnapshot = await getDocs(userProfilesRef)
      const userProfiles = new Map()
      
      userProfilesSnapshot.forEach((doc) => {
        userProfiles.set(doc.id, doc.data())
      })
      
      // Also get active subscriptions for plan type info
      const subscriptionsRef = collection(db, 'subscriptions')
      const subscriptionsSnapshot = await getDocs(subscriptionsRef)
      const subscriptions = new Map()
      
      subscriptionsSnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.userId) {
          subscriptions.set(data.userId, { id: doc.id, ...data })
        }
      })
      
      // Enhance auth users with Firestore data and subscription info
      enhancedUsers = authUsers.map(authUser => {
        const firestoreData = firestoreUsers.get(authUser.uid)
        const userProfile = userProfiles.get(authUser.uid)
        const subscription = subscriptions.get(authUser.uid)
        
        // Determine subscription status from userProfile or active subscription
        const isSubscribed = userProfile?.isSubscribed || false
        const subscriptionId = userProfile?.subscriptionId || subscription?.id || null
        const subscriptionEndDate = userProfile?.subscriptionEndDate || 
          (subscription?.endDate?.seconds ? subscription.endDate.seconds * 1000 : subscription?.endDate) || null
        const planType = subscription?.planType || null
        
        return {
          ...authUser,
          lastActiveAt: firestoreData?.lastActiveAt ? 
            (firestoreData.lastActiveAt.toDate ? firestoreData.lastActiveAt.toDate().toISOString() : firestoreData.lastActiveAt) : 
            undefined,
          region: firestoreData?.region,
          businessType: firestoreData?.businessType,
          firestoreData: firestoreData || null,
          // Subscription fields
          isSubscribed,
          subscriptionId,
          subscriptionEndDate,
          planType,
          businessName: userProfile?.businessName || null
        }
      })
    }
    
    // Sort by creation time (newest first)
    enhancedUsers.sort((a, b) => {
      const aTime = a.metadata.creationTime ? new Date(a.metadata.creationTime).getTime() : 0
      const bTime = b.metadata.creationTime ? new Date(b.metadata.creationTime).getTime() : 0
      return bTime - aTime
    })
    
    // Calculate statistics
    const stats = {
      totalUsers: enhancedUsers.length,
      activeUsers: enhancedUsers.filter(u => !u.disabled).length,
      disabledUsers: enhancedUsers.filter(u => u.disabled).length,
      verifiedEmails: enhancedUsers.filter(u => u.emailVerified).length,
      usersWithFirestoreData: enhancedUsers.filter(u => u.firestoreData).length,
      recentUsers: enhancedUsers.filter(u => {
        if (!u.metadata.creationTime) return false
        const createdDate = new Date(u.metadata.creationTime)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        return createdDate >= weekAgo
      }).length,
      // Subscription stats
      subscribedUsers: enhancedUsers.filter(u => u.isSubscribed).length,
      freeUsers: enhancedUsers.filter(u => !u.isSubscribed).length,
      monthlySubscribers: enhancedUsers.filter(u => u.planType === 'monthly').length,
      yearlySubscribers: enhancedUsers.filter(u => u.planType === 'yearly').length
    }
    
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      stats,
      users: enhancedUsers,
      totalCount: enhancedUsers.length,
      source: 'Firebase Authentication via Admin SDK',
      searchedEmail: email || null,
      includeFirestoreData
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Error fetching Firebase Auth users:', error)
    
    // If Firebase Admin SDK is not configured, fall back to Firestore-only approach
    if (error instanceof Error && error.message.includes('Firebase Admin SDK not initialized')) {
      try {
        console.log('Falling back to Firestore-only user data...')
        
        const usersRef = collection(db, 'users')
        const snapshot = await getDocs(usersRef)
        
        const users = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          
          // Determine the best email to use (many users store email in field 'c')
          const userEmail = data.email || data.c || 'No email'
          
          users.push({
            uid: doc.id,
            email: userEmail,
            displayName: data.displayName || data.name || data.b || null, // 'b' seems to be another name field
            emailVerified: data.emailVerified || false,
            disabled: data.disabled || false,
            metadata: {
              creationTime: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : null,
              lastSignInTime: data.lastSignInTime ? (data.lastSignInTime.toDate ? data.lastSignInTime.toDate().toISOString() : data.lastSignInTime) : null,
            },
            lastActiveAt: data.lastActiveAt ? (data.lastActiveAt.toDate ? data.lastActiveAt.toDate().toISOString() : data.lastActiveAt) : null,
            region: data.region || null,
            businessType: data.businessType || null,
            firestoreData: data,
            source: 'Firestore fallback'
          })
        })
        
        // Filter by email if searching
        const { searchParams } = new URL(request.url)
        const email = searchParams.get('email')
        const filteredUsers = email ? 
          users.filter(u => {
            const userEmail = u.email?.toLowerCase() || ''
            const firestoreEmail = u.firestoreData?.email?.toLowerCase() || ''
            const firestoreEmailC = u.firestoreData?.c?.toLowerCase() || '' // Many users have email in field 'c'
            const searchTerm = email.toLowerCase()
            
            return userEmail.includes(searchTerm) || 
                   firestoreEmail.includes(searchTerm) || 
                   firestoreEmailC.includes(searchTerm)
          }) : 
          users
        
        const stats = {
          totalUsers: filteredUsers.length,
          activeUsers: filteredUsers.filter(u => !u.disabled).length,
          disabledUsers: filteredUsers.filter(u => u.disabled).length,
          verifiedEmails: filteredUsers.filter(u => u.emailVerified).length,
          usersWithFirestoreData: filteredUsers.length, // All have Firestore data in this fallback
          recentUsers: filteredUsers.filter(u => {
            if (!u.metadata.creationTime) return false
            const createdDate = new Date(u.metadata.creationTime)
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            return createdDate >= weekAgo
          }).length
        }
        
        return NextResponse.json({
          success: true,
          timestamp: new Date().toISOString(),
          stats,
          users: filteredUsers,
          totalCount: filteredUsers.length,
          source: 'Firestore fallback (Firebase Admin SDK not configured)',
          searchedEmail: email || null,
          warning: 'Using Firestore fallback. Some Firebase Auth users may not be visible.',
          note: 'Configure Firebase Admin SDK with service account credentials for complete user access.'
        })
        
      } catch (fallbackError) {
        console.error('Firestore fallback also failed:', fallbackError)
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch user data from both Firebase Auth and Firestore',
          details: {
            adminSdkError: error.message,
            firestoreError: fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
          }
        }, { status: 500 })
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch Firebase Auth users',
      details: error instanceof Error ? error.message : 'Unknown error',
      note: 'Make sure Firebase Admin SDK is properly configured with service account credentials'
    }, { status: 500 })
  }
}
