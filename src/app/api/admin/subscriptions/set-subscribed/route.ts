import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin-server'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'

// POST /api/admin/subscriptions/set-subscribed - Set a user as subscribed (for testing)
export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Firebase Admin SDK not initialized' },
        { status: 500 }
      )
    }
    
    const body = await request.json()
    const { userId, email, isSubscribed = true } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const now = new Date()
    const endDate = new Date(now)
    endDate.setMonth(endDate.getMonth() + 1) // 1 month subscription

    // Check if user profile exists
    const userRef = adminDb.collection('users').doc(userId)
    const userSnap = await userRef.get()

    if (!userSnap.exists) {
      // Create user document if it doesn't exist
      await userRef.set({
        uid: userId,
        email: email || '',
        fullName: email?.split('@')[0] || 'Test User',
        phoneNumber: '',
        profileImageUrl: '',
        isSubscribed: isSubscribed,
        subscriptionId: isSubscribed ? 'manual-test-subscription' : null,
        subscriptionEndDate: isSubscribed ? Timestamp.fromDate(endDate) : null,
        createdAt: Timestamp.fromDate(now),
        lastUpdated: Timestamp.fromDate(now),
      })
    } else {
      // Update existing user with subscription status
      await userRef.set({
        isSubscribed: isSubscribed,
        subscriptionId: isSubscribed ? 'manual-test-subscription' : null,
        subscriptionEndDate: isSubscribed ? Timestamp.fromDate(endDate) : null,
        lastUpdated: Timestamp.fromDate(now),
      }, { merge: true })
    }

    // Also update/create userProfiles document
    const userProfileRef = adminDb.collection('userProfiles').doc(userId)
    await userProfileRef.set({
      isSubscribed: isSubscribed,
      subscriptionId: isSubscribed ? 'manual-test-subscription' : null,
      subscriptionEndDate: isSubscribed ? Timestamp.fromDate(endDate) : null,
      updatedAt: Timestamp.fromDate(now),
    }, { merge: true })

    return NextResponse.json({
      success: true,
      message: `User ${userId} subscription status set to: ${isSubscribed}`,
      data: {
        userId,
        isSubscribed,
        subscriptionEndDate: isSubscribed ? endDate.toISOString() : null,
      }
    })
  } catch (error) {
    console.error('Error setting subscription status:', error)
    return NextResponse.json(
      { error: 'Failed to set subscription status', details: String(error) },
      { status: 500 }
    )
  }
}
