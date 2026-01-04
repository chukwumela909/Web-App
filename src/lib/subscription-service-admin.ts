/**
 * Subscription Service (Admin SDK) for Fahampesa
 * Server-side subscription operations using Firebase Admin SDK
 * This bypasses Firestore security rules and should only be used in API routes
 */

import { adminDb } from './firebase-admin-server'
import {
  Subscription,
  SubscriptionFirestore,
  SubscriptionStatus,
  CreateSubscriptionInput,
  PlanType,
  getPlanName,
  calculateEndDate,
  PLAN_DURATION,
  SubscriptionFilter,
  SubscriptionStats,
} from './subscription-types'

const SUBSCRIPTIONS_COLLECTION = 'subscriptions'
const SUBSCRIPTION_LOGS_COLLECTION = 'subscription_logs'

/**
 * Check if Admin SDK is available
 */
function ensureAdminDb() {
  if (!adminDb) {
    throw new Error('Firebase Admin SDK not initialized. Please check your service account credentials.')
  }
  return adminDb
}

/**
 * Helper to convert Firestore timestamp or number to Date
 */
function toDate(value: number | { seconds: number; nanoseconds: number } | FirebaseFirestore.Timestamp | null | undefined): Date | null {
  if (value === null || value === undefined) return null
  
  // If it's a Firestore Timestamp object (has seconds and nanoseconds)
  if (typeof value === 'object' && 'seconds' in value) {
    return new Date(value.seconds * 1000)
  }
  
  // If it's a number (milliseconds)
  if (typeof value === 'number') {
    return new Date(value)
  }
  
  return null
}

/**
 * Convert Firestore document to Subscription object
 */
function toSubscription(id: string, data: SubscriptionFirestore): Subscription {
  return {
    id,
    userId: data.userId,
    email: data.email,
    planType: data.planType,
    planName: data.planName,
    status: data.status,
    amount: data.amount,
    currency: data.currency,
    startDate: toDate(data.startDate as number | { seconds: number; nanoseconds: number } | null),
    endDate: toDate(data.endDate as number | { seconds: number; nanoseconds: number } | null),
    transactionId: data.transactionId,
    checkoutRequestId: data.checkoutRequestId,
    phoneNumber: data.phoneNumber,
    createdAt: toDate(data.createdAt as number | { seconds: number; nanoseconds: number }) || new Date(),
    updatedAt: toDate(data.updatedAt as number | { seconds: number; nanoseconds: number }) || new Date(),
  }
}

/**
 * Create a new pending subscription (before payment) - Admin SDK version
 */
export async function createPendingSubscriptionAdmin(
  input: CreateSubscriptionInput
): Promise<Subscription> {
  const db = ensureAdminDb()
  const now = new Date()
  const subscriptionRef = db.collection(SUBSCRIPTIONS_COLLECTION).doc()
  
  const subscriptionData: SubscriptionFirestore = {
    userId: input.userId,
    email: input.email,
    planType: input.planType,
    planName: getPlanName(input.planType),
    status: 'pending',
    amount: input.amount,
    currency: input.currency,
    startDate: null,
    endDate: null,
    transactionId: null,
    checkoutRequestId: input.checkoutRequestId || null,
    phoneNumber: input.phoneNumber,
    createdAt: now.getTime(),
    updatedAt: now.getTime(),
  }
  
  await subscriptionRef.set(subscriptionData)
  
  return toSubscription(subscriptionRef.id, subscriptionData)
}

/**
 * Activate a subscription after successful payment - Admin SDK version
 */
export async function activateSubscriptionAdmin(
  subscriptionId: string,
  transactionId: string
): Promise<Subscription> {
  const db = ensureAdminDb()
  const subscriptionRef = db.collection(SUBSCRIPTIONS_COLLECTION).doc(subscriptionId)
  const subscriptionSnap = await subscriptionRef.get()
  
  if (!subscriptionSnap.exists) {
    throw new Error('Subscription not found')
  }
  
  const existingData = subscriptionSnap.data() as SubscriptionFirestore
  const now = new Date()
  const endDate = calculateEndDate(now, existingData.planType)
  
  const updateData: Partial<SubscriptionFirestore> = {
    status: 'active',
    transactionId,
    startDate: now.getTime(),
    endDate: endDate.getTime(),
    updatedAt: now.getTime(),
  }
  
  await subscriptionRef.update(updateData)
  
  // Also update user profile with subscription status
  await updateUserSubscriptionStatusAdmin(existingData.userId, true, subscriptionId, endDate)
  
  return toSubscription(subscriptionId, { ...existingData, ...updateData })
}

/**
 * Update subscription status (for webhook callbacks) - Admin SDK version
 */
export async function updateSubscriptionStatusAdmin(
  subscriptionId: string,
  status: SubscriptionStatus
): Promise<void> {
  const db = ensureAdminDb()
  const subscriptionRef = db.collection(SUBSCRIPTIONS_COLLECTION).doc(subscriptionId)
  const subscriptionSnap = await subscriptionRef.get()
  
  if (!subscriptionSnap.exists) {
    throw new Error('Subscription not found')
  }
  
  const now = new Date()
  
  await subscriptionRef.update({
    status,
    updatedAt: now.getTime(),
  })
}

