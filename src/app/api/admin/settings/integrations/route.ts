import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

export interface IntegrationSettings {
  firebase: {
    enabled: boolean
    projectId: string
    status: 'connected' | 'disconnected' | 'error'
  }
  mixpanel: {
    enabled: boolean
    projectToken: string
    status: 'connected' | 'disconnected' | 'error'
  }
  posthog: {
    enabled: boolean
    apiKey: string
    hostUrl: string
    status: 'connected' | 'disconnected' | 'error'
  }
  updatedAt?: any
  updatedBy?: string
}

const DEFAULT_INTEGRATION_SETTINGS: IntegrationSettings = {
  firebase: {
    enabled: true,
    projectId: 'fahampesa-8c514',
    status: 'connected'
  },
  mixpanel: {
    enabled: false,
    projectToken: '',
    status: 'disconnected'
  },
  posthog: {
    enabled: false,
    apiKey: '',
    hostUrl: 'https://app.posthog.com',
    status: 'disconnected'
  }
}

export async function GET(request: NextRequest) {
  try {
    const settingsRef = doc(db, 'platform_settings', 'integrations')
    const settingsSnap = await getDoc(settingsRef)
    
    if (settingsSnap.exists()) {
      const data = settingsSnap.data() as IntegrationSettings
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
        settings: DEFAULT_INTEGRATION_SETTINGS,
        isDefault: true
      })
    }
    
  } catch (error) {
    console.error('Error fetching integration settings:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch integration settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firebase, mixpanel, posthog, updatedBy } = body
    
    // Validate Firebase settings
    if (firebase && firebase.enabled && !firebase.projectId) {
      return NextResponse.json({
        success: false,
        error: 'Firebase project ID is required when Firebase is enabled'
      }, { status: 400 })
    }
    
    // Validate Mixpanel settings
    if (mixpanel && mixpanel.enabled && !mixpanel.projectToken) {
      return NextResponse.json({
        success: false,
        error: 'Mixpanel project token is required when Mixpanel is enabled'
      }, { status: 400 })
    }
    
    // Validate PostHog settings
    if (posthog && posthog.enabled) {
      if (!posthog.apiKey) {
        return NextResponse.json({
          success: false,
          error: 'PostHog API key is required when PostHog is enabled'
        }, { status: 400 })
      }
      
      if (posthog.hostUrl) {
        try {
          new URL(posthog.hostUrl)
        } catch {
          return NextResponse.json({
            success: false,
            error: 'Invalid PostHog host URL format'
          }, { status: 400 })
        }
      }
    }
    
    const settings: IntegrationSettings = {
      firebase: {
        enabled: firebase?.enabled || false,
        projectId: firebase?.projectId || 'fahampesa-8c514',
        status: firebase?.enabled ? 'connected' : 'disconnected'
      },
      mixpanel: {
        enabled: mixpanel?.enabled || false,
        projectToken: mixpanel?.projectToken || '',
        status: mixpanel?.enabled && mixpanel?.projectToken ? 'connected' : 'disconnected'
      },
      posthog: {
        enabled: posthog?.enabled || false,
        apiKey: posthog?.apiKey || '',
        hostUrl: posthog?.hostUrl || 'https://app.posthog.com',
        status: posthog?.enabled && posthog?.apiKey ? 'connected' : 'disconnected'
      },
      updatedAt: serverTimestamp(),
      updatedBy: updatedBy || 'Unknown'
    }
    
    const settingsRef = doc(db, 'platform_settings', 'integrations')
    await setDoc(settingsRef, settings, { merge: true })
    
    return NextResponse.json({
      success: true,
      message: 'Integration settings updated successfully',
      settings: {
        ...settings,
        updatedAt: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('Error updating integration settings:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update integration settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
