/**
 * Admin API - Extend Subscription
 */

import { NextRequest, NextResponse } from 'next/server'
import { extendSubscription, getSubscription } from '@/lib/subscription-service'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Helper function to send in-app notification
async function sendInAppNotification(
  userId: string, 
  userEmail: string, 
  subscriptionId: string,
  duration: string,
  newEndDate: string
) {
  try {
    const durationText = duration === '1-month' ? '1 month' : '2 months'
    await addDoc(collection(db, 'notifications'), {
      userId,
      userEmail,
      title: 'Subscription Extended! 🎉',
      message: `Great news! Your FahampPesa Pro subscription has been extended by ${durationText}. Your new subscription end date is ${newEndDate}. Enjoy your Pro features!`,
      type: 'subscription',
      category: 'subscription_extended',
      read: false,
      data: {
        subscriptionId,
        action: 'extend',
        duration
      },
      createdAt: serverTimestamp()
    })
    return true
  } catch (error) {
    console.warn('Failed to send in-app notification:', error)
    return false
  }
}

// Helper function to send email notification
async function sendEmailNotification(userEmail: string, duration: string, newEndDate: string) {
  try {
    const BREVO_API_KEY = process.env.BREVO_API_KEY
    
    if (!BREVO_API_KEY || !userEmail) {
      return false
    }

    const durationText = duration === '1-month' ? '1 month' : '2 months'

    const emailResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: 'FahampPesa',
          email: 'noreply@fahampesa.com'
        },
        to: [{ email: userEmail }],
        subject: 'Your FahampPesa Pro Subscription Has Been Extended! 🎉',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #257dc1;">Subscription Extended!</h2>
            <p>Hello,</p>
            <p>Great news! Your FahampPesa Pro subscription has been extended by <strong>${durationText}</strong>.</p>
            <p>Your new subscription end date is: <strong>${newEndDate}</strong></p>
            <p>You continue to have access to all Pro features:</p>
            <ul>
              <li>✅ Debtors Record</li>
              <li>✅ Unlimited Branches</li>
              <li>✅ Advanced Reports (Profit)</li>
              <li>✅ Staff Management & Permissions</li>
              <li>✅ Sync across Mobile, Web, and Desktop</li>
            </ul>
            <p>Thank you for being a valued FahampPesa Pro member!</p>
            <p>Best regards,<br>The FahampPesa Team</p>
          </div>
        `
      })
    })

    return emailResponse.ok
  } catch (error) {
    console.warn('Failed to send email notification:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subscriptionId, duration, adminId, reason } = body
    
    // Validate required fields
    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      )
    }
    
    if (!duration || !['1-month', '2-months'].includes(duration)) {
      return NextResponse.json(
        { error: 'Valid duration is required (1-month or 2-months)' },
        { status: 400 }
      )
    }
    
    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      )
    }
    
    // Check if subscription exists
    const existing = await getSubscription(subscriptionId)
    if (!existing) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }
    
    // Store user info before extending
    const userId = existing.userId
    const userEmail = existing.email
    
    // Extend the subscription (this also handles expired/cancelled subscriptions)
    const updatedSubscription = await extendSubscription({
      subscriptionId,
      duration,
      adminId,
      reason,
    })
    
    // Format the new end date for notifications
    const newEndDateFormatted = updatedSubscription.endDate 
      ? updatedSubscription.endDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : 'N/A'
    
    // Send notifications (don't block the response)
    const notificationPromises: Promise<boolean>[] = []
    
    // Send in-app notification
    if (userId) {
      notificationPromises.push(
        sendInAppNotification(userId, userEmail, subscriptionId, duration, newEndDateFormatted)
      )
    }
    
    // Send email notification
    if (userEmail) {
      notificationPromises.push(
        sendEmailNotification(userEmail, duration, newEndDateFormatted)
      )
    }
    
    // Wait for notifications but don't fail if they fail
    const notificationResults = await Promise.allSettled(notificationPromises)
    const notificationsSent = notificationResults.filter(r => r.status === 'fulfilled' && r.value).length
    
    return NextResponse.json({
      success: true,
      message: `Subscription extended by ${duration.replace('-', ' ')}`,
      subscription: {
        id: updatedSubscription.id,
        email: updatedSubscription.email,
        status: updatedSubscription.status,
        startDate: updatedSubscription.startDate?.toISOString(),
        endDate: updatedSubscription.endDate?.toISOString(),
      },
      notifications: {
        sent: notificationsSent,
        total: notificationPromises.length
      }
    })
  } catch (error) {
    console.error('Error extending subscription:', error)
    return NextResponse.json(
      { error: 'Failed to extend subscription' },
      { status: 500 }
    )
  }
}
