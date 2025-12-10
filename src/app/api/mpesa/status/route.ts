/**
 * M-Pesa Subscription Status API
 * Returns the current status of a subscription for polling after STK push
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSubscription } from '@/lib/subscription-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get('subscriptionId')

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'subscriptionId is required' },
        { status: 400 }
      )
    }

    const subscription = await getSubscription(subscriptionId)

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Return relevant status information
    return NextResponse.json({
      status: subscription.status,
      transactionId: subscription.transactionId,
      planType: subscription.planType,
      planName: subscription.planName,
    })
  } catch (error) {
    console.error('Error fetching subscription status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    )
  }
}
