/**
 * Admin API to manually activate a pending subscription
 * This is useful when M-Pesa callback can't reach the server (local development)
 * or for manual payment processing (WhatsApp, bank transfer, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'
import { activateSubscription, getSubscription } from '@/lib/subscription-service'

export async function POST(request: NextRequest) {
  try {
    const { subscriptionId, transactionId } = await request.json()

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      )
    }

    // Get the subscription to verify it exists and is pending
    const subscription = await getSubscription(subscriptionId)
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    if (subscription.status === 'active') {
      return NextResponse.json(
        { error: 'Subscription is already active' },
        { status: 400 }
      )
    }

    if (subscription.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot activate subscription with status: ${subscription.status}` },
        { status: 400 }
      )
    }

    // Generate a transaction ID if not provided
    const txnId = transactionId || `MANUAL-${Date.now()}`

    // Activate the subscription
    const activatedSubscription = await activateSubscription(subscriptionId, txnId)

    return NextResponse.json({
      success: true,
      message: 'Subscription activated successfully',
      subscription: {
        id: activatedSubscription.id,
        userId: activatedSubscription.userId,
        email: activatedSubscription.email,
        status: activatedSubscription.status,
        planType: activatedSubscription.planType,
        startDate: activatedSubscription.startDate?.toISOString(),
        endDate: activatedSubscription.endDate?.toISOString(),
        transactionId: activatedSubscription.transactionId,
      }
    })
  } catch (error) {
    console.error('Error activating subscription:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to activate subscription' },
      { status: 500 }
    )
  }
}
