import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  doc,
  getDoc
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface CrashReport {
  id: string
  userId: string
  userEmail: string
  errorMessage: string
  stackTrace: string
  userAgent: string
  url: string
  timestamp: Date
  resolved: boolean
  appVersion?: string
  platform?: 'android' | 'ios' | 'web'
  deviceInfo?: string
  severity?: 'critical' | 'high' | 'medium' | 'low'
}

export interface CrashIssue {
  id: string
  title: string
  type: 'crash' | 'non_fatal' | 'anr'
  platform: 'android' | 'ios' | 'web'
  eventCount: number
  userCount: number
  firstSeen: Date
  lastSeen: Date
  status: 'open' | 'closed' | 'resolved'
  severity: 'critical' | 'high' | 'medium' | 'low'
  stackTrace?: string
  appVersion?: string
  osVersion?: string
  device?: string
  impactedUsers: number
  notes?: string
}

export interface CrashAnalytics {
  totalCrashes: number
  crashFreeUsers: number
  crashRate: number
  openIssues: number
  criticalIssues: number
  affectedUsers: number
  totalEvents: number
  trends: {
    daily: number[]
    weekly: number[]
  }
}

class FirebaseCrashlyticsService {
  private static instance: FirebaseCrashlyticsService

  static getInstance(): FirebaseCrashlyticsService {
    if (!FirebaseCrashlyticsService.instance) {
      FirebaseCrashlyticsService.instance = new FirebaseCrashlyticsService()
    }
    return FirebaseCrashlyticsService.instance
  }

