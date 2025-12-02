/**
 * Admin Subscriptions API - List all subscriptions
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAllSubscriptions, getSubscriptionStats } from '@/lib/subscription-service'
import { SubscriptionStatus, Currency } from '@/lib/subscription-types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse filter parameters
    const status = searchParams.get('status') as SubscriptionStatus | 'all' | null
    const currency = searchParams.get('currency') as Currency | 'all' | null
    const email = searchParams.get('email')
    const includeStats = searchParams.get('includeStats') === 'true'
    
    // Build filter
    const filter: {
      status?: SubscriptionStatus | 'all'
      currency?: Currency | 'all'
      email?: string
    } = {}
    
    if (status) filter.status = status
    if (currency) filter.currency = currency
    if (email) filter.email = email
    
    // Fetch subscriptions
    const subscriptions = await getAllSubscriptions(filter)
    
    // Format for response
    const formattedSubscriptions = subscriptions.map((sub) => ({
      id: sub.id,
      email: sub.email,
      planName: sub.planName,
      planType: sub.planType,
      amount: sub.amount,
      currency: sub.currency,
      status: sub.status,
      startDate: sub.startDate?.toISOString() || null,
      endDate: sub.endDate?.toISOString() || null,
      transactionId: sub.transactionId,
      phoneNumber: sub.phoneNumber,
      createdAt: sub.createdAt.toISOString(),
    }))
    
    const response: {
      subscriptions: typeof formattedSubscriptions
      total: number
      stats?: Awaited<ReturnType<typeof getSubscriptionStats>>
    } = {
      subscriptions: formattedSubscriptions,
      total: formattedSubscriptions.length,
    }
    
    // Include stats if requested
    if (includeStats) {
      response.stats = await getSubscriptionStats()
    }
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    )
  }
}