/**
 * Find subscription by CheckoutRequestID (for M-Pesa callback) - Admin SDK version
 */
export async function findSubscriptionByCheckoutRequestIdAdmin(
  checkoutRequestId: string
): Promise<Subscription | null> {
  const db = ensureAdminDb()
  const snapshot = await db
    .collection(SUBSCRIPTIONS_COLLECTION)
    .where('checkoutRequestId', '==', checkoutRequestId)
    .limit(1)
    .get()
  
  if (snapshot.empty) {
    return null
  }
  
  const doc = snapshot.docs[0]
  return toSubscription(doc.id, doc.data() as SubscriptionFirestore)
}

/**
 * Get subscription by ID - Admin SDK version
 */
export async function getSubscriptionAdmin(subscriptionId: string): Promise<Subscription | null> {
  const db = ensureAdminDb()
  const subscriptionRef = db.collection(SUBSCRIPTIONS_COLLECTION).doc(subscriptionId)
  const subscriptionSnap = await subscriptionRef.get()
  
  if (!subscriptionSnap.exists) {
    return null
  }
  
  return toSubscription(subscriptionId, subscriptionSnap.data() as SubscriptionFirestore)
}

/**
 * Get user's active subscription - Admin SDK version
 */
export async function getUserActiveSubscriptionAdmin(userId: string): Promise<Subscription | null> {
  const db = ensureAdminDb()
  const snapshot = await db
    .collection(SUBSCRIPTIONS_COLLECTION)
    .where('userId', '==', userId)
    .where('status', '==', 'active')
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get()
  
  if (snapshot.empty) {
    return null
  }
  
  const doc = snapshot.docs[0]
  return toSubscription(doc.id, doc.data() as SubscriptionFirestore)
}

/**
 * Mark subscription as failed (payment failed) - Admin SDK version
 */
export async function markSubscriptionFailedAdmin(
  subscriptionId: string,
  reason?: string
): Promise<void> {
  const db = ensureAdminDb()
  const subscriptionRef = db.collection(SUBSCRIPTIONS_COLLECTION).doc(subscriptionId)
  
  await subscriptionRef.update({
    status: 'failed',
    updatedAt: Date.now(),
  })
}

/**
 * Update user's subscription status in their profile - Admin SDK version
 */
async function updateUserSubscriptionStatusAdmin(
  userId: string,
  isSubscribed: boolean,
  subscriptionId: string | null,
  subscriptionEndDate: Date | null
): Promise<void> {
  const db = ensureAdminDb()
  
  try {
    // Update in userProfiles collection
    const userProfileRef = db.collection('userProfiles').doc(userId)
    const userProfileSnap = await userProfileRef.get()
    
    if (userProfileSnap.exists) {
      await userProfileRef.update({
        isSubscribed,
        subscriptionId,
        subscriptionEndDate: subscriptionEndDate?.getTime() || null,
        updatedAt: Date.now(),
      })
    }
    
    // Also update in users collection if it exists
    const userRef = db.collection('users').doc(userId)
    const userSnap = await userRef.get()
    
    if (userSnap.exists) {
      await userRef.update({
        isSubscribed,
        subscriptionId,
        subscriptionEndDate: subscriptionEndDate?.getTime() || null,
        lastUpdated: Date.now(),
      })
    }
  } catch (error) {
    console.error('Error updating user subscription status:', error)
    // Don't throw - this is a secondary update
  }
}

/**
 * Log subscription admin actions - Admin SDK version
 */
export async function logSubscriptionActionAdmin(log: {
  subscriptionId: string
  action: 'extend' | 'revoke' | 'create' | 'activate' | 'expire'
  adminId: string
  reason?: string
  details: Record<string, any>
}): Promise<void> {
  const db = ensureAdminDb()
  
  try {
    const logRef = db.collection(SUBSCRIPTION_LOGS_COLLECTION).doc()
    await logRef.set({
      ...log,
      createdAt: Date.now(),
    })
  } catch (error) {
    console.error('Error logging subscription action:', error)
    // Don't throw - logging failure shouldn't break main operation
  }
}

/**
 * Get all subscriptions (for admin) - Admin SDK version
 */
export async function getAllSubscriptionsAdmin(
  filter?: SubscriptionFilter
): Promise<Subscription[]> {
  const db = ensureAdminDb()
  
  const snapshot = await db
    .collection(SUBSCRIPTIONS_COLLECTION)
    .orderBy('createdAt', 'desc')
    .get()
  
  let subscriptions = snapshot.docs.map((doc) =>
    toSubscription(doc.id, doc.data() as SubscriptionFirestore)
  )
  
  // Apply filters in memory
  if (filter) {
    if (filter.status && filter.status !== 'all') {
      subscriptions = subscriptions.filter((s) => s.status === filter.status)
    }
    if (filter.currency && filter.currency !== 'all') {
      subscriptions = subscriptions.filter((s) => s.currency === filter.currency)
    }
    if (filter.email) {
      subscriptions = subscriptions.filter((s) =>
        s.email.toLowerCase().includes(filter.email!.toLowerCase())
      )
    }
  }
  
  return subscriptions
}