  // Get real crash data from Firebase Crashlytics API
  async getRealCrashlyticsData(): Promise<{ issues: CrashIssue[], analytics: CrashAnalytics }> {
    try {
      console.log('Fetching real Crashlytics data from API...')
      const response = await fetch('/api/admin/crashlytics')
      const data = await response.json()
      
      if (!data.success) {
        console.warn('Crashlytics API returned error:', data.error)
        return {
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
        }
      }
      
      console.log(`Received ${data.issues?.length || 0} real crash issues from Firebase Crashlytics`)
      
      return {
        issues: data.issues || [],
        analytics: data.analytics || {
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
      }
    } catch (error) {
      console.error('Error fetching real Crashlytics data:', error)
      return {
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
      }
    }
  }

  // Get all crash reports from Firebase (kept for backward compatibility)
  async getCrashReports(limitCount = 100): Promise<CrashReport[]> {
    try {
      const crashReportsRef = collection(db, 'crash_reports')
      const crashQuery = query(
        crashReportsRef, 
        orderBy('timestamp', 'desc'), 
        limit(limitCount)
      )
      const snapshot = await getDocs(crashQuery)
      
      return snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          userId: data.userId || '',
          userEmail: data.userEmail || '',
          errorMessage: data.errorMessage || '',
          stackTrace: data.stackTrace || '',
          userAgent: data.userAgent || '',
          url: data.url || '',
          timestamp: data.timestamp?.toDate() || new Date(),
          resolved: data.resolved || false,
          appVersion: data.appVersion,
          platform: this.detectPlatform(data.userAgent || ''),
          deviceInfo: data.deviceInfo || data.userAgent,
          severity: this.determineSeverity(data.errorMessage || '')
        } as CrashReport
      })
    } catch (error) {
      console.error('Error fetching crash reports:', error)
      return []
    }
  }

  // Get crash issues from real Firebase Crashlytics
  async getCrashIssues(): Promise<CrashIssue[]> {
    try {
      const { issues } = await this.getRealCrashlyticsData()
      return issues
    } catch (error) {
      console.error('Error getting crash issues:', error)
      return []
    }
  }

  // Get crash analytics from real Firebase Crashlytics
  async getCrashAnalytics(): Promise<CrashAnalytics> {
    try {
      const { analytics } = await this.getRealCrashlyticsData()
      return analytics
    } catch (error) {
      console.error('Error getting crash analytics:', error)
      return {
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
    }
  }

  // Get recent crash reports (last 24 hours)
  async getRecentCrashes(): Promise<CrashReport[]> {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const crashReportsRef = collection(db, 'crash_reports')
      const recentQuery = query(
        crashReportsRef,
        where('timestamp', '>=', Timestamp.fromDate(oneDayAgo)),
        orderBy('timestamp', 'desc')
      )
      const snapshot = await getDocs(recentQuery)
      
      return snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          userId: data.userId || '',
          userEmail: data.userEmail || '',
          errorMessage: data.errorMessage || '',
          stackTrace: data.stackTrace || '',
          userAgent: data.userAgent || '',
          url: data.url || '',
          timestamp: data.timestamp?.toDate() || new Date(),
          resolved: data.resolved || false,
          platform: this.detectPlatform(data.userAgent || ''),
          severity: this.determineSeverity(data.errorMessage || '')
        } as CrashReport
      })
    } catch (error) {
      console.error('Error fetching recent crashes:', error)
      return []
    }
  }

  // Calculate trends data from crash reports
  private calculateTrends(crashReports: CrashReport[]): { daily: number[], weekly: number[] } {
    const now = new Date()
    const daily: number[] = []
    const weekly: number[] = []

    // Calculate daily trends (last 7 days)
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
      const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1)
      
      const dayCount = crashReports.filter(crash => 
        crash.timestamp >= dayStart && crash.timestamp < dayEnd
      ).length
      
      daily.push(dayCount)
    }

    // Calculate weekly trends (last 7 weeks)
    for (let i = 6; i >= 0; i--) {
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 7))
      const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((i - 1) * 7))
      
      const weekCount = crashReports.filter(crash => 
        crash.timestamp >= weekStart && crash.timestamp < weekEnd
      ).length
      
      weekly.push(weekCount)
    }

    return { daily, weekly }
  }

  // Helper methods
  private detectPlatform(userAgent: string): 'android' | 'ios' | 'web' {
    if (userAgent.toLowerCase().includes('android')) return 'android'
    if (userAgent.toLowerCase().includes('iphone') || userAgent.toLowerCase().includes('ipad')) return 'ios'
    return 'web'
  }

  private determineSeverity(errorMessage: string): 'critical' | 'high' | 'medium' | 'low' {
    const message = errorMessage.toLowerCase()
    
    if (message.includes('nullpointerexception') || 
        message.includes('segmentation fault') ||
        message.includes('crash') ||
        message.includes('fatal')) {
      return 'critical'
    }
    
    if (message.includes('error') || 
        message.includes('exception') ||
        message.includes('failed')) {
      return 'high'
    }
    
    if (message.includes('warning') || 
        message.includes('deprecated')) {
      return 'medium'
    }
    
    return 'low'
  }

  private simplifyErrorMessage(errorMessage: string): string {
    // Remove specific details like line numbers, timestamps, etc. to group similar errors
    return errorMessage
      .replace(/:\d+/g, '') // Remove line numbers
      .replace(/\d{4}-\d{2}-\d{2}/g, '') // Remove dates
      .replace(/\d{2}:\d{2}:\d{2}/g, '') // Remove timestamps
      .replace(/[a-f0-9]{8,}/gi, '') // Remove long hex strings
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 100) // Limit length
  }

  private createIssueTitle(errorMessage: string, platform?: string): string {
    // Extract the main error type for a cleaner title
    const platformPrefix = platform ? `[${platform.toUpperCase()}] ` : ''
    
    if (errorMessage.includes('NullPointerException')) {
      return `${platformPrefix}NullPointerException in Application`
    }
    if (errorMessage.includes('NetworkOnMainThreadException')) {
      return `${platformPrefix}NetworkOnMainThreadException`
    }
    if (errorMessage.includes('IndexOutOfBoundsException')) {
      return `${platformPrefix}IndexOutOfBoundsException`
    }
    if (errorMessage.includes('SQLException')) {
      return `${platformPrefix}Database Error (SQLException)`
    }
    if (errorMessage.includes('ANR')) {
      return `${platformPrefix}Application Not Responding (ANR)`
    }
    
    // Fallback: use first 50 characters of error message
    return `${platformPrefix}${errorMessage.substring(0, 50)}${errorMessage.length > 50 ? '...' : ''}`
  }

  private determineIssueType(errorMessage: string): 'crash' | 'non_fatal' | 'anr' {
    const message = errorMessage.toLowerCase()
    
    if (message.includes('anr') || message.includes('not responding')) {
      return 'anr'
    }
    
    if (message.includes('warning') || 
        message.includes('deprecated') ||
        message.includes('non-fatal')) {
      return 'non_fatal'
    }
    
    return 'crash'
  }

  private getMaxSeverity(severities: string[]): 'critical' | 'high' | 'medium' | 'low' {
    if (severities.includes('critical')) return 'critical'
    if (severities.includes('high')) return 'high'
    if (severities.includes('medium')) return 'medium'
    return 'low'
  }
}

export default FirebaseCrashlyticsService.getInstance()
