import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  onSnapshot,
  doc,
  updateDoc
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface AlertEvent {
  id: string
  type: 'failed_login' | 'role_change' | 'crash_rate' | 'security_breach' | 'system_error'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  userId?: string
  userEmail?: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
  timestamp: Date
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: Date
  resolved: boolean
  resolvedBy?: string
  resolvedAt?: Date
}

export interface AlertRule {
  id: string
  type: string
  name: string
  description: string
  enabled: boolean
  threshold: number
  timeWindow: number // in minutes
  severity: 'low' | 'medium' | 'high' | 'critical'
  conditions: Record<string, any>
  actions: string[] // email, sms, webhook, etc.
  createdAt: Date
  updatedAt: Date
}

export interface AlertStats {
  total: number
  unacknowledged: number
  critical: number
  high: number
  medium: number
  low: number
  last24Hours: number
  thisWeek: number
}

class RealtimeAlertsService {
  private static instance: RealtimeAlertsService
  private listeners: (() => void)[] = []
  private alertCallbacks: ((alert: AlertEvent) => void)[] = []

  static getInstance(): RealtimeAlertsService {
    if (!RealtimeAlertsService.instance) {
      RealtimeAlertsService.instance = new RealtimeAlertsService()
    }
    return RealtimeAlertsService.instance
  }

