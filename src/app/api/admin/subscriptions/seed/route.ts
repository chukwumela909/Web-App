import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, addDoc, Timestamp } from 'firebase/firestore'

// POST /api/admin/subscriptions/seed - Create test subscriptions
export async function POST() {
  try {
    const now = new Date()
    const oneMonthLater = new Date(now)
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1)
    
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const subscriptionsRef = collection(db, 'subscriptions')
    const createdIds: string[] = []
    
    // Test subscription 1: Active KSH Monthly
    const sub1 = await addDoc(subscriptionsRef, {
      userId: 'test-user-001',
      email: 'active.user@example.com',
      phoneNumber: '+254712345678',
      planType: 'monthly',
      planName: '1 Month Pro Plan',
      amount: 2000,
      currency: 'KSH',
      status: 'active',
      startDate: Timestamp.fromDate(now),
      endDate: Timestamp.fromDate(oneMonthLater),
      transactionId: 'TEST-TXN-001',
      checkoutRequestId: 'TEST-CHECKOUT-001',
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    })
    createdIds.push(sub1.id)
    
    // Test subscription 2: Expired KSH Monthly
    const sub2 = await addDoc(subscriptionsRef, {
      userId: 'test-user-002',
      email: 'expired.user@example.com',
      phoneNumber: '+254722345678',
      planType: 'monthly',
      planName: '1 Month Pro Plan',
      amount: 2000,
      currency: 'KSH',
      status: 'expired',
      startDate: Timestamp.fromDate(new Date(now.getTime() - 32 * 86400000)), // 32 days ago
      endDate: Timestamp.fromDate(yesterday),
      transactionId: 'TEST-TXN-002',
      checkoutRequestId: 'TEST-CHECKOUT-002',
      createdAt: Timestamp.fromDate(new Date(now.getTime() - 32 * 86400000)),
      updatedAt: Timestamp.fromDate(now)
    })
    createdIds.push(sub2.id)
    
    // Test subscription 3: Active USD Monthly
    const sub3 = await addDoc(subscriptionsRef, {
      userId: 'test-user-003',
      email: 'international@example.com',
      phoneNumber: '+1234567890',
      planType: 'monthly',
      planName: '1 Month Pro Plan',
      amount: 10,
      currency: 'USD',
      status: 'active',
      startDate: Timestamp.fromDate(now),
      endDate: Timestamp.fromDate(oneMonthLater),
      transactionId: 'TEST-TXN-003',
      checkoutRequestId: 'TEST-CHECKOUT-003',
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    })
    createdIds.push(sub3.id)
    
    // Test subscription 4: Pending KSH
    const sub4 = await addDoc(subscriptionsRef, {
      userId: 'test-user-004',
      email: 'pending.user@example.com',
      phoneNumber: '+254732345678',
      planType: 'monthly',
      planName: '1 Month Pro Plan',
      amount: 2000,
      currency: 'KSH',
      status: 'pending',
      startDate: null,
      endDate: null,
      transactionId: null,
      checkoutRequestId: 'TEST-CHECKOUT-004',
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    })
    createdIds.push(sub4.id)
    
    // Test subscription 5: Active KSH Yearly
    const oneYearLater = new Date(now)
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1)
    
    const sub5 = await addDoc(subscriptionsRef, {
      userId: 'test-user-005',
      email: 'yearly.user@example.com',
      phoneNumber: '+254742345678',
      planType: 'yearly',
      planName: '1 Year Pro Plan',
      amount: 20000,
      currency: 'KSH',
      status: 'active',
      startDate: Timestamp.fromDate(now),
      endDate: Timestamp.fromDate(oneYearLater),
      transactionId: 'TEST-TXN-005',
      checkoutRequestId: 'TEST-CHECKOUT-005',
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    })
    createdIds.push(sub5.id)
    
    // Test subscription 6: Failed
    const sub6 = await addDoc(subscriptionsRef, {
      userId: 'test-user-006',
      email: 'failed.user@example.com',
      phoneNumber: '+254752345678',
      planType: 'monthly',
      planName: '1 Month Pro Plan',
      amount: 2000,
      currency: 'KSH',
      status: 'failed',
      startDate: null,
      endDate: null,
      transactionId: null,
      checkoutRequestId: 'TEST-CHECKOUT-006',
      failureReason: 'Insufficient funds',
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    })
    createdIds.push(sub6.id)
    
    return NextResponse.json({
      success: true,
      message: 'Test subscriptions created successfully',
      createdIds,
      count: createdIds.length
    })
  } catch (error) {
    console.error('Error creating test subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to create test subscriptions', details: String(error) },
      { status: 500 }
    )
  }
}
