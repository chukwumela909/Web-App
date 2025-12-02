/**
 * Subscription Types for Fahampesa
 * Defines the structure for subscription tracking in Firestore
 */

export type SubscriptionStatus = 'active' | 'expired' | 'failed' | 'pending' | 'cancelled'
export type PlanType = 'monthly' | 'yearly'
export type Currency = 'KSH' | 'USD'

export interface Subscription {
  id: string
  userId: string
  email: string
  planType: PlanType
  planName: string
  status: SubscriptionStatus
  amount: number
  currency: Currency
  startDate: Date | null
  endDate: Date | null
  transactionId: string | null
  checkoutRequestId: string | null
  phoneNumber: string
  createdAt: Date
  updatedAt: Date
}

export interface SubscriptionFirestore {
  userId: string
  email: string
  planType: PlanType
  planName: string
  status: SubscriptionStatus
  amount: number
  currency: Currency
  startDate: number | null // Timestamp
  endDate: number | null // Timestamp
  transactionId: string | null
  checkoutRequestId: string | null
  phoneNumber: string
  createdAt: number // Timestamp
  updatedAt: number // Timestamp
}

export interface CreateSubscriptionInput {
  userId: string
  email: string
  planType: PlanType
  amount: number
  currency: Currency
  phoneNumber: string
  checkoutRequestId?: string
}

export interface UpdateSubscriptionInput {
  status?: SubscriptionStatus
  transactionId?: string
  startDate?: Date
  endDate?: Date
}

export interface ExtendSubscriptionInput {
  subscriptionId: string
  duration: '1-month' | '2-months'
  adminId: string
  reason?: string
}

export interface RevokeSubscriptionInput {
  subscriptionId: string
  adminId: string
  reason?: string
}

export interface SubscriptionStats {
  totalRevenue: number
  totalRevenueKSH: number
  totalRevenueUSD: number
  activeSubscriptions: number
  expiredSubscriptions: number
  pendingSubscriptions: number
}

export interface SubscriptionFilter {
  status?: SubscriptionStatus | 'all'
  currency?: Currency | 'all'
  email?: string
  startDateFrom?: Date
  startDateTo?: Date
}

// M-Pesa Callback Types
export interface MpesaCallbackBody {
  Body: {
    stkCallback: {
      MerchantRequestID: string
      CheckoutRequestID: string
      ResultCode: number
      ResultDesc: string
      CallbackMetadata?: {
        Item: Array<{
          Name: string
          Value: string | number
        }>
      }
    }
  }
}

export interface MpesaCallbackMetadata {
  amount: number
  mpesaReceiptNumber: string
  transactionDate: string
  phoneNumber: string
}

// Plan pricing configuration
export const PLAN_PRICING = {
  monthly: {
    KSH: 2000,
    USD: 10,
  },
  yearly: {
    KSH: 20000,
    USD: 100,
  },
} as const

// Plan duration in days
export const PLAN_DURATION = {
  monthly: 30,
  yearly: 365,
  '1-month': 30,
  '2-months': 60,
} as const

export function getPlanName(planType: PlanType): string {
  return planType === 'yearly' ? '1 year Pro Plan' : '1 month Pro Plan'
}

export function calculateEndDate(startDate: Date, planType: PlanType): Date {
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + PLAN_DURATION[planType])
  return endDate
}

export function isSubscriptionActive(subscription: Subscription): boolean {
  if (subscription.status !== 'active') return false
  if (!subscription.endDate) return false
  return new Date() < subscription.endDate
}
