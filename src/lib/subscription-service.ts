/**
 * Subscription Service for Fahampesa
 * Handles all subscription-related operations with Firestore
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'
import {
  Subscription,
  SubscriptionFirestore,
  SubscriptionStatus,
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  ExtendSubscriptionInput,
  RevokeSubscriptionInput,
  SubscriptionStats,
  SubscriptionFilter,
  PlanType,
  Currency,
  getPlanName,
  calculateEndDate,
  PLAN_DURATION,
} from './subscription-types'

const SUBSCRIPTIONS_COLLECTION = 'subscriptions'
const SUBSCRIPTION_LOGS_COLLECTION = 'subscription_logs'

/**
 * Helper to convert Firestore timestamp or number to Date
 */
function toDate(value: number | { seconds: number; nanoseconds: number } | Timestamp | null): Date | null {
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
 * Convert Subscription to Firestore format
 */
function toFirestore(subscription: Partial<Subscription>): Partial<SubscriptionFirestore> {
  const data: Partial<SubscriptionFirestore> = {}
  
  if (subscription.userId !== undefined) data.userId = subscription.userId
  if (subscription.email !== undefined) data.email = subscription.email
  if (subscription.planType !== undefined) data.planType = subscription.planType
  if (subscription.planName !== undefined) data.planName = subscription.planName
  if (subscription.status !== undefined) data.status = subscription.status
  if (subscription.amount !== undefined) data.amount = subscription.amount
  if (subscription.currency !== undefined) data.currency = subscription.currency
  if (subscription.startDate !== undefined) data.startDate = subscription.startDate?.getTime() || null
  if (subscription.endDate !== undefined) data.endDate = subscription.endDate?.getTime() || null
  if (subscription.transactionId !== undefined) data.transactionId = subscription.transactionId
  if (subscription.checkoutRequestId !== undefined) data.checkoutRequestId = subscription.checkoutRequestId
  if (subscription.phoneNumber !== undefined) data.phoneNumber = subscription.phoneNumber
  if (subscription.createdAt !== undefined) data.createdAt = subscription.createdAt.getTime()
  if (subscription.updatedAt !== undefined) data.updatedAt = subscription.updatedAt.getTime()
  
  return data
}

/**
 * Create a new pending subscription (before payment)
 */
export async function createPendingSubscription(
  input: CreateSubscriptionInput
): Promise<Subscription> {
  const now = new Date()
  const subscriptionRef = doc(collection(db, SUBSCRIPTIONS_COLLECTION))
  
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
  
  await setDoc(subscriptionRef, subscriptionData)
  
  return toSubscription(subscriptionRef.id, subscriptionData)
}

/**
 * Activate a subscription after successful payment
 */
export async function activateSubscription(
  subscriptionId: string,
  transactionId: string
): Promise<Subscription> {
  const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId)
  const subscriptionSnap = await getDoc(subscriptionRef)
  
  if (!subscriptionSnap.exists()) {
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
  
  await updateDoc(subscriptionRef, updateData)
  
  // Also update user profile with subscription status
  await updateUserSubscriptionStatus(existingData.userId, true, subscriptionId, endDate)
  
  return toSubscription(subscriptionId, { ...existingData, ...updateData })
}

/**
 * Update subscription status (for webhook callbacks)
 */
export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: SubscriptionStatus
): Promise<void> {
  const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId)
  const subscriptionSnap = await getDoc(subscriptionRef)
  
  if (!subscriptionSnap.exists()) {
    throw new Error('Subscription not found')
  }
  
  const now = new Date()
  
  await updateDoc(subscriptionRef, {
    status,
    updatedAt: now.getTime(),
  })
}

/**
 * Find subscription by CheckoutRequestID (for M-Pesa callback)
 */
export async function findSubscriptionByCheckoutRequestId(
  checkoutRequestId: string
): Promise<Subscription | null> {
  const q = query(
    collection(db, SUBSCRIPTIONS_COLLECTION),
    where('checkoutRequestId', '==', checkoutRequestId),
    limit(1)
  )
  
  const snapshot = await getDocs(q)
  
  if (snapshot.empty) {
    return null
  }
  
  const doc = snapshot.docs[0]
  return toSubscription(doc.id, doc.data() as SubscriptionFirestore)
}

/**
 * Get subscription by ID
 */
export async function getSubscription(subscriptionId: string): Promise<Subscription | null> {
  const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId)
  const subscriptionSnap = await getDoc(subscriptionRef)
  
  if (!subscriptionSnap.exists()) {
    return null
  }
  
  return toSubscription(subscriptionId, subscriptionSnap.data() as SubscriptionFirestore)
}

/**
 * Get user's active subscription
 */
export async function getUserActiveSubscription(userId: string): Promise<Subscription | null> {
  const q = query(
    collection(db, SUBSCRIPTIONS_COLLECTION),
    where('userId', '==', userId),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc'),
    limit(1)
  )
  
  const snapshot = await getDocs(q)
  
  if (snapshot.empty) {
    return null
  }
  
  const doc = snapshot.docs[0]
  return toSubscription(doc.id, doc.data() as SubscriptionFirestore)
}

/**
 * Get all subscriptions for a user
 */
