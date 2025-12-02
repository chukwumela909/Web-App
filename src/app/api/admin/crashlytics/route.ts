import { NextRequest, NextResponse } from 'next/server'
import { adminApp } from '@/lib/firebase-admin-server'

const FIREBASE_PROJECT_ID = 'fahampesa-8c514'

// Firebase Crashlytics REST API interfaces
interface CrashlyticsIssue {
  name: string
  issueTitle: string
  subtitle: string
  state: 'OPEN' | 'CLOSED'
  errorEvents: string
  impactedUsers: string
  firstSeenTime: string
  lastSeenTime: string
  issueId: string
  platform: string
  type: 'CRASH' | 'NON_FATAL' | 'ANR'
}

interface CrashlyticsIssuesResponse {
  issues: CrashlyticsIssue[]
  nextPageToken?: string
}

// Get Firebase access token using Admin SDK
async function getAccessToken(): Promise<string> {
  if (!adminApp) {
    throw new Error('Firebase Admin SDK not initialized')
  }

  const { credential } = adminApp.options
  if (!credential) {
    throw new Error('Firebase Admin SDK credential not available')
  }

  try {
    // Get access token from the credential
    const accessToken = await credential.getAccessToken()
    return accessToken.access_token
  } catch (error) {
    console.error('Error getting access token:', error)
    throw new Error('Failed to get Firebase access token')
  }
}

// Fetch Crashlytics issues from Firebase REST API
async function fetchCrashlyticsIssues(accessToken: string, pageSize = 50): Promise<CrashlyticsIssuesResponse> {
  const url = `https://crashlytics.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/apps/-/issues?pageSize=${pageSize}&orderBy=eventCount desc`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Crashlytics API error:', response.status, errorText)
    throw new Error(`Failed to fetch Crashlytics data: ${response.status} ${response.statusText}`)
  }

  return await response.json()
}

// Transform Crashlytics API data to our interface
function transformCrashlyticsData(issues: CrashlyticsIssue[]) {
  return issues.map((issue, index) => ({
    id: issue.issueId || `crash-${index + 1}`,
    title: issue.issueTitle || issue.subtitle || 'Unknown Crash',
    type: issue.type?.toLowerCase() || 'crash',
    platform: issue.platform?.toLowerCase() || 'android',
    eventCount: parseInt(issue.errorEvents) || 0,
    userCount: parseInt(issue.impactedUsers) || 0,
    firstSeen: issue.firstSeenTime ? new Date(issue.firstSeenTime) : new Date(),
    lastSeen: issue.lastSeenTime ? new Date(issue.lastSeenTime) : new Date(),
    status: issue.state === 'OPEN' ? 'open' : 'closed',
    severity: determineSeverity(issue.issueTitle, parseInt(issue.errorEvents)),
    impactedUsers: parseInt(issue.impactedUsers) || 0,
    stackTrace: issue.subtitle || '',
    appVersion: 'Unknown', // API doesn't provide this directly
    device: 'Unknown' // API doesn't provide this directly
  }))
}

function determineSeverity(title: string, eventCount: number): 'critical' | 'high' | 'medium' | 'low' {
  const lowerTitle = title?.toLowerCase() || ''
  
  // Critical if it affects many users or is a severe crash type
  if (eventCount > 100 || 
      lowerTitle.includes('nullpointerexception') || 
      lowerTitle.includes('segmentation fault') ||
      lowerTitle.includes('fatal')) {
    return 'critical'
  }
  
  // High for crashes and ANRs
  if (eventCount > 10 || 
      lowerTitle.includes('crash') ||
      lowerTitle.includes('anr') ||
      lowerTitle.includes('exception')) {
    return 'high'
  }
  
  // Medium for moderate issues
  if (eventCount > 1) {
    return 'medium'
  }
  
  return 'low'
}

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching real Crashlytics data from Firebase...')

    // Check if Firebase Admin SDK is available
    if (!adminApp) {
      console.warn('Firebase Admin SDK not available, falling back to mock data')
      return NextResponse.json({
        success: false,
        error: 'Firebase Admin SDK not initialized',
        issues: [],
        analytics: {
          totalCrashes: 0,
          crashFreeUsers: 100,
          crashRate: 0,
          openIssues: 0,
          criticalIssues: 0,
          affectedUsers: 0,
          totalEvents: 0,
          trends: {
            daily: [0, 0, 0, 0, 0, 0, 0],
            weekly: [0, 0, 0, 0, 0, 0, 0]
          }
        }
      })
    }

    // Get access token and fetch Crashlytics data
    const accessToken = await getAccessToken()
    const crashlyticsData = await fetchCrashlyticsIssues(accessToken)
    
    // Transform the data
    const transformedIssues = transformCrashlyticsData(crashlyticsData.issues || [])
    
    // Calculate analytics
    const openIssues = transformedIssues.filter(i => i.status === 'open').length
    const criticalIssues = transformedIssues.filter(i => i.severity === 'critical').length
    const totalEvents = transformedIssues.reduce((sum, issue) => sum + issue.eventCount, 0)
    const affectedUsers = transformedIssues.reduce((sum, issue) => sum + issue.userCount, 0)
    
    // Estimate total users (since we don't have this from API)
    const estimatedTotalUsers = Math.max(affectedUsers * 10, 100)
    const crashFreeUsers = Math.max(0, ((estimatedTotalUsers - affectedUsers) / estimatedTotalUsers) * 100)

    // Calculate trends (simplified - would need historical data for real trends)
    const trends = {
      daily: [0, 0, 0, 0, 0, 0, totalEvents], // Recent activity in last slot
      weekly: [0, 0, 0, 0, 0, 0, totalEvents] // Recent activity in last slot
    }

    const analytics = {
      totalCrashes: transformedIssues.length,
      crashFreeUsers: Math.round(crashFreeUsers * 10) / 10,
      crashRate: Math.round((affectedUsers / estimatedTotalUsers) * 100 * 10) / 10,
      openIssues,
      criticalIssues,
      affectedUsers,
      totalEvents,
      trends
    }

    console.log(`Successfully fetched ${transformedIssues.length} real Crashlytics issues`)
    
    return NextResponse.json({
      success: true,
      issues: transformedIssues,
      analytics,
      source: 'Firebase Crashlytics API',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching Crashlytics data:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      issues: [],
      analytics: {
        totalCrashes: 0,
        crashFreeUsers: 100,
        crashRate: 0,
        openIssues: 0,
        criticalIssues: 0,
        affectedUsers: 0,
        totalEvents: 0,
        trends: {
          daily: [0, 0, 0, 0, 0, 0, 0],
          weekly: [0, 0, 0, 0, 0, 0, 0]
        }
      }
    }, { status: 500 })
  }
}