  // Subscribe to real-time alerts
  subscribeToAlerts(callback: (alert: AlertEvent) => void): () => void {
    this.alertCallbacks.push(callback)
    
    // Set up real-time listener for new alerts
    const alertsRef = collection(db, 'security_alerts')
    const alertsQuery = query(
      alertsRef,
      where('acknowledged', '==', false),
      orderBy('timestamp', 'desc'),
      limit(50)
    )

    const unsubscribe = onSnapshot(alertsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const alertData = change.doc.data()
          const alert: AlertEvent = {
            id: change.doc.id,
            type: alertData.type,
            severity: alertData.severity,
            title: alertData.title,
            description: alertData.description,
            userId: alertData.userId,
            userEmail: alertData.userEmail,
            ipAddress: alertData.ipAddress,
            userAgent: alertData.userAgent,
            metadata: alertData.metadata,
            timestamp: alertData.timestamp?.toDate() || new Date(),
            acknowledged: alertData.acknowledged || false,
            acknowledgedBy: alertData.acknowledgedBy,
            acknowledgedAt: alertData.acknowledgedAt?.toDate(),
            resolved: alertData.resolved || false,
            resolvedBy: alertData.resolvedBy,
            resolvedAt: alertData.resolvedAt?.toDate()
          }
          
          // Notify all callbacks
          this.alertCallbacks.forEach(cb => cb(alert))
        }
      })
    })

    this.listeners.push(unsubscribe)
    
    return () => {
      const index = this.alertCallbacks.indexOf(callback)
      if (index > -1) {
        this.alertCallbacks.splice(index, 1)
      }
      unsubscribe()
    }
  }

  // Log a failed login attempt
  async logFailedLogin(email: string, ipAddress: string, userAgent: string): Promise<void> {
    try {
      // Check for multiple failed attempts in the last 10 minutes
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
      const failedLoginsRef = collection(db, 'failed_logins')
      const recentFailuresQuery = query(
        failedLoginsRef,
        where('email', '==', email),
        where('timestamp', '>=', Timestamp.fromDate(tenMinutesAgo))
      )
      
      const recentFailures = await getDocs(recentFailuresQuery)
      const failureCount = recentFailures.size + 1 // +1 for current attempt

      // Log the failed attempt
      await addDoc(failedLoginsRef, {
        email,
        ipAddress,
        userAgent,
        timestamp: Timestamp.now(),
        resolved: false
      })

      // Trigger alert if threshold exceeded
      if (failureCount >= 5) {
        await this.createAlert({
          type: 'failed_login',
          severity: 'high',
          title: 'Multiple Failed Login Attempts',
          description: `${failureCount} failed login attempts for ${email} in the last 10 minutes`,
          userEmail: email,
          ipAddress,
          userAgent,
          metadata: {
            attemptCount: failureCount,
            timeWindow: '10 minutes'
          }
        })
      }
    } catch (error) {
      console.error('Error logging failed login:', error)
    }
  }

  // Log a role change
  async logRoleChange(
    targetUserId: string, 
    targetUserEmail: string, 
    oldRole: string, 
    newRole: string, 
    changedBy: string,
    changedByEmail: string
  ): Promise<void> {
    try {
      // Log the role change
      await addDoc(collection(db, 'role_changes'), {
        targetUserId,
        targetUserEmail,
        oldRole,
        newRole,
        changedBy,
        changedByEmail,
        timestamp: Timestamp.now()
      })

      // Always create an alert for role changes (security sensitive)
      const severity = this.getRoleChangeSeverity(oldRole, newRole)
      await this.createAlert({
        type: 'role_change',
        severity,
        title: 'User Role Changed',
        description: `User ${targetUserEmail} role changed from ${oldRole} to ${newRole} by ${changedByEmail}`,
        userId: targetUserId,
        userEmail: targetUserEmail,
        metadata: {
          oldRole,
          newRole,
          changedBy,
          changedByEmail
        }
      })
    } catch (error) {
      console.error('Error logging role change:', error)
    }
  }

  // Monitor crash rate
  async checkCrashRate(): Promise<void> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const crashesRef = collection(db, 'crash_reports')
      const recentCrashesQuery = query(
        crashesRef,
        where('timestamp', '>=', Timestamp.fromDate(oneHourAgo))
      )
      
      const recentCrashes = await getDocs(recentCrashesQuery)
      const crashCount = recentCrashes.size

      // Get total active users in the same period
      const activeUsersRef = collection(db, 'user_sessions')
      const activeUsersQuery = query(
        activeUsersRef,
        where('lastActivity', '>=', Timestamp.fromDate(oneHourAgo))
      )
      
      const activeSessions = await getDocs(activeUsersQuery)
      const activeUserCount = activeSessions.size

      // Calculate crash rate (crashes per 100 active users)
      const crashRate = activeUserCount > 0 ? (crashCount / activeUserCount) * 100 : 0

      // Alert if crash rate exceeds threshold (e.g., 5%)
      if (crashRate > 5) {
        await this.createAlert({
          type: 'crash_rate',
          severity: crashRate > 15 ? 'critical' : crashRate > 10 ? 'high' : 'medium',
          title: 'High Crash Rate Detected',
          description: `Crash rate is ${crashRate.toFixed(2)}% (${crashCount} crashes among ${activeUserCount} active users in the last hour)`,
          metadata: {
            crashCount,
            activeUserCount,
            crashRate: crashRate.toFixed(2),
            timeWindow: '1 hour'
          }
        })
      }
    } catch (error) {
      console.error('Error checking crash rate:', error)
    }
  }

  // Log a crash report
  async logCrash(
    userId: string,
    userEmail: string,
    errorMessage: string,
    stackTrace: string,
    userAgent: string,
    url: string
  ): Promise<void> {
    try {
      await addDoc(collection(db, 'crash_reports'), {
        userId,
        userEmail,
        errorMessage,
        stackTrace,
        userAgent,
        url,
        timestamp: Timestamp.now(),
        resolved: false
      })

      // Check if this triggers a crash rate alert
      await this.checkCrashRate()
    } catch (error) {
      console.error('Error logging crash:', error)
    }
  }

  // Create an alert
  private async createAlert(alertData: Omit<AlertEvent, 'id' | 'timestamp' | 'acknowledged' | 'resolved'>): Promise<void> {
    try {
      await addDoc(collection(db, 'security_alerts'), {
        ...alertData,
        timestamp: Timestamp.now(),
        acknowledged: false,
        resolved: false
      })
    } catch (error) {
      console.error('Error creating alert:', error)
    }
  }

  // Get alert severity for role changes
  private getRoleChangeSeverity(oldRole: string, newRole: string): 'low' | 'medium' | 'high' | 'critical' {
    const adminRoles = ['admin', 'super_admin']
    const privilegedRoles = ['admin', 'super_admin', 'moderator']
    
    // Critical: Granting admin privileges
    if (!adminRoles.includes(oldRole) && adminRoles.includes(newRole)) {
      return 'critical'
    }
    
    // High: Any privilege escalation
    if (!privilegedRoles.includes(oldRole) && privilegedRoles.includes(newRole)) {
      return 'high'
    }
    
    // Medium: Privilege reduction from admin
    if (adminRoles.includes(oldRole) && !adminRoles.includes(newRole)) {
      return 'medium'
    }
    
    // Low: Other role changes
    return 'low'
  }

  // Get recent alerts
  async getRecentAlerts(limitCount: number = 50): Promise<AlertEvent[]> {
    try {
      const alertsRef = collection(db, 'security_alerts')
      const alertsQuery = query(
        alertsRef,
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      )
      
      const alertsSnapshot = await getDocs(alertsQuery)
      const alerts: AlertEvent[] = []
      
      alertsSnapshot.forEach(doc => {
        const data = doc.data()
        alerts.push({
          id: doc.id,
          type: data.type,
          severity: data.severity,
          title: data.title,
          description: data.description,
          userId: data.userId,
          userEmail: data.userEmail,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          metadata: data.metadata,
          timestamp: data.timestamp?.toDate() || new Date(),
          acknowledged: data.acknowledged || false,
          acknowledgedBy: data.acknowledgedBy,
          acknowledgedAt: data.acknowledgedAt?.toDate(),
          resolved: data.resolved || false,
          resolvedBy: data.resolvedBy,
          resolvedAt: data.resolvedAt?.toDate()
        })
      })
      
      return alerts
    } catch (error) {
      console.error('Error fetching alerts:', error)
      return []
    }
  }

  // Acknowledge an alert
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    try {
      const alertRef = doc(db, 'security_alerts', alertId)
      await updateDoc(alertRef, {
        acknowledged: true,
        acknowledgedBy,
        acknowledgedAt: Timestamp.now()
      })
    } catch (error) {
      console.error('Error acknowledging alert:', error)
    }
  }

  // Resolve an alert
  async resolveAlert(alertId: string, resolvedBy: string): Promise<void> {
    try {
      const alertRef = doc(db, 'security_alerts', alertId)
      await updateDoc(alertRef, {
        resolved: true,
        resolvedBy,
        resolvedAt: Timestamp.now()
      })
    } catch (error) {
      console.error('Error resolving alert:', error)
    }
  }

  // Get alert statistics
  async getAlertStats(): Promise<AlertStats> {
    try {
      const alertsRef = collection(db, 'security_alerts')
      const allAlertsSnapshot = await getDocs(alertsRef)
      
      const now = new Date()
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      
      let total = 0
      let unacknowledged = 0
      let critical = 0
      let high = 0
      let medium = 0
      let low = 0
      let last24HoursCount = 0
      let thisWeekCount = 0
      
      allAlertsSnapshot.forEach(doc => {
        const data = doc.data()
        const timestamp = data.timestamp?.toDate() || new Date(0)
        
        total++
        
        if (!data.acknowledged) unacknowledged++
        
        switch (data.severity) {
          case 'critical': critical++; break
          case 'high': high++; break
          case 'medium': medium++; break
          case 'low': low++; break
        }
        
        if (timestamp >= last24Hours) last24HoursCount++
        if (timestamp >= thisWeek) thisWeekCount++
      })
      
      return {
        total,
        unacknowledged,
        critical,
        high,
        medium,
        low,
        last24Hours: last24HoursCount,
        thisWeek: thisWeekCount
      }
    } catch (error) {
      console.error('Error getting alert stats:', error)
      return {
        total: 0,
        unacknowledged: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        last24Hours: 0,
        thisWeek: 0
      }
    }
  }

  // Cleanup listeners
  cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe())
    this.listeners = []
    this.alertCallbacks = []
  }

  // Start monitoring (call this on app initialization)
  startMonitoring(): void {
    // Check crash rate every 5 minutes
    const crashRateInterval = setInterval(() => {
      this.checkCrashRate()
    }, 5 * 60 * 1000)

    // Store interval for cleanup
    this.listeners.push(() => clearInterval(crashRateInterval))
  }
}

export default RealtimeAlertsService.getInstance()