export async function getUserSubscriptions(userId: string): Promise<Subscription[]> {
  const q = query(
    collection(db, SUBSCRIPTIONS_COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  
  const snapshot = await getDocs(q)
  
  return snapshot.docs.map((doc) =>
    toSubscription(doc.id, doc.data() as SubscriptionFirestore)
  )
}

/**
 * Get all subscriptions (for admin)
 */
export async function getAllSubscriptions(
  filter?: SubscriptionFilter
): Promise<Subscription[]> {
  let q = query(
    collection(db, SUBSCRIPTIONS_COLLECTION),
    orderBy('createdAt', 'desc')
  )
  
  // Note: Firestore has limitations on compound queries
  // For complex filtering, we filter in memory after fetching
  const snapshot = await getDocs(q)
  
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
 * Extend a subscription (admin action)
 */
export async function extendSubscription(
  input: ExtendSubscriptionInput
): Promise<Subscription> {
  const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, input.subscriptionId)
  const subscriptionSnap = await getDoc(subscriptionRef)
  
  if (!subscriptionSnap.exists()) {
    throw new Error('Subscription not found')
  }
  
  const existingData = subscriptionSnap.data() as SubscriptionFirestore
  const now = new Date()
  
  // Calculate new end date
  const currentEndDate = existingData.endDate ? new Date(existingData.endDate) : now
  const baseDate = currentEndDate > now ? currentEndDate : now
  
  const daysToAdd = PLAN_DURATION[input.duration]
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
  
  await updateDoc(subscriptionRef, updateData)
  
  // Log the admin action
  await logSubscriptionAction({
    subscriptionId: input.subscriptionId,
    action: 'extend',
    adminId: input.adminId,
    reason: input.reason,
    details: { duration: input.duration, newEndDate: newEndDate.toISOString() },
  })
  
  // Update user profile
  await updateUserSubscriptionStatus(existingData.userId, true, input.subscriptionId, newEndDate)
  
  return toSubscription(input.subscriptionId, { ...existingData, ...updateData })
}

/**
 * Revoke/Cancel a subscription (admin action)
 */
export async function revokeSubscription(
  input: RevokeSubscriptionInput
): Promise<Subscription> {
  const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, input.subscriptionId)
  const subscriptionSnap = await getDoc(subscriptionRef)
  
  if (!subscriptionSnap.exists()) {
    throw new Error('Subscription not found')
  }
  
  const existingData = subscriptionSnap.data() as SubscriptionFirestore
  const now = new Date()
  
  const updateData: Partial<SubscriptionFirestore> = {
    status: 'cancelled',
    endDate: now.getTime(), // End immediately
    updatedAt: now.getTime(),
  }
  
  await updateDoc(subscriptionRef, updateData)
  
  // Log the admin action
  await logSubscriptionAction({
    subscriptionId: input.subscriptionId,
    action: 'revoke',
    adminId: input.adminId,
    reason: input.reason,
    details: {},
  })
  
  // Update user profile
  await updateUserSubscriptionStatus(existingData.userId, false, null, null)
  
  return toSubscription(input.subscriptionId, { ...existingData, ...updateData })
}

/**
 * Mark subscription as failed (payment failed)
 */
export async function markSubscriptionFailed(
  subscriptionId: string,
  reason?: string
): Promise<void> {
  const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId)
  
  await updateDoc(subscriptionRef, {
    status: 'failed',
    updatedAt: Date.now(),
  })
}

/**
 * Check and expire subscriptions that have passed their end date
 */
export async function expireSubscriptions(): Promise<number> {
  const now = Date.now()
  
  const q = query(
    collection(db, SUBSCRIPTIONS_COLLECTION),
    where('status', '==', 'active'),
    where('endDate', '<', now)
  )
  
  const snapshot = await getDocs(q)
  
  if (snapshot.empty) {
    return 0
  }
  
  const batch = writeBatch(db)
  
  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data() as SubscriptionFirestore
    batch.update(docSnap.ref, {
      status: 'expired',
      updatedAt: now,
    })
  })
  
  await batch.commit()
  
  // Update user profiles
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() as SubscriptionFirestore
    await updateUserSubscriptionStatus(data.userId, false, null, null)
  }
  
  return snapshot.docs.length
}

/**
 * Get subscription statistics (for admin dashboard)
 */
export async function getSubscriptionStats(): Promise<SubscriptionStats> {
  const subscriptions = await getAllSubscriptions()
  
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
 * Update user's subscription status in their profile
 */
async function updateUserSubscriptionStatus(
  userId: string,
  isSubscribed: boolean,
  subscriptionId: string | null,
  subscriptionEndDate: Date | null
): Promise<void> {
  try {
    // Update in userProfiles collection
    const userProfileRef = doc(db, 'userProfiles', userId)
    const userProfileSnap = await getDoc(userProfileRef)
    
    if (userProfileSnap.exists()) {
      await updateDoc(userProfileRef, {
        isSubscribed,
        subscriptionId,
        subscriptionEndDate: subscriptionEndDate?.getTime() || null,
        updatedAt: Date.now(),
      })
    }
    
    // Also update in users collection if it exists
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)
    
    if (userSnap.exists()) {
      await updateDoc(userRef, {
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
 * Log subscription admin actions
 */
async function logSubscriptionAction(log: {
  subscriptionId: string
  action: 'extend' | 'revoke' | 'create' | 'activate' | 'expire'
  adminId: string
  reason?: string
  details: Record<string, any>
}): Promise<void> {
  try {
    const logRef = doc(collection(db, SUBSCRIPTION_LOGS_COLLECTION))
    await setDoc(logRef, {
      ...log,
      createdAt: Date.now(),
    })
  } catch (error) {
    console.error('Error logging subscription action:', error)
    // Don't throw - logging failure shouldn't break main operation
  }
}
