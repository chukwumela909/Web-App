import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

export interface NotificationSettings {
  emailEnabled: boolean
  pushEnabled: boolean
  slackEnabled: boolean
  webhookUrl: string
  alertThresholds: {
    userDropPercentage: number
    errorRatePercentage: number
    crashRatePercentage: number
  }
  updatedAt?: any
  updatedBy?: string
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  emailEnabled: true,
  pushEnabled: true,
  slackEnabled: false,
  webhookUrl: '',
  alertThresholds: {
    userDropPercentage: 20,
    errorRatePercentage: 5,
    crashRatePercentage: 2
  }
}

export async function GET(request: NextRequest) {
  try {
    const settingsRef = doc(db, 'platform_settings', 'notifications')
    const settingsSnap = await getDoc(settingsRef)
    
    if (settingsSnap.exists()) {
      const data = settingsSnap.data() as NotificationSettings
      return NextResponse.json({
        success: true,
        settings: {
          ...data,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null
        }
      })
    } else {
      return NextResponse.json({
        success: true,
        settings: DEFAULT_NOTIFICATION_SETTINGS,
        isDefault: true
      })
    }
    
  } catch (error) {
    console.error('Error fetching notification settings:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch notification settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      emailEnabled, 
      pushEnabled, 
      slackEnabled, 
      webhookUrl, 
      alertThresholds, 
      updatedBy 
    } = body
    
    // Validate alert thresholds
    if (alertThresholds) {
      const { userDropPercentage, errorRatePercentage, crashRatePercentage } = alertThresholds
      
      if (typeof userDropPercentage !== 'number' || userDropPercentage < 1 || userDropPercentage > 100) {
        return NextResponse.json({
          success: false,
          error: 'User drop percentage must be between 1 and 100'
        }, { status: 400 })
      }
      
      if (typeof errorRatePercentage !== 'number' || errorRatePercentage < 0.1 || errorRatePercentage > 50) {
        return NextResponse.json({
          success: false,
          error: 'Error rate percentage must be between 0.1 and 50'
        }, { status: 400 })
      }
      
      if (typeof crashRatePercentage !== 'number' || crashRatePercentage < 0.1 || crashRatePercentage > 20) {
        return NextResponse.json({
          success: false,
          error: 'Crash rate percentage must be between 0.1 and 20'
        }, { status: 400 })
      }
    }
    
    // Validate webhook URL if Slack is enabled
    if (slackEnabled && webhookUrl) {
      try {
        new URL(webhookUrl)
      } catch {
        return NextResponse.json({
          success: false,
          error: 'Invalid webhook URL format'
        }, { status: 400 })
      }
    }
    
    const settings: NotificationSettings = {
      emailEnabled: Boolean(emailEnabled),
      pushEnabled: Boolean(pushEnabled),
      slackEnabled: Boolean(slackEnabled),
      webhookUrl: webhookUrl || '',
      alertThresholds: alertThresholds || DEFAULT_NOTIFICATION_SETTINGS.alertThresholds,
      updatedAt: serverTimestamp(),
      updatedBy: updatedBy || 'Unknown'
    }
    
    const settingsRef = doc(db, 'platform_settings', 'notifications')
    await setDoc(settingsRef, settings, { merge: true })
    
    return NextResponse.json({
      success: true,
      message: 'Notification settings updated successfully',
      settings: {
        ...settings,
        updatedAt: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('Error updating notification settings:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update notification settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
