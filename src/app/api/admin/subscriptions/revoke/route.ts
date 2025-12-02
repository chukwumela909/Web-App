/**
 * Admin API - Revoke/Cancel Subscription
 */

import { NextRequest, NextResponse } from 'next/server'
import { revokeSubscription, getSubscription } from '@/lib/subscription-service'
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Helper function to send in-app notification
async function sendInAppNotification(userId: string, userEmail: string, subscriptionId: string) {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      userEmail,
      title: 'Subscription Cancelled',
      message: 'Your FahampPesa Pro subscription has been cancelled. You will no longer have access to Pro features. Contact support if you have any questions.',
      type: 'subscription',
      category: 'subscription_cancelled',
      read: false,
      data: {
        subscriptionId,
        action: 'revoke'
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
async function sendEmailNotification(userEmail: string) {
  try {
    const BREVO_API_KEY = process.env.BREVO_API_KEY
    
    if (!BREVO_API_KEY || !userEmail) {
      return false
    }

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
        subject: 'Your FahampPesa Pro Subscription Has Been Cancelled',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f04438;">Subscription Cancelled</h2>
            <p>Hello,</p>
            <p>Your FahampPesa Pro subscription has been cancelled.</p>
            <p>You will no longer have access to the following Pro features:</p>
            <ul>
              <li>Debtors Record</li>
              <li>Unlimited Branches</li>
              <li>Advanced Reports (Profit)</li>
              <li>Staff Management & Permissions</li>
              <li>Sync across Mobile, Web, and Desktop</li>
            </ul>
            <p>If you believe this was done in error or have any questions, please contact our support team.</p>
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
    const { subscriptionId, adminId, reason } = body
    
    // Validate required fields
    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
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
    
    // Check if already cancelled/expired
    if (existing.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Subscription is already cancelled' },
        { status: 400 }
      )
    }
    
    // Store user info before revoking
    const userId = existing.userId
    const userEmail = existing.email
    
    // Revoke the subscription
    const updatedSubscription = await revokeSubscription({
      subscriptionId,
      adminId,
      reason,
    })
    
    // Send notifications (don't block the response)
    const notificationPromises: Promise<boolean>[] = []
    
    // Send in-app notification
    if (userId) {
      notificationPromises.push(sendInAppNotification(userId, userEmail, subscriptionId))
    }
    
    // Send email notification
    if (userEmail) {
      notificationPromises.push(sendEmailNotification(userEmail))
    }
    
    // Wait for notifications but don't fail if they fail
    const notificationResults = await Promise.allSettled(notificationPromises)
    const notificationsSent = notificationResults.filter(r => r.status === 'fulfilled' && r.value).length
    
    return NextResponse.json({
      success: true,
      message: 'Subscription has been cancelled',
      subscription: {
        id: updatedSubscription.id,
        email: updatedSubscription.email,
        status: updatedSubscription.status,
        endDate: updatedSubscription.endDate?.toISOString(),
      },
      notifications: {
        sent: notificationsSent,
        total: notificationPromises.length
      }
    })
  } catch (error) {
    console.error('Error revoking subscription:', error)
    return NextResponse.json(
      { error: 'Failed to revoke subscription' },
      { status: 500 }
    )
  }
}