/**
 * Get subscription statistics (for admin dashboard) - Admin SDK version
 */
export async function getSubscriptionStatsAdmin(): Promise<SubscriptionStats> {
  const subscriptions = await getAllSubscriptionsAdmin()
  
  const stats: SubscriptionStats = {
    totalRevenue: 0,
    totalRevenueKSH: 0,
    totalRevenueUSD: 0,
    activeSubscriptions: 0,
    expiredSubscriptions: 0,
    pendingSubscriptions: 0,
  }
  
  subscriptions.forEach((sub) => {
    // Only count completed payments
    if (sub.status === 'active' || sub.status === 'expired' || sub.status === 'cancelled') {
      if (sub.currency === 'KSH') {
        stats.totalRevenueKSH += sub.amount
      } else {
        stats.totalRevenueUSD += sub.amount
      }
    }
    
    switch (sub.status) {
      case 'active':
        stats.activeSubscriptions++
        break
      case 'expired':
        stats.expiredSubscriptions++
        break
      case 'pending':
        stats.pendingSubscriptions++
        break
    }
  })
  
  // Convert to total revenue (using approximate exchange rate for display)
  stats.totalRevenue = stats.totalRevenueKSH + (stats.totalRevenueUSD * 130) // Approximate KSH conversion
  
  return stats
}

/**
 * Get all subscriptions for a user - Admin SDK version
 */
export async function getUserSubscriptionsAdmin(userId: string): Promise<Subscription[]> {
  const db = ensureAdminDb()
  
  const snapshot = await db
    .collection(SUBSCRIPTIONS_COLLECTION)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get()
  
  return snapshot.docs.map((doc) =>
    toSubscription(doc.id, doc.data() as SubscriptionFirestore)
  )
}

/**
 * Extend a subscription (admin action) - Admin SDK version
 */
export async function extendSubscriptionAdmin(
  subscriptionId: string,
  duration: PlanType,
  adminId: string,
  reason?: string
): Promise<Subscription> {
  const db = ensureAdminDb()
  const subscriptionRef = db.collection(SUBSCRIPTIONS_COLLECTION).doc(subscriptionId)
  const subscriptionSnap = await subscriptionRef.get()
  
  if (!subscriptionSnap.exists) {
    throw new Error('Subscription not found')
  }
  
  const existingData = subscriptionSnap.data() as SubscriptionFirestore
  const now = new Date()
  
  // Calculate new end date
  const currentEndDate = existingData.endDate ? new Date(existingData.endDate) : now
  const baseDate = currentEndDate > now ? currentEndDate : now
  
  const daysToAdd = PLAN_DURATION[duration]
  const newEndDate = new Date(baseDate)
  newEndDate.setDate(newEndDate.getDate() + daysToAdd)
  
  const updateData: Partial<SubscriptionFirestore> = {
    status: 'active',
    endDate: newEndDate.getTime(),
    updatedAt: now.getTime(),
  }
  
  // If subscription was expired or cancelled, set new start date
  if (existingData.status === 'expired' || existingData.status === 'cancelled') {
    updateData.startDate = now.getTime()
  }
  
  await subscriptionRef.update(updateData)
  
  // Log the admin action
  await logSubscriptionActionAdmin({
    subscriptionId,
    action: 'extend',
    adminId,
    reason,
    details: { duration, newEndDate: newEndDate.toISOString() },
  })
  
  // Update user profile
  await updateUserSubscriptionStatusAdmin(existingData.userId, true, subscriptionId, newEndDate)
  
  return toSubscription(subscriptionId, { ...existingData, ...updateData })
}

/**
 * Revoke/Cancel a subscription (admin action) - Admin SDK version
 */
export async function revokeSubscriptionAdmin(
  subscriptionId: string,
  adminId: string,
  reason?: string
): Promise<Subscription> {
  const db = ensureAdminDb()
  const subscriptionRef = db.collection(SUBSCRIPTIONS_COLLECTION).doc(subscriptionId)
  const subscriptionSnap = await subscriptionRef.get()
  
  if (!subscriptionSnap.exists) {
    throw new Error('Subscription not found')
  }
  
  const existingData = subscriptionSnap.data() as SubscriptionFirestore
  const now = new Date()
  
  const updateData: Partial<SubscriptionFirestore> = {
    status: 'cancelled',
    endDate: now.getTime(), // End immediately
    updatedAt: now.getTime(),
  }
  
  await subscriptionRef.update(updateData)
  
  // Log the admin action
  await logSubscriptionActionAdmin({
    subscriptionId,
    action: 'revoke',
    adminId,
    reason,
    details: {},
  })
  
  // Update user profile
  await updateUserSubscriptionStatusAdmin(existingData.userId, false, null, null)
  
  return toSubscription(subscriptionId, { ...existingData, ...updateData })
}
